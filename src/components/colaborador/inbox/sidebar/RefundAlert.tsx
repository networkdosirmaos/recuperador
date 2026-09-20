import { AlertCircle } from 'lucide-react'

interface RefundAlertProps {
  refundReason?: string | null;
}

export function RefundAlert({ refundReason }: RefundAlertProps) {
  if (!refundReason) return null;
  
  return (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
      <div>
        <p className="font-bold text-[13px] tracking-wide uppercase text-red-900 mb-0.5">Alerta de Reembolso</p>
        <p className="text-[13px] text-red-700 leading-relaxed font-medium">Motivo: {refundReason}</p>
      </div>
    </div>
  )
}
