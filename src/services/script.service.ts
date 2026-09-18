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
    // Busca scripts onde event_type está na lista fornecida
    const { data, error } = await supabase
      .from('action_scripts')
      .select('*')
      .in('event_type', eventTypes)

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
