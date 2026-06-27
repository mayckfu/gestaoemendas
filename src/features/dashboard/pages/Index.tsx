import { useMemo, useEffect, useState, useCallback } from 'react'
import { parseISO, getMonth, format } from 'date-fns'
import { Banknote, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { DetailedAmendment, Amendment } from '@/lib/mock-data'
import { PendingItemsSidebar } from '@/features/dashboard/components/PendingItemsSidebar'
import { FinancialSummary } from '@/features/dashboard/components/FinancialSummary'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PeriodSelector } from '@/components/PeriodSelector'
import { KPICards } from '@/components/KPICards'
import { MonthlyFinancialChart } from '@/features/dashboard/components/MonthlyFinancialChart'
import { ParliamentaryDistributionChart } from '@/features/dashboard/components/ParliamentaryDistributionChart'
import { OfficialLimitCard } from '@/features/dashboard/components/OfficialLimitCard'
import { useToast } from '@/components/ui/use-toast'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useYear } from '@/contexts/YearContext'
import { isVisitorActive } from '@/lib/visitor'
import { amendmentService } from '@/services/amendmentService'
import { dashboardService } from '@/services/dashboardService'
import {
  getPaidAmountForAmendment,
  isExecutedExpense,
} from '@/lib/financial-calculations'
import { calculateParliamentaryDistribution } from '@/lib/parliamentary-distribution'
import { calculateResourceTotals } from '@/lib/resource-classification'

