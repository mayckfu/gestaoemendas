import { supabase } from '@/lib/supabase/client'

export type MemoryType = 'preference' | 'rule' | 'synonym' | 'decision' | 'follow_up' | 'correction'
export type MemoryStatus = 'active' | 'archived' | 'rejected'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected'

export interface LauraMemory {
  id: string
  user_id: string
  type: MemoryType
  content: string
  importance: number
  status: MemoryStatus
  created_at: string
  updated_at: string
}

export interface LauraSuggestion {
  id: string
  user_id: string
  suggested_type: MemoryType
  suggested_content: string
  reason: string | null
  status: SuggestionStatus
  created_at: string
  reviewed_at: string | null
}

type KnowledgeNoteRow = {
  id: string
  content: string
  created_by: string | null
  status: 'rascunho' | 'validado' | 'pendente_confirmacao' | 'obsoleto' | 'rejeitado'
  confidence: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

function toKnowledgeNoteType(type: MemoryType) {
  if (type === 'rule') return 'regra_operacional'
  if (type === 'decision') return 'decisao'
  if (type === 'follow_up') return 'resumo'
  if (type === 'correction') return 'nota_tecnica'
  return 'outro'
}

function toMemoryType(value: unknown): MemoryType {
  const type = String(value || 'preference')
  if (['preference', 'rule', 'synonym', 'decision', 'follow_up', 'correction'].includes(type)) {
    return type as MemoryType
  }
  return 'preference'
}

function toMemoryStatus(status: KnowledgeNoteRow['status']): MemoryStatus {
  if (status === 'obsoleto') return 'archived'
  if (status === 'rejeitado') return 'rejected'
  return 'active'
}

function toKnowledgeStatus(status: MemoryStatus) {
  if (status === 'archived') return 'obsoleto'
  if (status === 'rejected') return 'rejeitado'
  return 'validado'
}

function mapNoteToMemory(note: KnowledgeNoteRow): LauraMemory {
  return {
    id: note.id,
    user_id: note.created_by ?? '',
    type: toMemoryType(note.metadata?.learning_type),
    content: note.content,
    importance: note.status === 'validado' ? 5 : Math.max(1, Math.round(Number(note.confidence ?? 0.6) * 5)),
    status: toMemoryStatus(note.status),
    created_at: note.created_at,
    updated_at: note.updated_at,
  }
}

function mapNoteToSuggestion(note: KnowledgeNoteRow): LauraSuggestion {
  return {
    id: note.id,
    user_id: note.created_by ?? '',
    suggested_type: toMemoryType(note.metadata?.learning_type),
    suggested_content: note.content,
    reason: typeof note.metadata?.reason === 'string' ? note.metadata.reason : null,
    status: note.status === 'rejeitado' ? 'rejected' : note.status === 'validado' ? 'approved' : 'pending',
    created_at: note.created_at,
    reviewed_at: typeof note.metadata?.reviewed_at === 'string' ? note.metadata.reviewed_at : null,
  }
}

export const memoriesService = {
  async fetchNoteMetadata(id: string): Promise<Record<string, unknown>> {
    const { data, error } = await supabase
      .from('knowledge_notes')
      .select('metadata')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching note metadata:', error)
      return {}
    }

    return (data?.metadata || {}) as Record<string, unknown>
  },

  async fetchMemories(): Promise<LauraMemory[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('knowledge_notes')
      .select('id, content, created_by, status, confidence, metadata, created_at, updated_at')
      .eq('created_by', user.id)
      .eq('metadata->>kind', 'learning')
      .in('status', ['validado', 'obsoleto'])
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching memories:', error)
      return []
    }

    return ((data || []) as KnowledgeNoteRow[]).map(mapNoteToMemory)
  },

  async createMemory(content: string, type: MemoryType = 'preference', importance = 3): Promise<LauraMemory | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const confidence = Math.min(1, Math.max(0.2, importance / 5))
    const { data, error } = await supabase
      .from('knowledge_notes')
      .insert({
        title: `Memoria da Laura: ${type}`,
        content,
        note_type: toKnowledgeNoteType(type),
        source_type: 'usuario',
        created_by: user.id,
        created_by_ai: false,
        status: 'validado',
        confidence,
        last_confirmed_at: new Date().toISOString(),
        metadata: {
          kind: 'learning',
          learning_type: type,
          importance,
          created_from: 'manual',
        },
      })
      .select('id, content, created_by, status, confidence, metadata, created_at, updated_at')
      .single()

    if (error) {
      console.error('Error creating memory:', error)
      throw new Error(error.message)
    }

    return mapNoteToMemory(data as KnowledgeNoteRow)
  },

  async updateMemoryStatus(id: string, status: MemoryStatus): Promise<void> {
    const metadata = await this.fetchNoteMetadata(id)

    const { error } = await supabase
      .from('knowledge_notes')
      .update({
        status: toKnowledgeStatus(status),
        metadata: {
          ...metadata,
          kind: 'learning',
          reviewed_at: new Date().toISOString(),
        },
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating memory:', error)
      throw new Error(error.message)
    }
  },

  async deleteMemory(id: string): Promise<void> {
    await this.updateMemoryStatus(id, 'rejected')
  },

  async fetchSuggestions(): Promise<LauraSuggestion[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('knowledge_notes')
      .select('id, content, created_by, status, confidence, metadata, created_at, updated_at')
      .eq('created_by', user.id)
      .eq('metadata->>kind', 'learning')
      .eq('created_by_ai', true)
      .in('status', ['pendente_confirmacao', 'rejeitado'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }

    return ((data || []) as KnowledgeNoteRow[]).map(mapNoteToSuggestion)
  },

  async approveSuggestion(suggestion: LauraSuggestion): Promise<void> {
    const metadata = await this.fetchNoteMetadata(suggestion.id)

    const { error } = await supabase
      .from('knowledge_notes')
      .update({
        source_type: 'usuario',
        status: 'validado',
        last_confirmed_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          kind: 'learning',
          learning_type: suggestion.suggested_type,
          reason: suggestion.reason,
          reviewed_at: new Date().toISOString(),
        },
      })
      .eq('id', suggestion.id)

    if (error) throw new Error(error.message)
  },

  async rejectSuggestion(id: string): Promise<void> {
    const metadata = await this.fetchNoteMetadata(id)

    const { error } = await supabase
      .from('knowledge_notes')
      .update({
        status: 'rejeitado',
        metadata: {
          ...metadata,
          kind: 'learning',
          reviewed_at: new Date().toISOString(),
        },
      })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting suggestion:', error)
      throw new Error(error.message)
    }
  },

  async deleteSuggestion(id: string): Promise<void> {
    await this.rejectSuggestion(id)
  },
}
