import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLeadsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime_leads')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'leads',
          filter: `current_assignee_id=eq.${userId}`
        },
        (payload) => {
          console.log('Realtime Event:', payload.eventType, payload)
          
          // Invalida as queries de contagem e da fila paginada para refetch automático suave
          queryClient.invalidateQueries({ queryKey: ['seller_leads_paginated', userId] })
          queryClient.invalidateQueries({ queryKey: ['seller_lead_counts', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
