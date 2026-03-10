import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { YearProvider } from '@/contexts/YearContext'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import EmendasListPage from './pages/emendas/EmendasListPage'
import EmendaDetailPage from './pages/emendas/EmendaDetailPage'
import RelatoriosPage from './pages/RelatoriosPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import PropostasMacPage from './pages/propostas/PropostasMacPage'
import PropostasPapPage from './pages/propostas/PropostasPapPage'
import QuadroEstadualPage from './pages/QuadroEstadualPage'
import PreLancamentoPage from './pages/PreLancamentoPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
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
