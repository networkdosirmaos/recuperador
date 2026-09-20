import { Activity, MessageCircle, Calendar, QrCode, CreditCard, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LeadTimelineProps {
  timelineEvents: any[];
  isLoadingEvents: boolean;
}

export function translateEvent(event?: string | null) {
  if (!event) return 'Desconhecido'
  if (event === 'pix_generated' || event === 'pix_gerado' || event === 'waiting_payment') return 'Pix gerado'
  if (event === 'checkout_abandoned' || event === 'checkout_abandonment') return 'Checkout abandonado'
  if (event === 'purchase_refused') return 'Compra recusada'
  if (event === 'purchase_approved') return 'Compra aprovada'
  if (event === 'refunded' || event === 'purchase_refunded' || event?.includes('refund')) return 'Reembolsado'
  if (event === 'chargeback' || event?.includes('chargeback')) return 'Chargeback'
  return event.replace('_', ' ')
}

export function LeadTimeline({ timelineEvents, isLoadingEvents }: LeadTimelineProps) {
  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-400" />
        Linha do Tempo
      </h3>
      
      {isLoadingEvents ? (
        <div className="text-center py-4 text-gray-500 text-sm">Carregando histórico...</div>
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-5">
          {timelineEvents.map((log: any, idx: number) => {
            const type = log.gateway_event || log.gateway_status || ''
            let Icon = Activity
            let iconBg = 'bg-gray-100'
            let iconColor = 'text-gray-500'
            let titleColor = 'text-gray-900'
            
            let isNote = false
            
            if (type === 'HUMAN_NOTE') {
              Icon = MessageCircle
              iconBg = 'bg-indigo-100'
              iconColor = 'text-indigo-600'
              isNote = true
            } else if (type === 'STATUS_CHANGE') {
              Icon = Activity
              iconBg = 'bg-purple-100'
              iconColor = 'text-purple-600'
            } else if (type === 'SCHEDULE_CHANGE') {
              Icon = Calendar
              iconBg = 'bg-blue-100'
              iconColor = 'text-blue-600'
            } else if (type === 'pix_generated' || type === 'waiting_payment') {
              Icon = QrCode
              iconBg = 'bg-blue-100'
              iconColor = 'text-blue-600'
            } else if (type === 'purchase_refused') {
              Icon = CreditCard
              iconBg = 'bg-red-100'
              iconColor = 'text-red-600'
            } else if (type === 'checkout_abandoned') {
              Icon = ShoppingCart
              iconBg = 'bg-orange-100'
              iconColor = 'text-orange-600'
            } else if (type === 'purchase_approved') {
              Icon = CheckCircle2
              iconBg = 'bg-green-100'
              iconColor = 'text-green-600'
            }

            let titleText = translateEvent(type)
            if (type === 'HUMAN_NOTE') titleText = 'Comentário'
            if (type === 'STATUS_CHANGE') titleText = 'Status Atualizado'
            if (type === 'SCHEDULE_CHANGE') titleText = 'Agendamento'

            return (
              <div key={idx} className="relative pl-5">
                <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center border-2 border-[#f9fafb]`}>
                  <Icon className={`w-3 h-3 ${iconColor}`} />
                </div>
                <div className={`bg-white border border-gray-100 rounded-xl p-3 shadow-sm ${isNote ? 'border-indigo-100 bg-indigo-50/30' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[12px] font-bold ${titleColor} uppercase tracking-wide`}>
                      {titleText}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 first-letter:uppercase">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {log.reason && (
                    <p className={`text-[13px] leading-relaxed ${isNote ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{log.reason}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
