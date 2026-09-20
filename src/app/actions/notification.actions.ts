'use server'

import { requireAdmin } from './auth.utils'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getNotificationTemplate(eventType: string) {
  const { data } = await supabaseAdmin
    .from('notification_templates')
    .select('*')
    .eq('event_type', eventType)
    .single()
  
  return data
}

export async function updateNotificationTemplate(eventType: string, title: string, body: string) {
  try {
    await requireAdmin()

    const { error } = await supabaseAdmin.from('notification_templates').upsert({
      event_type: eventType,
      title,
      body,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_type' })

    if (error) throw error

    revalidatePath('/admin/configuracoes/notificacoes')
    return { success: true }
  } catch (err: any) {
    console.error('Update template error:', err)
    return { success: false, error: err.message || 'Erro interno ao salvar.' }
  }
}
