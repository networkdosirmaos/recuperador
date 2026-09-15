import React from 'react'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface AdminBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenTransferModal: () => void;
  onDeleteSelected: () => void;
}

export function AdminBulkActions({
  selectedCount,
  onClearSelection,
  onOpenTransferModal,
  onDeleteSelected
}: AdminBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center bg-indigo-500 w-6 h-6 rounded-full text-xs font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-medium">selecionados</span>
      </div>
      
      <div className="w-px h-6 bg-gray-700"></div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenTransferModal}
          className="flex items-center gap-2 text-sm font-medium hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Transferir (Massa)
        </button>
        <button 
          onClick={onDeleteSelected}
          className="flex items-center gap-2 text-sm font-medium text-red-400 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      </div>

      <button 
        onClick={onClearSelection}
        className="ml-2 p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
        title="Limpar seleção"
      >
        <XCircle className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  )
}