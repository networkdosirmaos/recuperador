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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{novos}</div>
          <div className="text-sm text-gray-500">para atender</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{retornos}</div>
          <div className="text-sm text-gray-500">retornos hoje</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{recuperados}</div>
          <div className="text-sm text-gray-500">recuperados</div>
        </div>
      </div>
    </div>
  )
}