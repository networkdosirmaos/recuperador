"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamList, TeamMemberStat } from '@/components/admin/TeamList'

export default function EquipeDashboard() {
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamMemberStat[]>([])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      
      // 1. Buscar perfis (apenas colaboradores)
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'collaborator')
        
      if (profError) throw profError
      if (!profiles) return

      // 2. Buscar contagens de leads por colaborador para calcular "Em Atendimento" e "Recuperados"
      // Para MVP, faremos um fetch aglomerado ou faremos um count local se no for muito grande.
      // Como o Admin v todos os leads, podemos buscar os agregados, ou fazer as subqueries
      
      const teamStats: TeamMemberStat[] = []
      
      for (const p of profiles) {
        // Quantos estão pendentes na mesa dele (status novo ou em_atendimento)
        const { count: pendentes } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('current_assignee_id', p.id)
          .in('status', ['novo', 'em_atendimento'])

        // Quantos recuperados (hoje, idealmente, mas pegamos o count de recuperado como placeholder)
        const { count: recovered } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('current_assignee_id', p.id)
          .eq('status', 'recuperado')
          
        teamStats.push({
          id: p.id,
          name: p.full_name || 'Vendedor',
          email: p.email || 'E-mail não sincronizado',
          is_active: p.is_active === null ? true : p.is_active,
          in_progress: pendentes || 0,
          recovered: recovered || 0
        })
      }
      
      setTeam(teamStats)

    } catch (error) {
      console.error('Erro ao buscar equipe:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setTeam(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m))
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        
      if (error) throw error
    } catch (error) {
      console.error('Erro ao alternar status:', error)
      alert('No foi possvel alterar o status.')
      fetchTeam() // revert
    }
  }

  const handleReturnLeads = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          current_assignee_id: null, 
          status: 'novo', 
          updated_at: new Date().toISOString() 
        })
        .eq('current_assignee_id', id)
        .not('status', 'in', '("recuperado","perdido")')

      if (error) throw error
      
      alert('Leads devolvidos para a fila com sucesso!')
      fetchTeam()
    } catch (error) {
      console.error('Erro ao devolver leads:', error)
      alert('Falha ao devolver leads.')
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gesto de Equipe</h1>
        <p className="text-gray-500 mt-1">Acompanhe a performance individual e controle o fluxo de atendimento.</p>
      </div>

      <TeamList 
        members={team} 
        onToggleStatus={handleToggleStatus} 
        onReturnLeads={handleReturnLeads} 
      />
    </div>
  )
}
