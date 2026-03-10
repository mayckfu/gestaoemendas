import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { formatCurrencyBRL } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface MonthlyFinancialChartProps {
  data: { month: string; repasses: number; despesas: number }[]
  periodKey?: string
}

const chartConfig = {
  repasses: {
    label: 'Repasses (Rec. Depositado)',
    color: 'hsl(var(--primary))',
  },
  despesas: {
    label: 'Despesas (Executado)',
    color: '#00C49F',
  },
} satisfies ChartConfig

export function MonthlyFinancialChart({
  data,
  periodKey,
}: MonthlyFinancialChartProps) {
  const { isPrivacyMode } = usePrivacy()

  return (
    <Card className="col-span-1 rounded-xl shadow-sm border-border/50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-neutral-800">
          Evolução Financeira
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          key={periodKey} // Force re-render on period change
          config={chartConfig}
          className="w-full h-[300px]"
        >
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              fontSize={12}
              tickFormatter={(v) => {
                try {
                  return format(parseISO(v + '-01'), 'MMM/yy', { locale: ptBR })
                } catch {
                  return v
                }
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tickFormatter={(v) =>
                isPrivacyMode
                  ? '••••••'
                  : new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    }).format(v)
              }
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatCurrencyBRL(Number(value), isPrivacyMode)
                  }
                  labelFormatter={(label) => {
                    try {
                      return format(parseISO(label + '-01'), 'MMMM yyyy', {
                        locale: ptBR,
                      })
                    } catch {
                      return label
                    }
                  }}
                  className="tabular-nums"
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent />}
              verticalAlign="bottom"
              height={36}
            />
            <Bar
              dataKey="repasses"
              fill="var(--color-repasses)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="despesas"
              fill="var(--color-despesas)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
