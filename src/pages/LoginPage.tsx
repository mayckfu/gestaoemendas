import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  Activity,
  Search,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

const STORAGE_EMAIL_KEY = 'asplan_saved_email'

const LoginPage = () => {
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const { isValid } = form.formState

  // Check for saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_EMAIL_KEY)
    if (savedEmail) {
      form.setValue('email', savedEmail, { shouldValidate: true })
      form.setValue('rememberMe', true, { shouldValidate: true })
    }
  }, [form])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    // Handle "Remember Me" persistence for the email address UI
    if (data.rememberMe) {
      localStorage.setItem(STORAGE_EMAIL_KEY, data.email)
    } else {
      localStorage.removeItem(STORAGE_EMAIL_KEY)
    }

    const success = await login(data.email, data.password, data.rememberMe)

    if (!success) {
      // Log failed attempt
      try {
        await supabase.rpc('log_security_notification', {
          p_type: 'LOGIN_FAILED',
          p_message: `Tentativa de login falha para o email: ${data.email}`,
          p_severity: 'WARNING',
          p_user_id: null,
        })
      } catch (err) {
        console.error('Failed to log security notification', err)
      }
      setIsLoading(false)
    }
    // If success, the AuthContext and onAuthStateChange will trigger isAuthenticated -> navigate
  }

  // Show a secure visual state while verifying the background session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,94,162,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="p-4 bg-asplan-primary/10 rounded-full border border-asplan-primary/20">
            <Loader2 className="h-8 w-8 animate-spin text-asplan-primary" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Ambiente Seguro
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              Verificando sessão e credenciais...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-background relative overflow-hidden">
      {/* Global Continuous Background Texture */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,94,162,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Visual Bridge crossing the split */}
      <div className="hidden lg:flex absolute left-1/2 top-1/3 -translate-x-1/2 z-30 items-center justify-center pointer-events-none opacity-80 mix-blend-overlay">
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-white/40"></div>
        <div className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm shadow-lg">
          <div className="w-2 h-2 rounded-full bg-asplan-primary shadow-[0_0_10px_rgba(0,94,162,0.8)]"></div>
        </div>
        <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-asplan-primary/30 dark:to-white/20"></div>
      </div>

      <div className="hidden lg:flex absolute left-1/2 top-2/3 -translate-x-1/2 z-30 items-center justify-center pointer-events-none opacity-50 mix-blend-overlay">
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/30"></div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-asplan-action/80 shadow-[0_0_8px_rgba(0,149,218,0.6)]"></div>
        </div>
        <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-asplan-primary/20 dark:to-white/10"></div>
      </div>

      {/* Left Panel - Branding (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gov-gradient p-12 text-white relative z-10 overflow-hidden shadow-2xl">
        {/* Radial Pattern Overlay & Gradients specific to left panel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-sm font-semibold mb-10 backdrop-blur-md shadow-sm">
            <ShieldCheck className="h-4 w-4 text-brand-200" />
            <span className="text-white">Plataforma Oficial de Gestão</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-4 leading-tight max-w-xl text-white drop-shadow-md">
            Inteligência na gestão de emendas.
          </h1>
          <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
            Centralize informações, controle limites anuais e acompanhe
            propostas em tempo real.
          </p>

          {/* Feature Cards - Glassmorphism */}
          <div className="mt-12 space-y-4 max-w-lg">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:bg-white/15 hover:translate-x-1">
              <div className="p-3 bg-asplan-primary/40 rounded-xl shadow-inner border border-white/10">
                <Search className="h-6 w-6 text-brand-100" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Transparência
                </h4>
                <p className="text-white/80 mt-1 leading-relaxed text-sm">
                  Total visibilidade na aplicação dos recursos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:bg-white/15 hover:translate-x-1">
              <div className="p-3 bg-asplan-primary/40 rounded-xl shadow-inner border border-white/10">
                <Calendar className="h-6 w-6 text-brand-100" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Controle de Prazos
                </h4>
                <p className="text-white/80 mt-1 leading-relaxed text-sm">
                  Gestão eficiente de calendários e limites.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:bg-white/15 hover:translate-x-1">
              <div className="p-3 bg-asplan-primary/40 rounded-xl shadow-inner border border-white/10">
                <Shield className="h-6 w-6 text-brand-100" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Segurança de Dados
                </h4>
                <p className="text-white/80 mt-1 leading-relaxed text-sm">
                  Auditoria completa e proteção institucional.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-white/80 mt-12">
          <div className="flex gap-3 items-center opacity-90">
            <Shield className="h-5 w-5" />
            <Eye className="h-5 w-5" />
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-widest uppercase text-xs text-brand-100">
            Segurança & Auditoria
          </span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Gradient Transition from center divider */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[500px] bg-[radial-gradient(ellipse_at_left_center,rgba(0,94,162,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_left_center,rgba(0,94,162,0.20),transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 animate-fade-in-up relative z-20">
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
              Acesse sua conta
            </h2>
            <p className="text-base text-muted-foreground font-medium mt-2">
              Informe suas credenciais institucionais para continuar.
            </p>
          </div>

          <div className="bg-card/40 dark:bg-card/30 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-float border border-white/20 dark:border-white/10 relative overflow-hidden">
            {/* Inner subtle glow for glassmorphism */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />

            <div className="relative z-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                  autoComplete="off"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">
                          E-mail funcional
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-asplan-primary transition-colors" />
                            <Input
                              placeholder="usuario@institucional.gov.br"
                              className="pl-10 h-11 bg-background/50 focus-visible:ring-asplan-primary focus-visible:border-asplan-primary transition-all"
                              {...field}
                              autoComplete="email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-foreground font-semibold">
                            Senha
                          </FormLabel>
                          <Link
                            to="/forgot-password"
                            className="text-sm font-semibold text-asplan-action hover:text-asplan-primary transition-colors"
                          >
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-asplan-primary transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-11 bg-background/50 focus-visible:ring-asplan-primary focus-visible:border-asplan-primary transition-all"
                              {...field}
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-muted-foreground hover:text-asplan-primary focus:outline-none transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? 'Ocultar senha'
                                  : 'Mostrar senha'}
                              </span>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-asplan-primary data-[state=checked]:border-asplan-primary border-input"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Lembrar usuário
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-bold transition-all duration-200 mt-6 shadow-md hover:shadow-lg bg-asplan-primary hover:bg-asplan-deep text-white disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isLoading || !isValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Acessar Painel
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-muted-foreground space-y-1.5 border-t border-border/50">
            <p className="font-semibold uppercase tracking-wider text-[10px]">
              Sistema Interno
            </p>
            <p className="opacity-80">
              Versão 1.0.0 &bull; Ambiente de Produção Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
