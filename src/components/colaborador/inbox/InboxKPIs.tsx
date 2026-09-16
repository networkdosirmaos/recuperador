import React from 'react'
import { Flame, Activity, Trophy } from 'lucide-react'

interface InboxKPIsProps {
  pendentes: number;
  emAndamento: number;
  fechados: number;
  animate?: boolean;
  activeTab: 'pendentes' | 'em_andamento' | 'fechados';
  onTabChange: (tab: 'pendentes' | 'em_andamento' | 'fechados') => void;
}

export function InboxKPIs({ pendentes, emAndamento, fechados, animate, activeTab, onTabChange }: InboxKPIsProps) {
  return (
    <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-3 md:gap-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 hide-scrollbar">
      
      {/* 1. Pendentes (Fogo / Urgência) */}
      <button 
        onClick={() => onTabChange('pendentes')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-5 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md ${
          activeTab === 'pendentes' 
            ? 'ring-2 ring-[#ef4444] border-transparent md:scale-[1.02]' 
            : 'border border-[#e5e7eb] opacity-80 hover:opacity-100'
        } ${animate && activeTab === 'pendentes' ? 'ring-4 ring-[#ef4444]/40 z-10' : ''}`}
      >
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0 transition-colors ${pendentes > 0 ? (activeTab === 'pendentes' ? 'bg-[#ef4444] text-white shadow-sm' : 'bg-[#fef2f2] text-[#ef4444]') : 'bg-gray-100 text-gray-400'}`}>
          <Flame className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <h3 className={`text-xl md:text-2xl font-bold ${pendentes > 0 ? 'text-[#1a1d23]' : 'text-gray-400'}`}>{pendentes}</h3>
          <p className="text-[12px] md:text-[13px] text-[#6b7280] font-medium mt-0.5">pendentes agora</p>
        </div>
      </button>

      {/* 2. Em Andamento */}
      <button 
        onClick={() => onTabChange('em_andamento')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-5 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md ${
          activeTab === 'em_andamento' 
            ? 'ring-2 ring-[#f59e0b] border-transparent md:scale-[1.02]' 
            : 'border border-[#e5e7eb] opacity-80 hover:opacity-100'
        }`}
      >
        <div className={`w-10 h-10 md:w-[46px] md:h-[46px] rounded-full flex items-center justify-center flex-shrink-0 mr-3 md:mr-4 transition-colors ${activeTab === 'em_andamento' ? 'bg-[#f59e0b] text-white shadow-sm' : 'bg-[#fffbeb] text-[#f59e0b]'}`}>
          <Activity className="w-5 h-5 md:w-[22px] md:h-[22px]" />
        </div>
        <div>
          <div className="text-xl md:text-[26px] font-bold text-[#1a1d23] leading-none">{emAndamento}</div>
          <div className="text-[12px] md:text-[13px] text-[#6b7280] font-medium mt-1">em andamento</div>
        </div>
      </button>

      {/* 3. Fechados */}
      <button 
        onClick={() => onTabChange('fechados')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-5 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md ${
          activeTab === 'fechados' 
            ? 'ring-2 ring-[#10b981] border-transparent md:scale-[1.02]' 
            : 'border border-[#e5e7eb] opacity-80 hover:opacity-100'
        }`}
      >
        <div className={`w-10 h-10 md:w-[46px] md:h-[46px] rounded-full flex items-center justify-center flex-shrink-0 mr-3 md:mr-4 transition-colors ${activeTab === 'fechados' ? 'bg-[#10b981] text-white shadow-sm' : 'bg-[#ecfdf5] text-[#10b981]'}`}>
          <Trophy className="w-5 h-5 md:w-[22px] md:h-[22px]" />
        </div>
        <div>
          <div className="text-xl md:text-[26px] font-bold text-[#1a1d23] leading-none">{fechados}</div>
          <div className="text-[12px] md:text-[13px] text-[#6b7280] font-medium mt-1">fechados hoje</div>
        </div>
      </button>
    </div>
  )
}