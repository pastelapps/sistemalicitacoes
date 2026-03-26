'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { fetchOrgao, updateOrgao } from '@/hooks/use-orgaos'
import { formatCNPJ, cleanCNPJ } from '@/lib/utils'
import { OrgaoForm } from '@/components/forms/orgao-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrgaoFormData } from '@/lib/validators/schemas'
import type { Orgao } from '@/types/database'

export default function EditarOrgaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [orgao, setOrgao] = useState<Orgao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchOrgao(id)
        if (!data) {
          toast.error('Órgão não encontrado')
          router.push('/admin/orgaos')
          return
        }
        setOrgao(data)
      } catch {
        toast.error('Erro ao carregar órgão')
        router.push('/admin/orgaos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleSubmit = async (data: OrgaoFormData) => {
    await updateOrgao(id, {
      ...data,
      cnpj: cleanCNPJ(data.cnpj),
      responsavel_nome: data.responsavel_nome || null,
      responsavel_email: data.responsavel_email || null,
      responsavel_telefone: data.responsavel_telefone || null,
      observacoes: data.observacoes || null,
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!orgao) return null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Órgão</h1>
      <OrgaoForm
        defaultValues={{
          nome: orgao.nome,
          cnpj: formatCNPJ(orgao.cnpj),
          tipo: orgao.tipo,
          uf: orgao.uf,
          cidade: orgao.cidade,
          responsavel_nome: orgao.responsavel_nome ?? '',
          responsavel_email: orgao.responsavel_email ?? '',
          responsavel_telefone: orgao.responsavel_telefone ?? '',
          observacoes: orgao.observacoes ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
