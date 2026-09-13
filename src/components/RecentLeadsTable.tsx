import { FileText } from 'lucide-react'

type Lead = {
  id: string
  name: string
  product: string
  status: string
  assigned_to: string | null
  updated_at: string
}

interface RecentLeadsTableProps {
  leads: Lead[]
}

const statusColors: Record<string, string> = {
  'novo': 'bg-blue-100 text-blue-800',
  'em_atendimento': 'bg-yellow-100 text-yellow-800',
  'boleto_gerado': 'bg-orange-100 text-orange-800',
  'pix_gerado': 'bg-purple-100 text-purple-800',
  'recuperado': 'bg-green-100 text-green-800',
  'perdido': 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  'novo': 'Novo',
  'em_atendimento': 'Em Atendimento',
  'boleto_gerado': 'Boleto Gerado',
  'pix_gerado': 'Pix Gerado',
  'recuperado': 'Recuperado',
  'perdido': 'Perdido',
}

export function RecentLeadsTable({ leads }: RecentLeadsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Últimos Leads (Pulso)</h3>
      </div>
      
      {leads.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center">
          <FileText className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum lead encontrado no sistema.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nome do Lead</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Última Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.product}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {lead.assigned_to ? lead.assigned_to : <span className="text-gray-400 italic">Na fila</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(lead.updated_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
