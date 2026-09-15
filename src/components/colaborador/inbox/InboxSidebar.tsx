import React, { useState } from 'react'
import { X, CalendarClock, MessageCircle, AlertCircle, Save } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow, addDays, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface InboxSidebarProps {
  lead: Partial<LeadRow> | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
  onScheduleAction: (leadId: string, nextActionAt: string | null) => Promise<void>;
}

export function InboxSidebar({ lead, onClose, onUpdateStatus, onScheduleAction }: InboxSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!lead) return null

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true)
    try {
      await onUpdateStatus(lead.id!, e.target.value)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSchedule = async (type: 'hoje_18' | 'amanha_manha' | 'limpar') => {
    setIsUpdating(true)
    try {
      let date: Date | null = null
      const now = new Date()

      if (type === 'hoje_18') {
        date = setMinutes(setHours(now, 18), 0)
      } else if (type === 'amanha_manha') {
        date = setMinutes(setHours(addDays(now, 1), 9), 0)
      }

      await onScheduleAction(lead.id!, date ? date.toISOString() : null)
      toast.success(date ? 'Retorno agendado com sucesso!' : 'Agendamento removido!')
      onClose() // Opcional: fecha a sidebar ao agendar para focar no próximo
    } catch (err: any) {
      toast.error('Erro ao agendar retorno.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWhatsApp = () => {
    if (!lead.phone) return toast.error('Sem telefone')
    window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}`, '_blank')
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{lead.name}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Contexto do Gateway */}
        {lead.gateway_status && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Status no Gateway</span>
            </div>
            <p className="text-xs text-gray-600 mb-1">
              Gateway relatou <strong className="uppercase">{lead.gateway_status}</strong>.
            </p>
            {lead.reason && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 border border-red-100">
                {lead.reason}
              </p>
            )}
          </div>
        )}

        {/* Info Pessoal */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informações</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Produto</span>
              <span className="font-medium text-right">{lead.product_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor</span>
              <span className="font-medium">
                {lead.gateway_metadata && (lead.gateway_metadata as any).amount 
                  ? `R$ ${((lead.gateway_metadata as any).amount / 100).toFixed(2)}` 
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pagamento</span>
              <span className="font-medium uppercase">{lead.payment_method || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Telefone</span>
              <span className="font-medium">{lead.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button 
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          Chamar {lead.name?.split(' ')[0]} no WhatsApp
        </button>

        {/* Status Form */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Status do Atendimento
          </label>
          <select 
            value={lead.status || 'novo'}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium disabled:opacity-50"
          >
            <option value="novo">Novo</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="recuperado">Recuperado (Venda Certa)</option>
            <option value="perdido">Perdido (Não comprou)</option>
          </select>
        </div>

        {/* Agendamento */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Próxima Ação (Agendar Retorno)
          </label>
          {lead.next_action_at && (
            <div className="text-xs text-emerald-600 font-medium mb-2 bg-emerald-50 p-2 rounded border border-emerald-100 flex justify-between items-center">
              Retornar em: {new Date(lead.next_action_at).toLocaleString('pt-BR')}
              <button onClick={() => handleSchedule('limpar')} className="text-red-500 hover:underline">Limpar</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleSchedule('hoje_18')}
              disabled={isUpdating}
              className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              Hoje, às 18h
            </button>
            <button 
              onClick={() => handleSchedule('amanha_manha')}
              disabled={isUpdating}
              className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              Amanhã de manhã
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}