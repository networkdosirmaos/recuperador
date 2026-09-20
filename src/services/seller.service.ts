import { supabase } from '@/lib/supabase'

export const sellerService = {
  async getSettings() {
    const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single()
    if (error) throw error
    return data
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, is_active, affiliate_link, sales_link, full_name, can_see_email')
      .eq('id', userId)
      .single()
    
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
    // Mantendo temporariamente por retrocompatibilidade se algo quebrar, mas não usaremos mais no InboxView
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, phone, email, product_name, status, temperature, updated_at, gateway, gateway_updated_at, payment_method, gateway_status, reason, gateway_event, created_at, next_action_at, notes, history_log, gateway_metadata, refund_reason')
      .eq('current_assignee_id', userId)
      .order('updated_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return data || []
  },

  async getLeadsByBucket(userId: string, bucket: string, offset: number = 0, limit: number = 20) {
    const { data, error } = await supabase.rpc('get_leads_by_bucket', {
      p_user_id: userId,
      p_bucket: bucket,
      p_offset: offset,
      p_limit: limit
    })
    if (error) throw error
    return data || []
  },

  async getLeadCounts(userId: string) {
    const { data, error } = await supabase.rpc('get_lead_counts', {
      p_user_id: userId
    })
    if (error) throw error
    // Como o RPC retorna json (ex: { "pendentes": 2, "em_andamento": 3 }), tipamos aqui
    return data as { pendentes: number, em_andamento: number, finalizados: number, geladeira: number }
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
