-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'operador');
CREATE TYPE curso_status AS ENUM ('rascunho', 'ativo', 'encerrado');
CREATE TYPE pagamento_status AS ENUM ('pendente', 'empenho_enviado', 'confirmado');
CREATE TYPE credenciamento_status AS ENUM ('pendente', 'credenciado');
CREATE TYPE empenho_status AS ENUM ('pendente', 'recebida', 'aprovada', 'rejeitada');
CREATE TYPE certificado_status AS ENUM ('pendente', 'enviado', 'falha');
CREATE TYPE inscricao_tipo AS ENUM ('individual', 'orgao');

-- PERFIS DE USUARIO (extensão do auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CURSOS
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ementa TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  horario TEXT,
  local_nome TEXT NOT NULL,
  local_endereco TEXT NOT NULL,
  local_cidade_uf TEXT NOT NULL,
  carga_horaria INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vagas_totais INTEGER,
  status curso_status NOT NULL DEFAULT 'rascunho',
  imagem_capa_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ÓRGÃOS
CREATE TABLE orgaos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  uf TEXT NOT NULL,
  cidade TEXT NOT NULL,
  responsavel_nome TEXT,
  responsavel_email TEXT,
  responsavel_telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PARTICIPANTES
CREATE TABLE participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id),
  orgao_id UUID REFERENCES orgaos(id),
  tipo_inscricao inscricao_tipo NOT NULL DEFAULT 'individual',
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cargo TEXT,
  status_pagamento pagamento_status NOT NULL DEFAULT 'pendente',
  status_credenciamento credenciamento_status NOT NULL DEFAULT 'pendente',
  data_compra TIMESTAMPTZ DEFAULT now(),
  data_credenciamento TIMESTAMPTZ,
  operador_credenciamento_id UUID REFERENCES profiles(id),
  qr_code_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  pdf_ingresso_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cpf, curso_id)
);

-- NOTAS DE EMPENHO
CREATE TABLE notas_empenho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id),
  orgao_id UUID NOT NULL REFERENCES orgaos(id),
  numero_nota TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  qtd_participantes INTEGER NOT NULL,
  arquivo_url TEXT NOT NULL,
  status empenho_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  data_envio TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VÍNCULO NOTA ↔ PARTICIPANTES
CREATE TABLE empenho_participantes (
  empenho_id UUID NOT NULL REFERENCES notas_empenho(id),
  participante_id UUID NOT NULL REFERENCES participantes(id),
  PRIMARY KEY (empenho_id, participante_id)
);

-- CERTIFICADOS
CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID NOT NULL REFERENCES participantes(id) UNIQUE,
  curso_id UUID NOT NULL REFERENCES cursos(id),
  codigo_verificacao TEXT NOT NULL UNIQUE DEFAULT substr(gen_random_uuid()::text, 1, 8),
  pdf_url TEXT,
  status_envio certificado_status NOT NULL DEFAULT 'pendente',
  data_emissao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_participantes_curso ON participantes(curso_id);
CREATE INDEX idx_participantes_orgao ON participantes(orgao_id);
CREATE INDEX idx_participantes_cpf ON participantes(cpf);
CREATE INDEX idx_participantes_qr ON participantes(qr_code_uuid);
CREATE INDEX idx_participantes_status_pag ON participantes(status_pagamento);
CREATE INDEX idx_participantes_status_cred ON participantes(status_credenciamento);
CREATE INDEX idx_notas_empenho_curso ON notas_empenho(curso_id);
CREATE INDEX idx_notas_empenho_orgao ON notas_empenho(orgao_id);
CREATE INDEX idx_certificados_participante ON certificados(participante_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_empenho ENABLE ROW LEVEL SECURITY;
ALTER TABLE empenho_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- Policies: Admin vê tudo
CREATE POLICY "Admin full access" ON cursos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access" ON orgaos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access" ON participantes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Operador read participantes" ON participantes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operador'));

CREATE POLICY "Operador update credenciamento" ON participantes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operador'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operador'));

CREATE POLICY "Admin full access" ON notas_empenho FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access" ON empenho_participantes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access" ON certificados FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users see own profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- FUNÇÕES AUXILIARES
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_curso_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_inscritos', COUNT(*),
    'pagamentos_confirmados', COUNT(*) FILTER (WHERE status_pagamento = 'confirmado'),
    'pagamentos_pendentes', COUNT(*) FILTER (WHERE status_pagamento IN ('pendente', 'empenho_enviado')),
    'credenciados', COUNT(*) FILTER (WHERE status_credenciamento = 'credenciado'),
    'certificados_emitidos', (SELECT COUNT(*) FROM certificados WHERE curso_id = p_curso_id AND status_envio = 'enviado')
  )
  FROM participantes
  WHERE curso_id = p_curso_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- TRIGGER: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_orgaos_updated_at BEFORE UPDATE ON orgaos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_participantes_updated_at BEFORE UPDATE ON participantes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_notas_empenho_updated_at BEFORE UPDATE ON notas_empenho FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- STORAGE BUCKETS (executar manualmente no Supabase Dashboard ou via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('imagens', 'imagens', true);
