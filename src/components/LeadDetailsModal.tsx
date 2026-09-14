import { X, CreditCard, QrCode, FileText, Info, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import { getDynamicHeat, getHeatBadgeStyle } from '@/utils/heatCalculator'

type LeadModalProps = {
  isOpen: boolean
  onClose: () => void
  lead: any // Tipagem genérica para englobar as 13 colunas
  viewType: 'admin' | 'collaborator'
}

export function LeadDetailsModal({ isOpen, onClose, lead, viewType }: LeadModalProps) {
  if (!isOpen || !lead) return null

  // Helpers visuais
  const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'pix': return <QrCode className="w-5 h-5 text-emerald-600" />
      case 'credit_card': return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'boleto': return <FileText className="w-5 h-5 text-gray-600" />
      default: return <Info className="w-5 h-5 text-gray-400" />
    }
  }

  const formatPaymentName = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'pix': return 'PIX'
      case 'credit_card': return 'Cartão de Crédito'
      case 'boleto': return 'Boleto Bancário'
      default: return method || 'Não informado'
    }
  }

  // --- VISÃO COLABORADOR (FOCO EM VENDAS) ---
  if (viewType === 'collaborator') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Ficha de Inteligência
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Cliente</p>
              <p className="text-xl font-bold text-gray-900">{lead.name}</p>
              <p className="text-gray-600">{lead.phone || 'Telefone não informado'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Produto</p>
                <p className="font-medium text-gray-900">{lead.product_name || lead.product || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pagamento</p>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  {getPaymentIcon(lead.payment_method)}
                  {formatPaymentName(lead.payment_method)}
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-indigo-600" />
                Dica de Abordagem
              </h3>
              <p className="text-sm text-indigo-800 leading-relaxed">
                {lead.payment_method === 'pix' 
                  ? 'O cliente tentou pagar via PIX, mas o pagamento não foi concluído. Ofereça ajuda para finalizar ou pergunte se o limite do banco bloqueou.'
                  : lead.payment_method === 'credit_card'
                  ? 'Compra no cartão falhou. Muitas vezes é bloqueio antifraude do banco. Sugira tentar outro cartão ou mudar para PIX.'
                  : lead.payment_method === 'boleto'
                  ? 'Boleto gerado! Chame para lembrar do vencimento e oferte uma condição especial (ou brinde) se ele pagar no PIX hoje.'
                  : 'Aborde o cliente perguntando se ele teve alguma dificuldade técnica na hora de finalizar o pedido do produto.'}
              </p>
              {lead.reason && (
                <div className="mt-3 p-2 bg-white rounded-lg border border-indigo-50 text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">Motivo técnico (Cakto):</span> {lead.reason}
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300">
              Fechar Ficha
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- VISÃO ADMIN (FOCO EM AUDITORIA) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-300" />
            Auditoria Avançada (Ficha Técnica)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Seção 1: Cliente e Produto */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">1. Dados Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                <p className="font-medium text-gray-900">{lead.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">E-mail</p>
                <p className="font-medium text-gray-900">{lead.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Telefone</p>
                <p className="font-medium text-gray-900">{lead.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Produto (Origem)</p>
                <p className="font-medium text-gray-900">{lead.product_name || lead.product || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ID Cliente (Cakto)</p>
                <p className="font-mono text-xs text-gray-600 bg-gray-100 p-1 rounded">{lead.customer_id || 'Não mapeado'}</p>
              </div>
            </div>
          </section>

          {/* Seção 2: Transação e Status */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">2. Dados de Transação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Método de Pgto</p>
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  {getPaymentIcon(lead.payment_method)}
                  {formatPaymentName(lead.payment_method)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Cakto Status Original</p>
                <p className="font-mono text-xs text-indigo-600 font-bold">{lead.cakto_status || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Cakto Evento (Webhook)</p>
                <p className="font-mono text-xs text-indigo-600 font-bold">{lead.cakto_event || 'N/A'}</p>
              </div>
              <div className="md:col-span-3 bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 font-bold mb-1">Motivo de Falha / Erro (Reason)</p>
                <p className="text-sm text-red-900">{lead.reason || 'Nenhum erro reportado pelo gateway.'}</p>
              </div>
            </div>
          </section>

          {/* Seção 3: Reembolsos e Chargebacks */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">3. Cancelamentos e Estornos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Data Reembolso</p>
                <p className="font-medium text-gray-900">{lead.refunded_at ? new Date(lead.refunded_at).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Data Chargeback</p>
                <p className="font-medium text-gray-900">{lead.chargedback_at ? new Date(lead.chargedback_at).toLocaleString() : '-'}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs text-gray-500 mb-1">Motivo do Reembolso (Refund Reason)</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">{lead.refund_reason || 'Nenhum reembolso solicitado.'}</p>
              </div>
            </div>
          </section>

          {/* Seção 4: Timestamps */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">4. Log de Sistema (CRM)</h3>
            <div className="flex gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-gray-500">Entrada CRM:</span>
                <span className="font-medium text-gray-900">{new Date(lead.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-gray-500">Última Atualização Cakto:</span>
                <span className="font-medium text-gray-900">{lead.cakto_updated_at ? new Date(lead.cakto_updated_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </section>

        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black">
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  )
}
