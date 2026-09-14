"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PullLeadsCard } from '@/components/colaborador/PullLeadsCard'
import { MyLeadsTable, MyLead } from '@/components/colaborador/MyLeadsTable'
import { AlertCircle } from 'lucide-react'

export default function ColaboradorDashboard() {
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<{ id: string, name: string }[]>([])
  const [myLeads, setMyLeads] = useState<MyLead[]>([])
  const [isPulling, setIsPulling] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [isActive, setIsActive] = useState(true)
  const [heatSettings, setHeatSettings] = useState({ super_hot_days: 2, hot_days: 7, warm_days: 30 })

  const [operatorConfig, setOperatorConfig] = useState<any>(null)

  const fetchData = async (userId: string) => {
    try {
      // Buscar configuracoes de temperatura
      const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single()
      if (settings) {
        setHeatSettings(settings)
        if (settings.operator_columns_config) {
          setOperatorConfig(settings.operator_columns_config)
        }
      }

      // Checar se o colaborador est ativo
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', userId)
        .single()
        
      if (profile && profile.is_active === false) {
        setIsActive(false)
      } else {
        setIsActive(true)
      }

      // Buscar listas ativas
      const { data: listsData } = await supabase
        .from('lead_lists')
        .select('id, name')
        .eq('status', 'active')
        .order('imported_at', { ascending: false })

      if (listsData) setLists(listsData)

      // Buscar leads atuais do colaborador (onde ele o responsvel e no finalizou)
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, phone, email, product_name, status, temperature, updated_at, cakto_updated_at, payment_method, cakto_status, reason, cakto_event, created_at')
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
    // Pegar o usurio logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchData(session.user.id)
        
        // Ativar o Rádio (Realtime WebSocket)
        const channel = supabase
          .channel('realtime_leads')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'leads',
              filter: `current_assignee_id=eq.${session.user.id}`
            },
            (payload) => {
              console.log('NOVO LEAD!', payload.new)
              const novoLead = payload.new as MyLead
              // Adiciona na mesa imediatamente
              setMyLeads(prev => {
                if (prev.find(l => l.id === novoLead.id)) return prev
                return [novoLead, ...prev]
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'leads'
            },
            (payload) => {
              // Se o admin deletou o lead (em cascata), removemos da tela do vendedor instantaneamente
              console.log('LEAD DELETADO EM CASCATA!', payload.old)
              setMyLeads(prev => prev.filter(l => l.id !== payload.old.id))
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } else {
        // Se não tiver usuário logado, manda pro login e para o loading
        setLoading(false)
        window.location.href = '/login'
      }
    })
  }, [])

  const handlePullLeads = async (listId: string) => {
    if (!session?.user) return
    
    setIsPulling(true)
    try {
      // Chamar a RPC para distribuir os leads atomica e exclusivamente para este usurio
      const { data: count, error } = await supabase.rpc('distribute_leads', {
        p_assignee_id: session.user.id,
        p_assigned_by: session.user.id, // O prprio colaborador est se auto-atribuindo
        p_list_id: listId,
        p_limit: 10
      })

      if (error) {
        console.error('Erro ao puxar leads:', error)
        alert('Erro ao puxar leads. Tente novamente.')
      } else if (count === 0) {
        alert('No h leads novos disponveis nesta lista.')
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

      // Se foi finalizado (recuperado ou perdido), removemos da mesa aps 1 segundo
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        setTimeout(() => {
          setMyLeads(prev => prev.filter(l => l.id !== leadId))
        }, 1500)
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Falha ao atualizar o status.')
      // Em caso de erro, seria bom reverter o estado otimista, mas para MVP est ok
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

      {!isActive ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-start">
          <AlertCircle className="w-6 h-6 text-orange-600 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Sua conta est pausada</h3>
            <p className="text-orange-700 mt-1">
              O Administrador pausou o seu recebimento de novos leads temporariamente. 
              Voc ainda pode finalizar o atendimento dos clientes que j esto na sua mesa abaixo.
            </p>
          </div>
        </div>
      ) : (
        <PullLeadsCard 
          lists={lists} 
          onPullLeads={handlePullLeads} 
          isLoading={isPulling} 
        />
      )}

      <MyLeadsTable 
        leads={myLeads} 
        onStatusChange={handleStatusChange} 
        heatSettings={heatSettings}
        operatorConfig={operatorConfig}
      />
    </div>
  )
}
