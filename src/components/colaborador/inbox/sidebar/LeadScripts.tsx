import { Activity, MessageCircle, Copy, AlertCircle } from 'lucide-react'
import { translateEvent } from './LeadTimeline'
import toast from 'react-hot-toast'

interface LeadScriptsProps {
  isVendaAtiva: boolean;
  leadGatewayEvent: string | null | undefined;
  leadRefundedAt: string | null | undefined;
  recommendedScripts: any[];
  activeScriptIndex: number;
  setActiveScriptIndex: (index: number) => void;
  leadName: string;
  leadPhone: string | null | undefined;
  productName: string | null | undefined;
  affiliateLink?: string;
  salesLink?: string;
  collaboratorName?: string;
}

export function LeadScripts({ 
  isVendaAtiva, 
  leadGatewayEvent, 
  leadRefundedAt, 
  recommendedScripts, 
  activeScriptIndex, 
  setActiveScriptIndex,
  leadName,
  leadPhone,
  productName,
  affiliateLink,
  salesLink,
  collaboratorName
}: LeadScriptsProps) {

  const parseScriptVariables = (content: string) => {
    let parsed = content
    parsed = parsed.replace(/{NOME}/g, leadName?.split(' ')[0] || 'Cliente')
    parsed = parsed.replace(/{PRODUTO}/g, productName || 'nosso produto')
    parsed = parsed.replace(/{LINK_CHECKOUT}/g, affiliateLink || '')
    parsed = parsed.replace(/{LINK_VENDAS}/g, salesLink || '')
    parsed = parsed.replace(/{COLABORADOR}/g, collaboratorName?.split(' ')[0] || 'Atendente')
    return parsed
  }

  const handleCopyScript = (content: string) => {
    const text = parseScriptVariables(content)
    navigator.clipboard.writeText(text)
    toast.success('Script copiado!')
  }

  const handleSendScript = (content: string) => {
    if (!leadPhone) {
      toast.error('Lead não possui telefone cadastrado')
      return
    }
    const text = parseScriptVariables(content)
    
    let phoneStr = leadPhone.replace(/\D/g, '')
    if (phoneStr.length === 11 || phoneStr.length === 10) {
      phoneStr = '55' + phoneStr
    }
    
    const wppUrl = `https://wa.me/${phoneStr}?text=${encodeURIComponent(text)}`
    window.open(wppUrl, '_blank')
  }

  const getEventBannerStyles = (event?: string | null) => {
    const type = event || ''
    if (type === 'pix_generated' || type === 'waiting_payment') {
      return 'bg-blue-50 border-blue-200 text-blue-700'
    } else if (type === 'purchase_refused') {
      return 'bg-red-50 border-red-200 text-red-700'
    } else if (type === 'checkout_abandoned') {
      return 'bg-orange-50 border-orange-200 text-orange-700'
    } else if (type === 'purchase_approved') {
      return 'bg-green-50 border-green-200 text-green-700'
    }
    return 'bg-gray-50 border-gray-200 text-gray-700'
  }

  return (
    <div>
      {isVendaAtiva ? (
        <div className="mb-3 px-4 py-3 rounded-xl border flex items-center gap-3 shadow-sm bg-indigo-50 border-indigo-200 text-indigo-700">
          <Activity className="w-5 h-5 shrink-0" />
          <span className="text-[13px] font-bold uppercase tracking-wide">
            🎯 FOCO: ABORDAGEM DE VENDAS
          </span>
        </div>
      ) : (
        <div className={`mb-3 px-4 py-3 rounded-xl border shadow-sm ${getEventBannerStyles(leadGatewayEvent)}`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-[13px] font-bold uppercase tracking-wide">
              Motivo: {translateEvent(leadGatewayEvent)}
            </span>
          </div>
          
          {/* Informações detalhadas de reembolso se existirem */}
          {leadRefundedAt && (
            <div className="pl-8 mt-2 space-y-1">
              <p className="text-[11px] opacity-75">
                Data do Reembolso: {new Date(leadRefundedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      )}

      {recommendedScripts.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 shadow-sm relative">
          
          {/* FASE 4: MÚLTIPLAS ABORDAGENS (Abas) */}
          {recommendedScripts.length > 1 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {recommendedScripts.map((script: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveScriptIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    activeScriptIndex === idx 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {script.title || `Opção ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-wider">
                {isVendaAtiva ? 'Script de Vendas Sugerido' : 'Script Sugerido'}
              </h3>
              {recommendedScripts[activeScriptIndex]?.sub_condition && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full border border-green-200" title={`A IA recomendou este script porque o motivo do reembolso contém a palavra "${recommendedScripts[activeScriptIndex].sub_condition}"`}>
                  🎯 Match de Motivo
                </span>
              )}
            </div>
            <button onClick={() => handleCopyScript(recommendedScripts[activeScriptIndex].content)} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded transition-colors">
              <Copy className="w-3 h-3" /> Copiar
            </button>
          </div>
          <p className="text-[14px] text-indigo-900 whitespace-pre-wrap leading-relaxed mb-4">
            {parseScriptVariables(recommendedScripts[activeScriptIndex].content)}
          </p>
          <button 
            onClick={() => handleSendScript(recommendedScripts[activeScriptIndex].content)}
            className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl transition-all shadow-sm shadow-green-500/20 text-[14px]"
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp com texto
          </button>
        </div>
      )}
    </div>
  )
}
