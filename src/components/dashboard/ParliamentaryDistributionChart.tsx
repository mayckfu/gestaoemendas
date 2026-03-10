import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrencyBRL } from '@/lib/utils'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface ParliamentaryDistributionChartProps {
  data: { name: string; value: number }[]
  periodKey?: string
}

const chartConfig = {
  value: {
    label: 'Valor Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function ParliamentaryDistributionChart({
  data,
  periodKey,
}: ParliamentaryDistributionChartProps) {
  const { isPrivacyMode } = usePrivacy()

  // Only take top 10 to avoid crowding the chart, or allow scrolling
  const topData = data.slice(0, 10)

  return (
    <Card className="col-span-1 rounded-xl shadow-sm border-border/50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-neutral-800">
          Top 10 Parlamentares
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          key={periodKey}
          config={chartConfig}
          className="w-full h-[300px]"
        >
          <BarChart
            data={topData}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                isPrivacyMode
                  ? '••••••'
                  : new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    }).format(v)
              }
              fontSize={11}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={100}
              tickFormatter={(value) => {
                // Return just the first name or initials if too long
                const parts = value.split(' ')
                return parts[0]
              }}
              fontSize={11}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatCurrencyBRL(Number(value), isPrivacyMode)
                  }
                  className="tabular-nums"
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
