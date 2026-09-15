import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MyLead } from '@/components/colaborador/MyLeadsTable'

export function useLeadsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime_leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `current_assignee_id=eq.${userId}`
        },
        (payload) => {
          console.log('NOVO LEAD!', payload.new)
          const novoLead = payload.new as MyLead
          
          queryClient.setQueryData(['seller_leads', userId], (oldData: MyLead[] | undefined) => {
            if (!oldData) return [novoLead]
            if (oldData.find(l => l.id === novoLead.id)) return oldData
            return [novoLead, ...oldData]
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
          console.log('LEAD DELETADO EM CASCATA!', payload.old)
          queryClient.setQueryData(['seller_leads', userId], (oldData: MyLead[] | undefined) => {
            if (!oldData) return []
            return oldData.filter(l => l.id !== payload.old.id)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `current_assignee_id=eq.${userId}`
        },
        (payload) => {
          console.log('LEAD ATUALIZADO!', payload.new)
          const atualizadoLead = payload.new as MyLead
          
          queryClient.setQueryData(['seller_leads', userId], (oldData: MyLead[] | undefined) => {
            if (!oldData) return []
            return oldData.map(l => l.id === atualizadoLead.id ? { ...l, ...atualizadoLead } : l)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
