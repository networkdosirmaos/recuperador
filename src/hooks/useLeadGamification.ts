import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

export function useLeadGamification(novosCount: number) {
  const previousNovosCount = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Evita tocar o som no carregamento inicial da página
    if (previousNovosCount.current === null) {
      previousNovosCount.current = novosCount
      return
    }

    // Se o número de leads 'novos' aumentar
    if (novosCount > previousNovosCount.current) {
      // 1. Explosão Visual de Confetes
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

      // 2. Alerta de Urgência (Toast)
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

      // 3. Efeito Sonoro
      try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.7
        audio.play().catch((err) => {
          console.warn("Autoplay bloqueado pelo navegador. O usuário precisa interagir com a tela antes.", err)
        })
      } catch (error) {
        console.error("Erro ao tocar áudio de notificação:", error)
      }

      // 4. Sinalizador para animar o Card
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 3000) // Duração do "Pulse" do KPI
    }

    // Atualiza a memória
    previousNovosCount.current = novosCount

  }, [novosCount])

  return { isAnimating }
} 
