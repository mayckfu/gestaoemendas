import { useState } from 'react'
import { DetailedAmendment } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EmendaActionItem } from './EmendaActionItem'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrencyBRL } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { EmendaActionForm } from './EmendaActionForm'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface EmendaPlanejamentoTabProps {
  emenda: DetailedAmendment
  onUpdate: () => void
}

export const EmendaPlanejamentoTab = ({
  emenda,
  onUpdate,
}: EmendaPlanejamentoTabProps) => {
  const { checkPermission } = useAuth()
  const { isPrivacyMode } = usePrivacy()
  const [isActionOpen, setIsActionOpen] = useState(false)

  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const totalDestinado = emenda.acoes.reduce(
    (acc, a) =>
      acc + a.destinacoes.reduce((dAcc, d) => dAcc + d.valor_destinado, 0),
    0,
  )
  const percentDestinado =
    emenda.valor_total > 0 ? (totalDestinado / emenda.valor_total) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-muted/30 border border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">
            Resumo do Planejamento
          </h3>
          <span className="text-sm font-medium tabular-nums">
            {formatCurrencyBRL(totalDestinado, isPrivacyMode)} /{' '}
            {formatCurrencyBRL(emenda.valor_total, isPrivacyMode)}
          </span>
        </div>
        <div className="space-y-1">
          <Progress value={percentDestinado} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {percentDestinado.toFixed(1)}% alocado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emenda.acoes.map((action) => (
          <EmendaActionItem
            key={action.id}
            action={action}
            emenda={emenda}
            onUpdate={onUpdate}
          />
        ))}
        {canEdit && (
          <Button
            variant="outline"
            className="h-full min-h-[150px] border-dashed flex flex-col gap-2 hover:bg-muted/50"
            onClick={() => setIsActionOpen(true)}
          >
            <Plus className="h-6 w-6" />
            <span>Adicionar Nova Ação</span>
          </Button>
        )}
      </div>

      <EmendaActionForm
        isOpen={isActionOpen}
        onOpenChange={setIsActionOpen}
        emenda={emenda}
        onSuccess={onUpdate}
      />
    </div>
  )
}
