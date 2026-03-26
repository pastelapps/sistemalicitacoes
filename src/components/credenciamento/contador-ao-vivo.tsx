'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'

interface ContadorAoVivoProps {
  cursoId: string
}

export function ContadorAoVivo({ cursoId }: ContadorAoVivoProps) {
  const [total, setTotal] = useState(0)
  const [credenciados, setCredenciados] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const buscarContadores = useCallback(async () => {
    if (!cursoId) return

    try {
      const { count: totalCount } = await supabase
        .from('participantes')
        .select('*', { count: 'exact', head: true })
        .eq('curso_id', cursoId)
        .eq('status_pagamento', 'confirmado')

      const { count: credenciadosCount } = await supabase
        .from('participantes')
        .select('*', { count: 'exact', head: true })
        .eq('curso_id', cursoId)
        .eq('status_pagamento', 'confirmado')
        .eq('status_credenciamento', 'credenciado')

      setTotal(totalCount ?? 0)
      setCredenciados(credenciadosCount ?? 0)
    } catch (err) {
      console.error('Erro ao buscar contadores:', err)
    } finally {
      setLoading(false)
    }
  }, [cursoId, supabase])

  useEffect(() => {
    buscarContadores()

    const interval = setInterval(buscarContadores, 10000)

    return () => clearInterval(interval)
  }, [buscarContadores])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-4 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded" />
      </div>
    )
  }

  const porcentagem = total > 0 ? Math.round((credenciados / total) * 100) : 0

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-lg">
            {credenciados} / {total}
          </span>
          <span className="text-muted-foreground text-sm">credenciados</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {porcentagem}%
        </span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  )
}
