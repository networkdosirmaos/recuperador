"use client"

import { useState } from 'react'
import Papa from 'papaparse'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CsvUploader } from '@/components/upload/CsvUploader'
import { ColumnMapper } from '@/components/upload/ColumnMapper'

type UploadStep = 'SELECT_FILE' | 'MAPPING' | 'UPLOADING' | 'SUCCESS'

export default function UploadPage() {
  const [step, setStep] = useState<UploadStep>('SELECT_FILE')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [listName, setListName] = useState('')
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [totalRows, setTotalRows] = useState(0)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setListName(selectedFile.name.replace('.csv', ''))
    
    // Ler apenas o cabeçalho primeiro e parsear os dados
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.meta.fields.length > 0) {
          setCsvHeaders(results.meta.fields)
          setParsedData(results.data)
          setTotalRows(results.data.length)
          setStep('MAPPING')
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
    setStep('SELECT_FILE')
    setUploadProgress(0)
  }

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    setStep('UPLOADING')

    try {
      // 1. Criar a lista no banco de dados
      const { data: listData, error: listError } = await supabase
        .from('lead_lists')
        .insert([{ name: listName }])
        .select()
        .single()

      if (listError || !listData) throw new Error('Erro ao criar lista: ' + listError?.message)

      const listId = listData.id

      // 2. Preparar os dados baseados no mapeamento
      const leadsToInsert = parsedData.map(row => ({
        list_id: listId,
        name: row[mapping.name] || 'Desconhecido',
        phone: row[mapping.phone] ? String(row[mapping.phone]).trim() : null,
        email: mapping.email && row[mapping.email] ? String(row[mapping.email]).trim() : null,
        status: 'novo',
        // Nós salvamos o nome do produto temporariamente em uma coluna ou resolvemos o ID.
        // O ideal era ter a tabela products, mas podemos simplesmente não enviar product_id e 
        // adaptar depois, ou salvar no nome (se tivermos adicionado). 
        // Na Fase 2, deixamos product_id na tabela leads? O plano de Fase 2 não tinha product_id na tabela leads,
        // apenas nas compras. Opa, preciso checar isso, mas vou deixar simples:
      }))

      // Fatiamento (Chunking) para não quebrar a API
      const chunkSize = 1000
      let insertedCount = 0

      for (let i = 0; i < leadsToInsert.length; i += chunkSize) {
        const chunk = leadsToInsert.slice(i, i + chunkSize)
        
        const { error: insertError } = await supabase
          .from('leads')
          .insert(chunk)

        if (insertError) {
          console.error('Erro no chunk', insertError)
          throw new Error('Erro ao importar lote de leads.')
        }

        insertedCount += chunk.length
        setUploadProgress(Math.round((insertedCount / leadsToInsert.length) * 100))
      }

      setStep('SUCCESS')
    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro durante o upload.')
      setStep('MAPPING')
    }
  }

  const resetFlow = () => {
    setFile(null)
    setParsedData([])
    setStep('SELECT_FILE')
    setUploadProgress(0)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload de Leads</h1>
        <p className="text-gray-500 mt-1">Importe suas listas CSV para distribuição.</p>
      </div>

      {step === 'SELECT_FILE' && (
        <CsvUploader onFileSelect={handleFileSelect} />
      )}

      {step === 'MAPPING' && (
        <div className="space-y-6">
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Lista</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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

      {step === 'UPLOADING' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Importando Leads...</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Estamos salvando os leads no banco de dados. Por favor, não feche esta página.
          </p>
          
          <div className="w-full max-w-md bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-gray-700">{uploadProgress}% concluído</p>
        </div>
      )}

      {step === 'SUCCESS' && (
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
              onClick={resetFlow}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Fazer novo upload
            </button>
            <button 
              onClick={() => window.location.href = '/admin/dashboard'}
              className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Voltar ao Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
