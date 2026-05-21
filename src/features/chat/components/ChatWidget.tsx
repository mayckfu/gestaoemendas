import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { chatService } from '../services/chatService'

interface Message {
  id: string
  text: string
  isBot: boolean
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Ola! Eu sou a Laura, sua assistente de IA. Como posso ajudar com as emendas hoje?',
      isBot: true,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Carrega historico inicial
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await chatService.fetchHistory()
        if (history.length > 0) {
          // Keep the greeting message, then append history
          const formattedHistory: Message[] = history.map((msg, index) => ({
            id: msg.id || `history-${index}`,
            text: msg.text,
            isBot: msg.isBot
          }))
          setMessages(prev => [
            prev[0],
            ...formattedHistory
          ])
        }
      } catch (err) {
        console.error('Error loading history', err)
      }
    }
    loadHistory()
  }, [])

  // Auto-scroll para a ultima mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), text: input, isBot: false }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const responseText = await chatService.sendMessage(userMsg.text, messages)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isBot: true,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao processar sua mensagem.'
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Erro: ${message}`,
        isBot: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg p-0 flex items-center justify-center bg-primary hover:bg-primary/90 transition-all z-50"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col z-50 border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-base font-medium">Laura AI</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pr-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.isBot
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                    : 'bg-primary text-primary-foreground'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-3 border-t bg-neutral-50 dark:bg-neutral-900">
        <div className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas emendas..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
