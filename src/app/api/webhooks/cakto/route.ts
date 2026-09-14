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

    // Vamos registrar ATÉ OS TESTES como um lead no seu CRM para podermos inspecionar o Payload.
    const isPing = event === 'ping' || event === 'test_webhook' || (!nome && !email && !phone)

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
      // Se for teste, gravamos o JSON inteiro da Cakto no campo Reason para debug!
      reason: isPing ? JSON.stringify(body).substring(0, 900) : refusalReason,
      gateway_status: gatewayStatus,
      gateway_event: event,
      gateway_metadata: body,
      list_id: listId,
      status: 'novo', 
      temperature: (gatewayStatus === 'waiting_payment' || gatewayStatus === 'pending' || event.includes('abandonment')) ? 'quente' : 'frio' 
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)

    if (error) {
      console.error('Erro de BD no Webhook:', error)
      return NextResponse.json({ error: 'Erro ao salvar no banco', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Lead processado com sucesso' })

  } catch (error: any) {
    console.error('Erro crítico no Webhook:', error)
    return NextResponse.json({ error: 'Erro interno', message: error?.message }, { status: 500 })
  }
}
