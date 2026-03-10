export const TipoRecurso = {
  CUSTEIO_MAC: 'Custeio MAC',
  CUSTEIO_PAP: 'Custeio PAP',
  EQUIPAMENTO: 'Equipamento',
  INCREMENTO_MAC: 'Incremento MAC',
  INCREMENTO_PAP: 'Incremento PAP',
  OUTRO: 'Outro',
} as const

export const SituacaoOficial = {
  PAGA: 'Paga',
  EMPENHADA_AGUARDANDO_FORMALIZACAO: 'Empenhada (Aguardando Formalização)',
  FAVORAVEL: 'Favorável',
  EM_ANALISE: 'Em Análise',
  LIBERADO_PAGAMENTO_FNS: 'Liberado Pagamento FNS',
  OUTRA: 'Outra',
} as const

export const StatusInterno = {
  RASCUNHO: 'Rascunho',
  EM_EXECUCAO: 'Em Execução',
  PAGA_SEM_DOCUMENTOS: 'Paga (Sem Documentos)',
  PAGA_COM_PENDENCIAS: 'Paga (Com Pendências)',
  CONCLUIDA: 'Concluída',
  PROPOSTA_PAGA: 'Proposta Paga',
  EM_ANALISE_PAGAMENTO: 'Proposta em Análise de Pagamento',
  APROVADA_PAGAMENTO: 'Proposta aprovada para Pagamento',
  EMPENHADA_AGUARDANDO_FORMALIZACAO:
    'Proposta Empenhada aguardando Formalização',
  AUTORIZADA_AGUARDANDO_EMPENHO: 'Proposta Autorizada aguardando Empenho',
  AGUARDANDO_AUTORIZACAO_FNS: 'Proposta aguardando autorização do FNS',
  PORTARIA_PUBLICADA_AGUARDANDO_FNS:
    'Proposta com Portaria publicada aguardando autorização do FNS',
  ENVIADA_PUBLICACAO_PORTARIA: 'Proposta enviada para publicação de Portaria',
  PROPOSTA_APROVADA: 'Proposta Aprovada',
  CLASSIFICADA_AGUARDANDO_SECRETARIA:
    'Proposta Classificada aguardando autorização Secretaria',
  ANALISE_TECNICA_MERITO: 'Proposta enviada para Análise Técnica de Mérito',
} as const

export const AuditCategories = {
  SERVICOS_TERCEIROS: 'SERVIÇOS TERCEIROS (PJ)',
  MATERIAL_CONSUMO: 'MATERIAL DE CONSUMO',
  DISTRIBUICAO_GRATUITA: 'DISTRIBUIÇÃO GRATUITA',
  EQUIPAMENTOS: 'EQUIPAMENTOS',
  OUTROS: 'OUTROS',
} as const

export const TipoEmenda = {
  individual: 'Individual',
  bancada: 'Bancada',
  comissao: 'Comissão',
  programa: 'Programa',
} as const

export type TipoRecursoEnum = keyof typeof TipoRecurso
export type SituacaoOficialEnum = keyof typeof SituacaoOficial
export type StatusInternoEnum = keyof typeof StatusInterno
export type TipoEmendaEnum = keyof typeof TipoEmenda
export type AuditCategoryEnum =
  (typeof AuditCategories)[keyof typeof AuditCategories]

export type Amendment = {
  id: string
  tipo: TipoEmendaEnum
  tipo_recurso: TipoRecursoEnum
  autor: string
  parlamentar: string
  numero_emenda: string
  numero_proposta: string
  valor_total: number
  situacao: SituacaoOficialEnum
  status_interno: StatusInternoEnum
  portaria: string | null
  deliberacao_cie: string | null
  created_at: string
  total_repassado: number
  total_gasto: number
  anexos_essenciais: boolean
  ano_exercicio: number
  // Co-authorship fields
  segundo_autor?: string | null
  segundo_parlamentar?: string | null
  valor_segundo_responsavel?: number | null
  // Origin field
  origem?: 'FEDERAL' | 'ESTADUAL'
}

export type Repasse = {
  id: string
  data: string
  valor: number
  fonte: string
  comprovante_url?: string
  status: 'REPASSADO' | 'PENDENTE' | 'CANCELADO'
  observacoes?: string
  ordem_bancaria?: string
}

export type Despesa = {
  id: string
  data: string
  valor: number
  categoria: string
  descricao: string
  nota_fiscal_url?: string
  registrada_por: string
  autorizada_por?: string
  responsavel_execucao?: string
  unidade_destino: string
  fornecedor_nome: string
  status_execucao: 'PLANEJADA' | 'EMPENHADA' | 'LIQUIDADA' | 'PAGA'
  demanda?: string
  destinacao_id?: string | null
}

export type Anexo = {
  id: string
  tipo:
    | 'PORTARIA'
    | 'DELIBERACAO_CIE'
    | 'COMPROVANTE_FNS'
    | 'NOTA_FISCAL'
    | 'OFICIO'
    | 'PROPOSTA'
    | 'OUTRO'
  filename: string
  url: string
  created_at: string
  uploader: string
  data?: string
  size?: number
  metadata?: any
}

export type Historico = {
  id: string
  emenda_id: string
  evento: string
  detalhe: string
  feito_por: string
  criado_em: string
}

export type Pendencia = {
  id: string
  descricao: string
  dispensada: boolean
  resolvida?: boolean
  justificativa?: string
  targetType: 'field' | 'tab' | 'anexo'
  targetId: string
}

export type Destination = {
  id: string
  acao_id: string
  tipo_destinacao: string
  subtipo?: string
  valor_destinado: number
  portaria_vinculada?: string
  observacao_tecnica?: string
  grupo_despesa?: string
}

export type Action = {
  id: string
  emenda_id: string
  nome_acao: string
  area: string
  complexidade?: string
  publico_alvo?: string
  descricao_oficial?: string
}

export type ActionWithDestinations = Action & {
  destinacoes: Destination[]
}

export type DetailedAmendment = Amendment & {
  descricao_completa: string
  repasses: Repasse[]
  despesas: Despesa[]
  anexos: Anexo[]
  historico: Historico[]
  pendencias: Pendencia[]
  acoes: ActionWithDestinations[]
  natureza?: string
  objeto_emenda?: string
  meta_operacional?: string
  destino_recurso?: string
  data_repasse?: string
  valor_repasse?: number
  situacao_recurso?: string
  observacoes?: string
}

export type UserRole = 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'CONSULTA'
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'PENDENTE'

export type User = {
  id: string
  name: string
  email: string
  cpf?: string
  role: UserRole
  cargo_id?: string
  unidade?: string
  status: UserStatus
  created_at: string
  password?: string
  inactivity_timeout?: number
}

export type Cargo = {
  id: string
  nome: string
  descricao?: string
  default_role?: UserRole
  active: boolean
}

export type AuditLog = {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_by: string
  changed_at: string
  details: string
}

export const getAmendmentDetails = (
  id: string,
): DetailedAmendment | undefined => {
  return undefined
}

export const mockCargos: Cargo[] = []
export const mockUsers: User[] = []
export const mockAuditLogs: AuditLog[] = []
export const amendments: Amendment[] = []
