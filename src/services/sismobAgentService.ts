export type SismobSessionStatus = {
  state: 'closed' | 'waiting_login' | 'authenticated'
  authenticated: boolean
  onProposal?: boolean
  url?: string
  title?: string
  lastError?: string | null
}

export type SismobSnapshot = {
  numero_proposta: string | null
  source_url: string
  collected_at: string
  headings: string[]
  protected_text: string
  contains_redactions: boolean
}

export type SismobBatchJob = {
  id: string
  state: 'running' | 'completed' | 'failed' | 'cancelled'
  current: string | null
  discovered: number
  processed: number
  results: SismobSnapshot[]
  errors: Array<{ numero_proposta: string; error: string }>
  error: string | null
  startedAt: string
  finishedAt: string | null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/local-api/sismob${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || 'O agente local do SISMOB não respondeu.')
  return data as T
}

export const sismobAgentService = {
  health: () => request<{ ok: boolean; browserAvailable: boolean }>('/health'),
  status: () => request<SismobSessionStatus>('/session/status'),
  open: () => request<SismobSessionStatus>('/session/open', { method: 'POST', body: '{}' }),
  collectCurrent: () => request<SismobSnapshot>('/session/collect-current', { method: 'POST', body: '{}' }),
  startCollectAll: () => request<SismobBatchJob>('/session/collect-all', { method: 'POST', body: '{}' }),
  collectAllStatus: () => request<{ job: SismobBatchJob | null }>('/session/collect-all'),
  close: () => request<{ success: boolean; logoutAttempted: boolean; localSessionDestroyed: boolean }>(
    '/session/close',
    { method: 'POST', body: '{}' },
  ),
}
