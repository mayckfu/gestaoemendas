import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

interface YearContextType {
  selectedYear: string
  setSelectedYear: (year: string) => void
  availableYears: string[]
  isLoadingYears: boolean
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isAuthenticated } = useAuth()
  const [selectedYear, setSelectedYearState] = useState(() => {
    return (
      localStorage.getItem('app_selected_year') ||
      localStorage.getItem('asplan_dashboard_year') ||
      new Date().getFullYear().toString()
    )
  })
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [isLoadingYears, setIsLoadingYears] = useState(true)

  const setSelectedYear = (year: string) => {
    localStorage.setItem('app_selected_year', year)
    localStorage.setItem('asplan_dashboard_year', year)
    setSelectedYearState(year)
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchYears = async () => {
      setIsLoadingYears(true)
      const { data, error } = await supabase
        .from('configuracoes_anos' as any)
        .select('*')
        .order('ano', { ascending: true })

      let allowedStrings: string[] = []

      if (error || !data || data.length === 0) {
        const currentYear = new Date().getFullYear()
        allowedStrings = [currentYear.toString(), (currentYear + 1).toString()]
      } else {
        let allowed: number[] = []
        if (isAdmin) {
          allowed = data.map((d: any) => d.ano)
        } else {
          allowed = data
            .filter((d: any) => d.liberado_geral)
            .map((d: any) => d.ano)
        }

        if (allowed.length === 0) {
          allowed = [new Date().getFullYear()]
        }

        allowedStrings = allowed
          .map(String)
          .sort((a, b) => Number(a) - Number(b))
      }

      setAvailableYears(allowedStrings)

      setSelectedYearState((currentSelected) => {
        if (!allowedStrings.includes(currentSelected)) {
          const highest = allowedStrings[allowedStrings.length - 1]
          localStorage.setItem('app_selected_year', highest)
          localStorage.setItem('asplan_dashboard_year', highest)
          return highest
        }
        return currentSelected
      })

      setIsLoadingYears(false)
    }

    fetchYears()
  }, [isAdmin, isAuthenticated])

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        isLoadingYears,
      }}
    >
      {children}
    </YearContext.Provider>
  )
}

export const useYear = () => {
  const context = useContext(YearContext)
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider')
  }
  return context
}
