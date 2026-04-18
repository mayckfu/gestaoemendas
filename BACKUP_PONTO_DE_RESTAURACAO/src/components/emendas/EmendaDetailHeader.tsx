import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DetailedAmendment,
  SituacaoOficial,
  StatusInterno,
  SituacaoOficialEnum,
  StatusInternoEnum,
} from '@/lib/mock-data'
import {
  Paperclip,
  Calendar,
  User,
  Wallet,
  TrendingUp,
  CreditCard,
  FileText,
} from 'lucide-react'
import { formatCurrencyBRL, formatPercent, cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { Badge } from '@/components/ui/badge'

interface EmendaDetailHeaderProps {
  emenda: DetailedAmendment
  onStatusOficialChange: (status: SituacaoOficialEnum) => void
  onStatusInternoChange: (status: StatusInternoEnum) => void
}

export const EmendaDetailHeader = ({
  emenda,
  onStatusOficialChange,
  onStatusInternoChange,
}: EmendaDetailHeaderProps) => {
  const { checkPermission } = useAuth()
  const { isPrivacyMode } = usePrivacy()
  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const totalRepassado = emenda.repasses.reduce((acc, r) => acc + r.valor, 0)
  const totalGasto = emenda.despesas.reduce((acc, d) => acc + d.valor, 0)
  const execucaoPercent =
    totalRepassado > 0 ? (totalGasto / totalRepassado) * 100 : 0
  const coberturaPercent =
    emenda.valor_total > 0 ? (totalGasto / emenda.valor_total) * 100 : 0

  return (
    <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Main Identity */}
          <div className="space-y-4 md:space-y-2 flex-1">
            {/* Mobile Identification Card (Visible only < md) */}
            <div className="md:hidden flex flex-col gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Emenda Nº
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {emenda.numero_emenda}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-background shadow-sm"
                >
                  <Calendar className="h-3 w-3" />
                  {emenda.ano_exercicio}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {emenda.origem === 'ESTADUAL' ? 'Estadual' : 'Federal'}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
                >
                  {emenda.tipo === 'individual'
                    ? 'Recurso Individual'
                    : emenda.tipo === 'bancada'
                      ? 'Recurso de Bancada'
                      : emenda.tipo === 'comissao'
                        ? 'Recurso de Comissão'
                        : 'Recurso de Programa'}
                </Badge>
              </div>

              <div className="pt-3 mt-1 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">
                    {emenda.parlamentar}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Proposta (Visible only < md) */}
            <div className="md:hidden pt-1 px-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Proposta
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground/50" />
                {emenda.numero_proposta || 'N/A'}
              </div>
            </div>

            {/* Desktop Original Layout (Hidden on mobile) */}
            <div className="hidden md:block space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {emenda.ano_exercicio}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {emenda.origem === 'ESTADUAL' ? 'Estadual' : 'Federal'}
                </Badge>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {emenda.tipo === 'individual'
                    ? 'Recurso Individual'
                    : emenda.tipo === 'bancada'
                      ? 'Recurso de Bancada'
                      : emenda.tipo === 'comissao'
                        ? 'Recurso de Comissão'
                        : 'Recurso de Programa'}
                </span>
              </div>

              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span className="text-muted-foreground font-normal text-lg mr-1">
                    Proposta:
                  </span>
                  {emenda.numero_proposta || 'N/A'}
                </CardTitle>

                <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Emenda Nº:</span>
                    <span className="font-semibold text-foreground">
                      {emenda.numero_emenda}
                    </span>
                  </div>

                  <div className="hidden sm:block text-neutral-300">|</div>

                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary/70" />
                    <span className="font-medium text-foreground">
                      {emenda.parlamentar}
                    </span>
                    <span className="text-muted-foreground">(Parlamentar)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto mt-4 lg:mt-0">
            <div className="flex flex-col gap-1.5 w-full md:w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status Oficial
              </span>
              <Select
                value={emenda.situacao}
                onValueChange={(value) =>
                  onStatusOficialChange(value as SituacaoOficialEnum)
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SituacaoOficial).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 w-full md:w-[240px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status Interno
              </span>
              <Select
                value={emenda.status_interno}
                onValueChange={(value) =>
                  onStatusInternoChange(value as StatusInternoEnum)
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(StatusInterno).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10">
              <Wallet className="h-12 w-12 text-slate-900 dark:text-slate-100" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
              Valor Total
            </span>
            <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrencyBRL(emenda.valor_total, isPrivacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10">
              <TrendingUp className="h-12 w-12 text-emerald-700 dark:text-emerald-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1">
              Repassado
            </span>
            <span className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-300">
              {formatCurrencyBRL(totalRepassado, isPrivacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10">
              <CreditCard className="h-12 w-12 text-blue-700 dark:text-blue-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-1">
              Gasto (Executado)
            </span>
            <span className="text-lg md:text-xl font-bold text-blue-800 dark:text-blue-300">
              {formatCurrencyBRL(totalGasto, isPrivacyMode)}
            </span>
          </div>

          <div className="p-4 rounded-lg border bg-muted/20 flex flex-col justify-center sm:col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                Progresso da Execução
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPercent(execucaoPercent)}
              </span>
            </div>

            {/* Custom Gradient Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(execucaoPercent, 100)}%` }}
              />
            </div>

            <div className="flex justify-between mt-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Executado
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Cobertura: {formatPercent(coberturaPercent)} do total
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-md w-fit">
          <Paperclip className="h-3.5 w-3.5" />
          {emenda.anexos.length} anexo(s) vinculado(s)
        </div>
      </CardContent>
    </Card>
  )
}
