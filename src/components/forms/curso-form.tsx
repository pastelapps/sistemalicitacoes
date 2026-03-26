'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { cursoSchema, type CursoFormData } from '@/lib/validators/schemas'
import { CURSO_STATUS_LABELS } from '@/lib/constants'
import type { CursoStatus } from '@/types/database'

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

interface CursoFormProps {
  defaultValues?: CursoFormData
  onSubmit: (data: CursoFormData) => Promise<void>
}

export function CursoForm({ defaultValues, onSubmit }: CursoFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: defaultValues ?? {
      nome: '',
      descricao: '',
      ementa: '',
      data_inicio: '',
      data_fim: '',
      horario: '',
      local_nome: '',
      local_endereco: '',
      local_cidade_uf: '',
      carga_horaria: '',
      valor: '',
      vagas_totais: '',
      status: 'rascunho',
    },
  })

  const statusValue = watch('status')

  const handleFormSubmit = async (data: CursoFormData) => {
    setSubmitting(true)
    try {
      await onSubmit(data)
      toast.success(defaultValues ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!')
      router.push('/admin/cursos')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar curso'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Nome */}
        <div className="md:col-span-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && (
            <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" rows={3} {...register('descricao')} />
          {errors.descricao && (
            <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
          )}
        </div>

        {/* Ementa */}
        <div className="md:col-span-2">
          <Label htmlFor="ementa">Ementa</Label>
          <Textarea id="ementa" rows={4} {...register('ementa')} />
          {errors.ementa && (
            <p className="mt-1 text-sm text-red-500">{errors.ementa.message}</p>
          )}
        </div>

        {/* Data Início */}
        <div>
          <Label htmlFor="data_inicio">Data de Início</Label>
          <Input id="data_inicio" type="date" {...register('data_inicio')} />
          {errors.data_inicio && (
            <p className="mt-1 text-sm text-red-500">{errors.data_inicio.message}</p>
          )}
        </div>

        {/* Data Fim */}
        <div>
          <Label htmlFor="data_fim">Data de Fim</Label>
          <Input id="data_fim" type="date" {...register('data_fim')} />
          {errors.data_fim && (
            <p className="mt-1 text-sm text-red-500">{errors.data_fim.message}</p>
          )}
        </div>

        {/* Horário */}
        <div>
          <Label htmlFor="horario">Horário</Label>
          <Input id="horario" placeholder="Ex: 08:00 às 17:00" {...register('horario')} />
          {errors.horario && (
            <p className="mt-1 text-sm text-red-500">{errors.horario.message}</p>
          )}
        </div>

        {/* Carga Horária */}
        <div>
          <Label htmlFor="carga_horaria">Carga Horária (horas)</Label>
          <Input id="carga_horaria" type="number" {...register('carga_horaria')} />
          {errors.carga_horaria && (
            <p className="mt-1 text-sm text-red-500">{errors.carga_horaria.message}</p>
          )}
        </div>

        {/* Local Nome */}
        <div>
          <Label htmlFor="local_nome">Nome do Local</Label>
          <Input id="local_nome" {...register('local_nome')} />
          {errors.local_nome && (
            <p className="mt-1 text-sm text-red-500">{errors.local_nome.message}</p>
          )}
        </div>

        {/* Local Endereço */}
        <div>
          <Label htmlFor="local_endereco">Endereço</Label>
          <Input id="local_endereco" {...register('local_endereco')} />
          {errors.local_endereco && (
            <p className="mt-1 text-sm text-red-500">{errors.local_endereco.message}</p>
          )}
        </div>

        {/* Local Cidade/UF */}
        <div>
          <Label htmlFor="local_cidade_uf">Cidade/UF</Label>
          <Input id="local_cidade_uf" placeholder="Ex: Brasília/DF" {...register('local_cidade_uf')} />
          {errors.local_cidade_uf && (
            <p className="mt-1 text-sm text-red-500">{errors.local_cidade_uf.message}</p>
          )}
        </div>

        {/* Valor */}
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input id="valor" type="number" step="0.01" {...register('valor')} />
          {errors.valor && (
            <p className="mt-1 text-sm text-red-500">{errors.valor.message}</p>
          )}
        </div>

        {/* Vagas Totais */}
        <div>
          <Label htmlFor="vagas_totais">Vagas Totais</Label>
          <Input id="vagas_totais" type="number" {...register('vagas_totais')} />
          {errors.vagas_totais && (
            <p className="mt-1 text-sm text-red-500">{errors.vagas_totais.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={statusValue}
            onValueChange={(value) => setValue('status', value as CursoStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CURSO_STATUS_LABELS) as [CursoStatus, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/cursos')}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
