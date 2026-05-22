// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'


interface ChatHistoryMessage {
  text: string
  isBot: boolean
}

interface RequestBody {
  message: string
  activeContext?: Record<string, unknown>
  // history from frontend is no longer strictly needed since we fetch from DB,
  // but we keep it in interface for compatibility.
  history?: ChatHistoryMessage[]
}

interface AIProvider {
  name: string
  call: (systemPrompt: string, userMessage: string) => Promise<string>
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatEmendaContext(emenda: any) {
  return [
    `Numero: ${emenda.numero_emenda || emenda.numero_proposta || 'N/A'}`,
    `Parlamentar: ${emenda.parlamentar || emenda.autor || 'N/A'}`,
    `Valor: ${formatCurrency(emenda.valor_total)}`,
    `Valor repassado: ${formatCurrency(emenda.valor_repasse)}`,
    `Situacao: ${emenda.situacao || 'N/A'}`,
    `Status interno: ${emenda.status_interno || 'N/A'}`,
    `Ano: ${emenda.ano_exercicio || 'N/A'}`,
    `Origem: ${emenda.origem || 'N/A'}`,
    `Tipo: ${emenda.tipo || 'N/A'}`,
    `Tipo recurso: ${emenda.tipo_recurso || 'N/A'}`,
    `Natureza: ${emenda.natureza || 'N/A'}`,
    `Destino: ${emenda.destino_recurso || 'N/A'}`,
    `Portaria: ${emenda.portaria || 'N/A'}`,
    `Data repasse: ${emenda.data_repasse || 'N/A'}`,
    `Situacao recurso: ${emenda.situacao_recurso || 'N/A'}`,
    `Objeto: ${emenda.objeto_emenda || 'N/A'}`,
    `Descricao: ${emenda.descricao_completa || 'N/A'}`,
    `Observacoes: ${emenda.observacoes || 'N/A'}`,
  ].join(' | ')
}

function normalizeLabel(value: string | number | null | undefined) {
  return String(value || 'Nao informado')
    .replace(/_/g, ' ')
    .toLowerCase()
}

function groupByValue(emendas: any[], key: string) {
  const grouped = new Map<string, { count: number; total: number }>()

  emendas.forEach((emenda) => {
    const label = normalizeLabel(emenda[key])
    const current = grouped.get(label) ?? { count: 0, total: 0 }

    grouped.set(label, {
      count: current.count + 1,
      total: current.total + Number(emenda.valor_total ?? 0),
    })
  })

  return [...grouped.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([label, info]) => `${label}: ${info.count} emenda(s), ${formatCurrency(info.total)}`)
    .join('\n')
}

function groupByParlamentar(emendas: any[]) {
  const grouped = new Map<string, { count: number; total: number }>()

  emendas.forEach((emenda) => {
    const label = emenda.parlamentar || emenda.autor || 'Não informado'
    const current = grouped.get(label) ?? { count: 0, total: 0 }

    grouped.set(label, {
      count: current.count + 1,
      total: current.total + Number(emenda.valor_total ?? 0),
    })
  })

  return [...grouped.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([label, info]) => `- ${label}: ${info.count} emenda(s), totalizando ${formatCurrency(info.total)}`)
    .join('\n')
}

function groupByParlamentarAndYear(emendas: any[]) {
  const grouped = new Map<string, { count: number; total: number }>()

  emendas.forEach((emenda) => {
    const parlamentar = emenda.parlamentar || emenda.autor || 'Não informado'
    const ano = emenda.ano_exercicio || 'Não informado'
    const key = `${parlamentar} (${ano})`

    const current = grouped.get(key) ?? { count: 0, total: 0 }

    grouped.set(key, {
      count: current.count + 1,
      total: current.total + Number(emenda.valor_total ?? 0),
    })
  })

  return [...grouped.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([key, info]) => `- ${key}: ${info.count} emenda(s), totalizando ${formatCurrency(info.total)}`)
    .join('\n')
}

function formatSummary(emendas: any[]) {
  const totalValue = emendas.reduce((sum, emenda) => sum + Number(emenda.valor_total ?? 0), 0)
  const transferredValue = emendas.reduce(
    (sum, emenda) => sum + Number(emenda.valor_repasse ?? 0),
    0,
  )

  return [
    `Quantidade de emendas no contexto: ${emendas.length}`,
    `Valor total no contexto: ${formatCurrency(totalValue)}`,
    `Valor ja repassado no contexto: ${formatCurrency(transferredValue)}`,
    '',
    'Por parlamentar:',
    groupByParlamentar(emendas) || 'Não informado',
    '',
    'Por parlamentar e ano:',
    groupByParlamentarAndYear(emendas) || 'Não informado',
    '',
    'Por status interno:',
    groupByValue(emendas, 'status_interno') || 'Nao informado',
    '',
    'Por situacao oficial:',
    groupByValue(emendas, 'situacao') || 'Nao informado',
    '',
    'Por ano:',
    groupByValue(emendas, 'ano_exercicio') || 'Nao informado',
    '',
    'Por tipo de recurso:',
    groupByValue(emendas, 'tipo_recurso') || 'Nao informado',
  ].join('\n')
}

function formatConversationHistory(history: ChatHistoryMessage[] = []) {
  const relevantHistory = history.slice(-10) // fetch up to 10 latest interactions

  if (!relevantHistory.length) {
    return 'Sem mensagens anteriores nesta conversa.'
  }

  return relevantHistory
    .map((item) => `${item.isBot ? 'Laura' : 'Usuario'}: ${item.text}`)
    .join('\n')
}

interface MemoryRow {
  type: string
  content: string
  importance: number
}

function getLearningNoteType(type: string) {
  if (type === 'rule') return 'regra_operacional'
  if (type === 'decision') return 'decisao'
  if (type === 'follow_up') return 'resumo'
  if (type === 'correction') return 'nota_tecnica'
  return 'outro'
}

function formatMemoriesContext(memories: MemoryRow[]) {
  if (!memories.length) return ''

  const lines = memories.map((m) => {
    const prefix = m.importance >= 4 ? '[IMPORTANTE] ' : ''
    return `- ${prefix}(${m.type}) ${m.content}`
  })

  return [
    'MEMORIAS DO USUARIO (preferencias e regras aprendidas):',
    ...lines,
    '',
  ].join('\n')
}

function formatInstitutionalContext(context: any) {
  if (!context) {
    return 'Nenhum contexto institucional retornado.'
  }

  return [
    'CONTEXTO INSTITUCIONAL DA LAURA:',
    `Fatos validados/pendentes: ${JSON.stringify(context.facts ?? [])}`,
    `Notas tecnicas: ${JSON.stringify(context.notes ?? [])}`,
    `Vinculos: ${JSON.stringify(context.links ?? [])}`,
    `Registros oficiais priorizados: ${JSON.stringify(context.official_records ?? [])}`,
    `Regras: ${JSON.stringify(context.rules ?? {})}`,
    '',
  ].join('\n')
}

interface ParsedLearnTag {
  type: string
  content: string
  reason: string
  confidence?: number
  extraction_method?: string
}

const VALID_LEARNING_TYPES = ['preference', 'rule', 'synonym', 'decision', 'follow_up', 'correction']

function normalizeLearningType(type: string | undefined) {
  const normalized = String(type || 'preference').toLowerCase().trim()
  return VALID_LEARNING_TYPES.includes(normalized) ? normalized : 'preference'
}

function parseLearnTags(text: string): { cleanText: string; suggestions: ParsedLearnTag[] } {
  const suggestions: ParsedLearnTag[] = []
  const regex = /<LEARN\s*(?:type=["']?(\w+)["']?)?\s*(?:reason=["']?([^"'>]*)["']?)?>(.*?)<\/LEARN>/gis

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    suggestions.push({
      type: normalizeLearningType(match[1]),
      reason: match[2]?.trim() || '',
      content: match[3]?.trim() || '',
      confidence: 0.7,
      extraction_method: 'inline_learn_tag',
    })
  }

  const cleanText = text.replace(/<LEARN[^>]*>.*?<\/LEARN>/gis, '').trim()
  return { cleanText, suggestions }
}

function parseLearningJson(text: string): ParsedLearnTag[] {
  const clean = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const match = clean.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        type: normalizeLearningType(item.type),
        content: String(item.content || '').trim(),
        reason: String(item.reason || '').trim(),
        confidence: Number(item.confidence ?? 0.65),
        extraction_method: 'ai_learning_extractor',
      }))
      .filter((item) => item.content.length >= 8)
  } catch (error) {
    console.error('Error parsing learning JSON:', error)
    return []
  }
}

