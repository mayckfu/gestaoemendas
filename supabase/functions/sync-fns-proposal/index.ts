// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FNS_BASE_URL = 'https://consultafns.saude.gov.br/recursos/proposta'
const FNS_RESOURCES_URL = 'https://consultafns.saude.gov.br/recursos'
const MAX_PROPOSALS_PER_REQUEST = 50

type JsonRecord = Record<string, unknown>

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeProposalNumber(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '')
}

function formatDateFromEpoch(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return new Date(value).toISOString().slice(0, 10)
}

async function fetchFns(path: string, proposalNumber: string) {
  const url = new URL(`${FNS_BASE_URL}/${path}`)
  url.searchParams.set('nuProposta', proposalNumber)

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GestaoEmendas/1.0 (public-data-sync)',
    },
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    throw new Error(`FNS respondeu HTTP ${response.status}`)
  }

  const payload = await response.json()
  return payload?.resultado ?? null
}

async function fetchPublicJson(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GestaoEmendas/1.0 (public-data-sync)',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`FNS respondeu HTTP ${response.status}`)
  const payload = await response.json()
  return payload?.resultado ?? null
}

function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatPortariaTitle(number: unknown, epoch: unknown) {
  const normalizedNumber = Number(String(number ?? '').replace(/\D/g, ''))
  const formattedNumber = Number.isFinite(normalizedNumber)
    ? new Intl.NumberFormat('pt-BR').format(normalizedNumber)
    : String(number ?? '')
  const date = typeof epoch === 'number' ? new Date(epoch) : null
  const formattedDate = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
      }).format(date)
    : null
  return `Portaria GM/MS nº ${formattedNumber}${formattedDate ? `, de ${formattedDate}` : ''}`
}

async function fetchBeneficiaryBankAccounts(official: JsonRecord, proposalNumber: string) {
  const entitiesUrl = new URL(`${FNS_RESOURCES_URL}/consulta-detalhada/entidades`)
  entitiesUrl.searchParams.set('ano', String(official.nuAnoProposta ?? ''))
  entitiesUrl.searchParams.set('proposta', proposalNumber)
  entitiesUrl.searchParams.set('page', '1')
  entitiesUrl.searchParams.set('count', '10')
  const entities = await fetchPublicJson(entitiesUrl)
  const entity = entities?.dados?.find((item: JsonRecord) =>
    digits(item.cpfCnpj) === digits(official.cnpj)
  ) ?? entities?.dados?.[0]
  if (!entity?.codigoMunicipioIBGE) return []

  const accountsUrl = new URL(`${FNS_RESOURCES_URL}/contas-bancarias`)
  accountsUrl.searchParams.set('page', '1')
  accountsUrl.searchParams.set('count', '200')
  accountsUrl.searchParams.set('coEsfera', String(official.coEsfera ?? entity.esferaAdministrativa ?? ''))
  accountsUrl.searchParams.set('sgUf', String(official.sgUf ?? entity.uf ?? ''))
  accountsUrl.searchParams.set('coMunicipio', String(entity.codigoMunicipioIBGE))
  const accounts = await fetchPublicJson(accountsUrl)
  return (accounts?.itensPagina ?? []).filter((account: JsonRecord) =>
    digits(account.nuCnpj) === digits(official.cnpj)
  )
}

function setDetailedQueryParams(
  url: URL,
  official: JsonRecord,
  entity: JsonRecord,
  proposalNumber: string,
  queryYear: string,
) {
  const params: Record<string, string> = {
    page: '1', count: '200', ano: queryYear, mes: '',
    tipoConsulta: '2', blocos: '', grupo: '', planoOrcamentario: '', componentes: '',
    acoes: '', estado: String(official.sgUf ?? entity.uf ?? ''),
    municipio: String(entity.codigoMunicipioIBGE ?? ''), repasse: '', dataInicialOb: '',
    dataFinalOb: '', cpfCnpjUg: digits(official.cnpj), proposta: proposalNumber,
  }
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
}

