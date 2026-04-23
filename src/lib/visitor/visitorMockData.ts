import type {
  Amendment,
  Cargo,
  User,
  Repasse,
  Despesa,
  Pendencia,
  Action,
  Destination,
  DetailedAmendment,
} from '@/lib/mock-data'

// ─── Cargos ────────────────────────────────────────────────────────────────
export const VISITOR_CARGOS: Cargo[] = [
  { id: 'cargo-001', nome: 'Gestor de Emendas', descricao: 'Responsável pelo gerenciamento de emendas parlamentares', default_role: 'GESTOR', active: true },
  { id: 'cargo-002', nome: 'Analista Financeiro', descricao: 'Análise e execução financeira das emendas', default_role: 'ANALISTA', active: true },
  { id: 'cargo-003', nome: 'Consultor Técnico', descricao: 'Suporte técnico e consulta de informações', default_role: 'CONSULTA', active: true },
  { id: 'cargo-004', nome: 'Administrador do Sistema', descricao: 'Acesso total ao sistema', default_role: 'ADMIN', active: true },
]

// ─── Usuários ───────────────────────────────────────────────────────────────
export const VISITOR_USERS: User[] = [
  { id: 'user-001', name: 'João Paulo Ferreira', email: 'joao.ferreira@saude.gov.br', role: 'GESTOR', cargo_id: 'cargo-001', unidade: 'COORDENAÇÃO DE EMENDAS', status: 'ATIVO', created_at: '2025-01-10T08:00:00Z', inactivity_timeout: 60 },
  { id: 'user-002', name: 'Maria das Graças Silva', email: 'maria.silva@saude.gov.br', role: 'ANALISTA', cargo_id: 'cargo-002', unidade: 'FINANCEIRO', status: 'ATIVO', created_at: '2025-02-15T09:30:00Z', inactivity_timeout: 60 },
  { id: 'user-003', name: 'Carlos Eduardo Souza', email: 'carlos.souza@saude.gov.br', role: 'CONSULTA', cargo_id: 'cargo-003', unidade: 'TÉCNICO', status: 'ATIVO', created_at: '2025-03-20T11:00:00Z', inactivity_timeout: 60 },
  { id: 'user-visitante', name: 'Visitante Demo', email: 'visitante@demo.local', role: 'CONSULTA', cargo_id: 'cargo-003', unidade: 'VISITANTE', status: 'ATIVO', created_at: new Date().toISOString(), inactivity_timeout: 60 },
]

