import { supabaseAdmin } from '@/lib/supabase-admin'

export class LeadRepository {
  static async findExistingLead(customerId: string | null, email: string | null, phone: string | null) {
    if (!customerId && !email && !phone) return null
    const orConditions = []
    if (customerId) orConditions.push(`customer_id.eq.${customerId}`)
    if (email) orConditions.push(`email.eq.${email}`)
    if (phone) orConditions.push(`phone.eq.${phone}`)

    if (orConditions.length === 0) return null

    const { data: foundLeads } = await supabaseAdmin.from('leads').select('id, current_assignee_id').or(orConditions.join(',')).limit(1)
    return foundLeads && foundLeads.length > 0 ? foundLeads[0] : null
  }

  static async upsertLead(existingId: string | null, leadData: any) {
    if (existingId) {
      const { data, error } = await supabaseAdmin.from('leads').update(leadData).eq('id', existingId).select('id').single()
      if (error) throw error
      return data.id
    } else {
      const { data, error } = await supabaseAdmin.from('leads').insert(leadData).select('id').single()
      if (error) throw error
      return data.id
    }
  }

  static async logEvent(leadId: string, event: string, status: string, reason: string | null, rawPayload: any) {
    try {
      await supabaseAdmin.from('lead_events').insert({
        lead_id: leadId,
        gateway_event: event,
        gateway_status: status,
        reason: reason,
        metadata: rawPayload
      })
    } catch(e) {
      console.error('Erro ao salvar evento relacional:', e)
    }
  }
}
