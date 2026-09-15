import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'
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
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR })
  }

  // Cores da borda esquerda baseadas no status do CRM ou Gateway
  let borderClass = 'border-l-indigo-500'
  if (lead.gateway_status === 'refused' || lead.status === 'perdido') borderClass = 'border-l-red-500'
  if (lead.gateway_status === 'waiting_payment' && lead.payment_method === 'pix') borderClass = 'border-l-purple-500'
  if (lead.status === 'recuperado') borderClass = 'border-l-emerald-500'

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 ${borderClass} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-gray-900">{lead.name}</h3>
          
          {/* Tags */}
          {lead.gateway_status && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700">
              {lead.gateway_status.replace('_', ' ')}
            </span>
          )}
          {lead.temperature === 'quente' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 flex items-center gap-1">
              🔥 Quente
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
            {lead.status.replace('_', ' ')}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-2">
          {lead.product_name || 'Produto não identificado'} 
          {lead.gateway_metadata && (lead.gateway_metadata as any).amount && (
            <span className="font-medium text-gray-900"> • R$ {((lead.gateway_metadata as any).amount / 100).toFixed(2)}</span>
          )}
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-1">
          {lead.created_at && <span>Entrou {getTimeAgo(lead.created_at)}</span>}
          {lead.next_action_at && (
            <>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Retorno: {new Date(lead.next_action_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </>
          )}
        </div>
      </div>

      <div>
        <button 
          onClick={handleWhatsApp}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          {lead.status === 'novo' ? 'Chamar no WhatsApp' : 'Continuar conversa'}
        </button>
      </div>
    </div>
  )
}