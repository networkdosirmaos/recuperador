import { MyLead } from '@/components/colaborador/MyLeadsTable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateLeadStatusSecure, appendLeadHistorySecure, updateNextActionSecure } from '@/app/actions/lead.actions'
import { returnSingleLeadToPoolSecure, deleteLeadsSecure } from '@/app/actions/admin.actions'

export function useLeadMutations(targetUserId: string, viewerId: string, onClearSelection?: () => void) {
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string, newStatus: string }) => 
      updateLeadStatusSecure(leadId, newStatus, viewerId),
    onMutate: async ({ leadId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['seller_leads', targetUserId] })
      const previousLeads = queryClient.getQueryData(['seller_leads', targetUserId])
      queryClient.setQueryData(['seller_leads', targetUserId], (old: MyLead[]) => 
        old?.map((l: MyLead) => l.id === leadId ? { ...l, status: newStatus } : l)
      )
      return { previousLeads }
    },
    onSuccess: (_, { leadId, newStatus }) => {
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        setTimeout(() => {
          queryClient.setQueryData(['seller_leads', targetUserId], (old: MyLead[]) => 
            old?.filter((l: MyLead) => l.id !== leadId)
          )
          if (onClearSelection) onClearSelection()
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
      queryClient.setQueryData(['seller_leads', targetUserId], (old: MyLead[]) => 
        old?.map((l: MyLead) => l.id === leadId ? { ...l, next_action_at: nextActionAt } : l)
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
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['lead_events', leadId] })
      // Sem toast automático aqui, o InboxSidebar já dispara um
    },
    onError: () => {
      toast.error('Falha ao salvar anotação.')
    }
  })

  // === ADMIN MUTATIONS ===
  const removeFromQueueMutation = useMutation({
    mutationFn: (leadId: string) => returnSingleLeadToPoolSecure(leadId),
    onSuccess: (_, leadId) => {
      queryClient.setQueryData(['seller_leads', targetUserId], (old: MyLead[]) => 
        old?.filter((l: MyLead) => l.id !== leadId)
      )
      if (onClearSelection) onClearSelection()
      toast.success('Lead devolvido para a base geral!')
    },
    onError: () => toast.error('Falha ao remover lead da fila.')
  })

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => deleteLeadsSecure([leadId]),
    onSuccess: (_, leadId) => {
      queryClient.setQueryData(['seller_leads', targetUserId], (old: MyLead[]) => 
        old?.filter((l: MyLead) => l.id !== leadId)
      )
      if (onClearSelection) onClearSelection()
      toast.success('Lead excluído permanentemente!')
    },
    onError: () => toast.error('Falha ao excluir lead.')
  })

  return {
    updateStatusMutation,
    updateScheduleMutation,
    addNoteMutation,
    removeFromQueueMutation,
    deleteLeadMutation
  }
}
