import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { data: leads, error: err1 } = await supabaseAdmin.from('leads').select('id');
    if (err1) throw err1;
    
    let updated = 0;
    for (const lead of leads) {
      const { data: events, error: err2 } = await supabaseAdmin
        .from('lead_events')
        .select('created_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (events && events.length > 0) {
        const latestDate = events[0].created_at;
        await supabaseAdmin.from('leads').update({ gateway_updated_at: latestDate, updated_at: latestDate }).eq('id', lead.id);
        updated++;
      }
    }
    
    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