// ─── Emendas ────────────────────────────────────────────────────────────────
export const VISITOR_EMENDAS: Amendment[] = [
  {
    id: 'emenda-001',
    numero_emenda: '71270009',
    numero_proposta: '36000695728202500',
    autor: 'Ricardo Brandão',
    parlamentar: 'Ricardo Brandão',
    tipo: 'bancada',
    tipo_recurso: 'INCREMENTO_MAC',
    valor_total: 24112360.00,
    situacao: 'PAGA',
    status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 8.108, 15/09/2025',
    deliberacao_cie: 'Deliberação Nº 307 de 29/08/2025',
    anexos_essenciais: true,
    ano_exercicio: 2025,
    origem: 'FEDERAL',
    created_at: '2025-12-03T14:20:20Z',
    total_repassado: 24112360.00,
    total_gasto: 24112360.00,
    segundo_autor: 'Letícia Vasconcelos',
    segundo_parlamentar: 'Letícia Vasconcelos',
    valor_segundo_responsavel: 1000000,
    objeto_emenda: 'Incremento temporário ao custeio dos serviços de Atenção Primária à Saúde.',
  },
  {
    id: 'emenda-002',
    numero_emenda: '29790008',
    numero_proposta: '11447284000125019',
    autor: 'Ricardo Brandão',
    parlamentar: 'Ricardo Brandão',
    tipo: 'individual',
    tipo_recurso: 'EQUIPAMENTO',
    valor_total: 3882500.00,
    situacao: 'LIBERADO_PAGAMENTO_FNS',
    status_interno: 'AGUARDANDO_AUTORIZACAO_FNS',
    portaria: null,
    deliberacao_cie: 'DELIBERAÇÃO CIE Nº 098/2025',
    anexos_essenciais: false,
    ano_exercicio: 2025,
    origem: 'FEDERAL',
    created_at: '2025-12-03T13:30:40Z',
    total_repassado: 1054000.00,
    total_gasto: 1054000.00,
    objeto_emenda: 'Aquisição de equipamentos odontológicos para a rede municipal.',
  },
  {
    id: 'emenda-003',
    numero_emenda: '52840012',
    numero_proposta: '33002922000136045',
    autor: 'Senadora Helena Paiva',
    parlamentar: 'Senadora Helena Paiva',
    tipo: 'individual',
    tipo_recurso: 'CUSTEIO_MAC',
    valor_total: 1200000.00,
    situacao: 'FAVORAVEL',
    status_interno: 'PROPOSTA_APROVADA',
    portaria: 'P. GM/MS Nº 7.954, 02/07/2025',
    deliberacao_cie: 'Deliberação Nº 281 de 10/06/2025',
    anexos_essenciais: true,
    ano_exercicio: 2025,
    origem: 'FEDERAL',
    created_at: '2025-11-10T10:00:00Z',
    total_repassado: 1200000.00,
    total_gasto: 980000.00,
    objeto_emenda: 'Custeio de serviços de média e alta complexidade ambulatorial.',
  },
  {
    id: 'emenda-004',
    numero_emenda: '61930004',
    numero_proposta: '44900871000192003',
    autor: 'Deputado Marcos Cavalcante',
    parlamentar: 'Deputado Marcos Cavalcante',
    tipo: 'comissao',
    tipo_recurso: 'CUSTEIO_PAP',
    valor_total: 350000.00,
    situacao: 'EM_ANALISE',
    status_interno: 'ANALISE_TECNICA_MERITO',
    portaria: null,
    deliberacao_cie: null,
    anexos_essenciais: false,
    ano_exercicio: 2025,
    origem: 'ESTADUAL',
    created_at: '2026-01-15T09:00:00Z',
    total_repassado: 0,
    total_gasto: 0,
  },
  {
    id: 'emenda-005',
    numero_emenda: '38110017',
    numero_proposta: '55601123000144088',
    autor: 'Deputado Paulo Henrique Mota',
    parlamentar: 'Deputado Paulo Henrique Mota',
    tipo: 'individual',
    tipo_recurso: 'INCREMENTO_MAC',
    valor_total: 2500000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO',
    status_interno: 'AUTORIZADA_AGUARDANDO_EMPENHO',
    portaria: 'P. GM/MS Nº 8.312, 05/11/2025',
    deliberacao_cie: 'Deliberação Nº 330 de 15/10/2025',
    anexos_essenciais: true,
    ano_exercicio: 2025,
    origem: 'FEDERAL',
    created_at: '2025-10-20T14:00:00Z',
    total_repassado: 2500000.00,
    total_gasto: 1100000.00,
  },
  {
    id: 'emenda-006', numero_emenda: '41520011', numero_proposta: '22100456000178012',
    autor: 'Deputada Fernanda Queiroz', parlamentar: 'Deputada Fernanda Queiroz',
    tipo: 'individual', tipo_recurso: 'CUSTEIO_MAC', valor_total: 890000.00,
    situacao: 'PAGA', status_interno: 'CONCLUIDA',
    portaria: 'P. GM/MS Nº 7.890, 20/05/2025', deliberacao_cie: 'Deliberação Nº 265 de 05/05/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-09-15T08:30:00Z', total_repassado: 890000.00, total_gasto: 890000.00,
  },
  {
    id: 'emenda-007', numero_emenda: '58730022', numero_proposta: '33400789000145067',
    autor: 'Senador Cláudio Mendonça', parlamentar: 'Senador Cláudio Mendonça',
    tipo: 'bancada', tipo_recurso: 'INCREMENTO_MAC', valor_total: 4200000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO', status_interno: 'EM_EXECUCAO',
    portaria: 'P. GM/MS Nº 8.455, 12/12/2025', deliberacao_cie: 'Deliberação Nº 345 de 01/12/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-08-20T11:00:00Z', total_repassado: 2100000.00, total_gasto: 1500000.00,
    segundo_autor: 'Dep. Vinícius Andrade', segundo_parlamentar: 'Dep. Vinícius Andrade', valor_segundo_responsavel: 800000,
  },
  {
    id: 'emenda-008', numero_emenda: '67890033', numero_proposta: '44500321000189034',
    autor: 'Deputado Rogério Sampaio', parlamentar: 'Deputado Rogério Sampaio',
    tipo: 'individual', tipo_recurso: 'EQUIPAMENTO', valor_total: 1500000.00,
    situacao: 'FAVORAVEL', status_interno: 'PROPOSTA_APROVADA',
    portaria: 'P. GM/MS Nº 8.200, 18/10/2025', deliberacao_cie: 'Deliberação Nº 318 de 02/10/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-07-10T14:00:00Z', total_repassado: 1500000.00, total_gasto: 750000.00,
  },
  {
    id: 'emenda-009', numero_emenda: '12340044', numero_proposta: '55600654000112056',
    autor: 'Deputada Cristiane Barros', parlamentar: 'Deputada Cristiane Barros',
    tipo: 'comissao', tipo_recurso: 'CUSTEIO_PAP', valor_total: 620000.00,
    situacao: 'EM_ANALISE', status_interno: 'ANALISE_TECNICA_MERITO',
    portaria: null, deliberacao_cie: null,
    anexos_essenciais: false, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-02-10T09:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  {
    id: 'emenda-010', numero_emenda: '98760055', numero_proposta: '66700987000134078',
    autor: 'Senadora Adriana Lemos', parlamentar: 'Senadora Adriana Lemos',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_PAP', valor_total: 3100000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 8.550, 20/01/2026', deliberacao_cie: 'Deliberação Nº 360 de 10/01/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-01-25T10:30:00Z', total_repassado: 3100000.00, total_gasto: 2200000.00,
  },
  {
    id: 'emenda-011', numero_emenda: '45670066', numero_proposta: '77801234000156089',
    autor: 'Ricardo Brandão', parlamentar: 'Ricardo Brandão',
    tipo: 'bancada', tipo_recurso: 'CUSTEIO_MAC', valor_total: 1800000.00,
    situacao: 'PAGA', status_interno: 'PAGA_COM_PENDENCIAS',
    portaria: 'P. GM/MS Nº 8.600, 15/02/2026', deliberacao_cie: 'Deliberação Nº 375 de 01/02/2026',
    anexos_essenciais: false, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-03-01T13:00:00Z', total_repassado: 1800000.00, total_gasto: 600000.00,
  },
  {
    id: 'emenda-012', numero_emenda: '78900077', numero_proposta: '88902345000167090',
    autor: 'Deputado Marcos Cavalcante', parlamentar: 'Deputado Marcos Cavalcante',
    tipo: 'programa', tipo_recurso: 'INCREMENTO_MAC', valor_total: 5500000.00,
    situacao: 'LIBERADO_PAGAMENTO_FNS', status_interno: 'PORTARIA_PUBLICADA_AGUARDANDO_FNS',
    portaria: 'P. GM/MS Nº 8.700, 01/03/2026', deliberacao_cie: 'Deliberação Nº 390 de 20/02/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'ESTADUAL',
    created_at: '2026-03-15T16:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  // ── Novas 2025 ──
  {
    id: 'emenda-013', numero_emenda: '23450088', numero_proposta: '99001122000143021',
    autor: 'Deputado Walber Nogueira', parlamentar: 'Deputado Walber Nogueira',
    tipo: 'individual', tipo_recurso: 'CUSTEIO_PAP', valor_total: 22811360.00,
    situacao: 'PAGA', status_interno: 'CONCLUIDA',
    portaria: 'P. GM/MS Nº 7.820, 10/04/2025', deliberacao_cie: 'Deliberação Nº 248 de 28/03/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-04-20T10:00:00Z', total_repassado: 24811360.00, total_gasto: 24811360.00,
  },
  {
    id: 'emenda-014', numero_emenda: '34560099', numero_proposta: '11102233000178032',
    autor: 'Senador Bruno Tavares', parlamentar: 'Senador Bruno Tavares',
    tipo: 'bancada', tipo_recurso: 'EQUIPAMENTO', valor_total: 2200000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO', status_interno: 'AUTORIZADA_AGUARDANDO_EMPENHO',
    portaria: 'P. GM/MS Nº 8.050, 18/07/2025', deliberacao_cie: 'Deliberação Nº 290 de 05/07/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-07-25T09:00:00Z', total_repassado: 2200000.00, total_gasto: 920000.00,
    segundo_autor: 'Dep. Gildásio Pontes', segundo_parlamentar: 'Dep. Gildásio Pontes', valor_segundo_responsavel: 500000,
  },
  {
    id: 'emenda-015', numero_emenda: '45670110', numero_proposta: '22203344000112043',
    autor: 'Deputada Rosângela Furtado', parlamentar: 'Deputada Rosângela Furtado',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_MAC', valor_total: 1650000.00,
    situacao: 'FAVORAVEL', status_interno: 'PROPOSTA_APROVADA',
    portaria: 'P. GM/MS Nº 8.180, 05/09/2025', deliberacao_cie: 'Deliberação Nº 312 de 22/08/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-09-10T11:00:00Z', total_repassado: 1650000.00, total_gasto: 730000.00,
  },
  {
    id: 'emenda-016', numero_emenda: '56780121', numero_proposta: '33304455000189054',
    autor: 'Deputado Evaristo Maciel', parlamentar: 'Deputado Evaristo Maciel',
    tipo: 'comissao', tipo_recurso: 'CUSTEIO_MAC', valor_total: 720000.00,
    situacao: 'EM_ANALISE', status_interno: 'ANALISE_TECNICA_MERITO',
    portaria: null, deliberacao_cie: null,
    anexos_essenciais: false, ano_exercicio: 2025, origem: 'ESTADUAL',
    created_at: '2025-11-01T14:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  // ── Novas 2026 ──
  {
    id: 'emenda-017', numero_emenda: '67890132', numero_proposta: '44405566000134065',
    autor: 'Senadora Patrícia Duarte', parlamentar: 'Senadora Patrícia Duarte',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_PAP', valor_total: 4100000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 8.780, 10/02/2026', deliberacao_cie: 'Deliberação Nº 401 de 28/01/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-02-15T08:30:00Z', total_repassado: 4100000.00, total_gasto: 3300000.00,
  },
  {
    id: 'emenda-018', numero_emenda: '78901143', numero_proposta: '55506677000145076',
    autor: 'Deputado Celso Braga', parlamentar: 'Deputado Celso Braga',
    tipo: 'individual', tipo_recurso: 'EQUIPAMENTO', valor_total: 980000.00,
    situacao: 'LIBERADO_PAGAMENTO_FNS', status_interno: 'PORTARIA_PUBLICADA_AGUARDANDO_FNS',
    portaria: 'P. GM/MS Nº 8.820, 05/03/2026', deliberacao_cie: 'Deliberação Nº 410 de 18/02/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-03-10T10:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  {
    id: 'emenda-019', numero_emenda: '89012154', numero_proposta: '66607788000156087',
    autor: 'Deputada Nara Meneses', parlamentar: 'Deputada Nara Meneses',
    tipo: 'bancada', tipo_recurso: 'CUSTEIO_MAC', valor_total: 3750000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO', status_interno: 'EM_EXECUCAO',
    portaria: 'P. GM/MS Nº 8.860, 20/03/2026', deliberacao_cie: 'Deliberação Nº 420 de 10/03/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-03-25T14:00:00Z', total_repassado: 1875000.00, total_gasto: 890000.00,
    segundo_autor: 'Dep. Caetano Silveira', segundo_parlamentar: 'Dep. Caetano Silveira', valor_segundo_responsavel: 650000,
  },
  {
    id: 'emenda-020', numero_emenda: '90123165', numero_proposta: '77708899000167098',
    autor: 'Senador Geraldo Fontes', parlamentar: 'Senador Geraldo Fontes',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_MAC', valor_total: 2800000.00,
    situacao: 'EM_ANALISE', status_interno: 'ENVIADA_PUBLICACAO_PORTARIA',
    portaria: null, deliberacao_cie: 'Deliberação Nº 430 de 01/04/2026',
    anexos_essenciais: false, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-04-05T09:30:00Z', total_repassado: 0, total_gasto: 0,
  },
  // ── Novas 2025 (021–025) ──
  {
    id: 'emenda-021', numero_emenda: '11223344', numero_proposta: '12300001000111001',
    autor: 'Deputado Flávio Andrade', parlamentar: 'Deputado Flávio Andrade',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_MAC', valor_total: 3200000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 7.601, 14/03/2025', deliberacao_cie: 'Deliberação Nº 310 de 05/03/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-03-20T08:00:00Z', total_repassado: 3200000.00, total_gasto: 3000000.00,
    objeto_emenda: 'Incremento MAC para procedimentos cirúrgicos de alta complexidade.',
  },
  {
    id: 'emenda-022', numero_emenda: '22334455', numero_proposta: '23400002000122002',
    autor: 'Senadora Beatriz Lemos', parlamentar: 'Senadora Beatriz Lemos',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_PAP', valor_total: 1850000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 7.650, 28/04/2025', deliberacao_cie: 'Deliberação Nº 320 de 18/04/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-05-02T09:00:00Z', total_repassado: 1850000.00, total_gasto: 1600000.00,
    objeto_emenda: 'Fortalecimento das equipes de Saúde da Família e atenção primária.',
  },
  {
    id: 'emenda-023', numero_emenda: '33445566', numero_proposta: '34500003000133003',
    autor: 'Dep. Rodrigo Menezes', parlamentar: 'Dep. Rodrigo Menezes',
    tipo: 'bancada', tipo_recurso: 'EQUIPAMENTO', valor_total: 2400000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO', status_interno: 'EM_EXECUCAO',
    portaria: 'P. GM/MS Nº 7.720, 15/06/2025', deliberacao_cie: 'Deliberação Nº 340 de 05/06/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-06-18T10:00:00Z', total_repassado: 1200000.00, total_gasto: 950000.00,
  },
  {
    id: 'emenda-024', numero_emenda: '44556677', numero_proposta: '45600004000144004',
    autor: 'Deputada Cláudia Pereira', parlamentar: 'Deputada Cláudia Pereira',
    tipo: 'individual', tipo_recurso: 'CUSTEIO_MAC', valor_total: 960000.00,
    situacao: 'LIBERADO_PAGAMENTO_FNS', status_interno: 'PORTARIA_PUBLICADA_AGUARDANDO_FNS',
    portaria: 'P. GM/MS Nº 7.790, 10/08/2025', deliberacao_cie: 'Deliberação Nº 360 de 01/08/2025',
    anexos_essenciais: true, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-08-14T11:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  {
    id: 'emenda-025', numero_emenda: '55667788', numero_proposta: '56700005000155005',
    autor: 'Senador Márcio Taveira', parlamentar: 'Senador Márcio Taveira',
    tipo: 'comissao', tipo_recurso: 'INCREMENTO_PAP', valor_total: 5100000.00,
    situacao: 'PAGA', status_interno: 'PAGA_COM_PENDENCIAS',
    portaria: 'P. GM/MS Nº 7.850, 20/09/2025', deliberacao_cie: 'Deliberação Nº 375 de 10/09/2025',
    anexos_essenciais: false, ano_exercicio: 2025, origem: 'FEDERAL',
    created_at: '2025-09-25T13:00:00Z', total_repassado: 5100000.00, total_gasto: 4800000.00,
    segundo_autor: 'Dep. Fernanda Queiroz', segundo_parlamentar: 'Dep. Fernanda Queiroz', valor_segundo_responsavel: 1200000,
    objeto_emenda: 'Custeio para a Rede de Atenção Psicossocial (RAPS).',
  },
  // ── Novas 2026 (026–030) ──
  {
    id: 'emenda-026', numero_emenda: '66778899', numero_proposta: '67800006000166006',
    autor: 'Deputado Henrique Leal', parlamentar: 'Deputado Henrique Leal',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_MAC', valor_total: 3600000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 8.900, 12/01/2026', deliberacao_cie: 'Deliberação Nº 440 de 04/01/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-01-18T08:00:00Z', total_repassado: 3600000.00, total_gasto: 3200000.00,
    objeto_emenda: 'Mutirão de cirurgias eletivas e redução de filas MAC.',
  },
  {
    id: 'emenda-027', numero_emenda: '77889900', numero_proposta: '78900007000177007',
    autor: 'Deputada Sônia Cavalcante', parlamentar: 'Deputada Sônia Cavalcante',
    tipo: 'individual', tipo_recurso: 'CUSTEIO_PAP', valor_total: 2100000.00,
    situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO', status_interno: 'EM_EXECUCAO',
    portaria: 'P. GM/MS Nº 8.950, 02/02/2026', deliberacao_cie: 'Deliberação Nº 450 de 24/01/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-02-08T09:00:00Z', total_repassado: 1050000.00, total_gasto: 750000.00,
  },
  {
    id: 'emenda-028', numero_emenda: '88990011', numero_proposta: '89000008000188008',
    autor: 'Senador Augusto Nogueira', parlamentar: 'Senador Augusto Nogueira',
    tipo: 'bancada', tipo_recurso: 'EQUIPAMENTO', valor_total: 4750000.00,
    situacao: 'LIBERADO_PAGAMENTO_FNS', status_interno: 'PORTARIA_PUBLICADA_AGUARDANDO_FNS',
    portaria: 'P. GM/MS Nº 9.010, 18/03/2026', deliberacao_cie: 'Deliberação Nº 460 de 07/03/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-03-22T10:00:00Z', total_repassado: 0, total_gasto: 0,
    segundo_autor: 'Dep. Renata Azevedo', segundo_parlamentar: 'Dep. Renata Azevedo', valor_segundo_responsavel: 1500000,
  },
  {
    id: 'emenda-029', numero_emenda: '99001122', numero_proposta: '90100009000199009',
    autor: 'Dep. Marcus Vinícius', parlamentar: 'Dep. Marcus Vinícius',
    tipo: 'individual', tipo_recurso: 'INCREMENTO_MAC', valor_total: 1700000.00,
    situacao: 'EM_ANALISE', status_interno: 'ANALISE_TECNICA_MERITO',
    portaria: null, deliberacao_cie: null,
    anexos_essenciais: false, ano_exercicio: 2026, origem: 'ESTADUAL',
    created_at: '2026-04-01T11:00:00Z', total_repassado: 0, total_gasto: 0,
  },
  {
    id: 'emenda-030', numero_emenda: '10203040', numero_proposta: '01200010000100010',
    autor: 'Senadora Vanessa Borges', parlamentar: 'Senadora Vanessa Borges',
    tipo: 'comissao', tipo_recurso: 'CUSTEIO_MAC', valor_total: 6200000.00,
    situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA',
    portaria: 'P. GM/MS Nº 9.080, 05/04/2026', deliberacao_cie: 'Deliberação Nº 475 de 27/03/2026',
    anexos_essenciais: true, ano_exercicio: 2026, origem: 'FEDERAL',
    created_at: '2026-04-10T14:00:00Z', total_repassado: 6200000.00, total_gasto: 5800000.00,
    segundo_autor: 'Dep. Gertrudes Lima', segundo_parlamentar: 'Dep. Gertrudes Lima', valor_segundo_responsavel: 2000000,
  },
]

// ─── Pré-Lançamentos (Contabilis) ──────────────────────────────────────────
export const VISITOR_PRE_LANCAMENTOS = [
  {
    id: 'pre-001',
    codigo_sequencial: 1,
    identificador: 'CONT-2025-001',
    ano: 2025,
    data_referencia: '2025-05-10',
    numero_proposta: '36000695728202500',
    tipo: '01 - Emenda Federal Bancada',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Ricardo Brandão',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 5917360.00,
    objeto: 'Atenção Integral à Saúde da Mulher',
    funcao: '10 - Saúde',
    sub_funcao: '302 - Assistência Hospitalar e Ambulatorial',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8581 - Estruturação da Rede de Serviços de Atenção Básica',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5018 - Atenção Primária à Saúde',
  },
  {
    id: 'pre-002',
    codigo_sequencial: 2,
    identificador: 'CONT-2025-002',
    ano: 2025,
    data_referencia: '2025-06-15',
    numero_proposta: '36000712894202501',
    tipo: '02 - Emenda Federal Individual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Dep. Flávio Andrade',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 3200000.00,
    objeto: 'Incremento ao Teto MAC — Procedimentos de Alta Complexidade',
    funcao: '10 - Saúde',
    sub_funcao: '303 - Suporte Profilático e Terapêutico',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8535 - Estruturação de UPA e Serviços Hospitalares',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5030 - Atenção Especializada à Saúde',
  },
  {
    id: 'pre-003',
    codigo_sequencial: 3,
    identificador: 'CONT-2025-003',
    ano: 2025,
    data_referencia: '2025-07-20',
    numero_proposta: '36000728561202502',
    tipo: '02 - Emenda Federal Individual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Senadora Beatriz Lemos',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 1850000.00,
    objeto: 'Incremento ao Teto PAP — Atenção à Saúde da Família',
    funcao: '10 - Saúde',
    sub_funcao: '301 - Atenção Básica',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8581 - Estruturação da Rede de Serviços de Atenção Básica',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5018 - Atenção Primária à Saúde',
  },
  {
    id: 'pre-004',
    codigo_sequencial: 4,
    identificador: 'CONT-2025-004',
    ano: 2025,
    data_referencia: '2025-08-05',
    numero_proposta: '36000744892202503',
    tipo: '03 - Emenda Federal Bancada Estadual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Dep. Rodrigo Menezes',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 2400000.00,
    objeto: 'Aquisição de Equipamentos Hospitalares para UPA 24h',
    funcao: '10 - Saúde',
    sub_funcao: '302 - Assistência Hospitalar e Ambulatorial',
    categoria_economica: '04 - Investimento',
    acao_orcamentaria: '8535 - Estruturação de UPA e Serviços Hospitalares',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5030 - Atenção Especializada à Saúde',
  },
  {
    id: 'pre-005',
    codigo_sequencial: 5,
    identificador: 'CONT-2025-005',
    ano: 2025,
    data_referencia: '2025-09-12',
    numero_proposta: '36000761203202504',
    tipo: '01 - Emenda Federal Bancada',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Senador Márcio Taveira',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 5100000.00,
    objeto: 'Qualificação da Atenção à Saúde Mental e RAPS',
    funcao: '10 - Saúde',
    sub_funcao: '305 - Vigilância Epidemiológica',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8640 - Implementação da Política de Saúde Mental',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5060 - Saúde Mental',
  },
  {
    id: 'pre-006',
    codigo_sequencial: 6,
    identificador: 'CONT-2026-001',
    ano: 2026,
    data_referencia: '2026-01-20',
    numero_proposta: '36000795514202600',
    tipo: '02 - Emenda Federal Individual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Deputado Henrique Leal',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 3600000.00,
    objeto: 'Incremento ao Teto MAC — Alta e Média Complexidade Ambulatorial',
    funcao: '10 - Saúde',
    sub_funcao: '302 - Assistência Hospitalar e Ambulatorial',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8535 - Estruturação de UPA e Serviços Hospitalares',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5030 - Atenção Especializada à Saúde',
  },
  {
    id: 'pre-007',
    codigo_sequencial: 7,
    identificador: 'CONT-2026-002',
    ano: 2026,
    data_referencia: '2026-02-14',
    numero_proposta: '36000812345202601',
    tipo: '02 - Emenda Federal Individual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Deputada Sônia Cavalcante',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 2100000.00,
    objeto: 'Custeio PAP — Fortalecimento das Equipes de Saúde Bucal',
    funcao: '10 - Saúde',
    sub_funcao: '301 - Atenção Básica',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8581 - Estruturação da Rede de Serviços de Atenção Básica',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5018 - Atenção Primária à Saúde',
  },
  {
    id: 'pre-008',
    codigo_sequencial: 8,
    identificador: 'CONT-2026-003',
    ano: 2026,
    data_referencia: '2026-02-28',
    numero_proposta: '36000829876202602',
    tipo: '03 - Emenda Federal Bancada Estadual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Senador Augusto Nogueira',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 4750000.00,
    objeto: 'Aquisição de Equipamentos para Centro Cirúrgico e UTI',
    funcao: '10 - Saúde',
    sub_funcao: '302 - Assistência Hospitalar e Ambulatorial',
    categoria_economica: '04 - Investimento',
    acao_orcamentaria: '8535 - Estruturação de UPA e Serviços Hospitalares',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5030 - Atenção Especializada à Saúde',
  },
  {
    id: 'pre-009',
    codigo_sequencial: 9,
    identificador: 'CONT-2026-004',
    ano: 2026,
    data_referencia: '2026-03-10',
    numero_proposta: '36000847231202603',
    tipo: '02 - Emenda Federal Individual',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Dep. Marcus Vinícius',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 1700000.00,
    objeto: 'Incremento MAC — Reabilitação e Atenção à Pessoa com Deficiência',
    funcao: '10 - Saúde',
    sub_funcao: '304 - Vigilância Sanitária',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8642 - Implementação da Política de Atenção Integral à Pessoa com Deficiência',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5048 - Proteção e Promoção dos Direitos das Pessoas com Deficiência',
  },
  {
    id: 'pre-010',
    codigo_sequencial: 10,
    identificador: 'CONT-2026-005',
    ano: 2026,
    data_referencia: '2026-04-05',
    numero_proposta: '36000864982202604',
    tipo: '01 - Emenda Federal Bancada',
    modalidade_aplicacao: 'DIRETA',
    parlamentar: 'Senadora Vanessa Borges',
    beneficiario: 'Fundo Municipal de Saúde',
    localidade: 'Aracaju',
    valor_previsto: 6200000.00,
    objeto: 'Custeio MAC — Ampliação da Oferta de Serviços de Oncologia e Alta Complexidade',
    funcao: '10 - Saúde',
    sub_funcao: '302 - Assistência Hospitalar e Ambulatorial',
    categoria_economica: '01 - Custeio',
    acao_orcamentaria: '8535 - Estruturação de UPA e Serviços Hospitalares',
    orgao: '36000 - Ministério da Saúde',
    unidade_orcamentaria: '36901 - Fundo Nacional de Saúde',
    programa: '5030 - Atenção Especializada à Saúde',
  },
]

// ─── Repasses por emenda ─────────────────────────────────────────────────────
export const VISITOR_REPASSES: Record<string, Repasse[]> = {
  'emenda-001': [{ id: 'rep-001-a', data: '2025-06-10', valor: 24112360, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00100', observacoes: 'Repasse integral simulado' }],
  'emenda-002': [{ id: 'rep-002-a', data: '2025-06-10', valor: 1054000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00200', observacoes: 'Repasse integral simulado' }],
  'emenda-003': [{ id: 'rep-003-a', data: '2025-06-10', valor: 1200000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00300', observacoes: 'Repasse integral simulado' }],
  'emenda-005': [{ id: 'rep-005-a', data: '2025-06-10', valor: 2500000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00500', observacoes: 'Repasse integral simulado' }],
  'emenda-006': [{ id: 'rep-006-a', data: '2025-06-10', valor: 890000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00600', observacoes: 'Repasse integral simulado' }],
  'emenda-007': [{ id: 'rep-007-a', data: '2025-06-10', valor: 2100000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00700', observacoes: 'Repasse integral simulado' }],
  'emenda-008': [{ id: 'rep-008-a', data: '2025-06-10', valor: 1500000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB00800', observacoes: 'Repasse integral simulado' }],
  'emenda-010': [{ id: 'rep-010-a', data: '2025-06-10', valor: 3100000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01000', observacoes: 'Repasse integral simulado' }],
  'emenda-011': [{ id: 'rep-011-a', data: '2025-06-10', valor: 1800000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01100', observacoes: 'Repasse integral simulado' }],
  'emenda-013': [{ id: 'rep-013-a', data: '2025-06-10', valor: 24811360, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01300', observacoes: 'Repasse integral simulado' }],
  'emenda-014': [{ id: 'rep-014-a', data: '2025-06-10', valor: 2200000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01400', observacoes: 'Repasse integral simulado' }],
  'emenda-015': [{ id: 'rep-015-a', data: '2025-06-10', valor: 1650000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01500', observacoes: 'Repasse integral simulado' }],
  'emenda-017': [{ id: 'rep-017-a', data: '2025-06-10', valor: 4100000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01700', observacoes: 'Repasse integral simulado' }],
  'emenda-019': [{ id: 'rep-019-a', data: '2025-06-10', valor: 1875000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB01900', observacoes: 'Repasse integral simulado' }],
  'emenda-021': [{ id: 'rep-021-a', data: '2025-06-10', valor: 3200000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB02100', observacoes: 'Repasse integral simulado' }],
  'emenda-022': [{ id: 'rep-022-a', data: '2025-06-10', valor: 1850000, fonte: 'FNS/MS', status: 'REPASSADO', ordem_bancaria: '2025OB02200', observacoes: 'Repasse integral simulado' }],
}

// ─── Despesas por emenda ─────────────────────────────────────────────────────
export const VISITOR_DESPESAS: Record<string, Despesa[]> = {
  'emenda-001': [{ id: 'desp-001-a', destinacao_id: 'dest-001-a', data: '2025-08-15', valor: 24112360, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-002': [{ id: 'desp-002-a', destinacao_id: 'dest-002-a', data: '2025-08-15', valor: 1054000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-003': [{ id: 'desp-003-a', destinacao_id: 'dest-003-a', data: '2025-08-15', valor: 980000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-005': [{ id: 'desp-005-a', destinacao_id: 'dest-005-a', data: '2025-08-15', valor: 1100000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-006': [{ id: 'desp-006-a', destinacao_id: 'dest-006-a', data: '2025-08-15', valor: 890000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-007': [{ id: 'desp-007-a', destinacao_id: 'dest-007-a', data: '2025-08-15', valor: 1500000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-008': [{ id: 'desp-008-a', destinacao_id: 'dest-008-a', data: '2025-08-15', valor: 750000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-010': [{ id: 'desp-010-a', destinacao_id: 'dest-010-a', data: '2025-08-15', valor: 2200000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-011': [{ id: 'desp-011-a', destinacao_id: 'dest-011-a', data: '2025-08-15', valor: 600000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-013': [{ id: 'desp-013-a', destinacao_id: 'dest-013-a', data: '2025-08-15', valor: 24811360, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-014': [{ id: 'desp-014-a', destinacao_id: 'dest-014-a', data: '2025-08-15', valor: 920000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-015': [{ id: 'desp-015-a', destinacao_id: 'dest-015-a', data: '2025-08-15', valor: 730000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-017': [{ id: 'desp-017-a', destinacao_id: 'dest-017-a', data: '2025-08-15', valor: 3300000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-019': [{ id: 'desp-019-a', destinacao_id: 'dest-019-a', data: '2025-08-15', valor: 890000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-021': [{ id: 'desp-021-a', destinacao_id: 'dest-021-a', data: '2025-08-15', valor: 3000000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-022': [{ id: 'desp-022-a', destinacao_id: 'dest-022-a', data: '2025-08-15', valor: 1600000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-023': [{ id: 'desp-023-a', destinacao_id: 'dest-023-a', data: '2025-08-15', valor: 950000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-025': [{ id: 'desp-025-a', destinacao_id: 'dest-025-a', data: '2025-11-05', valor: 4800000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-026': [{ id: 'desp-026-a', destinacao_id: 'dest-026-a', data: '2026-03-10', valor: 3200000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-027': [{ id: 'desp-027-a', destinacao_id: 'dest-027-a', data: '2026-04-15', valor: 750000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor Simulado', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UNIDADE SAUDE LOCAL', status_execucao: 'PAGA' }],
  'emenda-030': [{ id: 'desp-030-a', destinacao_id: 'dest-030-a', data: '2026-05-20', valor: 5800000, categoria: 'SERVICOS TERCEIROS (PJ)', descricao: 'Execucao de custeio/equipamento', fornecedor_nome: 'Fornecedor G', registrada_por: 'user-002', autorizada_por: 'user-001', unidade_destino: 'UBS', status_execucao: 'PAGA' }],
}

// ─── Pendências por emenda ───────────────────────────────────────────────────
export const VISITOR_PENDENCIAS: Record<string, Pendencia[]> = {
  'emenda-002': [
    { id: 'pend-002-a', descricao: 'Aguardando portaria de autorização do FNS', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'anexos' },
    { id: 'pend-002-b', descricao: 'Deliberação CIE pendente de publicação no DOE', dispensada: false, resolvida: false, targetType: 'field', targetId: 'deliberacao_cie' },
  ],
  'emenda-004': [
    { id: 'pend-004-a', descricao: 'Proposta em análise técnica de mérito — aguardar resultado', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'summary' },
  ],
  'emenda-007': [
    { id: 'pend-007-a', descricao: 'Segunda parcela do repasse pendente de liberação pelo FNS', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'repasses' },
  ],
  'emenda-009': [
    { id: 'pend-009-a', descricao: 'Falta portaria de habilitação do recurso', dispensada: false, resolvida: false, targetType: 'field', targetId: 'portaria' },
    { id: 'pend-009-b', descricao: 'Deliberação CIE não emitida', dispensada: false, resolvida: false, targetType: 'field', targetId: 'deliberacao_cie' },
    { id: 'pend-009-c', descricao: 'Anexos essenciais não enviados', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'anexos' },
  ],
  'emenda-011': [
    { id: 'pend-011-a', descricao: 'Anexos essenciais pendentes (comprovante FNS)', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'anexos' },
    { id: 'pend-011-b', descricao: 'Saldo não executado de R$ 1.200.000,00', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'despesas' },
  ],
  'emenda-012': [
    { id: 'pend-012-a', descricao: 'Aguardando autorização do FNS para repasse', dispensada: false, resolvida: false, targetType: 'tab', targetId: 'repasses' },
  ],
}

// ─── Ações com Destinações por emenda ───────────────────────────────────────
export const VISITOR_ACOES: Record<string, (Action & { destinacoes: Destination[] })[]> = {
  'emenda-001': [
    {
      id: 'acao-001-a',
      emenda_id: 'emenda-001',
      nome_acao: 'Atenção Integral à Saúde da Mulher',
      area: 'Saúde da Mulher',
      complexidade: 'Alta',
      publico_alvo: 'Mulheres em idade reprodutiva',
      descricao_oficial: 'Ações de promoção, prevenção e atenção à saúde da mulher no município.',
      destinacoes: [
        { id: 'dest-001-a', acao_id: 'acao-001-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', subtipo: 'Serviços', valor_destinado: 2917360, portaria_vinculada: 'P. GM/MS Nº 8.108', grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
        { id: 'dest-001-b', acao_id: 'acao-001-a', tipo_destinacao: 'MATERIAL DE CONSUMO', subtipo: 'Material', valor_destinado: 3000000, grupo_despesa: 'MATERIAL DE CONSUMO' },
      ],
    },
  ],
  'emenda-003': [
    {
      id: 'acao-003-a',
      emenda_id: 'emenda-003',
      nome_acao: 'Custeio de Serviços Ambulatoriais MAC',
      area: 'Atenção Especializada',
      complexidade: 'Média',
      publico_alvo: 'Usuários SUS em geral',
      descricao_oficial: 'Custeio de ações de média e alta complexidade ambulatorial.',
      destinacoes: [
        { id: 'dest-003-a', acao_id: 'acao-003-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 1200000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
  'emenda-021': [
    {
      id: 'acao-021-a',
      emenda_id: 'emenda-021',
      nome_acao: 'Incremento ao Teto MAC — Procedimentos de Alta Complexidade',
      area: 'Alta Complexidade',
      complexidade: 'Alta',
      publico_alvo: 'Pacientes oncológicos e cardiovasculares',
      descricao_oficial: 'Fomentar a rede de atenção especializada em saúde para os procedimentos de alta complexidade.',
      destinacoes: [
        { id: 'dest-021-a', acao_id: 'acao-021-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 3200000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
  'emenda-022': [
    {
      id: 'acao-022-a',
      emenda_id: 'emenda-022',
      nome_acao: 'Atenção à Saúde da Família e ESF',
      area: 'Atenção Primária',
      complexidade: 'Básica',
      publico_alvo: 'Famílias de baixa renda',
      descricao_oficial: 'Manutenção e fortalecimento das equipes de saúde da família.',
      destinacoes: [
        { id: 'dest-022-a', acao_id: 'acao-022-a', tipo_destinacao: 'MATERIAL DE CONSUMO', valor_destinado: 1850000, grupo_despesa: 'MATERIAL DE CONSUMO' },
      ],
    },
  ],
  'emenda-023': [
    {
      id: 'acao-023-a',
      emenda_id: 'emenda-023',
      nome_acao: 'Reaparelhamento de UBS e Centros de Saúde',
      area: 'Infraestrutura',
      complexidade: 'Média',
      publico_alvo: 'População geral',
      descricao_oficial: 'Aquisição de equipamentos de ultrassom e mobiliário clínico.',
      destinacoes: [
        { id: 'dest-023-a', acao_id: 'acao-023-a', tipo_destinacao: 'EQUIPAMENTOS E MATERIAL PERMANENTE', valor_destinado: 1200000, grupo_despesa: 'EQUIPAMENTOS' },
      ],
    },
  ],
  'emenda-024': [
    {
      id: 'acao-024-a',
      emenda_id: 'emenda-024',
      nome_acao: 'Custeio de Rede de Urgência e Emergência',
      area: 'Urgência',
      complexidade: 'Alta',
      publico_alvo: 'Pacientes em estado crítico',
      descricao_oficial: 'Apoio financeiro para funcionamento ininterrupto de SAMU e UPA.',
      destinacoes: [
        { id: 'dest-024-a', acao_id: 'acao-024-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 960000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
  'emenda-025': [
    {
      id: 'acao-025-a',
      emenda_id: 'emenda-025',
      nome_acao: 'Saúde Mental, Álcool e Outras Drogas',
      area: 'Saúde Mental',
      complexidade: 'Média',
      publico_alvo: 'Pacientes da RAPS',
      descricao_oficial: 'Custeio da Rede de Atenção Psicossocial.',
      destinacoes: [
        { id: 'dest-025-a', acao_id: 'acao-025-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 5100000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
  'emenda-026': [
    {
      id: 'acao-026-a',
      emenda_id: 'emenda-026',
      nome_acao: 'Redução de Filas de Cirurgias Eletivas',
      area: 'Atenção Especializada',
      complexidade: 'Alta',
      publico_alvo: 'Pacientes em fila de espera',
      descricao_oficial: 'Incremento MAC para mutirões de cirurgias eletivas.',
      destinacoes: [
        { id: 'dest-026-a', acao_id: 'acao-026-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 3600000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
  'emenda-027': [
    {
      id: 'acao-027-a',
      emenda_id: 'emenda-027',
      nome_acao: 'Fortalecimento da Saúde Bucal',
      area: 'Saúde Bucal',
      complexidade: 'Básica',
      publico_alvo: 'Crianças e adolescentes',
      descricao_oficial: 'Insumos para as clínicas odontológicas das UBSs.',
      destinacoes: [
        { id: 'dest-027-a', acao_id: 'acao-027-a', tipo_destinacao: 'MATERIAL DE CONSUMO', valor_destinado: 1050000, grupo_despesa: 'MATERIAL DE CONSUMO' },
      ],
    },
  ],
  'emenda-028': [
    {
      id: 'acao-028-a',
      emenda_id: 'emenda-028',
      nome_acao: 'Aquisição de Ambulâncias de Suporte Básico',
      area: 'Transporte Sanitário',
      complexidade: 'Média',
      publico_alvo: 'Rede de Urgência',
      descricao_oficial: 'Renovação da frota de ambulâncias.',
      destinacoes: [
        { id: 'dest-028-a', acao_id: 'acao-028-a', tipo_destinacao: 'EQUIPAMENTOS E MATERIAL PERMANENTE', valor_destinado: 650000, grupo_despesa: 'EQUIPAMENTOS' },
      ],
    },
  ],
  'emenda-029': [
    {
      id: 'acao-029-a',
      emenda_id: 'emenda-029',
      nome_acao: 'Atenção às Doenças Crônicas',
      area: 'Atenção Especializada',
      complexidade: 'Alta',
      publico_alvo: 'Pacientes diabéticos e hipertensos',
      descricao_oficial: 'Custeio para tratamento contínuo na rede MAC.',
      destinacoes: [
        { id: 'dest-029-a', acao_id: 'acao-029-a', tipo_destinacao: 'MATERIAL DE CONSUMO', valor_destinado: 1200000, grupo_despesa: 'MATERIAL DE CONSUMO' },
      ],
    },
  ],
  'emenda-030': [
    {
      id: 'acao-030-a',
      emenda_id: 'emenda-030',
      nome_acao: 'Ampliação da Oferta de Serviços de Oncologia',
      area: 'Oncologia',
      complexidade: 'Alta',
      publico_alvo: 'Pacientes oncológicos',
      descricao_oficial: 'Custeio das clínicas especializadas e quimioterapia.',
      destinacoes: [
        { id: 'dest-030-a', acao_id: 'acao-030-a', tipo_destinacao: 'SERVIÇOS TERCEIROS (PJ)', valor_destinado: 6200000, grupo_despesa: 'SERVIÇOS TERCEIROS (PJ)' },
      ],
    },
  ],
}

// ─── Anexos por emenda ───────────────────────────────────────────────────────
export const VISITOR_ANEXOS: Record<string, any[]> = {
  'emenda-001': [
    { id: 'anx-001-a', filename: 'Portaria_Habilitacao_Saude_Mulher.pdf', tipo: 'PORTARIA', data: '2025-05-15', url: 'https://in.gov.br', uploader: 'Ricardo Brandão' },
    { id: 'anx-001-b', filename: 'Oficio_Secretaria_Estadual.pdf', tipo: 'OFICIO', data: '2025-06-01', url: 'https://gov.br', uploader: 'Ana Costa' },
    { id: 'anx-001-c', filename: 'Proposta_Original_MAC.pdf', tipo: 'PROPOSTA', data: '2025-04-10', url: 'https://saude.gov.br', uploader: 'Ricardo Brandão' },
    { id: 'anx-001-d', filename: 'Deliberacao_CIB_001.pdf', tipo: 'DELIBERACAO_CIE', data: '2025-04-20', url: 'https://saude.gov.br/cib', uploader: 'Ana Costa' },
  ],
  'emenda-002': [
    { id: 'anx-002-a', filename: 'Proposta_Original_PAP.pdf', tipo: 'PROPOSTA', data: '2025-02-10', url: 'https://gov.br', uploader: 'Carlos Silva' },
  ],
  'emenda-003': [
    { id: 'anx-003-a', filename: 'Comprovante_Transferencia_MAC.pdf', tipo: 'COMPROVANTE_FNS', data: '2025-08-21', url: 'https://fns.saude.gov.br', uploader: 'Julia Souza' },
  ],
  'emenda-004': [
    { id: 'anx-004-a', filename: 'Projeto_Arquitetonico_UBS.pdf', tipo: 'OUTRO', data: '2025-09-01', url: 'https://gov.br', uploader: 'Marcos Silva' },
  ],
  'emenda-005': [
    { id: 'anx-005-a', filename: 'Edital_Pregao_Equipamentos.pdf', tipo: 'OUTRO', data: '2025-10-15', url: 'https://comprasnet.gov.br', uploader: 'Ana Costa' },
  ],
  'emenda-006': [
    { id: 'anx-006-a', filename: 'Nota_Fiscal_Servicos.pdf', tipo: 'NOTA_FISCAL', data: '2025-07-20', url: 'https://nfe.fazenda.gov.br', uploader: 'Ricardo Oliveira' },
  ],
  'emenda-007': [
    { id: 'anx-007-a', filename: 'Portaria_Incremento_MAC.pdf', tipo: 'PORTARIA', data: '2025-11-10', url: 'https://in.gov.br', uploader: 'Julia Souza' },
  ],
  'emenda-008': [
    { id: 'anx-008-a', filename: 'Aprovacao_Conselho_Equipamentos.pdf', tipo: 'DELIBERACAO_CIE', data: '2025-11-01', url: 'https://saude.gov.br', uploader: 'Marcos Silva' },
  ],
  'emenda-009': [
    { id: 'anx-009-a', filename: 'Oficio_Solicitacao_Cardiologia.pdf', tipo: 'OFICIO', data: '2025-12-05', url: 'https://gov.br', uploader: 'Carlos Silva' },
  ],
  'emenda-010': [
    { id: 'anx-010-a', filename: 'Proposta_Inclusao_ESF.pdf', tipo: 'PROPOSTA', data: '2026-01-15', url: 'https://gov.br', uploader: 'Ana Costa' },
  ],
  'emenda-021': [
    { id: 'anx-021-a', filename: 'Portaria_Habilitacao_MAC_021.pdf', tipo: 'PORTARIA', data: '2025-01-15', url: 'https://www.in.gov.br/web/dou', uploader: 'Ricardo Oliveira' },
    { id: 'anx-021-b', filename: 'Oficio_Solicitacao_FNS_021.pdf', tipo: 'OFICIO', data: '2025-01-20', url: 'https://gov.br', uploader: 'Ricardo Oliveira' },
  ],
  'emenda-022': [
    { id: 'anx-022-a', filename: 'Proposta_Original_PAP.pdf', tipo: 'PROPOSTA', data: '2025-02-10', url: 'https://gov.br', uploader: 'Ana Costa' },
    { id: 'anx-022-b', filename: 'Deliberacao_CIB_022.pdf', tipo: 'DELIBERACAO_CIE', data: '2025-02-12', url: 'https://saude.gov.br', uploader: 'Ana Costa' },
  ],
  'emenda-023': [
    { id: 'anx-023-a', filename: 'Comprovante_Transferencia_FNS.pdf', tipo: 'COMPROVANTE_FNS', data: '2025-07-21', url: 'https://fns.saude.gov.br', uploader: 'Marcos Silva' },
  ],
  'emenda-024': [
    { id: 'anx-024-a', filename: 'Nota_Fiscal_Servicos_Urgencia.pdf', tipo: 'NOTA_FISCAL', data: '2025-09-01', url: 'https://nfe.fazenda.gov.br', uploader: 'Julia Souza' },
  ],
  'emenda-025': [
    { id: 'anx-025-a', filename: 'Plano_Trabalho_RAPS.pdf', tipo: 'OUTRO', data: '2025-06-05', url: 'https://gov.br', uploader: 'Marcos Silva' },
    { id: 'anx-025-b', filename: 'Portaria_GM_MS_5100.pdf', tipo: 'PORTARIA', data: '2025-09-10', url: 'https://in.gov.br', uploader: 'Marcos Silva' },
  ],
  'emenda-026': [
    { id: 'anx-026-a', filename: 'Projeto_Cirurgias_Eletivas.pdf', tipo: 'PROPOSTA', data: '2026-01-10', url: 'https://saude.gov.br', uploader: 'Ana Costa' },
  ],
  'emenda-027': [
    { id: 'anx-027-a', filename: 'Aprovacao_Conselho_Municipal_027.pdf', tipo: 'DELIBERACAO_CIE', data: '2026-02-15', url: 'https://gov.br', uploader: 'Ricardo Oliveira' },
  ],
  'emenda-028': [
    { id: 'anx-028-a', filename: 'Edital_Pregao_Ambulancias.pdf', tipo: 'OUTRO', data: '2026-03-01', url: 'https://comprasnet.gov.br', uploader: 'Julia Souza' },
  ],
  'emenda-029': [
    { id: 'anx-029-a', filename: 'Oficio_Solicitacao_Cronicos.pdf', tipo: 'OFICIO', data: '2026-04-02', url: 'https://gov.br', uploader: 'Ricardo Oliveira' },
  ],
  'emenda-030': [
    { id: 'anx-030-a', filename: 'Portaria_Habilitacao_Oncologia.pdf', tipo: 'PORTARIA', data: '2026-01-10', url: 'https://in.gov.br', uploader: 'Julia Souza' },
    { id: 'anx-030-b', filename: 'Comprovante_Pagamento_Servicos.pdf', tipo: 'COMPROVANTE_FNS', data: '2026-04-21', url: 'https://fns.saude.gov.br', uploader: 'Julia Souza' },
  ],
}

// ─── Monta DetailedAmendment por ID ─────────────────────────────────────────
export function getVisitorDetailedAmendment(id: string): DetailedAmendment | undefined {
  const emenda = VISITOR_EMENDAS.find((e) => e.id === id)
  if (!emenda) return undefined

  const repasses = VISITOR_REPASSES[id] ?? []
  const despesas = VISITOR_DESPESAS[id] ?? []
  const anexos = VISITOR_ANEXOS[id] ?? []
  const acoes = VISITOR_ACOES[id] ?? []

  // Dynamic Pendency Generation (mimicking Postgres triggers)
  const generatedPendencias: any[] = []

  if (!emenda.portaria) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-portaria`, descricao: 'Falta portaria de habilitação do recurso',
      dispensada: false, resolvida: false, targetType: 'field', targetId: 'portaria',
    })
  }

  if (!emenda.deliberacao_cie) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-cie`, descricao: 'Deliberação CIE não emitida',
      dispensada: false, resolvida: false, targetType: 'field', targetId: 'deliberacao_cie',
    })
  }

  if (!emenda.objeto_emenda) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-objeto`, descricao: 'Objeto da emenda não preenchido',
      dispensada: false, resolvida: false, targetType: 'field', targetId: 'objeto_emenda',
    })
  }

  if (!emenda.numero_proposta) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-proposta`, descricao: 'Número da proposta não informado',
      dispensada: false, resolvida: false, targetType: 'field', targetId: 'numero_proposta',
    })
  }

  const hasOficio = anexos.some(a => a.tipo === 'OFICIO')
  if (!hasOficio) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-oficio`, descricao: 'Anexo tipo OFÍCIO não enviado',
      dispensada: false, resolvida: false, targetType: 'tab', targetId: 'anexos',
    })
  }

  const hasProposta = anexos.some(a => a.tipo === 'PROPOSTA')
  if (!hasProposta) {
    generatedPendencias.push({
      id: `pend-dyn-${id}-anexprop`, descricao: 'Anexo tipo PROPOSTA não enviado',
      dispensada: false, resolvida: false, targetType: 'tab', targetId: 'anexos',
    })
  }

  // Merge dynamic pendencies with any static ones stored for this emenda
  const staticPendencias = VISITOR_PENDENCIAS[id] ?? []
  const pendencias = [...generatedPendencias, ...staticPendencias]

  return {
    ...emenda,
    descricao_completa: `Emenda ${emenda.numero_emenda} — ${emenda.objeto_emenda ?? 'Descrição não informada'}`,
    repasses,
    despesas,
    anexos,
    historico: [],
    pendencias,
    acoes,
  }
}
