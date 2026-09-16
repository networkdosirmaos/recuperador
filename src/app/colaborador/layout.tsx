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
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }
        
        const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        
        if (error || !data) {
          router.push('/login')
          return
        }

        if (data.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (data.role !== 'collaborator') {
          router.push('/login')
        } else {
          setIsAuthorized(true)
        }
      } catch (err) {
        console.error('Erro na verificação de papel:', err)
        router.push('/login')
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2 md:gap-3 truncate">
                <span className="truncate">Recuperador do Papai</span>
                <span className="text-gray-300 font-light hidden sm:inline">|</span>
                <span className="font-normal text-gray-500 hidden sm:inline truncate">Central de Leads</span>
              </span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
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