function extractHeuristicLearnings(question: string): ParsedLearnTag[] {
  const learnings: ParsedLearnTag[] = []
  const normalized = question.trim()

  const synonymMatch = normalized.match(/\b([A-Z0-9]{2,10})\b\s+(?:ou|=|significa|quer dizer)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{4,80})/i)
  if (synonymMatch) {
    const term = synonymMatch[1].toUpperCase()
    const canonical = synonymMatch[2].replace(/[?.!,;:]+$/g, '').trim()

    learnings.push({
      type: 'synonym',
      content: `${term} significa ${canonical}. Use esse sinonimo para localizar dados oficiais relacionados quando o usuario mencionar ${term}.`,
      reason: 'Detectado padrao de sinonimo na pergunta do usuario.',
      confidence: 0.8,
      extraction_method: 'heuristic_synonym',
    })
  }

  if (/\b(sempre|prefiro|quando eu pedir|da proxima vez|lembre|memorize)\b/i.test(normalized)) {
    learnings.push({
      type: 'preference',
      content: normalized,
      reason: 'Usuario indicou preferencia ou regra de atendimento reutilizavel.',
      confidence: 0.75,
      extraction_method: 'heuristic_preference',
    })
  }

  return learnings
}

function shouldRunLearningExtractor(question: string, responseText: string, currentSuggestions: ParsedLearnTag[]) {
  if (currentSuggestions.length > 0) return false

  const signalText = `${question}\n${responseText}`
  return /\b(ou|significa|quer dizer|tambem chamado|sinonimo|corrig|na verdade|sempre|prefiro|lembre|memorize|quando eu pedir|apelido|sigla)\b/i
    .test(signalText)
}

