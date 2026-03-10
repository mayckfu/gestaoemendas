import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrencyBRL, stringToColor } from '@/lib/utils'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface LegislatorPerformanceTabProps {
  consolidatedByParlamentar: { name: string; value: number }[]
  executionByParlamentarAndResponsavel: any[]
}

const chartConfig = {
  value: {
    label: 'Valor Total',
  },
  totalExecuted: {
    label: 'Total Executado',
  },
} satisfies ChartConfig

export function LegislatorPerformanceTab({
  consolidatedByParlamentar,
  executionByParlamentarAndResponsavel,
}: LegislatorPerformanceTabProps) {
  const { isPrivacyMode } = usePrivacy()

  const dataWithColors = useMemo(
    () =>
      consolidatedByParlamentar.slice(0, 15).map((d) => ({
        ...d,
        baseColor: stringToColor(d.name),
      })),
    [consolidatedByParlamentar],
  )

  const execDataWithColors = useMemo(
    () =>
      executionByParlamentarAndResponsavel.slice(0, 15).map((d) => ({
        ...d,
        baseColor: stringToColor(d.parlamentar),
      })),
    [executionByParlamentarAndResponsavel],
  )

  return (
    <div className="grid gap-6">
      <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle>Top Parlamentares por Volume de Recursos</CardTitle>
          <CardDescription>
            Valores totais destinados agrupados por parlamentar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[450px]">
            <AreaChart
              data={dataWithColors}
              margin={{ top: 20, right: 20, bottom: 80, left: 0 }}
            >
              <defs>
                <linearGradient id="colorParl" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.2}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={20}
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                className="font-medium"
                tickFormatter={(val) => {
                  const parts = val.split(' ')
                  return parts.length > 2
                    ? `${parts[0]} ${parts[parts.length - 1]}`
                    : val
                }}
              />
              <YAxis
                tickFormatter={(v) =>
                  isPrivacyMode
                    ? '••••••'
                    : new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(v)
                }
                axisLine={false}
                tickLine={false}
                fontSize={12}
                className="font-medium"
              />
              <Tooltip
                cursor={{
                  stroke: 'rgba(150,150,150,0.3)',
                  strokeWidth: 2,
                  strokeDasharray: '4 4',
                }}
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatCurrencyBRL(Number(value), isPrivacyMode)
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#colorParl)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null) return null
                  return (
                    <circle
                      key={`dot-${payload.name}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.baseColor}
                      stroke="var(--background)"
                      strokeWidth={1.5}
                    />
                  )
                }}
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null) return null
                  return (
                    <circle
                      key={`activedot-${payload.name}`}
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill={payload.baseColor}
                      stroke="var(--background)"
                      strokeWidth={2}
                      style={{
                        filter: `drop-shadow(0 0 10px ${payload.baseColor})`,
                      }}
                    />
                  )
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="glass-card animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <CardHeader>
          <CardTitle>Execução Detalhada por Parlamentar</CardTitle>
          <CardDescription>
            Recursos efetivamente executados agrupados por parlamentar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[500px]">
            <ComposedChart
              data={execDataWithColors}
              margin={{ top: 20, right: 20, bottom: 80, left: 0 }}
            >
              <defs>
                <linearGradient id="colorExecPar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C49F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.2}
              />
              <XAxis
                dataKey="parlamentar"
                axisLine={false}
                tickLine={false}
                tickMargin={20}
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                className="font-medium"
                tickFormatter={(val) => {
                  const parts = val.split(' ')
                  return parts.length > 2
                    ? `${parts[0]} ${parts[parts.length - 1]}`
                    : val
                }}
              />
              <YAxis
                tickFormatter={(v) =>
                  isPrivacyMode
                    ? '••••••'
                    : new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(v)
                }
                axisLine={false}
                tickLine={false}
                fontSize={12}
                className="font-medium"
              />
              <Tooltip
                cursor={{
                  stroke: 'rgba(150,150,150,0.3)',
                  strokeWidth: 2,
                  strokeDasharray: '4 4',
                }}
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatCurrencyBRL(Number(value), isPrivacyMode)
                    }
                  />
                }
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="totalExecuted"
                name="Total Executado"
                stroke="#00C49F"
                strokeWidth={3}
                fill="url(#colorExecPar)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null) return null
                  return (
                    <circle
                      key={`dot-${payload.parlamentar}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.baseColor}
                      stroke="var(--background)"
                      strokeWidth={1.5}
                    />
                  )
                }}
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null) return null
                  return (
                    <circle
                      key={`activedot-${payload.parlamentar}`}
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill={payload.baseColor}
                      stroke="var(--background)"
                      strokeWidth={2}
                      style={{
                        filter: `drop-shadow(0 0 10px ${payload.baseColor})`,
                      }}
                    />
                  )
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
