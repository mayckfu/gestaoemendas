import {
  VISITOR_EMENDAS,
  VISITOR_USERS,
  VISITOR_CARGOS,
  VISITOR_REPASSES,
  VISITOR_DESPESAS,
  VISITOR_PENDENCIAS,
  VISITOR_ACOES,
  VISITOR_PRE_LANCAMENTOS,
} from './visitorMockData'

const STORAGE_KEY = 'visitor_data'
const TIMESTAMP_KEY = 'visitor_timestamp'
const EXPIRATION_MS = 60 * 60 * 1000 // 1 hora

export type VisitorStore = {
  emendas: typeof VISITOR_EMENDAS
  users: typeof VISITOR_USERS
  cargos: typeof VISITOR_CARGOS
  repasses: typeof VISITOR_REPASSES
  despesas: typeof VISITOR_DESPESAS
  pendencias: typeof VISITOR_PENDENCIAS
  acoes: typeof VISITOR_ACOES
  preLancamentos?: any[]
}

function buildInitialStore(): VisitorStore {
  return {
    emendas: structuredClone(VISITOR_EMENDAS),
    users: structuredClone(VISITOR_USERS),
    cargos: structuredClone(VISITOR_CARGOS),
    repasses: structuredClone(VISITOR_REPASSES),
    despesas: structuredClone(VISITOR_DESPESAS),
    pendencias: structuredClone(VISITOR_PENDENCIAS),
    acoes: structuredClone(VISITOR_ACOES),
    preLancamentos: structuredClone(VISITOR_PRE_LANCAMENTOS),
  }
}

export function initVisitorData(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildInitialStore()))
  localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
}

export function getVisitorStore(): VisitorStore | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as VisitorStore
  } catch {
    return null
  }
}

export function setVisitorStore(store: VisitorStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const updateVisitorStore = setVisitorStore

export function checkExpiration(): boolean {
  const ts = localStorage.getItem(TIMESTAMP_KEY)
  if (!ts) return true
  const elapsed = Date.now() - parseInt(ts, 10)
  if (elapsed >= EXPIRATION_MS) {
    clearVisitorData()
    return true
  }
  return false
}

export function clearVisitorData(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(TIMESTAMP_KEY)
}

export function isVisitorActive(): boolean {
  return localStorage.getItem(TIMESTAMP_KEY) !== null && !checkExpiration()
}
