"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scriptService } from '@/services/script.service'
import type { ActionScript, CreateActionScriptDTO } from '@/types/script.types'
import { BookOpen, Plus, Search, Edit2, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const EVENT_OPTIONS = [
  { value: 'checkout_abandoned', label: 'Carrinho Abandonado' },
  { value: 'waiting_payment', label: 'Boleto/Pix Gerado' },
  { value: 'purchase_refused', label: 'Compra Recusada' },
  { value: 'refund_requested', label: 'Reembolso Solicitado' },
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'venda_ativa', label: '🎯 Vendas Ativas / Prospecção' },
]

export default function PlaybookPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeEventTab, setActiveEventTab] = useState<string>('checkout_abandoned')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<ActionScript | null>(null)
  
  // Form State
  const [formData, setFormData] = useState<CreateActionScriptDTO>({
    event_type: 'checkout_abandoned',
    title: '',
    content: '',
    sub_condition: ''
  })

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['admin_scripts'],
    queryFn: scriptService.getAdminScripts
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateActionScriptDTO) => scriptService.createScript(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_scripts'] })
      toast.success('Script criado com sucesso!')
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: Partial<CreateActionScriptDTO> }) => 
      scriptService.updateScript(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_scripts'] })
      toast.success('Script atualizado com sucesso!')
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scriptService.deleteScript(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_scripts'] })
      toast.success('Script removido com sucesso!')
    }
  })

  const handleOpenModal = (script?: ActionScript) => {
    if (script) {
      setEditingScript(script)
      setFormData({
        event_type: script.event_type,
        title: script.title,
        content: script.content,
        sub_condition: script.sub_condition || ''
      })
      setActiveEventTab(script.event_type)
    } else {
      setEditingScript(null)
      setFormData({
        event_type: activeEventTab,
        title: '',
        content: '',
        sub_condition: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingScript(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload: CreateActionScriptDTO = {
      ...formData,
      sub_condition: formData.sub_condition?.trim() || null
    }

    if (editingScript) {
      updateMutation.mutate({ id: editingScript.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este script?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredScripts = scripts.filter(s => 
    s.event_type === activeEventTab &&
    (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Playbook de Vendas
          </h1>
          <p className="text-gray-500 mt-1">Crie os scripts perfeitos que seus vendedores usarão para converter os leads de acordo com cada evento da Cakto.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Novo Script
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Abas Superiores */}
        <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar bg-gray-50/50">
          {EVENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setActiveEventTab(opt.value)}
              className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeEventTab === opt.value 
                  ? 'border-indigo-600 text-indigo-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
              <span className="ml-2 inline-flex items-center justify-center bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5 min-w-[20px]">
                {scripts.filter(s => s.event_type === opt.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="mb-6 relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar script pelo título ou conteúdo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum script por aqui</h3>
              <p className="text-gray-500">Crie o primeiro texto persuasivo para este tipo de evento.</p>
              <button 
                onClick={() => handleOpenModal()}
                className="mt-4 text-indigo-600 font-semibold hover:text-indigo-800"
              >
                + Criar Script
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredScripts.map(script => (
                <div key={script.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors flex flex-col group bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{script.title}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(script)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(script.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  {script.sub_condition && (
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                        <Tag className="w-3 h-3" /> Condição: "{script.sub_condition}"
                      </span>
                    </div>
                  )}
                  
                  <div className="text-gray-600 text-sm whitespace-pre-wrap flex-1 bg-gray-50 p-4 rounded-lg font-medium border border-gray-100">
                    {script.content.substring(0, 200)}{script.content.length > 200 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{editingScript ? 'Editar Script' : 'Novo Script Persuasivo'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título do Script</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Abordagem de Rejeição de Cartão 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cenário (Evento da Cakto)</label>
                    <select 
                      value={formData.event_type}
                      onChange={e => setFormData({...formData, event_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    >
                      {EVENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Sub-condição (Opcional)
                      <span className="text-gray-400 font-normal ml-2 text-xs" title="Se preenchido, este script só aparecerá se a palavra digitada aqui estiver contida no motivo do estorno ou recusa.">?</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.sub_condition || ''}
                      onChange={e => setFormData({...formData, sub_condition: e.target.value})}
                      placeholder="Ex: fraude, duplicidade..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[250px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between items-center">
                    Corpo da Mensagem (O que o vendedor irá enviar)
                  </label>
                  <textarea 
                    required
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder={`Olá {NOME}, vi que você tentou comprar o {PRODUTO} e deu um errinho...`}
                    className="w-full flex-1 min-h-[250px] p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700 resize-none leading-relaxed"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" /> Variáveis Mágicas
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Clique para colar a variável no texto. O sistema substituirá automaticamente essas tags pelos dados reais do cliente e do vendedor na hora de copiar.
                </p>
                <div className="space-y-2">
                  {[
                    { tag: '{NOME}', desc: 'Primeiro nome do cliente' },
                    { tag: '{PRODUTO}', desc: 'Nome do produto na Cakto' },
                    { tag: '{COLABORADOR}', desc: 'Primeiro nome do vendedor logado' },
                    { tag: '{LINK_CHECKOUT}', desc: 'Link de afiliado do vendedor' },
                    { tag: '{LINK_VENDAS}', desc: 'Link da página de vendas' },
                  ].map(v => (
                    <button 
                      key={v.tag}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, content: f.content + v.tag }))}
                      className="w-full text-left p-3 rounded-lg border border-indigo-100 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <span className="block font-bold text-indigo-700 text-sm group-hover:text-indigo-800">{v.tag}</span>
                      <span className="block text-xs text-gray-500 mt-1">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar Script'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
