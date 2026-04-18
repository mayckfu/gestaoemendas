import { AlertTriangle, RefreshCw, LogOut, Clock } from 'lucide-react'
import { useVisitorSession } from '@/hooks/useVisitorSession'
import { useNavigate } from 'react-router-dom'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function VisitorBanner() {
  const { isVisitor, timeRemaining, exitVisitorMode, resetVisitorData } = useVisitorSession()
  const navigate = useNavigate()

  if (!isVisitor) return null

  function handleExit() {
    exitVisitorMode()
    navigate('/login')
  }

  return (
    <div
      id="visitor-banner"
      role="alert"
      aria-live="polite"
      className="
        w-full flex items-center justify-between gap-3
        px-4 py-2 z-50
        bg-amber-400 dark:bg-amber-500
        text-amber-950 dark:text-amber-950
        text-sm font-medium
        border-b border-amber-500/50
        shadow-sm
      "
    >
      {/* Left — aviso */}
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Modo Visitante Ativo — Alterações são temporárias e não afetam o banco de dados real.
        </span>
      </div>

      {/* Center — timer */}
      {timeRemaining !== null && (
        <div className="flex items-center gap-1.5 shrink-0 text-xs opacity-80">
          <Clock className="w-3.5 h-3.5" />
          <span>Expira em {formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Right — ações */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          id="visitor-reset-btn"
          type="button"
          onClick={resetVisitorData}
          title="Resetar dados para o estado inicial"
          className="
            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
            bg-amber-950/10 hover:bg-amber-950/20
            transition-colors duration-150
          "
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Resetar
        </button>

        <button
          id="visitor-exit-btn"
          type="button"
          onClick={handleExit}
          title="Sair do modo visitante"
          className="
            flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
            bg-amber-950/15 hover:bg-amber-950/25
            transition-colors duration-150
          "
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </div>
  )
}
