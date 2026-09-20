import { Phone, MessageCircle, Package, DollarSign } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'

interface LeadDetailsProps {
  lead: Partial<LeadRow>;
  canSeeEmail: boolean;
}

export function LeadDetails({ lead, canSeeEmail }: LeadDetailsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
      {/* Dados do Cliente */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contato</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[13px] text-gray-700">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium">{lead.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-700">
            <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{canSeeEmail ? (lead.email || '-') : '***@***.com'}</span>
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gray-100 -mx-4"></div>
      
      {/* Dados do Produto */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Produto</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3 text-[13px] text-gray-700">
            <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span className="font-bold leading-tight">{lead.product_name || '-'}</span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-700">
            <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
            <span>RT {lead.gateway_metadata && (lead.gateway_metadata as { amount?: number }).amount ? ((lead.gateway_metadata as { amount?: number }).amount! / 100).toFixed(2) : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