async function extractLearningWithAI(
  providers: AIProvider[],
  question: string,
  responseText: string,
  institutionalContext: any,
): Promise<ParsedLearnTag[]> {
  const contextSample = JSON.stringify({
    facts: (institutionalContext?.facts ?? []).slice(0, 5),
    official_records: (institutionalContext?.official_records ?? []).slice(0, 3),
    notes: (institutionalContext?.notes ?? []).slice(0, 3),
  })

  const extractorPrompt = `Voce e o extrator de memoria viva da Laura.
Analise a pergunta do usuario e a resposta dada.
Retorne APENAS JSON array.

Crie aprendizado somente se for reutilizavel no futuro:
- sinonimo, sigla ou apelido usado pelo usuario;
- preferencia de formato;
- regra operacional;
- correcao feita pelo usuario;
- decisao ou acompanhamento.

Nao salve fatos oficiais de emendas como aprendizado; esses ficam em knowledge_facts.
Se nao houver aprendizado reutilizavel, retorne [].

Formato:
[
  {"type":"synonym|preference|rule|decision|follow_up|correction","content":"texto claro e curto","reason":"por que aprender","confidence":0.0}
]`

  const extractorInput = [
    `Pergunta do usuario: ${question}`,
    `Resposta da Laura: ${responseText}`,
    `Contexto institucional resumido: ${contextSample}`,
  ].join('\n\n')

  try {
    const { text } = await callWithFallback(providers, extractorPrompt, extractorInput)
    return parseLearningJson(text)
  } catch (error) {
    console.error('Learning extractor failed:', error)
    return []
  }
}

function mergeLearningSuggestions(...groups: ParsedLearnTag[][]) {
  const merged = new Map<string, ParsedLearnTag>()

  groups.flat().forEach((item) => {
    const content = item.content?.trim()
    if (!content) return

    const key = `${normalizeLearningType(item.type)}:${content.toLowerCase()}`
    const previous = merged.get(key)
    if (!previous || Number(item.confidence ?? 0) > Number(previous.confidence ?? 0)) {
      merged.set(key, {
        ...item,
        type: normalizeLearningType(item.type),
        content,
      })
    }
  })

  return [...merged.values()]
}

async function getOrCreateChatSession(supabaseClient: any, userId: string) {
  const { data: existing, error: existingError } = await supabaseClient
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    console.error('Error fetching chat session:', existingError)
  }

  if (existing?.id) return existing.id

  const { data: created, error: createError } = await supabaseClient
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: 'Conversa com Laura',
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating chat session:', createError)
    return null
  }

  return created?.id ?? null
}

async function saveChatMessage(
  supabaseClient: any,
  sessionId: string | null,
  userId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  activeContext: Record<string, unknown> = {},
  sourcesUsed: unknown[] = [],
) {
  if (!sessionId) return

  const { error } = await supabaseClient
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      active_context: activeContext,
      sources_used: sourcesUsed,
    })

  if (error) console.error('Error saving chat message:', error)
}

