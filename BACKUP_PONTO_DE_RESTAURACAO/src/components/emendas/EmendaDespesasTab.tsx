import { useState, forwardRef, useImperativeHandle } from 'react'
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Despesa, Destination, AuditCategories } from '@/lib/mock-data'
import { StatusBadge } from '@/components/StatusBadge'
import { ExpenseDossierDrawer } from './ExpenseDossierDrawer'
import { formatCurrencyBRL } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatDateToDB, formatDisplayDate } from '@/lib/date-utils'
import { supabase } from '@/lib/supabase/client'

interface EmendaDespesasTabProps {
  despesas: Despesa[]
  destinations?: { actionName: string; items: Destination[] }[]
  onDespesasChange: (despesas: Despesa[]) => void
  emendaId: string
  tipoRecurso?: string
}

export interface EmendaDespesasTabHandles {
  triggerAdd: () => void
}

export const EmendaDespesasTab = forwardRef<
  EmendaDespesasTabHandles,
  EmendaDespesasTabProps
>(
  (
    {
      despesas,
      destinations = [],
      onDespesasChange,
      emendaId,
      tipoRecurso = 'OUTRO',
    },
    ref,
  ) => {
    const { toast } = useToast()
    const { user, checkPermission } = useAuth()
    const { isPrivacyMode } = usePrivacy()
    const [dossierExpense, setDossierExpense] = useState<Despesa | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<Despesa | null>(null)

    // Form state
    const [formData, setFormData] = useState<Partial<Despesa>>({})

    // Security
    const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

    useImperativeHandle(ref, () => ({
      triggerAdd: () => {
        if (!canEdit) return
        setSelectedExpense(null)
        setFormData({
          data: formatDateToDB(new Date()),
          status_execucao: 'PLANEJADA',
          valor: 0,
          categoria: AuditCategories.SERVICOS_TERCEIROS,
        })
        setIsFormOpen(true)
      },
    }))

    const handleAddNew = () => {
      setSelectedExpense(null)
      setFormData({
        data: formatDateToDB(new Date()),
        status_execucao: 'PLANEJADA',
        valor: 0,
        categoria: AuditCategories.SERVICOS_TERCEIROS,
      })
      setIsFormOpen(true)
    }

    const handleEdit = (despesa: Despesa) => {
      setSelectedExpense(despesa)
      setFormData({
        ...despesa,
        data: despesa.data,
      })
      setIsFormOpen(true)
    }

    const handleDelete = (despesa: Despesa) => {
      setSelectedExpense(despesa)
      setIsDeleteOpen(true)
    }

    const handleConfirmDelete = async () => {
      if (!selectedExpense) return
      setIsSubmitting(true)

      try {
        const { error } = await supabase
          .from('despesas')
          .delete()
          .eq('id', selectedExpense.id)

        if (error) throw error

        toast({ title: 'Despesa excluída com sucesso!' })
        onDespesasChange([]) // Trigger refresh
      } catch (error: any) {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsSubmitting(false)
        setIsDeleteOpen(false)
        setSelectedExpense(null)
      }
    }

    const handleSave = async () => {
      if (!formData.descricao || !formData.valor || !formData.data) {
        toast({
          title: 'Erro',
          description:
            'Preencha os campos obrigatórios (Data, Descrição, Valor).',
          variant: 'destructive',
        })
        return
      }

      if (!formData.destinacao_id) {
        toast({
          title: 'Destinação Obrigatória',
          description:
            'Por favor, selecione a qual item do planejamento (Destinação) esta despesa se refere.',
          variant: 'destructive',
        })
        return
      }

      setIsSubmitting(true)
      try {
        const payload = {
          emenda_id: emendaId,
          data: formData.data!,
          valor: Number(formData.valor),
          descricao: formData.descricao!,
          status_execucao: formData.status_execucao || 'PLANEJADA',
          categoria: formData.categoria || AuditCategories.OUTROS,
          fornecedor_nome: formData.fornecedor_nome || '',
          unidade_destino: formData.unidade_destino || '',
          registrada_por: selectedExpense?.registrada_por
            ? undefined
            : user?.id, // Only set if creating
          demanda: formData.demanda,
          destinacao_id: formData.destinacao_id,
        }

        if (selectedExpense) {
          // Update
          const { error } = await supabase
            .from('despesas')
            .update(payload as any)
            .eq('id', selectedExpense.id)

          if (error) throw error
          toast({ title: 'Despesa atualizada com sucesso!' })
        } else {
          // Insert
          const { error } = await supabase
            .from('despesas')
            .insert({ ...payload, registrada_por: user?.id } as any)

          if (error) throw error
          toast({ title: 'Despesa adicionada com sucesso!' })
        }

        setIsFormOpen(false)
        onDespesasChange([]) // Trigger parent refresh
      } catch (error: any) {
        console.error(error)
        toast({
          title: 'Erro ao salvar despesa',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    // Conditional Categories
    const availableCategories = Object.values(AuditCategories).filter((cat) => {
      if (cat === AuditCategories.EQUIPAMENTOS) {
        // Safe check for tipoRecurso which might be passed as undefined initially
        return tipoRecurso === 'EQUIPAMENTO'
      }
      return true
    })

    return (
      <>
        <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200">
                Despesas
              </CardTitle>
              {canEdit && (
                <Button size="sm" onClick={handleAddNew}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Despesa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!despesas || despesas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma despesa registrada.
              </div>
            ) : (
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas.map((despesa) => (
                      <TableRow key={despesa.id}>
                        <TableCell>{formatDisplayDate(despesa.data)}</TableCell>
                        <TableCell className="font-medium">
                          {despesa.descricao || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {despesa.categoria || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={despesa.status_execucao as any}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrencyBRL(despesa.valor || 0, isPrivacyMode)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => setDossierExpense(despesa)}
                              >
                                <FileText className="mr-2 h-4 w-4" /> Dossiê
                              </DropdownMenuItem>
                              {canEdit && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(despesa)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(despesa)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <ExpenseDossierDrawer
          expense={dossierExpense}
          isOpen={!!dossierExpense}
          onOpenChange={(open) => !open && setDossierExpense(null)}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedExpense ? 'Editar Despesa' : 'Adicionar Despesa'}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para registrar a despesa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data" className="text-right">
                  Data *
                </Label>
                <Input
                  id="data"
                  type="date"
                  className="col-span-3"
                  value={formData.data || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">
                  Descrição *
                </Label>
                <Input
                  id="descricao"
                  className="col-span-3"
                  value={formData.descricao || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right">
                  Categoria (Auditoria)
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destinacao" className="text-right">
                  Destinação (Planejamento) *
                </Label>
                <Select
                  value={formData.destinacao_id || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, destinacao_id: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a destinação planejada" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((group) => (
                      <SelectGroup key={group.actionName}>
                        <SelectLabel>{group.actionName}</SelectLabel>
                        {group.items.map((dest) => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.tipo_destinacao} -{' '}
                            {formatCurrencyBRL(dest.valor_destinado)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor" className="text-right">
                  Valor *
                </Label>
                <div className="col-span-3">
                  <MoneyInput
                    value={formData.valor || 0}
                    onChange={(value) =>
                      setFormData({ ...formData, valor: value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status_execucao}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status_execucao: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANEJADA">Planejada</SelectItem>
                    <SelectItem value="EMPENHADA">Empenhada</SelectItem>
                    <SelectItem value="LIQUIDADA">Liquidada</SelectItem>
                    <SelectItem value="PAGA">Paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fornecedor" className="text-right">
                  Fornecedor
                </Label>
                <Input
                  id="fornecedor"
                  className="col-span-3"
                  value={formData.fornecedor_nome || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fornecedor_nome: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a despesa "
                {selectedExpense?.descricao}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  },
)

EmendaDespesasTab.displayName = 'EmendaDespesasTab'
