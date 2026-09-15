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
  const [selectedTab, setSelectedTab] = useState<'pendentes' | 'em_andamento' | 'fechados'>('pendentes')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  
  // Relógio Fantasma (atualiza a cada 30 segundos)
  const [nowTick, setNowTick] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Derived Data
  const { filteredLeads, groupedLeads, counts } = useMemo(() => {
    let pendentes_count = 0
    let em_andamento_count = 0
    let fechados_count = 0
    let coolingDown_count = 0

    const isApproved = (l: any) => l.status === 'recuperado' || l.gateway_event === 'purchase_approved' || l.gateway_status === 'approved'
    const isCoolingDown = (l: any) => {
      const isPixEvent = l.gateway_event === 'pix_generated' || l.gateway_event === 'pix_gerado' || l.gateway_event === 'waiting_payment';
      return isPixEvent && l.status === 'novo' && (nowTick - new Date(l.updated_at || l.created_at).getTime() < 6 * 60 * 1000);
    }
    const isPastDue = (l: any) => l.next_action_at && new Date(l.next_action_at).getTime() <= nowTick
    const isFuture = (l: any) => l.next_action_at && new Date(l.next_action_at).getTime() > nowTick

    const getBucket = (l: any) => {
      if (isApproved(l)) return 'fechados'
      if (isCoolingDown(l)) return 'geladeira'
      // Se é novo OU o retorno está vencido -> PENDENTES (Fogo)
      if (l.status === 'novo' || isPastDue(l)) return 'pendentes'
      // O resto (em_atendimento sem data, ou com retorno no futuro) -> EM ANDAMENTO
      return 'em_andamento'
    }

    myLeads.forEach((l: any) => {
      const bucket = getBucket(l)
      if (bucket === 'fechados') fechados_count++
      else if (bucket === 'geladeira') coolingDown_count++
      else if (bucket === 'pendentes') pendentes_count++
      else if (bucket === 'em_andamento') em_andamento_count++
    })

    const filtered = myLeads.filter((l: any) => {
      const bucket = getBucket(l)
      if (bucket === 'geladeira') return false
      return bucket === selectedTab
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
        pendentes: pendentes_count, 
        em_andamento: em_andamento_count, 
        fechados: fechados_count, 
        coolingDown: coolingDown_count,
        todos_ativos: pendentes_count + em_andamento_count 
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
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-bold text-sm">Você tem {counts.coolingDown} lead(s) aguardando pagamento de Pix.</p>
            <p className="text-xs opacity-90 mt-0.5">Eles aparecerão na sua fila automaticamente caso o prazo expire sem pagamento.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1a1d23] mb-1 tracking-tight">Minha fila</h1>
        <p className="text-[#6b7280] text-[15px]">O que você precisa atacar agora.</p>
      </div>

      {/* KPIs */}
      <InboxKPIs 
        pendentes={counts.pendentes} 
        emAndamento={counts.em_andamento} 
        fechados={counts.fechados}
        animate={isAnimating}
      />

      {/* TABS e Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setSelectedTab('pendentes')}
            className={`px-4 py-2 rounded-lg font-bold text-[14px] whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedTab === 'pendentes' 
                ? 'bg-[#ef4444] text-white shadow-sm' 
                : 'bg-white border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f9fafb]'
            }`}
          >
            🔴 Pendentes <span className="opacity-80">({counts.pendentes})</span>
          </button>
          <button
            onClick={() => setSelectedTab('em_andamento')}
            className={`px-4 py-2 rounded-lg font-bold text-[14px] whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedTab === 'em_andamento' 
                ? 'bg-[#f59e0b] text-white shadow-sm' 
                : 'bg-white border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f9fafb]'
            }`}
          >
            🟡 Em Andamento <span className="opacity-80">({counts.em_andamento})</span>
          </button>
          <button
            onClick={() => setSelectedTab('fechados')}
            className={`px-4 py-2 rounded-lg font-bold text-[14px] whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedTab === 'fechados' 
                ? 'bg-[#10b981] text-white shadow-sm' 
                : 'bg-white border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f9fafb]'
            }`}
          >
            🏆 Fechados <span className="opacity-80">({counts.fechados})</span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[#6b7280] text-sm font-medium cursor-pointer hover:text-gray-900">
          Mais recentes <ChevronDown className="w-4 h-4" />
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