async function saveLearningNotes(
  supabaseClient: any,
  userId: string,
  suggestions: ParsedLearnTag[],
  question: string,
  provider: string,
  institutionalContext: any,
) {
  const officialRecord = institutionalContext?.official_records?.[0]
  const factRecord = institutionalContext?.facts?.[0]
  const entityType = officialRecord?.numero_proposta || factRecord?.entity_type ? 'proposta' : null
  const entityId = officialRecord?.numero_proposta ?? factRecord?.entity_id ?? null
  const sourceId = officialRecord?.id ?? factRecord?.source_id ?? null

  const rows = suggestions
    .filter((s) => s.content && VALID_LEARNING_TYPES.includes(s.type))
    .map((s) => ({
      title: `Aprendizado da Laura: ${s.type}`,
      content: s.content,
      note_type: getLearningNoteType(s.type),
      source_type: 'inferencia_ia',
      entity_type: entityType,
      entity_id: entityId,
      source_table: sourceId ? 'emendas' : null,
      source_id: sourceId,
      created_by: userId,
      created_by_ai: true,
      status: 'pendente_confirmacao',
      confidence: Math.min(0.95, Math.max(0.45, Number(s.confidence ?? 0.65))),
      metadata: {
        kind: 'learning',
        learning_type: s.type,
        reason: s.reason || 'Detectado automaticamente pela Laura',
        question,
        provider,
        extraction_method: s.extraction_method ?? 'unknown',
      },
    }))

  if (!rows.length) return 0

  let saved = 0

  for (const row of rows) {
    const { data: existing, error: existingError } = await supabaseClient
      .from('knowledge_notes')
      .select('id')
      .eq('created_by', userId)
      .eq('metadata->>kind', 'learning')
      .eq('metadata->>learning_type', row.metadata.learning_type)
      .eq('content', row.content)
      .limit(1)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing learning note:', existingError)
    }

    if (existing?.id) continue

    const { error } = await supabaseClient.from('knowledge_notes').insert(row)
    if (error) {
      console.error('Error saving learning note:', error)
    } else {
      saved += 1
    }
  }

  return saved
}

// --- AI Provider Implementations ---

function createGeminiProvider(): AIProvider | null {
  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
  if (!apiKey) return null

  const model = Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash'

  return {
    name: 'Gemini',
    async call(systemPrompt: string, userMessage: string): Promise<string> {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.35,
              topP: 0.9,
              maxOutputTokens: 1200,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned empty response')
      return text
    },
  }
}

function createOpenRouterProvider(): AIProvider | null {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')?.trim()
  if (!apiKey) return null

  return {
    name: 'OpenRouter',
    async call(systemPrompt: string, userMessage: string): Promise<string> {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? 'https://gestao-emendas.app',
          'X-Title': 'Laura - Gestao de Emendas',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.35,
          top_p: 0.9,
          max_tokens: 1200,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      const text = result.choices?.[0]?.message?.content
      if (!text) throw new Error('OpenRouter returned empty response')
      return text
    },
  }
}

function createGroqProvider(): AIProvider | null {
  const apiKey = Deno.env.get('GROQ_API_KEY')?.trim()
  if (!apiKey) return null

  return {
    name: 'Groq',
    async call(systemPrompt: string, userMessage: string): Promise<string> {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.35,
          top_p: 0.9,
          max_tokens: 1200,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      const text = result.choices?.[0]?.message?.content
      if (!text) throw new Error('Groq returned empty response')
      return text
    },
  }
}

