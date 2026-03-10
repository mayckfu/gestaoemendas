import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { User, UserRole } from '@/lib/mock-data'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  login: (
    email: string,
    password?: string,
    rememberMe?: boolean,
  ) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  session: Session | null
  checkPermission: (requiredRoles: UserRole[]) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error.message)
      }

      if (data) {
        setUser(data as User)
      }
    } catch (error: any) {
      console.error('Unexpected error fetching profile:', error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Strictly synchronous callback for onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (!currentSession) {
        setUser(null)
        setIsLoading(false)
      }
    })

    // Check active session on initial mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (!currentSession) {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Fetch profile automatically when session user is available
    if (session?.user?.id) {
      setIsLoading(true)
      fetchProfile(session.user.id)
    }
  }, [session?.user?.id, fetchProfile])

  const login = async (
    email: string,
    password?: string,
    rememberMe: boolean = false,
  ): Promise<boolean> => {
    setIsLoading(true)
    try {
      if (!password) {
        throw new Error('Senha é obrigatória')
      }

      // customStorage securely respects this flag to decide storage persistence mechanism
      localStorage.setItem('asplan_remember_me', rememberMe ? 'true' : 'false')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Login realizado',
        description: 'Bem-vindo ao sistema!',
      })
      return true
    } catch (error: any) {
      console.error('Login error:', error.message)
      toast({
        title: 'Erro de login',
        description: error.message || 'Credenciais inválidas.',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      localStorage.removeItem('asplan_remember_me')
      toast({
        title: 'Logout',
        description: 'Você saiu do sistema.',
      })
    } catch (error: any) {
      console.error('Logout error:', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
  }

  const value = {
    user,
    session,
    login,
    logout,
    isAuthenticated: !!session && !!user,
    isAdmin: user?.role === 'ADMIN',
    isLoading,
    checkPermission,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