async function fetchDetailedPayments(official: JsonRecord, proposalNumber: string) {
  const paymentYears = (official.pagamentos ?? []).flatMap((payment: JsonRecord) => {
    const orderYear = String(payment.nuOb ?? '').match(/^\d{4}/)?.[0]
    const dateYear = typeof payment.dtCriacaoSiafi === 'number'
      ? String(new Date(payment.dtCriacaoSiafi).getUTCFullYear())
      : null
    return [orderYear, dateYear].filter(Boolean)
  })
  const candidateYears = [...new Set([
    ...paymentYears,
    String(official.nuAnoProposta ?? ''),
  ].filter(Boolean))]

  let entity: JsonRecord | null = null
  let queryYear = candidateYears[0] ?? String(official.nuAnoProposta ?? '')
  for (const year of candidateYears) {
    const entitiesUrl = new URL(`${FNS_RESOURCES_URL}/consulta-detalhada/entidades`)
    entitiesUrl.searchParams.set('ano', year)
    entitiesUrl.searchParams.set('proposta', proposalNumber)
    entitiesUrl.searchParams.set('page', '1')
    entitiesUrl.searchParams.set('count', '10')
    const entities = await fetchPublicJson(entitiesUrl)
    entity = entities?.dados?.find((item: JsonRecord) =>
      digits(item.cpfCnpj) === digits(official.cnpj)
    ) ?? entities?.dados?.[0] ?? null
    if (entity) {
      queryYear = year
      break
    }
  }
  if (!entity) return []

  const actionsUrl = new URL(`${FNS_RESOURCES_URL}/consulta-detalhada/detalhe-acao`)
  setDetailedQueryParams(actionsUrl, official, entity, proposalNumber, queryYear)
  const actions = await fetchPublicJson(actionsUrl)
  const detailedPayments: JsonRecord[] = []

  for (const action of actions?.dados ?? []) {
    const paymentsUrl = new URL(`${FNS_RESOURCES_URL}/consulta-detalhada/detalhe-pagamento`)
    setDetailedQueryParams(paymentsUrl, official, entity, proposalNumber, queryYear)
    paymentsUrl.searchParams.set('acoes', String(action.id))
    const payments = await fetchPublicJson(paymentsUrl)
    detailedPayments.push(...(payments?.dados ?? []))
  }
  return detailedPayments
}

function bankName(code: unknown) {
  const names: Record<string, string> = {
    '001': 'Banco do Brasil',
    '104': 'Caixa Econômica Federal',
  }
  return names[String(code ?? '')] ?? `Banco ${String(code ?? '')}`
}

function mapOfficialStatus(description: unknown) {
  const value = String(description ?? '').toLocaleUpperCase('pt-BR')

  if (value.includes('PROPOSTA PAGA')) {
    return { situacao: 'PAGA', status_interno: 'PROPOSTA_PAGA' }
  }
  if (value.includes('EMPENHADA') && value.includes('FORMALIZA')) {
    return {
      situacao: 'EMPENHADA_AGUARDANDO_FORMALIZACAO',
      status_interno: 'EMPENHADA_AGUARDANDO_FORMALIZACAO',
    }
  }
  if (value.includes('ANÁLISE TÉCNICA') || value.includes('ANALISE TECNICA')) {
    return { situacao: 'EM_ANALISE', status_interno: 'ANALISE_TECNICA_MERITO' }
  }
  if (value.includes('FAVORÁVEL') || value.includes('FAVORAVEL')) {
    return {
      situacao: 'FAVORAVEL',
      status_interno: 'PROPOSTA_FAVORAVEL_AGUARDANDO_CLASSIFICACAO',
    }
  }
  if (value.includes('PAGAMENTO')) {
    return {
      situacao: 'LIBERADO_PAGAMENTO_FNS',
      status_interno: 'EM_ANALISE_PAGAMENTO',
    }
  }

  return { situacao: 'EM_ANALISE', status_interno: null }
}

