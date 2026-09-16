"use client"

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { InboxView } from '@/components/shared/inbox/InboxView'
import { useParams } from 'next/navigation'

export default function AdminSellerInbox() {
  const params = useParams()
  const sellerId = params.sellerId as string

  // Buscar Sessão do admin
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) window.location.href = '/login'
      return session
    }
  })

  const adminId = sessionData?.user?.id

  if (isLoading || !adminId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <InboxView 
      targetUserId={sellerId} 
      viewerRole="admin" 
      viewerId={adminId} 
    />
  )
}
