import { supabase } from '@/lib/supabase/client'
import { 
  isVisitorActive, 
  visitorGetEmendas, 
  visitorGetEmendaById, 
  visitorGetDetailedAmendments 
} from '@/lib/visitor'
import { Amendment, DetailedAmendment } from '@/lib/mock-data'

export type ServiceResponse<T> = {
  data: T | null
  error: any | null
}

/**
 * Service to manage Amendment data, branching between Supabase and Visitor Mode.
 */
export const amendmentService = {
  /**
   * Fetches all amendments for a specific year.
   */
  async getAmendments(year?: string): Promise<ServiceResponse<Amendment[]>> {
    if (isVisitorActive()) {
      return visitorGetEmendas()
    }

    let query = supabase.from('emendas').select('*')
    if (year && year !== 'all') {
      query = query.eq('ano_exercicio', parseInt(year))
    }

    const { data, error } = await query
    return { data, error }
  },

  /**
   * Fetches detailed amendments including joined data (repasses, despesas, etc).
   */
  async getDetailedAmendments(year?: string): Promise<ServiceResponse<DetailedAmendment[]>> {
    if (isVisitorActive()) {
      return visitorGetDetailedAmendments(year)
    }

    try {
      let query = supabase.from('emendas').select('*')
      if (year && year !== 'all') {
        query = query.eq('ano_exercicio', parseInt(year))
      }

      const { data: emendas, error: emendasError } = await query
      if (emendasError) throw emendasError

      if (!emendas || emendas.length === 0) return { data: [], error: null }

      const emendaIds = emendas.map((e) => e.id)

      // Parallel fetching for performance
      const [repassesRes, despesasRes, anexosRes, pendenciasRes, acoesRes] = await Promise.all([
        supabase.from('repasses').select('*').in('emenda_id', emendaIds),
        supabase.from('despesas').select('*, profiles:registrada_por(name)').in('emenda_id', emendaIds),
        supabase.from('anexos').select('*').in('emenda_id', emendaIds),
        supabase.from('pendencias').select('*').in('emenda_id', emendaIds),
        supabase.from('acoes_emendas').select('*, destinacoes_recursos(*)').in('emenda_id', emendaIds)
      ])

      const detailed: DetailedAmendment[] = emendas.map((e: any) => {
        const d_repasses = (repassesRes.data || []).filter((r) => r.emenda_id === e.id)
        const d_despesas = (despesasRes.data || []).filter((d) => d.emenda_id === e.id).map((d: any) => ({
          ...d,
          registrada_por: d.profiles?.name || 'Desconhecido'
        }))
        const d_anexos = (anexosRes.data || []).filter((a) => a.emenda_id === e.id)
        const d_pendencias = (pendenciasRes.data || []).filter((p) => p.emenda_id === e.id)
        const d_acoes = (acoesRes.data || []).filter((a) => a.emenda_id === e.id).map((a: any) => ({
          ...a,
          destinacoes: a.destinacoes_recursos || []
        }))

        return {
          ...e,
          repasses: d_repasses,
          despesas: d_despesas,
          anexos: d_anexos,
          pendencias: d_pendencias,
          acoes: d_acoes,
          descricao_completa: e.objeto_emenda || '',
          historico: [] // Historico implementation can be added later
        }
      })

      return { data: detailed, error: null }
    } catch (error) {
      console.error('Error in getDetailedAmendments service:', error)
      return { data: null, error }
    }
  },

  /**
   * Fetches a single amendment by ID with full details.
   */
  async getById(id: string): Promise<ServiceResponse<DetailedAmendment>> {
    if (isVisitorActive()) {
      return visitorGetEmendaById(id)
    }

    try {
      // Fetch core emenda
      const { data: emenda, error: emendaError } = await supabase
        .from('emendas')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (emendaError) throw emendaError
      if (!emenda) return { data: null, error: { message: 'Emenda não encontrada.' } }

      // Parallel fetching for performance
      const [repassesRes, despesasRes, anexosRes, pendenciasRes, acoesRes, historicoRes] = await Promise.all([
        supabase.from('repasses').select('*').eq('emenda_id', id),
        supabase.from('despesas').select('*, profiles:registrada_por(name)').eq('emenda_id', id),
        supabase.from('anexos').select('*, profiles:uploader(name)').eq('emenda_id', id),
        supabase.from('pendencias').select('*').eq('emenda_id', id),
        supabase.from('acoes_emendas').select('*, destinacoes_recursos(*)').eq('emenda_id', id),
        supabase.from('historico').select('*, profiles:feito_por(name)').eq('emenda_id', id).order('criado_em', { ascending: false })
      ])

      // Calculate totals
      const totalRepassado = (repassesRes.data || []).reduce(
        (sum: number, r: any) => r.status === 'REPASSADO' ? sum + Number(r.valor || 0) : sum,
        0
      )
      const totalGasto = (despesasRes.data || []).reduce(
        (sum: number, d: any) => sum + Number(d.valor || 0),
        0
      )

      // Map complex entities
      const detailed: DetailedAmendment = {
        ...(emenda as any),
        repasses: repassesRes.data || [],
        despesas: (despesasRes.data || []).map((d: any) => ({
          ...d,
          registrada_por: d.profiles?.name || 'Desconhecido'
        })),
        anexos: (anexosRes.data || []).map((a: any) => ({
          ...a,
          filename: a.filename || a.titulo || 'Sem Nome',
          uploader: a.profiles?.name || 'Sistema',
          data: a.data_documento || a.created_at
        })),
        pendencias: (pendenciasRes.data || []).map((p: any) => ({
          ...p,
          targetType: p.target_type,
          targetId: p.target_id
        })),
        acoes: (acoesRes.data || []).map((a: any) => ({
          ...a,
          destinacoes: a.destinacoes_recursos || []
        })),
        historico: (historicoRes.data || []).map((h: any) => ({
          ...h,
          feito_por: h.profiles?.name || 'Sistema'
        })),
        total_repassado: totalRepassado,
        total_gasto: totalGasto,
        descricao_completa: emenda.objeto_emenda || ''
      }

      return { data: detailed, error: null }
    } catch (error) {
      console.error('Error in amendmentService.getById:', error)
      return { data: null, error }
    }
  }
}
