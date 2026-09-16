import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Não autenticado')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await requireAuthenticatedUser()
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!profile || profile.role !== 'admin') {
    throw new Error('Acesso Negado: Apenas administradores podem executar esta ação.')
  }
  
  return user
}
