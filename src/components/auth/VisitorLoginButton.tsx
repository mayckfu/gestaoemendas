import { Eye } from 'lucide-react'
import { useVisitorSession } from '@/hooks/useVisitorSession'
import { useNavigate } from 'react-router-dom'

export function VisitorLoginButton() {
  const { enterVisitorMode } = useVisitorSession()
  const navigate = useNavigate()

  function handleClick() {
    enterVisitorMode()
    navigate('/')
  }

  return (
    <div className="mt-4 w-full">
      <div className="relative flex items-center gap-2 mb-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">ou acesse sem conta</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <button
        id="visitor-login-btn"
        onClick={handleClick}
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
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
        "
      >
        <Eye className="w-4 h-4" />
        Acessar como Visitante
      </button>

      <p className="text-center text-xs text-muted-foreground mt-2">
        Dados temporários • Nenhuma informação real é salva
      </p>
    </div>
  )
}
