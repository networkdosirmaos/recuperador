import { X, Phone, CheckCircle2, AlertCircle } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'

interface LeadHeaderProfileProps {
  lead: Partial<LeadRow>;
  onClose: () => void;
  viewerRole: 'admin' | 'collaborator';
  canSeeEmail: boolean;
}

export function LeadHeaderProfile({ lead, onClose, viewerRole, canSeeEmail }: LeadHeaderProfileProps) {
  const isApproved = lead?.status === 'recuperado' || lead?.status === 'venda_organica' || lead?.gateway_status === 'approved' || lead?.gateway_event === 'purchase_approved'
  const isRefused = lead?.gateway_event === 'purchase_refused' || lead?.gateway_status === 'refused' || lead?.gateway_status === 'canceled'
  
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1.5">
          {lead?.name || 'Cliente'}
          {isApproved && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {isRefused && <AlertCircle className="w-5 h-5 text-red-500" />}
        </h2>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
            <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-gray-500" />
            </span>
            {lead?.phone || 'Sem telefone'}
          </div>
          
          {(canSeeEmail || viewerRole === 'admin') && lead?.email && (
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              <span className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 font-serif font-bold italic">@</span>
              </span>
              <span className="truncate max-w-[200px]" title={lead.email}>{lead.email}</span>
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={onClose}
        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
