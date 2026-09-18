import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

export function useLeadGamification(novosCount: number, recuperadosCount: number) {
  const previousNovosCount = useRef<number | null>(null)
  const previousRecuperadosCount = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Inicialização
    if (previousNovosCount.current === null) previousNovosCount.current = novosCount
    if (previousRecuperadosCount.current === null) previousRecuperadosCount.current = recuperadosCount

    // 1. Lógica de Novo Lead na Fila
    if (previousNovosCount.current !== null && novosCount > previousNovosCount.current) {
      toast.success("🔥 Novo Lead na Mesa! Quebre tudo!", {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#1a1d23',
          color: '#fff',
          fontWeight: 'bold',
          border: '1px solid #7c3aed'
        },
        iconTheme: {
          primary: '#7c3aed',
          secondary: '#fff',
        },
      })

      try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.7
        audio.play().catch(() => {})
      } catch (error) {}

      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 3000)
    }

    // 2. Lógica de Venda Recuperada (CONFETES)
    if (previousRecuperadosCount.current !== null && recuperadosCount > previousRecuperadosCount.current) {
      const duration = 2000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#7c3aed', '#10b981', '#fbbf24']
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#7c3aed', '#10b981', '#fbbf24']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()

      toast.success("🤑 VENDA RECUPERADA! Você é gigante!", {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          border: '2px solid #059669'
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10b981',
        },
      })
      
      try {
        const audio = new Audio('/sounds/notification.mp3') // Pode colocar um som de "dinheiro" (cash_register.mp3) futuramente
        audio.volume = 1.0
        audio.play().catch(() => {})
      } catch (error) {}
    }

    // Atualiza a memória
    previousNovosCount.current = novosCount
    previousRecuperadosCount.current = recuperadosCount

  }, [novosCount, recuperadosCount])

  return { isAnimating }
} 
