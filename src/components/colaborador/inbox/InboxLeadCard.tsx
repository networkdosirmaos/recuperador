import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, MoreVertical } from 'lucide-react'
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

  // Cores da borda esquerda baseadas no status do CRM ou Gateway
  let borderClass = 'border-l-[#7c3aed]' // Default purple (Pix)
  let gatewayTagBg = 'bg-[#f5f3ff]'
  let gatewayTagText = 'text-[#7c3aed]'

  if (lead.gateway_status === 'refused' || lead.status === 'perdido') {
    borderClass = 'border-l-[#ef4444]' // Red
    gatewayTagBg = 'bg-[#fef2f2]'
    gatewayTagText = 'text-[#ef4444]'
  }
  if (lead.gateway_status === 'checkout_abandoned') {
    borderClass = 'border-l-[#f59e0b]' // Orange
    gatewayTagBg = 'bg-[#fffbeb]'
    gatewayTagText = 'text-[#f59e0b]'
  }

  const isNovo = lead.status === 'novo'

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white border rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 ${borderClass} ${isSelected ? 'ring-2 ring-[#7c3aed] border-[#7c3aed]' : 'border-[#e5e7eb] border-l-4'}`}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-[15px] font-bold text-[#1a1d23] mr-2">{lead.name}</h3>
          
          {/* Badge do Evento de Gateway Principal */}
          {lead.gateway_event && (
            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide border ${gatewayTagBg} ${gatewayTagText} border-current border-opacity-20 flex items-center gap-1`}>
              {(lead.gateway_event === 'pix_generated' || lead.gateway_event === 'pix_gerado' || lead.gateway_event === 'waiting_payment') ? '💠 PIX GERADO' : 
               lead.gateway_event === 'checkout_abandoned' ? '🛒 ABANDONO' : 
               lead.gateway_event === 'purchase_refused' ? '💳 RECUSADO' : 
               lead.gateway_event === 'purchase_approved' ? '✅ APROVADO' : 
               lead.gateway_event.replace('_', ' ')}
            </span>
          )}

          {/* CRM Status Oculto em Recuperados se preferir, mas vamos manter */}
          {lead.status !== 'novo' && lead.status !== 'recuperado' && (
             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#eff6ff] text-[#3b82f6]">
               {lead.status.replace('_', ' ')}
             </span>
          )}
          
          {lead.temperature === 'quente' && lead.status !== 'recuperado' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#fff7ed] text-[#ea580c] flex items-center gap-1">
              🔥 Quente
            </span>
          )}
        </div>

        <div className="text-[13px] text-[#6b7280] mb-2.5 leading-relaxed">
          {lead.product_name || 'Produto não identificado'} 
          <br/>
          {lead.gateway_metadata && (lead.gateway_metadata as any).amount && (
            <span className="font-semibold text-[#1a1d23]">R$ {((lead.gateway_metadata as any).amount / 100).toFixed(2)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Relógio de Queda / Urgência */}
          {lead.status === 'recuperado' ? (
            <span className="text-[12px] font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full">
              Venda Recuperada
            </span>
          ) : (
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${lead.gateway_status === 'refused' || lead.gateway_status === 'checkout_abandoned' ? 'text-[#ef4444] bg-[#fef2f2]' : 'text-[#ea580c] bg-[#fff7ed]'}`}>
              ⏱️ Caiu {getTimeAgo(lead.created_at)}
            </span>
          )}
          
          {lead.next_action_at && (
            <>
              <span className="text-[#9ca3af]">•</span>
              <span className="text-[12px] text-[#9ca3af] font-medium">
                Retorno: {new Date(lead.next_action_at).toLocaleString('pt-BR', { timeStyle: 'short', dateStyle: new Date(lead.next_action_at).toLocaleDateString() !== new Date().toLocaleDateString() ? 'short' : undefined })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={handleWhatsApp}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 text-[13px] font-bold rounded-lg transition-colors shadow-sm ${isNovo ? 'bg-[#10b981] hover:bg-[#059669] text-white' : 'bg-white border border-[#10b981] text-[#10b981] hover:bg-green-50'}`}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          {isNovo ? 'Chamar no WhatsApp' : 'Continuar conversa'}
        </button>
        <button className="text-[#9ca3af] hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}