/**
 * visitorInterceptor.ts
 * 
 * Intercepta chamadas ao banco de dados quando o modo visitante está ativo.
 * Se for visitante → lê/grava no localStorage via visitorStorageManager.
 * Se for usuário real → passa direto para o Supabase.
 * 
 * Simula o formato de resposta do Supabase: { data, error, count }
 */

import {
  getVisitorStore,
  setVisitorStore,
  isVisitorActive,
} from './visitorStorageManager'
import { getVisitorDetailedAmendment } from './visitorMockData'
import type { Amendment, DetailedAmendment, User, Cargo } from '@/lib/mock-data'

type SupabaseResponse<T> = { data: T | null; error: null | { message: string }; count?: number }

function ok<T>(data: T, count?: number): SupabaseResponse<T> {
  return { data, error: null, count: count ?? (Array.isArray(data) ? data.length : 1) }
}

function err(message: string): SupabaseResponse<null> {
  return { data: null, error: { message } }
}

// ─── Emendas ──────────────────────────────────────────────────────────────────

export function visitorGetEmendas(): SupabaseResponse<Amendment[]> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Dados de visitante não inicializados.')
  return ok(store.emendas)
}

export function visitorGetEmendaById(id: string): SupabaseResponse<DetailedAmendment> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const detail = getVisitorDetailedAmendment(id)
  if (!detail) return err(`Emenda ${id} não encontrada.`)
  return ok(detail)
}

export function visitorInsertEmenda(emenda: Omit<Amendment, 'id' | 'created_at' | 'total_repassado' | 'total_gasto'>): SupabaseResponse<Amendment> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')

  const newEmenda: Amendment = {
    ...emenda,
    id: `emenda-visitor-${Date.now()}`,
    created_at: new Date().toISOString(),
    total_repassado: 0,
    total_gasto: 0,
  } as Amendment

  store.emendas.push(newEmenda)
  setVisitorStore(store)
  return ok(newEmenda)
}

export function visitorUpdateEmenda(id: string, updates: Partial<Amendment>): SupabaseResponse<Amendment> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')

  const idx = store.emendas.findIndex((e) => e.id === id)
  if (idx === -1) return err(`Emenda ${id} não encontrada.`)

  store.emendas[idx] = { ...store.emendas[idx], ...updates }
  setVisitorStore(store)
  return ok(store.emendas[idx])
}

export function visitorDeleteEmenda(id: string): SupabaseResponse<null> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')

  store.emendas = store.emendas.filter((e) => e.id !== id)
  setVisitorStore(store)
  return ok(null)
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

export function visitorGetUsers(): SupabaseResponse<User[]> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')
  return ok(store.users)
}

export function visitorGetUserById(id: string): SupabaseResponse<User> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')
  const user = store.users.find((u) => u.id === id)
  if (!user) return err(`Usuário ${id} não encontrado.`)
  return ok(user)
}

// ─── Cargos ───────────────────────────────────────────────────────────────────

export function visitorGetCargos(): SupabaseResponse<Cargo[]> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Store não inicializado.')
  return ok(store.cargos)
}

// ─── Helper: retorna se a chamada deve ser interceptada ───────────────────────

export function shouldIntercept(): boolean {
  return isVisitorActive()
}

export function visitorGetDetailedAmendments(year?: string): SupabaseResponse<DetailedAmendment[]> {
  if (!isVisitorActive()) return err('Sessão de visitante expirada.')
  const store = getVisitorStore()
  if (!store) return err('Dados de visitante não inicializados.')

  const emendasData = store.emendas.filter(
    (e) => !year || year === 'all' || e.ano_exercicio === parseInt(year)
  )

  const detailed: DetailedAmendment[] = emendasData.map((e) => {
    const detail = getVisitorDetailedAmendment(e.id)
    return detail! // We know it exists because it's in the store
  })

  return ok(detailed)
}
