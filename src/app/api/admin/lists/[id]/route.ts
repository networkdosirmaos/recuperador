import { NextRequest, NextResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const listId = params.id
  
  if (!listId) {
    return NextResponse.json({ error: 'ID da lista nao fornecido' }, { status: 400 })
  }

  // Ignoramos o RLS usando a Service Role Key para garantir a deleção em cascata
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Apagar todos os leads primeiro (Cascata manual caso a FK não tenha ON DELETE CASCADE)
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('list_id', listId)

    if (leadsError) {
      console.error('Erro ao deletar leads em cascata:', leadsError)
      return NextResponse.json({ error: 'Falha ao deletar leads da base' }, { status: 500 })
    }

    // 2. Apagar a lista em si
    const { error: listError } = await supabaseAdmin
      .from('lead_lists')
      .delete()
      .eq('id', listId)

    if (listError) {
      console.error('Erro ao deletar lista:', listError)
      return NextResponse.json({ error: 'Falha ao deletar a lista' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Lista e leads deletados com sucesso' })
  } catch (err) {
    console.error('Erro na API de deleção em cascata:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
