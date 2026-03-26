'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { EmpenhoForm } from '@/components/forms/empenho-form'
import { createEmpenho } from '@/hooks/use-empenhos'
import type { NotaEmpenhoFormData } from '@/lib/validators/schemas'

export default function NovoEmpenhoPage() {
  const router = useRouter()

  const handleSubmit = async (
    data: NotaEmpenhoFormData,
    arquivo?: File,
    participanteIds?: string[]
  ) => {
    await createEmpenho({
      formData: data,
      arquivo,
      participanteIds: participanteIds ?? [],
    })
    toast.success('Nota de empenho criada com sucesso!')
    router.push('/empenhos')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Nota de Empenho</h1>
      <EmpenhoForm onSubmit={handleSubmit} />
    </div>
  )
}
