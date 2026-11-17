import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FnsSyncResult, fnsSyncService } from '@/services/fnsSyncService'

const BATCH_SIZE = 5

type AmendmentSummary = {
  id: string
  numero_proposta: string | null
  numero_emenda: string
  parlamentar: string
  situacao: string
  status_interno: string
  portaria: string | null
  valor_total: number
}

type BulkRow = {
  amendment: AmendmentSummary
  result: FnsSyncResult
}

type ResultFilter = 'changes' | 'all' | 'unchanged' | 'conflicts' | 'errors'

const FIELD_LABELS: Record<string, string> = {
  portaria: 'Portaria',
  valor_total: 'Valor',
  numero_emenda: 'Nº da emenda',
  situacao: 'Situação',
  status_interno: 'Status interno',
}

const createBatchId = () => crypto.randomUUID()

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function hasConflict(row: BulkRow) {
  return Object.keys(row.result.conflicts || {}).length > 0
}

function insertedPayments(row: BulkRow) {
  return (row.result.payments || []).filter((payment) => payment.action === 'insert')
}

function updatedBankPayments(row: BulkRow) {
  return (row.result.payments || []).filter((payment) => payment.action === 'update' && payment.account_number)
}

function newAttachments(row: BulkRow) {
  return (row.result.attachments || []).filter((attachment) => attachment.action === 'insert')
}

function hasChanges(row: BulkRow) {
  return (
    row.result.success && !row.result.applied &&
    (Object.keys(row.result.changes || {}).length > 0 ||
      insertedPayments(row).length > 0 ||
      updatedBankPayments(row).length > 0 ||
      newAttachments(row).length > 0)
  )
}

function changeSummary(row: BulkRow) {
  const fields = Object.keys(row.result.changes || {}).map((field) => FIELD_LABELS[field] || field)
  const parts = [...fields]
  const payments = insertedPayments(row).length
  const banks = updatedBankPayments(row).length
  const attachments = newAttachments(row).length
  if (payments) parts.push(`${payments} repasse(s) novo(s)`)
  if (banks) parts.push(`${banks} conta(s) por OB para atualizar`)
  if (attachments) parts.push(`${attachments} anexo(s)`)
  return parts.length ? parts.join(' · ') : 'Sem alterações'
}

function paymentSummary(row: BulkRow) {
  const payments = row.result.payments || []
  if (!payments.length) return 'Nenhum pagamento divulgado'
  return payments
    .map((payment) => {
      const order = String(payment.ordem_bancaria || 'OB não informada')
      const account = payment.account_number
        ? ` · Ag. ${payment.branch_number || '-'} · Cc. ${payment.account_number}`
        : ''
      return `${order}${account}`
    })
    .join(' | ')
}

function bankAccountSummary(row: BulkRow) {
  const accounts = row.result.bank_accounts || []
  if (!accounts.length) return 'Nenhuma conta adicional encontrada'
  return accounts.map((account) =>
    `Banco ${String(account.coBanco || '-')} · Ag. ${String(account.coAgencia || '-')} · Cc. ${String(account.nuConta || '-')}`
  ).join(' | ')
}

