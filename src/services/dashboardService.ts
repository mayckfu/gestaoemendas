import { supabase } from '@/lib/supabase/client'
import { isVisitorActive } from '@/lib/visitor'

export const dashboardService = {
  /**
   * Fetches financial limits for a specific year.
   */
  async getLimits(year: string) {
    if (isVisitorActive()) {
      const mockLimits: Record<string, any> = {
        '2025': {
          limite_mac: 35000000,
          limite_pap: 20000000,
          limite_capital: 15000000,
          limite_incremento_mac: 9000000,
          limite_incremento_pap: 6000000,
        },
        '2026': {
          limite_mac: 45000000,
          limite_pap: 25000000,
          limite_capital: 18000000,
          limite_incremento_mac: 11000000,
          limite_incremento_pap: 7000000,
        },
      }
      return { data: mockLimits[year] || mockLimits['2025'], error: null }
    }

    const { data, error } = await supabase
      .from('limites_exercicio')
      .select('*')
      .eq('ano', parseInt(year))
      .maybeSingle()
    
    return { data, error }
  }
}
