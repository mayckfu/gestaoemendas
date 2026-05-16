import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import {
  DetailedAmendment,
  ActionWithDestinations,
  AuditCategories,
  Destination,
} from '@/lib/mock-data'
import { formatCurrencyBRL, cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface EmendaActionFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  emenda: DetailedAmendment
  action?: ActionWithDestinations | null // If present, edit mode
  onSuccess: () => void
}

export const EmendaActionForm = ({
  isOpen,
  onOpenChange,
  emenda,
  action,
  onSuccess,
}: EmendaActionFormProps) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Action Fields
  const [nome, setNome] = useState('')
  const [area, setArea] = useState('')
  const [descricaoOficial, setDescricaoOficial] = useState('')

  // Financial Categories
  const [valServicos, setValServicos] = useState(0)
  const [valMaterial, setValMaterial] = useState(0)
  const [valDistribuicao, setValDistribuicao] = useState(0)
  const [valEquipamentos, setValEquipamentos] = useState(0)

  const isEquipamento = emenda.tipo_recurso === 'EQUIPAMENTO'

  useEffect(() => {
    if (isOpen) {
      if (action) {
        // Edit Mode: Pre-fill
        setNome(action.nome_acao)
        setArea(action.area)
        setDescricaoOficial(action.descricao_oficial || '')

        // Find values for specific categories
        const servicos = action.destinacoes.find(
          (d) => d.tipo_destinacao === AuditCategories.SERVICOS_TERCEIROS,
        )
        const material = action.destinacoes.find(
          (d) => d.tipo_destinacao === AuditCategories.MATERIAL_CONSUMO,
        )
        const distribuicao = action.destinacoes.find(
          (d) => d.tipo_destinacao === AuditCategories.DISTRIBUICAO_GRATUITA,
        )
        const equipamentos = action.destinacoes.find(
          (d) => d.tipo_destinacao === AuditCategories.EQUIPAMENTOS,
        )

        setValServicos(servicos?.valor_destinado || 0)
        setValMaterial(material?.valor_destinado || 0)
        setValDistribuicao(distribuicao?.valor_destinado || 0)
        setValEquipamentos(equipamentos?.valor_destinado || 0)
      } else {
        // Create Mode: Reset
        setNome('')
        setArea('')
        setDescricaoOficial('')
        setValServicos(0)
        setValMaterial(0)
        setValDistribuicao(0)
        setValEquipamentos(0)
      }
    }
  }, [isOpen, action])

  // Calculate totals and balance
  const totalPlanned =
    valServicos + valMaterial + valDistribuicao + valEquipamentos

  const calculateBalance = () => {
    const totalEmenda = emenda.valor_total

    // 1. Calculate usage by OTHER actions
    const otherActionsUsage = emenda.acoes.reduce((acc, a) => {
      // If we are editing 'action', skip it to simulate returning its value to pool
      if (action && a.id === action.id) return acc

      const actionTotal = a.destinacoes.reduce(
        (dAcc, d) => dAcc + d.valor_destinado,
        0,
      )
      return acc + actionTotal
    }, 0)

    // 2. Calculate usage by THIS action's NON-EDITABLE categories (if any)
    // The form edits: SERVICOS_TERCEIROS, MATERIAL_CONSUMO, DISTRIBUICAO_GRATUITA, EQUIPAMENTOS (if allowed)
    // Any other category in the current action persists and counts against budget
    let currentActionFixedUsage = 0
    if (action) {
      currentActionFixedUsage = action.destinacoes.reduce((acc, d) => {
        const isEditable = [
          AuditCategories.SERVICOS_TERCEIROS,
          AuditCategories.MATERIAL_CONSUMO,
          AuditCategories.DISTRIBUICAO_GRATUITA,
          AuditCategories.EQUIPAMENTOS,
        ].includes(d.tipo_destinacao as any)

        return isEditable ? acc : acc + d.valor_destinado
      }, 0)
    }

    // Available to allocate for this action (considering fixed parts as used)
    const available = totalEmenda - otherActionsUsage - currentActionFixedUsage
    const remaining = available - totalPlanned

    return { available, remaining }
  }

  const { available, remaining } = calculateBalance()
  const isOverBudget = remaining < 0

  const handleSave = async () => {
    if (!nome || !area) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o Nome e a Área da ação.',
        variant: 'destructive',
      })
      return
    }

    if (isOverBudget) {
      toast({
        title: 'Orçamento excedido',
        description:
          'O valor total planejado excede o saldo disponível da emenda.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      let actionId = action?.id

      // 1. Create or Update Action
      const actionPayload = {
        nome_acao: nome,
        area: area,
        descricao_oficial: descricaoOficial,
      }

      if (action) {
        const { error } = await supabase
          .from('acoes_emendas')
          .update(actionPayload)
          .eq('id', action.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('acoes_emendas')
          .insert({
            ...actionPayload,
            emenda_id: emenda.id,
            complexidade: 'Média', // Default
          })
          .select()
          .single()
        if (error) throw error
        actionId = data.id
      }

      if (!actionId) throw new Error('Falha ao identificar a Ação.')

      // 2. Upsert Destinations
      // Function to handle each category
      const handleDestination = async (
        category: string,
        value: number,
        existingDestinations: Destination[] = [],
      ) => {
        const existing = existingDestinations.find(
          (d) => d.tipo_destinacao === category,
        )

        if (value > 0) {
          const payload = {
            acao_id: actionId,
            tipo_destinacao: category,
            valor_destinado: value,
            grupo_despesa: category, // Mapping strict labels to both fields
            subtipo: existing?.subtipo || null,
            portaria_vinculada: existing?.portaria_vinculada || null,
            observacao_tecnica: existing?.observacao_tecnica || null,
          }

          if (existing) {
            const { error } = await supabase
              .from('destinacoes_recursos')
              .update(payload)
              .eq('id', existing.id)
            if (error) throw error
          } else {
            const { error } = await supabase
              .from('destinacoes_recursos')
              .insert(payload)
            if (error) throw error
          }
        } else if (existing) {
          // If value is 0 and it existed, delete it
          const { error } = await supabase
            .from('destinacoes_recursos')
            .delete()
            .eq('id', existing.id)
          if (error) throw error
        }
      }

      const currentDests = action?.destinacoes || []

      const promises = [
        handleDestination(
          AuditCategories.SERVICOS_TERCEIROS,
          valServicos,
          currentDests,
        ),
        handleDestination(
          AuditCategories.MATERIAL_CONSUMO,
          valMaterial,
          currentDests,
        ),
        handleDestination(
          AuditCategories.DISTRIBUICAO_GRATUITA,
          valDistribuicao,
          currentDests,
        ),
      ]

      if (isEquipamento) {
        promises.push(
          handleDestination(
            AuditCategories.EQUIPAMENTOS,
            valEquipamentos,
            currentDests,
          ),
        )
      }

      await Promise.all(promises)

      toast({
        title: action ? 'Ação atualizada' : 'Ação criada',
        description: 'Os dados foram salvos com sucesso.',
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao salvar',
        description:
          error.message || 'Ocorreu um erro ao processar a solicitação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? 'Editar Ação' : 'Nova Ação de Emenda'}
          </DialogTitle>
          <DialogDescription>
            Defina os detalhes da ação e o planejamento financeiro por
            categoria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Action Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-none text-muted-foreground border-b pb-2">
              Dados da Ação
            </h4>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Eixo / Ação</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cirurgias Eletivas"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Área</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ex: Atenção Especializada"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição Oficial</Label>
                <Textarea
                  id="descricao"
                  value={descricaoOficial}
                  onChange={(e) => setDescricaoOficial(e.target.value)}
                  placeholder="Descrição técnica oficial da ação..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Financial Planning */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-none text-muted-foreground border-b pb-2 flex justify-between items-end">
              <span>Planejamento Financeiro</span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-muted-foreground">
                  Disponível: {formatCurrencyBRL(available)}
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    isOverBudget ? 'text-destructive' : 'text-emerald-600',
                  )}
                >
                  Restante: {formatCurrencyBRL(remaining)}
                </span>
              </div>
            </h4>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="servicos" className="flex justify-between">
                  <span>Serviços Terceiros (PJ)</span>
                </Label>
                <MoneyInput
                  id="servicos"
                  value={valServicos}
                  onChange={setValServicos}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="material">Material de Consumo</Label>
                <MoneyInput
                  id="material"
                  value={valMaterial}
                  onChange={setValMaterial}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="distribuicao">Distribuição Gratuita</Label>
                <MoneyInput
                  id="distribuicao"
                  value={valDistribuicao}
                  onChange={setValDistribuicao}
                />
              </div>

              {isEquipamento && (
                <div className="grid gap-2 animate-fade-in">
                  <Label htmlFor="equipamentos">
                    Equipamentos e Material Permanente
                  </Label>
                  <MoneyInput
                    id="equipamentos"
                    value={valEquipamentos}
                    onChange={setValEquipamentos}
                  />
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center border">
              <span className="text-sm font-semibold">Valor Total da Ação</span>
              <span className="text-base font-bold text-primary">
                {formatCurrencyBRL(totalPlanned)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || isOverBudget}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
