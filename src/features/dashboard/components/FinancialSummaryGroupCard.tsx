import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrencyBRL, formatPercent } from '@/lib/utils'
import { ArrowRight, Box, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePrivacy } from '@/contexts/PrivacyContext'

type SummaryLine = {
  label: string
  total: number
  executed: number
  pending: number
  to: string
}

interface FinancialSummaryGroupCardProps {
  title: string
  subtitle: string
  type: 'custeio' | 'incremento' | 'equipamento'
  lines: SummaryLine[]
}

export function FinancialSummaryGroupCard({
  title,
  subtitle,
  type,
  lines,
}: FinancialSummaryGroupCardProps) {
  const navigate = useNavigate()
  const { isPrivacyMode } = usePrivacy()
  const Icon = type === 'custeio' ? Wallet : Box
  const colorClass =
    type === 'custeio'
      ? 'bg-blue-600'
      : type === 'incremento'
        ? 'bg-purple-600'
        : 'bg-emerald-600'
  const iconClass =
    type === 'custeio'
      ? 'bg-blue-50 text-blue-600'
      : type === 'incremento'
        ? 'bg-purple-50 text-purple-600'
        : 'bg-emerald-50 text-emerald-600'
  const total = lines.reduce((sum, line) => sum + line.total, 0)
  const executed = lines.reduce((sum, line) => sum + line.executed, 0)
  const pct = total > 0 ? (executed / total) * 100 : 0

  return (
    <Card className="h-full bg-white shadow-card border border-border/60 rounded-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-neutral-100 bg-neutral-50/30 px-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'p-2.5 rounded-xl shadow-sm border border-white shrink-0',
                iconClass,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold text-brand-900">
                {title}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Total indicado
            </p>
            <p className="font-bold tabular-nums text-neutral-900">
              {formatCurrencyBRL(total, isPrivacyMode)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wide">
            <span className="text-muted-foreground">Pago</span>
            <span className="text-brand-700">{formatPercent(pct)}</span>
          </div>
          <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-out rounded-full',
                colorClass,
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((line) => (
            <button
              key={line.label}
              type="button"
              onClick={() => navigate(line.to)}
              className="w-full rounded-lg border border-neutral-100 bg-neutral-50/80 p-3 text-left hover:bg-white hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-neutral-900">{line.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Pago: {formatCurrencyBRL(line.executed, isPrivacyMode)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <p className="font-bold tabular-nums text-neutral-900">
                      {formatCurrencyBRL(line.total, isPrivacyMode)}
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-orange-600">
                      Saldo: {formatCurrencyBRL(line.pending, isPrivacyMode)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
