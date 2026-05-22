import { useEffect, useState, useCallback } from 'react'
import {
  Brain,
  Plus,
  Trash2,
  Check,
  X,
  Archive,
  RotateCcw,
  Loader2,
  Sparkles,
  Lightbulb,
  BookOpen,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  memoriesService,
  type LauraMemory,
  type LauraSuggestion,
  type MemoryType,
} from '../services/memoriesService'

const TYPE_LABELS: Record<MemoryType, string> = {
  preference: 'Preferência',
  rule: 'Regra',
  synonym: 'Sinônimo',
  decision: 'Decisão',
  follow_up: 'Acompanhamento',
  correction: 'Correção',
}

const TYPE_COLORS: Record<MemoryType, string> = {
  preference: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  rule: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  synonym: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  decision: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  follow_up: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  correction: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

function ImportanceStars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" title={`Importância: ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < value ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function LauraMemoriesTab() {
  const { toast } = useToast()
  const [memories, setMemories] = useState<LauraMemory[]>([])
  const [suggestions, setSuggestions] = useState<LauraSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // New memory form
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<MemoryType>('preference')
  const [showArchived, setShowArchived] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [mems, sugs] = await Promise.all([
        memoriesService.fetchMemories(),
        memoriesService.fetchSuggestions(),
      ])
      setMemories(mems)
      setSuggestions(sugs)
    } catch (err) {
      console.error('Error loading memories data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateMemory = async () => {
    if (!newContent.trim()) return
    setIsSaving(true)
    try {
      await memoriesService.createMemory(newContent.trim(), newType)
      setNewContent('')
      setNewType('preference')
      await loadData()
      toast({ title: 'Memória criada', description: 'A Laura vai lembrar disso nas próximas conversas.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro ao criar memória', description: message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await memoriesService.updateMemoryStatus(id, 'archived')
      await loadData()
      toast({ title: 'Memória arquivada' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await memoriesService.updateMemoryStatus(id, 'active')
      await loadData()
      toast({ title: 'Memória restaurada' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await memoriesService.deleteMemory(id)
      await loadData()
      toast({ title: 'Memória excluída' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    }
  }

  const handleApproveSuggestion = async (suggestion: LauraSuggestion) => {
    try {
      await memoriesService.approveSuggestion(suggestion)
      await loadData()
      toast({ title: 'Sugestão aprovada', description: 'Uma nova memória foi criada com base nessa sugestão.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    }
  }

  const handleRejectSuggestion = async (id: string) => {
    try {
      await memoriesService.rejectSuggestion(id)
      await loadData()
      toast({ title: 'Sugestão rejeitada' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    }
  }

  const activeMemories = memories.filter(m => m.status === 'active')
  const archivedMemories = memories.filter(m => m.status === 'archived')
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <span className="ml-2 text-neutral-500">Carregando memórias...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header description */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/30">
        <Brain className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
        <div className="text-sm text-brand-800 dark:text-brand-300">
          <p className="font-medium mb-1">Como funciona a memória da Laura?</p>
          <p className="text-brand-600 dark:text-brand-400">
            A Laura usa essas memórias para personalizar suas respostas. Você pode criar memórias manualmente
            (ex: &ldquo;Sempre agrupe por estado&rdquo;) ou aprovar sugestões que a Laura identifica durante as conversas.
          </p>
        </div>
      </div>

      {/* Pending Suggestions */}
      {pendingSuggestions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Sugestões da Laura ({pendingSuggestions.length})
            </CardTitle>
            <CardDescription>
              A Laura identificou estas preferências durante suas conversas. Aprove ou rejeite cada uma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/50 dark:border-amber-800/30 group"
              >
                <Sparkles className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">{suggestion.suggested_content}</p>
                  {suggestion.reason && (
                    <p className="text-xs text-neutral-500 mt-1 italic">{suggestion.reason}</p>
                  )}
                  <Badge className={`mt-1.5 text-xs ${TYPE_COLORS[suggestion.suggested_type as MemoryType]}`}>
                    {TYPE_LABELS[suggestion.suggested_type as MemoryType] || suggestion.suggested_type}
                  </Badge>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => handleApproveSuggestion(suggestion)}
                    title="Aprovar"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    title="Rejeitar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create new memory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Memória Manual
          </CardTitle>
          <CardDescription>
            Ensine a Laura uma preferência, regra ou sinônimo que ela deve lembrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={newType} onValueChange={(v) => setNewType(v as MemoryType)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Ex: Sempre agrupe emendas por estado nas análises"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateMemory()}
            />
            <Button
              onClick={handleCreateMemory}
              disabled={!newContent.trim() || isSaving}
              className="shrink-0"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Memories */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Memórias Ativas ({activeMemories.length})
            </CardTitle>
            {archivedMemories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-neutral-500"
              >
                <Archive className="h-3.5 w-3.5 mr-1" />
                {showArchived ? 'Ocultar' : 'Ver'} arquivadas ({archivedMemories.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeMemories.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Brain className="h-10 w-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm">Nenhuma memória ativa ainda.</p>
              <p className="text-xs mt-1">Crie uma memória acima ou converse com a Laura para que ela sugira automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMemories.map(memory => (
                <div
                  key={memory.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group"
                >
                  <Tag className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">{memory.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`text-xs ${TYPE_COLORS[memory.type]}`}>
                        {TYPE_LABELS[memory.type]}
                      </Badge>
                      <ImportanceStars value={memory.importance} />
                      <span className="text-xs text-neutral-400">
                        {new Date(memory.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-amber-600"
                      onClick={() => handleArchive(memory.id)}
                      title="Arquivar"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir memória?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa memória será permanentemente removida e a Laura não poderá mais consultá-la.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(memory.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archived memories section */}
          {showArchived && archivedMemories.length > 0 && (
            <div className="mt-6 pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Arquivadas</p>
              <div className="space-y-2">
                {archivedMemories.map(memory => (
                  <div
                    key={memory.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/30 opacity-70 group"
                  >
                    <Tag className="h-4 w-4 text-neutral-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-through">{memory.content}</p>
                      <Badge className={`mt-1.5 text-xs ${TYPE_COLORS[memory.type]}`}>
                        {TYPE_LABELS[memory.type]}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-emerald-600"
                        onClick={() => handleRestore(memory.id)}
                        title="Restaurar"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(memory.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
