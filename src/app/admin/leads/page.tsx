"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useMemo, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Filter, Loader2, Info, CreditCard, QrCode, FileText, Trash2 } from 'lucide-react'
import { LeadDetailsModal } from '@/components/LeadDetailsModal'

// Componentes extraídos (Fase 7)
import { AdminFilters } from './components/AdminFilters'
import { AdminTable } from './components/AdminTable'
import { AdminBulkActions } from './components/AdminBulkActions'
import { AdminTransferModal } from './components/AdminTransferModal'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { assignMultipleLeadsSecure, deleteLeadsSecure } from '@/app/actions/admin.actions'
import type { LeadRow, ProfileRow } from '@/types/database.types'
import toast from 'react-hot-toast'

function BaseDeLeadsContent() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const initialListId = searchParams.get('listId') || 'all'

  const [selectedLead, setSelectedLead] = useState<any>(null)
  
  // Modal de Transferência
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean, leadId: string | null }>({ isOpen: false, leadId: null })
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null)

  // Filtros Visuais (Inputs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedList, setSelectedList] = useState(initialListId)
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Filtros Aplicados (Os que ativam a busca)
  const [activeFilters, setActiveFilters] = useState({
    listId: initialListId,
    status: 'all',
    searchTerm: ''
  })

  // Admin Column Toggles
  const [showColumns, setShowColumns] = useState({
    origin: true,
    payment: true,
    gateway_status: true,
    gateway_event: true,
    reason: true,
    gateway_updated_at: true,
    crm_status: true,
    seller: true
  });

  // Queries
  const { data: lists = [], isLoading: loadingLists } = useQuery({
    queryKey: ['admin_lead_lists'],
    queryFn: adminService.getLeadLists
  })

  const { data: collaborators = [], isLoading: loadingCollaborators } = useQuery({
    queryKey: ['admin_collaborators'],
    queryFn: adminService.getCollaborators
  })

  const { data: leads = [], isLoading: isLoadingLeads, isFetching } = useQuery({
    queryKey: ['admin_leads', activeFilters],
    queryFn: () => adminService.searchLeads(activeFilters)
  })

  const loading = loadingLists || loadingCollaborators || isLoadingLeads;
  const searching = isFetching;

  // Mutations
  const assignMultipleLeadsMutation = useMutation({
    mutationFn: ({ leadIds, collabId }: { leadIds: string[], collabId: string | null }) => 
      assignMultipleLeadsSecure(leadIds, collabId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin_collaborators'] })
      setTransferModal({ isOpen: false, leadId: null })
      setSelectedLeads([])
      toast.success('Leads transferidos com sucesso!')
    },
    onError: (err: any) => {
      console.error(err)
      toast.error('Erro ao transferir leads.')
    }
  })

  // === EXCLUSÃO EM MASSA ===
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  const deleteLeadsMutation = useMutation({
    mutationFn: (leadIds: string[]) => deleteLeadsSecure(leadIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_leads'] })
      setSelectedLeads([])
      toast.success('Leads excluídos com sucesso!')
    },
    onError: (err: any) => {
      console.error(err)
      toast.error('Erro ao excluir leads.')
    }
  })

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length && leads.length > 0) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l: any) => l.id))
    }
  }

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = () => {
    if (window.confirm(`Tem certeza que deseja APAGAR PERMANENTEMENTE ${selectedLeads.length} leads?`)) {
      deleteLeadsMutation.mutate(selectedLeads)
    }
  }
  // ==========================

  const handleTransfer = () => {
    if (selectedLeads.length === 0) return
    assignMultipleLeadsMutation.mutate({ 
      leadIds: selectedLeads, 
      collabId: selectedCollaborator === 'none' ? null : selectedCollaborator 
    })
  }

  const executeSearch = (e?: React.FormEvent, override?: { term: string, status: string }) => {
    if (e) e.preventDefault()
    
    if (override) {
      setSearchTerm(override.term)
      setSelectedStatus(override.status)
      setActiveFilters({
        listId: selectedList,
        status: override.status,
        searchTerm: override.term
      })
    } else {
      setActiveFilters({
        listId: selectedList,
        status: selectedStatus,
        searchTerm: searchTerm
      })
    }
  }

  const getPaymentIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'pix': return <QrCode className="w-4 h-4 text-emerald-600" />
      case 'credit_card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'boleto': return <FileText className="w-4 h-4 text-gray-600" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string, color: string }> = {
      novo: { label: 'Novo na Fila', color: 'bg-blue-100 text-blue-800' },
      em_atendimento: { label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-800' },
      recuperado: { label: 'Recuperado', color: 'bg-green-100 text-green-800' },
      perdido: { label: 'Perdido', color: 'bg-red-100 text-red-800' },
    }
    const config = map[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-600" />
          Base Geral de Leads
        </h1>
        <p className="text-gray-500 mt-1">Filtre suas origens e visualize toda a sua base de clientes.</p>
      </div>

      {/* PAINEL DE FILTROS */}
      <form onSubmit={executeSearch} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pesquisar Cliente</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Nome, e-mail ou telefone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Origem / Lista</label>
            <select 
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            >
              <option value="all">Todas as Origens</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.type === 'webhook_cakto' ? '⚡ ' : '📁 '}{list.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status CRM</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            >
              <option value="all">Qualquer Status</option>
              <option value="novo">Novo na Fila</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="recuperado">Recuperado (Afiliado)</option>
              <option value="venda_organica">Venda Orgânica</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100 mt-4">
          
          {/* QUICK FILTERS */}
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 hide-scrollbar">
            <button
              type="button"
              onClick={() => executeSearch(undefined, { term: 'pix', status: 'novo' })}
              className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-full text-xs font-bold transition-colors"
            >
              🧊 Em Geladeira
            </button>
            <button
              type="button"
              onClick={() => executeSearch(undefined, { term: '', status: 'venda_organica' })}
              className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-full text-xs font-bold transition-colors"
            >
              💰 Vendas Orgânicas
            </button>
            <button
              type="button"
              onClick={() => executeSearch(undefined, { term: 'abandoned', status: 'novo' })}
              className="whitespace-nowrap px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-full text-xs font-bold transition-colors"
            >
              🛑 Abandonos
            </button>
          </div>

          <button 
            type="submit" 
            disabled={searching}
            className="flex items-center gap-2 px-6 py-2 bg-[#7c3aed] text-white font-medium rounded-lg hover:bg-[#6d28d9] transition-colors shadow-sm"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5" />}
            Aplicar Filtros
          </button>
        </div>
      </form>

      {/* TOGGLES DE COLUNAS (VISÃO ADMIN) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Colunas Visíveis</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.origin} onChange={(e) => setShowColumns({...showColumns, origin: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Origem/Lista</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.payment} onChange={(e) => setShowColumns({...showColumns, payment: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Pagamento</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.gateway_status} onChange={(e) => setShowColumns({...showColumns, gateway_status: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Status Gateway</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.gateway_event} onChange={(e) => setShowColumns({...showColumns, gateway_event: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Evento Gateway</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.reason} onChange={(e) => setShowColumns({...showColumns, reason: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Motivo (Reason)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.gateway_updated_at} onChange={(e) => setShowColumns({...showColumns, gateway_updated_at: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Data Gateway</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.crm_status} onChange={(e) => setShowColumns({...showColumns, crm_status: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Status CRM</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showColumns.seller} onChange={(e) => setShowColumns({...showColumns, seller: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-700">Vendedor Atual</span>
          </label>
        </div>
      </div>

      {/* BARRA DE AÇÃO EM MASSA */}
      {selectedLeads.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-4 sticky top-4 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              {selectedLeads.length}
            </div>
            <span className="text-gray-100 font-medium">leads selecionados</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setTransferModal({ isOpen: true, leadId: null })}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Transferir
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={deleteLeadsMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/90 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {deleteLeadsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE RESULTADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        {searching && leads.length === 0 ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="w-full min-w-max">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={leads.length > 0 && selectedLeads.length === leads.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Produto</th>
                  {showColumns.origin && <th className="p-4">Origem</th>}
                  {showColumns.payment && <th className="p-4">Pagamento</th>}
                  {showColumns.gateway_status && <th className="p-4">Status Gateway</th>}
                  {showColumns.gateway_event && <th className="p-4">Evento</th>}
                  {showColumns.reason && <th className="p-4">Motivo</th>}
                  {showColumns.gateway_updated_at && <th className="p-4">Data Gateway</th>}
                  {showColumns.crm_status && <th className="p-4">Status CRM</th>}
                  {showColumns.seller && <th className="p-4">Vendedor Atual</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead: LeadRow) => (
                  <tr key={lead.id} className={`transition-colors ${selectedLeads.includes(lead.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                      />
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="text-left group focus:outline-none"
                      >
                        <div className="font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors underline decoration-indigo-200 underline-offset-2">{lead.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{lead.email || lead.phone || 'Sem contato'}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{new Date(lead.created_at).toLocaleString('pt-BR')}</div>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{lead.product_name || 'N/A'}</div>
                    </td>
                    {showColumns.origin && (
                      <td className="p-4 text-xs text-gray-600">
                        {lead.lead_lists?.type === 'webhook_cakto' ? '⚡ ' : '📁 '} 
                        {lead.lead_lists?.name || 'Sem lista'}
                      </td>
                    )}
                    {showColumns.payment && (
                      <td className="p-4">
                        {lead.payment_method && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold uppercase">
                            {getPaymentIcon(lead.payment_method)} {lead.payment_method === 'credit_card' ? 'Cartão' : lead.payment_method}
                          </div>
                        )}
                      </td>
                    )}
                    {showColumns.gateway_status && (
                      <td className="p-4 text-xs font-mono text-gray-600">
                        {lead.gateway_status || '-'}
                      </td>
                    )}
                    {showColumns.gateway_event && (
                      <td className="p-4 text-xs text-gray-600">
                        {lead.gateway_event || '-'}
                      </td>
                    )}
                    {showColumns.reason && (
                      <td className="p-4 text-xs text-red-600">
                        {lead.reason ? <span title={lead.reason}>{lead.reason.substring(0, 30)}...</span> : '-'}
                      </td>
                    )}
                    {showColumns.gateway_updated_at && (
                      <td className="p-4 text-xs text-gray-500">
                        {lead.gateway_updated_at ? new Date(lead.gateway_updated_at).toLocaleString('pt-BR') : '-'}
                      </td>
                    )}
                    {showColumns.crm_status && (
                      <td className="p-4">
                        <div className="mb-1">{getStatusBadge(lead.status)}</div>
                      </td>
                    )}
                    {showColumns.seller && (
                      <td className="p-4">
                        {lead.current_assignee_id ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-sm font-medium text-gray-900">
                              {collaborators.find((c: any) => c.id === lead.current_assignee_id)?.full_name || 'Vendedor'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Sem dono</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-500">
                      Nenhum lead encontrado com estes filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeadDetailsModal 
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        viewType="admin"
      />

      {/* Modal de Transferência */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transferir Leads</h3>
            <p className="text-sm text-gray-500 mb-4">Selecione o vendedor que irá assumir {selectedLeads.length > 1 ? `estes ${selectedLeads.length} clientes` : 'este cliente'}.</p>
            
            <select 
              value={selectedCollaborator || 'none'}
              onChange={(e) => setSelectedCollaborator(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 mb-4"
            >
              <option value="none">-- Sem dono (Remover da Fila) --</option>
              {collaborators.map((c: Partial<ProfileRow> & { id: string }) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email} {c.is_active ? '(Ativo)' : '(Pausado)'}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTransferModal({ isOpen: false, leadId: null })}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleTransfer}
                disabled={assignMultipleLeadsMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {assignMultipleLeadsMutation.isPending ? 'Transferindo...' : 'Confirmar Transferência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BaseDeLeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando CRM...</div>}>
      <BaseDeLeadsContent />
    </Suspense>
  )
}
