export type HeatSettings = {
  super_hot_days: number
  hot_days: number
  warm_days: number
}

export type HeatLevel = 'super_quente' | 'quente' | 'morno' | 'frio'

export function getDynamicHeat(
  updatedAtString: string,
  settings: HeatSettings | null
): HeatLevel {
  if (!settings || !updatedAtString) return 'frio'
  
  const updatedDate = new Date(updatedAtString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= settings.super_hot_days) return 'super_quente'
  if (diffDays <= settings.hot_days) return 'quente'
  if (diffDays <= settings.warm_days) return 'morno'
  
  return 'frio'
}

export const getHeatBadgeStyle = (heat: HeatLevel) => {
  switch (heat) {
    case 'super_quente':
      return { label: '🔥 Super Quente', color: 'bg-red-100 text-red-800 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.4)]' }
    case 'quente':
      return { label: '🔥 Quente', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    case 'morno':
      return { label: '☀️ Morno', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    case 'frio':
      return { label: '❄️ Frio', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  }
}
