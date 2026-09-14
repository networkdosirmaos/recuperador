"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Webhook, Plus, Copy, Check, Activity, Trash2 } from 'lucide-react'

type Integration = {
  id: string
  name: string
  type: string
  imported_at: string
  leads: [{ count: number }]
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      // Puxamos todas as listas que NÃO são do tipo CSV. 
      // Com count de leads já atrelados.
      const { data, error } = await supabase
        .from('lead_lists')
        .select(`
          id, 
          name, 
          type, 
          imported_at,
          leads(count)
        `)
        .eq('status', 'active')
        .neq('type', 'csv')
        .order('imported_at', { ascending: false })

      if (error) throw error
      setIntegrations(data as unknown as Integration[])
    } catch (error) {
      console.error('Erro ao buscar integrações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsCreating(true)
    try {
      const { error } = await supabase
        .from('lead_lists')
        .insert({
          name: newName,
          type: 'webhook_cakto', // Futuramente o formulário terá um select de Gateway
          status: 'active'
        })

      if (error) throw error
      setNewName('')
      await fetchIntegrations()
    } catch (error) {
      console.error('Erro ao criar integração:', error)
      alert('Falha ao criar integração.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyUrl = (listId: string) => {
    const url = `${window.location.origin}/api/webhooks/cakto?list_id=${listId}`
    navigator.clipboard.writeText(url)
    
    setCopiedId(listId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (listId: string) => {
    if (!confirm('Tem certeza que deseja deletar essa integração? Todos os leads capturados por ela continuarão no banco de dados, mas o link parará de funcionar.')) return
    
    try {
      const { error } = await supabase
        .from('lead_lists')
        .delete()
        .eq('id', listId)
        
      if (error) throw error
      await fetchIntegrations()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Falha ao deletar a integração.')
    }
  }

  const getGatewayBadge = (type: string) => {
    if (type === 'webhook_cakto') {
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold uppercase tracking-wider">Cakto</span>
    }
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold uppercase tracking-wider">Desconhecido</span>
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-7 h-7 text-indigo-600" />
            Integrações & Webhooks
          </h1>
          <p className="text-gray-500 mt-1">Conecte fontes externas para capturar leads automaticamente.</p>
        </div>
      </div>

      {/* Card de Criação */}
      <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-indigo-900">Nova Integração</h3>
          <p className="text-sm text-indigo-700/70 mt-1">Gere um novo Webhook para plugar em uma nova campanha ou produto.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Recuperação Mentoria Vip..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                required
              />
            </div>
            <div className="w-48">
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" disabled>
                <option>Gateway: Cakto</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isCreating ? 'Gerando...' : 'Gerar Webhook'}
            </button>
          </form>
        </div>
      </div>

      {/* Grid de Integrações Ativas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Suas Integrações Ativas</h3>
        
        {integrations.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-xl">
            <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Nenhuma integração criada ainda.</p>
            <p className="text-gray-400 mt-1">Crie sua primeira conexão acima para começar a receber leads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const leadsCount = integration.leads?.[0]?.count || 0
              
              return (
                <div key={integration.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{integration.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Criada em {new Date(integration.imported_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getGatewayBadge(integration.type)}
                      <button 
                        onClick={() => handleDelete(integration.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Deletar integração"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-gray-900">{leadsCount}</span> leads capturados
                  </div>

                  {/* URL Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">URL do Webhook (Copie e cole na Cakto)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/api/webhooks/cakto?list_id=${integration.id}`}
                        className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopyUrl(integration.id)}
                        className={`p-2 rounded-lg transition-colors border ${
                          copiedId === integration.id 
                            ? 'bg-green-50 border-green-200 text-green-600' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        title="Copiar URL"
                      >
                        {copiedId === integration.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
