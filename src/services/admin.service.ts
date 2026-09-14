import { supabase } from '@/lib/supabase'

export const adminService = {
  async getLeadLists() {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('id, name, type')
      .order('imported_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async searchLeads({ listId, status, searchTerm }: { listId: string, status: string, searchTerm: string }) {
    let query = supabase
      .from('leads')
      .select(`
        *,
        profiles (full_name),
        lead_lists (name, type)
      `)

    if (listId !== 'all') {
      query = query.eq('list_id', listId)
    }
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (searchTerm.trim()) {
      query = query.or(`name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%`)
    }

    query = query.order('created_at', { ascending: false }).limit(200)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getCollaborators() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active')
      .eq('role', 'collaborator')
      .order('full_name')
    if (error) throw error
    return data || []
  },

  async assignLead(leadId: string, collaboratorId: string | null) {
    const { error } = await supabase
      .from('leads')
      .update({ 
        current_assignee_id: collaboratorId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', leadId)
    
    if (error) throw error
  },

  async deleteLeads(leadIds: string[]) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds)
    
    if (error) throw error
  }
}
