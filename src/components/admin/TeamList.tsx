import { PauseCircle, PlayCircle, RefreshCw } from 'lucide-react'

export type TeamMemberStat = {
  id: string
  name: string
  email: string
  is_active: boolean
  in_progress: number
  recovered: number
}

interface TeamListProps {
  members: TeamMemberStat[]
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>
  onReturnLeads: (id: string) => Promise<void>
}

export function TeamList({ members, onToggleStatus, onReturnLeads }: TeamListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
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
                <th className="px-6 py-4">Em Atendimento</th>
                <th className="px-6 py-4">Recuperados</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{member.name || member.email}</p>
                    {member.name && <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {member.in_progress} leads
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {member.recovered}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
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
                    
                    <button
                      onClick={() => onToggleStatus(member.id, member.is_active)}
                      className={`inline-flex items-center transition-colors ${
                        member.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {member.is_active ? (
                        <>
                          <PauseCircle className="w-4 h-4 mr-1" /> Pausar
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-1" /> Ativar
                        </>
                      )}
                    </button>
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
