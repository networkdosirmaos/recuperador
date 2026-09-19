import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
  console.log('Buscando leads...');
  const { data: leads, error: err1 } = await supabase.from('leads').select('id');
  if (err1) throw err1;
  console.log('Encontrados ' + leads.length + ' leads');
  let updated = 0;
  for (const lead of leads) {
    const { data: events, error: err2 } = await supabase.from('lead_events').select('created_at').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(1);
    if (events && events.length > 0) {
      const latestDate = events[0].created_at;
      await supabase.from('leads').update({ gateway_updated_at: latestDate, updated_at: latestDate }).eq('id', lead.id);
      updated++;
    }
  }
  console.log('Concluido! Leads atualizados: ' + updated);
}
main().catch(console.error);
