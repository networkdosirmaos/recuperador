"use client"

import { useEffect, useState } from 'react'
import { Users, Clock, Headset, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { KpiCard } from '@/components/KpiCard'
import { RecentLeadsTable } from '@/components/RecentLeadsTable'
import { HeatSettings } from '@/utils/heatCalculator'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [heatSettings, setHeatSettings] = useState<HeatSettings | null>(null)
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    recovered: 0
  })
  const [recentLeads, setRecentLeads] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // Buscar configs de temperatura primeiro
        const { data: settingsData } = await supabase.from('system_settings').select('*').eq('id', 1).single()
        if (settingsData) {
          setHeatSettings(settingsData)
        }

        // Fetch KPIs
        const { count: total } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        const { count: pending } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'novo')
        const { count: inProgress } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['em_atendimento', 'boleto_gerado', 'pix_gerado'])
        const { count: recovered } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'recuperado')

        setMetrics({
          total: total || 0,
          pending: pending || 0,
          inProgress: inProgress || 0,
          recovered: recovered || 0
        })

        // Fetch Recent Leads
        // Assuming products and profiles tables are joined for nice names
        // If the relationships are slightly different, this might need adjusting, but it's safe to start with.
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id,
            name,
            status,
            updated_at,
            product_name,
            gateway_event,
            profiles (
              full_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        if (leadsError) {
           console.error('Erro ao buscar últimos leads:', leadsError)
        }

        if (leads) {
          const formattedLeads = leads.map(l => ({
            id: l.id,
            name: l.name,
            product: l.product_name || 'N/A', 
            event: l.gateway_event || '-',
            status: l.status,
            assigned_to: l.profiles ? (l.profiles as any).full_name : null,
            updated_at: l.updated_at
          }))
          setRecentLeads(formattedLeads)
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Acompanhe as métricas do seu funil de recuperação de vendas em tempo real.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total de Leads" 
          value={metrics.total} 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <KpiCard 
          title="Fila (Sem vendedor)" 
          value={metrics.pending} 
          icon={Clock} 
          colorClass="bg-red-50 text-red-600" 
        />
        <KpiCard 
          title="Em Atendimento" 
          value={metrics.inProgress} 
          icon={Headset} 
          colorClass="bg-yellow-50 text-yellow-600" 
        />
        <KpiCard 
          title="Recuperados (Sucesso)" 
          value={metrics.recovered} 
          icon={CheckCircle} 
          colorClass="bg-green-50 text-green-600" 
        />
      </div>

      {/* Main Content */}
      <div>
        <RecentLeadsTable leads={recentLeads} heatSettings={heatSettings} />
      </div>
    </div>
  )
}
