import { useState } from 'react'
import { DownloadCloud, Loader2 } from 'lucide-react'

interface LeadList {
  id: string
  name: string
}

interface PullLeadsCardProps {
  lists: LeadList[]
  onPullLeads: (listId: string) => Promise<void>
  isLoading: boolean
}

export function PullLeadsCard({ lists, onPullLeads, isLoading }: PullLeadsCardProps) {
  const [selectedListId, setSelectedListId] = useState<string>(lists.length > 0 ? lists[0].id : '')

  const handlePull = () => {
    if (!selectedListId) {
      alert('Selecione uma lista primeiro.')
      return
    }
    onPullLeads(selectedListId)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DownloadCloud className="w-5 h-5 text-indigo-600 mr-2" />
          Puxar Novos Leads
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-lg">
          Selecione a campanha (lista) em que você deseja focar agora e clique no botão para que o sistema entregue 10 clientes para você.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
        <select 
          className="w-full sm:w-64 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border text-sm text-gray-700"
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
          disabled={isLoading || lists.length === 0}
        >
          <option value="">Selecione uma Lista</option>
          {lists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>

        <button
          onClick={handlePull}
          disabled={isLoading || !selectedListId || lists.length === 0}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Puxar 10 Leads'
          )}
        </button>
      </div>
    </div>
  )
}
