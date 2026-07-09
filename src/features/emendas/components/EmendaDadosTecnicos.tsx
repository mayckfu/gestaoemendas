import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  DetailedAmendment,
  NaturezaDespesaItem,
  TipoEmenda,
  TipoRecurso,
} from '@/lib/mock-data'
import { Edit2, Save, X, Info, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { MoneyInput } from '@/components/ui/money-input'
import { cn, formatCurrencyBRL } from '@/lib/utils'
import { formatDisplayDate } from '@/lib/date-utils'
import { ExpandableText } from '@/components/ui/expandable-text'

const NATUREZAS_DESPESA = [
  { value: '33.90.30 - Material de Consumo', label: '33.90.30 - Material de Consumo' },
  { value: '33.90.39 - Serviços de Terceiros PJ', label: '33.90.39 - Serviços de Terceiros PJ' },
  { value: '33.90.52 - Equipamentos e Material Permanente', label: '33.90.52 - Equipamentos e Material Permanente' },
  { value: '44.90.51 - Obras e Instalações', label: '44.90.51 - Obras e Instalações' },
  { value: '33.90.36 - Outros Serviços de Terceiros PF', label: '33.90.36 - Outros Serviços de Terceiros PF' },
  { value: '33.90.32 - Material de Distribuição Gratuita', label: '33.90.32 - Material de Distribuição Gratuita' },
  { value: 'Múltiplas Naturezas', label: 'Múltiplas Naturezas' },
]

const normalizeNaturezasDespesa = (
  items?: unknown,
  fallbackNatureza?: string | null,
  fallbackValor?: number | null,
): NaturezaDespesaItem[] => {
  if (Array.isArray(items)) {
    return items
      .map((item: any) => ({
        natureza: String(item?.natureza || '').trim(),
        valor: Number(item?.valor || 0),
      }))
      .filter((item) => item.natureza || item.valor > 0)
  }

  if (fallbackNatureza?.trim()) {
    return [
      {
        natureza: fallbackNatureza.trim(),
        valor: Number(fallbackValor || 0),
      },
    ]
  }

  return []
}

const getNaturezasLegacyText = (items: NaturezaDespesaItem[]) =>
  items
    .map((item) => item.natureza.trim())
    .filter(Boolean)
    .join('; ')

const getCompletedRepasses = (emenda: DetailedAmendment) =>
  [...(emenda.repasses || [])]
    .filter((repasse) => repasse.status === 'REPASSADO')
    .sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    )

const getPaidRepasseDates = (emenda: DetailedAmendment) => {
  const dates = getCompletedRepasses(emenda)
    .map((repasse) => (repasse.data ? formatDisplayDate(repasse.data) : null))
    .filter(Boolean)

  return dates.length > 0 ? dates.join(' | ') : null
}

const getPaidRepasseOrders = (emenda: DetailedAmendment) => {
  const orders = getCompletedRepasses(emenda)
    .map((repasse) => repasse.ordem_bancaria?.trim())
    .filter(Boolean)

  return orders.length > 0 ? orders.join(' | ') : null
}

const getNaturezaPadrao = (tipoRecurso?: string): string => {
  if (!tipoRecurso) return ''
  if (
    tipoRecurso === 'EQUIPAMENTO'
  )
    return '33.90.52 - Equipamentos e Material Permanente'
  if (tipoRecurso === 'CUSTEIO_MAC' || tipoRecurso === 'CUSTEIO_PAP') return '33.90.39 - Serviços de Terceiros PJ'
  if (tipoRecurso === 'INCREMENTO_MAC' || tipoRecurso === 'INCREMENTO_PAP') return '33.90.30 - Material de Consumo'
  return ''
}

interface EmendaDadosTecnicosProps {
  emenda: DetailedAmendment
  onEmendaChange: (emenda: DetailedAmendment) => void
}

export interface EmendaDadosTecnicosHandles {
  triggerEditAndFocus: (fieldId: string) => void
}

