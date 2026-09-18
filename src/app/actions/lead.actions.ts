"use server"

import { createClient } from '@/utils/supabase/server'

// Ação Autenticada: Atualizar o Status do Lead (RLS Protege)
export async function updateLeadStatusSecure(leadId: string, newStatus: string, userId: string) {
  const supabase = await createClient()

  // O banco de dados vai recusar o update se o usuário logado não for o dono do lead
  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    
  if (error) {
    console.error("Erro no updateLeadStatusSecure:", error)
    throw new Error('Acesso negado ou erro ao atualizar o lead.')
  }
  return true
}

// Ação Autenticada: Inserir log no histórico (RLS Protege)
export async function appendLeadHistorySecure(leadId: string, userId: string, text: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('lead_events').insert({
    lead_id: leadId,
    gateway_event: 'HUMAN_NOTE',
    reason: text,
    gateway_status: 'NOTE',
    metadata: { created_by: userId }
  })

  if (error) {
    console.error("Erro no appendLeadHistorySecure:", error)
    throw new Error('Acesso negado ou erro ao inserir nota.')
  }
  return true
}
 
// Ação Autenticada: Atualizar próximo contato (RLS Protege)
export async function updateNextActionSecure(leadId: string, nextActionAt: string | null, userId: string) {  
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({ next_action_at: nextActionAt, updated_at: new Date().toISOString() })
    .eq('id', leadId)  

  if (error) {
    console.error("Erro no updateNextActionSecure:", error)
    throw new Error('Acesso negado ou erro ao agendar lead.')
  }
  return true  
}
