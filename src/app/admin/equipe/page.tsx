"use client"

import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import { toggleCollaboratorStatusSecure, returnCollaboratorLeadsSecure, toggleEmailVisibilitySecure, updateAffiliateLinkSecure } from '@/app/actions/admin.actions'
import { TeamList, TeamMemberStat } from '@/components/admin/TeamList'

export default function EquipeDashboard() {
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamMemberStat[]>([])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const teamStats = await adminService.getTeamStats()
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
      await toggleCollaboratorStatusSecure(id, currentStatus)
    } catch (error) {
      console.error('Erro ao alternar status:', error)
      alert('Não foi possível alterar o status.')
      fetchTeam() // revert
    }
  }

  const handleReturnLeads = async (id: string) => {
    try {
      await returnCollaboratorLeadsSecure(id)
      alert('Leads devolvidos para a fila com sucesso!')
      fetchTeam()
    } catch (error) {
      console.error('Erro ao devolver leads:', error)
      alert('Falha ao devolver leads.')
    }
  }

  const handleToggleEmail = async (id: string, currentStatus: boolean) => {
    try {
      setTeam(prev => prev.map(m => m.id === id ? { ...m, can_see_email: !currentStatus } : m))
      await toggleEmailVisibilitySecure(id, currentStatus)
    } catch (error) {
      console.error('Erro ao alternar visibilidade do e-mail:', error)
      alert('Não foi possível alterar a visibilidade do e-mail.')
      fetchTeam() // revert
    }
  }

  const [editingLinkMember, setEditingLinkMember] = useState<TeamMemberStat | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [salesLinkInput, setSalesLinkInput] = useState('')
  const [isSavingLink, setIsSavingLink] = useState(false)

  const handleEditLinkClick = (member: TeamMemberStat) => {
    setEditingLinkMember(member)
    setLinkInput(member.affiliate_link || '')
    setSalesLinkInput(member.sales_link || '')
  }

  const handleSaveLink = async () => {
    if (!editingLinkMember) return
    setIsSavingLink(true)
    try {
      await updateAffiliateLinkSecure(editingLinkMember.id, linkInput.trim() || null, salesLinkInput.trim() || null)
      setTeam(prev => prev.map(m => m.id === editingLinkMember.id ? { 
        ...m, 
        affiliate_link: linkInput.trim() || undefined,
        sales_link: salesLinkInput.trim() || undefined 
      } : m))
      setEditingLinkMember(null)
    } catch (error) {
      console.error('Erro ao salvar link:', error)
      alert('Não foi possível salvar os links.')
    } finally {
      setIsSavingLink(false)
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
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
        <p className="text-gray-500 mt-1">Acompanhe a performance individual e controle o fluxo de atendimento.</p>
      </div>

      <TeamList 
        members={team} 
        onToggleStatus={handleToggleStatus} 
        onReturnLeads={handleReturnLeads}
        onEditLink={handleEditLinkClick}
        onToggleEmail={handleToggleEmail}
      />

      {/* Modal Edição de Link */}
      {editingLinkMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">Links de Afiliado</h3>
              <button 
                onClick={() => setEditingLinkMember(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Defina os links para o vendedor <strong>{editingLinkMember.name}</strong>. Ele poderá copiar estes links diretamente da gaveta de leads.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🔗 URL do Checkout</label>
                  <input 
                    type="url"
                    placeholder="https://pay.cakto.com.br/... ?affiliate=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📄 URL da Página de Vendas</label>
                  <input 
                    type="url"
                    placeholder="https://meuproduto.com.br/... ?affiliate=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
                    value={salesLinkInput}
                    onChange={(e) => setSalesLinkInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setEditingLinkMember(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLink}
                disabled={isSavingLink}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSavingLink ? 'Salvando...' : 'Salvar Links'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
