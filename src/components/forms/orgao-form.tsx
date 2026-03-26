'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { orgaoSchema, type OrgaoFormData } from '@/lib/validators/schemas'
import { formatCNPJ } from '@/lib/utils'
import { ORGAO_TIPO_OPTIONS, UF_OPTIONS } from '@/lib/constants'

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

interface OrgaoFormProps {
  defaultValues?: Partial<OrgaoFormData>
  onSubmit: (data: OrgaoFormData) => Promise<void>
}

export function OrgaoForm({ defaultValues, onSubmit }: OrgaoFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrgaoFormData>({
    resolver: zodResolver(orgaoSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      tipo: '',
      uf: '',
      cidade: '',
      responsavel_nome: '',
      responsavel_email: '',
      responsavel_telefone: '',
      observacoes: '',
      ...defaultValues,
    },
  })

  const tipoValue = watch('tipo')
  const ufValue = watch('uf')

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14)
    const formatted = formatCNPJ(raw)
    setValue('cnpj', formatted, { shouldValidate: true })
  }

  const handleFormSubmit = async (data: OrgaoFormData) => {
    try {
      await onSubmit(data)
      toast.success('Órgão salvo com sucesso!')
      router.push('/admin/orgaos')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar órgão')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input
          id="cnpj"
          value={watch('cnpj')}
          onChange={handleCnpjChange}
          placeholder="00.000.000/0000-00"
        />
        {errors.cnpj && (
          <p className="text-sm text-destructive">{errors.cnpj.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={tipoValue}
            onValueChange={(value) => setValue('tipo', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {ORGAO_TIPO_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-destructive">{errors.tipo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>UF *</Label>
          <Select
            value={ufValue}
            onValueChange={(value) => setValue('uf', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              {UF_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.uf && (
            <p className="text-sm text-destructive">{errors.uf.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cidade">Cidade *</Label>
        <Input id="cidade" {...register('cidade')} />
        {errors.cidade && (
          <p className="text-sm text-destructive">{errors.cidade.message}</p>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Responsável</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsavel_nome">Nome do responsável</Label>
            <Input id="responsavel_nome" {...register('responsavel_nome')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_email">Email</Label>
              <Input
                id="responsavel_email"
                type="email"
                {...register('responsavel_email')}
              />
              {errors.responsavel_email && (
                <p className="text-sm text-destructive">{errors.responsavel_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_telefone">Telefone</Label>
              <Input id="responsavel_telefone" {...register('responsavel_telefone')} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" rows={3} {...register('observacoes')} />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/orgaos')}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
