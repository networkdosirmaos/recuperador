"use client"

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ChevronDown } from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/services/seller.service'
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime'
import toast from 'react-hot-toast'

import { InboxKPIs } from '@/components/colaborador/inbox/InboxKPIs'
import { InboxLeadCard } from '@/components/colaborador/inbox/InboxLeadCard'
import { InboxSidebar } from '@/components/colaborador/inbox/InboxSidebar'
import { useLeadGamification } from '@/hooks/useLeadGamification'

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

  useLeadsRealtime(userId)

  const loading = loadingSession || (!!userId && loadingLeads)
  const isActive = profile?.is_active !== false

  // UI States
  const [selectedTab, setSelectedTab] = useState<'todos' | 'novo' | 'em_atendimento' | 'retornos' | 'recuperados'>('todos')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  
  // Relógio Fantasma (atualiza a cada 30 segundos)
  const [nowTick, setNowTick] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Derived Data
  const { filteredLeads, groupedLeads, counts } = useMemo(() => {
    let novos = 0
    let retornos = 0
    let em_atendimento = 0
    let recuperados_count = 0
    let coolingDown_count = 0

    const isApproved = (l: any) => l.status === 'recuperado' || l.gateway_event === 'purchase_approved' || l.gateway_status === 'approved'
    const isCoolingDown = (l: any) => {
      const isPixEvent = l.gateway_event === 'pix_generated' || l.gateway_event === 'pix_gerado' || l.gateway_event === 'waiting_payment';
      return isPixEvent && l.status === 'novo' && (nowTick - new Date(l.updated_at || l.created_at).getTime() < 6 * 60 * 1000);
    }

    myLeads.forEach((l: any) => {
      if (isApproved(l)) {
        recuperados_count++
      } else if (isCoolingDown(l)) {
        coolingDown_count++
      } else if (l.next_action_at) {
        retornos++
      } else if (l.status === 'novo') {
        novos++
      } else if (l.status === 'em_atendimento') {
        em_atendimento++
      }
    })

    const filtered = myLeads.filter((l: any) => {
      if (isApproved(l)) return selectedTab === 'recuperados'
      if (isCoolingDown(l)) return false

      if (selectedTab === 'todos') return true
      if (selectedTab === 'retornos') return !!l.next_action_at
      if (selectedTab === 'novo') return !l.next_action_at && l.status === 'novo'
      if (selectedTab === 'em_atendimento') return !l.next_action_at && l.status === 'em_atendimento'
      return false
    })

    // Grouping by time (Agora = less than 2h old, Hoje = today)
    const grouped = { agora: [] as any[], hoje: [] as any[], antigos: [] as any[] }
    
    filtered.forEach((l: any) => {
      const dateToCompare = l.next_action_at ? new Date(l.next_action_at) : new Date(l.created_at || l.updated_at)
      const diffMs = nowTick - dateToCompare.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      if (diffHours < 2 && diffHours >= -1) {
        grouped.agora.push(l)
      } else if (diffHours < 24 && diffHours >= -24) {
        grouped.hoje.push(l)
      } else {
        grouped.antigos.push(l)
      }
    })

    return { 
      filteredLeads: filtered, 
      groupedLeads: grouped,
      counts: { 
        novos, 
        retornos, 
        em_atendimento, 
        recuperados: recuperados_count, 
        coolingDown: coolingDown_count,
        todos: myLeads.length - recuperados_count - coolingDown_count 
      } 
    }
  }, [myLeads, selectedTab, nowTick])

  // Motor de Gamificação
  const { isAnimating } = useLeadGamification(counts.novos)

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

  const updateNoteMutation = useMutation({
    mutationFn: ({ leadId, notes }: { leadId: string, notes: string }) => 
      sellerService.updateNote(leadId, notes),
    onMutate: async ({ leadId, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', userId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', userId])
      queryClient.setQueryData(['seller_leads', userId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, notes } : l)
      )
      return { previousLeads }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao salvar anotação.')
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

  const handleSaveNote = async (leadId: string, notes: string) => {
    await updateNoteMutation.mutateAsync({ leadId, notes })
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
    <div className="max-w-[1200px] w-full mx-auto space-y-6 pb-12">
      <div className="hidden md:block">
        <h1 className="text-[28px] font-bold text-[#1a1d23]">Minha fila</h1>
        <p className="text-[#6b7280] mt-1 text-[15px]">Leads que precisam da sua atenção agora.</p>
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

      {counts.coolingDown > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-blue-900">
              Você tem {counts.coolingDown} {counts.coolingDown === 1 ? 'lead aguardando' : 'leads aguardando'} pagamento de Pix...
            </p>
            <p className="text-[12px] text-blue-700">Eles aparecerão na sua fila automaticamente caso não paguem nos próximos minutos.</p>
          </div>
        </div>
      )}

      <InboxKPIs 
        novos={counts.novos} 
        retornos={counts.retornos} 
        recuperados={counts.recuperados}
        animate={isAnimating}
      />

      {/* TABS e Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedTab('todos')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'todos' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-white border border-[#e5e7eb] text-[#374151] hover:bg-gray-50'}`}
          >
            Todos ({counts.todos})
          </button>
          <button 
            onClick={() => setSelectedTab('novo')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'novo' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-white border border-[#e5e7eb] text-[#374151] hover:bg-gray-50'}`}
          >
            Novos ({counts.novos})
          </button>
          <button 
            onClick={() => setSelectedTab('em_atendimento')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'em_atendimento' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-white border border-[#e5e7eb] text-[#374151] hover:bg-gray-50'}`}
          >
            Em atendimento ({counts.em_atendimento})
          </button>
          <button 
            onClick={() => setSelectedTab('retornos')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'retornos' ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-white border border-[#e5e7eb] text-[#374151] hover:bg-gray-50'}`}
          >
            Retornos ({counts.retornos})
          </button>
          <button 
            onClick={() => setSelectedTab('recuperados')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedTab === 'recuperados' ? 'bg-[#10b981] text-white shadow-sm' : 'bg-white border border-[#e5e7eb] text-[#10b981] hover:bg-green-50'}`}
          >
            🏆 Aprovados ({counts.recuperados})
          </button>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[#6b7280] text-sm font-medium cursor-pointer hover:text-gray-900">
          Mais recentes
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Inbox List Grouped */}
      <div className="flex flex-col gap-8">
        {groupedLeads.agora.length > 0 && (
          <div>
            <h4 className="text-[15px] font-bold text-[#374151] mb-3">Agora</h4>
            <div className="flex flex-col gap-3">
              {groupedLeads.agora.map((lead: any) => (
                <InboxLeadCard 
                  key={lead.id} lead={lead} isSelected={selectedLeadId === lead.id} onClick={() => setSelectedLeadId(lead.id)}
                />
              ))}
            </div>
          </div>
        )}

        {groupedLeads.hoje.length > 0 && (
          <div>
            <h4 className="text-[15px] font-bold text-[#374151] mb-3">Hoje</h4>
            <div className="flex flex-col gap-3">
              {groupedLeads.hoje.map((lead: any) => (
                <InboxLeadCard 
                  key={lead.id} lead={lead} isSelected={selectedLeadId === lead.id} onClick={() => setSelectedLeadId(lead.id)}
                />
              ))}
            </div>
          </div>
        )}

        {groupedLeads.antigos.length > 0 && (
          <div>
            <h4 className="text-[15px] font-bold text-[#374151] mb-3">Anteriores</h4>
            <div className="flex flex-col gap-3">
              {groupedLeads.antigos.map((lead: any) => (
                <InboxLeadCard 
                  key={lead.id} lead={lead} isSelected={selectedLeadId === lead.id} onClick={() => setSelectedLeadId(lead.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredLeads.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-[#e5e7eb] text-[#6b7280]">
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
          onSaveNote={handleSaveNote}
        />
      </div>
    </div>
  )
}
