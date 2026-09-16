"use client"

import { useEffect, useState, useMemo } from 'react'
import { AlertCircle, ChevronDown, RefreshCw, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/services/seller.service'
import { adminService } from '@/services/admin.service'
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime'
import toast from 'react-hot-toast'

import { InboxKPIs } from '@/components/colaborador/inbox/InboxKPIs'
import { InboxLeadCard } from '@/components/colaborador/inbox/InboxLeadCard'
import { InboxSidebar } from '@/components/colaborador/inbox/InboxSidebar'
import { useLeadGamification } from '@/hooks/useLeadGamification'
import { useLeadBuckets } from '@/hooks/useLeadBuckets'
import { GroupedVirtuoso } from 'react-virtuoso'
import { updateLeadStatusSecure, appendLeadHistorySecure, updateNextActionSecure } from '@/app/actions/lead.actions'

interface InboxViewProps {
  targetUserId: string;
  viewerRole: 'admin' | 'collaborator';
  viewerId: string;
}

export function InboxView({ targetUserId, viewerRole, viewerId }: InboxViewProps) {
  const queryClient = useQueryClient()
  
  // Queries for target user (the seller whose leads we are viewing)
  const { data: profile } = useQuery({
    queryKey: ['seller_profile', targetUserId],
    queryFn: () => sellerService.getProfile(targetUserId),
    enabled: !!targetUserId
  })

  const { data: myLeads = [], isLoading: loadingLeads, isFetching, refetch } = useQuery({
    queryKey: ['seller_leads', targetUserId],
    queryFn: () => sellerService.getMyLeads(targetUserId),
    enabled: !!targetUserId
  })

  useLeadsRealtime(targetUserId)

  const loading = loadingLeads
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

  // Mutations (using viewerId for history_log author tracking)
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string, newStatus: string }) => 
      updateLeadStatusSecure(leadId, newStatus, viewerId),
    onMutate: async ({ leadId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', targetUserId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', targetUserId])
      queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l)
      )
      return { previousLeads }
    },
    onSuccess: (_, { leadId, newStatus }) => {
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        setTimeout(() => {
          queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
            old?.filter((l: any) => l.id !== leadId)
          )
          if (selectedLeadId === leadId) setSelectedLeadId(null)
        }, 1500)
      }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao atualizar o status.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', targetUserId], context.previousLeads)
      }
    }
  })

  const updateScheduleMutation = useMutation({
    mutationFn: ({ leadId, nextActionAt }: { leadId: string, nextActionAt: string | null }) => 
      updateNextActionSecure(leadId, nextActionAt, viewerId),
    onMutate: async ({ leadId, nextActionAt }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', targetUserId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', targetUserId])
      queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, next_action_at: nextActionAt } : l)
      )
      return { previousLeads }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao atualizar o agendamento.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', targetUserId], context.previousLeads)
      }
    }
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ leadId, text }: { leadId: string, text: string }) => 
      appendLeadHistorySecure(leadId, viewerId, text),
    onMutate: async ({ leadId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', targetUserId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', targetUserId])
      
      const newEvent = {
        type: 'HUMAN_NOTE',
        description: text,
        created_at: new Date().toISOString()
      }
      
      queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, history_log: [...(Array.isArray(l.history_log) ? l.history_log : []), newEvent] } : l)
      )
      return { previousLeads }
    },
    onError: (err, variables, context) => {
      toast.error('Falha ao salvar anotação.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', targetUserId], context.previousLeads)
      }
    }
  })

  // === ADMIN MUTATIONS ===
  const removeFromQueueMutation = useMutation({
    mutationFn: (leadId: string) => adminService.returnSingleLeadToPool(leadId),
    onSuccess: (_, leadId) => {
      queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
        old?.filter((l: any) => l.id !== leadId)
      )
      if (selectedLeadId === leadId) setSelectedLeadId(null)
      toast.success('Lead devolvido para a base geral!')
    },
    onError: () => toast.error('Falha ao remover lead da fila.')
  })

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => adminService.deleteLeads([leadId]),
    onSuccess: (_, leadId) => {
      queryClient.setQueryData(['seller_leads', targetUserId], (old: any) => 
        old?.filter((l: any) => l.id !== leadId)
      )
      if (selectedLeadId === leadId) setSelectedLeadId(null)
      toast.success('Lead excluído permanentemente!')
    },
    onError: () => toast.error('Falha ao excluir lead.')
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
      
      {viewerRole === 'admin' && (
        <div className="bg-slate-900 text-slate-100 px-6 py-4 rounded-xl flex items-center justify-between mb-4 shadow-md border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👀</span>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-amber-400 uppercase">Modo Gestor (Espião)</h2>
              <p className="text-slate-300 text-sm mt-0.5">Visualizando e editando a fila de: <span className="font-semibold text-white">{profile?.full_name || 'Vendedor'}</span></p>
            </div>
          </div>
          <Link href="/admin/equipe" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Equipe
          </Link>
        </div>
      )}

      <div className="hidden md:block">
        <h1 className="text-[28px] font-bold text-[#1a1d23]">{viewerRole === 'admin' ? `Fila de ${profile?.full_name || 'Vendedor'}` : 'Minha fila'}</h1>
        <p className="text-[#6b7280] mt-1 text-[15px]">Leads que precisam de atenção agora.</p>
      </div>

      {!isActive ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-start">
          <AlertCircle className="w-6 h-6 text-orange-600 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Conta pausada</h3>
            <p className="text-orange-700 mt-1">
              O recebimento de novos leads está pausado temporariamente. 
              Ainda é possível finalizar o atendimento dos clientes que já estão na mesa abaixo.
            </p>
          </div>
        </div>
      ) : null}

      {counts.coolingDown > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-bold text-sm">{viewerRole === 'admin' ? `Este vendedor tem ${counts.coolingDown} lead(s)` : `Você tem ${counts.coolingDown} lead(s)`} aguardando pagamento de Pix.</p>
            <p className="text-xs opacity-90 mt-0.5">Eles aparecerão na fila automaticamente caso o prazo expire sem pagamento.</p>
          </div>
        </div>
      )}

      {/* HEADER DINÂMICO */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[26px] font-bold text-[#1a1d23] mb-1 tracking-tight">Central de Leads{profile?.full_name && viewerRole === 'collaborator' ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
          <p className="text-[#6b7280] text-[15px]">{viewerRole === 'admin' ? 'Acompanhando a esteira de atendimento.' : 'Aqui está o que exige sua atenção hoje.'}</p>
          {viewerRole === 'collaborator' && (profile?.affiliate_link || profile?.sales_link) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile?.affiliate_link && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(profile.affiliate_link)
                    toast.success('Link do Checkout copiado!')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copiar Checkout
                </button>
              )}
              {profile?.sales_link && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(profile.sales_link)
                    toast.success('Link da Página de Vendas copiado!')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg border border-emerald-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Copiar Pág. de Vendas
                </button>
              )}
            </div>
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
                <p className="text-[#6b7280]">{viewerRole === 'admin' ? 'Este vendedor limpou a Central de Leads.' : 'Você limpou a sua Central de Leads. Respire um pouco ou puxe novos leads.'}</p>
              </>
            )}
            {selectedTab === 'em_andamento' && (
              <>
                <div className="text-5xl mb-4">☕</div>
                <h3 className="text-lg font-bold text-[#1a1d23] mb-1">Esteira Vazia</h3>
                <p className="text-[#6b7280]">Nenhum cliente em atendimento.</p>
              </>
            )}
            {selectedTab === 'finalizados' && (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-bold text-[#1a1d23] mb-1">Nada Finalizado Hoje</h3>
                <p className="text-[#6b7280]">Os leads encerrados aparecerão aqui.</p>
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
          affiliateLink={viewerRole === 'collaborator' ? profile?.affiliate_link : undefined}
          salesLink={viewerRole === 'collaborator' ? profile?.sales_link : undefined}
          viewerRole={viewerRole}
          canSeeEmail={profile?.can_see_email ?? true}
          onRemoveFromQueue={viewerRole === 'admin' ? () => removeFromQueueMutation.mutate(selectedLeadId!) : undefined}
          onDeleteLead={viewerRole === 'admin' ? () => deleteLeadMutation.mutate(selectedLeadId!) : undefined}
        />
      </div>
    </div>
  )
}
