import { PauseCircle, PlayCircle, RefreshCw, Link2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export type TeamMemberStat = {
  id: string
  name: string
  email: string
  is_active: boolean
  can_see_email: boolean
  in_progress: number
  recovered: number
  affiliate_link?: string
  sales_link?: string
}

interface TeamListProps {
  members: TeamMemberStat[]
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>
  onReturnLeads: (id: string) => Promise<void>
  onEditLink?: (member: TeamMemberStat) => void
  onToggleEmail?: (id: string, currentStatus: boolean) => Promise<void>
}

export function TeamList({ members, onToggleStatus, onReturnLeads, onEditLink, onToggleEmail }: TeamListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Membros da Equipe</h3>
      </div>
      
      {members.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500 font-medium">Nenhum colaborador encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Colaborador</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">📦 Pendentes na Mesa</th>
                <th className="px-6 py-4 whitespace-nowrap">🏆 Recuperados</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{member.name || member.email}</p>
                        {member.name && <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{member.email}</p>}
                      </div>
                      {member.affiliate_link && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                          <Link2 className="w-3 h-3" /> Link
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                      member.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {member.is_active ? '✅ Recebendo Leads' : '⏸️ Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap text-sm">
                    {member.in_progress} <span className="text-xs text-gray-400 font-normal">leads</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600 text-sm">
                    {member.recovered}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <Link
                        href={`/admin/equipe/${member.id}/fila`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                        title="Ver fila deste vendedor (Modo Espião)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Fila
                      </Link>
                      {onEditLink && (
                        <button
                          onClick={() => onEditLink(member)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Link
                        </button>
                      )}
                      {member.in_progress > 0 && (
                        <button
                          onClick={() => {
                            if(confirm('Tem certeza que deseja tirar os leads deste vendedor e devolver para a fila global?')) {
                              onReturnLeads(member.id)
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors shadow-sm whitespace-nowrap"
                          title="Devolver leads para a fila"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Devolver
                        </button>
                      )}
                      {onToggleEmail && (
                        <button
                          onClick={() => onToggleEmail(member.id, member.can_see_email)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors shadow-sm whitespace-nowrap ${
                            member.can_see_email 
                              ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700' 
                              : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                          }`}
                          title={member.can_see_email ? 'Ocultar emails dos leads' : 'Mostrar emails dos leads'}
                        >
                          {member.can_see_email ? (
                            <><Eye className="w-3.5 h-3.5" /> Ocultar E-mail</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5" /> E-mails Ocultos</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onToggleStatus(member.id, member.is_active)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors border shadow-sm whitespace-nowrap ${
                          member.is_active 
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200' 
                            : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                        }`}
                      >
                        {member.is_active ? (
                          <><PauseCircle className="w-3.5 h-3.5" /> Pausar</>
                        ) : (
                          <><PlayCircle className="w-3.5 h-3.5" /> Ativar</>
                        )}
                      </button>
                    </div>
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