async function callWithFallback(
  providers: AIProvider[],
  systemPrompt: string,
  userMessage: string,
): Promise<{ text: string; provider: string }> {
  const errors: string[] = []

  for (const provider of providers) {
    try {
      console.log(`[Laura] Trying provider: ${provider.name}`)
      const text = await provider.call(systemPrompt, userMessage)
      console.log(`[Laura] Success with provider: ${provider.name}`)
      return { text, provider: provider.name }
    } catch (error: any) {
      const msg = `${provider.name} failed: ${error.message}`
      console.warn(`[Laura] ${msg}`)
      errors.push(msg)
    }
  }

  console.error(`[Laura] All providers failed:`, errors)
  throw new Error(
    'Nao consegui acessar a IA agora. Os dados do sistema continuam disponiveis, ' +
    'mas a analise automatica esta temporariamente indisponivel. ' +
    'Tente novamente em alguns instantes.'
  )
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const requestBody = (await req.json()) as RequestBody
    const { message } = requestBody
    const activeContext = requestBody.activeContext && typeof requestBody.activeContext === 'object'
      ? requestBody.activeContext
      : {}

    if (!message) {
      throw new Error('Message is required')
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

    // Authenticate and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }
    const userId = user.id

    const sessionId = await getOrCreateChatSession(supabaseClient, userId)

    // Fetch conversation history, live learning notes, institutional context, and emendas in parallel
    const [historyResult, memoriesResult, institutionalContextResult, emendasResult] = await Promise.all([
      sessionId
        ? supabaseClient
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        : Promise.resolve({ data: [], error: null }),
      supabaseClient
        .from('knowledge_notes')
        .select('content, metadata, confidence, status, updated_at')
        .eq('created_by', userId)
        .eq('metadata->>kind', 'learning')
        .in('status', ['validado', 'pendente_confirmacao', 'rascunho'])
        .order('confidence', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(50),
      supabaseClient.rpc('laura_build_context', {
        p_question: message.trim(),
        p_active_context: activeContext,
        p_limit: 12,
      }),
      supabaseClient
        .from('emendas')
        .select(
          'numero_emenda, numero_proposta, parlamentar, autor, valor_total, valor_repasse, situacao, status_interno, ano_exercicio, origem, destino_recurso, objeto_emenda, descricao_completa, observacoes, tipo, tipo_recurso, natureza, portaria, data_repasse, situacao_recurso',
        )
        .order('ano_exercicio', { ascending: false })
        .limit(1000),
    ])

    if (historyResult.error) console.error('Error fetching history:', historyResult.error)
    if (memoriesResult.error) console.error('Error fetching learning notes:', memoriesResult.error)
    if (institutionalContextResult.error) console.error('Error fetching institutional context:', institutionalContextResult.error)
    if (emendasResult.error) console.error('Error fetching emendas:', emendasResult.error)

    const dbHistory = historyResult.data || []
    const userMemories = (memoriesResult.data || []).map((note: any) => ({
      type: note.metadata?.learning_type ?? 'memory',
      content: note.content,
      importance: note.status === 'validado' ? 5 : 3,
    })) as MemoryRow[]
    const institutionalContext = institutionalContextResult.data
    const emendas = emendasResult.data || []

    // Prepare history for prompt (oldest first)
    const recentHistory = dbHistory.reverse().map(h => ({
      text: h.content,
      isBot: h.role === 'assistant'
    }))

    await saveChatMessage(supabaseClient, sessionId, userId, 'user', message.trim(), activeContext)

    const contextData = emendas.map(formatEmendaContext)
    const dataContext = contextData.length
      ? contextData.join('\n')
      : 'Nenhuma emenda foi retornada pelo Supabase para esta sessao. Se o usuario perguntar por dados especificos, informe que nao ha dados disponiveis no momento.'
    const summaryContext = emendas.length ? formatSummary(emendas) : 'Sem resumo disponivel.'
    const conversationHistory = formatConversationHistory(recentHistory)
    const memoriesContext = formatMemoriesContext(userMemories)
    const institutionalContextText = formatInstitutionalContext(institutionalContext)

    const systemPrompt = `Voce e a Laura, uma assistente virtual especialista em gestao publica e emendas parlamentares do sistema.
Seu papel e ajudar gestores a entender prioridades, riscos, valores, status e proximas acoes das emendas.

REGRAS DE RESPOSTA:
- Responda em portugues do Brasil, com tom educado, direto e profissional.
- Use APENAS os dados do contexto abaixo para afirmar fatos sobre emendas.
- Quando o usuario pedir analise, compare valores, status, anos, parlamentares e gargalos operacionais.
- Quando houver muitas emendas, comece pelo resumo e destaque os itens mais relevantes.
- Se a pergunta depender de dado ausente, diga exatamente qual dado falta e ofereca uma alternativa com os dados disponiveis.
- Nao invente numeros, datas, portarias, nomes ou situacoes.
- Formate valores em Reais (R$).
- Para perguntas de acompanhamento, considere o historico recente da conversa.
- Quando fizer sentido, finalize com uma acao recomendada objetiva.
- RESPEITE as memorias do usuario abaixo. Elas representam preferencias, regras e decisoes previamente confirmadas.
- Use primeiro o CONTEXTO INSTITUCIONAL DA LAURA quando houver fatos, notas, vinculos ou registro oficial relacionado.
- Se houver conflito entre memoria antiga e banco oficial, o banco oficial vence.
- Historico bruto de chat nao e conhecimento validado.
- O chat e estreito: escreva respostas curtas, escaneaveis e com bastante quebra de linha.
- Nao use tabelas, pipes ("|") nem campos grudados na mesma linha.
- Para listar emendas, use no maximo 5 itens inicialmente. Se houver mais, diga quantas faltam e ofereca continuar.
- Em cada item, use linhas separadas: Numero, Parlamentar, Valor, Situacao, Objeto.
- Use negrito apenas em titulos curtos e rotulos importantes. Nao coloque negrito em todos os campos.
- Feche com uma pergunta curta de proximo passo.

APRENDIZADO AUTOMATICO:
Quando voce perceber que o usuario tem uma preferencia clara, uma regra recorrente, uma correcao importante,
um sinonimo usado pelo setor, uma decisao operacional, ou uma forma de trabalho que deve ser lembrada,
inclua no FINAL da sua resposta (apos toda a resposta normal) uma tag de aprendizado no formato:
<LEARN type="preference" reason="motivo detectado">Conteudo da preferencia</LEARN>
Use isso quando o aprendizado for reutilizavel em conversas futuras.
Nao crie LEARN para copiar fatos oficiais de emendas; fatos oficiais ja ficam no banco oficial/knowledge_facts.
O aprendizado sera salvo como memoria viva pendente de confirmacao.
Os tipos possiveis sao: preference, rule, synonym, decision, follow_up, correction.
Use isso com moderacao — apenas quando houver evidencia clara. Nao crie tags para perguntas normais.
O usuario vera a sugestao e podera aprovar ou rejeitar.

${memoriesContext}
${institutionalContextText}
RESUMO DOS DADOS DISPONIVEIS:
${summaryContext}

DADOS ATUAIS DO SISTEMA:
${dataContext}

HISTORICO RECENTE DA CONVERSA:
${conversationHistory}
`

    // Build provider chain: Gemini -> OpenRouter -> Groq
    const providers: AIProvider[] = []

    const gemini = createGeminiProvider()
    if (gemini) providers.push(gemini)

    const openRouter = createOpenRouterProvider()
    if (openRouter) providers.push(openRouter)

    const groq = createGroqProvider()
    if (groq) providers.push(groq)

    if (providers.length === 0) {
      throw new Error('Nenhum provedor de IA esta configurado. Configure pelo menos GEMINI_API_KEY nos Secrets do Supabase.')
    }

    const { text: rawResponseText, provider: usedProvider } = await callWithFallback(
      providers,
      systemPrompt,
      message.trim(),
    )

    // Parse visible LEARN tags, then run independent learning triggers.
    const { cleanText, suggestions: inlineSuggestions } = parseLearnTags(rawResponseText)
    const responseText = cleanText || rawResponseText
    const heuristicSuggestions = extractHeuristicLearnings(message.trim())
    const aiSuggestions = shouldRunLearningExtractor(message.trim(), responseText, [
      ...inlineSuggestions,
      ...heuristicSuggestions,
    ])
      ? await extractLearningWithAI(providers, message.trim(), responseText, institutionalContext)
      : []
    const suggestions = mergeLearningSuggestions(inlineSuggestions, heuristicSuggestions, aiSuggestions)

    await saveChatMessage(
      supabaseClient,
      sessionId,
      userId,
      'assistant',
      responseText,
      activeContext,
      [
        'knowledge_facts',
        'knowledge_notes',
        'knowledge_links',
        'official_database',
        'chat_messages',
      ],
    )

    const savedLearningCount = await saveLearningNotes(
      supabaseClient,
      userId,
      suggestions,
      message.trim(),
      usedProvider,
      institutionalContext,
    )

    await supabaseClient.rpc('laura_log_memory_event', {
      p_session_id: sessionId,
      p_user_question: message.trim(),
      p_ai_answer: responseText,
      p_extracted_learning: suggestions,
      p_memory_type: savedLearningCount > 0 ? 'learning_note' : null,
      p_related_entity_type: institutionalContext?.official_records?.[0]?.numero_proposta ? 'proposta' : null,
      p_related_entity_id: institutionalContext?.official_records?.[0]?.numero_proposta ?? null,
      p_should_reuse: savedLearningCount > 0,
      p_action_taken: savedLearningCount > 0 ? 'created_note' : 'none',
      p_sources_consulted: [
        'knowledge_facts',
        'knowledge_notes',
        'knowledge_links',
        'official_database',
        'chat_messages',
      ],
      p_confidence: savedLearningCount > 0 ? 0.65 : null,
    })

    return new Response(JSON.stringify({ text: responseText, provider: usedProvider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in laura-chat function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
