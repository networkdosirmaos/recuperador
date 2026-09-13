"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PullLeadsCard } from '@/components/colaborador/PullLeadsCard'
import { MyLeadsTable, MyLead } from '@/components/colaborador/MyLeadsTable'

export default function ColaboradorDashboard() {
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<{ id: string, name: string }[]>([])
  const [myLeads, setMyLeads] = useState<MyLead[]>([])
  const [isPulling, setIsPulling] = useState(false)
  const [session, setSession] = useState<any>(null)

  const fetchData = async (userId: string) => {
    try {
      // Buscar listas ativas
      const { data: listsData } = await supabase
        .from('lead_lists')
        .select('id, name')
        .eq('status', 'active')
        .order('imported_at', { ascending: false })

      if (listsData) setLists(listsData)

      // Buscar leads atuais do colaborador (onde ele é o responsável e não finalizou)
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, phone, email, status, updated_at')
        .eq('current_assignee_id', userId)
        .not('status', 'in', '("recuperado","perdido")')
        .order('updated_at', { ascending: false })

      if (leadsData) {
        setMyLeads(leadsData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Pegar o usuário logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchData(session.user.id)
      }
    })
  }, [])

  const handlePullLeads = async (listId: string) => {
    if (!session?.user) return
    
    setIsPulling(true)
    try {
      // Chamar a RPC para distribuir os leads atomica e exclusivamente para este usuário
      const { data: count, error } = await supabase.rpc('distribute_leads', {
        p_assignee_id: session.user.id,
        p_assigned_by: session.user.id, // O próprio colaborador está se auto-atribuindo
        p_list_id: listId,
        p_limit: 10
      })

      if (error) {
        console.error('Erro ao puxar leads:', error)
        alert('Erro ao puxar leads. Tente novamente.')
      } else if (count === 0) {
        alert('Não há leads novos disponíveis nesta lista.')
      } else {
        // Recarregar a mesa de trabalho
        await fetchData(session.user.id)
      }
    } catch (err) {
      console.error(err)
      alert('Erro inesperado.')
    } finally {
      setIsPulling(false)
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      // Otimisticamente atualizar a UI
      setMyLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

      // Atualizar no banco
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error

      // Se foi finalizado (recuperado ou perdido), removemos da mesa após 1 segundo
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        setTimeout(() => {
          setMyLeads(prev => prev.filter(l => l.id !== leadId))
        }, 1500)
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Falha ao atualizar o status.')
      // Em caso de erro, seria bom reverter o estado otimista, mas para MVP está ok
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {session?.user?.email?.split('@')[0]}!</h1>
        <p className="text-gray-500 mt-1">Pronto para bater a meta de hoje? Puxe novos leads e boas vendas.</p>
      </div>

      <PullLeadsCard 
        lists={lists} 
        onPullLeads={handlePullLeads} 
        isLoading={isPulling} 
      />

      <MyLeadsTable 
        leads={myLeads} 
        onStatusChange={handleStatusChange} 
      />
    </div>
  )
}
