import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
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

function renderInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

function MessageText({ text }: { text: string }) {
  const normalizedText = text
    .replace(/\s+\|\s+/g, '\n')
    .replace(/\*\*(Número|Parlamentar|Valor|Situação|Status interno|Tipo recurso|Objeto):\*\*/g, '$1:')

  return (
    <div className="space-y-2">
      {normalizedText.split(/\n{2,}/).map((block, blockIndex) => {
        const lines = block.split('\n').filter(Boolean)

        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-4">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInlineText(line.replace(/^\s*[-*]\s+/, ''))}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={blockIndex} className="space-y-1">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="block">
                {renderInlineText(line.replace(/^\s*[-*]\s+/, ''))}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function LauraIcon({
  className = '',
  variant = 'default',
  showBackground = true,
}: {
  className?: string
  variant?: 'default' | 'inverse'
  showBackground?: boolean
}) {
  const colors = !showBackground
    ? {
      bg: 'transparent',
      symbol: '#0F4EA8',
      lens: '#10204A',
      accent: '#25F4E5',
    }
    : variant === 'inverse'
    ? {
      bg: '#FFFFFF',
      symbol: '#0F4EA8',
      lens: '#10204A',
      accent: '#25F4E5',
    }
    : {
      bg: '#0F4EA8',
      symbol: '#FFFFFF',
      lens: '#10204A',
      accent: '#25F4E5',
    }

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showBackground && <circle cx="32" cy="32" r="32" fill={colors.bg} />}
      <g transform="translate(32 32) scale(1.24) translate(-32 -32)">
        <path
          d="M16.2 28.1C20 20.9 25.5 17.4 32.8 17.4c7.1 0 12.4 3.5 16 10.7-3.7 7.2-9.1 10.8-16.2 10.8-7.3 0-12.7-3.6-16.4-10.8Z"
          fill={colors.symbol}
        />
        <rect x="24.3" y="24.2" width="17.5" height="7.8" rx="3.9" fill={colors.lens} />
        <circle cx="28.6" cy="28.1" r="1.9" fill={colors.accent} />
        <circle cx="37.5" cy="28.1" r="1.9" fill={colors.accent} />
        <path
          d="M23.5 38.3 18.9 43l5.1 6.3h11.6c2.7 0 4.1 1.9 3.3 4.2l-.7 2.2 6-5.5c2.8-2.7 2-7.6-1.5-9.5l-8-4.1a20 20 0 0 1-11.2 1.7Z"
          fill={colors.symbol}
        />
        <circle cx="28" cy="44.8" r="1.8" fill={colors.lens} />
        <circle cx="32.8" cy="44.8" r="1.8" fill={colors.lens} />
        <circle cx="37.6" cy="44.8" r="1.8" fill={colors.lens} />
      </g>
    </svg>
  )
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
        aria-label="Abrir chat da Laura"
        className="fixed bottom-6 right-6 h-[76px] w-[172px] rounded-full bg-primary px-4 py-2 shadow-xl transition-all hover:bg-primary/95 hover:scale-[1.03] z-50"
      >
        <span className="flex w-full items-center gap-3">
          <LauraIcon className="h-[56px] w-[56px] shrink-0" variant="inverse" />
          <span className="flex min-w-0 flex-col items-start leading-tight text-primary-foreground">
            <span className="text-base font-semibold">Laura</span>
            <span className="text-xs opacity-90">Abrir chat</span>
          </span>
        </span>
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col z-50 border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <LauraIcon className="h-10 w-10" variant="inverse" />
          <CardTitle className="text-base font-medium">Laura</CardTitle>
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
              className={`flex items-end gap-2 ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              {msg.isBot && (
                <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center">
                  <LauraIcon className="h-9 w-9" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.isBot
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                    : 'bg-primary text-primary-foreground'
                  }`}
              >
                <MessageText text={msg.text} />
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
