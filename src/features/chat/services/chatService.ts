import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type EmendaRow = Pick<
  Database['public']['Tables']['emendas']['Row'],
  | 'ano_exercicio'
  | 'autor'
  | 'data_repasse'
  | 'descricao_completa'
  | 'destino_recurso'
  | 'natureza'
  | 'numero_emenda'
  | 'numero_proposta'
  | 'observacoes'
  | 'objeto_emenda'
  | 'origem'
  | 'parlamentar'
  | 'portaria'
  | 'situacao'
  | 'situacao_recurso'
  | 'status_interno'
  | 'tipo'
  | 'tipo_recurso'
  | 'valor_repasse'
  | 'valor_total'
>

export interface ChatHistoryMessage {
  text: string
  isBot: boolean
}

// Em producao, o ideal e mover esta chamada para uma Supabase Edge Function
// para nao expor a chave da IA no bundle do navegador.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
const geminiModel = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatEmendaContext(emenda: EmendaRow) {
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

function groupByValue(emendas: EmendaRow[], key: keyof EmendaRow) {
  const grouped = new Map<string, { count: number; total: number }>()

  emendas.forEach((emenda) => {
    const label = normalizeLabel(emenda[key] as string | number | null | undefined)
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

function formatSummary(emendas: EmendaRow[]) {
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

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')

  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(message)) {
    return 'A chave do Gemini nao e valida. Gere uma nova chave no Google AI Studio e confira se ela foi colocada em VITE_GEMINI_API_KEY.'
  }

  if (/permission|PERMISSION_DENIED|403/i.test(message)) {
    return 'O Gemini recusou a chamada. Verifique se a API Gemini/Generative Language esta habilitada para essa chave e se as restricoes da chave permitem este dominio.'
  }

  if (/not found|404|not supported|not found for API version|model/i.test(message)) {
    return `O modelo Gemini "${geminiModel}" nao esta disponivel para essa chave/API. Ajuste VITE_GEMINI_MODEL ou use um modelo habilitado no Google AI Studio.`
  }

  if (/quota|rate limit|429|RESOURCE_EXHAUSTED/i.test(message)) {
    return 'A cota ou limite de uso do Gemini foi atingido. Confira limite, billing e rate limit da chave.'
  }

  if (/Failed to fetch|NetworkError|CORS|fetch/i.test(message)) {
    return 'Nao foi possivel conectar ao Gemini pelo navegador. Verifique internet, bloqueio de rede, CORS/restricao de dominio da chave ou mova a chamada para uma Edge Function.'
  }

  return message || 'Erro ao processar sua mensagem.'
}

export const chatService = {
  async sendMessage(message: string, history: ChatHistoryMessage[] = []) {
    if (!genAI) {
      throw new Error(
        'Chave da API do Gemini nao configurada. Crie VITE_GEMINI_API_KEY no .env.local e reinicie o servidor Vite.',
      )
    }

    try {
      const { data: emendas, error } = await supabase
        .from('emendas')
        .select(
          'numero_emenda, numero_proposta, parlamentar, autor, valor_total, valor_repasse, situacao, status_interno, ano_exercicio, origem, destino_recurso, objeto_emenda, descricao_completa, observacoes, tipo, tipo_recurso, natureza, portaria, data_repasse, situacao_recurso',
        )
        .order('ano_exercicio', { ascending: false })
        .limit(120)
        .returns<EmendaRow[]>()

      if (error) {
        console.error('Erro ao buscar dados do Supabase:', error)
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

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 1200,
        },
      })

      const result = await model.generateContent(message.trim())
      const response = await result.response
      return response.text()
    } catch (error: unknown) {
      console.error('Erro no chatService:', error)
      throw new Error(toFriendlyError(error))
    }
  },
}
