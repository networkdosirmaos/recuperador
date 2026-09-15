import React from 'react'
import { Users, Clock, CheckCircle2 } from 'lucide-react'

interface InboxKPIsProps {
  novos: number;
  retornos: number;
  recuperados: number;
  animate?: boolean;
}

export function InboxKPIs({ novos, retornos, recuperados, animate }: InboxKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className={`bg-white rounded-xl p-5 flex items-center border border-[#e5e7eb] shadow-sm transition-transform duration-300 ${animate ? 'scale-105 border-[#7c3aed] ring-4 ring-[#7c3aed]/20 z-10' : ''}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${animate ? 'bg-[#7c3aed] text-white' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#1a1d23]">{novos}</h3>
          <p className="text-[13px] text-[#6b7280] font-medium mt-0.5">para atender</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#e5e7eb] p-5 flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
          <Clock className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{retornos}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">retornos hoje</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#e5e7eb] p-5 flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
          <CheckCircle2 className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{recuperados}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">recuperados</div>
        </div>
      </div>
    </div>
  )
}