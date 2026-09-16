"use client"

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  Settings, 
  LogOut,
  Target,
  Webhook,
  Folder,
  Menu,
  X,
  BookOpen
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

        if (data.role !== 'admin') {
          router.push('/colaborador/dashboard')
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

  useEffect(() => {
    // Fecha o menu mobile quando mudar de rota
    setIsMobileMenuOpen(false)
  }, [pathname])

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

  const menuGroups = [
    {
      title: 'Visão Geral',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Operação',
      items: [
        { name: 'Equipe', href: '/admin/equipe', icon: Users },
        { name: 'Leads (Raio-X)', href: '/admin/leads', icon: Target },
        { name: 'Playbook', href: '/admin/playbook', icon: BookOpen },
      ]
    },
    {
      title: 'Entrada de Leads',
      items: [
        { name: 'Integrações (Webhook)', href: '/admin/integracoes', icon: Webhook },
        { name: 'Importação (CSV)', href: '/admin/bases', icon: Folder },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
      ]
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 flex-col md:flex-row">
      
      {/* Mobile Header (Apenas celular) */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden flex-shrink-0 z-30 shadow-sm">
        <div className="flex items-center">
          <Target className="w-6 h-6 text-[#7c3aed] mr-2" />
          <span className="text-xl font-bold text-slate-800">Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay Escuro para Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Drawer no mobile, fixo no Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-sm transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-[#7c3aed] mr-2" />
            <span className="text-xl font-bold text-slate-800">Admin</span>
          </div>
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={`flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-[#f5f3ff] text-[#7c3aed]' 
                          : 'text-[#6b7280] hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#7c3aed]' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full relative z-0 bg-gray-50">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
