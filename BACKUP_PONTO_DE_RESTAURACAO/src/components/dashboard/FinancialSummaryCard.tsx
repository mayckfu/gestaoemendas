import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrencyBRL, formatPercent } from '@/lib/utils'
import { ArrowRight, Wallet, PieChart, Box } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface FinancialSummaryCardProps {
  title: string
  totalValue: number
  paidValue: number
  pendingValue: number
  type: 'MAC' | 'PAP' | 'EQUIPAMENTO'
  progressLabel?: string
  to?: string
}

const SummaryItem = ({
  label,
  value,
  className,
  colorClass,
}: {
  label: string
  value: string
  className?: string
  colorClass?: string
}) => (
  <div
    className={cn(
      'flex flex-col p-3 rounded-lg bg-neutral-50 border border-neutral-100/50 min-w-0 overflow-hidden',
      className,
    )}
  >
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">
      {label}
    </p>
    <p
      className={cn(
        'text-sm font-bold tabular-nums break-words leading-tight truncate',
        colorClass || 'text-neutral-900',
      )}
      title={value}
    >
      {value}
    </p>
  </div>
)

export const FinancialSummaryCard = ({
  title,
  totalValue,
  paidValue,
  pendingValue,
  type,
  progressLabel = 'Execução',
  to,
}: FinancialSummaryCardProps) => {
  const navigate = useNavigate()
  const { isPrivacyMode } = usePrivacy()

  const executionPercentage = useMemo(() => {
    return totalValue > 0 ? (paidValue / totalValue) * 100 : 0
  }, [totalValue, paidValue])

  const theme = useMemo(() => {
    switch (type) {
      case 'MAC':
        return {
          progressColor: 'bg-blue-600',
          iconBgColor: 'bg-blue-50 text-blue-600',
          paidColor: 'text-blue-700',
          pendingColor: 'text-orange-600',
          borderColor: 'border-blue-200 ring-blue-100',
          Icon: Wallet,
        }
      case 'PAP':
        return {
          progressColor: 'bg-cyan-600',
          iconBgColor: 'bg-cyan-50 text-cyan-600',
          paidColor: 'text-cyan-700',
          pendingColor: 'text-orange-600',
          borderColor: 'border-cyan-200 ring-cyan-100',
          Icon: PieChart,
        }
      case 'EQUIPAMENTO':
        return {
          progressColor: 'bg-purple-600',
          iconBgColor: 'bg-purple-50 text-purple-600',
          paidColor: 'text-purple-700',
          pendingColor: 'text-rose-600',
          borderColor: 'border-purple-200 ring-purple-100',
          Icon: Box,
        }
    }
  }, [type])

  const handleCardClick = () => {
    if (to) {
      navigate(to)
    }
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'h-full bg-white shadow-card hover:shadow-float transition-all duration-300 border border-border/60 hover:-translate-y-1 rounded-xl overflow-hidden flex flex-col cursor-pointer group',
      )}
    >
      <CardHeader className="pb-4 border-b border-neutral-100 bg-neutral-50/30 w-full px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={cn(
                'p-2.5 rounded-xl shadow-sm border border-white shrink-0',
                theme.iconBgColor,
              )}
            >
              <theme.Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold text-brand-900 truncate pr-2">
                {title}
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium truncate">
                {type === 'EQUIPAMENTO'
                  ? 'Recursos de Capital'
                  : 'Recursos de Custeio'}
              </span>
            </div>
          </div>
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center bg-white border border-neutral-200 transition-colors shrink-0',
              'text-neutral-400 group-hover:text-brand-600 group-hover:bg-brand-50 group-hover:border-brand-200',
            )}
          >
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 px-4 sm:px-6 flex-1 flex flex-col justify-between w-full">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wide">
            <span className="text-muted-foreground truncate mr-2">
              {progressLabel}
            </span>
            <span className="text-brand-700 shrink-0">
              {formatPercent(executionPercentage)}
            </span>
          </div>
          <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-out rounded-full',
                theme.progressColor,
              )}
              style={{ width: `${executionPercentage}%` }}
            />
          </div>
        </div>

        {/* Refined Grid for Values - Prevents Clipping */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryItem
            label="Previsto"
            value={formatCurrencyBRL(totalValue, isPrivacyMode)}
          />
          <SummaryItem
            label="Liquidado"
            value={formatCurrencyBRL(paidValue, isPrivacyMode)}
            colorClass={theme.paidColor}
          />
          <SummaryItem
            label="Pendente"
            value={formatCurrencyBRL(pendingValue, isPrivacyMode)}
            colorClass={theme.pendingColor}
          />
        </div>
      </CardContent>
    </Card>
  )
}
