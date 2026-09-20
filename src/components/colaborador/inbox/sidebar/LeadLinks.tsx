import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface LeadLinksProps {
  affiliateLink?: string;
  salesLink?: string;
}

export function LeadLinks({ affiliateLink, salesLink }: LeadLinksProps) {
  if (!affiliateLink && !salesLink) return null;

  return (
    <div className="pt-3 flex gap-2">
      {affiliateLink && (
        <button 
          onClick={() => {
            navigator.clipboard.writeText(affiliateLink)
            toast.success('Link de Checkout copiado!')
          }} 
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[12px]"
        >
          <Copy className="w-3.5 h-3.5" /> Checkout
        </button>
      )}
      {salesLink && (
        <button 
          onClick={() => {
            navigator.clipboard.writeText(salesLink)
            toast.success('Página de Vendas copiada!')
          }} 
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors text-[12px]"
        >
          <Copy className="w-3.5 h-3.5" /> Pág. Vendas
        </button>
      )}
    </div>
  )
}
