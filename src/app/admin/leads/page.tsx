"use client"

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Filter, Loader2, Info, CreditCard, QrCode, FileText } from 'lucide-react'
import { LeadDetailsModal } from '@/components/LeadDetailsModal'

function BaseDeLeadsContent() {
  const searchParams = useSearchParams()
  const initialListId = searchParams.get('listId') || 'all'

  const [leads, setLeads] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedList, setSelectedList] = useState(initialListId)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const { data: listsData } = await supabase
        .from('lead_lists')
        .select('id, name, type')
        .order('imported_at', { ascending: false })
      
      if (listsData) setLists(listsData)

      // Faz a primeira busca manual
      await executeSearch(undefined, true)
    } catch (error) {
      console.error('Erro na inicialização:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeSearch = async (e?: React.FormEvent, isInitialLoad = false) => {
    if (e) e.preventDefault()
    
    try {
      setSearching(true)
      
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles (full_name),
          lead_lists (name, type)
        `)
      
      // Aplicar filtros de Gaveta (Lista) - consideramos initialListId no carregamento inicial
      const targetList = isInitialLoad ? initialListId : selectedList
      if (targetList !== 'all') {
        query = query.eq('list_id', targetList)
      }
      
      // Aplicar filtros de Status
      if (!isInitialLoad && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }
      
      // Aplicar filtro de Texto (Pesquisa no DB)
      if (!isInitialLoad && searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%,phone.ilike.%${searchTerm.trim()}%`)
      }

      // Ordenar por mais recentes primeiro (Limite de segurança de 200 para a tela no explodir)
      query = query.order('created_at', { ascending: false }).limit(200)

      const { data, error } = await query

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setSearching(false)
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
              <option value="recuperado">Recuperado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={searching}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5" />}
            Aplicar Filtros
          </button>
        </div>
      </form>

      {/* TABELA DE RESULTADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {searching && leads.length === 0 ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Produto & Pgto</th>
                  <th className="p-4">Status / Evento</th>
                  <th className="p-4">Vendedor Atual</th>
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-xs text-gray-500">{lead.email || lead.phone || 'Sem contato'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(lead.created_at).toLocaleString('pt-BR')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{lead.product_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {lead.lead_lists?.type === 'webhook_cakto' ? '⚡ ' : '📁 '} 
                        {lead.lead_lists?.name || 'Sem lista'}
                      </div>
                      {lead.payment_method && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 font-semibold uppercase">
                          {getPaymentIcon(lead.payment_method)} {lead.payment_method === 'credit_card' ? 'Cartão' : lead.payment_method}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="mb-1">{getStatusBadge(lead.status)}</div>
                      {lead.cakto_status && (
                        <div className="text-[10px] text-gray-500 font-mono">Cakto: {lead.cakto_status}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">
                        {lead.profiles?.full_name || <span className="text-gray-400 italic">Na Fila</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Ficha
                      </button>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
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
        isOpen={selectedLead !== null} 
        onClose={() => setSelectedLead(null)} 
        lead={selectedLead} 
        viewType="admin" 
      />
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
