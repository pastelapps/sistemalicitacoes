'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validators/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha inválidos')
        } else if (error.message.includes('too many requests')) {
          toast.error('Muitas tentativas. Aguarde 15 minutos.')
        } else {
          toast.error(error.message)
        }
        return
      }

      // Buscar perfil para redirecionar
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null }

        if (profile && !profile.ativo) {
          await supabase.auth.signOut()
          toast.error('Sua conta está desativada. Contate o administrador.')
          return
        }

        // Atualizar último acesso
        await supabase
          .from('profiles')
          .update({ ultimo_acesso: new Date().toISOString() } as never)
          .eq('id', user.id)

        if (profile?.role === 'operador') {
          router.push('/credenciamento')
        } else {
          router.push('/admin/dashboard')
        }
      }
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    const email = prompt('Digite seu email para recuperação:')
    if (!email) return

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      toast.error('Erro ao enviar email de recuperação')
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2332] to-[#2a3a4e] px-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2 pt-8">
          <h1 className="text-2xl font-bold text-[#1a2332]">Licitações Inteligentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de Gestão de Congressos e Cursos
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1a2332] hover:bg-[#2a3a4e] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-sm text-muted-foreground hover:text-[#d4a843] transition-colors"
            >
              Esqueci minha senha
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
