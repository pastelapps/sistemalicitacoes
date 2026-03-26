import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'

interface ExportRequest {
  tipo: 'inscritos' | 'pagamentos' | 'credenciamento' | 'certificados' | 'orgaos'
  filtros: {
    curso_id?: string
    orgao_id?: string
    status?: string
    data_inicio?: string
    data_fim?: string
  }
}

interface ParticipanteRow {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  cargo: string | null
  status_pagamento: string
  status_credenciamento: string
  data_compra: string
  data_credenciamento: string | null
  curso?: { nome: string; valor: number }
  orgao?: { nome: string }
}

interface CertificadoRow {
  id: string
  codigo_verificacao: string
  status_envio: string
  data_emissao: string
  participante?: { nome: string; cpf: string; email: string }
  curso?: { nome: string }
}

const STATUS_PAGAMENTO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  empenho_enviado: 'Empenho Enviado',
  confirmado: 'Confirmado',
}

const STATUS_CREDENCIAMENTO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  credenciado: 'Credenciado',
}

const STATUS_CERTIFICADO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  falha: 'Falha',
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatDateBR(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function applyHeaderStyle(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A2332' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { tipo, filtros } = body

    const supabase = createAdminClient()
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Licitações Inteligentes'
    workbook.created = new Date()

    if (tipo === 'inscritos') {
      const sheet = workbook.addWorksheet('Inscritos')

      let query = supabase
        .from('participantes')
        .select('*, curso:cursos(*), orgao:orgaos(*)')
        .order('nome')

      if (filtros.curso_id) query = query.eq('curso_id', filtros.curso_id)
      if (filtros.orgao_id) query = query.eq('orgao_id', filtros.orgao_id)
      if (filtros.status) query = query.eq('status_pagamento', filtros.status)
      if (filtros.data_inicio) query = query.gte('data_compra', filtros.data_inicio)
      if (filtros.data_fim) query = query.lte('data_compra', filtros.data_fim)

      const { data } = (await query) as { data: ParticipanteRow[] | null }
      const rows = data ?? []

      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 35 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telefone', key: 'telefone', width: 18 },
        { header: 'Cargo', key: 'cargo', width: 20 },
        { header: 'Orgao', key: 'orgao', width: 30 },
        { header: 'Curso', key: 'curso', width: 35 },
        { header: 'Data Compra', key: 'data_compra', width: 15 },
        { header: 'Status Pagamento', key: 'status_pagamento', width: 20 },
        { header: 'Status Credenciamento', key: 'status_credenciamento', width: 22 },
      ]

      applyHeaderStyle(sheet)

      rows.forEach((row) => {
        sheet.addRow({
          nome: row.nome,
          cpf: formatCPF(row.cpf),
          email: row.email,
          telefone: row.telefone,
          cargo: row.cargo ?? '',
          orgao: row.orgao?.nome ?? '',
          curso: row.curso?.nome ?? '',
          data_compra: formatDateBR(row.data_compra),
          status_pagamento: STATUS_PAGAMENTO_LABELS[row.status_pagamento] ?? row.status_pagamento,
          status_credenciamento: STATUS_CREDENCIAMENTO_LABELS[row.status_credenciamento] ?? row.status_credenciamento,
        })
      })
    }

    if (tipo === 'pagamentos') {
      const sheet = workbook.addWorksheet('Pagamentos')

      let query = supabase
        .from('participantes')
        .select('*, curso:cursos(*), orgao:orgaos(*)')
        .order('nome')

      if (filtros.curso_id) query = query.eq('curso_id', filtros.curso_id)
      if (filtros.status) query = query.eq('status_pagamento', filtros.status)
      if (filtros.data_inicio) query = query.gte('data_compra', filtros.data_inicio)
      if (filtros.data_fim) query = query.lte('data_compra', filtros.data_fim)

      const { data } = (await query) as { data: ParticipanteRow[] | null }
      const rows = data ?? []

      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 35 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Curso', key: 'curso', width: 35 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Data Compra', key: 'data_compra', width: 15 },
        { header: 'Status Pagamento', key: 'status_pagamento', width: 20 },
      ]

      applyHeaderStyle(sheet)

      rows.forEach((row) => {
        sheet.addRow({
          nome: row.nome,
          cpf: formatCPF(row.cpf),
          email: row.email,
          curso: row.curso?.nome ?? '',
          valor: row.curso?.valor ? formatCurrencyBR(row.curso.valor) : '',
          data_compra: formatDateBR(row.data_compra),
          status_pagamento: STATUS_PAGAMENTO_LABELS[row.status_pagamento] ?? row.status_pagamento,
        })
      })

      // Summary row
      const confirmados = rows.filter((r) => r.status_pagamento === 'confirmado').length
      const pendentes = rows.filter((r) => r.status_pagamento === 'pendente').length
      sheet.addRow({})
      sheet.addRow({ nome: 'RESUMO' })
      sheet.addRow({ nome: 'Total de registros', cpf: String(rows.length) })
      sheet.addRow({ nome: 'Pagamentos confirmados', cpf: String(confirmados) })
      sheet.addRow({ nome: 'Pagamentos pendentes', cpf: String(pendentes) })
    }

    if (tipo === 'credenciamento') {
      const sheet = workbook.addWorksheet('Credenciamento')

      let query = supabase
        .from('participantes')
        .select('*, curso:cursos(*), orgao:orgaos(*)')
        .order('nome')

      if (filtros.curso_id) query = query.eq('curso_id', filtros.curso_id)
      if (filtros.orgao_id) query = query.eq('orgao_id', filtros.orgao_id)

      const { data } = (await query) as { data: ParticipanteRow[] | null }
      const rows = data ?? []

      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 35 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Orgao', key: 'orgao', width: 30 },
        { header: 'Curso', key: 'curso', width: 35 },
        { header: 'Status Credenciamento', key: 'status_credenciamento', width: 22 },
        { header: 'Data Credenciamento', key: 'data_credenciamento', width: 20 },
      ]

      applyHeaderStyle(sheet)

      rows.forEach((row) => {
        sheet.addRow({
          nome: row.nome,
          cpf: formatCPF(row.cpf),
          orgao: row.orgao?.nome ?? '',
          curso: row.curso?.nome ?? '',
          status_credenciamento: STATUS_CREDENCIAMENTO_LABELS[row.status_credenciamento] ?? row.status_credenciamento,
          data_credenciamento: row.data_credenciamento ? formatDateBR(row.data_credenciamento) : '',
        })
      })

      const credenciados = rows.filter((r) => r.status_credenciamento === 'credenciado').length
      const ausentes = rows.filter((r) => r.status_credenciamento === 'pendente').length
      sheet.addRow({})
      sheet.addRow({ nome: 'RESUMO' })
      sheet.addRow({ nome: 'Total credenciados', cpf: String(credenciados) })
      sheet.addRow({ nome: 'Total ausentes', cpf: String(ausentes) })
    }

    if (tipo === 'certificados') {
      const sheet = workbook.addWorksheet('Certificados')

      let query = supabase
        .from('certificados')
        .select('*, participante:participantes(*), curso:cursos(*)')
        .order('data_emissao', { ascending: false })

      if (filtros.curso_id) query = query.eq('curso_id', filtros.curso_id)
      if (filtros.status) query = query.eq('status_envio', filtros.status)

      const { data } = (await query) as { data: CertificadoRow[] | null }
      const rows = data ?? []

      sheet.columns = [
        { header: 'Participante', key: 'participante', width: 35 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Curso', key: 'curso', width: 35 },
        { header: 'Codigo Verificacao', key: 'codigo', width: 25 },
        { header: 'Data Emissao', key: 'data_emissao', width: 15 },
        { header: 'Status Envio', key: 'status_envio', width: 15 },
      ]

      applyHeaderStyle(sheet)

      rows.forEach((row) => {
        sheet.addRow({
          participante: row.participante?.nome ?? '',
          cpf: row.participante?.cpf ? formatCPF(row.participante.cpf) : '',
          email: row.participante?.email ?? '',
          curso: row.curso?.nome ?? '',
          codigo: row.codigo_verificacao,
          data_emissao: formatDateBR(row.data_emissao),
          status_envio: STATUS_CERTIFICADO_LABELS[row.status_envio] ?? row.status_envio,
        })
      })
    }

    if (tipo === 'orgaos') {
      const sheet = workbook.addWorksheet('Por Orgao')

      let query = supabase
        .from('participantes')
        .select('*, orgao:orgaos(*)')
        .order('nome')

      if (filtros.curso_id) query = query.eq('curso_id', filtros.curso_id)

      const { data } = (await query) as {
        data: Array<{ status_pagamento: string; orgao?: { nome: string } }> | null
      }

      const orgaoMap = new Map<
        string,
        { nome: string; total: number; confirmados: number; pendentes: number; empenho_enviado: number }
      >()

      ;(data ?? []).forEach((p) => {
        const orgaoNome = p.orgao?.nome ?? 'Individual'
        const existing = orgaoMap.get(orgaoNome)
        if (existing) {
          existing.total++
          if (p.status_pagamento === 'confirmado') existing.confirmados++
          else if (p.status_pagamento === 'empenho_enviado') existing.empenho_enviado++
          else existing.pendentes++
        } else {
          orgaoMap.set(orgaoNome, {
            nome: orgaoNome,
            total: 1,
            confirmados: p.status_pagamento === 'confirmado' ? 1 : 0,
            empenho_enviado: p.status_pagamento === 'empenho_enviado' ? 1 : 0,
            pendentes: p.status_pagamento === 'pendente' ? 1 : 0,
          })
        }
      })

      const resumo = Array.from(orgaoMap.values()).sort((a, b) => b.total - a.total)

      sheet.columns = [
        { header: 'Orgao', key: 'nome', width: 40 },
        { header: 'Total Inscritos', key: 'total', width: 18 },
        { header: 'Confirmados', key: 'confirmados', width: 15 },
        { header: 'Empenho Enviado', key: 'empenho_enviado', width: 18 },
        { header: 'Pendentes', key: 'pendentes', width: 15 },
      ]

      applyHeaderStyle(sheet)

      resumo.forEach((row) => {
        sheet.addRow(row)
      })

      // Totals row
      const totalRow = sheet.addRow({
        nome: 'TOTAL',
        total: resumo.reduce((s, r) => s + r.total, 0),
        confirmados: resumo.reduce((s, r) => s + r.confirmados, 0),
        empenho_enviado: resumo.reduce((s, r) => s + r.empenho_enviado, 0),
        pendentes: resumo.reduce((s, r) => s + r.pendentes, 0),
      })
      totalRow.font = { bold: true }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer as ArrayBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=relatorio-${tipo}.xlsx`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatorio' },
      { status: 500 }
    )
  }
}
