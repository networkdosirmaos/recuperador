import React, { useState, useEffect, useRef } from 'react'
import type { LeadRow } from '@/types/database.types'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { scriptService } from '@/services/script.service'
import { createClient } from '@/utils/supabase/client'

// Componentes da Sidebar
import { LeadHeader } from './sidebar/LeadHeader'
import { LeadDetails } from './sidebar/LeadDetails'
import { LeadLinks } from './sidebar/LeadLinks'
import { RefundAlert } from './sidebar/RefundAlert'
import { LeadScripts } from './sidebar/LeadScripts'
import { LeadManagement } from './sidebar/LeadManagement'
import { LeadTimeline } from './sidebar/LeadTimeline'
import { LeadNoteForm } from './sidebar/LeadNoteForm'
import { LeadAdminActions } from './sidebar/LeadAdminActions'

interface InboxSidebarProps {
  lead: Partial<LeadRow> | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
  onScheduleAction: (leadId: string, nextActionAt: string | null) => Promise<void>;
  onSaveNote: (leadId: string, notes: string) => Promise<void>;
  affiliateLink?: string;
  salesLink?: string;
  collaboratorName?: string;
  viewerRole?: 'admin' | 'collaborator';
  canSeeEmail?: boolean;
  onRemoveFromQueue?: () => void;
  onDeleteLead?: () => void;
  isRemoving?: boolean;
  isDeleting?: boolean;
}

export function InboxSidebar({ 
  lead, 
  onClose, 
  onUpdateStatus, 
  onScheduleAction, 
  onSaveNote, 
  affiliateLink, 
  salesLink, 
  collaboratorName,
  viewerRole = 'collaborator', 
  canSeeEmail = true, 
  onRemoveFromQueue, 
  onDeleteLead,
  isRemoving,
  isDeleting
}: InboxSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [status, setStatus] = useState('em_atendimento')
  const [scheduleDate, setScheduleDate] = useState('')
  const [activeScriptIndex, setActiveScriptIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const isVendaAtiva = !lead?.gateway_event || lead.gateway_event === 'import_base' || lead.gateway_event === 'prospeccao';

  const { data: recommendedScripts = [] } = useQuery({
    queryKey: ['recommended_scripts', lead?.id, lead?.gateway_status, lead?.gateway_event, isVendaAtiva],
    queryFn: () => {
      // Priorizamos o gateway_event. Se não existir, caímos para o gateway_status.
      // Isso evita que um checkout_abandoned que também tenha status "pending"
      // puxe scripts de PIX.
      let types = [lead?.gateway_event || lead?.gateway_status].filter(Boolean) as string[];
      if (types.length === 0 || isVendaAtiva) {
        types = ['venda_ativa'];
      }
      return scriptService.getRecommendedScripts(types, lead?.refund_reason)
    },
    enabled: !!lead
  })

  const { data: dbEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['lead_events', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lead_events')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!lead?.id
  })

  useEffect(() => {
    if (lead) {
      setNoteText('')
      setStatus(lead.status || 'em_atendimento')
      setActiveScriptIndex(0)
      
      if (lead.next_action_at) {
        const d = new Date(lead.next_action_at)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setScheduleDate(d.toISOString().slice(0, 16))
      } else {
        setScheduleDate('')
      }
    }
  }, [lead])

  if (!lead) return null

  // Combina o histórico
  let timelineEvents = [...((lead.history_log as any[]) || [])].map(log => ({
    ...log,
    gateway_event: log.gateway_event || 'HUMAN_NOTE'
  }))

  const gatewayEventsFormatted = dbEvents.map(evt => ({
    created_at: evt.created_at,
    gateway_event: evt.gateway_event,
    gateway_status: evt.gateway_status,
    reason: evt.reason
  }))
  timelineEvents = [...timelineEvents, ...gatewayEventsFormatted]
  timelineEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      await onUpdateStatus(lead.id!, newStatus)
      if (newStatus === 'recuperado' || newStatus === 'perdido') {
        onClose()
      }
    } catch (err) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleScheduleChange = async (newDate: string) => {
    setScheduleDate(newDate)
    try {
      const dateObj = newDate ? new Date(newDate).toISOString() : null
      await onScheduleAction(lead.id!, dateObj)
    } catch (err) {
      toast.error('Erro ao agendar retorno')
    }
  }

  const handleSendNote = async () => {
    if (!noteText.trim()) return
    setIsUpdating(true)
    try {
      await onSaveNote(lead.id!, noteText)
      setNoteText('')
    } catch (err) {
      toast.error('Erro ao enviar comentário')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="h-full w-full bg-white flex flex-col z-50">
      <LeadHeader lead={lead} onClose={onClose} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f9fafb] flex flex-col" ref={scrollRef}>
        <div className="p-6 space-y-6 flex-1 w-full max-w-[100vw]">
          
          <div className="space-y-3">
            <LeadDetails lead={lead} canSeeEmail={canSeeEmail} />
            <LeadLinks affiliateLink={affiliateLink} salesLink={salesLink} />
          </div>
          
          <LeadAdminActions 
            viewerRole={viewerRole}
            isRemoving={isRemoving}
            isDeleting={isDeleting}
            onRemoveFromQueue={onRemoveFromQueue}
            onDeleteLead={onDeleteLead}
          />

          <RefundAlert refundReason={lead.refund_reason} />

          <LeadScripts 
            isVendaAtiva={isVendaAtiva}
            leadGatewayEvent={lead.gateway_event}
            leadRefundedAt={lead.refunded_at}
            recommendedScripts={recommendedScripts}
            activeScriptIndex={activeScriptIndex}
            setActiveScriptIndex={setActiveScriptIndex}
            leadName={lead.name!}
            leadPhone={lead.phone}
            productName={lead.product_name}
            affiliateLink={affiliateLink}
            salesLink={salesLink}
            collaboratorName={collaboratorName}
          />

          <LeadManagement 
            status={status}
            scheduleDate={scheduleDate}
            onStatusChange={handleStatusChange}
            onScheduleChange={handleScheduleChange}
          />

          <LeadTimeline 
            timelineEvents={timelineEvents}
            isLoadingEvents={isLoadingEvents}
          />
          
        </div>
      </div>

      <LeadNoteForm 
        noteText={noteText}
        setNoteText={setNoteText}
        onSendNote={handleSendNote}
        isUpdating={isUpdating}
      />
    </div>
  )
}
