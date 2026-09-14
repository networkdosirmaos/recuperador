import { X, CreditCard, Activity, User, Mail, Phone, ShoppingBag, Calendar, AlertCircle, Code, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { useState } from 'react'

type LeadDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  lead: any
  viewType?: 'admin' | 'colaborador'
}

export function LeadDetailsModal({ isOpen, onClose, lead, viewType = 'colaborador' }: LeadDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'debug'>('details')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['lead_events', lead?.id],
    queryFn: () => adminService.getLeadEvents(lead?.id),
    enabled: isOpen && !!lead?.id
  })

  if (!isOpen || !lead) return null

  // Mapeamento de Cores para o Status do Gateway
  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s.includes('paid') || s.includes('approved')) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (s.includes('waiting') || s.includes('pending')) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    if (s.includes('refused') || s.includes('failed') || s.includes('abandonment')) return 'text-red-700 bg-red-50 border-red-200'
    if (s.includes('refund') || s.includes('chargeback')) return 'text-orange-700 bg-orange-50 border-orange-200'
    return 'text-gray-700 bg-gray-50 border-gray-200'
  }

  let heatLabel = 'Frio'
  let heatColor = 'bg-blue-100 text-blue-800 border-blue-200'

  if (lead.temperature === 'super_quente') {
    heatLabel = '🔥 Super Quente'
    heatColor = 'bg-red-100 text-red-800 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
  } else if (lead.temperature === 'quente') {
    heatLabel = '🔥 Quente'
    heatColor = 'bg-orange-100 text-orange-800 border-orange-200'
  } else if (lead.temperature === 'morno') {
    heatLabel = '☀️ Morno'
    heatColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const isTest = lead.name?.includes('TESTE')
  const modalMaxWidth = activeTab === 'debug' ? 'max-w-6xl' : 'max-w-2xl'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-2xl w-full ${modalMaxWidth} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 transition-all duration-300 ease-out`}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900 truncate pr-4">{lead.name}</h2>
              {isTest && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                  Teste Integrado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">Ficha de Auditoria Avançada</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex px-6 border-b border-gray-100 bg-white overflow-x-auto">
          <button 
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Detalhes do Cliente
          </button>
          <button 
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'timeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('timeline')}
          >
            Linha do Tempo
            {events.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'timeline' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                {events.length}
              </span>
            )}
          </button>
          <button 
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'debug' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('debug')}
          >
            <Code className="w-4 h-4" />
            Auditoria / Integração
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          
          {activeTab === 'details' ? (
            <>
              {/* STATUS CARDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <Activity className="w-4 h-4" />
                    Temperatura
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${heatColor}`}>
                    {heatLabel}
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <CreditCard className="w-4 h-4" />
                    Status no Gateway
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(lead.gateway_status)}`}>
                    {lead.gateway_status || 'DESCONHECIDO'}
                  </span>
                </div>
              </div>

              {/* DADOS DO CLIENTE */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Informações de Contato</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">E-mail</span>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 break-all">{lead.email || 'Não informado'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</span>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{lead.phone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-medium text-gray-500 mb-1">Documento (ID)</span>
                    <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded inline-block">{lead.customer_id || 'Não rastreado'}</span>
                  </div>
                </div>
              </div>

              {/* DADOS DO PRODUTO & COMPRA */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Detalhes da Transação</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-medium text-gray-500 mb-1">Produto Ofertado</span>
                    <span className="text-sm font-medium text-gray-900">{lead.product_name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">Forma de Pagamento</span>
                    <span className="text-sm font-medium text-gray-900 uppercase">{lead.payment_method || 'Não identificada'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">Última Atualização (Gateway)</span>
                    <div className="flex items-center gap-1.5 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {lead.gateway_updated_at ? format(new Date(lead.gateway_updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </div>
                  </div>
                  
                  {lead.gateway_event && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-medium text-gray-500 mb-1">Último Evento Disparado</span>
                      <span className="text-sm text-gray-700 font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded inline-block">
                        {lead.gateway_event}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CAIXA DE MOTIVO / LOG (Apenas se existir) */}
              {(lead.reason || lead.refund_reason) && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Motivo de Falha / Erro (Reason)
                  </div>
                  <p className="text-sm text-red-900 font-mono break-all whitespace-pre-wrap leading-relaxed bg-white/60 p-3 rounded-lg border border-red-100">
                    {lead.refund_reason || lead.reason}
                  </p>
                </div>
              )}
            </>
          ) : activeTab === 'timeline' ? (
            /* CONTEÚDO DA LINHA DO TEMPO */
            <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
              {loadingEvents ? (
                <div className="pl-6 text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Buscando histórico...
                </div>
              ) : events.length === 0 ? (
                <div className="pl-6 text-sm text-gray-500">Nenhum evento registrado no histórico para este cliente.</div>
              ) : (
                events.map((ev: any, index: number) => {
                  const isExpanded = expandedEvent === ev.id;
                  
                  return (
                    <div key={ev.id} className="relative pl-6 transition-all duration-200">
                      {/* Bolinha na linha do tempo */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${index === 0 ? 'bg-indigo-600 shadow-[0_0_0_3px_rgba(79,70,229,0.2)]' : 'bg-gray-300'}`}></div>
                      
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                        <div 
                          className="p-4 cursor-pointer flex items-start justify-between gap-4"
                          onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ev.gateway_status)}`}>
                                {ev.gateway_status || 'UNKNOWN'}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">{ev.gateway_event}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(ev.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          
                          <div className="text-gray-400">
                            {isExpanded ? <span className="text-xs font-medium">Recolher</span> : <span className="text-xs font-medium">Detalhes</span>}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50 p-4 border-t border-gray-100 text-xs">
                            {ev.reason && (
                              <div className="mb-4">
                                <span className="block font-semibold text-gray-700 mb-1 uppercase tracking-wider">Motivo / Log:</span>
                                <div className="text-red-700 font-mono bg-red-50 p-2 rounded border border-red-100 break-words whitespace-pre-wrap">
                                  {ev.reason}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="block font-semibold text-gray-700 mb-1 uppercase tracking-wider">Payload Bruto (JSON):</span>
                              <pre className="text-gray-600 font-mono bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre text-[10px] leading-relaxed max-h-48 overflow-y-auto">
                                {JSON.stringify(ev.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* CONTEÚDO DA ABA DE DEBUG / INTEGRAÇÃO */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
              {/* Lado Esquerdo: JSON Bruto */}
              <div className="flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-sm">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Code className="w-4 h-4" /> Payload Bruto (Último Webhook)
                  </h3>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-4 overflow-auto flex-1 max-h-[500px]">
                  <pre className="text-green-400 font-mono text-[11px] leading-relaxed whitespace-pre">
                    {JSON.stringify(lead.gateway_metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Lado Direito: De -> Para */}
              <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" /> 
                    Mapeamento de Colunas (De ➔ Para)
                  </h3>
                </div>
                <div className="p-0 overflow-y-auto flex-1 max-h-[500px]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-1/2">Origem do Dado (Cakto)</th>
                        <th className="px-4 py-3 font-semibold w-1/2">Salvo no CRM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : null

                        const mappings = [
                          { jsonKey: 'data[0].customerName (ou customer.name)', dbKey: 'Nome', dbVal: lead.name },
                          { jsonKey: 'data[0].customerEmail (ou customer.email)', dbKey: 'E-mail', dbVal: lead.email },
                          { jsonKey: 'data[0].customerCellphone', dbKey: 'Telefone', dbVal: lead.phone },
                          { jsonKey: 'data[0].product.name', dbKey: 'Produto', dbVal: lead.product_name },
                          { jsonKey: 'data[0].paymentMethod', dbKey: 'Pagamento', dbVal: lead.payment_method },
                          { jsonKey: 'event', dbKey: 'Evento Webhook', dbVal: lead.gateway_event },
                          { jsonKey: 'status (ou recoveryStatus)', dbKey: 'Status Cakto', dbVal: lead.gateway_status },
                          { jsonKey: 'data[0].product.id (ou customer.id)', dbKey: 'ID Cliente (Cakto)', dbVal: lead.customer_id },
                          { jsonKey: 'reason (ou refundReason)', dbKey: 'Motivo Falha/Erro', dbVal: lead.reason || lead.refund_reason },
                          { jsonKey: 'refundedAt', dbKey: 'Data Estorno', dbVal: formatDate(lead.refunded_at) },
                          { jsonKey: 'updatedAt (ou paidAt)', dbKey: 'Última Atualização', dbVal: formatDate(lead.gateway_updated_at) },
                          { jsonKey: '(Lógica Interna CRM)', dbKey: 'Temperatura', dbVal: heatLabel },
                        ]

                        return mappings.map((m, i) => {
                          const isEmpty = !m.dbVal || m.dbVal === '-'

                          return (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-gray-500 break-all">
                                {m.jsonKey}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{m.dbKey}</div>
                                <div className={`text-xs mt-0.5 truncate max-w-[250px] ${isEmpty ? 'text-gray-400 italic' : 'text-gray-600'}`} title={m.dbVal || ''}>
                                  {isEmpty ? 'Vazio' : m.dbVal}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
