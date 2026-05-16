import { useEffect, useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { useVisitorSession } from '@/hooks/useVisitorSession'
import { useNavigate } from 'react-router-dom'
import {
  isVisitorModeGloballyEnabled,
  logVisitorAccess,
} from '@/lib/visitor/visitorStorageManager'

export function VisitorLoginButton() {
  const { enterVisitorMode } = useVisitorSession()
  const navigate = useNavigate()
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      const enabled = await isVisitorModeGloballyEnabled()
      setIsEnabled(enabled)
    }
    checkStatus()
  }, [])

  async function handleClick() {
    setIsLoggingIn(true)
    try {
      // Tenta capturar o IP/localização e registrar no Supabase
      await logVisitorAccess()
    } catch (err) {
      console.error('Falha no log do visitante:', err)
    }
    enterVisitorMode()
    navigate('/')
    setIsLoggingIn(false)
  }

  // Enquanto está checando o status no banco, ou se estiver desativado globalmente, não exibe o botão
  if (isEnabled === null || isEnabled === false) {
    return null
  }

  return (
    <div className="mt-4 w-full animate-fade-in">
      <div className="relative flex items-center gap-2 mb-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">ou acesse sem conta</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <button
        id="visitor-login-btn"
        onClick={handleClick}
        disabled={isLoggingIn}
        type="button"
        className="
          w-full flex items-center justify-center gap-2.5
          px-4 py-3 rounded-lg border-2 border-dashed
          border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20
          text-amber-700 dark:text-amber-400
          text-sm font-medium
          transition-all duration-200
          hover:border-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/30
          hover:shadow-sm active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
        "
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            Iniciando sessão...
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            Acessar como Visitante
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-2">
        Dados temporários • Nenhuma informação real é salva
      </p>
    </div>
  )
}
