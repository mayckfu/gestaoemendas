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

export const memoriesService = {
  async fetchMemories(): Promise<LauraMemory[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('laura_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memories:', error)
      return []
    }

    return (data || []) as LauraMemory[]
  },

  async createMemory(content: string, type: MemoryType = 'preference', importance = 3): Promise<LauraMemory | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('laura_memories')
      .insert({
        user_id: user.id,
        type,
        content,
        importance,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating memory:', error)
      throw new Error(error.message)
    }

    return data as LauraMemory
  },

  async updateMemoryStatus(id: string, status: MemoryStatus): Promise<void> {
    const { error } = await supabase
      .from('laura_memories')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating memory:', error)
      throw new Error(error.message)
    }
  },

  async deleteMemory(id: string): Promise<void> {
    const { error } = await supabase
      .from('laura_memories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting memory:', error)
      throw new Error(error.message)
    }
  },

  async fetchSuggestions(): Promise<LauraSuggestion[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('laura_learning_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }

    return (data || []) as LauraSuggestion[]
  },

  async approveSuggestion(suggestion: LauraSuggestion): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Create memory from suggestion
    await supabase.from('laura_memories').insert({
      user_id: user.id,
      type: suggestion.suggested_type,
      content: suggestion.suggested_content,
      importance: 3,
      status: 'active',
    })

    // Mark suggestion as approved
    await supabase
      .from('laura_learning_suggestions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', suggestion.id)
  },

  async rejectSuggestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('laura_learning_suggestions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting suggestion:', error)
      throw new Error(error.message)
    }
  },

  async deleteSuggestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('laura_learning_suggestions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
