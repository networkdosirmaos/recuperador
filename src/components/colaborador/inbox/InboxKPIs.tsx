import React from 'react'
import { Users, Clock, CheckCircle } from 'lucide-react'

interface InboxKPIsProps {
  novos: number;
  retornos: number;
  recuperados: number;
}

export function InboxKPIs({ novos, retornos, recuperados }: InboxKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#e5e7eb] p-5 flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed]">
          <Users className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{novos}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">para atender</div>
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
          <CheckCircle className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{recuperados}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">recuperados</div>
        </div>
      </div>
    </div>
  )
}