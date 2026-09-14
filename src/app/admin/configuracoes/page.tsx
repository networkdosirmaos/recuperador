"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Settings2, Flame, ThermometerSun, AlertTriangle, Snowflake } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<{
    super_hot_days: number;
    hot_days: number;
    warm_days: number;
    operator_columns_config?: any;
  }>({
    super_hot_days: 2,
    hot_days: 7,
    warm_days: 30,
    operator_columns_config: {
      show_product: true,
      show_payment_method: true,
      show_cakto_status: false,
      show_reason: false,
      show_cakto_updated_at: false
    }
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
          warm_days: data.warm_days,
          operator_columns_config: data.operator_columns_config || settings.operator_columns_config
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
          operator_columns_config: settings.operator_columns_config,
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
      </div>

      {/* NOVO BLOCO: VISÃO DO OPERADOR */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Visão da Equipe (Mesa de Trabalho)</h3>
            <p className="text-sm text-gray-500 mt-1">Escolha quais colunas os vendedores podem ver na tabela deles.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={settings.operator_columns_config?.show_product ?? true} 
              onChange={(e) => setSettings({...settings, operator_columns_config: {...settings.operator_columns_config, show_product: e.target.checked}})} 
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-700 font-medium">Mostrar Nome do Produto</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={settings.operator_columns_config?.show_payment_method ?? true} 
              onChange={(e) => setSettings({...settings, operator_columns_config: {...settings.operator_columns_config, show_payment_method: e.target.checked}})} 
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-700 font-medium">Mostrar Forma de Pagamento (Cartão/Pix)</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={settings.operator_columns_config?.show_cakto_status ?? false} 
              onChange={(e) => setSettings({...settings, operator_columns_config: {...settings.operator_columns_config, show_cakto_status: e.target.checked}})} 
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-700 font-medium">Mostrar Status Original (Gateway)</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={settings.operator_columns_config?.show_reason ?? false} 
              onChange={(e) => setSettings({...settings, operator_columns_config: {...settings.operator_columns_config, show_reason: e.target.checked}})} 
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-700 font-medium">Mostrar Motivo da Recusa (Reason)</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={settings.operator_columns_config?.show_cakto_updated_at ?? false} 
              onChange={(e) => setSettings({...settings, operator_columns_config: {...settings.operator_columns_config, show_cakto_updated_at: e.target.checked}})} 
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-gray-700 font-medium">Mostrar Data de Atualização no Gateway</span>
          </label>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
