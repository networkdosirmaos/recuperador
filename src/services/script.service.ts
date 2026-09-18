import { supabase } from '@/lib/supabase'
import type { ActionScript, CreateActionScriptDTO, UpdateActionScriptDTO } from '@/types/script.types'

export const scriptService = {
  async getAdminScripts() {
    const { data, error } = await supabase
      .from('action_scripts')
      .select('*')
      .order('event_type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ActionScript[]
  },

  async getRecommendedScripts(eventTypes: string[], refundReason?: string | null) {
    // Normalização/Aliasing: a Cakto pode mandar um nome diferente do que configuramos no Playbook
    let expandedTypes = [...eventTypes]
    if (eventTypes.some(t => t?.includes('abandonment') || t?.includes('abandoned'))) {
      expandedTypes.push('checkout_abandoned', 'checkout_abandonment')
    }
    if (eventTypes.some(t => t === 'pix_gerado' || t === 'waiting_payment' || t === 'pending')) {
      expandedTypes.push('waiting_payment', 'pix_gerado')
    }
    if (eventTypes.some(t => t?.includes('refund'))) {
      expandedTypes.push('refund_requested', 'refunded', 'refund')
    }
    if (eventTypes.some(t => t?.includes('refuse') || t?.includes('failed'))) {
      expandedTypes.push('purchase_refused', 'refused', 'failed')
    }
    if (eventTypes.some(t => t?.includes('approve') || t === 'paid')) {
      expandedTypes.push('purchase_approved', 'approved', 'paid')
    }

    // Remover duplicatas e valores nulos
    expandedTypes = Array.from(new Set(expandedTypes.filter(Boolean)))

    // Busca scripts onde event_type está na lista expandida
    const { data, error } = await supabase
      .from('action_scripts')
      .select('*')
      .in('event_type', expandedTypes)

    if (error) throw error
    
    // Filtro no lado do cliente para a sub-condição
    const scripts = data as ActionScript[]
    
    return scripts.filter(script => {
      // Se não tem sub-condição, o script é genérico para o evento, logo é válido.
      if (!script.sub_condition) return true;
      
      // Se tem sub-condição, precisamos ver se ela dá match com o motivo de refund ou reason
      if (refundReason) {
        return refundReason.toLowerCase().includes(script.sub_condition.toLowerCase());
      }
      
      return false; // Tem sub-condição mas o lead não tem reason/refundReason
    })
  },

  async createScript(payload: CreateActionScriptDTO) {
    const { data, error } = await supabase
      .from('action_scripts')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data as ActionScript
  },

  async updateScript(id: string, payload: UpdateActionScriptDTO) {
    const { data, error } = await supabase
      .from('action_scripts')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ActionScript
  },

  async deleteScript(id: string) {
    const { error } = await supabase
      .from('action_scripts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
