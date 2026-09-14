import { useState } from 'react'
import { Phone, Mail, Inbox, Flame, ThermometerSun, AlertTriangle, Info, CreditCard, QrCode, FileText } from 'lucide-react'
import { LeadDetailsModal } from '../LeadDetailsModal'

export type MyLead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  temperature?: string
  cakto_updated_at?: string
  updated_at: string
  product_name?: string
  payment_method?: string
  cakto_status?: string
  reason?: string
  cakto_event?: string
  created_at?: string
}

interface HeatSettings {
  super_hot_days: number
  hot_days: number
  warm_days: number
}

interface MyLeadsTableProps {
  leads: MyLead[]
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>
  heatSettings?: HeatSettings
  operatorConfig?: any
}

const statusOptions = [
  { value: 'novo', label: 'Novo (Não Contatado)' },
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'boleto_gerado', label: 'Boleto Gerado' },
  { value: 'pix_gerado', label: 'Pix Gerado' },
  { value: 'recuperado', label: '✅ Recuperado (Sucesso)' },
  { value: 'perdido', label: '❌ Perdido (Sem interesse)' },
]

// Helper para calcular temperatura dinamicamente
const getDynamicHeat = (lead: MyLead, settings?: HeatSettings) => {
  if (!lead.cakto_updated_at) return lead.temperature || 'frio';
  if (!settings) return 'frio';

  const leadDate = new Date(lead.cakto_updated_at).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil(Math.abs(now - leadDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= settings.super_hot_days) return 'super_quente';
  if (diffDays <= settings.hot_days) return 'quente';
  if (diffDays <= settings.warm_days) return 'morno';
  return 'frio';
}

const getHeatWeight = (heat: string) => {
  if (heat === 'super_quente') return 4;
  if (heat === 'quente') return 3;
  if (heat === 'morno') return 2;
  return 1;
}

export function MyLeadsTable({ leads, onStatusChange, heatSettings, operatorConfig }: MyLeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<MyLead | null>(null)
  
  const config = operatorConfig || {
    show_product: true,
    show_payment_method: true,
    show_cakto_status: false,
    show_reason: false,
    show_cakto_updated_at: false
  }

  const sortedLeads = [...leads].sort((a, b) => {
    const heatA = getHeatWeight(getDynamicHeat(a, heatSettings));
    const heatB = getHeatWeight(getDynamicHeat(b, heatSettings));
    
    if (heatA !== heatB) return heatB - heatA; // Maior peso primeiro
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const getPaymentIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'pix': return <QrCode className="w-4 h-4" />
      case 'credit_card': return <CreditCard className="w-4 h-4" />
      case 'boleto': return <FileText className="w-4 h-4" />
      default: return null
    }
  }

  const handleWhatsApp = (phone: string | null) => {
    if (!phone) return alert('Cliente sem número de telefone.')
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}`, '_blank')
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sua Mesa de Trabalho (Leads Ativos)</h3>
        </div>
        
        {sortedLeads.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Inbox className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-lg">Sua mesa está vazia.</p>
            <p className="text-gray-400 mt-1">Puxe novos leads acima ou aguarde automações.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Produto & Info</th>
                  <th className="px-6 py-4">Contato (WhatsApp)</th>
                  <th className="px-6 py-4">Ação / Status CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedLeads.map((lead) => {
                  const heat = getDynamicHeat(lead, heatSettings);
                  
                  let rowColor = 'hover:bg-gray-50';
                  let nameColor = 'text-gray-900';
                  
                  if (heat === 'super_quente') {
                    rowColor = 'bg-red-50 hover:bg-red-100';
                    nameColor = 'text-red-900';
                  } else if (heat === 'quente') {
                    rowColor = 'bg-orange-50 hover:bg-orange-100';
                    nameColor = 'text-orange-900';
                  } else if (heat === 'morno') {
                    rowColor = 'bg-yellow-50 hover:bg-yellow-100';
                    nameColor = 'text-yellow-900';
                  }

                  return (
                    <tr key={lead.id} className={`transition-colors ${rowColor}`}>
                      <td className="px-6 py-4">
                        <div className={`font-medium text-base ${nameColor}`}>{lead.name}</div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {heat === 'super_quente' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              🔥 SUPER QUENTE
                            </span>
                          )}
                          {heat === 'quente' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              🔥 QUENTE
                            </span>
                          )}
                          {config.show_cakto_updated_at && (
                            <p className="text-[10px] text-gray-400 font-medium">
                              {lead.cakto_updated_at ? new Date(lead.cakto_updated_at).toLocaleDateString('pt-BR') : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {config.show_product && (
                          <div className="font-medium text-gray-700">{lead.product_name || 'Produto Padrão'}</div>
                        )}
                        {config.show_payment_method && lead.payment_method && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 uppercase font-semibold">
                            {getPaymentIcon(lead.payment_method)}
                            {lead.payment_method === 'credit_card' ? 'Cartão' : lead.payment_method}
                          </div>
                        )}
                        {config.show_cakto_status && lead.cakto_status && (
                          <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block font-medium">
                            Status: {lead.cakto_status}
                          </div>
                        )}
                        {config.show_reason && lead.reason && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded block font-medium">
                            Motivo: {lead.reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleWhatsApp(lead.phone)}
                            className="flex items-center justify-center w-full px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Phone className="w-4 h-4 mr-1.5" />
                            WhatsApp
                          </button>
                          
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="flex items-center justify-center w-full px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                          >
                            <Info className="w-4 h-4 mr-1.5 text-indigo-600" />
                            Ver Ficha
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => onStatusChange(lead.id, e.target.value)}
                          className={`w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 text-sm font-medium border cursor-pointer ${
                            lead.status === 'recuperado' ? 'bg-green-50 text-green-700 border-green-200' :
                            lead.status === 'perdido' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-white text-gray-700'
                          }`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeadDetailsModal 
        isOpen={selectedLead !== null} 
        onClose={() => setSelectedLead(null)} 
        lead={selectedLead} 
        viewType="collaborator" 
      />
    </>
  )
}
