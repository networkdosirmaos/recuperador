import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Json } from '@/types/database.types'

export interface NormalizedWebhookPayload {
  listId: string
  event: string
  gateway: string
  nome: string | null
  email: string | null
  phone: string | null
  produto: string
  customerId: string | null
  gatewayStatus: string
  updatedAt: string
  paymentMethod: string | null
  refusalReason: string | null
  refundedAt: string | null
  chargedbackAt: string | null
  refundReason: string | null
  isPing: boolean
  rawPayload: Json
}

export const coreLeadService = {
  async processWebhookEvent(payload: NormalizedWebhookPayload) {
    // 1. ROLETA AUTOMÁTICA (ROUND-ROBIN)
    let assignedSellerId = null
    const { data: availableSellers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'collaborator')
      .eq('is_active', true)
      .order('last_assigned_at', { ascending: true, nullsFirst: true })
      .limit(1)

    if (availableSellers && availableSellers.length > 0) {
      assignedSellerId = availableSellers[0].id
      
      await supabaseAdmin
        .from('profiles')
        .update({ last_assigned_at: new Date().toISOString() })
        .eq('id', assignedSellerId)
    }

    // 2. DEDUPLICAÇÃO (Buscar se o Lead já existe)
    let existingLead = null
    if (payload.customerId || payload.email || payload.phone) {
      const orConditions = []
      if (payload.customerId) orConditions.push(`customer_id.eq.${payload.customerId}`)
      if (payload.email) orConditions.push(`email.eq.${payload.email}`)
      if (payload.phone) orConditions.push(`phone.eq.${payload.phone}`)

      if (orConditions.length > 0) {
        const { data: foundLeads } = await supabaseAdmin
          .from('leads')
          .select('id, current_assignee_id')
          .or(orConditions.join(','))
          .limit(1)
        
        if (foundLeads && foundLeads.length > 0) {
          existingLead = foundLeads[0]
        }
      }
    }

    let finalLeadId = null
    const temperature = (payload.gatewayStatus === 'waiting_payment' || payload.gatewayStatus === 'pending' || payload.event.includes('abandonment')) ? 'quente' : 'frio'

    if (existingLead) {
      // 3A. ATUALIZAR (Upsert)
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          gateway_updated_at: payload.updatedAt,
          gateway_status: payload.gatewayStatus,
          gateway_event: payload.event,
          gateway_metadata: payload.rawPayload,
          reason: payload.isPing ? 'Webhook recebido (Update)' : payload.refusalReason,
          temperature,
          name: payload.nome || undefined,
          product_name: payload.produto !== 'Produto Não Informado' ? payload.produto : undefined
        })
        .eq('id', existingLead.id)
        .select('id')
        .single()
      
      if (updateError) throw updateError
      finalLeadId = updated.id
    } else {
      // 3B. INSERIR NOVO
      const leadData = {
        name: payload.isPing ? '🛠️ TESTE (Webhook)' : (payload.nome || 'Sem Nome'),
        phone: payload.phone,
        email: payload.email,
        customer_id: payload.customerId,
        product_name: payload.produto,
        gateway: payload.gateway,
        gateway_updated_at: payload.updatedAt,
        refunded_at: payload.refundedAt,
        chargedback_at: payload.chargedbackAt,
        refund_reason: payload.refundReason,
        payment_method: payload.paymentMethod,
        reason: payload.isPing ? 'Webhook de Teste/Ping recebido com sucesso' : payload.refusalReason,
        gateway_status: payload.gatewayStatus,
        gateway_event: payload.event,
        gateway_metadata: payload.rawPayload,
        list_id: payload.listId,
        status: 'novo',
        temperature,
        current_assignee_id: assignedSellerId 
      }

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(leadData)
        .select('id')
        .single()

      if (insertError) throw insertError
      finalLeadId = inserted.id
    }

    // 4. REGISTRAR O HISTÓRICO (Timeline)
    await supabaseAdmin.from('lead_events').insert({
      lead_id: finalLeadId,
      gateway_event: payload.event,
      gateway_status: payload.gatewayStatus,
      reason: payload.isPing ? 'Webhook de Teste' : payload.refusalReason,
      metadata: payload.rawPayload
    })

    return { leadId: finalLeadId }
  }
}