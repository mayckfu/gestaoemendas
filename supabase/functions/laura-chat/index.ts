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
  const relevantHistory = history.slice(-8)

  if (!relevantHistory.length) {
    return 'Sem mensagens anteriores nesta conversa.'
  }

  return relevantHistory
    .map((item) => `${item.isBot ? 'Laura' : 'Usuario'}: ${item.text}`)
    .join('\n')
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

    const { message, history = [] } = (await req.json()) as RequestBody

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

    const { data: emendas, error: emendasError } = await supabaseClient
      .from('emendas')
      .select(
        'numero_emenda, numero_proposta, parlamentar, autor, valor_total, valor_repasse, situacao, status_interno, ano_exercicio, origem, destino_recurso, objeto_emenda, descricao_completa, observacoes, tipo, tipo_recurso, natureza, portaria, data_repasse, situacao_recurso',
      )
      .order('ano_exercicio', { ascending: false })
      .limit(1000)

    if (emendasError) {
      console.error('Error fetching emendas:', emendasError)
    }

    const contextData = emendas?.map(formatEmendaContext) ?? []
    const dataContext = contextData.length
      ? contextData.join('\n')
      : 'Nenhuma emenda foi retornada pelo Supabase para esta sessao. Se o usuario perguntar por dados especificos, informe que nao ha dados disponiveis no momento.'
    const summaryContext = emendas?.length ? formatSummary(emendas) : 'Sem resumo disponivel.'
    const conversationHistory = formatConversationHistory(history)

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

RESUMO DOS DADOS DISPONIVEIS:
${summaryContext}

DADOS ATUAIS DO SISTEMA:
${dataContext}

HISTORICO RECENTE DA CONVERSA:
${conversationHistory}
`

    // Build provider chain: Gemini → OpenRouter → Groq
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

    const { text: responseText, provider: usedProvider } = await callWithFallback(
      providers,
      systemPrompt,
      message.trim(),
    )

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