const Index = () => {
  const { toast } = useToast()
  const { session, isAuthenticated, isAdmin } = useAuth()
  const { selectedYear, setSelectedYear } = useYear()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [detailedAmendments, setDetailedAmendments] = useState<DetailedAmendment[]>([])
  const [limitData, setLimitData] = useState<any>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedMonth = searchParams.get('month') || 'all'

  const setSelectedMonth = (month: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (month === 'all') {
      newParams.delete('month')
    } else {
      newParams.set('month', month)
    }
    setSearchParams(newParams, { replace: true })
  }

  const fetchData = useCallback(
    async (forceLoading = false) => {
      // ─── Guard check for online mode ────────────────────────────────
      if (!isVisitorActive() && (!session && !isAuthenticated)) return

      if (forceLoading) setIsLoading(true)
      else setIsRefetching(true)

      setError(null)

      try {
        const [detailedRes, limitRes] = await Promise.all([
          amendmentService.getDetailedAmendments(selectedYear),
          dashboardService.getLimits(selectedYear || new Date().getFullYear().toString())
        ])

        if (detailedRes.error) throw detailedRes.error

        const detailedData = detailedRes.data || []
        setDetailedAmendments(detailedData)
        // Set amendments state from the detailed data to maintain sync
        setAmendments(detailedData)
        setLimitData(limitRes.data || null)
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Erro ao carregar dados do dashboard')
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível carregar os dados. Verifique sua conexão.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
        setIsRefetching(false)
      }
    },
    [selectedYear, session, isAuthenticated, toast]
  )

  useEffect(() => {
    // Modo visitante: carrega dados imediatamente
    if (isVisitorActive()) {
      fetchData(true)
      return
    }

    // Usuário real: aguarda autenticação
    if (isAuthenticated) {
      fetchData(true)

      const channel = supabase
        .channel('dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emendas' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'repasses' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'despesas' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'limites_exercicio' }, () => fetchData())
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchData, isAuthenticated])

  const { periodFilteredData } = useMemo(() => {
    const month = selectedMonth === 'all' ? null : parseInt(selectedMonth)

    const filterByMonth = (dateString: string) => {
      if (!dateString) return false
      const date = parseISO(dateString)
      if (month !== null) {
        return getMonth(date) + 1 === month
      }
      return true
    }

    const periodFilteredAmendments = amendments.filter((a) =>
      month === null ? true : filterByMonth(a.created_at),
    )
    const allRepasses = detailedAmendments.flatMap((a) =>
      a.repasses.map((r) => ({ ...r, emenda_id: a.id }))
    )
    const allDespesas = detailedAmendments.flatMap((a) =>
      a.despesas.map((d) => ({ ...d, emenda_id: a.id }))
    )

    const periodFilteredRepasses = allRepasses.filter((r) =>
      filterByMonth(r.data),
    )
    const periodFilteredDespesas = allDespesas.filter((d) =>
      filterByMonth(d.data),
    )

    return {
      periodFilteredData: {
        amendments: periodFilteredAmendments,
        repasses: periodFilteredRepasses,
        despesas: periodFilteredDespesas,
        detailedAmendments: detailedAmendments,
      },
    }
  }, [amendments, detailedAmendments, selectedMonth])

  const consumedTotals = useMemo(() => {
    return calculateResourceTotals(detailedAmendments)
  }, [detailedAmendments])

  const dashboardData = useMemo(() => {
    const {
      amendments: fAmendments,
      repasses: fRepasses,
      despesas: fDespesas,
    } = periodFilteredData

    const totalValor = fAmendments.reduce((sum, a) => sum + a.valor_total, 0)
    const totalGasto = fAmendments.reduce(
      (sum, amendment) =>
        sum +
        getPaidAmountForAmendment(
          amendment,
          fDespesas.filter((despesa) => despesa.emenda_id === amendment.id),
        ),
      0,
    )
    const gastoPorResponsavelData = calculateParliamentaryDistribution(fAmendments)
    const activeLegislators = gastoPorResponsavelData.length

    const monthlyData = [...fRepasses, ...fDespesas].reduce(
      (acc, item) => {
        const date = parseISO(item.data)
        const monthStr = format(date, 'yyyy-MM')
        if (!acc[monthStr])
          acc[monthStr] = { month: monthStr, repasses: 0, despesas: 0 }
        if ('fonte' in item) {
          if (item.status === 'REPASSADO') acc[monthStr].repasses += item.valor
        } else if (isExecutedExpense(item)) {
          acc[monthStr].despesas += item.valor
        }
        return acc
      },
      {} as Record<
        string,
        { month: string; repasses: number; despesas: number }
      >,
    )
    const lineChartData = Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month),
    )

    return {
      kpiValues: {
        totalValue: totalValor,
        executedValue: totalGasto,
        activeLegislators,
      },
      gastoPorResponsavelData,
      lineChartData,
      allDetailedAmendments: periodFilteredData.detailedAmendments,
    }
  }, [periodFilteredData])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Carregando painel...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-6 p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Erro ao carregar dados
          </h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
        <Button onClick={() => fetchData(true)} size="lg" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  const periodKey = `${selectedYear}-${selectedMonth}`

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start pb-8">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-asplan-deep flex items-center gap-3">
              Painel Analítico das Emendas Parlamentares — Exercício{' '}
              {selectedYear === 'all' ? 'Todos' : selectedYear}
              {isRefetching && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhamento financeiro da Secretaria de Saúde
            </p>
          </div>
          <PeriodSelector
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </div>

        <OfficialLimitCard
          year={selectedYear}
          limitData={limitData}
          consumed={consumedTotals}
          isAdmin={isAdmin}
          onUpdate={() => fetchData(true)}
        />

        <KPICards
          totalValue={dashboardData.kpiValues.totalValue}
          executedValue={dashboardData.kpiValues.executedValue}
          activeLegislators={dashboardData.kpiValues.activeLegislators}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-semibold text-asplan-deep flex items-center gap-2 animate-fade-in"
            >
              <Banknote className="h-5 w-5" />
              Resumo Financeiro
            </h2>
          </div>
          <FinancialSummary
            amendments={periodFilteredData.amendments}
            despesas={periodFilteredData.despesas}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <MonthlyFinancialChart
            data={dashboardData.lineChartData}
            periodKey={periodKey}
          />

          <ParliamentaryDistributionChart
            data={dashboardData.gastoPorResponsavelData}
            periodKey={periodKey}
          />
        </div>
      </div>
      {/* Sidebar */}
      <div className="hidden lg:block sticky top-24">
        <PendingItemsSidebar amendments={dashboardData.allDetailedAmendments} />
      </div>
    </div>
  )
}

export default Index
