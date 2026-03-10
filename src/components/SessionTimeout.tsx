import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSession } from '@/contexts/SessionContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Timer, AlertTriangle } from 'lucide-react'

export const SessionTimeout = () => {
  const { logout } = useAuth()
  const { timeLeft, isWarning, resetTimer } = useSession()

  const handleLogout = useCallback(async () => {
    await logout()
    window.location.href = '/login'
  }, [logout])

  const handleRenewSession = () => {
    resetTimer()
  }

  // Format countdown minutes:seconds
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (!isWarning) return null

  return (
    <Dialog
      open={isWarning}
      onOpenChange={(open) => {
        // Prevent closing by clicking outside or escape, enforce action
        if (!open && timeLeft > 0) return
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle className="text-xl">
              Sessão Prestes a Expirar
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-neutral-600">
            Sua sessão irá expirar em{' '}
            <span className="font-bold text-amber-700">
              {formatTime(timeLeft)}
            </span>{' '}
            devido à inatividade.
            <br />
            Para manter sua conta segura, você será desconectado
            automaticamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="sm:w-auto w-full"
          >
            Sair Agora
          </Button>
          <Button
            onClick={handleRenewSession}
            className="sm:w-auto w-full gap-2 font-semibold"
          >
            <Timer className="h-4 w-4" />
            Renovar Sessão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
