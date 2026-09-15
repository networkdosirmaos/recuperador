import React from 'react'
import { Filter, Search, ArrowUpDown } from 'lucide-react'

interface AdminFiltersProps {
  activeFilters: { listId: string; status: string; searchTerm: string };
  setActiveFilters: (filters: any) => void;
  lists: { id: string; name: string }[];
  showColumns: Record<string, boolean>;
  setShowColumns: (columns: any) => void;
}

export function AdminFilters({
  activeFilters,
  setActiveFilters,
  lists,
  showColumns,
  setShowColumns
}: AdminFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 gap-4 w-full">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400"
            value={activeFilters.searchTerm}
            onChange={(e) => setActiveFilters({ ...activeFilters, searchTerm: e.target.value })}
          />
        </div>
        
        {/* Filtro Status CRM */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 font-medium cursor-pointer"
            value={activeFilters.status}
            onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value })}
          >
            <option value="all">Todos os Status</option>
            <option value="novo">Novos</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="recuperado">Recuperados</option>
            <option value="perdido">Perdidos</option>
          </select>
        </div>

        {/* Filtro Listas/Origem */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 font-medium cursor-pointer"
            value={activeFilters.listId}
            onChange={(e) => setActiveFilters({ ...activeFilters, listId: e.target.value })}
          >
            <option value="all">Todas as Listas</option>
            {lists.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
            Colunas
          </button>
          
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Visibilidade</div>
            {Object.keys(showColumns).map(colKey => (
              <label key={colKey} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={showColumns[colKey as keyof typeof showColumns]}
                  onChange={(e) => setShowColumns({ ...showColumns, [colKey]: e.target.checked })}
                />
                <span className="text-sm text-gray-700 capitalize">{colKey.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}