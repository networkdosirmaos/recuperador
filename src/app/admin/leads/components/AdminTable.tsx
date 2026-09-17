import React, { useState, useEffect } from 'react'
import { QrCode, CreditCard, FileText, Globe } from 'lucide-react'
import type { LeadRow } from '@/types/database.types'

interface AdminTableProps {
  leads: LeadRow[];
  selectedLeads: string[];
  showColumns: Record<string, boolean>;
  collaborators: any[];
  searching: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectLead: (id: string) => void;
  onSelectLead: (lead: LeadRow) => void;
}

export function AdminTable({
  leads,
  selectedLeads,
  showColumns,
  collaborators,
  searching,
  onToggleSelectAll,
  onToggleSelectLead,
  onSelectLead
}: AdminTableProps) {
  
  const [nowTick, setNowTick] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const getPaymentIcon = (method?: string | null) => {
    switch (method?.toLowerCase()) {
      case 'pix': return <QrCode className="w-4 h-4" />
      case 'credit_card': return <CreditCard className="w-4 h-4" />
      case 'boleto': return <FileText className="w-4 h-4" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo': return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">Novo</span>
      case 'em_atendimento': return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Em Atend.</span>
      case 'venda_organica':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Venda Orgânica</span>
      case 'recuperado': return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">Recuperado</span>
      case 'perdido': return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">Perdido</span>
      default: return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
      {searching && leads.length === 0 ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="w-full min-w-max">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={leads.length > 0 && selectedLeads.length === leads.length}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Produto</th>
                {showColumns.origin && <th className="p-4 whitespace-nowrap">Origem</th>}
                {showColumns.payment && <th className="p-4 whitespace-nowrap">Pagamento</th>}
                {showColumns.gateway_status && <th className="p-4 whitespace-nowrap">Status Gateway</th>}
                {showColumns.gateway_event && <th className="p-4 whitespace-nowrap">Evento</th>}
                {showColumns.reason && <th className="p-4 whitespace-nowrap">Motivo</th>}
                {showColumns.gateway_updated_at && <th className="p-4 whitespace-nowrap">Data Gateway</th>}
                {showColumns.crm_status && <th className="p-4 whitespace-nowrap">Status CRM</th>}
                {showColumns.seller && <th className="p-4 whitespace-nowrap">Vendedor Atual</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead: LeadRow) => (
                <tr key={lead.id} className={`transition-colors ${selectedLeads.includes(lead.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => onToggleSelectLead(lead.id)}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => onSelectLead(lead)}
                      className="text-left group focus:outline-none"
                    >
                      <div className="font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors underline decoration-indigo-200 underline-offset-2">{lead.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{lead.email || lead.phone || 'Sem contato'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(lead.created_at).toLocaleString('pt-BR')}</div>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={lead.product_name || 'N/A'}>{lead.product_name || 'N/A'}</div>
                  </td>
                  {showColumns.origin && (
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                      {lead.lead_lists?.type === 'webhook_cakto' ? '⚡ ' : '📁 '} 
                      {lead.lead_lists?.name || 'Sem lista'}
                    </td>
                  )}
                  {showColumns.payment && (
                    <td className="p-4 whitespace-nowrap">
                      {lead.payment_method && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold uppercase">
                          {getPaymentIcon(lead.payment_method)} {lead.payment_method === 'credit_card' ? 'Cartão' : lead.payment_method}
                        </div>
                      )}
                    </td>
                  )}
                  {showColumns.gateway_status && (
                    <td className="p-4 text-xs font-mono text-gray-600 whitespace-nowrap">
                      {lead.gateway_status || '-'}
                    </td>
                  )}
                  {showColumns.gateway_event && (
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                      {lead.gateway_event || '-'}
                    </td>
                  )}
                  {showColumns.reason && (
                    <td className="p-4 text-xs text-red-600 whitespace-nowrap">
                      {lead.reason ? <span title={lead.reason}>{lead.reason.substring(0, 30)}...</span> : '-'}
                    </td>
                  )}
                  {showColumns.gateway_updated_at && (
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {lead.gateway_updated_at ? new Date(lead.gateway_updated_at).toLocaleString('pt-BR') : '-'}
                    </td>
                  )}
                  {showColumns.crm_status && (
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(lead.status)}
                        {(lead.gateway_event === 'pix_generated' || lead.gateway_event === 'pix_gerado' || lead.gateway_event === 'waiting_payment') && lead.status === 'novo' && (nowTick - new Date(lead.updated_at || lead.created_at).getTime() < 6 * 60 * 1000) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 animate-pulse border border-blue-200">
                            ⏳ Geladeira
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {showColumns.seller && (
                    <td className="p-4 whitespace-nowrap">
                      {lead.current_assignee_id ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-sm font-medium text-gray-900">
                            {collaborators.find((c: any) => c.id === lead.current_assignee_id)?.full_name || 'Vendedor'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Sem dono</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-gray-500">
                    Nenhum lead encontrado com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}