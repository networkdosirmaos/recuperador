import { NextResponse } from 'next/server'
import { coreLeadService } from '@/services/coreLead.service'

export async function POST(req: Request) {
  try {
    // FASE 4: BLINDAGEM DO WEBHOOK (Validação de Token)
    const secret = process.env.CAKTO_WEBHOOK_SECRET;
    if (secret) {
      // Diferentes gateways usam headers diferentes. Cobrimos os mais comuns.
      const authHeader = req.headers.get('authorization') || req.headers.get('x-webhook-secret') || req.headers.get('x-cakto-signature') || req.headers.get('token');
      if (authHeader !== secret && authHeader !== `Bearer ${secret}`) {
        console.error('Tentativa de invasão no webhook bloqueada. IP:', req.headers.get('x-forwarded-for'));
        return NextResponse.json({ error: 'Acesso Negado. Token de segurança inválido.' }, { status: 401 });
      }
    } else {
      console.warn('⚠️ AVISO: CAKTO_WEBHOOK_SECRET não está configurado nas variáveis de ambiente. Endpoint vulnerável.');
    }

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
    let mainItem = body.data || body;
    let orderBumps: any[] = [];
    let totalAmount = 0;

    if (Array.isArray(body.data) && body.data.length > 0) {
      // Procura o item principal (offer_type = 'main')
      const foundMain = body.data.find((item: any) => item.offer_type === 'main');
      mainItem = foundMain || body.data[0];
      
      // Procura order bumps
      orderBumps = body.data.filter((item: any) => item.offer_type === 'orderbump' && item.id !== mainItem.id);
      
      // Calcula o valor total do carrinho
      body.data.forEach((item: any) => {
        if (item.amount) totalAmount += parseFloat(item.amount);
      });
    } else {
      if (mainItem.amount) totalAmount = parseFloat(mainItem.amount);
    }
    
    // As vezes vem dentro do objeto 'customer', as vezes vem na raiz como 'customerName'
    const customerObj = mainItem.customer || {}
    const productObj = mainItem.product || {}

    // Normalização Bruta de Dados (Mapeamento infalível focado no Item Principal)
    const nome = mainItem.customerName || customerObj.name || mainItem.name || null
    const email = mainItem.customerEmail || customerObj.email || mainItem.email || null
    const phone = mainItem.customerCellphone || mainItem.customerPhone || customerObj.phone || customerObj.cellphone || mainItem.phone || null
    
    // Montagem do Nome do Produto com ou sem Combo
    let baseProductName = productObj.name || mainItem.productName || mainItem.offer?.name || 'Produto Não Informado';
    if (orderBumps.length > 0) {
      const bumpNames = orderBumps.map(b => b.product?.name || b.offer?.name || 'Item Adicional').join(', ');
      baseProductName = `${baseProductName} (+ Bump: ${bumpNames})`;
    }
    const produto = baseProductName;
    
    const gatewayStatus = mainItem.status || mainItem.recoveryStatus || event
    const updatedAt = mainItem.updatedAt || mainItem.createdAt || new Date().toISOString()
    const paymentMethod = mainItem.paymentMethod || mainItem.payment_method || null
    const refusalReason = mainItem.reason || mainItem.refundReason || null

    const isPing = event === 'ping' || event === 'test_webhook' || (!nome && !email && !phone)

    // ROLETA, DEDUPLICAÇÃO E HISTÓRICO agora vivem no CoreLeadService
    const { leadId } = await coreLeadService.processWebhookEvent({
      listId,
      event,
      gateway: 'cakto',
      nome,
      email,
      phone,
      produto,
      customerId: mainItem.customerId || customerObj.id || null,
      gatewayStatus,
      updatedAt,
      paymentMethod,
      refusalReason,
      refundedAt: mainItem.refundedAt || null,
      chargedbackAt: mainItem.chargedbackAt || null,
      refundReason: mainItem.refundReason || mainItem.refund_reason || null,
      isPing,
      rawPayload: body
    })

    return NextResponse.json({ success: true, lead_id: leadId, message: 'Lead processado com sucesso via CoreLeadService' })

  } catch (error: any) {
    console.error('Erro crítico no Webhook Cakto:', error)
    return NextResponse.json({ error: 'Erro interno', message: error?.message }, { status: 500 })
  }
}
