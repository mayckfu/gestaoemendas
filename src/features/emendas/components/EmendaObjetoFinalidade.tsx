import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Save, X, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ExpandableText } from '@/components/ui/expandable-text'

interface EmendaObjetoFinalidadeProps {
  description: string | null | undefined
  onSave: (description: string) => void
}

export const EmendaObjetoFinalidade = ({
  description,
  onSave,
}: EmendaObjetoFinalidadeProps) => {
  const { checkPermission } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(description || '')

  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  useEffect(() => {
    setText(description || '')
  }, [description])

  const handleSave = () => {
    onSave(text)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setText(description || '')
    setIsEditing(false)
  }

  return (
    <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200 text-lg">
            Objeto e Finalidade (Descrição Completa)
          </CardTitle>
        </div>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        {isEditing ? (
          <Textarea
            value={text || ''}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px] font-normal leading-relaxed resize-y"
            placeholder="Descreva detalhadamente o objeto e a finalidade desta emenda..."
          />
        ) : (
          <div className="bg-neutral-50 dark:bg-neutral-900/30 rounded-lg p-4 border border-transparent hover:border-neutral-100 transition-colors">
            <ExpandableText text={text} limit={400} />
            {!text && (
              <span className="text-neutral-400 italic text-sm">
                Nenhuma descrição detalhada informada.
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
