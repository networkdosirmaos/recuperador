import React from 'react'
import { Flame, Activity, Trophy } from 'lucide-react'

interface InboxKPIsProps {
  pendentes: number;
  emAndamento: number;
  fechados: number;
  animate?: boolean;
}

export function InboxKPIs({ pendentes, emAndamento, fechados, animate }: InboxKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Pendentes (Fogo / Urgência) */}
      <div className={`bg-white rounded-xl p-5 flex items-center border shadow-sm transition-transform duration-300 ${animate ? 'scale-105 border-[#ef4444] ring-4 ring-[#ef4444]/20 z-10' : 'border-[#e5e7eb]'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${pendentes > 0 ? (animate ? 'bg-[#ef4444] text-white' : 'bg-[#fef2f2] text-[#ef4444]') : 'bg-gray-100 text-gray-400'}`}>
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`text-2xl font-bold ${pendentes > 0 ? 'text-[#1a1d23]' : 'text-gray-400'}`}>{pendentes}</h3>
          <p className="text-[13px] text-[#6b7280] font-medium mt-0.5">pendentes agora</p>
        </div>
      </div>

      {/* 2. Em Andamento */}
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#e5e7eb] p-5 flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-full bg-[#fffbeb] flex items-center justify-center text-[#f59e0b]">
          <Activity className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{emAndamento}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">em andamento</div>
        </div>
      </div>

      {/* 3. Fechados */}
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#e5e7eb] p-5 flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-full bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
          <Trophy className="w-[22px] h-[22px]" />
        </div>
        <div>
          <div className="text-[26px] font-bold text-[#1a1d23] leading-none">{fechados}</div>
          <div className="text-[14px] text-[#6b7280] mt-1 font-medium">fechados hoje</div>
        </div>
      </div>

    </div>
  )
}