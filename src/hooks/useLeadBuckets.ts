import { MyLead } from '@/components/colaborador/MyLeadsTable'
import { useMemo } from 'react'

export function useLeadBuckets(filteredLeads: MyLead[]) {
  // Derived Data
  const result = useMemo(() => {
    // Grouping by time
    const grouped = { agora: [] as MyLead[], hoje: [] as MyLead[], antigos: [] as MyLead[] }
    const nowTick = Date.now()
    
    filteredLeads.forEach((l: MyLead) => {
      const dateToCompare = l.next_action_at ? new Date(l.next_action_at) : new Date(l.created_at || l.updated_at)
      const diffMs = nowTick - dateToCompare.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      if (diffHours < 2 && diffHours >= -1) {
        grouped.agora.push(l)
      } else if (diffHours < 24 && diffHours >= -24) {
        grouped.hoje.push(l)
      } else {
        grouped.antigos.push(l)
      }
    })

    return { 
      groupedLeads: grouped
    }
  }, [filteredLeads])

  return result
}
