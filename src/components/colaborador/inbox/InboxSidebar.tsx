import React, { useState, useEffect, useRef } from 'react'
import { X, Calendar, MessageCircle, AlertCircle, Clock, Building, DollarSign, QrCode, Phone, Activity, CreditCard, ShoppingCart, CheckCircle2, Copy, Package, ChevronRight, ChevronDown, Send } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { scriptService } from '@/services/script.service'
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
  const [status, setStatus] = useState('em_atendimento')
  const [scheduleDate, setScheduleDate] = useState('')
  const [activeScriptIndex, setActiveScriptIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const isVendaAtiva = !lead?.gateway_event || lead.gateway_event === 'import_base' || lead.gateway_event === 'prospeccao';

  const { data: recommendedScripts = [] } = useQuery({
    queryKey: ['recommended_scripts', lead?.id, lead?.gateway_status, lead?.gateway_event, isVendaAtiva],
    queryFn: () => {
      let types = [lead?.gateway_status, lead?.gateway_event].filter(Boolean) as string[];
      if (types.length === 0 || isVendaAtiva) {
        types = ['venda_ativa'];
      }
      return scriptService.getRecommendedScripts(types, lead?.refund_reason)
    },
    enabled: !!lead
  })

  const { data: dbEvents = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
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
      
      // Setup schedule date
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

  const parseScriptVariables = (content: string) => {
    let parsed = content
    parsed = parsed.replace(/{NOME}/g, lead.name?.split(' ')[0] || '')
    parsed = parsed.replace(/{PRODUO}/g, lead.product_name || '')
    parsed = parsed.replace(/{LINK_CHECKOUT}/g, affiliateLink || '')
    parsed = parsed.replace(/{LINK_VENDAS}/g, salesLink || '')
    return parsed
  }

  const handleCopyScript = (content: string) => {
    const text = parseScriptVariables(content)
    navigator.clipboard.writeText(text)
    toast.success('Script copiado!')
  }

  const handleSendScript = (content: string) => {
    if (!lead.phone) return toast.error('Sem telefone')
    const text = parseScriptVariables(content)
    const url = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      await onUpdateStatus(lead.id!, newStatus)
      toast.success('Status atualizado')
      refetchEvents()
    } catch (err) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleScheduleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setScheduleDate(date)
    try {
      if (date) {
        await onScheduleAction(lead.id!, new Date(date).toISOString())
        toast.success('Retorno agendado')
      } else {
        await onScheduleAction(lead.id!, null)
        toast.success('Agendamento removido')
      }
      refetchEvents()
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
      refetchEvents()
    } catch (err) {
      toast.error('Erro ao enviar comentário')
    } finally {
      setIsUpdating(false)
    }
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

  const getEventBannerStyles = (event?: string | null) => {
    const type = event || ''
    if (type === 'pix_generated' || type === 'waiting_payment') {
      return 'bg-blue-50 border-blue-200 text-blue-700'
    } else if (type === 'purchase_refused') {
      return 'bg-red-50 border-red-200 text-red-700'
    } else if (type === 'checkout_abandoned') {
      return 'bg-orange-50 border-orange-200 text-orange-700'
    } else if (type === 'purchase_approved') {
      return 'bg-green-50 border-green-200 text-green-700'
    }
    return 'bg-gray-50 border-gray-200 text-gray-700'
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
      
      {/* FASE 1: HEADER FIXO (Contexto Imediato) */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-white shrink-0 z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[20px] font-bold text-gray-900 leading-tight">{lead.name}</h2>
            {lead.temperature === 'quente' && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-orange-50 text-orange-700 flex items-center gap-1">
                🔥 Quente
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Entrou há {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { locale: ptBR }) : 'Desconhecido'}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ÁREA DE SCROLL (CONTEÚDO) */}
      <div className="flex-1 overflow-y-auto bg-[#f9fafb] flex flex-col" ref={scrollRef}>
        <div className="p-6 space-y-6 flex-1">
          
          {/* FASE 2: DADOS DO LEAD E PRODUTO (Sem Sanfona) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
            
            {/* Dados do Cliente */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contato</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-medium">{lead.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                  <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{canSeeEmail ? (lead.email || '-') : '***@***.com'}</span>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-gray-100 -mx-4"></div>
            
            {/* Dados do Produto */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Produto</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 text-[13px] text-gray-700">
                  <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="font-bold leading-tight">{lead.product_name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                  <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>RT {lead.gateway_metadata && (lead.gateway_metadata as { amount?: number }).amount ? ((lead.gateway_metadata as { amount?: number }).amount! / 100).toFixed(2) : '-'}</span>
                </div>
              </div>
              
              {(affiliateLink || salesLink) && (
                <div className="pt-3 flex gap-2">
                  {affiliateLink && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(affiliateLink)
                        toast.success('Link de Checkout copiado!')
                      }} 
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[12px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Checkout
                    </button>
                  )}
                  {salesLink && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(salesLink)
                        toast.success('Página de Vendas copiada!')
                      }} 
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[12px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Pág. Vendas
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FASE 3: PROBLEMA E SOLUÇÃO (Evento + Script) */}
          <div>
            {isVendaAtiva ? (
              <div className="mb-3 px-4 py-3 rounded-xl border flex items-center gap-3 shadow-sm bg-indigo-50 border-indigo-200 text-indigo-700">
                <Activity className="w-5 h-5 shrink-0" />
                <span className="text-[13px] font-bold uppercase tracking-wide">
                  🎯 FOCO: ABORDAGEM DE VENDAS
                </span>
              </div>
            ) : (
              <div className={`mb-3 px-4 py-3 rounded-xl border shadow-sm ${getEventBannerStyles(lead.gateway_event)}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-[13px] font-bold uppercase tracking-wide">
                    Motivo: {translateEvent(lead.gateway_event)}
                  </span>
                </div>
                
                {/* Informações detalhadas de reembolso se existirem */}
                {(lead.refund_reason || lead.refunded_at) && (
                  <div className="pl-8 mt-2 space-y-1">
                    {lead.refund_reason && (
                      <p className="text-[13px] font-medium opacity-90">
                        <strong>Causa:</strong> {lead.refund_reason}
                      </p>
                    )}
                    {lead.refunded_at && (
                      <p className="text-[11px] opacity-75">
                        Data do Reembolso: {new Date(lead.refunded_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {recommendedScripts.length > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 shadow-sm relative">
                
                {/* FASE 4: MÚLTIPLAS ABORDAGENS (Abas) */}
                {recommendedScripts.length > 1 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    {recommendedScripts.map((script: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveScriptIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                          activeScriptIndex === idx 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {script.title || `Opção ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-wider">
                    {isVendaAtiva ? 'Script de Vendas Sugerido' : 'Script Sugerido'}
                  </h3>
                  <button onClick={() => handleCopyScript(recommendedScripts[activeScriptIndex].content)} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded transition-colors">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
                <p className="text-[14px] text-indigo-900 whitespace-pre-wrap leading-relaxed mb-4">
                  {parseScriptVariables(recommendedScripts[activeScriptIndex].content)}
                </p>
                <button 
                  onClick={() => handleSendScript(recommendedScripts[activeScriptIndex].content)}
                  className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all shadow-sm shadow-green-500/20 text-[14px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir WhatsApp com texto
                </button>
              </div>
            )}
          </div>

          {/* FASE 4: GESTÃO DO LEAD (Sessão de Follow-up) */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-2">Pós-Abordagem</h3>
            <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status do Lead</label>
                <select 
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 text-[13px] font-bold appearance-none transition-colors"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="novo">Novo</option>
                  <option value="em_atendimento">Em andamento</option>
                  <option value="recuperado">Recuperado (Ganho)</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Agendar Retorno</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={handleScheduleChange}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 text-[13px] font-bold transition-colors"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* FASE 5: LINHA DO TEMPO (HISTÓRICO) */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Linha do Tempo
            </h3>
            
            {isLoadingEvents ? (
              <div className="text-center py-4 text-gray-500 text-sm">Carregando histórico...</div>
            ) : (
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                {combinedEvents.map((log: any, idx: number) => {
                  const type = log.gateway_event || log.gateway_status || ''
                  let Icon = Activity
                  let iconBg = 'bg-gray-100'
                  let iconColor = 'text-gray-500'
                  let titleColor = 'text-gray-900'
                  
                  let isNote = false
                  
                  if (type === 'HUMAN_NOTE') {
                    Icon = MessageCircle
                    iconBg = 'bg-indigo-100'
                    iconColor = 'text-indigo-600'
                    isNote = true
                  } else if (type === 'STATUS_CHANGE') {
                    Icon = Activity
                    iconBg = 'bg-purple-100'
                    iconColor = 'text-purple-600'
                  } else if (type === 'SCHEDULE_CHANGE') {
                    Icon = Calendar
                    iconBg = 'bg-blue-100'
                    iconColor = 'text-blue-600'
                  } else if (type === 'pix_generated' || type === 'waiting_payment') {
                    Icon = QrCode
                    iconBg = 'bg-blue-100'
                    iconColor = 'text-blue-600'
                  } else if (type === 'purchase_refused') {
                    Icon = CreditCard
                    iconBg = 'bg-red-100'
                    iconColor = 'text-red-600'
                  } else if (type === 'checkout_abandoned') {
                    Icon = ShoppingCart
                    iconBg = 'bg-orange-100'
                    iconColor = 'text-orange-600'
                  } else if (type === 'purchase_approved') {
                    Icon = CheckCircle2
                    iconBg = 'bg-green-100'
                    iconColor = 'text-green-600'
                  }

                  let titleText = translateEvent(type)
                  if (type === 'HUMAN_NOTE') titleText = 'Comentário'
                  if (type === 'STATUS_CHANGE') titleText = 'Status Atualizado'
                  if (type === 'SCHEDULE_CHANGE') titleText = 'Agendamento'

                  return (
                    <div key={idx} className="relative pl-5">
                      <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center border-2 border-[#f9fafb]`}>
                        <Icon className={`w-3 h-3 ${iconColor}`} />
                      </div>
                      <div className={`bg-white border border-gray-100 rounded-xl p-3 shadow-sm ${isNote ? 'border-indigo-100 bg-indigo-50/30' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[12px] font-bold ${titleColor} uppercase tracking-wide`}>
                            {titleText}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {log.reason && (
                          <p className={`text-[13px] leading-relaxed ${isNote ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{log.reason}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE INPUT DE COMENTÁRIO FIXA NO RODAPÉ */}
      <div className="p-4 bg-white border-t border-gray-200 z-10 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all shadow-sm">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendNote()
              }
            }}
            placeholder="Adicione um comentário..."
            className="flex-1 bg-transparent border-0 focus:ring-0 outline-none text-gray-700 text-[14px] resize-none max-h-[120px] min-h-[40px] px-3 py-2.5 placeholder-gray-400"
            rows={1}
          />
          <button
            onClick={handleSendNote}
            disabled={isUpdating || !noteText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 mb-0.5 mr-0.5 shadow-sm"
          >
            {isUpdating ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-[10px] text-gray-400 text-center mt-2 font-medium">
          Pressione Enter para enviar
        </div>
      </div>

    </div>
  )
}
