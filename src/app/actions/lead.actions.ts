"use server"

import { supabaseAdmin } from '@/lib/supabase-admin'

// Ação Segura: Atualizar o Status do Lead
export async function updateLeadStatusSecure(leadId: string, newStatus: string, userId: string) {
  // Verificação de Segurança (Backend)
  const { data: lead } = await supabaseAdmin.from('leads').select('current_assignee_id').eq('id', leadId).single()
  
  if (!lead || lead.current_assignee_id !== userId) {
    throw new Error('Acesso negado: Você não é dono deste lead.')
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    
  if (error) throw error
  return true
}

// Ação Segura: Append no History Log (Usando a Procedure RPC)
export async function appendLeadHistorySecure(leadId: string, userId: string, text: string) {
  // Verificação de Segurança (Backend)
  const { data: lead } = await supabaseAdmin.from('leads').select('current_assignee_id').eq('id', leadId).single()
  
  if (!lead || lead.current_assignee_id !== userId) {
    throw new Error('Acesso negado: Você não é dono deste lead.')
  }

  const { error } = await supabaseAdmin.from('lead_events').insert({
    lead_id: leadId,
    gateway_event: 'HUMAN_NOTE',
    reason: text,
    gateway_status: 'NOTE',
    metadata: { created_by: userId }
  })

  if (error) throw error
  return true
}
 
export async function updateNextActionSecure(leadId: string, nextActionAt: string | null, userId: string) {  
  const { data: lead } = await supabaseAdmin.from('leads').select('current_assignee_id').eq('id', leadId).single()  
  if (!lead || lead.current_assignee_id !== userId) throw new Error('Acesso negado')  
  const { error } = await supabaseAdmin.from('leads').update({ next_action_at: nextActionAt, updated_at: new Date().toISOString() }).eq('id', leadId)  
  if (error) throw error  
  return true  
} 
