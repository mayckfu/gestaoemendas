import { supabase } from '@/lib/supabase/client'

async function throwInvokeError(error: any): Promise<never> {
  let serverMessage = ''
  try {
    const response = error?.context as Response | undefined
    if (response) {
      const payload = await response.clone().json()
      serverMessage = payload?.error ? String(payload.error) : ''
    }
  } catch { /* The response may not contain JSON. */ }

  if (serverMessage) throw new Error(serverMessage)

  if (String(error?.message || '').includes('non-2xx')) {
    throw new Error('O serviço online interrompeu este lote. Tente novamente; as propostas já consultadas permanecem preservadas.')
  }
  throw error
}

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

export type FnsBackupEntry = {
  id: string
  backup_group_id: string
  emenda_id: string
  request_year: number
  reason: 'MANUAL' | 'AUTOMATIC'
  created_at: string
  restored_at: string | null
}

export const fnsSyncService = {
  async syncAmendment(emendaId: string, apply = false) {
    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: { emenda_id: emendaId, apply },
    })

    if (error) await throwInvokeError(error)
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

    if (error) await throwInvokeError(error)
    if (data?.error) throw new Error(data.error)

    return (data?.results ?? []) as FnsSyncResult[]
  },

  async createBackup(emendaIds: string[], requestYear: number, batchId = crypto.randomUUID()) {
    if (emendaIds.length === 0) throw new Error('Nenhuma proposta encontrada para o backup.')
    if (emendaIds.length > 50) throw new Error('O limite por lote é de 50 propostas.')
    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: { operation: 'create_backup', emenda_ids: emendaIds, request_year: requestYear, batch_id: batchId },
    })
    if (error) await throwInvokeError(error)
    if (data?.error) throw new Error(data.error)
    return data as { success: true; backup_group_id: string; backed_up: number }
  },

  async listBackups(requestYear: number) {
    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: { operation: 'list_backups', request_year: requestYear },
    })
    if (error) await throwInvokeError(error)
    if (data?.error) throw new Error(data.error)
    return (data?.backups ?? []) as FnsBackupEntry[]
  },

  async restoreBackup(backupGroupId: string) {
    const { data, error } = await supabase.functions.invoke('sync-fns-proposal', {
      body: { operation: 'restore_backup', backup_group_id: backupGroupId },
    })
    if (error) await throwInvokeError(error)
    if (data?.error) throw new Error(data.error)
    return data as { success: true; restored: number }
  },
}

