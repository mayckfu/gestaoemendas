import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip,
  ComposedChart,
  Line,
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

interface FinancialOverviewTabProps {
  consolidatedByTipoRecurso: { name: string; value: number }[]
  consolidatedBySituacao: { name: string; value: number }[]
  executionStatus: { name: string; value: number }[]
  executionByMonth: { name: string; planejado: number; executado: number }[]
  COLORS: string[]
}

const chartConfig = {
  value: {
    label: 'Valor',
  },
} satisfies ChartConfig

export function FinancialOverviewTab({
  consolidatedByTipoRecurso,
  consolidatedBySituacao,
  executionStatus,
  executionByMonth,
  COLORS,
}: FinancialOverviewTabProps) {
  const { isPrivacyMode } = usePrivacy()

  const situacaoDataWithColors = useMemo(
    () =>
      consolidatedBySituacao.map((d) => ({
        ...d,
        baseColor: stringToColor(d.name),
      })),
    [consolidatedBySituacao],
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>Consolidado por Tipo de Recurso</CardTitle>
          <CardDescription>Distribuição do valor total orçado</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="w-full h-[300px] [&_.recharts-pie-label-text]:fill-foreground"
          >
            <PieChart>
              <Pie
                data={consolidatedByTipoRecurso}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={3}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {consolidatedByTipoRecurso.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    strokeWidth={0}
                    className="hover:opacity-80 transition-opacity outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatCurrencyBRL(Number(value), isPrivacyMode)
                    }
                  />
                }
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <CardHeader>
          <CardTitle>Status de Execução Geral</CardTitle>
          <CardDescription>
            Estado atual das despesas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="w-full h-[300px] [&_.recharts-pie-label-text]:fill-foreground"
          >
            <PieChart>
              <Pie
                data={executionStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {executionStatus.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[(index + 3) % COLORS.length]}
                    stroke="var(--background)"
                    strokeWidth={2}
                    className="hover:opacity-90 transition-opacity outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatCurrencyBRL(Number(value), isPrivacyMode)
                    }
                  />
                }
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 glass-card animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Análise de Tendência Mensal
          </CardTitle>
          <CardDescription>
            Comparativo entre valor planejado e execução ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              planejado: { label: 'Planejado', color: 'hsl(var(--primary))' },
              executado: { label: 'Executado', color: '#00C49F' },
            }}
            className="w-full h-[350px]"
          >
            <ComposedChart
              data={executionByMonth}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <defs>
                <linearGradient id="gradPlanejado" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-planejado)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-planejado)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gradExecutado" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-executado)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-executado)"
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
                tickMargin={10}
                fontSize={12}
                className="font-medium"
              />
              <YAxis
                tickFormatter={(v) =>
                  isPrivacyMode
                    ? '••••••'
                    : new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
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
                dataKey="planejado"
                stroke="var(--color-planejado)"
                strokeWidth={3}
                fill="url(#gradPlanejado)"
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                  style: {
                    filter: 'drop-shadow(0 0 8px var(--color-planejado))',
                  },
                }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="executado"
                stroke="var(--color-executado)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }}
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                  style: {
                    filter: 'drop-shadow(0 0 8px var(--color-executado))',
                  },
                }}
                animationDuration={1500}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card
        className={`col-span-1 md:col-span-2 glass-card animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150`}
      >
        <CardHeader>
          <CardTitle>Situação Oficial das Emendas</CardTitle>
          <CardDescription>
            Montantes totais agrupados pelo status oficial no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[350px]">
            <AreaChart
              data={situacaoDataWithColors}
              margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
            >
              <defs>
                <linearGradient id="colorSituacao" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.4}
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
                tickMargin={10}
                height={60}
                angle={-15}
                textAnchor="end"
                fontSize={12}
                className="font-medium"
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
                fill="url(#colorSituacao)"
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
    </div>
  )
}
