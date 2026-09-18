import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Box, Clock, Calendar } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import toast from 'react-hot-toast'

interface InboxLeadCardProps {
  lead: Partial<LeadRow> & Pick<LeadRow, 'id' | 'name' | 'phone' | 'email' | 'status' | 'updated_at'>;
  isSelected: boolean;
  onClick: () => void;
}

export function InboxLeadCard({ lead, isSelected, onClick }: InboxLeadCardProps) {
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!lead.phone) return toast.error('Cliente sem número de telefone.')
    const cleanPhone = lead.phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}`, '_blank')
  }

  const getTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return ''
    return formatDistanceToNow(new Date(dateStr), { locale: ptBR })
  }

  const translateEvent = (event?: string | null) => {
    if (!event) return 'Desconhecido'
    if (event === 'pix_generated' || event === 'pix_gerado' || event === 'waiting_payment') return 'Pix gerado'
    if (event === 'checkout_abandoned' || event === 'checkout_abandonment') return 'Checkout abandonado'
    if (event === 'purchase_refused') return 'Compra recusada'
    if (event === 'purchase_approved') return 'Compra aprovada'
    if (event === 'refunded' || event === 'purchase_refunded' || event?.includes('refund')) return 'Reembolsado'
    if (event === 'chargeback' || event?.includes('chargeback')) return 'Chargeback'
    return event.replace('_', ' ')
  }

  const isNovo = lead.status === 'novo'

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${isSelected ? 'ring-2 ring-indigo-500 border-l-4 border-indigo-600' : 'border border-gray-100 border-l-4 border-transparent hover:border-gray-200'}`}
    >
      {/* Coluna 1: Nome, Evento e Tags */}
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{lead.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
            {translateEvent(lead.gateway_event)}
          </span>
          
          {lead.status === 'recuperado' && (
             <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-emerald-50 text-emerald-700">
               Recuperado
             </span>
          )}
          {lead.status === 'perdido' && (
             <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-red-50 text-red-700">
               Perdido
             </span>
          )}
          {lead.temperature === 'quente' && lead.status !== 'recuperado' && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-orange-50 text-orange-700 flex items-center gap-1">
              🔥 Quente
            </span>
          )}
          {lead.status !== 'novo' && lead.status !== 'recuperado' && lead.status !== 'perdido' && lead.status !== 'em_atendimento' && (
             <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-blue-50 text-blue-700">
               {lead.status.replace('_', ' ')}
             </span>
          )}
          {lead.status === 'em_atendimento' && (
             <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-yellow-50 text-yellow-700 flex items-center gap-1">
               🔥 Em atendimento
             </span>
          )}
        </div>
      </div>

      {/* Coluna 2: Produto */}
      <div className="flex-1 min-w-[150px] text-[13px] font-medium text-gray-700 flex items-center gap-2">
        <Box className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="truncate">{lead.product_name || 'Produto não identificado'}</span>
      </div>

      {/* Coluna 3: Tempo / Retorno */}
      <div className="flex-1 min-w-[150px] text-[13px] text-gray-500 flex flex-col justify-center gap-1.5">
        {lead.next_action_at && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Retorno {new Date(lead.next_action_at as string).toLocaleString('pt-BR', { timeStyle: 'short', dateStyle: new Date(lead.next_action_at as string).toLocaleDateString() !== new Date().toLocaleDateString() ? 'short' : undefined })}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>Entrou há {getTimeAgo(lead.created_at)}</span>
        </div>
      </div>

      {/* Coluna 4: Ação */}
      <div className="flex-shrink-0 flex items-center gap-3">
        <button 
          onClick={handleWhatsApp}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isNovo ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-sm' : 'bg-white border border-[#10b981] text-[#10b981] hover:bg-emerald-50'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          {isNovo ? 'Chamar no WhatsApp' : 'Continuar conversa'}
        </button>
      </div>
    </div>
  )
}