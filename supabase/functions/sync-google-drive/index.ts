// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// --- JWT Helper for Google Service Account ---

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function cleanPrivateKey(pem: string): string {
  return pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function generateGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hour

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat,
  };

  const pemData = cleanPrivateKey(privateKeyPem);
  const derBuffer = base64ToArrayBuffer(pemData);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    derBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign'],
  );

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
  const jwtToken = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth error: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// --- Binary helpers ---

function uint8ArrayToBase64(uint8: Uint8Array): string {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// --- Main Deno Serve ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }
    const userId = user.id

    // Check Google Drive Secrets
    const clientEmail = Deno.env.get('GOOGLE_DRIVE_CLIENT_EMAIL')?.trim()
    const privateKey = Deno.env.get('GOOGLE_DRIVE_PRIVATE_KEY')?.trim()

    if (!clientEmail || !privateKey) {
      throw new Error(
        'Google Drive credentials are not configured in Supabase secrets. ' +
        'Please set GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY.'
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
    }
    const geminiModel = Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash'

    // Get folder ID from request body or database settings
    let folderId = ''
    try {
      const body = await req.json()
      folderId = body.folderId?.trim()
    } catch (_) {
      // Empty or invalid body
    }

    if (!folderId) {
      const { data: settingData } = await supabaseClient
        .from('system_settings')
        .select('value')
        .eq('key', 'google_drive_settings')
        .maybeSingle()

      folderId = settingData?.value?.folder_id?.trim()
    }

    if (!folderId) {
      throw new Error(
        'ID da pasta do Google Drive não configurado. Por favor, configure no painel de perfil.'
      )
    }

    console.log(`[DriveSync] Initializing sync for folder ID: ${folderId}`)

    // 1. Generate Google Drive Access Token
    const accessToken = await generateGoogleAccessToken(clientEmail, privateKey)

    // 2. Fetch PDF files in folder
    const query = `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,mimeType)&pageSize=50`

    const driveResponse = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!driveResponse.ok) {
      throw new Error(`Google Drive API error: ${await driveResponse.text()}`)
    }

    const driveData = await driveResponse.json()
    const files = driveData.files || []
    console.log(`[DriveSync] Found ${files.length} PDF files in folder.`)

    const results = []

    for (const file of files) {
      // Check if file is already processed successfully
      const { data: existingFile } = await supabaseClient
        .from('google_drive_files')
        .select('status')
        .eq('file_id', file.id)
        .maybeSingle()

      if (existingFile?.status === 'processed') {
        results.push({ file_id: file.id, name: file.name, status: 'skipped', message: 'Já processado' })
        continue
      }

      console.log(`[DriveSync] Processing file: ${file.name} (${file.id})`)

      // Mark as processing
      await supabaseClient
        .from('google_drive_files')
        .upsert({
          file_id: file.id,
          name: file.name,
          mime_type: file.mimeType,
          size: file.size ? parseInt(file.size) : null,
          status: 'processing',
          error_message: null,
          processed_at: new Date().toISOString()
        }, { onConflict: 'file_id' })

      try {
        // Download PDF
        const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!downloadResponse.ok) {
          throw new Error(`Failed to download file media: ${await downloadResponse.text()}`)
        }

        const arrayBuffer = await downloadResponse.arrayBuffer()
        const base64Data = uint8ArrayToBase64(new Uint8Array(arrayBuffer))

        // Call Gemini to parse
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`

        const prompt = `Você é a Laura, uma inteligência artificial especialista em emendas parlamentares.
Analise o PDF anexado (um documento oficial, ofício de indicação ou documento de conveniamento) e extraia informações para alimentar seu cérebro de conhecimento institucional.

Retorne um objeto JSON estritamente no seguinte formato:
{
  "extracted_notes": [
    {
      "title": "Título resumido e descritivo da nota (ex: Ofício nº 15/2026 - Deputado X)",
      "content": "Conteúdo consolidado detalhado e completo, com todos os fatos importantes do documento.",
      "note_type": "regra_operacional | decisao | resumo | nota_tecnica | outro",
      "entity_type": "proposta" or "emenda" (se houver correspondência com emenda/proposta, caso contrário null),
      "entity_id": "O número da emenda/proposta relacionada (ex: 11447284000126012), caso contrário null",
      "metadata": {
         "document_name": "Nome do documento",
         "author": "Autor ou parlamentar citado",
         "date": "Data citada no documento"
      }
    }
  ],
  "extracted_facts": [
    {
      "entity_type": "proposta" or "emenda",
      "entity_id": "O número da emenda/proposta relacionada",
      "fact_key": "Chave identificadora curta do fato (ex: numero_oficio, status_oficio, valor_oficio, data_envio)",
      "fact_value": "Valor ou informação associada a essa chave"
    }
  ]
}

Regras:
1. Retorne APENAS o JSON puro. Não use delimitadores Markdown (como \`\`\`json) na resposta.
2. Seja preciso e não invente dados.
3. Se não houver notas ou fatos extraíveis, retorne arrays vazios.`;

        const geminiBody = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        }

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiBody),
        })

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${await geminiResponse.text()}`)
        }

        const geminiData = await geminiResponse.json()
        const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (!jsonText) {
          throw new Error('Gemini API returned an empty text content.')
        }

        const parsedResult = JSON.parse(jsonText.trim())
        let noteSavedCount = 0

        // Save Extracted Notes
        if (Array.isArray(parsedResult.extracted_notes)) {
          for (const note of parsedResult.extracted_notes) {
            const { error: noteErr } = await supabaseClient
              .from('knowledge_notes')
              .insert({
                title: note.title || `Nota extraída: ${file.name}`,
                content: note.content || '',
                note_type: note.note_type || 'outro',
                source_type: 'arquivo_drive',
                source_table: 'google_drive_files',
                source_id: file.id,
                entity_type: note.entity_type,
                entity_id: note.entity_id,
                created_by: userId,
                created_by_ai: true,
                status: 'validado',
                confidence: 0.85,
                metadata: {
                  ...(note.metadata || {}),
                  file_id: file.id,
                  file_name: file.name,
                }
              })

            if (noteErr) {
              console.error(`[DriveSync] Error inserting note for ${file.name}:`, noteErr)
            } else {
              noteSavedCount++
            }
          }
        }

        // Save Extracted Facts
        if (Array.isArray(parsedResult.extracted_facts)) {
          for (const fact of parsedResult.extracted_facts) {
            if (fact.entity_type && fact.entity_id && fact.fact_key && fact.fact_value) {
              const { error: factErr } = await supabaseClient
                .from('knowledge_facts')
                .upsert({
                  entity_type: fact.entity_type,
                  entity_id: fact.entity_id,
                  fact_key: fact.fact_key,
                  fact_value: fact.fact_value,
                  source_type: 'arquivo_drive',
                  source_table: 'google_drive_files',
                  source_id: file.id,
                  status: 'validado',
                  confidence: 0.85
                }, { onConflict: 'entity_type,entity_id,fact_key' })

              if (factErr) {
                console.error(`[DriveSync] Error upserting fact for ${file.name}:`, factErr)
              }
            }
          }
        }

        // Mark file as processed
        await supabaseClient
          .from('google_drive_files')
          .update({
            status: 'processed',
            extracted_notes_count: noteSavedCount,
            error_message: null,
            processed_at: new Date().toISOString()
          })
          .eq('file_id', file.id)

        results.push({ file_id: file.id, name: file.name, status: 'processed', notes_count: noteSavedCount })
        console.log(`[DriveSync] Successfully processed ${file.name} (notes extracted: ${noteSavedCount})`)

      } catch (fileError: any) {
        console.error(`[DriveSync] Failed to process ${file.name}:`, fileError)
        
        await supabaseClient
          .from('google_drive_files')
          .update({
            status: 'failed',
            error_message: fileError.message || String(fileError),
            processed_at: new Date().toISOString()
          })
          .eq('file_id', file.id)

        results.push({ file_id: file.id, name: file.name, status: 'failed', error: fileError.message })
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[DriveSync] Fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