const ReadOnlyField = ({
  label,
  value,
  className,
  fullWidth = false,
  isExpandable = false,
}: {
  label: string
  value: string | number | null | undefined
  className?: string
  fullWidth?: boolean
  isExpandable?: boolean
}) => (
  <div
    className={cn(
      'flex flex-col gap-1.5 p-3 rounded-lg border border-transparent hover:bg-neutral-50/80 hover:border-neutral-100 transition-colors',
      fullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : '',
      className,
    )}
  >
    <dt className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
      {label}
    </dt>
    <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
      {isExpandable ? (
        <ExpandableText text={value ? String(value) : null} limit={150} />
      ) : (
        value || <span className="text-muted-foreground/50 italic">-</span>
      )}
    </dd>
  </div>
)

const NaturezasDespesaReadOnly = ({
  items,
  fallbackNatureza,
  fallbackValor,
  isPrivacyMode,
}: {
  items?: NaturezaDespesaItem[]
  fallbackNatureza?: string | null
  fallbackValor?: number | null
  isPrivacyMode: boolean
}) => {
  const naturezas = normalizeNaturezasDespesa(
    items,
    fallbackNatureza,
    fallbackValor,
  )
  const total = naturezas.reduce((sum, item) => sum + Number(item.valor || 0), 0)

  return (
    <div className="col-span-full rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <dt className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
          Natureza da Despesa
        </dt>
        {naturezas.length > 0 && (
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Total: {formatCurrencyBRL(total, isPrivacyMode)}
          </span>
        )}
      </div>

      {naturezas.length === 0 ? (
        <dd className="text-sm font-medium text-muted-foreground/50 italic">
          -
        </dd>
      ) : (
        <dd className="grid gap-2">
          {naturezas.map((item, index) => (
            <div
              key={`${item.natureza}-${index}`}
              className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-background sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {item.natureza || 'Natureza não informada'}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                {formatCurrencyBRL(item.valor || 0, isPrivacyMode)}
              </span>
            </div>
          ))}
        </dd>
      )}
    </div>
  )
}

export const EmendaDadosTecnicos = forwardRef<
  EmendaDadosTecnicosHandles,
  EmendaDadosTecnicosProps
