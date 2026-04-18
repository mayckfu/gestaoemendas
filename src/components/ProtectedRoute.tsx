import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isVisitorActive } from '@/lib/visitor/visitorStorageManager'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Permite o acesso se for visitante ativo (sandbox) ou usuário autenticado
  const isVisitor = isVisitorActive()

  if (isLoading && !isVisitor) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated && !isVisitor) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
