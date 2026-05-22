import { supabase } from '@/lib/supabase/client'

export interface ChatHistoryMessage {
  id?: string
  text: string
  isBot: boolean
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')

  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(message)) {
    return 'A chave do Gemini nao e valida no servidor. Verifique a configuracao do segredo GEMINI_API_KEY no console do Supabase.'
  }

  if (/permission|PERMISSION_DENIED|403/i.test(message)) {
    return 'O Gemini recusou a chamada. Verifique se a chave de API e valida e tem as permissoes corretas.'
  }

  if (/not found|404|not supported|not found for API version|model/i.test(message)) {
    return 'O modelo do Gemini configurado nao foi encontrado ou nao e compativel.'
  }

  if (/quota|rate limit|429|RESOURCE_EXHAUSTED/i.test(message)) {
    return 'O limite de cota ou uso do Gemini foi atingido. Tente novamente mais tarde.'
  }

  return message || 'Erro ao processar sua mensagem.'
}

export const chatService = {
  async fetchHistory(): Promise<ChatHistoryMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching chat history:', error)
        return []
      }

      // Reverse so oldest is first
      return (data || []).reverse().map(msg => ({
        id: msg.id,
        text: msg.content,
        isBot: msg.role === 'assistant',
      }))
    } catch (error) {
      console.error('Error in fetchHistory:', error)
      return []
    }
  },

  async sendMessage(message: string, history: ChatHistoryMessage[] = []): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('laura-chat', {
        body: {
          message: message.trim(),
          history,
        },
      })

      if (error) {
        throw error
      }

      if (!data || !data.text) {
        throw new Error('Resposta vazia da assistente Laura.')
      }

      return data.text
    } catch (error: unknown) {
      console.error('Erro no chatService:', error)
      throw new Error(toFriendlyError(error))
    }
  },
}
