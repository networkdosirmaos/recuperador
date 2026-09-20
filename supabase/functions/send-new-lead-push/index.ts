import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "npm:web-push"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// As chaves VAPID devem ser configuradas nos Secrets da Edge Function
// Ex: supabase secrets set VAPID_PUBLIC_KEY=xxx VAPID_PRIVATE_KEY=yyy
const publicVapidKey = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const privateVapidKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''

webpush.setVapidDetails(
  'mailto:suporte@seu-dominio.com', // Coloque um email válido
  publicVapidKey,
  privateVapidKey
)

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // O webhook envia { type: "INSERT", table: "leads", record: { ... } }
    const record = payload.record 
    
    // Roteamento: Só notificamos o vendedor responsável
    if (!record || !record.assigned_to) {
      return new Response(JSON.stringify({ message: "Nenhum vendedor associado ao lead." }), { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar as inscrições do vendedor designado
    const { data: subs, error: subError } = await supabase
      .from('user_push_subscriptions')
      .select('*')
      .eq('user_id', record.assigned_to)

    if (subError || !subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "Vendedor não possui notificações ativas." }), { status: 200 })
    }

    // Fase 4: Buscar a copy dinâmica
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('event_type', 'NEW_LEAD')
      .single()

    // Fallback caso ainda não exista no banco
    let title = template?.title || "Novo Lead na Fila! 💸"
    let body = template?.body || "O lead {NOME} acabou de entrar."

    // Parse de variáveis básicas
    title = title.replace(/{NOME}/g, record.name || 'Cliente')
    title = title.replace(/{PRODUTO}/g, record.product_name || 'Produto')
    body = body.replace(/{NOME}/g, record.name || 'Cliente')
    body = body.replace(/{PRODUTO}/g, record.product_name || 'Produto')

    const pushPayload = JSON.stringify({ 
      title, 
      body,
      // O Service Worker pode usar essa URL para redirecionar ao clicar na notificação
      url: `/leads/${record.id}` 
    })

    // Disparar Push para todos os devices do vendedor
    const sendPromises = subs.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }
      return webpush.sendNotification(pushSubscription, pushPayload).catch(err => {
        console.error("Erro no Push para:", sub.endpoint, err)
        // Se o usuário revogou a permissão (410 Gone), removemos do banco
        if (err.statusCode === 410) {
           return supabase.from('user_push_subscriptions').delete().eq('id', sub.id)
        }
      })
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ message: "Pushes enviados com sucesso!" }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error: any) {
    console.error("Erro na Edge Function:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
