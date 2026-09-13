import { createClient } from '@supabase/supabase-js'

// ATENÇÃO: Este cliente usa a Service Role Key. 
// Ele tem poderes totais e ignora o RLS (Segurança).
// DEVE SER USADO APENAS no backend (API Routes / Server Actions), NUNCA exposto ao frontend.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
