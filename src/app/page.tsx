"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Carregando o CRM...</p>
    </div>
  )
}
