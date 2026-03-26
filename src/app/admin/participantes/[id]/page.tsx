'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, Download, Mail, QrCode, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { fetchParticipante } from '@/hooks/use-participantes'
import { formatCPF, formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import {
  PAGAMENTO_STATUS_LABELS,
  PAGAMENTO_STATUS_COLORS,
  CREDENCIAMENTO_STATUS_LABELS,
  CREDENCIAMENTO_STATUS_COLORS,
  INSCRICAO_TIPO_LABELS,
} from '@/lib/constants'

import type { ParticipanteWithRelations } from '@/types/database'

export default function DetalhesParticipantePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [participante, setParticipante] = useState<ParticipanteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchParticipante(id)
        setParticipante(data)
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar participante.')
        router.push('/admin/participantes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!participante) return null

  async function handleGerarIngresso() {
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/pdf/ingresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar ingresso')

      setParticipante((prev) => prev ? { ...prev, pdf_ingresso_url: data.url } : prev)
      toast.success('Ingresso gerado com sucesso!')
      window.open(data.url, '_blank')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar ingresso')
    } finally {
      setGeneratingPdf(false)
    }
  }

  async function handleEnviarEmail() {
    if (!participante?.pdf_ingresso_url) {
      toast.error('Gere o ingresso primeiro antes de enviar por email.')
      return
    }
    setSendingEmail(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: participante.email,
          subject: `Seu ingresso - ${participante.curso?.nome ?? 'Evento'}`,
          html: `
            <h2>Olá, ${participante.nome}!</h2>
            <p>Segue em anexo o seu ingresso para o evento <strong>${participante.curso?.nome ?? ''}</strong>.</p>
            <p>Apresente o QR Code no dia do credenciamento.</p>
            <br/>
            <p>Atenciosamente,<br/>Equipe Licitações Inteligentes</p>
          `,
          pdfUrl: participante.pdf_ingresso_url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar email')
      toast.success(`Email enviado para ${participante.email}!`)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar email')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{participante.nome}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGerarIngresso}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="mr-2 h-4 w-4" />
            )}
            {participante.pdf_ingresso_url ? 'Regerar Ingresso' : 'Gerar Ingresso'}
          </Button>
          {participante.pdf_ingresso_url && (
            <>
              <Button
                variant="outline"
                onClick={() => window.open(participante.pdf_ingresso_url!, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleEnviarEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviar por Email
              </Button>
            </>
          )}
          <Button onClick={() => router.push(`/admin/participantes/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nome" value={participante.nome} />
            <InfoRow label="CPF" value={formatCPF(participante.cpf)} />
            <InfoRow label="Email" value={participante.email} />
            <InfoRow label="Telefone" value={participante.telefone} />
            <InfoRow label="Cargo" value={participante.cargo ?? '-'} />
            <InfoRow
              label="Tipo de Inscricao"
              value={INSCRICAO_TIPO_LABELS[participante.tipo_inscricao]}
            />
            {participante.observacoes && (
              <InfoRow label="Observacoes" value={participante.observacoes} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pagamento</span>
                <Badge className={PAGAMENTO_STATUS_COLORS[participante.status_pagamento]}>
                  {PAGAMENTO_STATUS_LABELS[participante.status_pagamento]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credenciamento</span>
                <Badge
                  className={CREDENCIAMENTO_STATUS_COLORS[participante.status_credenciamento]}
                >
                  {CREDENCIAMENTO_STATUS_LABELS[participante.status_credenciamento]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Nome" value={participante.curso?.nome ?? '-'} />
              {participante.curso && (
                <>
                  <InfoRow
                    label="Periodo"
                    value={`${formatDate(participante.curso.data_inicio)} a ${formatDate(participante.curso.data_fim)}`}
                  />
                  <InfoRow label="Valor" value={formatCurrency(participante.curso.valor)} />
                </>
              )}
            </CardContent>
          </Card>

          {participante.orgao && (
            <Card>
              <CardHeader>
                <CardTitle>Orgao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nome" value={participante.orgao.nome} />
                <InfoRow label="Cidade/UF" value={`${participante.orgao.cidade}/${participante.orgao.uf}`} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Data da Compra" value={formatDateTime(participante.data_compra)} />
              <InfoRow
                label="Data do Credenciamento"
                value={
                  participante.data_credenciamento
                    ? formatDateTime(participante.data_credenciamento)
                    : '-'
                }
              />
              <InfoRow label="Criado em" value={formatDateTime(participante.created_at)} />
              <InfoRow label="Atualizado em" value={formatDateTime(participante.updated_at)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}