>(({ emenda, onEmendaChange }, ref) => {
  const { checkPermission } = useAuth()
  const { isPrivacyMode } = usePrivacy()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<DetailedAmendment>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  useEffect(() => {
    setFormData({
      ...emenda,
      naturezas_despesa: normalizeNaturezasDespesa(
        emenda.naturezas_despesa,
        emenda.natureza,
        emenda.valor_total,
      ),
    })
  }, [emenda])

  useImperativeHandle(ref, () => ({
    triggerEditAndFocus: (fieldId) => {
      if (canEdit) {
        setIsEditing(true)
        setTimeout(() => {
          const element = containerRef.current?.querySelector(`#${fieldId}`)
          if (element instanceof HTMLElement) {
            element.focus()
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    },
  }))

  const handleChange = (field: keyof DetailedAmendment, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const naturezasDespesa = normalizeNaturezasDespesa(
    formData.naturezas_despesa,
    formData.natureza,
    emenda.valor_total,
  )

  const updateNaturezasDespesa = (items: NaturezaDespesaItem[]) => {
    const normalizedItems = normalizeNaturezasDespesa(items)
    setFormData((prev) => ({
      ...prev,
      naturezas_despesa: normalizedItems,
      natureza: getNaturezasLegacyText(normalizedItems),
    }))
  }

  const handleNaturezaDespesaChange = (
    index: number,
    field: keyof NaturezaDespesaItem,
    value: string | number,
  ) => {
    const nextItems =
      naturezasDespesa.length > 0
        ? [...naturezasDespesa]
        : [{ natureza: '', valor: 0 }]
    nextItems[index] = {
      ...nextItems[index],
      [field]: field === 'valor' ? Number(value || 0) : String(value),
    }
    updateNaturezasDespesa(nextItems)
  }

  const handleAddNaturezaDespesa = () => {
    updateNaturezasDespesa([...naturezasDespesa, { natureza: '', valor: 0 }])
  }

  const handleRemoveNaturezaDespesa = (index: number) => {
    updateNaturezasDespesa(naturezasDespesa.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSave = () => {
    const normalizedNaturezas = normalizeNaturezasDespesa(
      formData.naturezas_despesa,
    )

    onEmendaChange({
      ...emenda,
      ...formData,
      naturezas_despesa: normalizedNaturezas,
      natureza: getNaturezasLegacyText(normalizedNaturezas),
    } as DetailedAmendment)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(emenda)
    setIsEditing(false)
  }

  return (
    <Card
      className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800"
      ref={containerRef}
    >
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Info className="h-4 w-4" />
          </div>
          <CardTitle className="font-medium text-neutral-900 dark:text-neutral-200 text-lg">
            Dados Técnicos
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
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero_proposta">Número da Proposta</Label>
                <Input
                  id="numero_proposta"
                  value={formData.numero_proposta || ''}
                  onChange={(e) =>
                    handleChange('numero_proposta', e.target.value)
                  }
                  placeholder="Ex: 12345/2024"
                />
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4 md:col-span-2 lg:col-span-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label htmlFor="natureza-0">Naturezas da Despesa</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Informe manualmente cada natureza e o valor previsto para
                      execução.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddNaturezaDespesa}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <datalist id="naturezas-despesa-sugestoes">
                  {NATUREZAS_DESPESA.map((n) => (
                    <option key={n.value} value={n.value} />
                  ))}
                </datalist>

                <div className="space-y-2">
                  {(naturezasDespesa.length > 0
                    ? naturezasDespesa
                    : [{ natureza: '', valor: 0 }]
                  ).map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor={`natureza-${index}`}>
                          Tipo da natureza
                        </Label>
                        <Input
                          id={`natureza-${index}`}
                          list="naturezas-despesa-sugestoes"
                          value={item.natureza}
                          onChange={(e) =>
                            handleNaturezaDespesaChange(
                              index,
                              'natureza',
                              e.target.value,
                            )
                          }
                          placeholder="Ex: 33.90.30 - Material de Consumo"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`natureza-valor-${index}`}>
                          Valor
                        </Label>
                        <MoneyInput
                          id={`natureza-valor-${index}`}
                          value={item.valor || 0}
                          onChange={(value) =>
                            handleNaturezaDespesaChange(
                              index,
                              'valor',
                              value,
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="justify-self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveNaturezaDespesa(index)}
                        disabled={naturezasDespesa.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover natureza</span>
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t pt-3 text-sm font-semibold">
                  Total das naturezas:{' '}
                  <span className="ml-2 text-primary">
                    {formatCurrencyBRL(
                      naturezasDespesa.reduce(
                        (sum, item) => sum + Number(item.valor || 0),
                        0,
                      ),
                      isPrivacyMode,
                    )}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_operacional">Meta Operacional</Label>
                <Input
                  id="meta_operacional"
                  value={formData.meta_operacional || ''}
                  onChange={(e) =>
                    handleChange('meta_operacional', e.target.value)
                  }
                  placeholder="Ex: 100% executado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destino_recurso">Unidade de Destino</Label>
                <Input
                  id="destino_recurso"
                  value={formData.destino_recurso || ''}
                  onChange={(e) =>
                    handleChange('destino_recurso', e.target.value)
                  }
                  placeholder="Ex: Fundo Municipal de Saúde"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portaria">Nº Portaria</Label>
                <Input
                  id="portaria"
                  value={formData.portaria || ''}
                  onChange={(e) => handleChange('portaria', e.target.value)}
                  placeholder="Digite o número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliberacao_cie">Deliberação CIE</Label>
                <Input
                  id="deliberacao_cie"
                  value={formData.deliberacao_cie || ''}
                  onChange={(e) =>
                    handleChange('deliberacao_cie', e.target.value)
                  }
                  placeholder="Digite o número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_repasse">Data Prevista Repasse</Label>
                <Input
                  id="data_repasse"
                  type="date"
                  value={formData.data_repasse || ''}
                  onChange={(e) => handleChange('data_repasse', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_repasse">
                  Valor do Repasse Previsto (R$)
                </Label>
                <MoneyInput
                  id="valor_repasse"
                  value={formData.valor_repasse || 0}
                  onChange={(val) => handleChange('valor_repasse', val)}
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md bg-muted/20">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Co-autoria (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segundo_autor">2º Autor</Label>
                  <Input
                    id="segundo_autor"
                    value={formData.segundo_autor || ''}
                    onChange={(e) =>
                      handleChange('segundo_autor', e.target.value)
                    }
                    placeholder="Nome do segundo autor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segundo_parlamentar">
                    2º Parlamentar
                  </Label>
                  <Input
                    id="segundo_parlamentar"
                    value={formData.segundo_parlamentar || ''}
                    onChange={(e) =>
                      handleChange('segundo_parlamentar', e.target.value)
                    }
                    placeholder="Nome do segundo parlamentar"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="valor_segundo_responsavel">
                    Valor do 2º Responsável (R$)
                  </Label>
                  <MoneyInput
                    id="valor_segundo_responsavel"
                    value={formData.valor_segundo_responsavel || 0}
                    onChange={(val) =>
                      handleChange('valor_segundo_responsavel', val)
                    }
                  />
                </div>
              </div>

              {/* 3rd co-author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="terceiro_autor">3º Autor</Label>
                  <Input
                    id="terceiro_autor"
                    value={formData.terceiro_autor || ''}
                    onChange={(e) =>
                      handleChange('terceiro_autor', e.target.value)
                    }
                    placeholder="Nome do terceiro autor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terceiro_parlamentar">
                    3º Parlamentar
                  </Label>
                  <Input
                    id="terceiro_parlamentar"
                    value={formData.terceiro_parlamentar || ''}
                    onChange={(e) =>
                      handleChange('terceiro_parlamentar', e.target.value)
                    }
                    placeholder="Nome do terceiro parlamentar"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="valor_terceiro_responsavel">
                    Valor do 3º Responsável (R$)
                  </Label>
                  <MoneyInput
                    id="valor_terceiro_responsavel"
                    value={formData.valor_terceiro_responsavel || 0}
                    onChange={(val) =>
                      handleChange('valor_terceiro_responsavel', val)
                    }
                  />
                </div>
              </div>

              {/* 4th co-author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quarto_autor">4º Autor</Label>
                  <Input
                    id="quarto_autor"
                    value={formData.quarto_autor || ''}
                    onChange={(e) =>
                      handleChange('quarto_autor', e.target.value)
                    }
                    placeholder="Nome do quarto autor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarto_parlamentar">
                    4º Parlamentar
                  </Label>
                  <Input
                    id="quarto_parlamentar"
                    value={formData.quarto_parlamentar || ''}
                    onChange={(e) =>
                      handleChange('quarto_parlamentar', e.target.value)
                    }
                    placeholder="Nome do quarto parlamentar"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="valor_quarto_responsavel">
                    Valor do 4º Responsável (R$)
                  </Label>
                  <MoneyInput
                    id="valor_quarto_responsavel"
                    value={formData.valor_quarto_responsavel || 0}
                    onChange={(val) =>
                      handleChange('valor_quarto_responsavel', val)
                    }
                  />
                </div>
              </div>

              <div className="pt-2 border-t text-sm">
                <span className="text-muted-foreground">
                  Saldo Principal:
                </span>{' '}
                <span className="font-bold tabular-nums">
                  {formatCurrencyBRL(
                    (emenda.valor_total || 0) -
                      (formData.valor_segundo_responsavel || 0) -
                      (formData.valor_terceiro_responsavel || 0) -
                      (formData.valor_quarto_responsavel || 0),
                    isPrivacyMode,
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objeto_emenda">Objeto (Resumido)</Label>
              <Input
                id="objeto_emenda"
                value={formData.objeto_emenda || ''}
                onChange={(e) => handleChange('objeto_emenda', e.target.value)}
                placeholder="Ex: Aquisição de equipamentos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Gerais</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ''}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="min-h-[100px]"
                placeholder="Adicione observações importantes..."
              />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
            {/* Core Identification Fields (Read Only Context) */}
            <ReadOnlyField
              label="Número da Emenda"
              value={emenda.numero_emenda}
            />
            <ReadOnlyField
              label="Ano de Exercício"
              value={emenda.ano_exercicio}
            />
            <ReadOnlyField
              label="Número da Proposta"
              value={emenda.numero_proposta}
            />

            <ReadOnlyField
              label="Valor Total"
              value={formatCurrencyBRL(emenda.valor_total || 0, isPrivacyMode)}
            />
            <ReadOnlyField
              label="Tipo de Recurso"
              value={
                TipoRecurso[emenda.tipo_recurso] || emenda.tipo_recurso || '-'
              }
            />
            <ReadOnlyField
              label="Tipo de Recurso"
              value={TipoEmenda[emenda.tipo] || emenda.tipo || '-'}
            />

            <ReadOnlyField
              label="Parlamentar Principal"
              value={emenda.parlamentar}
              className="md:col-span-2"
            />
            <ReadOnlyField label="Autor Principal" value={emenda.autor} />

            {emenda.segundo_parlamentar ||
            emenda.segundo_autor ||
            emenda.valor_segundo_responsavel ? (
              <>
                <div className="col-span-full border-t border-neutral-100 dark:border-neutral-800 my-2" />
                <ReadOnlyField
                  label="2º Parlamentar"
                  value={emenda.segundo_parlamentar}
                  className="md:col-span-2"
                />
                <ReadOnlyField
                  label="2º Autor"
                  value={emenda.segundo_autor}
                />
                <ReadOnlyField
                  label="Valor do 2º Responsável"
                  value={
                    emenda.valor_segundo_responsavel
                      ? formatCurrencyBRL(
                          emenda.valor_segundo_responsavel,
                          isPrivacyMode,
                        )
                      : null
                  }
                />
              </>
            ) : null}

            {emenda.terceiro_parlamentar ||
            emenda.terceiro_autor ||
            emenda.valor_terceiro_responsavel ? (
              <>
                <div className="col-span-full border-t border-neutral-100 dark:border-neutral-800 my-2" />
                <ReadOnlyField
                  label="3º Parlamentar"
                  value={emenda.terceiro_parlamentar}
                  className="md:col-span-2"
                />
                <ReadOnlyField
                  label="3º Autor"
                  value={emenda.terceiro_autor}
                />
                <ReadOnlyField
                  label="Valor do 3º Responsável"
                  value={
                    emenda.valor_terceiro_responsavel
                      ? formatCurrencyBRL(
                          emenda.valor_terceiro_responsavel,
                          isPrivacyMode,
                        )
                      : null
                  }
                />
              </>
            ) : null}

            {emenda.quarto_parlamentar ||
            emenda.quarto_autor ||
            emenda.valor_quarto_responsavel ? (
              <>
                <div className="col-span-full border-t border-neutral-100 dark:border-neutral-800 my-2" />
                <ReadOnlyField
                  label="4º Parlamentar"
                  value={emenda.quarto_parlamentar}
                  className="md:col-span-2"
                />
                <ReadOnlyField
                  label="4º Autor"
                  value={emenda.quarto_autor}
                />
                <ReadOnlyField
                  label="Valor do 4º Responsável"
                  value={
                    emenda.valor_quarto_responsavel
                      ? formatCurrencyBRL(
                          emenda.valor_quarto_responsavel,
                          isPrivacyMode,
                        )
                      : null
                  }
                />
              </>
            ) : null}

            <div className="col-span-full border-t border-neutral-100 dark:border-neutral-800 my-2" />

            {/* Editable Technical Fields Display */}
            <NaturezasDespesaReadOnly
              items={emenda.naturezas_despesa}
              fallbackNatureza={emenda.natureza}
              fallbackValor={emenda.valor_total}
              isPrivacyMode={isPrivacyMode}
            />
            <ReadOnlyField
              label="Meta Operacional"
              value={emenda.meta_operacional}
            />
            <ReadOnlyField
              label="Unidade de Destino"
              value={emenda.destino_recurso}
            />

            <ReadOnlyField label="Portaria" value={emenda.portaria} />
            <ReadOnlyField
              label="Deliberação CIE"
              value={emenda.deliberacao_cie}
            />
            <ReadOnlyField
              label="Data Prev. Repasse"
              value={
                emenda.data_repasse
                  ? formatDisplayDate(emenda.data_repasse)
                  : null
              }
            />
            <ReadOnlyField
              label="Data do Repasse Pago"
              value={getPaidRepasseDates(emenda)}
            />
            <ReadOnlyField
              label="Ordem Bancária"
              value={getPaidRepasseOrders(emenda)}
            />

            <ReadOnlyField
              label="Objeto (Resumido)"
              value={emenda.objeto_emenda}
              fullWidth
              isExpandable
            />

            <ReadOnlyField
              label="Observações Gerais"
              value={emenda.observacoes}
              fullWidth
              isExpandable
            />
          </dl>
        )}
      </CardContent>
    </Card>
  )
})
EmendaDadosTecnicos.displayName = 'EmendaDadosTecnicos'
