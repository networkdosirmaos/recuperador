import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    let body;
    const rawText = await req.text()
    try {
      body = JSON.parse(rawText)
    } catch (e) {
      return NextResponse.json({ error: 'Payload não é JSON válido', raw: rawText }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const listId = searchParams.get('list_id')

    if (!listId) {
      return NextResponse.json({ error: 'Faltando parâmetro ?list_id= na URL' }, { status: 400 })
    }

    const event = body.event || 'test'
    // A Cakto envia 'data' como Array em eventos de Abandono, mas pode enviar como Objeto em compras. 
    // Vamos garantir que pegamos o primeiro item sempre.
    const payloadData = Array.isArray(body.data) ? body.data[0] : (body.data || body)
    
    // As vezes vem dentro do objeto 'customer', as vezes vem na raiz como 'customerName'
    const customerObj = payloadData.customer || {}
    const productObj = payloadData.product || {}

    // Normalização Bruta de Dados (Mapeamento infalível)
    const nome = payloadData.customerName || customerObj.name || payloadData.name || null
    const email = payloadData.customerEmail || customerObj.email || payloadData.email || null
    const phone = payloadData.customerCellphone || payloadData.customerPhone || customerObj.phone || customerObj.cellphone || payloadData.phone || null
    const produto = productObj.name || payloadData.productName || payloadData.offer?.name || 'Produto Não Informado'
    
    const gatewayStatus = payloadData.status || payloadData.recoveryStatus || event
    const updatedAt = payloadData.updatedAt || payloadData.createdAt || new Date().toISOString()
    const paymentMethod = payloadData.paymentMethod || payloadData.payment_method || null
    const refusalReason = payloadData.reason || payloadData.refundReason || null

    // ROLETA AUTOMÁTICA (ROUND-ROBIN)
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
      
      // Atualizar o cronômetro do vendedor escolhido (para ele ir pro fim da fila)
      await supabaseAdmin
        .from('profiles')
        .update({ last_assigned_at: new Date().toISOString() })
        .eq('id', assignedSellerId)
    }

    const isPing = event === 'ping' || event === 'test_webhook' || (!nome && !email && !phone)

    // 1. DEDUPLICAÇÃO (Buscar se o Lead já existe)
    let existingLead = null
    if (payloadData.customerId || email || phone) {
      const orConditions = []
      if (payloadData.customerId) orConditions.push(`customer_id.eq.${payloadData.customerId}`)
      if (email) orConditions.push(`email.eq.${email}`)
      if (phone) orConditions.push(`phone.eq.${phone}`)

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

    if (existingLead) {
      // 2A. ATUALIZAR (Upsert)
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          gateway_updated_at: updatedAt,
          gateway_status: gatewayStatus,
          gateway_event: event,
          gateway_metadata: body,
          reason: isPing ? 'Webhook recebido (Update)' : refusalReason,
          temperature: (gatewayStatus === 'waiting_payment' || gatewayStatus === 'pending' || event.includes('abandonment')) ? 'quente' : 'frio',
          // Atualizamos campos opcionais caso venham mais completos no segundo webhook
          name: nome || undefined,
          product_name: produto !== 'Produto Não Informado' ? produto : undefined
        })
        .eq('id', existingLead.id)
        .select('id')
        .single()
      
      if (updateError) throw updateError
      finalLeadId = updated.id
    } else {
      // 2B. INSERIR NOVO (O lead não existia)
      const leadData = {
        name: isPing ? '🛠️ TESTE CAKTO (Webhook)' : (nome || 'Sem Nome'),
        phone: phone,
        email: email,
        customer_id: payloadData.customerId || customerObj.id || null,
        product_name: produto,
        gateway: 'cakto',
        gateway_updated_at: updatedAt,
        refunded_at: payloadData.refundedAt || null,
        chargedback_at: payloadData.chargedbackAt || null,
        refund_reason: payloadData.refundReason || payloadData.refund_reason || null,
        payment_method: paymentMethod,
        reason: isPing ? 'Webhook de Teste/Ping recebido com sucesso' : refusalReason,
        gateway_status: gatewayStatus,
        gateway_event: event,
        gateway_metadata: body,
        list_id: listId,
        status: 'novo', 
        temperature: (gatewayStatus === 'waiting_payment' || gatewayStatus === 'pending' || event.includes('abandonment')) ? 'quente' : 'frio',
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

    // 3. REGISTRAR O HISTÓRICO (Timeline)
    await supabaseAdmin.from('lead_events').insert({
      lead_id: finalLeadId,
      gateway_event: event,
      gateway_status: gatewayStatus,
      reason: isPing ? 'Webhook de Teste' : refusalReason,
      metadata: body
    })

    return NextResponse.json({ success: true, lead_id: finalLeadId, message: 'Lead processado com sucesso' })

  } catch (error: any) {
    console.error('Erro crítico no Webhook:', error)
    return NextResponse.json({ error: 'Erro interno', message: error?.message }, { status: 500 })
  }
}
