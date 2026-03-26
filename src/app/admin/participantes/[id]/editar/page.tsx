'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ParticipanteForm } from '@/components/forms/participante-form'
import { fetchParticipante, updateParticipante } from '@/hooks/use-participantes'
import { formatCPF } from '@/lib/utils'
import type { ParticipanteWithRelations } from '@/types/database'
import type { ParticipanteFormData } from '@/lib/validators/schemas'

export default function EditarParticipantePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [participante, setParticipante] = useState<ParticipanteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

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

  async function handleUpdate(data: ParticipanteFormData) {
    try {
      await updateParticipante(id, {
        curso_id: data.curso_id,
        orgao_id: data.orgao_id ?? null,
        tipo_inscricao: data.tipo_inscricao,
        nome: data.nome,
        cpf: data.cpf,
        email: data.email,
        telefone: data.telefone,
        cargo: data.cargo ?? null,
        status_pagamento: data.status_pagamento ?? 'pendente',
        observacoes: data.observacoes ?? null,
      })
      toast.success('Participante atualizado com sucesso!')
      router.push(`/admin/participantes/${id}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar participante.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!participante) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Participante</h1>

      <Card>
        <CardHeader>
          <CardTitle>{participante.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipanteForm
            defaultValues={{
              curso_id: participante.curso_id,
              orgao_id: participante.orgao_id,
              tipo_inscricao: participante.tipo_inscricao,
              nome: participante.nome,
              cpf: formatCPF(participante.cpf),
              email: participante.email,
              telefone: participante.telefone,
              cargo: participante.cargo ?? undefined,
              status_pagamento: participante.status_pagamento,
              observacoes: participante.observacoes ?? undefined,
            }}
            onSubmit={handleUpdate}
          />
        </CardContent>
      </Card>
    </div>
  )
}
