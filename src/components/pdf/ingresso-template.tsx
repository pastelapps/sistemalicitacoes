import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '2px solid #1e3a5f',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginTop: 8,
  },
  cursoNome: {
    fontSize: 12,
    color: '#1e3a5f',
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginBottom: 8,
    borderBottom: '1px solid #ccc',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    width: 120,
    color: '#555',
  },
  value: {
    flex: 1,
    color: '#1a1a1a',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrCode: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginTop: 8,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1px solid #ccc',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  footerBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
})

export interface IngressoData {
  participante: {
    nome: string
    cpf: string
    email: string
    telefone: string
    cargo: string | null
    qr_code_uuid: string
  }
  curso: {
    nome: string
    data_inicio: string
    data_fim: string
    horario: string | null
    local_nome: string
    local_endereco: string
    local_cidade_uf: string
    carga_horaria: number
  }
  orgao: {
    nome: string
  } | null
  qrDataUrl: string
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

export function IngressoTemplate({ participante, curso, orgao, qrDataUrl }: IngressoData) {
  const codigoAlfa = 'CS2026-' + participante.qr_code_uuid.substring(0, 6).toUpperCase()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Licitações Inteligentes</Text>
          <Text style={styles.headerSubtitle}>COMPROVANTE DE INSCRICAO</Text>
          <Text style={styles.cursoNome}>{curso.nome}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Participante</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{participante.nome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{formatCPF(participante.cpf)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>E-mail:</Text>
            <Text style={styles.value}>{participante.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefone:</Text>
            <Text style={styles.value}>{participante.telefone}</Text>
          </View>
          {orgao && (
            <View style={styles.row}>
              <Text style={styles.label}>Orgao:</Text>
              <Text style={styles.value}>{orgao.nome}</Text>
            </View>
          )}
          {participante.cargo && (
            <View style={styles.row}>
              <Text style={styles.label}>Cargo:</Text>
              <Text style={styles.value}>{participante.cargo}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Curso</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Curso:</Text>
            <Text style={styles.value}>{curso.nome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Periodo:</Text>
            <Text style={styles.value}>
              {formatDateBR(curso.data_inicio)} a {formatDateBR(curso.data_fim)}
            </Text>
          </View>
          {curso.horario && (
            <View style={styles.row}>
              <Text style={styles.label}>Horario:</Text>
              <Text style={styles.value}>{curso.horario}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Local:</Text>
            <Text style={styles.value}>
              {curso.local_nome} - {curso.local_endereco}, {curso.local_cidade_uf}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carga Horaria:</Text>
            <Text style={styles.value}>{curso.carga_horaria} horas</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          <Image style={styles.qrImage} src={qrDataUrl} />
          <Text style={styles.qrCode}>{codigoAlfa}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBold}>
            Apresente este documento no credenciamento
          </Text>
          <Text style={styles.footerText}>
            Licitações Inteligentes - Cursos e Treinamentos para Seguranca Publica
          </Text>
          <Text style={styles.footerText}>
            contato@licitacoesinteligentes.com.br | www.licitacoesinteligentes.com.br
          </Text>
        </View>
      </Page>
    </Document>
  )
}
