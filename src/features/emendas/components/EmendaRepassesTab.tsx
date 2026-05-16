import { useState, forwardRef, useImperativeHandle } from 'react'
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
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
import { Repasse } from '@/lib/mock-data'
import { formatCurrencyBRL } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatDisplayDate } from '@/lib/date-utils'
import { RepasseForm } from './RepasseForm'
import { supabase } from '@/lib/supabase/client'

interface EmendaRepassesTabProps {
  repasses: Repasse[]
  onRepassesChange: (repasses: Repasse[]) => void
  emendaId: string
}

export interface EmendaRepassesTabHandles {
  triggerAdd: () => void
}

export const EmendaRepassesTab = forwardRef<
  EmendaRepassesTabHandles,
  EmendaRepassesTabProps
>(({ repasses, onRepassesChange, emendaId }, ref) => {
  const { toast } = useToast()
  const { checkPermission } = useAuth()
  const { isPrivacyMode } = usePrivacy()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRepasse, setSelectedRepasse] = useState<Repasse | null>(null)

  // Security
  const canEdit = checkPermission(['ADMIN', 'GESTOR'])

  useImperativeHandle(ref, () => ({
    triggerAdd: () => {
      if (!canEdit) return
      setSelectedRepasse(null)
      setIsFormOpen(true)
    },
  }))

  const handleAddNew = () => {
    setSelectedRepasse(null)
    setIsFormOpen(true)
  }

  const handleEdit = (repasse: Repasse) => {
    setSelectedRepasse(repasse)
    setIsFormOpen(true)
  }

  const handleDelete = (repasse: Repasse) => {
    setSelectedRepasse(repasse)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRepasse) return

    try {
      const { error } = await supabase
        .from('repasses')
        .delete()
        .eq('id', selectedRepasse.id)

      if (error) throw error

      toast({ title: 'Repasse excluído com sucesso!' })
      // Trigger refresh in parent
      onRepassesChange(repasses.filter((r) => r.id !== selectedRepasse.id))
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleteOpen(false)
      setSelectedRepasse(null)
    }
  }

  const handleSave = async (repasse: Repasse) => {
    try {
      const payload = {
        data: repasse.data,
        valor: repasse.valor,
        fonte: repasse.fonte,
        status: repasse.status,
        observacoes: repasse.observacoes,
        ordem_bancaria: repasse.ordem_bancaria,
        emenda_id: emendaId,
      }

      if (selectedRepasse && selectedRepasse.id) {
        // Update
        const { error } = await supabase
          .from('repasses')
          .update(payload as any)
          .eq('id', selectedRepasse.id)

        if (error) throw error
        toast({ title: 'Repasse atualizado com sucesso!' })
      } else {
        // Insert
        const { error } = await supabase.from('repasses').insert(payload as any)

        if (error) throw error
        toast({ title: 'Repasse adicionado com sucesso!' })
      }

      setIsFormOpen(false)
      // Trigger refresh in parent
      onRepassesChange([])
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPASSADO':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  return (
    <>
      <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200">
              Repasses
            </CardTitle>
            {canEdit && (
              <Button size="sm" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Repasse
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {repasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum repasse registrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Ordem Bancária</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repasses.map((repasse) => (
                  <TableRow key={repasse.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        {formatDisplayDate(repasse.data)}
                      </div>
                    </TableCell>
                    <TableCell>{repasse.fonte}</TableCell>
                    <TableCell>
                      {repasse.ordem_bancaria || (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(repasse.status)}
                      >
                        {repasse.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrencyBRL(repasse.valor, isPrivacyMode)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEdit(repasse)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(repasse)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRepasse ? 'Editar Repasse' : 'Novo Repasse'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do repasse financeiro.
            </DialogDescription>
          </DialogHeader>
          <RepasseForm
            repasse={selectedRepasse}
            onSubmit={handleSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este repasse? Esta ação não pode
              ser desfeita e afetará o saldo total repassado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
