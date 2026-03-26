'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import type { ParticipanteWithRelations } from '@/types/database'

type TipoResultado = 'valido' | 'ja_credenciado' | 'invalido'

interface ResultadoValidacaoProps {
  tipo: TipoResultado
  participante?: ParticipanteWithRelations
  mensagemErro?: string
  onConfirmar: () => void
  onNovaLeitura: () => void
  confirmando?: boolean
}

function mascararCpf(cpf: string): string {
  // Format: XXX.XXX.***-XX
  const limpo = cpf.replace(/\D/g, '')
  if (limpo.length !== 11) return cpf
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.***-${limpo.slice(9, 11)}`
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ResultadoValidacao({
  tipo,
  participante,
  mensagemErro,
  onConfirmar,
  onNovaLeitura,
  confirmando = false,
}: ResultadoValidacaoProps) {
  return (
    <div className="space-y-3">
      {tipo === 'valido' && participante && (
        <div className="rounded-lg bg-green-500 text-white p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-8 w-8" />
            <span className="text-xl font-bold">Participante Válido</span>
          </div>
          <div className="space-y-1 text-green-50">
            <p className="text-lg font-semibold">{participante.nome}</p>
            <p>CPF: {mascararCpf(participante.cpf)}</p>
            {participante.orgao && <p>Órgão: {participante.orgao.nome}</p>}
            {participante.curso && <p>Curso: {participante.curso.nome}</p>}
          </div>
          <Button
            onClick={onConfirmar}
            disabled={confirmando}
            className="w-full bg-white text-green-700 hover:bg-green-50 font-bold text-lg py-6"
          >
            {confirmando ? 'Confirmando...' : 'Confirmar Credenciamento'}
          </Button>
        </div>
      )}

      {tipo === 'ja_credenciado' && participante && (
        <div className="rounded-lg bg-yellow-500 text-white p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            <span className="text-xl font-bold">Já Credenciado</span>
          </div>
          <div className="space-y-1 text-yellow-50">
            <p className="text-lg font-semibold">{participante.nome}</p>
            {participante.orgao && <p>Órgão: {participante.orgao.nome}</p>}
            {participante.data_credenciamento && (
              <p>Credenciado em: {formatarDataHora(participante.data_credenciamento)}</p>
            )}
          </div>
        </div>
      )}

      {tipo === 'invalido' && (
        <div className="rounded-lg bg-red-500 text-white p-6 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-8 w-8" />
            <span className="text-xl font-bold">Inválido</span>
          </div>
          <p className="text-red-50 text-lg">
            {mensagemErro || 'QR Code não reconhecido'}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        onClick={onNovaLeitura}
        className="w-full"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Nova Leitura
      </Button>
    </div>
  )
}
