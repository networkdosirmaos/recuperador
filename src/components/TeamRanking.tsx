import { Trophy, Medal, User } from 'lucide-react'

type TeamMember = {
  name: string
  recovered_count: number
}

interface TeamRankingProps {
  team: TeamMember[]
}

export function TeamRanking({ team }: TeamRankingProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Ranking da Equipe
        </h3>
      </div>
      
      {team.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center">
          <User className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum dado de vendas ainda.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {team.map((member, index) => (
            <li key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="w-8 flex justify-center mr-3">
                  {index === 0 && <Medal className="w-6 h-6 text-yellow-400" />}
                  {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                  {index > 2 && <span className="text-gray-400 font-bold">#{index + 1}</span>}
                </div>
                <span className="font-medium text-gray-900">{member.name}</span>
              </div>
              <div className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {member.recovered_count} rec.
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
