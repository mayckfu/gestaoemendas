import { useState } from 'react'
import { Edit2, Trash2, Activity, MapPin } from 'lucide-react'
import { ActionWithDestinations, DetailedAmendment } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrencyBRL } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { EmendaActionForm } from './EmendaActionForm'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface EmendaActionItemProps {
  action: ActionWithDestinations
  emenda: DetailedAmendment
  onUpdate: () => void
}

export const EmendaActionItem = ({
  action,
  emenda,
  onUpdate,
}: EmendaActionItemProps) => {
  const { checkPermission } = useAuth()
  const { toast } = useToast()
  const { isPrivacyMode } = usePrivacy()
  const [isEditing, setIsEditing] = useState(false)
  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const handleDelete = async () => {
    if (
      confirm(
        'Tem certeza que deseja excluir esta ação e todas as suas destinações?',
      )
    ) {
      try {
        const { error } = await supabase
          .from('acoes_emendas')
          .delete()
          .eq('id', action.id)

        if (error) throw error

        toast({ title: 'Ação excluída com sucesso!' })
        onUpdate()
      } catch (error: any) {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        })
      }
    }
  }

  const totalDestinado = action.destinacoes.reduce(
    (acc, curr) => acc + curr.valor_destinado,
    0,
  )

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow relative">
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        <CardHeader className="pb-3 pr-16">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {action.area}
            </span>
          </div>
          <CardTitle className="text-base leading-tight">
            {action.nome_acao}
          </CardTitle>
          <div className="text-sm font-bold text-brand-700 mt-1">
            {formatCurrencyBRL(totalDestinado, isPrivacyMode)}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pt-0">
          <div className="space-y-4">
            {action.descricao_oficial && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {action.descricao_oficial}
              </p>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 border-b pb-1">
                <MapPin className="h-3.5 w-3.5" /> Destinações (
                {action.destinacoes.length})
              </h4>
              {action.destinacoes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Nenhuma destinação vinculada.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {action.destinacoes.map((dest) => (
                    <li
                      key={dest.id}
                      className="flex flex-col bg-muted/30 p-2 rounded-md"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-foreground">
                          {dest.tipo_destinacao}
                        </span>
                        <span className="text-xs font-bold text-foreground tabular-nums ml-2">
                          {formatCurrencyBRL(
                            dest.valor_destinado,
                            isPrivacyMode,
                          )}
                        </span>
                      </div>
                      {(dest.subtipo || dest.grupo_despesa) && (
                        <div className="flex gap-2 mt-1">
                          {dest.grupo_despesa && (
                            <span className="text-[10px] text-muted-foreground">
                              Grupo: {dest.grupo_despesa}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EmendaActionForm
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        emenda={emenda}
        initialData={action}
        onSuccess={onUpdate}
      />
    </>
  )
}
