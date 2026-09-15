"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ColaboradorLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role === 'admin') {
        router.push('/admin/dashboard') // Se admin cair na tela de colaborador, manda pro admin. 
        // OBS: Se quiser que admin tbm veja a tela de colab, mudar a lógica para aceitar ambos. Mas o melhor é direcionar.
      } else if (data?.role !== 'collaborator') {
        router.push('/login')
      } else {
        setIsAuthorized(true)
      }
    }
    checkRole()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Target className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-xl font-bold text-slate-800">Recuperador <span className="font-normal text-gray-400">| Equipe</span></span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
