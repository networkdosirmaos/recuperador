import React, { useState, useEffect } from 'react'
import { X, Calendar, MessageCircle, AlertCircle, Clock, Building, DollarSign, QrCode, Phone, Activity, CreditCard, ShoppingCart, CheckCircle2, Copy, Package, ChevronRight, ChevronDown } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow, addDays, setHours, setMinutes } from 'date-fns'
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
  const [nextStep, setNextStep] = useState<'agendar' | 'finalizar'>('finalizar')
  const [scheduleDate, setScheduleDate] = useState('')
  
  // Accordions state
  const [showDataLinks, setShowDataLinks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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
      setNoteText('')
      setStatus(lead.status || 'em_atendimento')
      setShowDataLinks(false)
      setShowHistory(false)
      
      // Auto-set nextStep based on existing schedule
      if (lead.next_action_at) {
        setNextStep('agendar')
        // Format to YYYY-MM-DDThh:mm
        const d = new Date(lead.next_action_at)
        // Adjust for local timezone
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setScheduleDate(d.toISOString().slice(0, 16))
      } else {
        setNextStep('finalizar')
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
    toast.success('Script copiado com as variaveis preenchidas!')
  }

  const handleSendScript = (content: string) => {
    if (!lead.phone) return toast.error('Sem telefone')
    const text = parseScriptVariables(content)
    const url = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleSaveForm = async () => {
    setIsUpdating(true)
    try {
      if (noteText.trim()) {
        await onSaveNote(lead.id!, noteText)
      }
      
      if (status !== lead.status) {
        await onUpdateStatus(lead.id!, status)
      }

      if (nextStep === 'agendar' && scheduleDate) {
        await onScheduleAction(lead.id!, new Date(scheduleDate).toISOString())
      } else if (nextStep === 'finalizar' && lead.next_action_at) {
        await onScheduleAction(lead.id!, null) // Limpa agendamento se escolheu finalizar
      }

      toast.success('Atendimento salvo com sucesso!')
      onClose() // Fecha sidebar após salvar o fluxo completo
    } catch (err) {
      toast.error('Erro ao salvar o atendimento.')
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

  // Pegar a última anotação humana
  const lastHumanNote = combinedEvents.find(e => e.gateway_event === 'HUMAN_NOTE' || e.gateway_status === 'HUMAN_NOTE')

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{lead.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
              {translateEvent(lead.gateway_event)}
            </span>
            {lead.temperature === 'quente' && lead.status !== 'recuperado' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600 flex items-center gap-1 border border-orange-200">
                ß Quente
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="truncate max-w-[280px]">{lead.product_name || 'Produto não identificado'}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-[#f9fafb]">
        
        {/* BLOCO 1: ÚLTIMO CONTATO */}
        {(lastHumanNote || lead.next_action_at) && (
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Último contato</h3>
            <div className="space-y-2.5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              {lastHumanNote && (
                <div className="flex items-start gap-3 text-[13px] text-gray-700">
                  <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{lastHumanNote.reason}</span>
                </div>
              )}
              {lead.next_action_at && (
                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="leading-relaxed">Retorno combinado: {new Date(lead.next_action_at).toLocaleString('pt-BR', { timeStyle: 'short', dateStyle: 'short' })}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BLOCO 2: SCRIPT SUGERIDO */}
        {recommendedScripts.length > 0 && (
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Script sugerido</h3>
            <p className="text-[12px] text-gray-500 mb-3">{recommendedScripts[0].title}</p>
            
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 shadow-sm relative">
              <p className="text-[14px] text-indigo-900 whitespace-pre-wrap leading-relaxed mb-4">
                {parseScriptVariables(recommendedScripts[0].content)}
              </p>
              <button 
                onClick={() => handleCopyScript(recommendedScripts[0].content)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar texto
              </button>
            </div>
            
            <button 
              onClick={() => handleSendScript(recommendedScripts[0].content)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-green-500/20 text-[15px]"
            >
              <MessageCircle className="w-[20px] h-[20px]" />
              Abrir WhatsApp com este texto
            </button>
          </div>
        )}

        {/* BLOCO 3: REGISTRAR ATENDIMENTO */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">Registrar atendimento</h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="O que aconteceu na conversa?"
              className="w-full px-3 py-2 bg-transparent border-0 focus:ring-0 outline-none text-gray-700 text-[14px] resize-none -h-[80px] placeholder-gray-400"
            />
            
            <div className="h-px bg-gray-100 -mx-4"></div>
            
            <div className="flex flex-col md:flex-row gap-4 pt-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700 text-sm font-medium"
                >
                  <option value="novo">Novo</option>
                  <option value="em_atendimento">Aguardando pagamento / Retorno</option>
                  <option value="recuperado">Recuperado (Venda Fechada)</option>
                  <option value="perdido">Perdido (Não comprou)</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Próximo passo</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="nextStep" 
                      checked={nextStep === 'agendar'}
                      onChange={() => setNextStep('agendar')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Agendar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="nextStep" 
                      checked={nextStep === 'finalizar'}
                      onChange={() => setNextStep('finalizar')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Finalizar</span>
                  </label>
                </div>
                {nextStep === 'agendar' && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700 text-sm"
                  />
                )}
              </div>
            </div>

            <button 
              onClick={handleSaveForm}
              disabled={isUpdating}
              className="wmuse py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm mt-4 text-[14px] disabled:opacity-70 disabled:cursor-not-allowed u-full"
            >
              {isUpdating ? 'Salvando...' : 'Salvar atendimento'}
            </button>
          </div>
        </div>

        {/* BLOCO 4: ACCORDIONS */}
        <div className="border-t border-gray-200 pt-6 space-y-3">
          
          {/* Accordion: Dados do Produto */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button 
              onClick={() => setShowDataLinks(!showDataLinks)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-[14px]">
                <Package className="w-4 h-4 text-gray-400" />
                Dados e links do produto
              </div>
              {showDataLinks ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {showDataLinks && (
              <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
                <div className="flex items-center gap-3 text-[13px] text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{lead.product_name || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-600">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>RT {lead.gateway_metadata && (lead.gateway_metadata as { amount?: number }).amount ? ((lead.gateway_metadata as { amount?: number }).amount! / 100).toFixed(2) : '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{lead.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-600">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span>{canSeeEmail ? (lead.email || '-') : '***@***.com'}</span>
                </div>
                
                {(affiliateLink || salesLink) && (
                  <div className="pt-3 space-y-2">
                    {affiliateLink && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(affiliateLink)
                          toast.success('Link de Checkout copiado!')
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[13px]"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Checkout
                      </button>
                    )}
                    {salesLink && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(salesLink)
                          toast.success('Página de Vendas copiada!')
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[13px]"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Pág. de Vendas
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion: Histórico */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-center p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-[14px]">
                <Clock className="w-4 h-4 text-gray-400" />
                Histórico · \n{combinedEvents.length} registros
              </div>
              {showHistory ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {showHistory && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
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

                      if (type === 'HUMAN_NOTE') {
                        Icon = MessageCircle
                        iconBg = 'bg-purple-100'
                        iconColor = 'text-purple-600'
                      } else if (type === 'pix_generated' || type === 'waiting_payment') {
                        Icon = QrCode
                        iconBg = 'bg-indigo-100'
                        iconColor = 'text-indigo-600'
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

                      return (
                        <div key={idx} className="relative pl-5">
                          <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center border-2 border-white`}>
                            <Icon className={`w-3 h-3 ${iconColor}`} />
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[12px] font-bold ${titleColor} uppercase tracking-wide`}>
                                {translateEvent(type)}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            {log.reason && (
                              <p className="text-[13px] text-gray-600 leading-relaxed">{log.reason}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
