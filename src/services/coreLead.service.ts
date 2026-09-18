import { NormalizedWebhookPayload } from './coreLead.types'
import { LeadRouter } from './webhook/LeadRouter'
import { LeadRepository } from './webhook/LeadRepository'

export const coreLeadService = {
  async processWebhookEvent(payload: NormalizedWebhookPayload) {
    // 1. Busca se ja existe
    const existingLead = await LeadRepository.findExistingLead(payload.customerId, payload.email, payload.phone)
    
    const isApproved = payload.event === 'purchase_approved' || payload.gatewayStatus === 'approved'
    const isRefundOrChargeback = payload.event.includes('refund') || payload.event.includes('chargeback') || payload.gatewayStatus === 'refunded' || payload.gatewayStatus === 'chargeback'
    const temperature = (payload.gatewayStatus === 'waiting_payment' || payload.gatewayStatus === 'pending' || payload.event.includes('abandonment')) ? 'quente' : 'frio'

    // 2. Decide quem vai ficar com o lead (Roteamento)
    const { assigneeId, statusOverride } = await LeadRouter.determineAssignee(
      payload.listId, 
      isApproved ? (payload.affiliateEmail || null) : null, 
      existingLead ? existingLead.current_assignee_id : null
    )

    let finalStatus = statusOverride
    if (!finalStatus) {
      if (isApproved && !payload.affiliateEmail) finalStatus = 'venda_organica'
      else if (isApproved && payload.affiliateEmail) finalStatus = 'venda_organica'
      else if (isRefundOrChargeback) finalStatus = 'novo'
    }

    // 3. Prepara os dados pro Upsert
    const leadData: any = {
      gateway_updated_at: payload.updatedAt,
      gateway_status: payload.gatewayStatus,
      gateway_event: payload.event,
      gateway_metadata: payload.rawPayload,
      reason: payload.isPing ? 'Webhook recebido (Update)' : payload.refusalReason,
      temperature: isRefundOrChargeback ? 'quente' : temperature,
      name: payload.nome ? payload.nome : (existingLead ? undefined : 'Sem Nome'),
      current_assignee_id: assigneeId,
      ...(finalStatus ? { status: finalStatus } : {})
    }

    if (!existingLead) {
      leadData.phone = payload.phone
      leadData.email = payload.email
      leadData.customer_id = payload.customerId
      leadData.product_name = payload.produto !== 'Produto Não Informado' ? payload.produto : undefined
      leadData.gateway = payload.gateway
      leadData.payment_method = payload.paymentMethod
      leadData.list_id = payload.listId
      if (!leadData.status) leadData.status = 'novo'
      if (payload.isPing) leadData.name = '✅ TESTE (Webhook)'
    } else {
      if (payload.produto && payload.produto !== 'Produto Não Informado') leadData.product_name = payload.produto
    }

    // Sempre atualiza dados de reembolso/chargeback se vierem no payload
    if (payload.refundedAt) leadData.refunded_at = payload.refundedAt
    if (payload.chargedbackAt) leadData.chargedback_at = payload.chargedbackAt
    if (payload.refundReason) leadData.refund_reason = payload.refundReason

    // 4. Salva no banco
    const finalLeadId = await LeadRepository.upsertLead(existingLead ? existingLead.id : null, leadData)

    // 5. Salva Log na Timeline Relacional
    await LeadRepository.logEvent(
      finalLeadId, 
      payload.event, 
      payload.gatewayStatus, 
      payload.isPing ? 'Webhook de Teste' : payload.refusalReason, 
      payload.rawPayload
    )

    return { leadId: finalLeadId }
  }
}
