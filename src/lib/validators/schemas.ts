import { z } from 'zod'
import { cpf as cpfValidator, cnpj as cnpjValidator } from 'cpf-cnpj-validator'

// Custom validators
const cpfSchema = z.string().refine((val) => cpfValidator.isValid(val.replace(/\D/g, '')), {
  message: 'CPF inválido',
})

const cnpjSchema = z.string().refine((val) => cnpjValidator.isValid(val.replace(/\D/g, '')), {
  message: 'CNPJ inválido',
})

// Login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

// Curso
export const cursoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ementa: z.string().min(1, 'Ementa é obrigatória'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  horario: z.string().optional(),
  local_nome: z.string().min(1, 'Nome do local é obrigatório'),
  local_endereco: z.string().min(1, 'Endereço é obrigatório'),
  local_cidade_uf: z.string().min(1, 'Cidade/UF é obrigatório'),
  carga_horaria: z.string().min(1, 'Carga horária é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  vagas_totais: z.string().optional().nullable(),
  status: z.enum(['rascunho', 'ativo', 'encerrado']),
}).refine((data) => {
  if (data.data_inicio && data.data_fim) {
    return new Date(data.data_fim) >= new Date(data.data_inicio)
  }
  return true
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['data_fim'],
})

// Órgão
export const orgaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: cnpjSchema,
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  uf: z.string().min(2, 'UF é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  responsavel_nome: z.string().optional(),
  responsavel_email: z.string().email('Email inválido').optional().or(z.literal('')),
  responsavel_telefone: z.string().optional(),
  observacoes: z.string().optional(),
})

// Participante
export const participanteSchema = z.object({
  curso_id: z.string().uuid('Selecione um curso'),
  orgao_id: z.string().uuid('Selecione um órgão').optional().nullable(),
  tipo_inscricao: z.enum(['individual', 'orgao']),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: cpfSchema,
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cargo: z.string().optional(),
  status_pagamento: z.enum(['pendente', 'empenho_enviado', 'confirmado']).optional(),
  observacoes: z.string().optional(),
}).refine((data) => {
  if (data.tipo_inscricao === 'orgao' && !data.orgao_id) {
    return false
  }
  return true
}, {
  message: 'Órgão é obrigatório para inscrição por órgão',
  path: ['orgao_id'],
})

// Participante em lote
export const participanteLoteItemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: cpfSchema,
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cargo: z.string().optional(),
})

export const participanteLoteSchema = z.object({
  curso_id: z.string().uuid('Selecione um curso'),
  orgao_id: z.string().uuid('Selecione um órgão'),
  participantes: z.array(participanteLoteItemSchema).min(1, 'Adicione ao menos 1 participante'),
})

// Nota de Empenho
export const notaEmpenhoSchema = z.object({
  curso_id: z.string().uuid('Selecione um curso'),
  orgao_id: z.string().uuid('Selecione um órgão'),
  numero_nota: z.string().min(1, 'Número da nota é obrigatório'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  qtd_participantes: z.string().min(1, 'Quantidade é obrigatória'),
  status: z.enum(['pendente', 'recebida', 'aprovada', 'rejeitada']),
  observacoes: z.string().optional(),
})

// Usuário
export const usuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'operador']),
  ativo: z.boolean(),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').optional(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

// Types
export type LoginFormData = z.infer<typeof loginSchema>
export type CursoFormData = z.infer<typeof cursoSchema>
export type OrgaoFormData = z.infer<typeof orgaoSchema>
export type ParticipanteFormData = z.infer<typeof participanteSchema>
export type ParticipanteLoteFormData = z.infer<typeof participanteLoteSchema>
export type NotaEmpenhoFormData = z.infer<typeof notaEmpenhoSchema>
export type UsuarioFormData = z.infer<typeof usuarioSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
