'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import type { ParticipanteWithRelations, Participante, Orgao } from '@/types/database'

interface BuscaManualProps {
  cursoId: string
  onSelect: (participante: ParticipanteWithRelations) => void
}

export function BuscaManual({ cursoId, onSelect }: BuscaManualProps) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ParticipanteWithRelations[]>([])
  const [buscando, setBuscando] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const realizarBusca = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2 || !cursoId) {
      setResultados([])
      return
    }

    setBuscando(true)
    try {
      // Check if search term looks like CPF (digits only)
      const termoCpfLimpo = termo.replace(/\D/g, '')
      const isCpf = termoCpfLimpo.length >= 3 && /^\d+$/.test(termoCpfLimpo)

      let query = supabase
        .from('participantes')
        .select('*, orgao:orgaos(*)')
        .eq('curso_id', cursoId)
        .eq('status_pagamento', 'confirmado')
        .limit(10)

      if (isCpf) {
        query = query.ilike('cpf', `%${termoCpfLimpo}%`)
      } else {
        query = query.ilike('nome', `%${termo}%`)
      }

      const { data, error } = await query as {
        data: (Participante & { orgao: Orgao | null })[] | null
        error: Error | null
      }

      if (error) throw error

      const mapped: ParticipanteWithRelations[] = (data ?? []).map((p) => ({
        ...p,
        orgao: p.orgao ?? undefined,
      }))

      setResultados(mapped)
    } catch (err) {
      console.error('Erro na busca:', err)
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [cursoId, supabase])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      realizarBusca(busca)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [busca, realizarBusca])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {buscando && (
        <p className="text-sm text-muted-foreground text-center">Buscando...</p>
      )}

      {resultados.length > 0 && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {resultados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p)
                setBusca('')
                setResultados([])
              }}
              className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
            >
              <p className="font-medium text-sm">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF: {p.cpf}
                {p.orgao && ` | ${p.orgao.nome}`}
                {p.status_credenciamento === 'credenciado' && (
                  <span className="ml-2 text-yellow-600 font-medium">
                    (Já credenciado)
                  </span>
                )}
              </p>
            </button>
          ))}
        </div>
      )}

      {busca.length >= 2 && !buscando && resultados.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Nenhum participante encontrado
        </p>
      )}
    </div>
  )
}
