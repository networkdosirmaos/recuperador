"use client"

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/services/seller.service'
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime'
import toast from 'react-hot-toast'

import { InboxKPIs } from '@/components/colaborador/inbox/InboxKPIs'
import { InboxLeadCard } from '@/components/colaborador/inbox/InboxLeadCard'
import { InboxSidebar } from '@/components/colaborador/inbox/InboxSidebar'

export default function ColaboradorDashboard() {
  const queryClient = useQueryClient()
  
  // Buscar Sessão do usuário
  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) window.location.href = '/login'
      return session
    }
  })

  const userId = sessionData?.user?.id

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['seller_profile', userId],
    queryFn: () => sellerService.getProfile(userId!),
    enabled: !!userId
  })

  const { data: myLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['seller_leads', userId],
    queryFn: () => sellerService.getMyLeads(userId!),
    enabled: !!userId
  })

  // Hook Customizado do WebSocket
  useLeadsRealtime(userId)

  const loading = loadingSession || (!!userId && loadingLeads)
  const isActive = profile?.is_active !== false

  // UI States
  const [selectedTab, setSelectedTab] = useState<'todos' | 'novo' | 'em_atendimento' | 'retornos'>('todos')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  // Derived Data
  const { filteredLeads, counts } = useMemo(() => {
    let novos = 0
    let retornos = 0
    let em_atendimento = 0

    myLeads.forEach((l: any) => {
      if (l.next_action_at) {
        retornos++
      } else if (l.status === 'novo') {
        novos++
      } else if (l.status === 'em_atendimento') {
        em_atendimento++
      }
    })

    const filtered = myLeads.filter((l: any) => {
      if (selectedTab === 'todos') return true
      if (selectedTab === 'retornos') return !!l.next_action_at
      if (selectedTab === 'novo') return !l.next_action_at && l.status === 'novo'
      if (selectedTab === 'em_atendimento') return !l.next_action_at && l.status === 'em_atendimento'
      return true
    })

    return { 
      filteredLeads: filtered, 
      counts: { novos, retornos, em_atendimento, todos: myLeads.length } 
    }
  }, [myLeads, selectedTab])

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string, newStatus: string }) => 
      sellerService.updateLeadStatus(leadId, newStatus),
    onMutate: async ({ leadId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', userId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', userId])
      queryClient.setQueryData(['seller_leads', userId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l)
      )
      return { previousLeads }
    },
    onSuccess: (_, { leadId, newStatus }) => {
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        setTimeout(() => {
          queryClient.setQueryData(['seller_leads', userId], (old: any) => 
            old?.filter((l: any) => l.id !== leadId)
          )
          if (selectedLeadId === leadId) setSelectedLeadId(null)
        }, 1500)
      }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao atualizar o status.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', userId], context.previousLeads)
      }
    }
  })

  const updateScheduleMutation = useMutation({
    mutationFn: ({ leadId, nextActionAt }: { leadId: string, nextActionAt: string | null }) => 
      sellerService.updateNextAction(leadId, nextActionAt),
    onMutate: async ({ leadId, nextActionAt }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', userId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', userId])
      queryClient.setQueryData(['seller_leads', userId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, next_action_at: nextActionAt } : l)
      )
      return { previousLeads }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao atualizar o agendamento.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', userId], context.previousLeads)
      }
    }
  })

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await updateStatusMutation.mutateAsync({ leadId, newStatus })
  }

  const handleScheduleAction = async (leadId: string, nextActionAt: string | null) => {
    await updateScheduleMutation.mutateAsync({ leadId, nextActionAt })
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const selectedLeadData = myLeads.find((l: any) => l.id === selectedLeadId) || null

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha Fila</h1>
        <p className="text-gray-500 mt-1">Leads que precisam da sua atenção agora.</p>
      </div>

      {!isActive ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-start">
          <AlertCircle className="w-6 h-6 text-orange-600 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Sua conta está pausada</h3>
            <p className="text-orange-700 mt-1">
              O Administrador pausou o seu recebimento de novos leads temporariamente. 
              Você ainda pode finalizar o atendimento dos clientes que já estão na sua mesa abaixo.
            </p>
          </div>
        </div>
      ) : null}

      <InboxKPIs 
        novos={counts.novos} 
        retornos={counts.retornos} 
        recuperados={0}
      />

      {/* TABS de Filtro */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setSelectedTab('todos')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'todos' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Todos ({counts.todos})
        </button>
        <button 
          onClick={() => setSelectedTab('novo')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'novo' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Novos ({counts.novos})
        </button>
        <button 
          onClick={() => setSelectedTab('em_atendimento')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'em_atendimento' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Em atendimento ({counts.em_atendimento})
        </button>
        <button 
          onClick={() => setSelectedTab('retornos')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'retornos' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Retornos ({counts.retornos})
        </button>
      </div>

      {/* Inbox List */}
      <div className="flex flex-col gap-4">
        {filteredLeads.map((lead: any) => (
          <InboxLeadCard 
            key={lead.id} 
            lead={lead} 
            isSelected={selectedLeadId === lead.id}
            onClick={() => setSelectedLeadId(lead.id)}
          />
        ))}
        {filteredLeads.length === 0 && (
          <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
            Nenhum lead nesta aba.
          </div>
        )}
      </div>

      {/* Sidebar Fixo */}
      <div className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity md:hidden ${selectedLeadId ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSelectedLeadId(null)}></div>
      <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ${selectedLeadId ? 'translate-x-0' : 'translate-x-full'}`}>
        <InboxSidebar 
          lead={selectedLeadData} 
          onClose={() => setSelectedLeadId(null)} 
          onUpdateStatus={handleStatusChange}
          onScheduleAction={handleScheduleAction}
        />
      </div>
    </div>
  )
}
