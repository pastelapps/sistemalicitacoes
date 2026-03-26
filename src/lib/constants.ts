import type {
  UserRole,
  CursoStatus,
  PagamentoStatus,
  CredenciamentoStatus,
  EmpenhoStatus,
  CertificadoStatus,
  InscricaoTipo,
} from '@/types/database'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operador: 'Operador de Credenciamento',
}

export const CURSO_STATUS_LABELS: Record<CursoStatus, string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  encerrado: 'Encerrado',
}

export const PAGAMENTO_STATUS_LABELS: Record<PagamentoStatus, string> = {
  pendente: 'Pendente',
  empenho_enviado: 'Empenho Enviado',
  confirmado: 'Confirmado',
}

export const CREDENCIAMENTO_STATUS_LABELS: Record<CredenciamentoStatus, string> = {
  pendente: 'Pendente',
  credenciado: 'Credenciado',
}

export const EMPENHO_STATUS_LABELS: Record<EmpenhoStatus, string> = {
  pendente: 'Pendente',
  recebida: 'Recebida',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

export const CERTIFICADO_STATUS_LABELS: Record<CertificadoStatus, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  falha: 'Falha',
}

export const INSCRICAO_TIPO_LABELS: Record<InscricaoTipo, string> = {
  individual: 'Individual',
  orgao: 'Órgão',
}

export const CURSO_STATUS_COLORS: Record<CursoStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-800',
  ativo: 'bg-green-100 text-green-800',
  encerrado: 'bg-red-100 text-red-800',
}

export const PAGAMENTO_STATUS_COLORS: Record<PagamentoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  empenho_enviado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
}

export const CREDENCIAMENTO_STATUS_COLORS: Record<CredenciamentoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  credenciado: 'bg-green-100 text-green-800',
}

export const EMPENHO_STATUS_COLORS: Record<EmpenhoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  recebida: 'bg-blue-100 text-blue-800',
  aprovada: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800',
}

export const CERTIFICADO_STATUS_COLORS: Record<CertificadoStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-green-100 text-green-800',
  falha: 'bg-red-100 text-red-800',
}

export const UF_OPTIONS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const

export const ORGAO_TIPO_OPTIONS = [
  'Polícia Militar',
  'Polícia Civil',
  'Corpo de Bombeiros',
  'Guarda Municipal',
  'Polícia Federal',
  'Polícia Rodoviária Federal',
  'Secretaria de Segurança',
  'Prefeitura',
  'Governo Estadual',
  'Outro',
] as const

export const ITEMS_PER_PAGE = 20
