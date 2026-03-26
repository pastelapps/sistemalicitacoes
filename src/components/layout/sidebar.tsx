'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  Users,
  FileText,
  ScanLine,
  Award,
  UserCog,
  BarChart3,
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Cursos', href: '/admin/cursos', icon: GraduationCap },
  { label: 'Órgãos', href: '/admin/orgaos', icon: Building2 },
  { label: 'Participantes', href: '/admin/participantes', icon: Users },
  { label: 'Notas de Empenho', href: '/admin/empenhos', icon: FileText },
  { label: 'Credenciamento', href: '/credenciamento', icon: ScanLine },
  { label: 'Certificados', href: '/admin/certificados', icon: Award },
  { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  { label: 'Usuários', href: '/admin/usuarios', icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-[#1a2332] text-white flex flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <span className="text-lg font-bold">Licitações Inteligentes</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#d4a843] text-[#1a2332]'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-xs text-gray-400 text-center">
          Licitações Inteligentes v1.0
        </p>
      </div>
    </aside>
  )
}
