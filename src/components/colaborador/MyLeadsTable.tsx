import { Phone, Mail, Inbox, Flame, ThermometerSun, AlertTriangle } from 'lucide-react'

export type MyLead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  temperature?: string
  cakto_updated_at?: string
  updated_at: string
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
  // Se não veio da Cakto, usamos o fallback (criado da planilha = frio, ou manual = quente)
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

export function MyLeadsTable({ leads, onStatusChange, heatSettings }: MyLeadsTableProps) {
  // Ordenar: Mais quente primeiro, depois mais recente
  const sortedLeads = [...leads].sort((a, b) => {
    const heatA = getHeatWeight(getDynamicHeat(a, heatSettings));
    const heatB = getHeatWeight(getDynamicHeat(b, heatSettings));
    
    if (heatA !== heatB) return heatB - heatA; // Maior peso primeiro
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
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
                <th className="px-6 py-4 w-1/3">Cliente</th>
                <th className="px-6 py-4 w-1/3">Contato</th>
                <th className="px-6 py-4 w-1/3">Ação / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedLeads.map((lead) => {
                const heat = getDynamicHeat(lead, heatSettings);
                
                // Definir cores com base na temperatura dinâmica
                let rowColor = 'hover:bg-gray-50';
                let nameColor = 'text-gray-900';
                let phoneColor = 'text-indigo-500';
                
                if (heat === 'super_quente') {
                  rowColor = 'bg-red-50 hover:bg-red-100';
                  nameColor = 'text-red-900';
                  phoneColor = 'text-red-500';
                } else if (heat === 'quente') {
                  rowColor = 'bg-orange-50 hover:bg-orange-100';
                  nameColor = 'text-orange-900';
                  phoneColor = 'text-orange-500';
                } else if (heat === 'morno') {
                  rowColor = 'bg-yellow-50 hover:bg-yellow-100';
                  nameColor = 'text-yellow-900';
                  phoneColor = 'text-yellow-600';
                }

                return (
                  <tr key={lead.id} className={`transition-colors ${rowColor}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-base ${nameColor}`}>{lead.name}</p>
                        
                        {/* Badges de Temperatura */}
                        {heat === 'super_quente' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 animate-pulse border border-red-200">
                            <Flame className="w-3 h-3 mr-1" /> SUPER QUENTE
                          </span>
                        )}
                        {heat === 'quente' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            <ThermometerSun className="w-3 h-3 mr-1" /> QUENTE
                          </span>
                        )}
                        {heat === 'morno' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <AlertTriangle className="w-3 h-3 mr-1" /> MORNO
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${heat !== 'frio' ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                        Cakto Att: {lead.cakto_updated_at ? new Date(lead.cakto_updated_at).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </p>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      {lead.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className={`w-4 h-4 mr-2 ${phoneColor}`} />
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={`font-medium hover:opacity-75 ${phoneColor}`}>
                            {lead.phone}
                          </a>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                      )}
                      {!lead.phone && !lead.email && <span className="text-gray-400 italic">Sem contato</span>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead.id, e.target.value)}
                        className={`w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 text-sm font-medium border cursor-pointer ${
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
  )
}
