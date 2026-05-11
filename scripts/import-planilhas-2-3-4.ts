/**
 * Importa participantes das Planilhas 2, 3 e 4
 *
 * Uso:
 *   npx tsx scripts/import-planilhas-2-3-4.ts          (dry-run)
 *   npx tsx scripts/import-planilhas-2-3-4.ts --commit (commit real)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Inscricao {
  instituicao: string
  cnpj: string // pode ser vazio
  tipo: string
  uf: string
  participante: string
  cpf: string // pode ser vazio
  telefone: string
  email: string
  observacoes: string
}

// Helper para padronizar CPF: pad com zeros à esquerda e formatar
function fmtCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(11, '0').slice(0, 11)
  return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`
}

// ===========================================================================
// PLANILHA 2 — 50% DESCONTO
// ===========================================================================
const PLANILHA_2: Inscricao[] = [
  // Polícia Científica de SC (17)
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Jhonathan Razzini', cpf: fmtCPF('8642312963'), telefone: '48 98467-8089', email: 'jhonathan.razzini@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Aline Peres Panaro', cpf: fmtCPF('5799488970'), telefone: '48 99949-8852', email: 'aline.panaro@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Thomas Edson Regis de Melo', cpf: fmtCPF('8029141955'), telefone: '48 99655-1189', email: 'thomas.melo@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Cláudia Maria Nunes Saad Fávero', cpf: fmtCPF('81184638934'), telefone: '48 99142-9002', email: 'claudia.favero@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Keline Bronner Lopes', cpf: fmtCPF('8474676940'), telefone: '48 99814-9035', email: 'keline.lopes@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Maria Júlia das Chagas', cpf: fmtCPF('8844494914'), telefone: '48 99918-6183', email: 'maria.chagas@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Lia Flávia Rosa Polli', cpf: fmtCPF('6826246910'), telefone: '48 99991-9131', email: 'lia.polli@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Thiago Alexandre Pereira', cpf: fmtCPF('6304019939'), telefone: '48 99953-1823', email: 'thiago.pereira@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Glaciela Eger da Silva', cpf: fmtCPF('806562935'), telefone: '48 98467-1109', email: 'glaciela.silva@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Luiza Polidoro Aguiar', cpf: fmtCPF('6562011930'), telefone: '48 99980-1549', email: 'luiza.aguiar@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Ronierison Guedes da Silva', cpf: fmtCPF('1664071008'), telefone: '55 99659-6555', email: 'ronierison.silva@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Sarah Silva Fernandes', cpf: fmtCPF('7952858920'), telefone: '48 99134-2840', email: 'sarah.fernandes@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Letícia Melo de Souza', cpf: fmtCPF('8838374988'), telefone: '48 99990-0633', email: 'leticia.souza@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Marco Aurélio Godofredo Artmann', cpf: fmtCPF('7704541943'), telefone: '45 99962-6424', email: 'marco.artmann@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Eduardo Toshiyuki Missao', cpf: fmtCPF('36080163845'), telefone: '48 98414-8303', email: 'eduardo.missao@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Thayse Patrícia Kraus', cpf: fmtCPF('5650671923'), telefone: '48 99689-4254', email: 'thayse.kraus@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Fernanda dos Reis Guaresi', cpf: fmtCPF('5361196940'), telefone: '48 99102-0999', email: 'fernanda.guaresi@policiacientifica.sc.gov.br', observacoes: '50% DESCONTO' },

  // Corpo de Bombeiros Militar SC (4)
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Dyell Orelo', cpf: '065.643.099-02', telefone: '48 99965-9015', email: 'bm7aux3@cbm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Raul Laureano', cpf: '063.721.779-94', telefone: '48 99914-5741', email: 'licitacao6@cbm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Jacob Vilain Neto', cpf: '070.815.989-35', telefone: '48 99901-6016', email: 'licitacao8@cbm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Edson Henrique Veran', cpf: '346.773.489-87', telefone: '48 99914-2559', email: 'bm7nuproj@cbm.sc.gov.br', observacoes: '50% DESCONTO' },

  // Polícia Militar SC (17)
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Danielle Galiazzi', cpf: '066.598.749-84', telefone: '48 99133-1330', email: 'eppm@pm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Luis Mateus Moreschi', cpf: '037.050.629-48', telefone: '47 98824-5980', email: 'luismateus.eppm@pm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Franciane Prazeres', cpf: '045.263.819-42', telefone: '48 98446-0881', email: 'franciane.eppm@pm.sc.gov.br', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Augusto César da Silva', cpf: '026.242.609-94', telefone: '48 98416-6449', email: 'augusto.pmsc@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Humberto Porto Mapelli', cpf: '056.145.429-90', telefone: '48 99919-8225', email: 'pmscdalfcmb@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Fabiano Renê Farias', cpf: '029.138.689-08', telefone: '48 99907-1188', email: 'fabiano.rene@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Alessandra de Freitas', cpf: '036.160.279-00', telefone: '48 98468-8468', email: 'alessandra.f@outlook.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Renata Bousfield', cpf: '058.342.619-06', telefone: '48 99607-8372', email: 'rebousfield@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rodrigo Leonildo Cordeiro', cpf: '038.505.469-69', telefone: '48 99193-2090', email: 'rodrigolcordeiro33@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Jossohá Menegaz da Silva', cpf: '028.190.019-12', telefone: '48 98411-9001', email: 'jossohamenegaz@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rodrigo Ramos dos Santos', cpf: '075.043.529-18', telefone: '48 99999-7131', email: 'rodrigormsantos@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rafael Domingos da Silva Neto', cpf: '009.139.509-71', telefone: '48 98420-0060', email: 'rn.pmacapital@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Felipe Rios Bitencourt', cpf: '100.207.396-05', telefone: '48 99208-1414', email: 'ferb640@hotmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Alex Sandro Amaral', cpf: '051.142.819-76', telefone: '48 98417-2126', email: 'buffon-amaral@hotmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Marcos Pedro Licínio', cpf: '072.732.309-10', telefone: '48 99619-8889', email: 'mplicinio@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Tércio Caldas Neves', cpf: '021.582.691-46', telefone: '48 99120-1987', email: '9330550@gmail.com', observacoes: '50% DESCONTO' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Geovani Luz Fraga', cpf: '086.530.059-35', telefone: '48 99658-6730', email: 'geovanifraga@hotmail.com', observacoes: '50% DESCONTO' },
]

// ===========================================================================
// PLANILHA 3 — CORTESIA CONGRESSISTA
// ===========================================================================
const PLANILHA_3: Inscricao[] = [
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina - Fundo Estadual', cnpj: '35.651.852/0001-23', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Sandro Fonseca', cpf: fmtCPF('94038813991'), telefone: '48 8801-5968', email: 'sandrofonseca73@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina - Fundo Estadual', cnpj: '35.651.852/0001-23', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Rogério Nappi Correia', cpf: fmtCPF('3171512904'), telefone: '49 9937-2828', email: 'rogerio.nappi@policiacientifica.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Elouise Bittencourt', cpf: '948.384.299-91', telefone: '48 99989-8828', email: 'elouise.fibb@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Luiz Philipi Calegari', cpf: '075.412.089-90', telefone: '49 99126-4036', email: 'luiz.calegari@policitacientifica.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Suelen Paula Cizinande', cpf: '058.463.919-82', telefone: '49 99126-4036', email: 'suelen.cizinande@policiacientifica.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Leonardo Rincon S. Baccin', cpf: '044.567.679-52', telefone: '48 99643-7173', email: 'segurancaescolar@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Fernando da Silva Kahl', cpf: '072.796.619-71', telefone: '48 98808-9679', email: 'fernandookahl@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Moises José Lopes', cpf: fmtCPF('71599428920'), telefone: '48 9350-5881', email: 'moiseslopesph@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Marcos Paulo Comachio', cpf: '006.062.429-96', telefone: '49 99923-5084', email: 'comachiomarcos@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Daniel Broering Fortes dos Santos', cpf: '006.122.589-47', telefone: '48 98449-2567', email: 'cpmaalmoxarifado@pm.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Carlos Alberto da Rocha Junior', cpf: '987.854.789-20', telefone: '48 99157-9043', email: 'rochapmsc@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Letícia Kuhn', cpf: '048.238.139-60', telefone: '48 98471-5992', email: 'leticiakuhn@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Fernando Magoga Conde', cpf: fmtCPF('1144747023'), telefone: '49 99182-4549', email: 'cpmadivisaoadmch@pm.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Felipe Souza Dutra', cpf: '007.398.919-36', telefone: '48 99132-8881', email: '927395@pm.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Geraldo Marcelo de Souza', cpf: '', telefone: '48 98418-3251', email: '917372@pm.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'SECRETARIA DE ESTADO DA ADMINISTRAÇÃO DE SANTA CATARINA', cnpj: '82.951.351/0001-42', tipo: 'Secretaria de Administração', uf: 'SC', participante: 'Francieli Alves Correa', cpf: '861.927.799-53', telefone: '47 98836-2353', email: 'francieli.correa@sea.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Daiana da Luz', cpf: '007.495.059-23', telefone: '48 98822-0255', email: 'daianaluz@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'SECRETARIA DE ESTADO DA ADMINISTRAÇÃO DE SANTA CATARINA', cnpj: '82.951.351/0001-42', tipo: 'Secretaria de Administração', uf: 'SC', participante: 'Vanessa dos Santos Godinho', cpf: '825.594.220-34', telefone: '48 99656-9001', email: 'vanessa.godinho@sea.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'SECRETARIA DE ESTADO DA ADMINISTRAÇÃO DE SANTA CATARINA', cnpj: '82.951.351/0001-42', tipo: 'Secretaria de Administração', uf: 'SC', participante: 'Nativa Pinto Faccin', cpf: '009.317.599-00', telefone: '', email: 'nativa.faccin@sea.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Priscila Vargas Rodrigues', cpf: '816.016.030-53', telefone: '48 98412-6463', email: 'priscilavr84@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Letícia Nicácio', cpf: '115.873.179-58', telefone: '48 98429-8060', email: 'leticia.nicacio07@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Camila Viana Correia', cpf: '088.778.429-11', telefone: '48 99605-4618', email: 'cvianacoreeia@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Polícia Científica de Santa Catarina', cnpj: '36.127.642/0001-01', tipo: 'Polícia Científica', uf: 'SC', participante: 'Alice Cordeiro da Rosa', cpf: '021.339.122-82', telefone: '48 98494-5949', email: 'alice2003cordeiro@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina - Fundo Estadual', cnpj: '35.651.852/0001-23', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Amanda Pugens', cpf: '047.354.139-44', telefone: '48 99630-6021', email: 'amdpgns@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Gabriela Ventura', cpf: fmtCPF('6303949975'), telefone: '48 98419-8299', email: 'gaby_ventur@hotmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina - Fundo Estadual', cnpj: '35.651.852/0001-23', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Janine Pergher', cpf: fmtCPF('95199659049'), telefone: '48 98844-7007', email: 'janinebock@hotmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina - Fundo Estadual', cnpj: '35.651.852/0001-23', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Maraiza Laurindo', cpf: fmtCPF('4764581965'), telefone: '48 98467-3125', email: 'maraizal20@gmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Bobiquins Estevão de Mello', cpf: '437.720.130-15', telefone: '', email: 'bobiquinsmello@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Sabrina Juttel Mendes', cpf: '094.115.499-85', telefone: '48 98435-8352', email: 'sabrina.juttel@hotmail.com', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Karin Candido dos Santos', cpf: '113.978.909-08', telefone: '48 99681-3683', email: 'karinsantos@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Erlana Pereira da Silva Vieira', cpf: '077.032.884-97', telefone: '', email: 'geapo@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
  { instituicao: 'Secretaria de Estado da Segurança Pública de Santa Catarina', cnpj: '82.951.294/0001-00', tipo: 'Secretaria de Segurança', uf: 'SC', participante: 'Matheus Anjos da Silva', cpf: '094.831.079-03', telefone: '', email: 'geapo@ssp.sc.gov.br', observacoes: 'CORTESIA CONGRESSISTA' },
]

// ===========================================================================
// PLANILHA 4 — CORTESIA (oficiais, sem CPF)
// ===========================================================================
const PLANILHA_4: Inscricao[] = [
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rafael Kadletz', cpf: '', telefone: '48 99946-9200', email: 'rafakadletz@gmail.com', observacoes: 'Ten Coronel CORTESIA' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Fabio Fregapani Silva', cpf: '', telefone: '48 99174-9525', email: 'fabiofregapani@gmail.com', observacoes: 'Ten Coronel CORTESIA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rafael Vicente', cpf: '', telefone: '48 99662-7142', email: 'comandovicente@gmail.com', observacoes: 'Ten Coronel CORTESIA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Jean Carlos Medeiros', cpf: '', telefone: '48 99662-2092', email: 'jeamedeiros@gmail.com', observacoes: 'Ten Coronel CORTESIA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Rudolf Fischer Günther', cpf: '', telefone: '48 99965-0416', email: 'rudolffg@gmail.com', observacoes: 'Major CORTESIA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Ivan Cardoso', cpf: '', telefone: '48 98418-1293', email: 'ivancardoso108@gmail.com', observacoes: 'Major CORTESIA' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Marcos Leandro Marques', cpf: '', telefone: '48 99182-8881', email: 'marcoslmarques@gmail.com', observacoes: 'Major CORTESIA' },
  // Geraldo Rodrigues Alves Junior - DUPLICATA da Planilha 1 - usa CPF da Planilha 1
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Geraldo Rodrigues Alves Junior', cpf: '651.556.379-53', telefone: '47 99975-8429', email: 'grajunior2001@yahoo.com.br', observacoes: 'Major CORTESIA' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Nilton Mendes Nunes Júnior', cpf: '', telefone: '48 99996-8800', email: 'niltonjr020488@hotmail.com', observacoes: 'Capitão CORTESIA' },
  { instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina', cnpj: '06.096.391/0001-76', tipo: 'Corpo de Bombeiros', uf: 'SC', participante: 'Markus Vinicius Silveira', cpf: '', telefone: '48 99968-5640', email: 'markussilveira@gmail.com', observacoes: 'Capitão CORTESIA' },
  { instituicao: 'Polícia Militar do Estado de Santa Catarina', cnpj: '83.931.550/0001-51', tipo: 'Polícia Militar', uf: 'SC', participante: 'Semyrames Pinho Araújo', cpf: '', telefone: '48 98432-4314', email: 'semyrames@gmail.com', observacoes: '1° Tenente CORTESIA' },
]

const ALL_INSCRICOES = [...PLANILHA_2, ...PLANILHA_3, ...PLANILHA_4]

// ===========================================================================
// HELPERS
// ===========================================================================

const cleanCPF = (cpf: string) => cpf.replace(/\D/g, '')
const cleanCNPJ = (cnpj: string) => cnpj.replace(/\D/g, '')

function getStatusPagamento(observacoes: string): 'pendente' | 'empenho_enviado' | 'confirmado' {
  if (observacoes.includes('NOTA DE EMPENHO')) return 'empenho_enviado'
  if (observacoes.includes('CORTESIA') || observacoes.includes('DESCONTO') || observacoes.includes('INDIVIDUAL') || observacoes.includes('INDICADO')) return 'confirmado'
  return 'pendente'
}

// ===========================================================================
// MAIN
// ===========================================================================

async function main() {
  const args = process.argv.slice(2)
  const isCommit = args.includes('--commit')
  const isDryRun = !isCommit

  console.log(`\n${isDryRun ? '🟡 DRY RUN' : '🟢 COMMIT MODE'}\n`)

  // 1. Buscar curso COMPRASEG
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nome')
    .ilike('nome', '%COMPRASEG%')
    .limit(1)

  if (!cursos || cursos.length === 0) {
    console.error('❌ Curso COMPRASEG não encontrado')
    process.exit(1)
  }

  const curso = cursos[0]
  console.log(`✅ Curso: ${curso.nome}\n`)

  // 2. Buscar órgãos existentes
  const { data: existingOrgaos } = await supabase
    .from('orgaos')
    .select('id, nome, cnpj')

  // Mapas: por CNPJ (digits only) e por nome
  const orgaoIdByCnpj = new Map<string, string>()
  const orgaoIdByNome = new Map<string, string>()

  for (const o of existingOrgaos ?? []) {
    const cnpjKey = cleanCNPJ((o as { cnpj: string }).cnpj)
    if (cnpjKey) orgaoIdByCnpj.set(cnpjKey, (o as { id: string }).id)
    orgaoIdByNome.set((o as { nome: string }).nome.toLowerCase().trim(), (o as { id: string }).id)
  }

  // 3. Inserir órgãos novos
  const orgaosUnicos = new Map<string, Inscricao>()
  for (const i of ALL_INSCRICOES) {
    const key = i.cnpj ? `cnpj:${cleanCNPJ(i.cnpj)}` : `nome:${i.instituicao.toLowerCase().trim()}`
    if (!orgaosUnicos.has(key)) orgaosUnicos.set(key, i)
  }

  console.log(`📋 ${orgaosUnicos.size} órgãos únicos nas planilhas\n`)

  for (const [key, sample] of orgaosUnicos) {
    const cnpjDigits = cleanCNPJ(sample.cnpj)
    const nomeKey = sample.instituicao.toLowerCase().trim()

    let id = cnpjDigits ? orgaoIdByCnpj.get(cnpjDigits) : orgaoIdByNome.get(nomeKey)
    if (id) {
      console.log(`  ↻ ${sample.instituicao} (existe)`)
      orgaoIdByCnpj.set(cnpjDigits || key, id)
      orgaoIdByNome.set(nomeKey, id)
      continue
    }

    if (isDryRun) {
      console.log(`  + ${sample.instituicao}`)
      orgaoIdByCnpj.set(cnpjDigits || key, `DRY-${key}`)
      orgaoIdByNome.set(nomeKey, `DRY-${key}`)
      continue
    }

    const { data, error } = await supabase
      .from('orgaos')
      .insert({
        nome: sample.instituicao,
        cnpj: sample.cnpj || '',
        tipo: sample.tipo,
        uf: sample.uf,
        cidade: '',
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ✗ ${sample.instituicao}: ${error.message}`)
      continue
    }
    id = (data as { id: string }).id
    orgaoIdByCnpj.set(cnpjDigits || key, id)
    orgaoIdByNome.set(nomeKey, id)
    console.log(`  ✓ ${sample.instituicao}`)
  }

  // 4. Buscar participantes existentes (por CPF e email)
  const { data: existingParts } = await supabase
    .from('participantes')
    .select('id, nome, cpf, email, orgao_id, observacoes')
    .eq('curso_id', curso.id)

  const partByCPF = new Map<string, { id: string; nome: string }>()
  const partByEmail = new Map<string, { id: string; nome: string }>()

  for (const p of existingParts ?? []) {
    const pp = p as { id: string; nome: string; cpf: string; email: string }
    const cpfKey = cleanCPF(pp.cpf)
    if (cpfKey && cpfKey !== '00000000000') partByCPF.set(cpfKey, { id: pp.id, nome: pp.nome })
    if (pp.email) partByEmail.set(pp.email.toLowerCase().trim(), { id: pp.id, nome: pp.nome })
  }

  // 5. Inserir / atualizar participantes
  console.log(`\n👥 Processando ${ALL_INSCRICOES.length} participantes...\n`)

  let inserted = 0
  let updated = 0
  let errors = 0
  let placeholderCounter = 1

  for (const i of ALL_INSCRICOES) {
    const cnpjDigits = cleanCNPJ(i.cnpj)
    const nomeKey = i.instituicao.toLowerCase().trim()
    const orgaoId = cnpjDigits
      ? orgaoIdByCnpj.get(cnpjDigits)
      : orgaoIdByNome.get(nomeKey)

    if (!orgaoId) {
      console.error(`  ✗ Órgão não encontrado para ${i.participante}`)
      errors++
      continue
    }

    // Detectar existente
    const cpfClean = cleanCPF(i.cpf)
    const emailKey = i.email.toLowerCase().trim()
    const existing =
      (cpfClean && cpfClean !== '00000000000' ? partByCPF.get(cpfClean) : null) ||
      partByEmail.get(emailKey)

    // CPF final (com placeholder se vazio)
    let cpfFinal = i.cpf
    if (!cpfFinal) {
      cpfFinal = `000.000.000-${String(placeholderCounter).padStart(2, '0')}`
      placeholderCounter++
    }

    if (existing) {
      // UPDATE (priorizando dados da planilha mais recente)
      if (isDryRun) {
        console.log(`  ↻ UPDATE: ${i.participante} [${i.observacoes}]`)
        updated++
        continue
      }

      const updateData: Record<string, unknown> = {
        orgao_id: orgaoId,
        nome: i.participante,
        email: i.email,
        telefone: i.telefone,
        observacoes: i.observacoes,
        status_pagamento: getStatusPagamento(i.observacoes),
      }
      // Atualiza CPF só se vier um real (não placeholder)
      if (i.cpf) updateData.cpf = i.cpf

      const { error } = await supabase
        .from('participantes')
        .update(updateData)
        .eq('id', existing.id)

      if (error) {
        console.error(`  ✗ UPDATE ${i.participante}: ${error.message}`)
        errors++
      } else {
        console.log(`  ↻ UPDATE: ${i.participante} [${i.observacoes}]`)
        updated++
      }
      continue
    }

    // INSERT
    if (isDryRun) {
      console.log(`  + INSERT: ${i.participante} [${i.observacoes}]`)
      inserted++
      continue
    }

    const { error } = await supabase.from('participantes').insert({
      curso_id: curso.id,
      orgao_id: orgaoId,
      tipo_inscricao: 'orgao',
      nome: i.participante,
      cpf: cpfFinal,
      email: i.email,
      telefone: i.telefone,
      cargo: null,
      status_pagamento: getStatusPagamento(i.observacoes),
      status_credenciamento: 'pendente',
      observacoes: i.observacoes,
    })

    if (error) {
      console.error(`  ✗ INSERT ${i.participante}: ${error.message}`)
      errors++
    } else {
      console.log(`  + INSERT: ${i.participante} [${i.observacoes}]`)
      inserted++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Total: ${ALL_INSCRICOES.length}`)
  console.log(`Inseridos: ${inserted}`)
  console.log(`Atualizados: ${updated}`)
  console.log(`Erros: ${errors}`)
  console.log(`${'='.repeat(60)}`)

  if (isDryRun) console.log(`\n🟡 DRY RUN — Use --commit para inserir\n`)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
