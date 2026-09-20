"use client"

import { useState, useEffect } from 'react'
import { X, User, Save, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentName: string
  currentAffiliateLink?: string
  currentSalesLink?: string
  onSave: (newName: string, newAffiliateLink: string, newSalesLink: string) => void
}

export function ProfileModal({ isOpen, onClose, userId, currentName, currentAffiliateLink, currentSalesLink, onSave }: ProfileModalProps) {
  const [name, setName] = useState('')
  const [affiliate, setAffiliate] = useState('')
  const [sales, setSales] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '')
      setAffiliate(currentAffiliateLink || '')
      setSales(currentSalesLink || '')
    }
  }, [isOpen, currentName, currentAffiliateLink, currentSalesLink])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const finalName = name.trim() || null
      const finalAffiliate = affiliate.trim() || null
      const finalSales = sales.trim() || null

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: finalName,
          affiliate_link: finalAffiliate,
          sales_link: finalSales
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      onSave(finalName || '', finalAffiliate || '', finalSales || '')
      onClose()
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      toast.error('Não foi possível salvar o perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Meu Perfil
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            Mantenha seu perfil atualizado. O seu <strong>Nome de Exibição</strong> é o que o sistema usará para preencher os scripts.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">👤 Nome de Exibição (1º Nome)</label>
              <input 
                type="text"
                placeholder="Ex: Leandro"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Link2 className="w-4 h-4" /> Link de Afiliado (Checkout)
              </label>
              <input 
                type="url"
                placeholder="https://pay.cakto.com.br/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                value={affiliate}
                onChange={(e) => setAffiliate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Link2 className="w-4 h-4" /> Link da Página de Vendas
              </label>
              <input 
                type="url"
                placeholder="https://meuproduto.com.br/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                value={sales}
                onChange={(e) => setSales(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      </div>
    </div>
  )
}
