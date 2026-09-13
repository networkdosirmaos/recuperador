import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    
    // Opcional: Se o lojista não passar o list_id na URL, 
    // podemos ter uma lista "padrão" ou rejeitar. Vamos rejeitar para manter integridade.
    const listId = searchParams.get('list_id')

    if (!listId) {
      return NextResponse.json({ error: 'Faltando parâmetro ?list_id= na URL do Webhook' }, { status: 400 })
    }

    // A Cakto geralmente manda os dados dentro de "data" quando é um evento estruturado, 
    // ou soltos na raiz. Vamos tentar capturar de forma resiliente.
    const event = body.event || 'desconhecido'
    const data = body.data || body 
    const customer = data.customer || {}
    const product = data.product || {}

    // Lógica principal: Transformar o payload da Cakto no nosso formato do CRM
    const leadData = {
      name: customer.name || 'Sem nome',
      phone: customer.phone || null,
      email: customer.email || null,
      customer_id: customer.id || null,
      product_name: product.name || 'Produto não especificado',
      cakto_updated_at: data.updatedAt || new Date().toISOString(),
      refunded_at: data.refundedAt || null,
      chargedback_at: data.chargedbackAt || null,
      refund_reason: data.refundReason || data.refund_reason || null,
      payment_method: data.paymentMethod || null,
      reason: data.reason || null,
      cakto_status: data.status || null,
      cakto_event: event,
      list_id: listId,
      status: 'novo', // Todo lead que chega começa como "novo" no nosso funil
      // Gatilho Fantasma: Se for waiting_payment, marcamos como "quente" pro banco de dados girar a roleta instantaneamente
      temperature: data.status === 'waiting_payment' ? 'quente' : 'frio' 
    }

    // Inserir no Supabase usando a chave de Admin (ignora RLS)
    const { error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)

    if (error) {
      console.error('Erro ao salvar no banco:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Lead processado com sucesso pelo Lead do Papai' })

  } catch (error) {
    console.error('Erro crítico no Webhook:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
