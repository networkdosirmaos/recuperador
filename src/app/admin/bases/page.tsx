"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Folder, Webhook, UploadCloud, Trash2, ArrowRight, Activity, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ListAsset = {
  id: string
  name: string
  type: string
  imported_at: string
  leadsCount: number
  recoveredCount: number
}

export default function BasesPage() {
  const [lists, setLists] = useState<ListAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      setLoading(true)
      // Buscamos todas as listas (Webhooks e CSVs) ativas
      const { data: listsData, error: listsError } = await supabase
        .from('lead_lists')
        .select(`
          id, 
          name, 
          type, 
          imported_at,
          leads(count)
        `)
        .order('imported_at', { ascending: false })

      if (listsError) throw listsError

      // Processar os dados. Poderíamos buscar recovered count com RPC, 
      // mas para MVP vamos exibir o count geral primeiro.
      const formatted = listsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        imported_at: item.imported_at,
        leadsCount: item.leads?.[0]?.count || 0,
        recoveredCount: 0 // Simplificado para MVP
      }))

      setLists(formatted)
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCascade = async (list: ListAsset) => {
    const confirmName = prompt(
      `CUIDADO: Você está prestes a incinerar a pasta "${list.name}" e TODOS os seus ${list.leadsCount} leads.\n\n` +
      `Isso não pode ser desfeito. Digite o nome da pasta para confirmar:`
    )

    if (confirmName !== list.name) {
      if (confirmName !== null) alert('Nome incorreto. Exclusão cancelada.')
      return
    }

    setDeletingId(list.id)
    try {
      const res = await fetch(`/api/admin/lists/${list.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha na API de exclusão')
      
      alert('Pasta e todos os leads vinculados foram apagados com sucesso.')
      await fetchLists()
    } catch (error) {
      console.error('Erro ao deletar em cascata:', error)
      alert('Erro ao excluir a base.')
    } finally {
      setDeletingId(null)
    }
  }

  const getIcon = (type: string) => {
    return type === 'webhook_cakto' ? <Webhook className="w-8 h-8 text-blue-500" /> : <UploadCloud className="w-8 h-8 text-emerald-500" />
  }

  const getTypeLabel = (type: string) => {
    return type === 'webhook_cakto' ? 'Automação Cakto' : 'Upload CSV'
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Folder className="w-7 h-7 text-indigo-600" />
          Gestão de Bases (Campanhas)
        </h1>
        <p className="text-gray-500 mt-1">
          Suas campanhas e listas operam como ativos. Navegue por elas ou incinere listas erradas.
        </p>
      </div>

      {lists.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-xl">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Nenhuma base de dados encontrada.</p>
          <p className="text-gray-400 mt-1">Crie integrações ou faça uploads para popular sua base.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div key={list.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              
              {/* Barra de cor baseada no tipo */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${list.type === 'webhook_cakto' ? 'bg-blue-500' : 'bg-emerald-500'}`} />

              <div className="flex justify-between items-start mb-6 mt-2">
                <div className="flex gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {getIcon(list.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{list.name}</h4>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                      {getTypeLabel(list.type)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Volume Total</span>
                  <span className="font-bold text-gray-900 text-lg">{list.leadsCount} leads</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Activity className="w-3.5 h-3.5"/> Criação</span>
                  <span className="font-medium text-gray-900 text-sm mt-0.5">
                    {new Date(list.imported_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => handleDeleteCascade(list)}
                  disabled={deletingId === list.id}
                  className="p-2.5 text-gray-400 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
                  title="Apagar Pasta e Leads (Cascata)"
                >
                  {deletingId === list.id ? <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/> : <Trash2 className="w-5 h-5" />}
                </button>
                
                <button 
                  onClick={() => router.push(`/admin/leads?listId=${list.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Abrir no CRM <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
