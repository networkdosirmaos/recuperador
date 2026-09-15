import { supabase } from '@/lib/supabase'

export const sellerService = {
  async getSettings() {
    const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single()
    if (error) throw error
    return data
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('is_active').eq('id', userId).single()
    if (error) throw error
    return data
  },

  async getActiveLists() {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('id, name')
      .eq('status', 'active')
      .order('imported_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getMyLeads(userId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, phone, email, product_name, status, temperature, updated_at, gateway, gateway_updated_at, payment_method, gateway_status, reason, gateway_event, created_at, next_action_at, notes, history_log')
      .eq('current_assignee_id', userId)
      .neq('status', 'perdido')
      .order('updated_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return data || []
  },

  async pullLeads(userId: string, listId: string) {
    const { data: count, error } = await supabase.rpc('distribute_leads', {
      p_assignee_id: userId,
      p_assigned_by: userId,
      p_list_id: listId,
      p_limit: 10
    })
    if (error) throw error
    return count
  },

  async updateLeadStatus(leadId: string, newStatus: string) {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    if (error) throw error
  },

  async updateNextAction(leadId: string, nextActionAt: string | null) {
    const { error } = await supabase
      .from('leads')
      .update({ next_action_at: nextActionAt, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    if (error) throw error
  },

  async updateNote(leadId: string, notes: string) {
    const { error } = await supabase
      .from('leads')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    if (error) throw error
  },

  async updateHistoryLog(leadId: string, historyLog: any[]) {
    const { error } = await supabase
      .from('leads')
      .update({ history_log: historyLog, updated_at: new Date().toISOString() })
      .eq('id', leadId)
    if (error) throw error
  }
}