function assignSafeField(
  current: JsonRecord,
  updates: JsonRecord,
  conflicts: JsonRecord,
  field: string,
  officialValue: unknown,
) {
  if (officialValue === null || officialValue === undefined || officialValue === '') return

  const currentValue = current[field]
  if (currentValue === null || currentValue === undefined || currentValue === '') {
    updates[field] = officialValue
    return
  }

  if (String(currentValue) !== String(officialValue)) {
    conflicts[field] = { current: currentValue, official: officialValue }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Não autenticado' }, 401)

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.status !== 'ATIVO' || !['ADMIN', 'GESTOR', 'ANALISTA'].includes(profile.role)) {
      return jsonResponse({ error: 'Usuário sem permissão para sincronizar o FNS' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const apply = body.apply === true
    const requestYear = Number.isInteger(body.request_year) ? body.request_year : null
    const batchId = typeof body.batch_id === 'string' && body.batch_id ? body.batch_id : null
    const requestedIds = Array.isArray(body.emenda_ids)
      ? body.emenda_ids.filter((value: unknown) => typeof value === 'string')
      : body.emenda_id
        ? [body.emenda_id]
        : []
    const requestedNumbers = Array.isArray(body.proposal_numbers)
      ? body.proposal_numbers.map(normalizeProposalNumber).filter(Boolean)
      : []

    const isBulkRequest = requestedIds.length > 1 || requestedNumbers.length > 1 || batchId !== null
    if (isBulkRequest && profile.role !== 'ADMIN') {
      return jsonResponse({ error: 'Somente administradores podem executar sincronização em massa' }, 403)
    }

    if (requestedIds.length === 0 && requestedNumbers.length === 0) {
      return jsonResponse({ error: 'Informe emenda_id, emenda_ids ou proposal_numbers' }, 400)
    }
    if (requestedIds.length + requestedNumbers.length > MAX_PROPOSALS_PER_REQUEST) {
      return jsonResponse({ error: `Máximo de ${MAX_PROPOSALS_PER_REQUEST} propostas por execução` }, 400)
    }

    let query = adminClient.from('emendas').select('*')
    query = requestedIds.length > 0
      ? query.in('id', requestedIds)
      : query.in('numero_proposta', requestedNumbers)

    const { data: amendments, error: amendmentsError } = await query
    if (amendmentsError) throw amendmentsError

    const results = []

    for (const amendment of amendments ?? []) {
      const proposalNumber = normalizeProposalNumber(amendment.numero_proposta)
      if (!proposalNumber) {
        results.push({ emenda_id: amendment.id, success: false, error: 'Emenda sem número de proposta' })
        continue
      }

      try {
        const [official, stages] = await Promise.all([
          fetchFns('obter-proposta', proposalNumber),
          fetchFns('obter-proposta-etapa', proposalNumber),
        ])

        if (!official?.nuProposta) {
          await adminClient.from('fns_sync_history').insert({
            emenda_id: amendment.id,
            numero_proposta: proposalNumber,
            status: 'NOT_FOUND',
            official_data: official,
            stages_data: stages,
            synced_by: user.id,
            request_year: requestYear,
            batch_id: batchId,
          })
          results.push({ emenda_id: amendment.id, numero_proposta: proposalNumber, success: false, error: 'Proposta não encontrada no FNS' })
          continue
        }

        const changes: JsonRecord = {}
        const conflicts: JsonRecord = {}
        const mappedStatus = mapOfficialStatus(official.situacao?.descricaoSituacaoproposta)

        if (official.nuPortaria) {
          const officialPortariaTitle = formatPortariaTitle(official.nuPortaria, official.dtPortaria)
          const currentPortaria = String(amendment.portaria ?? '').trim()
          const officialPortariaDigits = digits(official.nuPortaria)
          const currentPortariaDigits = digits(currentPortaria)

          if (
            !currentPortaria ||
            currentPortariaDigits === officialPortariaDigits ||
            currentPortariaDigits.startsWith(officialPortariaDigits)
          ) {
            if (currentPortaria !== officialPortariaTitle) {
              changes.portaria = officialPortariaTitle
            }
          } else {
            conflicts.portaria = {
              current: amendment.portaria,
              official: officialPortariaTitle,
            }
          }
        }
        assignSafeField(amendment, changes, conflicts, 'valor_total', official.vlProposta)
        assignSafeField(amendment, changes, conflicts, 'numero_emenda', official.parlamentares?.[0]?.coEmendaPolitica)

        if (amendment.situacao !== mappedStatus.situacao) changes.situacao = mappedStatus.situacao
        if (mappedStatus.status_interno && amendment.status_interno !== mappedStatus.status_interno) {
          changes.status_interno = mappedStatus.status_interno
        }

        const payments = Array.isArray(official.pagamentos) ? official.pagamentos : []
        const paymentPreview = []
        let detailedPayments: JsonRecord[] = []
        try {
          detailedPayments = await fetchDetailedPayments(official, proposalNumber)
        } catch (detailError) {
          console.warn('[FNS Sync] Falha ao consultar pagamento detalhado:', detailError)
        }

        for (const payment of payments) {
          const bankOrder = String(payment.nuOb ?? '').trim()
          if (!bankOrder) continue

          const bankOrderDigits = digits(bankOrder)
          const detailedPayment = detailedPayments.find((item) => {
            const detailedOrder = digits(item.numeroDocumentoSiafi)
            return detailedOrder && bankOrderDigits.endsWith(detailedOrder)
          })

          const verifiedBanking = detailedPayment?.contaCorrente ? {
            bank_code: String(detailedPayment.codigoBanco ?? ''),
            bank_name: bankName(detailedPayment.codigoBanco),
            branch_number: String(detailedPayment.codigoAgencia ?? ''),
            account_number: String(detailedPayment.contaCorrente),
            banking_verified_at: new Date().toISOString(),
            fns_payment_data: detailedPayment,
          } : {}

          const { data: existingTransfer } = await adminClient
            .from('repasses')
            .select('id,valor,data,status,bank_code,branch_number,account_number')
            .eq('emenda_id', amendment.id)
            .eq('ordem_bancaria', bankOrder)
            .maybeSingle()

          const transfer = {
            emenda_id: amendment.id,
            data: formatDateFromEpoch(payment.dtCriacaoSiafi) ?? new Date().toISOString().slice(0, 10),
            valor: Number(payment.vlLiquido ?? 0),
            fonte: 'FNS',
            status: 'REPASSADO',
            ordem_bancaria: bankOrder,
            observacoes: `Importado do FNS. Parcela: ${payment.nuParcela ?? 'não informada'}. Processo: ${payment.nuProcesso ?? 'não informado'}.`,
            ...verifiedBanking,
          }

          const bankingChanged = Boolean(
            existingTransfer && detailedPayment?.contaCorrente && (
              String(existingTransfer.bank_code ?? '') !== String(verifiedBanking.bank_code ?? '') ||
              String(existingTransfer.branch_number ?? '') !== String(verifiedBanking.branch_number ?? '') ||
              String(existingTransfer.account_number ?? '') !== String(verifiedBanking.account_number ?? '')
            )
          )
          paymentPreview.push({
            ...transfer,
            action: existingTransfer ? (bankingChanged ? 'update' : 'existing') : 'insert',
          })
          if (apply && !existingTransfer) {
            const { error: transferError } = await adminClient.from('repasses').insert(transfer)
            if (transferError) throw transferError
          } else if (apply && existingTransfer && bankingChanged) {
            const { error: bankingError } = await adminClient
              .from('repasses')
              .update(verifiedBanking)
              .eq('id', existingTransfer.id)
            if (bankingError) throw bankingError
          }
        }

        const attachmentsPreview = []
        if (official.nuPortaria) {
          const portariaTitle = formatPortariaTitle(official.nuPortaria, official.dtPortaria)
          const publicationDate = formatDateFromEpoch(official.dtPortaria)
          const officialSearchUrl = new URL('https://www.in.gov.br/consulta/-/buscar/dou')
          officialSearchUrl.searchParams.set('q', `"${portariaTitle}"`)

          const { data: existingPortarias } = await adminClient
            .from('anexos')
            .select('id,filename,url,metadata')
            .eq('emenda_id', amendment.id)
            .eq('tipo', 'PORTARIA')

          const existingPortaria = (existingPortarias ?? []).find((attachment: JsonRecord) =>
            digits(attachment.metadata?.portaria_number) === digits(official.nuPortaria) ||
            digits(attachment.filename).includes(digits(official.nuPortaria))
          )
          const attachment = {
            emenda_id: amendment.id,
            tipo: 'PORTARIA',
            filename: portariaTitle,
            url: officialSearchUrl.toString(),
            data_documento: publicationDate,
            uploader: user.id,
            metadata: {
              source: 'FNS',
              portaria_number: String(official.nuPortaria),
              proposal_number: proposalNumber,
              link_kind: 'official_dou_search',
            },
          }
          attachmentsPreview.push({ ...attachment, action: existingPortaria ? 'existing' : 'insert' })
          if (apply && !existingPortaria) {
            const { error: attachmentError } = await adminClient.from('anexos').insert(attachment)
            if (attachmentError) throw attachmentError
          }
        }

        let bankAccounts: JsonRecord[] = []
        try {
          bankAccounts = await fetchBeneficiaryBankAccounts(official, proposalNumber)
          if (apply) {
            for (const account of bankAccounts) {
              const accountRecord = {
                emenda_id: amendment.id,
                fns_account_id: String(account.coContaBancaria),
                beneficiary_cnpj: String(account.nuCnpj ?? ''),
                beneficiary_name: String(account.noEntidade ?? ''),
                bank_code: String(account.coBanco ?? ''),
                branch_number: String(account.coAgencia ?? ''),
                account_number: String(account.nuConta ?? ''),
                account_type: String(account.dsContaBancaria ?? ''),
                balance: Number(account.vlSaldo ?? 0),
                balance_updated_at: formatDateFromEpoch(account.dtAtualizacao),
                official_data: account,
                synced_at: new Date().toISOString(),
              }
              const { error: accountError } = await adminClient
                .from('fns_bank_accounts')
                .upsert(accountRecord, { onConflict: 'emenda_id,fns_account_id' })
              if (accountError) throw accountError
            }
          }
        } catch (accountError) {
          console.warn('[FNS Sync] Falha ao consultar contas bancárias:', accountError)
        }

        if (apply && Object.keys(changes).length > 0) {
          const { error: updateError } = await adminClient
            .from('emendas')
            .update(changes)
            .eq('id', amendment.id)
          if (updateError) throw updateError
        }

        const historyStatus = apply ? 'APPLIED' : 'PREVIEW'
        const { error: historyError } = await adminClient.from('fns_sync_history').insert({
          emenda_id: amendment.id,
          numero_proposta: proposalNumber,
          status: historyStatus,
          official_data: official,
          stages_data: stages,
          applied_changes: apply ? changes : {},
          conflicts,
          synced_by: user.id,
          request_year: requestYear,
          batch_id: batchId,
        })
        if (historyError) throw historyError

        results.push({
          emenda_id: amendment.id,
          numero_proposta: proposalNumber,
          success: true,
          applied: apply,
          official,
          stages,
          changes,
          conflicts,
          payments: paymentPreview,
          attachments: attachmentsPreview,
          bank_accounts: bankAccounts,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await adminClient.from('fns_sync_history').insert({
          emenda_id: amendment.id,
          numero_proposta: proposalNumber,
          status: 'ERROR',
          error_message: message,
          synced_by: user.id,
          request_year: requestYear,
          batch_id: batchId,
        })
        results.push({ emenda_id: amendment.id, numero_proposta: proposalNumber, success: false, error: message })
      }
    }

    return jsonResponse({ success: true, apply, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[FNS Sync] Fatal error:', message)
    return jsonResponse({ error: message }, 500)
  }
})
