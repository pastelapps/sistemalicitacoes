'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { participanteLoteSchema, type ParticipanteLoteFormData } from '@/lib/validators/schemas'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, cleanCPF } from '@/lib/utils'

import type { Curso, Orgao } from '@/types/database'

interface ParticipanteLoteFormProps {
  onSubmit: (data: ParticipanteLoteFormData) => Promise<void>
}

export function ParticipanteLoteForm({ onSubmit }: ParticipanteLoteFormProps) {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [orgaos, setOrgaos] = useState<Orgao[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParticipanteLoteFormData>({
    resolver: zodResolver(participanteLoteSchema),
    defaultValues: {
      curso_id: '',
      orgao_id: '',
      participantes: [{ nome: '', cpf: '', email: '', telefone: '', cargo: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participantes',
  })

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

  function handleCPFChange(index: number, value: string) {
    const raw = value.replace(/\D/g, '').slice(0, 11)
    setValue(`participantes.${index}.cpf`, formatCPF(raw), { shouldValidate: false })
  }

  async function handleFormSubmit(data: ParticipanteLoteFormData) {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        participantes: data.participantes.map((p) => ({
          ...p,
          cpf: cleanCPF(p.cpf),
        })),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Curso *</Label>
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
          <Label>Orgao *</Label>
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
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Participantes</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ nome: '', cpf: '', email: '', telefone: '', cargo: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Participante
          </Button>
        </div>

        {errors.participantes?.root && (
          <p className="text-sm text-red-500">{errors.participantes.root.message}</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Participante {index + 1}</span>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input {...register(`participantes.${index}.nome`)} />
                {errors.participantes?.[index]?.nome && (
                  <p className="text-sm text-red-500">
                    {errors.participantes[index].nome?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>CPF *</Label>
                <Input
                  value={watch(`participantes.${index}.cpf`) ?? ''}
                  onChange={(e) => handleCPFChange(index, e.target.value)}
                  placeholder="000.000.000-00"
                />
                {errors.participantes?.[index]?.cpf && (
                  <p className="text-sm text-red-500">
                    {errors.participantes[index].cpf?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" {...register(`participantes.${index}.email`)} />
                {errors.participantes?.[index]?.email && (
                  <p className="text-sm text-red-500">
                    {errors.participantes[index].email?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Telefone *</Label>
                <Input
                  {...register(`participantes.${index}.telefone`)}
                  placeholder="(00) 00000-0000"
                />
                {errors.participantes?.[index]?.telefone && (
                  <p className="text-sm text-red-500">
                    {errors.participantes[index].telefone?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Cargo</Label>
                <Input {...register(`participantes.${index}.cargo`)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar Todos'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