export function FnsBulkSyncTab({ years }: { years: number[] }) {
  const { toast } = useToast()
  const availableYears = useMemo(
    () => [...new Set(years)].sort((a, b) => b - a),
    [years],
  )
  const [year, setYear] = useState(String(availableYears[0] || new Date().getFullYear()))
  const [rows, setRows] = useState<BulkRow[]>([])
  const [filter, setFilter] = useState<ResultFilter>('changes')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'changes') return rows.filter(hasChanges)
    if (filter === 'unchanged') return rows.filter((row) => row.result.success && !hasChanges(row) && !hasConflict(row))
    if (filter === 'conflicts') return rows.filter(hasConflict)
    return rows.filter((row) => !row.result.success)
  }, [filter, rows])

  const counts = useMemo(() => ({
    all: rows.length,
    changes: rows.filter(hasChanges).length,
    unchanged: rows.filter((row) => row.result.success && !hasChanges(row) && !hasConflict(row)).length,
    conflicts: rows.filter(hasConflict).length,
    errors: rows.filter((row) => !row.result.success).length,
  }), [rows])

  const runBatches = async (
    amendments: AmendmentSummary[],
    apply: boolean,
    batchId: string,
  ) => {
    const allResults: FnsSyncResult[] = []
    const batches = chunks(amendments, BATCH_SIZE)

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index]
      setProgressLabel(`${apply ? 'Aplicando' : 'Consultando'} lote ${index + 1} de ${batches.length}`)
      try {
        const results = await fnsSyncService.syncAmendments(
          batch.map((amendment) => amendment.id),
          { apply, requestYear: Number(year), batchId },
        )
        allResults.push(...results)
      } catch (error: any) {
        allResults.push(...batch.map((amendment) => ({
          emenda_id: amendment.id,
          numero_proposta: amendment.numero_proposta || '',
          success: false,
          error: error?.message || 'Falha ao consultar o lote.',
        })))
      }
      setProgress(Math.round(((index + 1) / batches.length) * 100))
    }

    return allResults
  }

  const loadAmendments = async (onlyIds?: string[]) => {
    let query = supabase
      .from('emendas')
      .select('id,numero_proposta,numero_emenda,parlamentar,situacao,status_interno,portaria,valor_total')
      .eq('ano_exercicio', Number(year))
      .not('numero_proposta', 'is', null)
      .order('numero_proposta')
    if (onlyIds?.length) query = query.in('id', onlyIds)
    const { data, error } = await query
    if (error) throw error
    return (data || []).filter((item) => item.numero_proposta?.trim()) as AmendmentSummary[]
  }

  const handlePreview = async (onlyErrors = false) => {
    setIsPreviewing(true)
    setProgress(0)
    setSelectedIds(new Set())
    try {
      const failedIds = onlyErrors
        ? rows.filter((row) => !row.result.success).map((row) => row.amendment.id)
        : undefined
      const amendments = await loadAmendments(failedIds)
      if (!amendments.length) {
        toast({ title: onlyErrors ? 'Nenhum erro para repetir' : 'Nenhuma proposta encontrada neste ano.' })
        return
      }
      const results = await runBatches(amendments, false, createBatchId())
      const resultMap = new Map(results.map((result) => [result.emenda_id, result]))
      const nextRows = amendments.map((amendment) => ({
        amendment,
        result: resultMap.get(amendment.id) || {
          emenda_id: amendment.id,
          numero_proposta: amendment.numero_proposta || '',
          success: false,
          error: 'O lote não retornou esta proposta.',
        },
      }))
      setRows((current) => onlyErrors
        ? current.map((row) => nextRows.find((next) => next.amendment.id === row.amendment.id) || row)
        : nextRows)
      setFilter(onlyErrors ? 'errors' : 'changes')
      toast({
        title: 'Consulta FNS concluída',
        description: `${amendments.length} proposta(s) consultada(s). Nenhuma informação foi aplicada.`,
      })
    } catch (error: any) {
      toast({ title: 'Falha ao preparar sincronização', description: error.message, variant: 'destructive' })
    } finally {
      setIsPreviewing(false)
      setProgressLabel('')
    }
  }

  const handleApply = async () => {
    const amendments = rows
      .filter((row) => selectedIds.has(row.amendment.id))
      .map((row) => row.amendment)
    if (!amendments.length) return

    setConfirmOpen(false)
    setIsApplying(true)
    setProgress(0)
    try {
      const results = await runBatches(amendments, true, createBatchId())
      const resultMap = new Map(results.map((result) => [result.emenda_id, result]))
      setRows((current) => current.map((row) => {
        const result = resultMap.get(row.amendment.id)
        return result ? { ...row, result } : row
      }))
      setSelectedIds(new Set())
      const failures = results.filter((result) => !result.success).length
      toast({
        title: 'Atualização em massa concluída',
        description: `${results.length - failures} proposta(s) atualizada(s)${failures ? ` e ${failures} falha(s)` : ''}.`,
        variant: failures ? 'destructive' : 'default',
      })
    } finally {
      setIsApplying(false)
      setProgressLabel('')
    }
  }

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const busy = isPreviewing || isApplying

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-2 sm:grid-cols-[180px_auto] sm:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ano de exercício</label>
            <Select value={year} onValueChange={(value) => { setYear(value); setRows([]); setSelectedIds(new Set()) }} disabled={busy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handlePreview(false)} disabled={busy} className="gap-2">
            {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
            Consultar FNS
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.errors > 0 && (
            <Button variant="outline" onClick={() => handlePreview(true)} disabled={busy} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Repetir falhas ({counts.errors})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setSelectedIds(new Set(rows.filter(hasChanges).map((row) => row.amendment.id)))}
            disabled={busy || counts.changes === 0}
          >
            Selecionar todas com mudanças
          </Button>
          <Button variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={busy || selectedIds.size === 0}>
            Limpar seleção
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={busy || selectedIds.size === 0} className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Autorizar selecionadas ({selectedIds.size})
          </Button>
        </div>
      </div>

      {busy && (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex justify-between text-sm"><span>{progressLabel}</span><strong>{progress}%</strong></div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {([
              ['changes', 'Com mudanças', counts.changes],
              ['all', 'Todas', counts.all],
              ['unchanged', 'Sem mudanças', counts.unchanged],
              ['conflicts', 'Divergências', counts.conflicts],
              ['errors', 'Erros', counts.errors],
            ] as Array<[ResultFilter, string, number]>).map(([value, label, count]) => (
              <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>
                {label} ({count})
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Selecionar</TableHead>
                  <TableHead>Proposta / Emenda</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Alterações encontradas</TableHead>
                  <TableHead>Portaria / anexo</TableHead>
                  <TableHead>Pagamentos e contas</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.amendment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(row.amendment.id)}
                        disabled={!hasChanges(row) || busy}
                        onCheckedChange={(checked) => toggleSelection(row.amendment.id, checked === true)}
                        aria-label={`Selecionar proposta ${row.amendment.numero_proposta}`}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{row.amendment.numero_proposta}</p>
                      <p className="text-xs text-muted-foreground">Emenda {row.amendment.numero_emenda} · {row.amendment.parlamentar}</p>
                    </TableCell>
                    <TableCell>
                      <p>{row.amendment.situacao}</p>
                      <p className="text-xs text-muted-foreground">FNS: {row.result.official?.situacao?.descricaoSituacaoproposta || 'Não informado'}</p>
                    </TableCell>
                    <TableCell className="max-w-[280px] whitespace-normal">
                      <p>{changeSummary(row)}</p>
                    </TableCell>
                    <TableCell className="max-w-[260px] whitespace-normal text-xs">
                      {(row.result.attachments || []).length ? row.result.attachments?.map((attachment, index) => (
                        <div key={index}>
                          <a className="text-primary underline-offset-2 hover:underline" href={String(attachment.url)} target="_blank" rel="noreferrer">
                            {String(attachment.filename || 'Portaria encontrada')}
                          </a>
                          <p className="text-muted-foreground">{attachment.action === 'insert' ? 'Novo anexo' : 'Já cadastrado'}</p>
                        </div>
                      )) : 'Nenhuma portaria encontrada'}
                    </TableCell>
                    <TableCell className="max-w-[330px] whitespace-normal text-xs">
                      <p>{paymentSummary(row)}</p>
                      <p className="mt-1 text-muted-foreground">Contas FNS: {bankAccountSummary(row)}</p>
                    </TableCell>
                    <TableCell>
                      {!row.result.success ? (
                        <div className="flex items-start gap-2 text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="text-xs">{row.result.error}</span></div>
                      ) : hasConflict(row) ? (
                        <div className="space-y-1"><Badge variant="outline" className="border-amber-300 text-amber-700">Divergência preservada</Badge><p className="text-xs text-muted-foreground">{Object.keys(row.result.conflicts || {}).map((key) => FIELD_LABELS[key] || key).join(', ')}</p></div>
                      ) : hasChanges(row) ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Aguardando autorização</Badge>
                      ) : row.result.applied ? (
                        <div className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><span>Atualizada</span></div>
                      ) : (
                        <Badge variant="outline">Sem mudanças</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!rows.length && !busy && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Selecione o ano e consulte o FNS. A consulta cria apenas um registro de auditoria; os dados das emendas só mudam após autorização.
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Autorizar atualização em massa?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão aplicados os dados oficiais do FNS em {selectedIds.size} proposta(s). Divergências protegidas continuarão preservadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply}>Autorizar atualização</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
