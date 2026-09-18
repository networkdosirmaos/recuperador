import React from 'react'
import { Flame, Activity, CheckCircle2 } from 'lucide-react'

interface InboxKPIsProps {
  pendentes: number;
  emAndamento: number;
  finalizados: number;
  animate?: boolean;
  activeTab: 'pendentes' | 'em_andamento' | 'finalizados';
  onTabChange: (tab: 'pendentes' | 'em_andamento' | 'finalizados') => void;
}

export function InboxKPIs({ pendentes, emAndamento, finalizados, animate, activeTab, onTabChange }: InboxKPIsProps) {
  return (
    <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-3 md:gap-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 hide-scrollbar">
      
      {/* 1. Pendentes (Fogo / Urgência) */}
      <button 
        onClick={() => onTabChange('pendentes')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-6 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md border ${
          activeTab === 'pendentes' 
            ? 'border-red-500 shadow-md ring-1 ring-red-500' 
            : 'border-transparent opacity-80 hover:opacity-100'
        } ${animate && activeTab === 'pendentes' ? 'ring-4 ring-red-500/20 z-10' : ''}`}
      >
        <div className={`mr-4 flex-shrink-0 transition-colors ${pendentes > 0 ? 'text-red-500' : 'text-gray-300'}`}>
          <Flame className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className={`text-3xl md:text-4xl font-extrabold leading-none ${pendentes > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{pendentes}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Pendentes agora</p>
        </div>
      </button>

      {/* 2. Em Andamento */}
      <button 
        onClick={() => onTabChange('em_andamento')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-6 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md border ${
          activeTab === 'em_andamento' 
            ? 'border-yellow-500 shadow-md ring-1 ring-yellow-500' 
            : 'border-transparent opacity-80 hover:opacity-100'
        }`}
      >
        <div className="mr-4 flex-shrink-0 text-yellow-500 transition-colors">
          <Activity className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className="text-3xl md:text-4xl font-extrabold leading-none text-gray-900">{emAndamento}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Em andamento</p>
        </div>
      </button>

      {/* 3. Finalizados */}
      <button 
        onClick={() => onTabChange('finalizados')}
        className={`w-[75vw] min-w-[220px] max-w-[280px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink text-left bg-white rounded-xl p-4 md:p-6 flex items-center shadow-sm transition-all duration-300 cursor-pointer outline-none focus:outline-none hover:shadow-md border ${
          activeTab === 'finalizados' 
            ? 'border-green-500 shadow-md ring-1 ring-green-500' 
            : 'border-transparent opacity-80 hover:opacity-100'
        }`}
      >
        <div className="mr-4 flex-shrink-0 text-green-500 transition-colors">
          <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className="text-3xl md:text-4xl font-extrabold leading-none text-gray-900">{finalizados}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Finalizados</p>
        </div>
      </button>
    </div>
  )
}