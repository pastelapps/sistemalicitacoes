'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { EmpenhoForm } from '@/components/forms/empenho-form'
import {
  fetchEmpenho,
  fetchEmpenhoParticipantes,
  updateEmpenho,
} from '@/hooks/use-empenhos'
import type { NotaEmpenhoWithRelations } from '@/types/database'
import type { NotaEmpenhoFormData } from '@/lib/validators/schemas'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarEmpenhoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [empenho, setEmpenho] = useState<NotaEmpenhoWithRelations | null>(null)
  const [participanteIds, setParticipanteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [empenhoData, pIds] = await Promise.all([
          fetchEmpenho(id),
          fetchEmpenhoParticipantes(id),
        ])
        setEmpenho(empenhoData)
        setParticipanteIds(pIds)
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar nota de empenho.')
        router.push('/empenhos')
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
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  if (!empenho) return null

  const handleSubmit = async (
    data: NotaEmpenhoFormData,
    arquivo?: File,
    selectedParticipanteIds?: string[]
  ) => {
    await updateEmpenho({
      id,
      formData: data,
      arquivo,
      participanteIds: selectedParticipanteIds,
    })
    toast.success('Nota de empenho atualizada com sucesso!')
    router.push('/empenhos')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Nota de Empenho</h1>
      <EmpenhoForm
        defaultValues={{
          curso_id: empenho.curso_id,
          orgao_id: empenho.orgao_id,
          numero_nota: empenho.numero_nota,
          valor: String(empenho.valor),
          qtd_participantes: String(empenho.qtd_participantes),
          status: empenho.status,
          observacoes: empenho.observacoes ?? '',
        }}
        defaultParticipanteIds={participanteIds}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
