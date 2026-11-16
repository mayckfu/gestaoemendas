import { supabase } from '@/lib/supabase/client'

export type FnsSyncResult = {
  emenda_id: string
  numero_proposta: string
  success: boolean
  applied?: boolean
  changes?: Record<string, unknown>
  conflicts?: Record<string, { current: unknown; official: unknown }>
  payments?: Array<Record<string, unknown> & { action: 'existing' | 'insert' }>
  attachments?: Array<Record<string, unknown> & { action: 'existing' | 'insert' }>
  error?: string
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
}

