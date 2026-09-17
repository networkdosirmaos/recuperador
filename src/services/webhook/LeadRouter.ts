import { supabaseAdmin } from '@/lib/supabase-admin'

export class LeadRouter {
  static async determineAssignee(listId: string | null, affiliateEmail: string | null, existingAssigneeId: string | null): Promise<{ assigneeId: string | null, statusOverride?: string }> {
    // Se houver e-mail de afiliado e for aprovado, vemos se tem vendedor com esse email
    if (affiliateEmail) {
      const { data: affiliateProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', affiliateEmail).single()
      if (affiliateProfile) {
        return { assigneeId: affiliateProfile.id, statusOverride: 'recuperado' }
      }
    }

    // Se ja existe um dono, mantem
    if (existingAssigneeId) return { assigneeId: existingAssigneeId }

    // Se tem listId, tenta ver se a lista tem dono padrao ativo
    if (listId) {
      const { data: listData } = await supabaseAdmin.from('lead_lists').select('default_assignee_id').eq('id', listId).single()
      if (listData?.default_assignee_id) {
        const { data: ownerProfile } = await supabaseAdmin.from('profiles').select('id, is_active').eq('id', listData.default_assignee_id).single()
        if (ownerProfile?.is_active) {
          return { assigneeId: ownerProfile.id }
        }
      }
    }

    // ROLETA AUTOMATICA
    const { data: availableSellers } = await supabaseAdmin.from('profiles').select('id').eq('role', 'collaborator').eq('is_active', true).order('last_assigned_at', { ascending: true, nullsFirst: true }).limit(1)
    if (availableSellers && availableSellers.length > 0) {
      const assignedId = availableSellers[0].id
      await supabaseAdmin.from('profiles').update({ last_assigned_at: new Date().toISOString() }).eq('id', assignedId)
      return { assigneeId: assignedId }
    }

    return { assigneeId: null }
  }
}
