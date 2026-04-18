import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
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

interface ExecutionDetailsTabProps {
  executionByResponsavel: { name: string; value: number }[]
  executionByUnidade: { name: string; value: number }[]
}

const chartConfig = {
  value: {
    label: 'Valor Executado',
  },
} satisfies ChartConfig

export function ExecutionDetailsTab({
  executionByResponsavel,
  executionByUnidade,
}: ExecutionDetailsTabProps) {
  const { isPrivacyMode } = usePrivacy()

  const respDataWithColors = useMemo(
    () =>
      executionByResponsavel.slice(0, 10).map((d) => ({
        ...d,
        baseColor: stringToColor(d.name),
      })),
    [executionByResponsavel],
  )

  const uniDataWithColors = useMemo(
    () =>
      executionByUnidade.slice(0, 10).map((d) => ({
        ...d,
        baseColor: stringToColor(d.name),
      })),
    [executionByUnidade],
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle>Execução por Responsável</CardTitle>
          <CardDescription>Quem está registrando mais despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[400px]">
            <AreaChart
              data={respDataWithColors}
              margin={{ top: 20, right: 20, bottom: 80, left: 0 }}
            >
              <defs>
                <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
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
                height={80}
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
                fill="url(#colorResp)"
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

      <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <CardHeader>
          <CardTitle>Execução por Unidade</CardTitle>
          <CardDescription>Destino operacional dos recursos</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[400px]">
            <AreaChart
              data={uniDataWithColors}
              margin={{ top: 20, right: 20, bottom: 80, left: 0 }}
            >
              <defs>
                <linearGradient id="colorUni" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickMargin={20}
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                className="font-medium"
                tickFormatter={(val) =>
                  val.length > 15 ? `${val.substring(0, 15)}...` : val
                }
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
                stroke="#00C49F"
                strokeWidth={3}
                fill="url(#colorUni)"
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
