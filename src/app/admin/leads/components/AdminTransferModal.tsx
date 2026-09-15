import React from 'react'
import type { ProfileRow } from '@/types/database.types'

interface AdminTransferModalProps {
  isOpen: boolean;
  selectedCount: number;
  collaborators: (Partial<ProfileRow> & { id: string })[];
  selectedCollaborator: string;
  setSelectedCollaborator: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AdminTransferModal({
  isOpen,
  selectedCount,
  collaborators,
  selectedCollaborator,
  setSelectedCollaborator,
  onClose,
  onConfirm,
  isPending
}: AdminTransferModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Transferir Leads</h3>
        <p className="text-sm text-gray-500 mb-4">
          Selecione o vendedor que irá assumir {selectedCount > 1 ? `estes ${selectedCount} clientes` : 'este cliente'}.
        </p>
        
        <select 
          value={selectedCollaborator || 'none'}
          onChange={(e) => setSelectedCollaborator(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 mb-4"
        >
          <option value="none">-- Sem dono (Remover da Fila) --</option>
          {collaborators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name || c.email} {c.is_active ? '(Ativo)' : '(Pausado)'}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Transferindo...' : 'Confirmar Transferência'}
          </button>
        </div>
      </div>
    </div>
  )
}