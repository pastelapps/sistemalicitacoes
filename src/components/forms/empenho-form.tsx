'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { notaEmpenhoSchema, type NotaEmpenhoFormData } from '@/lib/validators/schemas'
import { createClient } from '@/lib/supabase/client'
import type { Curso, Orgao, Participante } from '@/types/database'

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
import { Checkbox } from '@/components/ui/checkbox'

interface EmpenhoFormProps {
  defaultValues?: Partial<NotaEmpenhoFormData>
  defaultParticipanteIds?: string[]
  onSubmit: (data: NotaEmpenhoFormData, arquivo?: File, participanteIds?: string[]) => Promise<void>
}

export function EmpenhoForm({
  defaultValues,
  defaultParticipanteIds = [],
  onSubmit,
}: EmpenhoFormProps) {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [orgaos, setOrgaos] = useState<Orgao[]>([])
  const [orgaoSearch, setOrgaoSearch] = useState('')
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [selectedParticipantes, setSelectedParticipantes] = useState<string[]>(defaultParticipanteIds)
  const [submitting, setSubmitting] = useState(false)
  const [arquivo, setArquivo] = useState<File | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NotaEmpenhoFormData>({
    resolver: zodResolver(notaEmpenhoSchema),
    defaultValues: {
      curso_id: '',
      orgao_id: '',
      numero_nota: '',
      valor: '',
      qtd_participantes: '1',
      status: 'pendente',
      observacoes: '',
      ...defaultValues,
    },
  })

  const cursoId = watch('curso_id')
  const orgaoId = watch('orgao_id')

  // Load cursos
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('cursos')
      .select('*')
      .order('nome')
      .then(({ data }) => {
        setCursos((data as Curso[] | null) ?? [])
      })
  }, [])

  // Load orgaos with search
  useEffect(() => {
    const supabase = createClient()
    let query = supabase
      .from('orgaos')
      .select('*')
      .order('nome')
      .limit(50)

    if (orgaoSearch) {
      query = query.ilike('nome', `%${orgaoSearch}%`)
    }

    query.then(({ data }) => {
      setOrgaos((data as Orgao[] | null) ?? [])
    })
  }, [orgaoSearch])

  // Load participantes when curso + orgao are selected
  useEffect(() => {
    if (!cursoId || !orgaoId) {
      setParticipantes([])
      return
    }

    const supabase = createClient()
    supabase
      .from('participantes')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('orgao_id', orgaoId)
      .order('nome')
      .then(({ data }) => {
        setParticipantes((data as Participante[] | null) ?? [])
      })
  }, [cursoId, orgaoId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF s\u00e3o permitidos.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no m\u00e1ximo 10MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setArquivo(file)
  }

  const toggleParticipante = (id: string) => {
    setSelectedParticipantes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const onFormSubmit = async (data: NotaEmpenhoFormData) => {
    setSubmitting(true)
    try {
      await onSubmit(data, arquivo, selectedParticipantes)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar nota de empenho.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-2xl">
      {/* Curso */}
      <div className="space-y-2">
        <Label htmlFor="curso_id">Curso</Label>
        <Select
          value={cursoId}
          onValueChange={(value) => setValue('curso_id', value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {cursos.map((curso) => (
              <SelectItem key={curso.id} value={curso.id}>
                {curso.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.curso_id && (
          <p className="text-sm text-red-500">{errors.curso_id.message}</p>
        )}
      </div>

      {/* Orgao com busca */}
      <div className="space-y-2">
        <Label htmlFor="orgao_id">\u00d3rg\u00e3o</Label>
        <Input
          placeholder="Buscar \u00f3rg\u00e3o..."
          value={orgaoSearch}
          onChange={(e) => setOrgaoSearch(e.target.value)}
          className="mb-2"
        />
        <Select
          value={orgaoId}
          onValueChange={(value) => setValue('orgao_id', value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um \u00f3rg\u00e3o" />
          </SelectTrigger>
          <SelectContent>
            {orgaos.map((orgao) => (
              <SelectItem key={orgao.id} value={orgao.id}>
                {orgao.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.orgao_id && (
          <p className="text-sm text-red-500">{errors.orgao_id.message}</p>
        )}
      </div>

      {/* Numero Nota */}
      <div className="space-y-2">
        <Label htmlFor="numero_nota">N\u00famero da Nota</Label>
        <Input id="numero_nota" {...register('numero_nota')} />
        {errors.numero_nota && (
          <p className="text-sm text-red-500">{errors.numero_nota.message}</p>
        )}
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input id="valor" type="number" step="0.01" {...register('valor')} />
        {errors.valor && (
          <p className="text-sm text-red-500">{errors.valor.message}</p>
        )}
      </div>

      {/* Qtd Participantes */}
      <div className="space-y-2">
        <Label htmlFor="qtd_participantes">Qtd Participantes</Label>
        <Input
          id="qtd_participantes"
          type="number"
          min={1}
          {...register('qtd_participantes')}
        />
        {errors.qtd_participantes && (
          <p className="text-sm text-red-500">{errors.qtd_participantes.message}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch('status')}
          onValueChange={(value) =>
            setValue('status', value as NotaEmpenhoFormData['status'], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-500">{errors.status.message}</p>
        )}
      </div>

      {/* Observacoes */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observa\u00e7\u00f5es</Label>
        <Textarea id="observacoes" {...register('observacoes')} rows={3} />
        {errors.observacoes && (
          <p className="text-sm text-red-500">{errors.observacoes.message}</p>
        )}
      </div>

      {/* Upload PDF */}
      <div className="space-y-2">
        <Label htmlFor="arquivo">Arquivo da Nota (PDF, m\u00e1x. 10MB)</Label>
        <Input
          id="arquivo"
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {arquivo && (
          <p className="text-sm text-muted-foreground">
            Arquivo selecionado: {arquivo.name}
          </p>
        )}
      </div>

      {/* Participantes vinculados */}
      {participantes.length > 0 && (
        <div className="space-y-2">
          <Label>Participantes Vinculados</Label>
          <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
            {participantes.map((p) => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`participante-${p.id}`}
                  checked={selectedParticipantes.includes(p.id)}
                  onCheckedChange={() => toggleParticipante(p.id)}
                />
                <label
                  htmlFor={`participante-${p.id}`}
                  className="text-sm cursor-pointer"
                >
                  {p.nome} - {p.cpf} - {p.email}
                </label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedParticipantes.length} participante{selectedParticipantes.length !== 1 ? 's' : ''} selecionado{selectedParticipantes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {cursoId && orgaoId && participantes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum participante encontrado para este curso e \u00f3rg\u00e3o.
        </p>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
