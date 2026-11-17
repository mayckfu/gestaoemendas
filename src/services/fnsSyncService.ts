import { supabase } from '@/lib/supabase/client'

export type FnsSyncResult = {
  emenda_id: string
  numero_proposta: string
  success: boolean
  applied?: boolean
  changes?: Record<string, unknown>
  conflicts?: Record<string, { current: unknown; official: unknown }>
  payments?: Array<Record<string, unknown> & { action: 'existing' | 'insert' | 'update' }>
  attachments?: Array<Record<string, unknown> & { action: 'existing' | 'insert' }>
  official?: Record<string, any>
  stages?: unknown
  bank_accounts?: Array<Record<string, unknown>>
  error?: string
}

export type FnsBulkSyncOptions = {
  apply?: boolean
  requestYear?: number
  batchId?: string
}

export const fnsSyncService = {
  async syncAmendment(emendaId: string, apply = false) {
    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: { emenda_id: emendaId, apply },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return (data?.results?.[0] ?? null) as FnsSyncResult | null
  },

  async syncAmendments(
    emendaIds: string[],
    { apply = false, requestYear, batchId }: FnsBulkSyncOptions = {},
  ) {
    if (emendaIds.length === 0) return []
    if (emendaIds.length > 50) throw new Error('O limite por lote é de 50 propostas.')

    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: {
        emenda_ids: emendaIds,
        apply,
        request_year: requestYear,
        batch_id: batchId,
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return (data?.results ?? []) as FnsSyncResult[]
  },
}

