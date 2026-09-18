"use client"

import { useState } from 'react'
import { Users, Clock, Headset, CheckCircle, Filter } from 'lucide-react'
import { KpiCard } from '@/components/KpiCard'
import { RecentLeadsTable } from '@/components/RecentLeadsTable'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'

export default function AdminDashboard() {
  const [hideOrganicSales, setHideOrganicSales] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['admin_dashboard_metrics', hideOrganicSales],
    queryFn: () => adminService.getDashboardMetrics(hideOrganicSales),
    refetchInterval: 30000 // Refetch a cada 30 segundos
  })

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const metrics = data?.metrics || { total: 0, pending: 0, inProgress: 0, recovered: 0 }
  const recentLeads = data?.recentLeads || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 mt-1">Acompanhe os resultados da sua equipe em tempo real.</p>
        </div>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <input 
            type="checkbox" 
            checked={hideOrganicSales}
            onChange={(e) => setHideOrganicSales(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" />
            Ocultar Vendas Orgânicas
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total de Leads"
          value={metrics.total.toString()}
          icon={Users}
          colorClass="bg-blue-50 text-blue-600"
        />
        <KpiCard
          title="Novos (Pendentes)"
          value={metrics.pending.toString()}
          icon={Clock}
          colorClass="bg-orange-50 text-orange-600"
        />
        <KpiCard
          title="Em Atendimento"
          value={metrics.inProgress.toString()}
          icon={Headset}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          title="Recuperados"
          value={metrics.recovered.toString()}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Últimos Leads</h2>
          <p className="text-sm text-gray-500 mt-1">Os 10 leads mais recentes recebidos no sistema.</p>
        </div>
        <RecentLeadsTable leads={recentLeads} />
      </div>
    </div>
  )
}
