'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { QrScanner } from '@/components/credenciamento/qr-scanner'
import { ResultadoValidacao } from '@/components/credenciamento/resultado-validacao'
import { BuscaManual } from '@/components/credenciamento/busca-manual'
import { ContadorAoVivo } from '@/components/credenciamento/contador-ao-vivo'
import type {
  Curso,
  Participante,
  Orgao,
  ParticipanteWithRelations,
} from '@/types/database'

type TipoResultado = 'valido' | 'ja_credenciado' | 'invalido'

interface Resultado {
  tipo: TipoResultado
  participante?: ParticipanteWithRelations
  mensagemErro?: string
}

function playBeep(success: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.connect(ctx.destination)
    osc.frequency.value = success ? 800 : 300
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close()
    }, success ? 150 : 300)
  } catch {
    // Web Audio not available
  }
}

export default function CredenciamentoPage() {
  const { profile } = useUser()
  const supabase = createClient()

  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursoSelecionado, setCursoSelecionado] = useState('')
  const [carregandoCursos, setCarregandoCursos] = useState(true)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  // Fetch active courses
  useEffect(() => {
    async function fetchCursos() {
      try {
        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .eq('status', 'ativo')
          .order('data_inicio', { ascending: false }) as {
            data: Curso[] | null
            error: Error | null
          }

        if (error) throw error
        setCursos(data ?? [])
      } catch (err) {
        console.error('Erro ao buscar cursos:', err)
        toast.error('Erro ao carregar cursos')
      } finally {
        setCarregandoCursos(false)
      }
    }

    fetchCursos()
  }, [supabase])

  const validarQrCode = useCallback(async (uuid: string) => {
    if (!cursoSelecionado) {
      toast.error('Selecione um curso primeiro')
      return
    }

    try {
      const { data, error } = await supabase
        .from('participantes')
        .select('*, curso:cursos(*), orgao:orgaos(*)')
        .eq('qr_code_uuid', uuid)
        .eq('curso_id', cursoSelecionado)
        .single() as {
          data: (Participante & { curso: Curso | null; orgao: Orgao | null }) | null
          error: unknown
        }

      if (error || !data) {
        playBeep(false)
        setResultado({
          tipo: 'invalido',
          mensagemErro: 'QR Code inválido para este curso',
        })
        return
      }

      const participante: ParticipanteWithRelations = {
        ...data,
        curso: data.curso ?? undefined,
        orgao: data.orgao ?? undefined,
      }

      if (data.status_pagamento !== 'confirmado') {
        playBeep(false)
        setResultado({
          tipo: 'invalido',
          participante,
          mensagemErro: 'Pagamento não confirmado',
        })
        return
      }

      if (data.status_credenciamento === 'credenciado') {
        playBeep(false)
        setResultado({
          tipo: 'ja_credenciado',
          participante,
        })
        return
      }

      // Valid
      setResultado({
        tipo: 'valido',
        participante,
      })
    } catch (err) {
      console.error('Erro ao validar QR code:', err)
      playBeep(false)
      setResultado({
        tipo: 'invalido',
        mensagemErro: 'Erro ao validar QR Code',
      })
    }
  }, [cursoSelecionado, supabase])

  const handleBuscaManualSelect = useCallback((participante: ParticipanteWithRelations) => {
    if (participante.status_credenciamento === 'credenciado') {
      setResultado({
        tipo: 'ja_credenciado',
        participante,
      })
    } else {
      setResultado({
        tipo: 'valido',
        participante,
      })
    }
  }, [])

  const confirmarCredenciamento = async () => {
    if (!resultado?.participante || !profile) return

    setConfirmando(true)
    try {
      const { error } = await supabase
        .from('participantes')
        .update({
          status_credenciamento: 'credenciado',
          data_credenciamento: new Date().toISOString(),
          operador_credenciamento_id: profile.id,
        } as never)
        .eq('id', resultado.participante.id)

      if (error) throw error

      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }

      // Success beep
      playBeep(true)

      toast.success(`${resultado.participante.nome} credenciado com sucesso!`)

      // Generate certificate in background
      try {
        await fetch('/api/pdf/certificado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participante_id: resultado.participante.id }),
        })
      } catch {
        console.error('Erro ao gerar certificado')
      }

      // Send email in background
      try {
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participante_id: resultado.participante.id }),
        })
      } catch {
        console.error('Erro ao enviar email')
      }

      setResultado(null)
    } catch (err) {
      console.error('Erro ao confirmar credenciamento:', err)
      toast.error('Erro ao confirmar credenciamento')
    } finally {
      setConfirmando(false)
    }
  }

  const novaLeitura = () => {
    setResultado(null)
  }

  return (
    <div className="space-y-4">
      {/* Course selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Curso
        </label>
        {carregandoCursos ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={cursoSelecionado} onValueChange={setCursoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((curso) => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Live counter */}
      {cursoSelecionado && <ContadorAoVivo cursoId={cursoSelecionado} />}

      {/* QR Scanner or Result */}
      {cursoSelecionado && !resultado && (
        <QrScanner
          onScan={validarQrCode}
          enabled={!resultado && !!cursoSelecionado}
        />
      )}

      {/* Validation result */}
      {resultado && (
        <ResultadoValidacao
          tipo={resultado.tipo}
          participante={resultado.participante}
          mensagemErro={resultado.mensagemErro}
          onConfirmar={confirmarCredenciamento}
          onNovaLeitura={novaLeitura}
          confirmando={confirmando}
        />
      )}

      {/* Manual search fallback */}
      {cursoSelecionado && !resultado && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Busca Manual
          </h3>
          <BuscaManual
            cursoId={cursoSelecionado}
            onSelect={handleBuscaManualSelect}
          />
        </div>
      )}

      {!cursoSelecionado && !carregandoCursos && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Selecione um curso para iniciar o credenciamento</p>
        </div>
      )}
    </div>
  )
}
