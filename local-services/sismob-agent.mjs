import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const PORT = 8787
const SISMOB_URL = 'https://sismob.saude.gov.br/sismob2/#'
const SISMOB_MUNICIPIO_URL = 'https://sismob.saude.gov.br/sismob2/#/municipio'
const allowedOrigins = new Set([
  'http://127.0.0.1:8080',
  'http://localhost:8080',
])

let browser = null
let context = null
let page = null
let lastError = null
let activeJob = null
const WORKER_VERSION = '1.0.1-reserve'
const workerConfigPath = new URL('./worker-config.json', import.meta.url)
const credentialsPath = new URL('./worker-credentials.dpapi', import.meta.url)
let fleetTimer = null

const chromeCandidates = process.platform === 'win32'
  ? [
      `${process.env.PROGRAMFILES || ''}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)'] || ''}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES || ''}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ]
  : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge']

function getExecutable() {
  return chromeCandidates.find((candidate) => candidate && existsSync(candidate))
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function ensureLocalRequest(req, res) {
  const origin = req.headers.origin
  const host = req.headers.host || ''
  if (origin && !allowedOrigins.has(origin)) {
    send(res, 403, { error: 'Origem não autorizada.' })
    return false
  }
  if (!/^127\.0\.0\.1:8787$|^localhost:8787$/.test(host)) {
    send(res, 403, { error: 'Este serviço aceita somente conexões locais.' })
    return false
  }
  return true
}

function redact(value) {
  return String(value || '')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[E-MAIL PROTEGIDO]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF PROTEGIDO]')
    .replace(/(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/g, '[TELEFONE PROTEGIDO]')
}

async function status() {
  if (!page || page.isClosed()) return { state: 'closed', authenticated: false, lastError }
  const url = page.url()
  let title = ''
  let text = ''
  try {
    title = await page.title()
    text = (await page.locator('body').innerText({ timeout: 1500 })).slice(0, 12000)
  } catch {}
  const authenticated = /#\/municipio/.test(url)
    && (/visualizar-proposta/i.test(url) || /Propostas|Obras|Informações da obra/i.test(text))
  return {
    state: authenticated ? 'authenticated' : 'waiting_login',
    authenticated,
    url,
    title,
    onProposal: /visualizar-proposta/.test(url),
    lastError,
  }
}

async function openSession() {
  if (page && !page.isClosed()) {
    await page.bringToFront()
    return status()
  }
  const executablePath = getExecutable()
  if (!executablePath) throw new Error('Google Chrome ou Microsoft Edge não foi encontrado neste computador.')
  lastError = null
  browser = await chromium.launch({ executablePath, headless: false })
  context = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: false,
  })
  page = await context.newPage()
  await page.goto(SISMOB_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  const initialText = await page.locator('body').innerText().catch(() => '')
  if (initialText.trim().length < 20) {
    await page.goto(SISMOB_MUNICIPIO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  }
  return status()
}

async function loginSession(username, password) {
  if (!page || page.isClosed()) await openSession()
  if (!username || !password) throw new Error('Usuário e senha são obrigatórios.')
  const userField = page.locator('#USUARIO_FIELD')
  const passwordField = page.locator('#SENHA_FIELD')
  const enterButton = page.locator('#ENTRAR_BUTTON')
  await userField.waitFor({ state: 'visible', timeout: 30000 })
  await userField.fill(String(username))
  await passwordField.fill(String(password))
  await enterButton.click()
  await page.waitForTimeout(3000)
  const current = await status()
  if (!current.authenticated) {
    const message = await page.locator('.v-Notification, [role="alert"]').allInnerTexts().catch(() => [])
    throw new Error(message.filter(Boolean).join(' ') || 'O SISMOB não confirmou a autenticação.')
  }
  await dismissReadOnlyNotices()
  return current
}

async function dismissReadOnlyNotices() {
  const understood = page?.locator('#MODAL_OK_ENTENDI_BUTTON')
  if (understood && await understood.isVisible({ timeout: 1200 }).catch(() => false)) {
    await understood.click({ force: true })
    await page.waitForTimeout(500)
  }
}

async function collectCurrent() {
  const current = await status()
  if (!current.authenticated) throw new Error('Conclua o login na janela do SISMOB primeiro.')
  if (!current.onProposal) throw new Error('Abra uma proposta no SISMOB antes de coletar.')

  const sectionNames = [
    'Informações gerais',
    'Recurso',
    'Ambientes mínimos',
    'Documentos',
    'Fotografias',
    'Responsáveis',
    'Projeto',
    'Licitações',
    'Execução',
    'Histórico de monitoramentos',
    'Histórico',
  ]
  const sectionTexts = []
  for (const sectionName of sectionNames) {
    const heading = page.getByText(sectionName, { exact: true }).last()
    if (!(await heading.isVisible({ timeout: 350 }).catch(() => false))) continue
    try {
      await heading.click({ force: true })
      await page.waitForTimeout(250)
      const bodyText = await page.locator('body').innerText()
      sectionTexts.push(`\n===== ${sectionName.toUpperCase()} =====\n${bodyText}`)
    } catch {}
  }

  const raw = await page.evaluate(() => {
    const bodyText = document.body.innerText || ''
    const proposal = bodyText.match(/\b\d{2,6}\.\d{3,6}\/\d{2}-\d{3}\b/)?.[0]
      || bodyText.match(/\b\d{15,20}\b/)?.[0]
      || null
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"],.v-captiontext,.panel-title'))
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
    return {
      proposal,
      url: location.href,
      title: document.title,
      headings: [...new Set(headings)].slice(0, 100),
      text: bodyText.slice(0, 100000),
    }
  })

  const protectedText = redact(`${raw.text}${sectionTexts.join('')}`.slice(0, 500000))
  return {
    numero_proposta: raw.proposal,
    source_url: raw.url,
    collected_at: new Date().toISOString(),
    headings: raw.headings.map(redact),
    protected_text: protectedText,
    contains_redactions: protectedText !== raw.text,
  }
}

async function proposalNumbersOnPage() {
  return page.evaluate(() => {
    const matches = (document.body.innerText || '').match(/\b\d{2,6}\.\d{3,7}\/\d{2}-\d{3}\b/g) || []
    return [...new Set(matches)]
  })
}

async function openProposalByNumber(number) {
  await dismissReadOnlyNotices()
  await page.waitForFunction(() => !document.querySelector('.v-window-modalitycurtain'), null, { timeout: 10000 }).catch(() => {})
  const card = page.locator('[id^="CARD_PROPOSTA_"]').filter({ hasText: number }).first()
  const text = page.getByText(number, { exact: false }).first()
  const target = await card.isVisible({ timeout: 1500 }).catch(() => false) ? card : text
  if (!(await target.isVisible({ timeout: 1500 }).catch(() => false))) return false
  const before = page.url()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await target.click({ timeout: 5000, force: true }).catch(() => {})
    await page.waitForTimeout(1500)
    if (/visualizar-proposta/.test(page.url())) return true
    await page.waitForTimeout(800)
  }
  if (/visualizar-proposta/.test(page.url())) return true
  if (page.url() !== before) return /visualizar-proposta/.test(page.url())
  return false
}

async function findAndClickNextPage() {
  const selectors = [
    'button[aria-label*="Próxim" i]',
    '[role="button"][aria-label*="Próxim" i]',
    'button[title*="Próxim" i]',
    '.v-button:has-text("Próximo")',
  ]
  for (const selector of selectors) {
    const candidate = page.locator(selector).last()
    if (await candidate.isVisible({ timeout: 300 }).catch(() => false)) {
      if (await candidate.isDisabled().catch(() => false)) return false
      await candidate.click()
      await page.waitForTimeout(1000)
      return true
    }
  }
  return false
}

async function runCollectAll(job) {
  try {
    const current = await status()
    if (!current.authenticated) throw new Error('Conclua o login na janela do SISMOB primeiro.')
    await page.goto(SISMOB_MUNICIPIO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(1500)
    await dismissReadOnlyNotices()
    const visited = new Set()

    for (let pageNumber = 1; pageNumber <= 100 && !job.cancelled; pageNumber += 1) {
      const numbers = (await proposalNumbersOnPage()).filter((number) => !visited.has(number))
      if (!numbers.length && pageNumber === 1) {
        throw new Error('Nenhum cartão de proposta foi encontrado na página inicial do SISMOB.')
      }
      for (const number of numbers) {
        if (job.cancelled) break
        visited.add(number)
        job.current = number
        job.discovered = visited.size
        try {
          if (await openProposalByNumber(number)) {
            const snapshot = await collectCurrent()
            snapshot.numero_proposta = snapshot.numero_proposta || number
            job.results.push(snapshot)
          } else {
            job.errors.push({ numero_proposta: number, error: 'O cartão não abriu a tela de visualização.' })
          }
        } catch (error) {
          job.errors.push({ numero_proposta: number, error: error instanceof Error ? error.message : String(error) })
        } finally {
          await page.goto(SISMOB_MUNICIPIO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
          await page.waitForFunction(() => !document.querySelector('.v-window-modalitycurtain'), null, { timeout: 10000 }).catch(() => {})
          await page.waitForTimeout(1800)
          job.processed += 1
        }
      }
      if (!(await findAndClickNextPage())) break
    }
    job.state = job.cancelled ? 'cancelled' : 'completed'
  } catch (error) {
    job.state = 'failed'
    job.error = error instanceof Error ? error.message : String(error)
  } finally {
    job.finishedAt = new Date().toISOString()
  }
}

function startCollectAll() {
  if (activeJob?.state === 'running') return activeJob
  activeJob = {
    id: crypto.randomUUID(),
    state: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    current: null,
    discovered: 0,
    processed: 0,
    results: [],
    errors: [],
    error: null,
    cancelled: false,
  }
  void runCollectAll(activeJob)
  return activeJob
}

async function runCollectUrls(job, proposals) {
  try {
    const current = await status()
    if (!current.authenticated) throw new Error('Conclua o login na janela do SISMOB primeiro.')
    job.discovered = proposals.length
    for (const proposal of proposals) {
      if (job.cancelled) break
      job.current = proposal.numero_proposta
      try {
        const url = new URL(proposal.source_url)
        if (url.origin !== 'https://sismob.saude.gov.br' || !/\/sismob2\/#\/municipio\/visualizar-proposta/.test(url.href)) {
          throw new Error('Endereço de proposta não autorizado.')
        }
        await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.waitForTimeout(1200)
        const snapshot = await collectCurrent()
        snapshot.numero_proposta = snapshot.numero_proposta || proposal.numero_proposta
        job.results.push(snapshot)
      } catch (error) {
        job.errors.push({ numero_proposta: proposal.numero_proposta, error: error instanceof Error ? error.message : String(error) })
      } finally {
        job.processed += 1
      }
    }
    job.state = job.cancelled ? 'cancelled' : 'completed'
  } catch (error) {
    job.state = 'failed'
    job.error = error instanceof Error ? error.message : String(error)
  } finally {
    job.finishedAt = new Date().toISOString()
  }
}

function startCollectUrls(proposals) {
  if (activeJob?.state === 'running') return activeJob
  activeJob = {
    id: crypto.randomUUID(), state: 'running', startedAt: new Date().toISOString(), finishedAt: null,
    current: null, discovered: 0, processed: 0, results: [], errors: [], error: null, cancelled: false,
  }
  void runCollectUrls(activeJob, proposals)
  return activeJob
}

function publicJob(job) {
  if (!job) return null
  const { cancelled: _cancelled, ...safe } = job
  return safe
}

function loadWorkerConfig() {
  if (!existsSync(workerConfigPath)) return null
  return JSON.parse(readFileSync(workerConfigPath, 'utf8'))
}

function readProtectedCredentials() {
  if (!existsSync(credentialsPath)) throw new Error('Credencial protegida do SISMOB não configurada neste computador.')
  const nativeCredentialsPath = fileURLToPath(credentialsPath).replace(/'/g,"''")
  const script = `$d=Get-Content -Raw -LiteralPath '${nativeCredentialsPath}'|ConvertFrom-Json;$s=ConvertTo-SecureString $d.password;$b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{$p=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b);[Console]::Write(($d.username+'|'+$p))}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}`
  const result = spawnSync('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0 || !String(result.stdout || '').includes('|')) {
    const nativeError = String(result.stderr || '').trim()
    throw new Error(`O Windows não conseguiu liberar a credencial protegida (${nativeError || `código ${result.status}`}).`)
  }
  const separator = result.stdout.indexOf('|')
  return { username: result.stdout.slice(0, separator), password: result.stdout.slice(separator + 1) }
}

async function workerApi(config, body) {
  const response = await fetch(config.function_url, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${config.anon_key}`, 'x-worker-secret':config.worker_secret }, body:JSON.stringify({ worker_id:config.worker_id, ...body }) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Servidor respondeu ${response.status}`)
  return data
}

async function executeFleetJob(config, job) {
  const startedAt = new Date().toISOString()
  try {
    await workerApi(config,{action:'progress',job_id:job.id,started_at:startedAt,progress:1,current_item:'Iniciando sessão segura'})
    const credentials = readProtectedCredentials()
    await loginSession(credentials.username, credentials.password)
    credentials.password = ''
    const localJob = startCollectAll()
    while (localJob.state === 'running') {
      const total = Math.max(localJob.discovered,1)
      await workerApi(config,{action:'progress',job_id:job.id,started_at:startedAt,progress:Math.min(95,Math.round(localJob.processed/total*95)),current_item:localJob.current,total_items:localJob.discovered,processed_items:localJob.processed,success_items:localJob.results.length,failed_items:localJob.errors.length})
      await new Promise(resolve=>setTimeout(resolve,3000))
    }
    for (const snapshot of localJob.results) await workerApi(config,{action:'save_snapshot',job_id:job.id,snapshot})
    const success = localJob.state === 'completed'
      && localJob.discovered > 0
      && localJob.errors.length === 0
      && localJob.results.length === localJob.discovered
    await closeSession()
    await workerApi(config,{action:'finish',job_id:job.id,success,progress:success?100:95,result_summary:{discovered:localJob.discovered,processed:localJob.processed,success:localJob.results.length,failed:localJob.errors.length,errors:localJob.errors},error:success?null:(localJob.error||`Coleta incompleta: ${localJob.results.length} de ${localJob.discovered} proposta(s).`)})
  } catch (error) {
    await closeSession().catch(()=>{})
    await workerApi(config,{action:'finish',job_id:job.id,success:false,error:error instanceof Error?error.message:String(error)}).catch(()=>{})
  }
}

async function fleetTick() {
  const config = loadWorkerConfig()
  if (!config || activeJob?.state === 'running') return
  try {
    await workerApi(config,{action:'heartbeat',busy:false,version:WORKER_VERSION,metadata:{hostname:process.env.COMPUTERNAME||'Windows',platform:process.platform,role:'RESERVE'}})
    const { job } = await workerApi(config,{action:'claim'})
    if (job) await executeFleetJob(config,job)
  } catch (error) {
    console.error(`Agente de frota: ${error instanceof Error?error.message:String(error)}`)
  }
}

if (loadWorkerConfig()) {
  void fleetTick()
  fleetTimer = setInterval(()=>void fleetTick(),20_000)
  console.log('Computador reserva conectado à frota SISMOB.')
}

async function closeSession() {
  let logoutAttempted = false
  if (page && !page.isClosed()) {
    try {
      if ((await status()).authenticated) {
        await page.goto(SISMOB_MUNICIPIO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
        await dismissReadOnlyNotices()
        const profileMenu = page.locator('#HEADER_MENUPERFIL_BUTTON')
        if (await profileMenu.isVisible({ timeout: 1500 }).catch(() => false)) {
          await profileMenu.click({ force: true })
          await page.waitForTimeout(700)
        }
      }
      const logoutByButton = page.locator('button, [role="button"], .v-button').filter({ hasText: /sair/i }).last()
      const logout = await logoutByButton.isVisible({ timeout: 1200 }).catch(() => false)
        ? logoutByButton
        : page.getByText(/sair/i).last()
      if (await logout.isVisible({ timeout: 1500 })) {
        logoutAttempted = true
        await logout.click({ timeout: 3000 })
        await page.waitForTimeout(750)
      }
    } catch {}
  }
  try { await context?.clearCookies() } catch {}
  try { await browser?.close() } catch {}
  browser = null
  context = null
  page = null
  return { success: true, logoutAttempted, localSessionDestroyed: true }
}

const server = http.createServer(async (req, res) => {
  if (!ensureLocalRequest(req, res)) return
  try {
    const path = new URL(req.url || '/', 'http://127.0.0.1').pathname
    if (req.method === 'GET' && path === '/local-api/sismob/health') {
      return send(res, 200, { ok: true, browserAvailable: Boolean(getExecutable()) })
    }
    if (req.method === 'GET' && path === '/local-api/sismob/session/status') {
      return send(res, 200, await status())
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/open') {
      await readBody(req)
      return send(res, 200, await openSession())
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/login') {
      const body = await readBody(req)
      return send(res, 200, await loginSession(body.username, body.password))
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/collect-current') {
      await readBody(req)
      return send(res, 200, await collectCurrent())
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/collect-all') {
      await readBody(req)
      const current = await status()
      if (!current.authenticated) return send(res, 409, { error: 'Conclua o login na janela do SISMOB primeiro.' })
      return send(res, 202, publicJob(startCollectAll()))
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/collect-urls') {
      const body = await readBody(req)
      const proposals = Array.isArray(body.proposals) ? body.proposals.slice(0, 100) : []
      if (!proposals.length) return send(res, 400, { error: 'Nenhuma proposta válida foi informada.' })
      const current = await status()
      if (!current.authenticated) return send(res, 409, { error: 'Conclua o login na janela do SISMOB primeiro.' })
      return send(res, 202, publicJob(startCollectUrls(proposals)))
    }
    if (req.method === 'GET' && path === '/local-api/sismob/session/collect-all') {
      return send(res, 200, { job: publicJob(activeJob) })
    }
    if (req.method === 'POST' && path === '/local-api/sismob/session/close') {
      await readBody(req)
      return send(res, 200, await closeSession())
    }
    return send(res, 404, { error: 'Rota não encontrada.' })
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    return send(res, 500, { error: lastError })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Agente local do SISMOB pronto em http://127.0.0.1:${PORT}`)
})

async function shutdown() {
  if (fleetTimer) clearInterval(fleetTimer)
  if (activeJob?.state === 'running') activeJob.cancelled = true
  await closeSession()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
