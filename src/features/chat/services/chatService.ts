import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type EmendaRow = Pick<
  Database['public']['Tables']['emendas']['Row'],
  | 'ano_exercicio'
  | 'autor'
  | 'destino_recurso'
  | 'numero_emenda'
  | 'numero_proposta'
  | 'objeto_emenda'
  | 'origem'
  | 'parlamentar'
  | 'situacao'
  | 'status_interno'
  | 'valor_total'
>

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
    `Situacao: ${emenda.situacao || 'N/A'}`,
    `Status interno: ${emenda.status_interno || 'N/A'}`,
    `Ano: ${emenda.ano_exercicio || 'N/A'}`,
    `Origem: ${emenda.origem || 'N/A'}`,
    `Destino: ${emenda.destino_recurso || 'N/A'}`,
    `Objeto: ${emenda.objeto_emenda || 'N/A'}`,
  ].join(' | ')
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
  async sendMessage(message: string) {
    if (!genAI) {
      throw new Error(
        'Chave da API do Gemini nao configurada. Crie VITE_GEMINI_API_KEY no .env.local e reinicie o servidor Vite.',
      )
    }

    try {
      const { data: emendas, error } = await supabase
        .from('emendas')
        .select(
          'numero_emenda, numero_proposta, parlamentar, autor, valor_total, situacao, status_interno, ano_exercicio, origem, destino_recurso, objeto_emenda',
        )
        .limit(50)
        .returns<EmendaRow[]>()

      if (error) {
        console.error('Erro ao buscar dados do Supabase:', error)
      }

      const contextData = emendas?.map(formatEmendaContext) ?? []
      const dataContext = contextData.length
        ? contextData.join('\n')
        : 'Nenhuma emenda foi retornada pelo Supabase para esta sessao. Se o usuario perguntar por dados especificos, informe que nao ha dados disponiveis no momento.'

      const systemPrompt = `Voce e a Laura, uma assistente virtual especialista em gestao publica e emendas parlamentares do sistema.
Seu objetivo e ajudar o gestor respondendo perguntas com base APENAS nos dados fornecidos abaixo.
Se a resposta nao estiver nos dados, diga que nao tem essa informacao no momento.
Seja educada, direta e profissional. Formate os valores em Reais (R$).

DADOS ATUAIS DO SISTEMA:
${dataContext}
`

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        systemInstruction: systemPrompt,
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
