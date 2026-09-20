"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Target, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProfileModal } from '@/components/collaborator/ProfileModal'
import { PushNotificationToggle } from '@/components/PushNotificationToggle'

export default function ColaboradorLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [profileData, setProfileData] = useState({
    full_name: '',
    affiliate_link: '',
    sales_link: ''
  })

  useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }
        
        setUserId(user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('role, full_name, affiliate_link, sales_link')
          .eq('id', user.id)
          .single()
        
        if (error || !data) {
          router.push('/login')
          return
        }

        if (data.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (data.role !== 'collaborator') {
          router.push('/login')
        } else {
          setProfileData({
            full_name: data.full_name || '',
            affiliate_link: data.affiliate_link || '',
            sales_link: data.sales_link || ''
          })
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

  const handleSaveProfile = (newName: string, newAffiliate: string, newSales: string) => {
    setProfileData({
      full_name: newName,
      affiliate_link: newAffiliate,
      sales_link: newSales
    })
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
                <span className="truncate hidden sm:inline">Recuperador do Papai</span>
                <span className="text-gray-300 font-light hidden sm:inline">|</span>
                <span className="font-normal text-gray-800 sm:text-gray-500 truncate">Central de Leads</span>
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <PushNotificationToggle />
              <div className="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Meu Perfil</span>
              </button>
              <div className="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        currentName={profileData.full_name}
        currentAffiliateLink={profileData.affiliate_link}
        currentSalesLink={profileData.sales_link}
        onSave={handleSaveProfile}
      />
    </div>
  )
}
