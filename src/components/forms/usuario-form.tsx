'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { usuarioSchema, type UsuarioFormData } from '@/lib/validators/schemas'

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
import { Switch } from '@/components/ui/switch'

interface UsuarioFormProps {
  defaultValues?: Partial<UsuarioFormData>
  onSubmit: (data: UsuarioFormData) => Promise<void>
  isEditing?: boolean
}

export function UsuarioForm({
  defaultValues,
  onSubmit,
  isEditing = false,
}: UsuarioFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(!isEditing)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      role: 'operador',
      ativo: true,
      ...defaultValues,
    },
  })

  const onFormSubmit = async (data: UsuarioFormData) => {
    // Na cria\u00e7\u00e3o, senha \u00e9 obrigat\u00f3ria
    if (!isEditing && !data.password) {
      toast.error('Senha \u00e9 obrigat\u00f3ria para criar um usu\u00e1rio.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar usu\u00e1rio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-lg">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && (
          <p className="text-sm text-red-500">{errors.nome.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Perfil</Label>
        <Select
          value={watch('role')}
          onValueChange={(value) =>
            setValue('role', value as UsuarioFormData['role'], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="operador">Operador de Credenciamento</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      {/* Ativo */}
      <div className="flex items-center space-x-3">
        <Switch
          id="ativo"
          checked={watch('ativo')}
          onCheckedChange={(checked) => setValue('ativo', checked)}
        />
        <Label htmlFor="ativo">Usu\u00e1rio ativo</Label>
      </div>

      {/* Senha */}
      {isEditing && !showPassword && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPassword(true)}
        >
          Redefinir Senha
        </Button>
      )}

      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? 'Nova Senha' : 'Senha'}
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'M\u00ednimo 8 caracteres'}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPassword(false)
                setValue('password', undefined)
              }}
            >
              Cancelar redefinir senha
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
