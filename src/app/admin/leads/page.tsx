"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Filter } from 'lucide-react'

export default function BaseDeLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles (full_name),
          lead_lists (name, type)
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Limitado para não travar o navegador. Numa V2 colocar paginação real

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao buscar base de leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  )

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-600" />
          Base Geral de Leads
        </h1>
        <p className="text-gray-500 mt-1">Visualize e pesquise todos os leads que entraram no sistema.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Produto / Origem</th>
                  <th className="p-4">Status CRM</th>
                  <th className="p-4">Vendedor Atual</th>
                  <th className="p-4">Data de Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-xs text-gray-500">{lead.email || lead.phone || 'Sem contato'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{lead.product_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {lead.lead_lists?.type === 'webhook_cakto' ? '⚡ Automação Cakto' : '📁 Planilha CSV'}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">
                        {lead.profiles?.full_name || <span className="text-gray-400 italic">Na Fila</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum lead encontrado com essa busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
