"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Settings2, Flame, ThermometerSun, AlertTriangle, Snowflake } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    super_hot_days: 2,
    hot_days: 7,
    warm_days: 30
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error
      if (data) {
        setSettings({
          super_hot_days: data.super_hot_days,
          hot_days: data.hot_days,
          warm_days: data.warm_days
        })
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          super_hot_days: settings.super_hot_days,
          hot_days: settings.hot_days,
          warm_days: settings.warm_days,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) throw error
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Falha ao salvar as configurações. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-7 h-7 text-indigo-600" />
          Configurações do Sistema
        </h1>
        <p className="text-gray-500 mt-1">Gerencie as regras de negócio e inteligência do seu CRM.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Termômetro de Leads (Cakto)</h3>
            <p className="text-sm text-gray-500 mt-1">Defina o prazo de validade visual dos leads na mesa do vendedor.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Super Quente */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Super Quente</h4>
                <p className="text-sm text-red-700">Leads fresquinhos (ex: Pix gerado hoje)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Considerar até:</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={settings.super_hot_days}
                  onChange={(e) => setSettings({...settings, super_hot_days: parseInt(e.target.value) || 0})}
                  className="w-24 pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">dias</span>
              </div>
            </div>
          </div>

          {/* Quente */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <ThermometerSun className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-900">Quente</h4>
                <p className="text-sm text-orange-700">Leads que esfriaram um pouco</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Considerar até:</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={settings.hot_days}
                  onChange={(e) => setSettings({...settings, hot_days: parseInt(e.target.value) || 0})}
                  className="w-24 pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">dias</span>
              </div>
            </div>
          </div>

          {/* Morno */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-900">Morno</h4>
                <p className="text-sm text-yellow-700">Leads antigos que precisam de repescagem</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Considerar até:</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={settings.warm_days}
                  onChange={(e) => setSettings({...settings, warm_days: parseInt(e.target.value) || 0})}
                  className="w-24 pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">dias</span>
              </div>
            </div>
          </div>

          {/* Frio Note */}
          <div className="flex items-center gap-3 text-sm text-gray-500 px-4">
            <Snowflake className="w-4 h-4 text-blue-400" />
            <p>Qualquer lead que passe de <strong>{settings.warm_days} dias</strong> da atualização da Cakto será automaticamente classificado como <strong>Frio</strong>.</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Regras'}
          </button>
        </div>
      </div>
    </div>
  )
}
