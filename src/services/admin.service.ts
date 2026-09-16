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

  async assignMultipleLeads(leadIds: string[], collaboratorId: string | null) {
    const { error } = await supabase
      .from('leads')
      .update({ 
        current_assignee_id: collaboratorId, 
        updated_at: new Date().toISOString() 
      })
      .in('id', leadIds)
    
    if (error) throw error
  },

  async deleteLeads(leadIds: string[]) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds)
    
    if (error) throw error
  },

  async getLeadEvents(leadId: string) {
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data || []
  },

  async assignListOwner(listId: string, assigneeId: string | null) {
    // 1. Atualizar o dono da lista
    const { error: listErr } = await supabase
      .from('lead_lists')
      .update({ default_assignee_id: assigneeId })
      .eq('id', listId)
    
    if (listErr) throw listErr

    // 2. Passar o trator (Atualizar todos os leads pendentes dessa lista)
    if (assigneeId) {
      const { error: leadsErr } = await supabase
        .from('leads')
        .update({ current_assignee_id: assigneeId })
        .eq('list_id', listId)
        .in('status', ['novo', 'em_atendimento'])
      
      if (leadsErr) throw leadsErr
    }
  },

  async getTeamStats() {
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'collaborator')
      
    if (profError) throw profError
    if (!profiles) return []

    const teamStats = []
    
    for (const p of profiles) {
      const { count: pendentes } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('current_assignee_id', p.id)
        .in('status', ['novo', 'em_atendimento'])

      const { count: recovered } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('current_assignee_id', p.id)
        .eq('status', 'recuperado')
        
      teamStats.push({
        id: p.id,
        name: p.full_name || 'Vendedor',
        email: p.email || 'E-mail não sincronizado',
        is_active: p.is_active === null ? true : p.is_active,
        can_see_email: p.can_see_email === null ? true : p.can_see_email,
        in_progress: pendentes || 0,
        recovered: recovered || 0,
        affiliate_link: p.affiliate_link,
        sales_link: p.sales_link
      })
    }
    return teamStats
  },

  async toggleCollaboratorStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      
    if (error) throw error
  },

  async toggleEmailVisibility(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ can_see_email: !currentStatus })
      .eq('id', id)
      
    if (error) throw error
  },

  async returnCollaboratorLeads(id: string) {
    const { error } = await supabase
      .from('leads')
      .update({ 
        current_assignee_id: null, 
        status: 'novo', 
        updated_at: new Date().toISOString() 
      })
      .eq('current_assignee_id', id)
      .not('status', 'in', '("recuperado","perdido")')

    if (error) throw error
  },

  async updateAffiliateLink(id: string, link: string | null, salesLink?: string | null) {
    const updateData: any = { affiliate_link: link }
    if (salesLink !== undefined) {
      updateData.sales_link = salesLink
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  }
}
