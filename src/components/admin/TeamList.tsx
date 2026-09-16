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
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">📦 Pendentes na Mesa</th>
                <th className="px-6 py-4">🏆 Recuperados</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{member.name || member.email}</p>
                        {member.name && <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>}
                      </div>
                      {member.affiliate_link && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Link2 className="w-3 h-3" /> Link Salvo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.is_active ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm' : 'bg-red-100 text-red-800 border border-red-200 shadow-sm'
                    }`}>
                      {member.is_active ? '✅ Recebendo Leads' : '⏸️ Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {member.in_progress} leads
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {member.recovered}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/equipe/${member.id}/fila`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shadow-sm"
                        title="Ver fila deste vendedor (Modo Espião)"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Fila
                      </Link>
                      {onEditLink && (
                        <button
                          onClick={() => onEditLink(member)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                        >
                          <Link2 className="w-4 h-4" />
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
                          className="text-orange-600 hover:text-orange-800 transition-colors inline-flex items-center"
                          title="Devolver leads para a fila"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Devolver Leads
                        </button>
                      )}
                      {onToggleEmail && (
                        <button
                          onClick={() => onToggleEmail(member.id, member.can_see_email)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors shadow-sm ${
                            member.can_see_email 
                              ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700' 
                              : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                          }`}
                          title={member.can_see_email ? 'Ocultar emails dos leads' : 'Mostrar emails dos leads'}
                        >
                          {member.can_see_email ? (
                            <><Eye className="w-4 h-4" /> E-mails Visíveis</>
                          ) : (
                            <><EyeOff className="w-4 h-4" /> E-mails Ocultos</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onToggleStatus(member.id, member.is_active)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          member.is_active 
                            ? 'text-red-600 hover:bg-red-50 border-red-200' 
                            : 'text-green-600 hover:bg-green-50 border-green-200'
                        }`}
                      >
                        {member.is_active ? (
                          <>
                            <PauseCircle className="w-4 h-4 mr-1.5" /> Pausar
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 mr-1.5" /> Ativar
                          </>
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
