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
    const data = body.data || body 
    const customer = data.customer || {}
    const product = data.product || {}

    // Vamos registrar ATÉ OS TESTES como um lead no seu CRM para podermos inspecionar o Payload.
    const isPing = event === 'ping' || event === 'test_webhook' || (!customer.name && !customer.email && !customer.phone)

    const leadData = {
      name: isPing ? '🛠️ TESTE CAKTO (Webhook)' : (customer.name || 'Sem nome'),
      phone: customer.phone || null,
      email: customer.email || null,
      customer_id: customer.id || null,
      product_name: product.name || 'Produto Teste',
      cakto_updated_at: data.updatedAt || new Date().toISOString(),
      refunded_at: data.refundedAt || null,
      chargedback_at: data.chargedbackAt || null,
      refund_reason: data.refundReason || data.refund_reason || null,
      payment_method: data.paymentMethod || null,
      // Se for teste, gravamos o JSON inteiro da Cakto no campo Reason para debug!
      reason: isPing ? JSON.stringify(body).substring(0, 900) : (data.reason || null),
      cakto_status: data.status || null,
      cakto_event: event,
      list_id: listId,
      status: 'novo', 
      temperature: data.status === 'waiting_payment' ? 'quente' : 'frio' 
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
