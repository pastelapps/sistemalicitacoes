/**
 * Script de importação das inscrições COMPRASEG 2026
 *
 * Uso:
 *   npx tsx scripts/import-inscricoes.ts --dry-run   (apenas mostra o que seria inserido)
 *   npx tsx scripts/import-inscricoes.ts --commit    (insere de verdade)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ===========================================================================
// DADOS EXTRAÍDOS DO PDF "INSCRIÇÕES COMPRASEG.pdf"
// ===========================================================================

interface Inscricao {
  instituicao: string
  cnpj: string
  tipo: string
  uf: string
  resp_nome: string
  resp_telefone: string
  resp_email: string
  participante: string
  cpf: string
  telefone: string
  email: string
  observacoes: string
}

const INSCRICOES: Inscricao[] = [
  // POLÍCIA MILITAR DA PARAÍBA - Nota de Empenho
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DA PARAÍBA', cnpj: '08.907.776/0008-78', tipo: 'Polícia Militar', uf: 'PB', resp_nome: 'Maj PM Manaly Duarte', resp_telefone: '83 988017354', resp_email: 'agenciacontratacaopmpb@gmail.com', participante: 'Onierbeth Elias de Oliveira', cpf: '008.042.264-07', telefone: '83 98802-5969', email: 'onierbeth@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DA PARAÍBA', cnpj: '08.907.776/0008-78', tipo: 'Polícia Militar', uf: 'PB', resp_nome: 'Maj PM Manaly Duarte', resp_telefone: '83 988017354', resp_email: 'agenciacontratacaopmpb@gmail.com', participante: 'Nilvan Alves Filho', cpf: '068.088.664-81', telefone: '83 987737475', email: 'nilvanfilho1@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DA PARAÍBA', cnpj: '08.907.776/0008-78', tipo: 'Polícia Militar', uf: 'PB', resp_nome: 'Maj PM Manaly Duarte', resp_telefone: '83 988017354', resp_email: 'agenciacontratacaopmpb@gmail.com', participante: 'Luiz Antonio do Nascimento', cpf: '018.398.684-90', telefone: '83 98802-6018', email: 'luizz1.nascimento@gmail.com', observacoes: 'NOTA DE EMPENHO' },

  // SECRETARIA DA SEGURANÇA PÚBLICA DE TOCANTINS
  { instituicao: 'SECRETARIA DA SEGURANÇA PÚBLICA DE TOCANTINS', cnpj: '25.053.109/0001-18', tipo: 'Secretaria de Segurança', uf: 'TO', resp_nome: 'Verônica Ribeiro', resp_telefone: '63 992335043', resp_email: 'planejamentodgpc@gmail.com', participante: 'Roger Knewitz', cpf: '800.284.621-49', telefone: '63 98472-3335', email: 'roger.knewitz@pc.to.gov.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DA SEGURANÇA PÚBLICA DE TOCANTINS', cnpj: '25.053.109/0001-18', tipo: 'Secretaria de Segurança', uf: 'TO', resp_nome: 'Verônica Ribeiro', resp_telefone: '63 992335043', resp_email: 'planejamentodgpc@gmail.com', participante: 'Mariana Rodrigues Lopes Morais Lima', cpf: '033.881.711-57', telefone: '63 98109-0193', email: 'mariana.rodrigues@pc.to.gov.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DA SEGURANÇA PÚBLICA DE TOCANTINS', cnpj: '25.053.109/0001-18', tipo: 'Secretaria de Segurança', uf: 'TO', resp_nome: 'Verônica Ribeiro', resp_telefone: '63 992335043', resp_email: 'planejamentodgpc@gmail.com', participante: 'Verônica Ribeiro Santos', cpf: '026.167.551-65', telefone: '63 99233-5043', email: 'veronicaribeirosantos02@gmail.com', observacoes: 'NOTA DE EMPENHO' },

  // POLÍCIA CIVIL DO RIO DE JANEIRO
  { instituicao: 'SECRETARIA DE ESTADO DE POLÍCIA CIVIL DO RIO DE JANEIRO', cnpj: '32.855.236/0001-04', tipo: 'Polícia Civil', uf: 'RJ', resp_nome: 'Rodrigo Santos', resp_telefone: '21 984197353', resp_email: 'contratacaosepol01@gmail.com', participante: 'Rodrigo Lopes Muniz Santos', cpf: '119.443.597-10', telefone: '21 984197353', email: 'rodrigovxz@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DE POLÍCIA CIVIL DO RIO DE JANEIRO', cnpj: '32.855.236/0001-04', tipo: 'Polícia Civil', uf: 'RJ', resp_nome: 'Rodrigo Santos', resp_telefone: '21 984197353', resp_email: 'contratacaosepol01@gmail.com', participante: 'Ana Carla Machado Mansur de Moraes', cpf: '085.025.657-70', telefone: '21 979668283', email: 'anacarla_m3@yahoo.com.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DE POLÍCIA CIVIL DO RIO DE JANEIRO', cnpj: '32.855.236/0001-04', tipo: 'Polícia Civil', uf: 'RJ', resp_nome: 'Rodrigo Santos', resp_telefone: '21 984197353', resp_email: 'contratacaosepol01@gmail.com', participante: 'Renata Correia Brum dos Santos', cpf: '110.761.697-24', telefone: '21 984841985', email: 'renatacbds@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DE POLÍCIA CIVIL DO RIO DE JANEIRO', cnpj: '32.855.236/0001-04', tipo: 'Polícia Civil', uf: 'RJ', resp_nome: 'Rodrigo Santos', resp_telefone: '21 984197353', resp_email: 'contratacaosepol01@gmail.com', participante: 'Luana Ferreira do Nascimento dos Santos', cpf: '153.695.167-66', telefone: '21 967373927', email: 'luanaferreira.s38@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DE POLÍCIA CIVIL DO RIO DE JANEIRO', cnpj: '32.855.236/0001-04', tipo: 'Polícia Civil', uf: 'RJ', resp_nome: 'Rodrigo Santos', resp_telefone: '21 984197353', resp_email: 'contratacaosepol01@gmail.com', participante: 'Denise Bitencourt Rocha Pinto', cpf: '052.999.557-31', telefone: '21 987227395', email: 'denisebrp@gmail.com', observacoes: 'NOTA DE EMPENHO' },

  // CÂMARA DOS DEPUTADOS
  { instituicao: 'CÂMARA DOS DEPUTADOS - DIRETORIA GERAL DE BRASÍLIA', cnpj: '00.530.352/0001-59', tipo: 'Polícia Federal', uf: 'DF', resp_nome: 'Luiz Daher', resp_telefone: '61 998670834', resp_email: 'treinamento.depol@camara.leg.br', participante: 'Kassius Sebastiam Martins Guimarães', cpf: '821.284.721-72', telefone: '61 985503245', email: 'kassiusguimaraes@gmail.com', observacoes: 'NOTA DE EMPENHO' },

  // TCE-SC
  { instituicao: 'TRIBUNAL DE CONTAS DO ESTADO DE SANTA CATARINA', cnpj: '83.279.448/0001-13', tipo: 'Governo Estadual', uf: 'SC', resp_nome: 'Rebeca Martin', resp_telefone: '48 988088392', resp_email: 'rebeca.martin@tcesc.tc.br', participante: 'Herlon Martins Ferreira', cpf: '889.100.759-53', telefone: '47 988379794', email: 'herlon_m_ferreira@hotmail.com', observacoes: 'NOTA DE EMPENHO' },

  // GUARDA MUNICIPAL DE BALNEÁRIO CAMBORIÚ
  { instituicao: 'GUARDA MUNICIPAL DE BALNEÁRIO CAMBORIÚ', cnpj: '63.932.187/0001-81', tipo: 'Guarda Municipal', uf: 'SC', resp_nome: 'Sorin Junior', resp_telefone: '47 99059203', resp_email: 'jaildo.junior@bc.sc.gov.br', participante: 'Jaildo Rosa Junior', cpf: '071.160.309-05', telefone: '47 999059203', email: 'jaildo.jr@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'GUARDA MUNICIPAL DE BALNEÁRIO CAMBORIÚ', cnpj: '63.932.187/0001-81', tipo: 'Guarda Municipal', uf: 'SC', resp_nome: 'Sorin Junior', resp_telefone: '47 99059203', resp_email: 'jaildo.junior@bc.sc.gov.br', participante: 'Geraldo Rodrigues Alves Junior', cpf: '651.556.379-53', telefone: '47 99758429', email: 'grajunior2001@yahoo.com.br', observacoes: 'NOTA DE EMPENHO' },

  // SEA-SC
  { instituicao: 'SECRETARIA DE ESTADO DA ADMINISTRAÇÃO DE SANTA CATARINA', cnpj: '82.951.351/0001-42', tipo: 'Secretaria de Administração', uf: 'SC', resp_nome: 'Janaina Alberti', resp_telefone: '49 999174404', resp_email: 'janaina.alberti@sea.sc.gov.br', participante: 'Ramiro Passos Cavalheiro', cpf: '041.089.289-03', telefone: '48 999666681', email: 'ramiro.cavalheiro@sea.sc.gov.br', observacoes: 'NOTA DE EMPENHO' },

  // ACADEMIA SEGURANÇA CEARÁ
  { instituicao: 'ACADEMIA ESTADUAL DE SEGURANÇA PÚBLICA DO CEARÁ', cnpj: '12.244.903/0001-05', tipo: 'Secretaria de Segurança', uf: 'CE', resp_nome: 'Emanuela Pinheiro', resp_telefone: '85 989342895', resp_email: 'emanuela.pinheiro@aesp.ce.gov.br', participante: 'Jamille dos Santos de Moura', cpf: '036.602.843-00', telefone: '85 99196-4391', email: 'jamille.moura@aesp.ce.gov.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'ACADEMIA ESTADUAL DE SEGURANÇA PÚBLICA DO CEARÁ', cnpj: '12.244.903/0001-05', tipo: 'Secretaria de Segurança', uf: 'CE', resp_nome: 'Emanuela Pinheiro', resp_telefone: '85 989342895', resp_email: 'emanuela.pinheiro@aesp.ce.gov.br', participante: 'Emanuela dos Santos Pinheiro', cpf: '001.131.293-94', telefone: '85 98934-2895', email: 'emanuela.pinheiro@aesp.ce.gov.br', observacoes: 'NOTA DE EMPENHO' },

  // SEJUSP - AMAPÁ (15 participantes)
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Rafael dos Santos Santos', cpf: '942.739.362-91', telefone: '96 99113-8261', email: 'oficialpmaprafaelsantos@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Luiz Mateus Ferreira dos Santos', cpf: '016.007.162-37', telefone: '96 981103827', email: 'luizmateus2016@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Elen Vitória Chagas de Medeiros', cpf: '031.101.062-80', telefone: '96 981443389', email: 'elenvitoriamedeiros@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Oliene Isabel Sarmento Corrêa', cpf: '693.099.652-15', telefone: '96 98425-3561', email: 'olieneisabel@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Iara Nery Figueiredo', cpf: '025.788.972-80', telefone: '96 99913-7250', email: 'figueiredony@yahoo.com.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Brunno Raynner de Moraes Loreiro', cpf: '754.858.422-91', telefone: '96 991568165', email: 'brunoloreiro33@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Karolina Freitas Gomes', cpf: '018.561.982-78', telefone: '96 981443453', email: 'karolinafreitasap@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Danielle Silva dos Santos Barreiros', cpf: '010.911.642-90', telefone: '96 991040453', email: 'daniellebarreiros29@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Herisvane Medina', cpf: '415.258.682-68', telefone: '96 98101-8322', email: 'herisvane@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Kelly do Rosário Lima', cpf: '729.129.102-00', telefone: '96 98119-9288', email: 'kelly.rosalima@outlook.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Patrícia Tavares do Carmo', cpf: '804.982.212-53', telefone: '96 99117-0021', email: 'pattycontabil1986@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Sandro Barrozo Sanches', cpf: '415.762.682-68', telefone: '96 99151-1185', email: 'sandro.sanches@hotmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Anna Elayse Monteiro Lobato', cpf: '432.233.892-53', telefone: '96 98119-3322', email: 'anna.lobato@policiacientifica.ap.gov.br', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Rafaele Branco dos Santos Couto', cpf: '876.369.722-04', telefone: '96 991330303', email: 'rafaelevasco.adv@gmail.com', observacoes: 'NOTA DE EMPENHO' },
  { instituicao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11', tipo: 'Secretaria de Segurança', uf: 'AP', resp_nome: 'Iara Nery', resp_telefone: '96 999137250', resp_email: 'dl@pm.ap.gov.br', participante: 'Márcio Bastos Teixeira', cpf: '741.127.242-68', telefone: '96 99123-1839', email: 'bmarcio17@hotmail.com', observacoes: 'NOTA DE EMPENHO' },

  // ITAIPU BINACIONAL - INSCRIÇÃO INDIVIDUAL
  { instituicao: 'ITAIPU BINACIONAL', cnpj: '00.395.988/0012-98', tipo: 'Empresa Privada', uf: 'PR', resp_nome: 'José Antônio de Freitas', resp_telefone: '45 3520-6748', resp_email: 'JOSEANT@itaipu.gov.br', participante: 'Domingos Otaviano Fonteles Neto', cpf: '338.796.053-00', telefone: '45 98311-1642', email: 'dofneto@itaipu.gov.br', observacoes: 'INSCRIÇÃO INDIVIDUAL' },
  { instituicao: 'ITAIPU BINACIONAL', cnpj: '00.395.988/0012-98', tipo: 'Empresa Privada', uf: 'PR', resp_nome: 'José Antônio de Freitas', resp_telefone: '45 3520-6748', resp_email: 'JOSEANT@itaipu.gov.br', participante: 'Tiago Luis Brugnera', cpf: '009.574.129-16', telefone: '45 99948-9728', email: 'brugnera@itaipu.gov.br', observacoes: 'INSCRIÇÃO INDIVIDUAL' },

  // POLÍCIA PENAL DO ESPÍRITO SANTO - CORTESIA
  { instituicao: 'POLÍCIA PENAL DO ESPÍRITO SANTO', cnpj: '53.378.820/0001-88', tipo: 'Convidado Congressista', uf: 'ES', resp_nome: 'Fernanda Magnago', resp_telefone: '27 999921992', resp_email: 'fernanda.albuquerque@pp.es.gov.br', participante: 'Fernanda Magnago Teixeira de Albuquerque', cpf: '055.331.867-51', telefone: '27 999921992', email: 'ceciliamagnago24@gmail.com', observacoes: 'CORTESIA Raquel' },
  { instituicao: 'POLÍCIA PENAL DO ESPÍRITO SANTO', cnpj: '53.378.820/0001-88', tipo: 'Convidado Congressista', uf: 'ES', resp_nome: 'Fernanda Magnago', resp_telefone: '27 999921992', resp_email: 'fernanda.albuquerque@pp.es.gov.br', participante: 'Juliana Samara Molaes', cpf: '134.388.077-77', telefone: '27 998256548', email: 'Juliana.molaes@gmail.com', observacoes: 'CORTESIA Raquel' },

  // SP SECRETARIA ADMIN PENITENCIÁRIA
  { instituicao: 'SECRETARIA DA ADMINISTRAÇÃO PENITENCIÁRIA - SÃO PAULO', cnpj: '96.291.141/0001-80', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Tiago Martins Matos Paternosti', resp_telefone: '11 946559928', resp_email: 'Rgranja@sp.gov.br', participante: 'Tiago Martins Matos Paternosti', cpf: '316.079.898-40', telefone: '11 946559928', email: 'tiagoboladeneve@hotmail.com', observacoes: 'CORTESIA Frigeri' },

  // PRF DF
  { instituicao: 'DEPARTAMENTO DE POLÍCIA RODOVIÁRIA FEDERAL DE BRASÍLIA', cnpj: '00.394.494/0104-41', tipo: 'Convidado Congressista', uf: 'DF', resp_nome: 'Roberto Ferreira Barbosa', resp_telefone: '62 999011534', resp_email: 'roberto@goldendome.com.br', participante: 'Roberto Ferreira Barbosa', cpf: '838.292.961-34', telefone: '62 999011534', email: 'robertofb@gmail.com', observacoes: 'CORTESIA Frigeri' },

  // GOLDEN DOME
  { instituicao: 'GOLDEN DOME COMÉRCIO DE EQUIPAMENTOS TÁTICOS LTDA', cnpj: '43.135.107/0001-50', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Guilherme Kasper', resp_telefone: '11 982781111', resp_email: 'guilherme@goldendome.com.br', participante: 'Guilherme Kasper dos Santos', cpf: '019.227.639-50', telefone: '11 982781111', email: 'guilhermekasper@terra.com.br', observacoes: 'CORTESIA Frigeri' },

  // PMPB - Cortesia
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DA PARAÍBA', cnpj: '08.907.776/0008-78', tipo: 'Convidado Congressista', uf: 'PB', resp_nome: 'Major Benedict', resp_telefone: '83 991945214', resp_email: 'benedictpmpb@gmail.com', participante: 'Benedict Pontes Soares Onias', cpf: '084.209.644-25', telefone: '83 991945214', email: 'benedictpmpb@gmail.com', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DA PARAÍBA', cnpj: '08.907.776/0008-78', tipo: 'Convidado Congressista', uf: 'PB', resp_nome: 'Major Benedict', resp_telefone: '83 991945214', resp_email: 'edher1307@hotmail.com', participante: 'Édher Lúcio dos Santos Almeida', cpf: '007.985.304-80', telefone: '83 988310495', email: 'edher1307@hotmail.com', observacoes: 'CORTESIA Frigeri' },

  // SENASP
  { instituicao: 'SECRETARIA NACIONAL DE SEGURANÇA PÚBLICA - SENASP', cnpj: '00.394.494/0005-60', tipo: 'Convidado Congressista', uf: 'DF', resp_nome: 'Cap Wohnrath', resp_telefone: '16 988374540', resp_email: 'proseguranca@mj.gov.br', participante: 'Lucas Eddris Lyra Moniz', cpf: '037.377.951-85', telefone: '61 982494111', email: 'lucas.moniz@mj.gov.br', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'SECRETARIA NACIONAL DE SEGURANÇA PÚBLICA - SENASP', cnpj: '00.394.494/0005-60', tipo: 'Convidado Congressista', uf: 'DF', resp_nome: 'Cap Wohnrath', resp_telefone: '16 988374540', resp_email: 'proseguranca@mj.gov.br', participante: 'Francisco Carlos Wohnrath Monteiro', cpf: '977.145.851-53', telefone: '16 988374540', email: 'ten.wohnrath.pmrv@gmail.com', observacoes: 'CORTESIA Frigeri' },

  // PMSP - Cortesia (5)
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', cnpj: '04.198.514/0001-54', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Michel Willian Lopes Barbosa Adorno', resp_telefone: '11 977030666', resp_email: 'michelwillian455@gmail.com', participante: 'Michel Willian Lopes Barbosa Adorno', cpf: '119.770.306-66', telefone: '11 977030666', email: 'michelwillian455@gmail.com', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', cnpj: '04.198.514/0001-54', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Michel Willian Lopes Barbosa Adorno', resp_telefone: '11 977030666', resp_email: 'michelwillian455@gmail.com', participante: 'Rafael Cruz do Rosário', cpf: '252.203.988-14', telefone: '13 991262273', email: 'rafael.rosario105642@gmail.com', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', cnpj: '04.198.514/0001-54', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Michel Willian Lopes Barbosa Adorno', resp_telefone: '11 977030666', resp_email: 'michelwillian455@gmail.com', participante: 'Thiago Vieira de Lucena', cpf: '368.689.568-43', telefone: '11 964976905', email: 'thicena@icloud.com', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', cnpj: '04.198.514/0001-54', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Michel Willian Lopes Barbosa Adorno', resp_telefone: '11 977030666', resp_email: 'michelwillian455@gmail.com', participante: 'Willian Thiago Cunha', cpf: '294.402.988-63', telefone: '11 950644220', email: 'wthiagocunha@outlook.com', observacoes: 'CORTESIA Frigeri' },
  { instituicao: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO', cnpj: '04.198.514/0001-54', tipo: 'Convidado Congressista', uf: 'SP', resp_nome: 'Michel Willian Lopes Barbosa Adorno', resp_telefone: '11 977030666', resp_email: 'michelwillian455@gmail.com', participante: 'Natan Mateus Martinez Corveloni', cpf: '409.622.508-80', telefone: '18 996912203', email: 'corveloni_pm@hotmail.com', observacoes: 'CORTESIA Frigeri' },

  // INDICAÇÃO EMPRESA
  { instituicao: 'NOBEL PRECISION LTDA', cnpj: '13.532.398/0001-59', tipo: 'Indicação congressista', uf: 'GO', resp_nome: 'Ester Maciel', resp_telefone: '61 992039953', resp_email: 'ester.maciel@nobelprecision.com.br', participante: 'João da Cunha Neto', cpf: '052.960.979-71', telefone: '47 999366585', email: 'joao-neto@pc.sc.gov.br', observacoes: 'INDICADO PELA EMPRESA' },
  { instituicao: 'FUNCIONAL TECHNOLOGICAL GARMENT LTDA', cnpj: '02.777.319/0001-53', tipo: 'Indicação congressista', uf: 'SC', resp_nome: 'Marketing Funcional - Graziela', resp_telefone: '47 35165358', resp_email: 'gestao.marketing@funcionaluniformes.com.br', participante: 'Carlos Henrique Kuhnen', cpf: '086.293.009-06', telefone: '47 98855-2740', email: 'licitacoes@funcionaluniformes.com.br', observacoes: 'INDICADO PELA EMPRESA' },
  { instituicao: 'ASSOCIAÇÃO BARRIGA VERDE DOS OFICIAIS MILITARES ESTADUAIS DE SANTA CATARINA', cnpj: '78.266.889/0001-40', tipo: 'Indicação congressista', uf: 'SC', resp_nome: 'Cel Claudete Lehmkuhl', resp_telefone: '48 96199157', resp_email: 'secretaria@abvo.com.br', participante: 'Renato Lehmkuhl Thiesen', cpf: '072.406.749-32', telefone: '48 99671-0088', email: '934035@pm.sc.gov.br', observacoes: 'INDICADO PELA EMPRESA' },
]

// ===========================================================================
// HELPERS
// ===========================================================================

const cleanCPF = (cpf: string) => cpf.replace(/\D/g, '')
const cleanCNPJ = (cnpj: string) => cnpj.replace(/\D/g, '')
const normalizePhone = (phone: string) => phone.replace(/\D/g, '')

function getStatusPagamento(observacoes: string): 'pendente' | 'empenho_enviado' | 'confirmado' {
  if (observacoes.includes('NOTA DE EMPENHO')) return 'empenho_enviado'
  if (observacoes.includes('CORTESIA') || observacoes.includes('INDICADO') || observacoes.includes('INDIVIDUAL')) return 'confirmado'
  return 'pendente'
}

function getTipoInscricao(observacoes: string): 'individual' | 'orgao' {
  return observacoes.includes('INSCRIÇÃO INDIVIDUAL') ? 'individual' : 'orgao'
}

// ===========================================================================
// MAIN
// ===========================================================================

async function main() {
  const args = process.argv.slice(2)
  const isCommit = args.includes('--commit')
  const isDryRun = !isCommit
  const shouldWipe = args.includes('--wipe')

  console.log(`\n${isDryRun ? '🟡 DRY RUN' : '🟢 COMMIT MODE'}${shouldWipe ? ' + WIPE' : ''}\n`)

  // 1. Buscar curso COMPRASEG 2026
  const { data: cursos, error: cursoErr } = await supabase
    .from('cursos')
    .select('id, nome')
    .ilike('nome', '%COMPRASEG%')
    .limit(1)

  if (cursoErr || !cursos || cursos.length === 0) {
    console.error('❌ Curso COMPRASEG não encontrado:', cursoErr)
    process.exit(1)
  }

  const curso = cursos[0]
  console.log(`✅ Curso encontrado: ${curso.nome} (id=${curso.id})`)

  // 1.5 Limpar participantes existentes (se --wipe)
  if (shouldWipe) {
    const { data: existing } = await supabase
      .from('participantes')
      .select('id, nome')
      .eq('curso_id', curso.id)

    console.log(`\n🧹 Apagando ${existing?.length ?? 0} participantes existentes do curso...`)

    if (existing && existing.length > 0) {
      const ids = existing.map((p: { id: string }) => p.id)

      if (isCommit) {
        // Apagar certificados primeiro (FK)
        const { error: certErr } = await supabase
          .from('certificados')
          .delete()
          .in('participante_id', ids)
        if (certErr) console.error('  ✗ Erro ao apagar certificados:', certErr.message)

        // Apagar vínculos com empenhos
        const { error: empPartErr } = await supabase
          .from('empenho_participantes')
          .delete()
          .in('participante_id', ids)
        if (empPartErr) console.error('  ✗ Erro ao apagar empenho_participantes:', empPartErr.message)

        // Apagar participantes
        const { error: partErr } = await supabase
          .from('participantes')
          .delete()
          .in('id', ids)
        if (partErr) {
          console.error('  ✗ Erro ao apagar participantes:', partErr.message)
          process.exit(1)
        }
        console.log(`  ✓ ${ids.length} participantes apagados`)
      } else {
        for (const p of existing) console.log(`  - ${p.nome}`)
      }
    }
  }

  // 2. Agrupar por CNPJ → upsert órgãos
  const orgaosMap = new Map<string, typeof INSCRICOES[0]>()
  for (const i of INSCRICOES) {
    const key = cleanCNPJ(i.cnpj)
    if (!orgaosMap.has(key)) orgaosMap.set(key, i)
  }

  console.log(`\n📋 ${orgaosMap.size} órgãos únicos, ${INSCRICOES.length} participantes\n`)

  const orgaoIdByCnpj = new Map<string, string>()

  // Verificar órgãos já existentes
  const { data: existingOrgaos } = await supabase
    .from('orgaos')
    .select('id, cnpj')

  const existingByCnpj = new Map(
    (existingOrgaos ?? []).map((o: { id: string; cnpj: string }) => [cleanCNPJ(o.cnpj), o.id])
  )

  for (const [cnpj, sample] of orgaosMap) {
    const existing = existingByCnpj.get(cnpj)
    if (existing) {
      orgaoIdByCnpj.set(cnpj, existing as string)
      console.log(`  ↻ ${sample.instituicao} — já existe`)
      continue
    }

    if (isDryRun) {
      console.log(`  + ${sample.instituicao}`)
      orgaoIdByCnpj.set(cnpj, 'DRY-RUN-' + cnpj)
      continue
    }

    const { data, error } = await supabase
      .from('orgaos')
      .insert({
        nome: sample.instituicao,
        cnpj: sample.cnpj,
        tipo: sample.tipo,
        uf: sample.uf,
        cidade: '',
        responsavel_nome: sample.resp_nome,
        responsavel_email: sample.resp_email,
        responsavel_telefone: sample.resp_telefone,
        observacoes: sample.observacoes,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ✗ Erro ao inserir ${sample.instituicao}:`, error.message)
      continue
    }
    orgaoIdByCnpj.set(cnpj, data!.id)
    console.log(`  ✓ ${sample.instituicao}`)
  }

  // 3. Inserir participantes
  console.log(`\n👥 Inserindo participantes...\n`)

  const { data: existingParts } = await supabase
    .from('participantes')
    .select('id, cpf, curso_id')
    .eq('curso_id', curso.id)

  const existingCPFs = new Set(
    (existingParts ?? []).map((p: { cpf: string }) => cleanCPF(p.cpf))
  )

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const i of INSCRICOES) {
    const cpfClean = cleanCPF(i.cpf)
    if (existingCPFs.has(cpfClean)) {
      console.log(`  ↻ ${i.participante} — já existe`)
      skipped++
      continue
    }

    const orgaoId = orgaoIdByCnpj.get(cleanCNPJ(i.cnpj))!

    if (isDryRun) {
      console.log(`  + ${i.participante} [${i.observacoes}]`)
      inserted++
      continue
    }

    const { error } = await supabase.from('participantes').insert({
      curso_id: curso.id,
      orgao_id: orgaoId,
      tipo_inscricao: getTipoInscricao(i.observacoes),
      nome: i.participante,
      cpf: i.cpf,
      email: i.email,
      telefone: i.telefone,
      cargo: null,
      status_pagamento: getStatusPagamento(i.observacoes),
      status_credenciamento: 'pendente',
      observacoes: i.observacoes,
    })

    if (error) {
      console.error(`  ✗ Erro ao inserir ${i.participante}:`, error.message)
      errors++
    } else {
      console.log(`  ✓ ${i.participante} [${i.observacoes}]`)
      inserted++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Total: ${INSCRICOES.length}`)
  console.log(`Inseridos: ${inserted}`)
  console.log(`Já existentes (pulados): ${skipped}`)
  console.log(`Erros: ${errors}`)
  console.log(`${'='.repeat(60)}`)

  if (isDryRun) {
    console.log(`\n🟡 DRY RUN — nada foi inserido. Para inserir, rode com --commit\n`)
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
