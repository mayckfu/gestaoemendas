import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pendencia } from '@/lib/mock-data'

interface DismissPendencyDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  pendency: Pendencia | null
  onConfirm: (justification: string) => void
}

export const DismissPendencyDialog = ({
  isOpen,
  onOpenChange,
  pendency,
  onConfirm,
}: DismissPendencyDialogProps) => {
  const [justification, setJustification] = useState('')

  const handleConfirm = () => {
    onConfirm(justification)
    setJustification('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setJustification('')
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispensar Pendência</DialogTitle>
          <DialogDescription>
            Você está prestes a dispensar a pendência "{pendency?.descricao}".
            Esta ação moverá o item para a lista de concluídos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="justification">Justificativa (Opcional)</Label>
          <Textarea
            id="justification"
            placeholder="Descreva o motivo da dispensa..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Dispensa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
