"use client"

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ChevronDown, RefreshCw, Check } from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/services/seller.service'
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime'
import toast from 'react-hot-toast'

import { InboxKPIs } from '@/components/colaborador/inbox/InboxKPIs'
import { InboxLeadCard } from '@/components/colaborador/inbox/InboxLeadCard'
import { InboxSidebar } from '@/components/colaborador/inbox/InboxSidebar'
import { useLeadGamification } from '@/hooks/useLeadGamification'
import { useLeadBuckets } from '@/hooks/useLeadBuckets'
import { GroupedVirtuoso } from 'react-virtuoso'
import { updateLeadStatusSecure, appendLeadHistorySecure, updateNextActionSecure } from '@/app/actions/lead.actions'

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

  const { data: myLeads = [], isLoading: loadingLeads, isFetching, refetch } = useQuery({
    queryKey: ['seller_leads', userId],
    queryFn: () => sellerService.getMyLeads(userId!),
    enabled: !!userId
  })

  useLeadsRealtime(userId)

  const loading = loadingSession || (!!userId && loadingLeads)
  const isActive = profile?.is_active !== false

  // UI States
  const [selectedTab, setSelectedTab] = useState<'pendentes' | 'em_andamento' | 'finalizados'>('pendentes')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)

  const handleRefresh = async () => {
    await refetch()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50) // Micro-vibração sutil
    }
    setShowRefreshSuccess(true)
    setTimeout(() => setShowRefreshSuccess(false), 2000)
  }

  
  // Lógica de Negócio Modularizada
  const { filteredLeads, groupedLeads, counts } = useLeadBuckets(myLeads, selectedTab)

  // Motor de Gamificação
  const { isAnimating } = useLeadGamification(counts.pendentes)

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string, newStatus: string }) => 
      updateLeadStatusSecure(leadId, newStatus, userId!),
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
      updateNextActionSecure(leadId, nextActionAt, userId!),
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

  const addNoteMutation = useMutation({
    mutationFn: ({ leadId, text }: { leadId: string, text: string }) => 
      appendLeadHistorySecure(leadId, userId!, text),
    onMutate: async ({ leadId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', userId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', userId])
      
      const newEvent = {
        type: 'HUMAN_NOTE',
        description: text,
        created_at: new Date().toISOString()
      }
      
      queryClient.setQueryData(['seller_leads', userId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, history_log: [...(Array.isArray(l.history_log) ? l.history_log : []), newEvent] } : l)
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

  const handleSaveNote = async (leadId: string, text: string) => {
    await addNoteMutation.mutateAsync({ leadId, text })
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const selectedLeadData = myLeads.find((l: any) => l.id === selectedLeadId) || null

  // Virtualization Data Prep
  const groupNames: string[] = []
  const groupCounts: number[] = []
  const flattenedLeads: any[] = []

  if (groupedLeads.agora.length > 0) {
    groupNames.push('Agora')
    groupCounts.push(groupedLeads.agora.length)
    flattenedLeads.push(...groupedLeads.agora)
  }
  if (groupedLeads.hoje.length > 0) {
    groupNames.push('Hoje')
    groupCounts.push(groupedLeads.hoje.length)
    flattenedLeads.push(...groupedLeads.hoje)
  }
  if (groupedLeads.antigos.length > 0) {
    groupNames.push('Anteriores')
    groupCounts.push(groupedLeads.antigos.length)
    flattenedLeads.push(...groupedLeads.antigos)
  }

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

      {/* HEADER DINÂMICO */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[26px] font-bold text-[#1a1d23] mb-1 tracking-tight">Central de Leads{sessionData?.user?.user_metadata?.name ? `, ${sessionData.user.user_metadata.name.split(' ')[0]}` : ''}</h1>
          <p className="text-[#6b7280] text-[15px]">Aqui está o que exige sua atenção hoje.</p>
          {profile?.affiliate_link && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(profile.affiliate_link)
                toast.success('Link copiado!')
              }}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copiar Meu Link (Produto)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mensagem sutil de sucesso */}
          {showRefreshSuccess && (
            <span className="text-xs font-medium text-emerald-600 animate-in fade-in slide-in-from-right-2 duration-300">
              Atualizada
            </span>
          )}

          {/* Botão de Refresh (Mobile e Desktop) */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className={`flex items-center justify-center p-2.5 md:p-2 bg-white rounded-lg border shadow-sm transition-colors ${showRefreshSuccess ? 'border-emerald-200 text-emerald-600' : 'border-gray-200 text-[#6b7280] hover:text-indigo-600'}`}
            title="Atualizar fila"
          >
            {showRefreshSuccess ? (
              <Check className="w-5 h-5 md:w-4 md:h-4" />
            ) : (
              <RefreshCw className={`w-5 h-5 md:w-4 md:h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            )}
          </button>

          <div className="hidden md:flex items-center gap-1 text-[#6b7280] text-sm font-medium cursor-pointer hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            Mais recentes <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* KPIs INTERATIVOS (Botões de Abas) */}
      <InboxKPIs 
        pendentes={counts.pendentes} 
        emAndamento={counts.em_andamento} 
        finalizados={counts.finalizados}
        animate={isAnimating}
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      {/* Inbox List Grouped (Virtualized) */}
      <div className="flex flex-col gap-8">
        {flattenedLeads.length > 0 && (
          <GroupedVirtuoso
            useWindowScroll
            groupCounts={groupCounts}
            groupContent={(index) => {
              return (
                <div className="bg-[#f8fafc] py-2 z-10 mb-1">
                  <h4 className="text-[15px] font-bold text-[#374151]">{groupNames[index]}</h4>
                </div>
              )
            }}
            itemContent={(index, groupIndex) => {
              const lead = flattenedLeads[index]
              return (
                <div className="pb-3">
                  <InboxLeadCard 
                    key={lead.id} 
                    lead={lead} 
                    isSelected={selectedLeadId === lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                  />
                </div>
              )
            }}
          />
        )}

        {filteredLeads.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-[#e5e7eb] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            {selectedTab === 'pendentes' && (
              <>
                <div className="text-5xl mb-4">🔥</div>
                <h3 className="text-lg font-bold text-[#1a1d23] mb-1">Inbox Zero Alcançado!</h3>
                <p className="text-[#6b7280]">Você limpou a sua Central de Leads. Respire um pouco ou puxe novos leads.</p>
              </>
            )}
            {selectedTab === 'em_andamento' && (
              <>
                <div className="text-5xl mb-4">☕</div>
                <h3 className="text-lg font-bold text-[#1a1d23] mb-1">Esteira Vazia</h3>
                <p className="text-[#6b7280]">Nenhum cliente em atendimento. Seu foco total deve estar nos pendentes.</p>
              </>
            )}
            {selectedTab === 'finalizados' && (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-bold text-[#1a1d23] mb-1">Nada Finalizado Hoje</h3>
                <p className="text-[#6b7280]">Os leads que você encerrar aparecerão aqui.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Fixo */}
      <div className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity md:hidden ${selectedLeadId ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSelectedLeadId(null)}></div>
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] transform transition-transform duration-300 ${selectedLeadId ? 'translate-x-0' : 'translate-x-full'}`}>
        <InboxSidebar 
          lead={selectedLeadData} 
          onClose={() => setSelectedLeadId(null)} 
          onUpdateStatus={handleStatusChange}
          onScheduleAction={handleScheduleAction}
          onSaveNote={handleSaveNote}
          affiliateLink={profile?.affiliate_link}
        />
      </div>
    </div>
  )
}
