import { useMutation, useQueryClient } from '@tanstack/react-query'
import { returnSingleLeadToPoolSecure, deleteLeadsSecure } from '@/app/actions/admin.actions'
import { updateLeadStatusSecure, updateNextActionSecure, appendLeadHistorySecure } from '@/app/actions/lead.actions'
import toast from 'react-hot-toast'

export function useLeadMutations(targetUserId: string, viewerId: string, onSelectNull: () => void) {
  const queryClient = useQueryClient()

  const invalidateLeads = () => {
    queryClient.invalidateQueries({ queryKey: ['seller_leads_paginated', targetUserId] })
    queryClient.invalidateQueries({ queryKey: ['seller_lead_counts', targetUserId] })
  }

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: string, newStatus: string }) => {
      await updateLeadStatusSecure(leadId, newStatus, viewerId)
    },
    onSuccess: () => {
      invalidateLeads()
      toast.success('Status atualizado')
    },
    onError: () => toast.error('Erro ao atualizar status')
  })

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ leadId, nextActionAt }: { leadId: string, nextActionAt: string | null }) => {
      await updateNextActionSecure(leadId, nextActionAt, viewerId)
    },
    onSuccess: () => {
      invalidateLeads()
      toast.success('Retorno agendado')
    },
    onError: () => toast.error('Erro ao agendar retorno')
  })

  const addNoteMutation = useMutation({
    mutationFn: async ({ leadId, text }: { leadId: string, text: string }) => {
      await appendLeadHistorySecure(leadId, viewerId, text)
    },
    onSuccess: () => {
      invalidateLeads()
      // Opcional: invalidar também os eventos específicos do lead se usássemos no painel
      queryClient.invalidateQueries({ queryKey: ['lead_events', targetUserId] })
      toast.success('Anotação salva')
    },
    onError: () => toast.error('Erro ao salvar anotação')
  })

  const removeFromQueueMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (viewerId === targetUserId) {
        throw new Error('Você não pode remover leads da sua própria fila.')
      }
      await returnSingleLeadToPoolSecure(leadId)
    },
    onSuccess: () => {
      onSelectNull()
      invalidateLeads()
      toast.success('Lead removido da fila')
    },
    onError: () => toast.error('Erro ao remover lead')
  })

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (viewerId === targetUserId) {
        throw new Error('Você não pode excluir leads.')
      }
      await deleteLeadsSecure([leadId])
    },
    onSuccess: () => {
      onSelectNull()
      invalidateLeads()
      toast.success('Lead excluído permanentemente')
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao excluir lead')
  })

  return {
    updateStatusMutation,
    updateScheduleMutation,
    addNoteMutation,
    removeFromQueueMutation,
    deleteLeadMutation
  }
}
