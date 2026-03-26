'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { participanteSchema, type ParticipanteFormData } from '@/lib/validators/schemas'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, cleanCPF } from '@/lib/utils'
import {
  PAGAMENTO_STATUS_LABELS,
  INSCRICAO_TIPO_LABELS,
} from '@/lib/constants'

import type { Curso, Orgao, PagamentoStatus, InscricaoTipo } from '@/types/database'

interface ParticipanteFormProps {
  defaultValues?: Partial<ParticipanteFormData>
  onSubmit: (data: ParticipanteFormData) => Promise<void>
}

export function ParticipanteForm({ defaultValues, onSubmit }: ParticipanteFormProps) {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [orgaos, setOrgaos] = useState<Orgao[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParticipanteFormData>({
    resolver: zodResolver(participanteSchema),
    defaultValues: {
      tipo_inscricao: 'individual',
      status_pagamento: 'pendente',
      ...defaultValues,
    },
  })

  const tipoInscricao = watch('tipo_inscricao')
  const cpfValue = watch('cpf')

  useEffect(() => {
    async function loadDropdowns() {
      const supabase = createClient()
      const [cursosRes, orgaosRes] = await Promise.all([
        supabase.from('cursos').select('*').eq('status', 'ativo').order('nome') as unknown as { data: Curso[] | null },
        supabase.from('orgaos').select('*').order('nome') as unknown as { data: Orgao[] | null },
      ])
      setCursos(cursosRes.data ?? [])
      setOrgaos(orgaosRes.data ?? [])
    }
    loadDropdowns()
  }, [])

  useEffect(() => {
    if (tipoInscricao === 'individual') {
      setValue('orgao_id', null)
    }
  }, [tipoInscricao, setValue])

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    setValue('cpf', formatCPF(raw), { shouldValidate: false })
  }

  async function handleFormSubmit(data: ParticipanteFormData) {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        cpf: cleanCPF(data.cpf),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="curso_id">Curso *</Label>
          <Select
            value={watch('curso_id') ?? ''}
            onValueChange={(val) => setValue('curso_id', val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.curso_id && (
            <p className="text-sm text-red-500">{errors.curso_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_inscricao">Tipo de Inscricao *</Label>
          <Select
            value={watch('tipo_inscricao')}
            onValueChange={(val) =>
              setValue('tipo_inscricao', val as InscricaoTipo, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(INSCRICAO_TIPO_LABELS) as [InscricaoTipo, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.tipo_inscricao && (
            <p className="text-sm text-red-500">{errors.tipo_inscricao.message}</p>
          )}
        </div>

        {tipoInscricao === 'orgao' && (
          <div className="space-y-2">
            <Label htmlFor="orgao_id">Orgao *</Label>
            <Select
              value={watch('orgao_id') ?? ''}
              onValueChange={(val) => setValue('orgao_id', val, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um orgao" />
              </SelectTrigger>
              <SelectContent>
                {orgaos.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orgao_id && (
              <p className="text-sm text-red-500">{errors.orgao_id.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={cpfValue ?? ''}
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
          />
          {errors.cpf && (
            <p className="text-sm text-red-500">{errors.cpf.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone *</Label>
          <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
          {errors.telefone && (
            <p className="text-sm text-red-500">{errors.telefone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input id="cargo" {...register('cargo')} />
          {errors.cargo && (
            <p className="text-sm text-red-500">{errors.cargo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status_pagamento">Status Pagamento</Label>
          <Select
            value={watch('status_pagamento') ?? 'pendente'}
            onValueChange={(val) =>
              setValue('status_pagamento', val as PagamentoStatus, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PAGAMENTO_STATUS_LABELS) as [PagamentoStatus, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.status_pagamento && (
            <p className="text-sm text-red-500">{errors.status_pagamento.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observacoes</Label>
        <Textarea id="observacoes" {...register('observacoes')} rows={3} />
        {errors.observacoes && (
          <p className="text-sm text-red-500">{errors.observacoes.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
