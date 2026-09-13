import { Phone, Mail, Inbox } from 'lucide-react'

export type MyLead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  temperature?: string
  updated_at: string
}

interface MyLeadsTableProps {
  leads: MyLead[]
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>
}

const statusOptions = [
  { value: 'novo', label: 'Novo (Não Contatado)' },
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'boleto_gerado', label: 'Boleto Gerado' },
  { value: 'pix_gerado', label: 'Pix Gerado' },
  { value: 'recuperado', label: '✅ Recuperado (Sucesso)' },
  { value: 'perdido', label: '❌ Perdido (Sem interesse)' },
]

export function MyLeadsTable({ leads, onStatusChange }: MyLeadsTableProps) {
  // Ordenar: Fervendo primeiro
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.temperature === 'quente' && b.temperature !== 'quente') return -1;
    if (b.temperature === 'quente' && a.temperature !== 'quente') return 1;
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
                const isHot = lead.temperature === 'quente';
                return (
                  <tr key={lead.id} className={`transition-colors ${isHot ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-base ${isHot ? 'text-red-900' : 'text-gray-900'}`}>{lead.name}</p>
                        {isHot && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                            🔥 URGENTE
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isHot ? 'text-red-500' : 'text-gray-400'}`}>
                        Última att: {new Date(lead.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      {lead.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className={`w-4 h-4 mr-2 ${isHot ? 'text-red-500' : 'text-indigo-500'}`} />
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={`font-medium ${isHot ? 'text-red-700 hover:text-red-900' : 'hover:text-indigo-600'}`}>
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
