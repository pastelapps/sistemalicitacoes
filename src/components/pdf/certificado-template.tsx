import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1a1a1a',
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    border: '3px solid #1e3a5f',
  },
  borderInner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: '1px solid #8ba4c4',
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  companyName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    letterSpacing: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 30,
    letterSpacing: 3,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 1.8,
    textAlign: 'center',
    maxWidth: 600,
    color: '#333',
    marginBottom: 30,
  },
  nome: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#1e3a5f',
    marginBottom: 20,
    textDecoration: 'underline',
  },
  emissao: {
    fontSize: 11,
    color: '#555',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 35,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  footerLine: {
    width: 200,
    borderBottom: '1px solid #1e3a5f',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 9,
    color: '#888',
  },
  codigoVerificacao: {
    fontSize: 8,
    color: '#999',
    marginTop: 8,
    letterSpacing: 1,
  },
})

export interface CertificadoData {
  participante: {
    nome: string
    cpf: string
  }
  curso: {
    nome: string
    data_inicio: string
    data_fim: string
    local_nome: string
    local_cidade_uf: string
    carga_horaria: number
  }
  codigo_verificacao: string
  data_emissao: string
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

export function CertificadoTemplate({
  participante,
  curso,
  codigo_verificacao,
  data_emissao,
}: CertificadoData) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.borderInner} />

        <View style={styles.content}>
          <Text style={styles.companyName}>Licitações Inteligentes</Text>
          <Text style={styles.title}>CERTIFICADO DE PARTICIPACAO</Text>

          <Text style={styles.nome}>{participante.nome}</Text>

          <Text style={styles.bodyText}>
            Certificamos que {participante.nome}, portador(a) do CPF{' '}
            {formatCPF(participante.cpf)}, participou do curso {curso.nome},
            realizado no periodo de {formatDateBR(curso.data_inicio)} a{' '}
            {formatDateBR(curso.data_fim)}, em {curso.local_nome} -{' '}
            {curso.local_cidade_uf}, com carga horaria total de{' '}
            {curso.carga_horaria} horas.
          </Text>

          <Text style={styles.emissao}>
            Data de emissao: {formatDateBR(data_emissao)}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            Licitações Inteligentes - Cursos e Treinamentos para Seguranca Publica
          </Text>
          <Text style={styles.codigoVerificacao}>
            Codigo de verificacao: {codigo_verificacao}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
