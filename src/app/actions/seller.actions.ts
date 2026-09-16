"use server"

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAuthenticatedUser } from './auth.utils'

export async function pullLeadsSecure(listId: string) {
  const user = await requireAuthenticatedUser()
  
  const { data: count, error } = await supabaseAdmin.rpc('distribute_leads', {
    p_assignee_id: user.id,
    p_assigned_by: user.id,
    p_list_id: listId,
    p_limit: 10
  })
  
  if (error) throw error
  return count
}

export async function updateNoteSecure(leadId: string, notes: string) {
  const user = await requireAuthenticatedUser()
  
  const { data: lead } = await supabaseAdmin.from('leads').select('current_assignee_id').eq('id', leadId).single()
  
  if (!lead || lead.current_assignee_id !== user.id) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    
  if (error) throw error
  return true
}
