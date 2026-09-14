"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MyLeadsTable, MyLead } from '@/components/colaborador/MyLeadsTable'
import { AlertCircle } from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerService } from '@/services/seller.service'
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime'

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

  // Queries (Dependentes do userId)
  const { data: settings } = useQuery({
    queryKey: ['system_settings'],
    queryFn: sellerService.getSettings
  })

  const { data: profile } = useQuery({
    queryKey: ['seller_profile', userId],
    queryFn: () => sellerService.getProfile(userId!),
    enabled: !!userId
  })

  const { data: lists = [] } = useQuery({
    queryKey: ['seller_lists'],
    queryFn: sellerService.getActiveLists
  })

  const { data: myLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['seller_leads', userId],
    queryFn: () => sellerService.getMyLeads(userId!),
    enabled: !!userId
  })

  // Hook Customizado do WebSocket integrado ao Cache
  useLeadsRealtime(userId)

  const loading = loadingSession || (!!userId && loadingLeads)
  const isActive = profile?.is_active !== false
  const heatSettings = settings || { super_hot_days: 2, hot_days: 7, warm_days: 30 }
  const operatorConfig = settings?.operator_columns_config

  // Mutations
  const pullLeadsMutation = useMutation({
    mutationFn: (listId: string) => sellerService.pullLeads(userId!, listId),
    onSuccess: (count) => {
      if (count === 0) {
        alert('Não há leads novos disponíveis nesta lista.')
      } else {
        queryClient.invalidateQueries({ queryKey: ['seller_leads', userId] })
      }
    },
    onError: (error) => {
      console.error(error)
      alert('Erro inesperado ao puxar leads.')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string, newStatus: string }) => 
      sellerService.updateLeadStatus(leadId, newStatus),
    onMutate: async ({ leadId, newStatus }) => {
      // Optimistic Update
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
        }, 1500)
      }
    },
    onError: (err, variables, context) => {
      alert('Falha ao atualizar o status.')
      if (context?.previousLeads) {
        queryClient.setQueryData(['seller_leads', userId], context.previousLeads)
      }
    }
  })

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    updateStatusMutation.mutate({ leadId, newStatus })
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
        <h1 className="text-2xl font-bold text-gray-900">Olá, {sessionData?.user?.email?.split('@')[0]}!</h1>
        <p className="text-gray-500 mt-1">Bem-vindo(a) à sua mesa de trabalho. Atenda os clientes abaixo.</p>
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

      <MyLeadsTable 
        leads={myLeads} 
        onStatusChange={handleStatusChange} 
        heatSettings={heatSettings}
        operatorConfig={operatorConfig}
      />
    </div>
  )
}
