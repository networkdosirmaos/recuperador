import React, { useState, useEffect } from 'react'
import { X, CalendarClock, MessageCircle, AlertCircle, Calendar, Clock, Building, DollarSign, QrCode, Phone, Activity, CreditCard, ShoppingCart, CheckCircle2 } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow, addDays, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface InboxSidebarProps {
  lead: Partial<LeadRow> | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
  onScheduleAction: (leadId: string, nextActionAt: string | null) => Promise<void>;
  onSaveNote: (leadId: string, notes: string) => Promise<void>;
  affiliateLink?: string;
}

export function InboxSidebar({ lead, onClose, onUpdateStatus, onScheduleAction, onSaveNote, affiliateLink }: InboxSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (lead) {
      setNoteText('') // Sempre iniciar vazio para empilhar novos comentários
    }
  }, [lead])

  if (!lead) return null

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true)
    try {
      await onUpdateStatus(lead.id!, e.target.value)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSchedule = async (type: 'hoje_18' | 'amanha_manha' | 'limpar' | 'escolher') => {
    setIsUpdating(true)
    try {
      let date: Date | null = null
      const now = new Date()

      if (type === 'hoje_18') {
        date = setMinutes(setHours(now, 18), 0)
      } else if (type === 'amanha_manha') {
        date = setMinutes(setHours(addDays(now, 1), 9), 0)
      } else if (type === 'escolher') {
        const input = document.createElement('input');
        input.type = 'datetime-local';
        input.onchange = async (e: any) => {
          if (e.target.value) {
            await onScheduleAction(lead.id!, new Date(e.target.value).toISOString())
            toast.success('Retorno agendado!')
            onClose()
          }
        }
        input.click();
        setIsUpdating(false)
        return;
      }

      await onScheduleAction(lead.id!, date ? date.toISOString() : null)
      if (type !== 'limpar') toast.success('Retorno agendado com sucesso!')
      if (date) onClose()
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

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setIsUpdating(true)
    try {
      await onSaveNote(lead.id!, noteText)
      toast.success('Anotação salva no histórico!')
      setNoteText('') // Limpa a caixa após salvar
    } finally {
      setIsUpdating(false)
    }
  }

  const renderHistory = () => {
    const logs = Array.isArray(lead.history_log) ? lead.history_log : []
    // Reverter para mostrar os mais recentes no topo
    const reversedLogs = [...logs].reverse()

    return (
      <div className="relative border-l-2 border-[#e5e7eb] ml-3 mt-4 space-y-6">
        {reversedLogs.map((log: any, idx) => {
          let Icon = Activity
          let bgClass = 'bg-[#f3f4f6]'
          let textClass = 'text-[#6b7280]'
          let borderClass = 'border-[#e5e7eb]'
          let isHumanNote = false

          if (log.type === 'HUMAN_NOTE') {
            Icon = MessageCircle
            bgClass = 'bg-[#f3e8ff]'
            textClass = 'text-[#7e22ce]'
            borderClass = 'border-[#9333ea]'
            isHumanNote = true
          } else if (log.type === 'pix_generated' || log.type === 'pix_gerado' || log.type === 'waiting_payment') {
            Icon = QrCode
            bgClass = 'bg-[#f5f3ff]'
            textClass = 'text-[#7c3aed]'
            borderClass = 'border-[#7c3aed]'
          } else if (log.type === 'purchase_refused') {
            Icon = CreditCard
            bgClass = 'bg-[#fef2f2]'
            textClass = 'text-[#ef4444]'
            borderClass = 'border-[#ef4444]'
          } else if (log.type === 'checkout_abandoned') {
            Icon = ShoppingCart
            bgClass = 'bg-[#fff7ed]'
            textClass = 'text-[#ea580c]'
            borderClass = 'border-[#ea580c]'
          } else if (log.type === 'purchase_approved') {
            Icon = CheckCircle2
            bgClass = 'bg-[#ecfdf5]'
            textClass = 'text-[#10b981]'
            borderClass = 'border-[#10b981]'
          } else if (log.type?.includes('refund')) {
            Icon = AlertCircle
            bgClass = 'bg-[#fef2f2]'
            textClass = 'text-[#dc2626]'
            borderClass = 'border-[#dc2626]'
          } else if (log.type?.includes('chargeback')) {
            Icon = AlertCircle
            bgClass = 'bg-[#fee2e2]'
            textClass = 'text-[#b91c1c]'
            borderClass = 'border-[#b91c1c]'
          }

          return (
            <div key={idx} className="relative pl-6">
              <span className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${borderClass} ${textClass}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="pt-1">
                <p className={`text-[13px] font-bold ${textClass}`}>
                  {isHumanNote ? 'Sua Anotação' : (log.type === 'pix_generated' || log.type === 'pix_gerado' || log.type === 'waiting_payment') ? 'PIX Gerado' :
                   log.type === 'purchase_refused' ? 'Cartão Recusado' :
                   log.type === 'checkout_abandoned' ? 'Carrinho Abandonado' :
                   log.type === 'purchase_approved' ? 'Compra Aprovada' :
                   log.type?.includes('refund') ? 'Reembolso Solicitado' :
                   log.type?.includes('chargeback') ? 'Chargeback' :
                   'Evento Registrado'}
                </p>
                <div className={`mt-1 text-[13px] leading-relaxed ${isHumanNote ? 'text-gray-800 bg-[#f3e8ff] p-3 rounded-lg rounded-tl-none border border-[#e9d5ff] inline-block shadow-sm' : 'text-[#4b5563]'}`}>
                  {log.description || 'Sem detalhes'}
                </div>
                <span className="block text-[11px] text-[#9ca3af] mt-1.5 font-medium">
                  {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR }) : 'Desconhecido'}
                </span>
              </div>
            </div>
          )
        })}
        {reversedLogs.length === 0 && (
          <div className="relative pl-6">
            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#f5f3ff] border-[3px] border-[#7c3aed]"></span>
            <p className="text-[13px] text-[#374151]">Lead entrou na fila</p>
            <p className="text-[12px] text-[#9ca3af]">{lead.created_at ? `há ${formatDistanceToNow(new Date(lead.created_at), { locale: ptBR })}` : 'agora mesmo'}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full bg-white shadow-2xl border-l border-[#e5e7eb] flex flex-col">
      
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a1d23] mb-2">{lead.name}</h2>
          <div className="flex items-center gap-2">
            {lead.gateway_status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#f5f3ff] text-[#7c3aed]">
                {lead.gateway_status.replace('_', ' ')}
              </span>
            )}
            {lead.temperature === 'quente' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#fff7ed] text-[#ea580c] flex items-center gap-1">
                🔥 Quente
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-[#9ca3af]">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
        
        {/* Alert Context */}
        {lead.gateway_status === 'waiting_payment' && (
          <div className="bg-[#f9fafb] rounded-lg p-4 border border-[#e5e7eb] flex items-start gap-3">
            <div className="mt-0.5 text-[#7c3aed] bg-[#f5f3ff] p-1.5 rounded-full">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[14px] font-bold text-[#1a1d23]">Pagamento ainda não identificado</span>
              <span className="block text-[13px] text-[#6b7280]">Pix gerado há {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { locale: ptBR }) : ''}</span>
            </div>
          </div>
        )}
        {(lead.gateway_status === 'refused' || lead.status === 'perdido') && (
          <div className="bg-[#fef2f2] rounded-lg p-4 border border-[#fecaca] flex items-start gap-3">
            <div className="mt-0.5 text-[#ef4444] bg-white p-1.5 rounded-full">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[14px] font-bold text-[#991b1b]">Pagamento recusado</span>
              <span className="block text-[13px] text-[#b91c1c]">{lead.reason || 'O cartão não autorizou a transação.'}</span>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#6b7280] mb-3">Informações do cliente e produto</h3>
          <div className="space-y-2.5 text-[14px] text-[#374151]">
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-[#9ca3af]" />
              <span className="font-medium">{lead.product_name || '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-[#9ca3af]" />
              <span>R$ {lead.gateway_metadata && (lead.gateway_metadata as any).amount ? ((lead.gateway_metadata as any).amount / 100).toFixed(2) : '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <QrCode className="w-4 h-4 text-[#9ca3af]" />
              <span className="uppercase">{lead.payment_method || '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#9ca3af]" />
              <span>{lead.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* CTA Big WhatsApp */}
        <button 
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-lg transition-colors shadow-sm text-[15px]"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          Chamar {lead.name?.split(' ')[0]} no WhatsApp
        </button>

        {/* Affiliate Link Copy Button */}
        {affiliateLink && (
          <button 
            onClick={() => {
              navigator.clipboard.writeText(affiliateLink)
              toast.success('Link de afiliado copiado!')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#7c3aed] font-bold rounded-lg transition-colors border border-[#ddd6fe] shadow-sm text-[14px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copiar Meu Link de Pagamento
          </button>
        )}

        {/* Status Form */}
        <div>
          <label className="block text-[13px] font-semibold text-[#6b7280] mb-2">
            Atendimento
          </label>
          <select 
            value={lead.status || 'novo'}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className="w-full px-4 py-2.5 bg-white border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] outline-none text-[#374151] font-medium transition-shadow appearance-none"
          >
            <option value="novo">Novo</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="recuperado">Recuperado (Venda Certa)</option>
            <option value="perdido">Perdido (Não comprou)</option>
          </select>
        </div>

        {/* Anotação Rápida */}
        <div>
          <label className="block text-[13px] font-semibold text-[#6b7280] mb-2">
            Anotação rápida
          </label>
          <div className="relative">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex.: Disse que fará o Pix depois do trabalho."
              className="w-full px-4 py-3 bg-white border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#7c3aed] outline-none text-[#374151] text-[14px] resize-none h-[100px]"
              maxLength={500}
            />
            <span className="absolute bottom-3 right-3 text-[11px] text-[#9ca3af]">{noteText.length}/500</span>
          </div>
          <button 
            onClick={saveNote}
            disabled={isUpdating || !noteText.trim()}
            className="mt-3 px-4 py-2 bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#7c3aed] font-semibold text-[13px] rounded-lg transition-colors disabled:opacity-50"
          >
            Salvar anotação
          </button>
        </div>

        {/* Agendamento / Próxima ação */}
        <div>
          <label className="block text-[13px] font-semibold text-[#6b7280] mb-2">
            Próxima ação
          </label>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => handleSchedule('hoje_18')}
              disabled={isUpdating}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold bg-white border border-[#e5e7eb] rounded-lg text-[#374151] hover:bg-gray-50 whitespace-nowrap"
            >
              <CalendarClock className="w-4 h-4 text-[#9ca3af]" />
              Hoje, às 18h
            </button>
            <button 
              onClick={() => handleSchedule('amanha_manha')}
              disabled={isUpdating}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold bg-white border border-[#e5e7eb] rounded-lg text-[#374151] hover:bg-gray-50 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-[#9ca3af]" />
              Amanhã
            </button>
            <button 
              onClick={() => handleSchedule('escolher')}
              disabled={isUpdating}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold bg-white border border-[#e5e7eb] rounded-lg text-[#374151] hover:bg-gray-50 whitespace-nowrap"
            >
              <Clock className="w-4 h-4 text-[#9ca3af]" />
              Escolher horário
            </button>
          </div>
          {lead.next_action_at && (
            <div className="mt-3 text-[12px] flex justify-between items-center text-[#10b981] font-semibold">
              <span>Agendado para: {new Date(lead.next_action_at).toLocaleString('pt-BR')}</span>
              <button onClick={() => handleSchedule('limpar')} className="text-[#ef4444] hover:underline">Limpar</button>
            </div>
          )}
        </div>

        {/* Histórico */}
        <div>
          <label className="block text-[13px] font-semibold text-[#6b7280] mb-1">
            Histórico
          </label>
          {renderHistory()}
        </div>

      </div>
    </div>
  )
}