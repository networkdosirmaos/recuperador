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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
      
      {/* 1. Pendentes (Fogo / Urgência) */}
      <button 
        onClick={() => onTabChange('pendentes')}
        className={`col-span-1 text-left bg-white rounded-xl p-3 md:p-6 flex flex-col md:flex-row items-start md:items-center transition-all duration-300 cursor-pointer outline-none focus:outline-none border border-gray-200 ${
          activeTab === 'pendentes' 
            ? 'shadow-md opacity-100 ring-2 ring-indigo-500/20' 
            : 'shadow-sm opacity-60 hover:opacity-100'
        } ${animate && activeTab === 'pendentes' ? 'ring-4 ring-red-500/10 z-10' : ''}`}
      >
        <div className={`mb-2 md:mb-0 md:mr-4 flex-shrink-0 transition-colors ${pendentes > 0 ? 'text-red-500' : 'text-gray-300'}`}>
          <Flame className="w-6 h-6 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className={`text-2xl md:text-4xl font-extrabold leading-none ${pendentes > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{pendentes}</h3>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1 leading-tight">Pendentes</p>
        </div>
      </button>

      {/* 2. Em Andamento */}
      <button 
        onClick={() => onTabChange('em_andamento')}
        className={`col-span-1 text-left bg-white rounded-xl p-3 md:p-6 flex flex-col md:flex-row items-start md:items-center transition-all duration-300 cursor-pointer outline-none focus:outline-none border border-gray-200 ${
          activeTab === 'em_andamento' 
            ? 'shadow-md opacity-100 ring-2 ring-indigo-500/20' 
            : 'shadow-sm opacity-60 hover:opacity-100'
        }`}
      >
        <div className="mb-2 md:mb-0 md:mr-4 flex-shrink-0 text-yellow-500 transition-colors">
          <Activity className="w-6 h-6 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className="text-2xl md:text-4xl font-extrabold leading-none text-gray-900">{emAndamento}</h3>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1 leading-tight">Em andamento</p>
        </div>
      </button>

      {/* 3. Finalizados */}
      <button 
        onClick={() => onTabChange('finalizados')}
        className={`col-span-2 md:col-span-1 text-left bg-white rounded-xl p-3 md:p-6 flex flex-row items-center transition-all duration-300 cursor-pointer outline-none focus:outline-none border border-gray-200 ${
          activeTab === 'finalizados' 
            ? 'shadow-md opacity-100 ring-2 ring-indigo-500/20' 
            : 'shadow-sm opacity-60 hover:opacity-100'
        }`}
      >
        <div className="mr-3 md:mr-4 flex-shrink-0 text-green-500 transition-colors">
          <CheckCircle2 className="w-6 h-6 md:w-10 md:h-10" />
        </div>
        <div>
          <h3 className="text-2xl md:text-4xl font-extrabold leading-none text-gray-900">{finalizados}</h3>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1 leading-tight">Finalizados</p>
        </div>
      </button>
    </div>
  )
}