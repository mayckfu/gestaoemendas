import { supabase } from '@/lib/supabase/client'
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

/**
 * Detecta o IP e a localização geográfica do visitante e salva no Supabase via security_notifications
 */
export async function logVisitorAccess(): Promise<void> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      const ip = data.ip || 'Desconhecido'
      const city = data.city || 'Desconhecida'
      const region = data.region || 'Desconhecida'
      const country = data.country_name || 'Desconhecido'
      const org = data.org || 'Desconhecido'
      
      const message = `Acesso ao Modo Visitante iniciado. IP: ${ip} | Localização: ${city}, ${region} (${country}) | Provedor: ${org}`
      
      await supabase.rpc('log_security_notification', {
        p_type: 'VISITOR_ACCESS',
        p_message: message,
        p_severity: 'INFO',
        p_user_id: null
      })
    } else {
      throw new Error('IPAPI Response not ok')
    }
  } catch (err) {
    console.error('Erro ao buscar localização do visitante:', err)
    try {
      await supabase.rpc('log_security_notification', {
        p_type: 'VISITOR_ACCESS',
        p_message: 'Acesso ao Modo Visitante iniciado (Geolocalização indisponível ou bloqueada pelo navegador).',
        p_severity: 'INFO',
        p_user_id: null
      })
    } catch (dbErr) {
      console.error('Erro ao persistir notificação de segurança simplificada:', dbErr)
    }
  }
}

/**
 * Consulta a tabela system_settings para verificar se o modo visitante está ativado
 */
export async function isVisitorModeGloballyEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'visitor_mode_enabled')
      .maybeSingle()

    if (error || !data) {
      // Se a tabela ainda não existir ou der algum erro (ex: migração não rodou), padrão é true
      return true
    }

    return (data.value as any) === true
  } catch {
    return true
  }
}

/**
 * Atualiza o status ativo/inativo do modo visitante na tabela system_settings (apenas admin logado conseguirá sucesso)
 */
export async function setVisitorModeGloballyEnabled(enabled: boolean): Promise<boolean> {
  try {
    // Tenta primeiro um UPDATE simples (muito mais seguro contra RLS restritos e conflito de chave primária)
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value: enabled as any,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'visitor_mode_enabled')
      .select()

    // Se o update funcionou e atualizou uma linha, retorna sucesso
    if (!error && data && data.length > 0) {
      return true
    }

    // Se falhou ou não encontrou a linha (ex: banco sem a linha semeada), tenta o UPSERT de fallback
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        key: 'visitor_mode_enabled',
        value: enabled as any,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Erro ao atualizar configuração de visitante (upsert):', upsertError.message)
      return false
    }
    return true
  } catch (err) {
    console.error('Erro de conexão ao salvar configuração de visitante:', err)
    return false
  }
}
