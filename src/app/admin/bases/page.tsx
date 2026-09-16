"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { Folder, Webhook, UploadCloud, Trash2, ArrowRight, Activity, Users, Plus, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CsvUploader } from '@/components/upload/CsvUploader'
import { ColumnMapper } from '@/components/upload/ColumnMapper'

type ViewMode = 'LIST' | 'SELECT_FILE' | 'MAPPING' | 'UPLOADING' | 'SUCCESS'

type ListAsset = {
  id: string
  name: string
  type: string
  imported_at: string
  leadsCount: number
  recoveredCount: number
}

export default function BasesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [lists, setLists] = useState<ListAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Estados do Upload
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [listName, setListName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [totalRows, setTotalRows] = useState(0)

  const router = useRouter()

  useEffect(() => {
    if (viewMode === 'LIST') fetchLists()
  }, [viewMode])

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

  // ==== LOGICA DE UPLOAD ====
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setListName(selectedFile.name.replace('.csv', ''))
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.meta.fields.length > 0) {
          setCsvHeaders(results.meta.fields)
          setParsedData(results.data)
          setTotalRows(results.data.length)
          setViewMode('MAPPING')
        } else {
          alert('Não foi possível ler os cabeçalhos do CSV.')
        }
      },
      error: (error) => {
        console.error(error)
        alert('Erro ao processar o arquivo CSV.')
      }
    })
  }

  const handleCancel = () => {
    setFile(null)
    setCsvHeaders([])
    setParsedData([])
    setUploadProgress(0)
    setViewMode('LIST')
  }

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    setViewMode('UPLOADING')

    try {
      const { data: listData, error: listError } = await supabase
        .from('lead_lists')
        .insert([{ name: listName }])
        .select()
        .single()

      if (listError || !listData) throw new Error('Erro ao criar lista: ' + listError?.message)

      const listId = listData.id

      const leadsToInsert = parsedData.map(row => ({
        list_id: listId,
        name: row[mapping.name] || 'Desconhecido',
        phone: row[mapping.phone] ? String(row[mapping.phone]).trim() : null,
        email: mapping.email && row[mapping.email] ? String(row[mapping.email]).trim() : null,
        status: 'novo',
      }))

      const chunkSize = 1000
      let insertedCount = 0

      for (let i = 0; i < leadsToInsert.length; i += chunkSize) {
        const chunk = leadsToInsert.slice(i, i + chunkSize)
        const { error: insertError } = await supabase.from('leads').insert(chunk)
        if (insertError) throw new Error('Erro ao importar lote de leads.')

        insertedCount += chunk.length
        setUploadProgress(Math.round((insertedCount / leadsToInsert.length) * 100))
      }

      setViewMode('SUCCESS')
    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro durante o upload.')
      setViewMode('MAPPING')
    }
  }
  // ==========================

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="w-7 h-7 text-[#7c3aed]" />
            Importações & Bases
          </h1>
          <p className="text-gray-500 mt-1">
            Suas campanhas e listas operam como ativos. Importe novos CSVs ou navegue pelos antigos.
          </p>
        </div>
        {viewMode === 'LIST' && (
          <button 
            onClick={() => setViewMode('SELECT_FILE')}
            className="flex items-center gap-2 bg-[#7c3aed] text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Importar Lista CSV
          </button>
        )}
      </div>

      {viewMode === 'LIST' && (
        <>
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
      </>
      )}

      {viewMode === 'SELECT_FILE' && (
        <div>
          <button onClick={handleCancel} className="mb-4 flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> Cancelar Importação
          </button>
          <CsvUploader onFileSelect={handleFileSelect} />
        </div>
      )}

      {viewMode === 'MAPPING' && (
        <div className="space-y-6">
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Lista</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-[#7c3aed] focus:ring-[#7c3aed] p-2 border outline-none"
              placeholder="Ex: Leads Abandonados - Outubro"
            />
            <p className="mt-2 text-sm text-gray-500">Detectamos {totalRows} linhas no arquivo <strong>{file?.name}</strong>.</p>
          </div>

          <ColumnMapper 
            csvHeaders={csvHeaders} 
            onMappingComplete={handleMappingComplete} 
            onCancel={handleCancel}
          />
        </div>
      )}

      {viewMode === 'UPLOADING' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Importando Leads...</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Estamos salvando os leads no banco de dados. Por favor, não feche esta página.
          </p>
          
          <div className="w-full max-w-md bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className="bg-[#7c3aed] h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-gray-700">{uploadProgress}% concluído</p>
        </div>
      )}

      {viewMode === 'SUCCESS' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Concluído!</h3>
          <p className="text-gray-500 mb-8 max-w-md">
            Sua lista <strong>"{listName}"</strong> com {totalRows} leads foi importada com sucesso e já está disponível para distribuição.
          </p>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fazer novo upload
            </button>
            <button 
              onClick={() => { setViewMode('LIST'); fetchLists(); }}
              className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
            >
              Ver minhas bases
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
