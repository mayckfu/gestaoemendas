import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { YearProvider } from '@/contexts/YearContext'
import Index from './features/dashboard/pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/layout/Layout'
import EmendasListPage from './features/emendas/pages/EmendasListPage'
import EmendaDetailPage from './features/emendas/pages/EmendaDetailPage'
import RelatoriosPage from './features/relatorios/pages/RelatoriosPage'
import AdminPage from './features/admin/pages/AdminPage'
import ProfilePage from './features/admin/pages/ProfilePage'
import PropostasMacPage from './features/propostas/pages/PropostasMacPage'
import PropostasPapPage from './features/propostas/pages/PropostasPapPage'
import QuadroEstadualPage from './features/emendas/pages/QuadroEstadualPage'
import PreLancamentoPage from './features/pre-lancamento/pages/PreLancamentoPage'
import LoginPage from './features/auth/pages/LoginPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <TooltipProvider>
        <PrivacyProvider>
          <AuthProvider>
            <YearProvider>
              <SessionProvider>
                <NotificationProvider>
                  <Toaster />
                  <Sonner />
                  <SpeedInsights />
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />
                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />
                    <Route
                      element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/" element={<Index />} />
                      <Route path="/emendas" element={<EmendasListPage />} />
                      <Route
                        path="/emenda/:id"
                        element={<EmendaDetailPage />}
                      />
                      <Route
                        path="/quadro-estadual"
                        element={<QuadroEstadualPage />}
                      />
                      <Route path="/relatorios" element={<RelatoriosPage />} />
                      <Route
                        path="/pre-lancamento"
                        element={<PreLancamentoPage />}
                      />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/perfil" element={<ProfilePage />} />
                      <Route
                        path="/propostas/mac"
                        element={<PropostasMacPage />}
                      />
                      <Route
                        path="/propostas/pap"
                        element={<PropostasPapPage />}
                      />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </NotificationProvider>
              </SessionProvider>
            </YearProvider>
          </AuthProvider>
        </PrivacyProvider>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
