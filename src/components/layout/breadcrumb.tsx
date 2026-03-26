'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  cursos: 'Cursos',
  orgaos: 'Órgãos',
  participantes: 'Participantes',
  empenhos: 'Notas de Empenho',
  certificados: 'Certificados',
  relatorios: 'Relatórios',
  usuarios: 'Usuários',
  credenciamento: 'Credenciamento',
  novo: 'Novo',
  editar: 'Editar',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Remove route groups like (admin)
  const cleanSegments = segments.filter((s) => !s.startsWith('(') && !s.endsWith(')'))

  const breadcrumbs = cleanSegments.map((segment, index) => {
    const href = '/' + cleanSegments.slice(0, index + 1).join('/')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment)
    const label = isUuid ? 'Detalhes' : (ROUTE_LABELS[segment] || segment)

    return { label, href }
  })

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/admin/dashboard" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
