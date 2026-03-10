import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyBRL, formatPercent } from '@/lib/utils'
import { TrendingUp, Users, Wallet, ArrowUpRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface KPICardsProps {
  totalValue: number
  executedValue: number
  activeLegislators: number
}

export function KPICards({
  totalValue,
  executedValue,
  activeLegislators,
}: KPICardsProps) {
  const { isPrivacyMode } = usePrivacy()
  const executionPercentage =
    totalValue > 0 ? (executedValue / totalValue) * 100 : 0

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Main Gov Gradient Card */}
      <Card
        className="overflow-hidden border-none shadow-float bg-gov-gradient text-white animate-fade-in-up"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="h-32 w-32 text-white" />
          </div>
          <div className="flex flex-col gap-4 relative z-10 h-full justify-between">
            <div>
              <p className="text-sm font-medium text-brand-100 uppercase tracking-wider flex items-center gap-2">
                Saldo Total
                <ArrowUpRight className="h-4 w-4" />
              </p>
              <h2 className="text-4xl font-extrabold tabular-nums mt-2 tracking-tighter">
                {formatCurrencyBRL(totalValue, isPrivacyMode)}
              </h2>
            </div>
            <p className="text-xs text-brand-100/80 mt-1 font-medium">
              Montante global previsto no período fiscal atual
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Executed Value Card */}
      <Card
        className="overflow-hidden glass-card animate-fade-in-up opacity-0"
        style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex justify-between items-center pr-8 mb-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                Executado
              </p>
            </div>
            <h2 className="text-3xl font-extrabold tabular-nums text-foreground tracking-tight">
              {formatCurrencyBRL(executedValue, isPrivacyMode)}
            </h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progresso</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatPercent(executionPercentage)}
                </span>
              </div>
              <Progress
                value={executionPercentage}
                className="h-2 bg-neutral-100 dark:bg-neutral-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Legislators Card */}
      <Card
        className="overflow-hidden glass-card animate-fade-in-up opacity-0"
        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
      >
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Legisladores Ativos
            </p>
            <h2 className="text-3xl font-extrabold tabular-nums text-foreground tracking-tight">
              {activeLegislators}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-neutral-50 dark:bg-neutral-800/50 py-2 px-3 rounded-lg w-fit">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              Parlamentares com emendas
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
