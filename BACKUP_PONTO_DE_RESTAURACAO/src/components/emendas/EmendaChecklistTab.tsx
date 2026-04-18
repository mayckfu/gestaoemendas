import { Check, X, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pendencia } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface EmendaChecklistTabProps {
  pendencias: Pendencia[]
  onPendencyClick: (pendencia: Pendencia) => void
  onDismiss: (id: string, justificativa: string) => void
}

export const EmendaChecklistTab = ({
  pendencias,
  onPendencyClick,
  onDismiss,
}: EmendaChecklistTabProps) => {
  const { checkPermission } = useAuth()
  const [selectedPendency, setSelectedPendency] = useState<Pendencia | null>(
    null,
  )
  const [justificativa, setJustificativa] = useState('')
  const [isDismissOpen, setIsDismissOpen] = useState(false)

  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const handleOpenDismiss = (pendencia: Pendencia) => {
    setSelectedPendency(pendencia)
    setJustificativa('')
    setIsDismissOpen(true)
  }

  const handleConfirmDismiss = () => {
    if (selectedPendency && justificativa) {
      onDismiss(selectedPendency.id, justificativa)
      setIsDismissOpen(false)
      setSelectedPendency(null)
    }
  }

  return (
    <>
      <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200">
            Pendências e Requisitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justificativa</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendencias.map((pendencia) => (
                <TableRow key={pendencia.id}>
                  <TableCell className="font-medium">
                    {pendencia.descricao}
                  </TableCell>
                  <TableCell>
                    {pendencia.resolvida ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Resolvida
                      </Badge>
                    ) : pendencia.dispensada ? (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Dispensada
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pendencia.justificativa || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPendencyClick(pendencia)}
                      >
                        Verificar
                      </Button>
                      {!pendencia.resolvida &&
                        !pendencia.dispensada &&
                        canEdit && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenDismiss(pendencia)}
                          >
                            Dispensar
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDismissOpen} onOpenChange={setIsDismissOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispensar Pendência</DialogTitle>
            <DialogDescription>
              Informe o motivo para dispensar esta pendência.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="justificativa">Justificativa</Label>
              <Input
                id="justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex: Documento entregue fisicamente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDismissOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDismiss} disabled={!justificativa}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
