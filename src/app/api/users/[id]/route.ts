import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, email, role, ativo, password } = body

    const supabase = createAdminClient()

    // Atualizar profile
    const profileUpdate: Record<string, unknown> = {}
    if (nome !== undefined) profileUpdate.nome = nome
    if (email !== undefined) profileUpdate.email = email
    if (role !== undefined) profileUpdate.role = role
    if (ativo !== undefined) profileUpdate.ativo = ativo

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate as never)
        .eq('id', id)

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        )
      }
    }

    // Atualizar email no Auth se mudou
    if (email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
        email,
      })

      if (emailError) {
        return NextResponse.json(
          { error: emailError.message },
          { status: 400 }
        )
      }
    }

    // Redefinir senha se fornecida
    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password,
      })

      if (passwordError) {
        return NextResponse.json(
          { error: passwordError.message },
          { status: 400 }
        )
      }
    }

    // Retornar profile atualizado
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedProfile })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
