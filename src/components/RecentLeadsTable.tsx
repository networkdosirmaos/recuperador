import { FileText } from 'lucide-react'
import { HeatSettings, getDynamicHeat, getHeatBadgeStyle } from '@/utils/heatCalculator'

type Lead = {
  id: string
  name: string
  product: string
  event?: string
  status: string
  assigned_to: string | null
  updated_at: string
}

interface RecentLeadsTableProps {
  leads: Lead[]
  heatSettings?: HeatSettings | null
}

export function RecentLeadsTable({ leads, heatSettings }: RecentLeadsTableProps) {
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
                <th className="px-6 py-4 whitespace-nowrap">Nome do Lead</th>
                <th className="px-6 py-4 whitespace-nowrap">Produto</th>
                <th className="px-6 py-4 whitespace-nowrap">Evento</th>
                <th className="px-6 py-4 whitespace-nowrap">Temperatura</th>
                <th className="px-6 py-4 whitespace-nowrap">Responsável</th>
                <th className="px-6 py-4 whitespace-nowrap">Entrada / Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => {
                const heatLevel = getDynamicHeat(lead.updated_at, heatSettings || null)
                const badge = getHeatBadgeStyle(heatLevel)

                return (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-[250px] truncate" title={lead.product}>{lead.product}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {lead.event || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {lead.assigned_to ? lead.assigned_to : <span className="text-gray-400 italic">Na fila</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(lead.updated_at).toLocaleString('pt-BR')}
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
