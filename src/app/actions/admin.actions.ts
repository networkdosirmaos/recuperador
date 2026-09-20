"use server"

import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from './auth.utils'

export async function deleteLeadsSecure(leadIds: string[]) {
  await requireAdmin()
  
  const { error } = await supabaseAdmin
    .from('leads')
    .delete()
    .in('id', leadIds)
    
  if (error) throw error
  return true
}

export async function assignListOwnerSecure(listId: string, assigneeId: string | null) {
  await requireAdmin()
  
  // 1. Atualizar o dono da lista
  const { error: listErr } = await supabaseAdmin
    .from('lead_lists')
    .update({ default_assignee_id: assigneeId })
    .eq('id', listId)
    
  if (listErr) throw listErr

  // 2. Atualizar leads pendentes da lista
  if (assigneeId) {
    const { error: leadsErr } = await supabaseAdmin
      .from('leads')
      .update({ current_assignee_id: assigneeId })
      .eq('list_id', listId)
      .in('status', ['novo', 'em_atendimento'])
      
    if (leadsErr) throw leadsErr
  }
  return true
}

export async function toggleCollaboratorStatusSecure(id: string, currentStatus: boolean) {
  await requireAdmin()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: !currentStatus })
    .eq('id', id)
      
  if (error) throw error
  return true
}

export async function toggleEmailVisibilitySecure(id: string, currentStatus: boolean) {
  await requireAdmin()
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ can_see_email: !currentStatus })
    .eq('id', id)
      
  if (error) throw error
  return true
}

export async function returnCollaboratorLeadsSecure(id: string) {
  await requireAdmin()
  
  const { error } = await supabaseAdmin
    .from('leads')
    .update({ 
      current_assignee_id: null, 
      status: 'novo', 
      updated_at: new Date().toISOString() 
    })
    .eq('current_assignee_id', id)
    .not('status', 'in', '("recuperado","perdido")')

  if (error) throw error
  return true
}

export async function returnSingleLeadToPoolSecure(leadId: string) {
  await requireAdmin()
  
  const { error } = await supabaseAdmin
    .from('leads')
    .update({ 
      current_assignee_id: null, 
      status: 'novo', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', leadId)

  if (error) throw error
  return true
}

export async function updateCollaboratorProfileSecure(id: string, fullName: string | null, link: string | null, salesLink?: string | null) {
  await requireAdmin()
  const updateData: any = { 
    full_name: fullName,
    affiliate_link: link 
  }
  if (salesLink !== undefined) {
    updateData.sales_link = salesLink
  }
  const { error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id)
  if (error) throw error
  return true
}

export async function assignMultipleLeadsSecure(leadIds: string[], collaboratorId: string | null) {
  await requireAdmin()
  const { error } = await supabaseAdmin.from('leads').update({ 
    current_assignee_id: collaboratorId, 
    updated_at: new Date().toISOString() 
  }).in('id', leadIds)
  if (error) throw error
  return true
}

export async function deleteListCascadeSecure(listId: string) {
  await requireAdmin()
  
  const { error: leadsErr } = await supabaseAdmin.from('leads').delete().eq('list_id', listId)
  if (leadsErr) throw leadsErr
  
  const { error: listErr } = await supabaseAdmin.from('lead_lists').delete().eq('id', listId)
  if (listErr) throw listErr
  
  return true
}

export async function migrateHistoryLogSecure() {
  await requireAdmin()
  const { data: leads, error } = await supabaseAdmin.from('leads').select('id, history_log').not('history_log', 'is', null)
  if (error) throw error
  let migratedCount = 0
  for (const lead of leads) {
    if (!lead.history_log || !Array.isArray(lead.history_log)) continue;
    const events = lead.history_log.map((ev: any) => ({
      lead_id: lead.id,
      gateway_event: ev.type,
      reason: ev.description,
      gateway_status: 'MIGRATED',
      created_at: ev.created_at || new Date().toISOString()
    }))
    if (events.length > 0) {
      await supabaseAdmin.from('lead_events').insert(events)
      await supabaseAdmin.from('leads').update({ history_log: null }).eq('id', lead.id)
      migratedCount += events.length
    }
  }
  return migratedCount
}
