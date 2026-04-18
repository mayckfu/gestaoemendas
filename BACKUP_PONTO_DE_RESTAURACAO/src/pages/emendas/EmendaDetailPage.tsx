import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Banknote,
  Paperclip,
  Info,
  Target,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DetailedAmendment,
  Despesa,
  Anexo,
  Pendencia,
  Repasse,
  StatusInternoEnum,
  SituacaoOficialEnum,
  Historico,
  ActionWithDestinations,
  TipoRecursoEnum,
} from '@/lib/mock-data'
import { EmendaDetailHeader } from '@/components/emendas/EmendaDetailHeader'
import {
  EmendaDadosTecnicos,
  EmendaDadosTecnicosHandles,
} from '@/components/emendas/EmendaDadosTecnicos'
import { EmendaObjetoFinalidade } from '@/components/emendas/EmendaObjetoFinalidade'
import {
  EmendaRepassesTab,
  EmendaRepassesTabHandles,
} from '@/components/emendas/EmendaRepassesTab'
import {
  EmendaDespesasTab,
  EmendaDespesasTabHandles,
} from '@/components/emendas/EmendaDespesasTab'
import { EmendaAnexosTab } from '@/components/emendas/EmendaAnexosTab'
import { EmendaChecklistTab } from '@/components/emendas/EmendaChecklistTab'
import { EmendaPlanejamentoTab } from '@/components/emendas/EmendaPlanejamentoTab'
import { AuditReportTab } from '@/components/reports/AuditReportTab'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { getSignedUrl } from '@/lib/supabase/storage'
import { cn } from '@/lib/utils'

const EmendaDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { checkPermission } = useAuth()

  // Default to 'technical' as usually expected in detail views, or 'planning'
  const [activeTab, setActiveTab] = useState('technical')

  const [emendaData, setEmendaData] = useState<DetailedAmendment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dadosTecnicosRef = useRef<EmendaDadosTecnicosHandles>(null)
  const repassesTabRef = useRef<EmendaRepassesTabHandles>(null)
  const despesasTabRef = useRef<EmendaDespesasTabHandles>(null)
  const anexosTabRef = useRef<HTMLDivElement>(null)

  const canEdit = checkPermission(['ADMIN', 'GESTOR', 'ANALISTA'])

  const fetchEmendaDetails = useCallback(
    async (showLoading = true) => {
      if (!id) {
        setError('ID da emenda não fornecido.')
        setIsLoading(false)
        return
      }

      if (showLoading) setIsLoading(true)
      setError(null)

      try {
        // Fetch core emenda
        const { data: emenda, error: emendaError } = await supabase
          .from('emendas')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (emendaError) throw emendaError
        if (!emenda) throw new Error('Emenda não encontrada.')

        // Fetch related data
        const { data: repasses, error: repassesError } = await supabase
          .from('repasses')
          .select('*')
          .eq('emenda_id', id)
        if (repassesError) throw repassesError

        const { data: despesas, error: despesasError } = await supabase
          .from('despesas')
          .select('*, profiles:registrada_por(name)')
          .eq('emenda_id', id)
        if (despesasError) throw despesasError

        const { data: anexos, error: anexosError } = await supabase
          .from('anexos')
          .select('*, profiles:uploader(name)')
          .eq('emenda_id', id)
        if (anexosError) throw anexosError

        const { data: historico, error: historicoError } = await supabase
          .from('historico')
          .select('*, profiles:feito_por(name)')
          .eq('emenda_id', id)
          .order('criado_em', { ascending: false })
        if (historicoError) throw historicoError

        const { data: pendenciasData, error: pendenciasError } = await supabase
          .from('pendencias')
          .select('*')
          .eq('emenda_id', id)
        if (pendenciasError) throw pendenciasError

        // Fetch Actions & Destinations
        const { data: acoes, error: acoesError } = await supabase
          .from('acoes_emendas')
          .select('*')
          .eq('emenda_id', id)
        if (acoesError) throw acoesError

        const acaoIds = (acoes || []).map((a: any) => a.id)
        let destinacoes: any[] = []
        if (acaoIds.length > 0) {
          const { data: dests, error: destError } = await supabase
            .from('destinacoes_recursos')
            .select('*')
            .in('acao_id', acaoIds)
          if (destError) throw destError
          destinacoes = dests || []
        }

        const mappedAcoes: ActionWithDestinations[] = (acoes || []).map(
          (a: any) => ({
            ...a,
            destinacoes: destinacoes.filter((d: any) => d.acao_id === a.id),
          }),
        )

        // Map other entities
        const mappedDespesas = (despesas || []).map((d: any) => ({
          ...d,
          registrada_por: d.profiles?.name || 'Desconhecido',
        }))

        const mappedAnexos = await Promise.all(
          (anexos || []).map(async (a: any) => {
            let signedUrl = a.url
            if (a.url && !a.url.startsWith('http')) {
              const signed = await getSignedUrl(a.url)
              if (signed) signedUrl = signed
            }
            return {
              ...a,
              filename: a.filename || a.titulo || 'Sem Nome',
              url: signedUrl,
              uploader: a.profiles?.name || 'Desconhecido',
              data: a.data_documento || a.created_at,
            }
          }),
        )

        const mappedHistorico = (historico || []).map((h: any) => ({
          ...h,
          feito_por: h.profiles?.name || 'Desconhecido',
        }))

        const mappedPendencias: Pendencia[] = (pendenciasData || []).map(
          (p: any) => ({
            id: p.id,
            descricao: p.descricao,
            dispensada: p.dispensada,
            resolvida: p.resolvida,
            justificativa: p.justificativa,
            targetType: p.target_type,
            targetId: p.target_id,
          }),
        )

        const safeRepasses = repasses || []
        const totalRepassado = safeRepasses.reduce(
          (sum: number, r: any) =>
            r.status === 'REPASSADO' ? sum + Number(r.valor || 0) : sum,
          0,
        )
        const totalGasto = mappedDespesas.reduce(
          (sum: number, d: any) => sum + Number(d.valor || 0),
          0,
        )

        const detailedEmenda: DetailedAmendment = {
          ...emenda,
          tipo_recurso: emenda.tipo_recurso as TipoRecursoEnum,
          repasses: safeRepasses as Repasse[],
          despesas: mappedDespesas as Despesa[],
          anexos: mappedAnexos as Anexo[],
          historico: mappedHistorico as Historico[],
          pendencias: mappedPendencias,
          acoes: mappedAcoes,
          total_repassado: totalRepassado,
          total_gasto: totalGasto,
          // Safe defaults for possibly null fields
          descricao_completa: emenda.descricao_completa || '',
          objeto_emenda: emenda.objeto_emenda || '',
          portaria: emenda.portaria || null,
          deliberacao_cie: emenda.deliberacao_cie || null,
          observacoes: emenda.observacoes || '',
        }

        setEmendaData(detailedEmenda)
      } catch (error: any) {
        console.error('Error fetching emenda details:', error)
        setError(error.message || 'Erro ao carregar detalhes.')
        toast({
          title: 'Erro ao carregar detalhes',
          description: 'Não foi possível carregar os dados da emenda.',
          variant: 'destructive',
        })
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [id, toast],
  )

  useEffect(() => {
    fetchEmendaDetails()

    if (!id) return

    const channel = supabase
      .channel('emenda-detail-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pendencias',
          filter: `emenda_id=eq.${id}`,
        },
        () => {
          fetchEmendaDetails(false)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emendas',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchEmendaDetails(false)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEmendaDetails, id])

  const refreshData = async () => {
    await fetchEmendaDetails(false)
  }

  const handleEmendaDataChange = async (updatedEmenda: DetailedAmendment) => {
    if (!canEdit || !emendaData) return
    try {
      const { error } = await supabase
        .from('emendas')
        .update({
          natureza: updatedEmenda.natureza,
          objeto_emenda: updatedEmenda.objeto_emenda,
          meta_operacional: updatedEmenda.meta_operacional,
          destino_recurso: updatedEmenda.destino_recurso,
          data_repasse: updatedEmenda.data_repasse,
          valor_repasse: updatedEmenda.valor_repasse,
          portaria: updatedEmenda.portaria,
          deliberacao_cie: updatedEmenda.deliberacao_cie,
          observacoes: updatedEmenda.observacoes,
          descricao_completa: updatedEmenda.descricao_completa,
          situacao: updatedEmenda.situacao,
          status_interno: updatedEmenda.status_interno,
          numero_proposta: updatedEmenda.numero_proposta,
          segundo_autor: updatedEmenda.segundo_autor || null,
          segundo_parlamentar: updatedEmenda.segundo_parlamentar || null,
          valor_segundo_responsavel:
            updatedEmenda.valor_segundo_responsavel || null,
        })
        .eq('id', emendaData.id)

      if (error) throw error
      await fetchEmendaDetails(false)
      toast({ title: 'Dados atualizados com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleStatusInternoChange = (newStatus: StatusInternoEnum) => {
    if (!canEdit || !emendaData) return
    handleEmendaDataChange({ ...emendaData, status_interno: newStatus })
  }

  const handleStatusOficialChange = (newStatus: SituacaoOficialEnum) => {
    if (!canEdit || !emendaData) return
    handleEmendaDataChange({ ...emendaData, situacao: newStatus })
  }

  const handlePendencyClick = (pendency: Pendencia) => {
    const { targetType, targetId } = pendency

    // Handle Attachment Redirection
    if (
      targetType === 'anexo' ||
      targetId === 'oficio' ||
      targetId === 'OFICIO'
    ) {
      setActiveTab('anexos')
      setTimeout(() => {
        anexosTabRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)
      return
    }

    // Handle Tab Redirection
    if (targetType === 'tab') {
      if (targetId === 'historico') {
        setActiveTab('technical')
        return
      }
      setActiveTab(targetId)
      return
    }

    // Handle Field Redirection (mostly technical fields)
    if (targetType === 'field') {
      const technicalFields = [
        'valor_repasse',
        'destino_recurso',
        'natureza',
        'meta_operacional',
        'portaria',
        'deliberacao_cie',
        'data_repasse',
        'objeto_emenda',
        'observacoes',
        'numero_proposta',
      ]

      if (technicalFields.includes(targetId)) {
        setActiveTab('technical')
        setTimeout(() => {
          // Scroll to top of tab content then focus
          window.scrollTo({ top: 0, behavior: 'smooth' })
          dadosTecnicosRef.current?.triggerEditAndFocus(targetId)
        }, 300)
        return
      }
    }

    // Fallback
    if (
      [
        'technical',
        'planning',
        'repasses',
        'despesas',
        'anexos',
        'audit',
        'checklist',
      ].includes(targetId)
    ) {
      setActiveTab(targetId)
    } else if (targetId === 'historico') {
      // Redirect historical references to technical or just ignore
      setActiveTab('technical')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !emendaData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">
          {error || 'Emenda não encontrada'}
        </h2>
        <Button onClick={() => navigate('/emendas')}>
          Voltar para a lista
        </Button>
      </div>
    )
  }

  const destinationsForDropdown = (emendaData.acoes || []).map((action) => ({
    actionName: action.nome_acao,
    items: action.destinacoes || [],
  }))

  const pendingCount = emendaData.pendencias.filter(
    (p) => !p.resolvida && !p.dispensada,
  ).length

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate('/emendas')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Detalhes da Emenda
        </h1>
      </div>

      <EmendaDetailHeader
        emenda={emendaData}
        onStatusOficialChange={handleStatusOficialChange}
        onStatusInternoChange={handleStatusInternoChange}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="technical"
        className="w-full"
      >
        <div className="relative w-full">
          <div className="w-full overflow-x-auto pb-2 scrollbar-none snap-x flex">
            <TabsList className="inline-flex min-w-max md:w-full md:grid md:grid-cols-7 p-1 h-auto bg-muted/50 rounded-lg gap-1">
              <TabsTrigger
                value="technical"
                className="px-3 py-2.5 gap-2 data-[state=active]:text-indigo-600 data-[state=active]:bg-indigo-50/50 dark:data-[state=active]:bg-indigo-950/30 dark:data-[state=active]:text-indigo-400 snap-center"
              >
                <Info className="h-4 w-4 text-indigo-500/70" />
                <span className="hidden lg:inline">Dados Técnicos</span>
                <span className="lg:hidden">Geral</span>
              </TabsTrigger>

              <TabsTrigger
                value="planning"
                className="px-3 py-2.5 gap-2 data-[state=active]:text-amber-600 data-[state=active]:bg-amber-50/50 dark:data-[state=active]:bg-amber-950/30 dark:data-[state=active]:text-amber-400 snap-center"
              >
                <Target className="h-4 w-4 text-amber-500/70" />
                <span className="hidden lg:inline">Ações e Planejamento</span>
                <span className="lg:hidden">Ações</span>
              </TabsTrigger>

              <TabsTrigger
                value="despesas"
                className="px-3 py-2.5 gap-2 data-[state=active]:text-rose-600 data-[state=active]:bg-rose-50/50 dark:data-[state=active]:bg-rose-950/30 dark:data-[state=active]:text-rose-400 snap-center"
              >
                <Receipt className="h-4 w-4 text-rose-500/70" />
                Despesas
              </TabsTrigger>

              <TabsTrigger
                value="repasses"
                className="px-3 py-2.5 gap-2 data-[state=active]:text-emerald-600 data-[state=active]:bg-emerald-50/50 dark:data-[state=active]:bg-emerald-950/30 dark:data-[state=active]:text-emerald-400 snap-center"
              >
                <Banknote className="h-4 w-4 text-emerald-500/70" />
                Repasses
              </TabsTrigger>

              <TabsTrigger
                value="anexos"
                className="px-3 py-2.5 gap-2 data-[state=active]:text-slate-600 data-[state=active]:bg-slate-50/50 dark:data-[state=active]:bg-slate-900/30 dark:data-[state=active]:text-slate-300 snap-center"
              >
                <Paperclip className="h-4 w-4 text-slate-500/70" />
                Anexos
              </TabsTrigger>

              <TabsTrigger
                value="checklist"
                className="px-3 py-2.5 gap-2 relative data-[state=active]:text-orange-600 data-[state=active]:bg-orange-50/50 dark:data-[state=active]:bg-orange-950/30 dark:data-[state=active]:text-orange-400 snap-center"
              >
                <AlertCircle className="h-4 w-4 text-orange-500/70" />
                Pendências
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="audit"
                className="px-3 py-2.5 gap-2 snap-center"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Auditoria
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Visual indicator for horizontal scroll on mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        </div>

        {/* 
          Use forceMount for technical tab to preserve form state (editing mode).
          We use hidden class to toggle visibility manually because forceMount keeps it in DOM.
        */}
        <TabsContent
          value="technical"
          className={cn(
            'mt-6 space-y-6',
            activeTab !== 'technical' && 'hidden',
          )}
          forceMount
        >
          <EmendaDadosTecnicos
            ref={dadosTecnicosRef}
            emenda={emendaData}
            onEmendaChange={handleEmendaDataChange}
          />
          <EmendaObjetoFinalidade
            description={emendaData.descricao_completa || ''}
            onSave={(desc) =>
              handleEmendaDataChange({
                ...emendaData,
                descricao_completa: desc,
              })
            }
          />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <EmendaPlanejamentoTab emenda={emendaData} onUpdate={refreshData} />
        </TabsContent>

        <TabsContent value="repasses" className="mt-6">
          <EmendaRepassesTab
            ref={repassesTabRef}
            repasses={emendaData.repasses}
            onRepassesChange={() => refreshData()}
            emendaId={emendaData.id}
          />
        </TabsContent>

        <TabsContent value="despesas" className="mt-6">
          <EmendaDespesasTab
            ref={despesasTabRef}
            despesas={emendaData.despesas}
            destinations={destinationsForDropdown}
            onDespesasChange={() => refreshData()}
            emendaId={emendaData.id}
            tipoRecurso={emendaData.tipo_recurso}
          />
        </TabsContent>

        <TabsContent value="anexos" className="mt-6">
          <div ref={anexosTabRef}>
            <EmendaAnexosTab
              anexos={emendaData.anexos}
              onAnexosChange={() => refreshData()}
              emendaId={emendaData.id}
            />
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <EmendaChecklistTab
            pendencias={emendaData.pendencias}
            onPendencyClick={handlePendencyClick}
            onDismiss={() => {}}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditReportTab data={[emendaData]} />
        </TabsContent>
      </Tabs>

      {/* Mobile-only Pendências Alert at bottom of scrollable area */}
      {pendingCount > 0 && (
        <div className="md:hidden mt-8 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400 font-bold">
            <AlertCircle className="h-5 w-5" />
            <span>{pendingCount} Pendência(s) Encontrada(s)</span>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-500">
            Verifique a aba de Pendências para resolver as pendências desta
            emenda e garantir a correta execução.
          </p>
          <Button
            variant="outline"
            className="bg-white hover:bg-orange-50 text-orange-700 border-orange-200 w-full"
            onClick={() => {
              setActiveTab('checklist')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Visualizar Pendências
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmendaDetailPage
