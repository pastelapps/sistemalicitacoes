'use client'

import { createOrgao } from '@/hooks/use-orgaos'
import { cleanCNPJ } from '@/lib/utils'
import { OrgaoForm } from '@/components/forms/orgao-form'
import type { OrgaoFormData } from '@/lib/validators/schemas'

export default function NovoOrgaoPage() {
  const handleSubmit = async (data: OrgaoFormData) => {
    await createOrgao({
      nome: data.nome,
      cnpj: data.cnpj ? cleanCNPJ(data.cnpj) : '',
      tipo: data.tipo || '',
      uf: data.uf || '',
      cidade: data.cidade || '',
      responsavel_nome: data.responsavel_nome || null,
      responsavel_email: data.responsavel_email || null,
      responsavel_telefone: data.responsavel_telefone || null,
      observacoes: data.observacoes || null,
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Órgão</h1>
      <OrgaoForm onSubmit={handleSubmit} />
    </div>
  )
}
