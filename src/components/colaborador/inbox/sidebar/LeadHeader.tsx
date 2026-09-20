import { X, Clock } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LeadHeaderProps {
  lead: Partial<LeadRow>;
  onClose: () => void;
}

export function LeadHeader({ lead, onClose }: LeadHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-white shrink-0 z-10">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[20px] font-bold text-gray-900 leading-tight">{lead.name}</h2>
          {lead.temperature === 'quente' && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap bg-orange-50 text-orange-700 flex items-center gap-1">
              🔥 Quente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium" title="Data do último evento no sistema ou gateway">
          <Clock className="w-3.5 h-3.5" />
          <span>Último evento há {formatDistanceToNow(new Date(lead.gateway_updated_at || lead.updated_at || lead.created_at || new Date()), { locale: ptBR })}</span>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
