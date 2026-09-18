import React, { useState, useEffect } from 'react'
import { X, CalendarClock, MessageCircle, AlertCircle, Calendar, Clock, Building, DollarSign, QrCode, Phone, Activity, CreditCard, ShoppingCart, CheckCircle2 } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow, addDays, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { scriptService } from '@/services/script.service'
import { BookOpen, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface InboxSidebarProps {
  lead: Partial<LeadRow> | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
  onScheduleAction: (leadId: string, nextActionAt: string | null) => Promise<void>;
  onSaveNote: (leadId: string, notes: string) => Promise<void>;
  affiliateLink?: string;
  salesLink?: string;
  viewerRole?: 'admin' | 'collaborator';
  canSeeEmail?: boolean;
  onRemoveFromQueue?: () => void;
  onDeleteLead?: () => void;
}

export function InboxSidebar({ lead, onClose, onUpdateStatus, onScheduleAction, onSaveNote, affiliateLink, salesLink, viewerRole = 'collaborator', canSeeEmail = true, onRemoveFromQueue, onDeleteLead }: InboxSidebarProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showScripts, setShowScripts] = useState(true)

  const { data: recommendedScripts = [] } = useQuery({
    queryKey: ['recommended_scripts', lead?.id, lead?.gateway_status, lead?.gateway_event],
    queryFn: () => {
      const types = [lead?.gateway_status, lead?.gateway_event].filter(Boolean) as string[]
      return scriptService.getRecommendedScripts(types, lead?.refund_reason)
    },
    enabled: !!lead && (!!lead.gateway_status || !!lead.gateway_event)
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
      setNoteText('') // Sempre iniciar vazio para empilhar novos comentários
      setShowScripts(true)
    }
  }, [lead])

  if (!lead) return null

  const parseScriptVariables = (content: string) => {
    let parsed = content
    parsed = parsed.replace(/{NOME}/g, lead.name?.split(' ')[0] || '')
    parsed = parsed.replace(/{PRODUTO}/g, lead.product_name || '')
    parsed = parsed.replace(/{LINK_CHECKOUT}/g, affiliateLink || '')
    parsed = parsed.replace(/{LINK_VENDAS}/g, salesLink || '')
    return parsed
  }

  const handleCopyScript = (content: string) => {
    const text = parseScriptVariables(content)
    navigator.clipboard.writeText(text)
    toast.success('Script copiado com as variáveis preenchidas!')
  }

  const handleSendScript = (content: string) => {
    if (!lead.phone) return toast.error('Sem telefone')
    const text = parseScriptVariables(content)
    const url = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

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
    if (isLoadingEvents) {
      return <div className="text-center py-4 text-gray-500">Carregando histórico...</div>
    }

    const oldEvents = Array.isArray(lead.history_log) ? lead.history_log.map((log: any) => ({
      gateway_event: log.type,
      gateway_status: log.type,
      reason: log.description,
      created_at: log.created_at,
      metadata: null
    })) : []
    
    const combinedEvents = [...dbEvents, ...oldEvents].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    return (
      <div className="relative border-l-2 border-[#e5e7eb] ml-3 mt-4 space-y-6">
        {combinedEvents.map((log: any, idx: number) => {
          const type = log.gateway_event || log.gateway_status || ''
          
          let Icon = Activity
          let bgClass = 'bg-[#f3f4f6]'
          let textClass = 'text-[#6b7280]'
          let borderClass = 'border-[#e5e7eb]'
          let isHumanNote = false

          if (type === 'HUMAN_NOTE') {
            Icon = MessageCircle
            bgClass = 'bg-[#f3e8ff]'
            textClass = 'text-[#7e22ce]'
            borderClass = 'border-[#9333ea]'
            isHumanNote = true
          } else if (type === 'pix_generated' || type === 'pix_gerado' || type === 'waiting_payment') {
            Icon = QrCode
            bgClass = 'bg-[#f5f3ff]'
            textClass = 'text-[#7c3aed]'
            borderClass = 'border-[#7c3aed]'
          } else if (type === 'purchase_refused') {
            Icon = CreditCard
            bgClass = 'bg-[#fef2f2]'
            textClass = 'text-[#ef4444]'
            borderClass = 'border-[#ef4444]'
          } else if (type === 'checkout_abandoned') {
            Icon = ShoppingCart
            bgClass = 'bg-[#fff7ed]'
            textClass = 'text-[#ea580c]'
            borderClass = 'border-[#ea580c]'
          } else if (type === 'purchase_approved') {
            Icon = CheckCircle2
            bgClass = 'bg-[#ecfdf5]'
            textClass = 'text-[#10b981]'
            borderClass = 'border-[#10b981]'
          } else if (type?.includes('refund')) {
            Icon = AlertCircle
            bgClass = 'bg-[#fef2f2]'
            textClass = 'text-[#dc2626]'
            borderClass = 'border-[#dc2626]'
          } else if (type?.includes('chargeback')) {
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
                  {isHumanNote ? 'Sua Anotação' : (type === 'pix_generated' || type === 'pix_gerado' || type === 'waiting_payment') ? 'PIX Gerado' :
                   type === 'purchase_refused' ? 'Cartão Recusado' :
                   type === 'checkout_abandoned' ? 'Carrinho Abandonado' :
                   type === 'purchase_approved' ? 'Compra Aprovada' :
                   type?.includes('refund') ? 'Reembolso Solicitado' :
                   type?.includes('chargeback') ? 'Chargeback' :
                   type}
                </p>
                <div className={`mt-1 text-[13px] leading-relaxed ${isHumanNote ? 'text-gray-800 bg-[#f3e8ff] p-3 rounded-lg rounded-tl-none border border-[#e9d5ff] inline-block shadow-sm' : 'text-[#4b5563]'}`}>
                  {log.reason || log.gateway_status || 'Sem detalhes'}
                </div>
                <span className="block text-[11px] text-[#9ca3af] mt-1.5 font-medium">
                  {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR }) : 'Desconhecido'}
                </span>
                
                {/* Botão de Ver Payload - Apenas no primeiro evento (mais recente) que não seja nota humana e se tiver gateway_metadata, e APENAS PARA ADMIN */}
                {!isHumanNote && idx === 0 && log.metadata && viewerRole === 'admin' && (
                  <div className="mt-3">
                    <details className="group">
                      <summary className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1 transition-colors">
                        <span className="group-open:hidden">▶ Ver Payload da Cakto</span>
                        <span className="hidden group-open:inline">▼ Esconder Payload</span>
                      </summary>
                      <div className="mt-2 bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {combinedEvents.length === 0 && (
          <div className="relative pl-6">
            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#f5f3ff] border-[3px] border-[#7c3aed]"></span>
            <p className="text-[13px] text-[#374151]">Lead entrou na fila</p>
            <p className="text-[12px] text-[#9ca3af]">{lead.created_at ? `há ${formatDistanceToNow(new Date(lead.created_at), { locale: ptBR })}` : 'agora mesmo'}</p>
          </div>
        )}
      </div>
    )
  }

  const renderEmail = () => {
    if (!lead.email) return '-';
    if (viewerRole === 'admin' || canSeeEmail) return lead.email;
    return lead.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
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
        
        {/* PLAYBOOK / SCRIPTS RECOMENDADOS */}
        {recommendedScripts.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setShowScripts(!showScripts)}
              className="w-full flex items-center justify-between p-3 bg-indigo-100/50 hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                <span className="text-[13px] font-bold text-indigo-900 uppercase tracking-wider">Playbook (Scripts Sugeridos)</span>
                <span className="bg-indigo-200 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{recommendedScripts.length}</span>
              </div>
              {showScripts ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
            </button>
            
            {showScripts && (
              <div className="p-3 space-y-3">
                {recommendedScripts.map((script: any) => (
                  <div key={script.id} className="bg-white border border-indigo-100 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[12px] font-bold text-gray-700 flex justify-between items-center">
                      {script.title}
                      {script.sub_condition && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Motivo: {script.sub_condition}
                        </span>
                      )}
                    </div>
                    <div className="p-3 text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {parseScriptVariables(script.content)}
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2">
                      <button 
                        onClick={() => handleCopyScript(script.content)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded shadow-sm transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Texto
                      </button>
                      <button 
                        onClick={() => handleSendScript(script.content)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Enviar p/ Zap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Alert Context */}
        {lead.refund_reason && (
          <div className="bg-[#fef2f2] rounded-lg p-4 border border-[#fecaca] flex items-start gap-3">
            <div className="mt-0.5 text-[#ef4444] bg-white p-1.5 rounded-full">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[14px] font-bold text-[#991b1b]">Reembolso Solicitado</span>
              <span className="block text-[13px] text-[#b91c1c]">{lead.refund_reason}</span>
            </div>
          </div>
        )}
        {lead.gateway_status === 'waiting_payment' && !lead.refund_reason && (
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
        {(lead.gateway_status === 'refused' || lead.status === 'perdido') && !lead.refund_reason && (
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
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-[#9ca3af]" />
              <span>{renderEmail()}</span>
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

        {/* Links de Afiliado */}
        {(affiliateLink || salesLink) && (
          <div className="space-y-2">
            {affiliateLink && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(affiliateLink)
                  toast.success('Link de Checkout copiado!')
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#7c3aed] font-bold rounded-lg transition-colors border border-[#ddd6fe] shadow-sm text-[14px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copiar Checkout
              </button>
            )}
            {salesLink && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(salesLink)
                  toast.success('Página de Vendas copiada!')
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#10b981] font-bold rounded-lg transition-colors border border-[#a7f3d0] shadow-sm text-[14px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Copiar Pág. de Vendas
              </button>
            )}
          </div>
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

        {/* ADMIN ACTIONS */}
        {viewerRole === 'admin' && (
          <div className="mt-8 pt-6 border-t border-red-100/50">
            <h3 className="text-[12px] font-bold text-red-800/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Ações de Gestão (Admin)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {onRemoveFromQueue && (
                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja devolver este lead para a base geral? Ele sairá da fila deste vendedor.')) {
                      onRemoveFromQueue()
                    }
                  }}
                  className="px-3 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg border border-orange-200 transition-colors"
                >
                  Remover da Fila
                </button>
              )}
              {onDeleteLead && (
                <button
                  onClick={() => {
                    if (window.confirm('CUIDADO: Tem certeza que deseja APAGAR este lead definitivamente do sistema? Esta ação é irreversível.')) {
                      onDeleteLead()
                    }
                  }}
                  className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-lg border border-red-200 transition-colors"
                >
                  Excluir Lead
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}