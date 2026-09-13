import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  colorClass: string
}

export function KpiCard({ title, value, icon: Icon, colorClass }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center">
      <div className={`p-4 rounded-full mr-5 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  )
}
