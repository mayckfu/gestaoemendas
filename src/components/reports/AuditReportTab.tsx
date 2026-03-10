import { useState } from 'react'
import {
  DetailedAmendment,
  AuditCategories,
  ActionWithDestinations,
} from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronRight,
  Download,
  Printer,
  Package,
  Activity,
  User,
  Box,
  Gift,
  Monitor,
} from 'lucide-react'
import { formatCurrencyBRL, cn, formatPercent } from '@/lib/utils'
import { ExpandableText } from '@/components/ui/expandable-text'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface AuditReportTabProps {
  data: DetailedAmendment[]
}

export const AuditReportTab = ({ data }: AuditReportTabProps) => {
  const { isPrivacyMode } = usePrivacy()

  // We want to flatten all Actions from all Amendments to show them in the list
  const allActions = data.flatMap((emenda) =>
    emenda.acoes.map((acao) => {
      const destinationIds = acao.destinacoes.map((d) => d.id)
      const relatedExpenses = emenda.despesas.filter(
        (d) => d.destinacao_id && destinationIds.includes(d.destinacao_id),
      )
      return {
        ...acao,
        portaria: emenda.portaria || '-',
        emenda_numero: emenda.numero_emenda,
        relatedExpenses,
      }
    }),
  )

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              Visão de Auditoria e Controle
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[30%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-10">
                  Eixo / Ação de Controle
                </TableHead>
                <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Valor Planejado
                </TableHead>
                <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Valor Executado
                </TableHead>
                <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Saldo
                </TableHead>
                <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  % Execução
                </TableHead>
                <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allActions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma ação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                allActions.map((action) => (
                  <AuditActionRow
                    key={action.id}
                    action={action}
                    isPrivacyMode={isPrivacyMode}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

const AuditActionRow = ({
  action,
  isPrivacyMode,
}: {
  action: ActionWithDestinations & {
    portaria: string
    emenda_numero: string
    relatedExpenses: any[]
  }
  isPrivacyMode: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate totals
  const totalPlanned = action.destinacoes.reduce(
    (acc, d) => acc + d.valor_destinado,
    0,
  )
  const totalExecuted = action.relatedExpenses.reduce(
    (acc, curr) => acc + curr.valor,
    0,
  )
  const balance = totalPlanned - totalExecuted
  const percent = totalPlanned > 0 ? (totalExecuted / totalPlanned) * 100 : 0

  // Category Breakdowns (Executed)
  const expenses = action.relatedExpenses
  const servicesTotal = expenses
    .filter((e) => e.categoria === AuditCategories.SERVICOS_TERCEIROS)
    .reduce((acc, curr) => acc + curr.valor, 0)
  const materialsTotal = expenses
    .filter((e) => e.categoria === AuditCategories.MATERIAL_CONSUMO)
    .reduce((acc, curr) => acc + curr.valor, 0)
  const distributionTotal = expenses
    .filter((e) => e.categoria === AuditCategories.DISTRIBUICAO_GRATUITA)
    .reduce((acc, curr) => acc + curr.valor, 0)
  const equipamentosTotal = expenses
    .filter((e) => e.categoria === AuditCategories.EQUIPAMENTOS)
    .reduce((acc, curr) => acc + curr.valor, 0)

  // Category Breakdowns (Planned)
  const plannedServices = action.destinacoes
    .filter((d) => d.tipo_destinacao === AuditCategories.SERVICOS_TERCEIROS)
    .reduce((acc, curr) => acc + curr.valor_destinado, 0)
  const plannedMaterials = action.destinacoes
    .filter((d) => d.tipo_destinacao === AuditCategories.MATERIAL_CONSUMO)
    .reduce((acc, curr) => acc + curr.valor_destinado, 0)
  const plannedDistribution = action.destinacoes
    .filter((d) => d.tipo_destinacao === AuditCategories.DISTRIBUICAO_GRATUITA)
    .reduce((acc, curr) => acc + curr.valor_destinado, 0)
  const plannedEquipamentos = action.destinacoes
    .filter((d) => d.tipo_destinacao === AuditCategories.EQUIPAMENTOS)
    .reduce((acc, curr) => acc + curr.valor_destinado, 0)

  // Determine status
  let status = 'PENDENTE'
  let statusColor = 'bg-neutral-100 text-neutral-600 border-neutral-200'

  if (totalExecuted > 0) {
    if (totalExecuted >= totalPlanned && totalPlanned > 0) {
      status = 'EXECUTADO'
      statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'
    } else if (totalExecuted > totalPlanned) {
      status = 'EXCEDIDO'
      statusColor = 'bg-red-100 text-red-700 border-red-200'
    } else {
      status = 'PARCIAL'
      statusColor = 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/30 transition-colors',
          isExpanded && 'bg-muted/30',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="pl-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div className="w-full max-w-[250px] min-w-[200px]">
              <div className="font-semibold text-sm text-foreground">
                {action.nome_acao}
              </div>
              <div
                className="text-xs text-muted-foreground mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <ExpandableText
                  text={action.descricao_oficial}
                  limit={50}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right align-middle text-sm font-medium text-muted-foreground">
          {formatCurrencyBRL(totalPlanned, isPrivacyMode)}
        </TableCell>
        <TableCell className="text-right align-middle font-bold text-sm">
          {formatCurrencyBRL(totalExecuted, isPrivacyMode)}
        </TableCell>
        <TableCell className="text-right align-middle text-sm">
          <span
            className={cn(
              'font-medium',
              balance < 0 ? 'text-red-600' : 'text-emerald-600',
            )}
          >
            {formatCurrencyBRL(balance, isPrivacyMode)}
          </span>
        </TableCell>
        <TableCell className="text-right align-middle text-sm font-medium text-muted-foreground">
          {formatPercent(percent)}
        </TableCell>
        <TableCell className="text-center align-middle">
          <Badge
            variant="outline"
            className={cn('text-[10px] font-bold border', statusColor)}
          >
            {status}
          </Badge>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="hover:bg-transparent bg-muted/10">
          <TableCell colSpan={6} className="p-0 border-b">
            <div className="px-12 py-6 animate-fade-in-down">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Package className="h-4 w-4" />
                Detalhamento por Categoria de Despesa
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Services Column */}
                <CategoryCard
                  title="Serviços de Terceiros"
                  planned={plannedServices}
                  executed={servicesTotal}
                  expenses={expenses.filter(
                    (e) => e.categoria === AuditCategories.SERVICOS_TERCEIROS,
                  )}
                  icon={<User className="h-4 w-4" />}
                  colorClass="text-blue-600"
                  isPrivacyMode={isPrivacyMode}
                />

                {/* Materials Column */}
                <CategoryCard
                  title="Material de Consumo"
                  planned={plannedMaterials}
                  executed={materialsTotal}
                  expenses={expenses.filter(
                    (e) => e.categoria === AuditCategories.MATERIAL_CONSUMO,
                  )}
                  icon={<Box className="h-4 w-4" />}
                  colorClass="text-emerald-600"
                  isPrivacyMode={isPrivacyMode}
                />

                {/* Distribution Column */}
                <CategoryCard
                  title="Material de Distribuição"
                  planned={plannedDistribution}
                  executed={distributionTotal}
                  expenses={expenses.filter(
                    (e) =>
                      e.categoria === AuditCategories.DISTRIBUICAO_GRATUITA,
                  )}
                  icon={<Gift className="h-4 w-4" />}
                  colorClass="text-amber-600"
                  isPrivacyMode={isPrivacyMode}
                />

                {/* Equipment Column */}
                {(plannedEquipamentos > 0 || equipamentosTotal > 0) && (
                  <CategoryCard
                    title="Equipamentos"
                    planned={plannedEquipamentos}
                    executed={equipamentosTotal}
                    expenses={expenses.filter(
                      (e) => e.categoria === AuditCategories.EQUIPAMENTOS,
                    )}
                    icon={<Monitor className="h-4 w-4" />}
                    colorClass="text-purple-600"
                    isPrivacyMode={isPrivacyMode}
                  />
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const CategoryCard = ({
  title,
  planned,
  executed,
  expenses,
  icon,
  colorClass,
  isPrivacyMode,
}: {
  title: string
  planned: number
  executed: number
  expenses: any[]
  icon: React.ReactNode
  colorClass: string
  isPrivacyMode: boolean
}) => {
  const balance = planned - executed
  return (
    <div className="bg-white dark:bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-muted-foreground uppercase">
            {title}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-end mb-3 pb-3 border-b border-dashed">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">Planejado</span>
          <span className="text-xs font-medium">
            {formatCurrencyBRL(planned, isPrivacyMode)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Executado</span>
          <span className={cn('text-sm font-bold', colorClass)}>
            {formatCurrencyBRL(executed, isPrivacyMode)}
          </span>
        </div>
      </div>
      <ExpenseList expenses={expenses} isPrivacyMode={isPrivacyMode} />
      {balance !== 0 && (
        <div className="mt-3 pt-2 border-t text-right">
          <span className="text-[10px] text-muted-foreground mr-2">Saldo:</span>
          <span
            className={cn(
              'text-xs font-medium',
              balance < 0 ? 'text-red-600' : 'text-emerald-600',
            )}
          >
            {formatCurrencyBRL(balance, isPrivacyMode)}
          </span>
        </div>
      )}
    </div>
  )
}

const ExpenseList = ({
  expenses,
  isPrivacyMode,
}: {
  expenses: any[]
  isPrivacyMode: boolean
}) => {
  if (expenses.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/50 italic py-2 text-center">
        Nenhum item lançado
      </div>
    )
  }
  return (
    <ul className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex justify-between items-start gap-2">
          <div className="text-xs text-foreground leading-tight max-w-[70%]">
            <ExpandableText text={expense.descricao} limit={80} />
          </div>
          <span className="text-xs font-medium italic text-muted-foreground whitespace-nowrap">
            {formatCurrencyBRL(expense.valor, isPrivacyMode)}
          </span>
        </li>
      ))}
    </ul>
  )
}
