import { Building, X } from 'lucide-react'

interface LeadAdminActionsProps {
  viewerRole: 'admin' | 'collaborator';
  isRemoving?: boolean;
  isDeleting?: boolean;
  onRemoveFromQueue?: () => void;
  onDeleteLead?: () => void;
}

export function LeadAdminActions({ viewerRole, isRemoving, isDeleting, onRemoveFromQueue, onDeleteLead }: LeadAdminActionsProps) {
  if (viewerRole !== 'admin') return null;
  
  return (
    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 shadow-sm space-y-3">
      <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
        <Building className="w-3.5 h-3.5" />
        Ações de Admin
      </h4>
      <div className="flex gap-2">
        {onRemoveFromQueue && (
          <button
            onClick={onRemoveFromQueue}
            disabled={isRemoving}
            className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-700 px-3 py-2 text-[12px] font-bold rounded-lg transition-colors disabled:opacity-50 text-center"
          >
            {isRemoving ? 'Removendo...' : 'Tirar da Fila (Pool)'}
          </button>
        )}
        {onDeleteLead && (
          <button
            onClick={onDeleteLead}
            disabled={isDeleting}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            title="Excluir Permanentemente"
          >
            {isDeleting ? <span className="animate-spin text-white">...</span> : <X className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
