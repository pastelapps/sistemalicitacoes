export type UserRole = 'admin' | 'operador'
export type CursoStatus = 'rascunho' | 'ativo' | 'encerrado'
export type PagamentoStatus = 'pendente' | 'empenho_enviado' | 'confirmado'
export type CredenciamentoStatus = 'pendente' | 'credenciado'
export type EmpenhoStatus = 'pendente' | 'recebida' | 'aprovada' | 'rejeitada'
export type CertificadoStatus = 'pendente' | 'enviado' | 'falha'
export type InscricaoTipo = 'individual' | 'orgao'

export interface Profile {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  ultimo_acesso: string | null
  created_at: string
  updated_at: string
}

export interface Curso {
  id: string
  nome: string
  descricao: string | null
  ementa: string
  data_inicio: string
  data_fim: string
  horario: string | null
  local_nome: string
  local_endereco: string
  local_cidade_uf: string
  carga_horaria: number
  valor: number
  vagas_totais: number | null
  status: CursoStatus
  imagem_capa_url: string | null
  created_at: string
  updated_at: string
}

export interface Orgao {
  id: string
  nome: string
  cnpj: string
  tipo: string
  uf: string
  cidade: string
  responsavel_nome: string | null
  responsavel_email: string | null
  responsavel_telefone: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Participante {
  id: string
  curso_id: string
  orgao_id: string | null
  tipo_inscricao: InscricaoTipo
  nome: string
  cpf: string
  email: string
  telefone: string
  cargo: string | null
  status_pagamento: PagamentoStatus
  status_credenciamento: CredenciamentoStatus
  data_compra: string
  data_credenciamento: string | null
  operador_credenciamento_id: string | null
  qr_code_uuid: string
  pdf_ingresso_url: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

// Types with relations (for use in components, not in Database type)
export interface ParticipanteWithRelations extends Participante {
  curso?: Curso
  orgao?: Orgao
}

export interface NotaEmpenho {
  id: string
  curso_id: string
  orgao_id: string
  numero_nota: string
  valor: number
  qtd_participantes: number
  arquivo_url: string
  status: EmpenhoStatus
  observacoes: string | null
  data_envio: string
  created_at: string
  updated_at: string
}

export interface NotaEmpenhoWithRelations extends NotaEmpenho {
  curso?: Curso
  orgao?: Orgao
}

export interface EmpenhoParticipante {
  empenho_id: string
  participante_id: string
}

export interface Certificado {
  id: string
  participante_id: string
  curso_id: string
  codigo_verificacao: string
  pdf_url: string | null
  status_envio: CertificadoStatus
  data_emissao: string
  created_at: string
}

export interface CertificadoWithRelations extends Certificado {
  participante?: Participante
  curso?: Curso
}

// Supabase Database type for type-safe queries
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      cursos: {
        Row: Curso
        Insert: Omit<Curso, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Curso, 'id'>>
      }
      orgaos: {
        Row: Orgao
        Insert: Omit<Orgao, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Orgao, 'id'>>
      }
      participantes: {
        Row: Participante
        Insert: Omit<Participante, 'id' | 'created_at' | 'updated_at' | 'qr_code_uuid' | 'data_compra'> & { id?: string; qr_code_uuid?: string; data_compra?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Participante, 'id'>>
      }
      notas_empenho: {
        Row: NotaEmpenho
        Insert: Omit<NotaEmpenho, 'id' | 'created_at' | 'updated_at' | 'data_envio'> & { id?: string; data_envio?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<NotaEmpenho, 'id'>>
      }
      empenho_participantes: {
        Row: EmpenhoParticipante
        Insert: EmpenhoParticipante
        Update: Partial<EmpenhoParticipante>
      }
      certificados: {
        Row: Certificado
        Insert: Omit<Certificado, 'id' | 'created_at' | 'codigo_verificacao' | 'data_emissao'> & { id?: string; codigo_verificacao?: string; data_emissao?: string; created_at?: string }
        Update: Partial<Omit<Certificado, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: { p_curso_id: string }
        Returns: {
          total_inscritos: number
          pagamentos_confirmados: number
          pagamentos_pendentes: number
          credenciados: number
          certificados_emitidos: number
        }
      }
    }
    Enums: {
      user_role: UserRole
      curso_status: CursoStatus
      pagamento_status: PagamentoStatus
      credenciamento_status: CredenciamentoStatus
      empenho_status: EmpenhoStatus
      certificado_status: CertificadoStatus
      inscricao_tipo: InscricaoTipo
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
