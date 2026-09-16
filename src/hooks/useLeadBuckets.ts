import { useState, useEffect, useMemo } from 'react'

export function useLeadBuckets(myLeads: any[], selectedTab: 'pendentes' | 'em_andamento' | 'finalizados') {
  // Relógio Fantasma (atualiza a cada 30 segundos)
  const [nowTick, setNowTick] = useState(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Derived Data
  const result = useMemo(() => {
    let pendentes_count = 0
    let em_andamento_count = 0
    let finalizados_count = 0
    let coolingDown_count = 0
    
    const isApproved = (l: any) => l.status === 'recuperado'
    const isLost = (l: any) => l.status === 'perdido'
    const isOrganic = (l: any) => l.status === 'venda_organica' || l.gateway_event === 'purchase_approved' || l.gateway_status === 'approved'
    
    const isCoolingDown = (l: any) => {
      const isPixEvent = l.gateway_event === 'pix_generated' || l.gateway_event === 'pix_gerado' || l.gateway_event === 'waiting_payment';
      return isPixEvent && l.status === 'novo' && (nowTick - new Date(l.updated_at || l.created_at).getTime() < 6 * 60 * 1000);
    }
    const isPastDue = (l: any) => l.next_action_at && new Date(l.next_action_at).getTime() <= nowTick

    const getBucket = (l: any) => {
      if (isOrganic(l)) return 'ignorar'
      if (isApproved(l) || isLost(l)) return 'finalizados'
      if (isCoolingDown(l)) return 'geladeira'
      if (l.status === 'novo' || isPastDue(l)) return 'pendentes'
      return 'em_andamento'
    }

    myLeads.forEach((l: any) => {
      const bucket = getBucket(l)
      if (bucket === 'finalizados') finalizados_count++
      else if (bucket === 'geladeira') coolingDown_count++
      else if (bucket === 'pendentes') pendentes_count++
      else if (bucket === 'em_andamento') em_andamento_count++
    })

    const filtered = myLeads.filter((l: any) => {
      const bucket = getBucket(l)
      if (bucket === 'geladeira' || bucket === 'ignorar') return false
      return bucket === selectedTab
    })

    // Grouping by time
    const grouped = { agora: [] as any[], hoje: [] as any[], antigos: [] as any[] }
    
    filtered.forEach((l: any) => {
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
      filteredLeads: filtered, 
      groupedLeads: grouped,
      counts: { 
        pendentes: pendentes_count, 
        em_andamento: em_andamento_count, 
        finalizados: finalizados_count, 
        coolingDown: coolingDown_count,
        todos_ativos: pendentes_count + em_andamento_count 
      } 
    }
  }, [myLeads, selectedTab, nowTick])

  return { ...result, nowTick }
}
