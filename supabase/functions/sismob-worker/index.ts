import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, '0')).join('')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const workerId = String(body.worker_id || '')
    const secret = String(req.headers.get('x-worker-secret') || '')
    if (!workerId || !secret) return json({ error: 'Identificação do computador ausente.' }, 401)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: worker } = await admin.from('sismob_workers').select('*').eq('id', workerId).eq('enabled', true).maybeSingle()
    if (!worker || worker.secret_hash !== await hash(secret)) return json({ error: 'Computador não autorizado.' }, 403)

    const action = String(body.action || 'heartbeat')
    if (action === 'heartbeat') {
      await admin.from('sismob_workers').update({ last_seen_at: new Date().toISOString(), status: body.busy ? 'BUSY' : 'ONLINE', version: body.version || null, metadata: body.metadata || {}, last_error: body.last_error || null }).eq('id', workerId)
      if (body.job_id) await admin.from('sismob_sync_jobs').update({ heartbeat_at: new Date().toISOString(), lease_until: new Date(Date.now()+120000).toISOString() }).eq('id', body.job_id).eq('claimed_by', workerId)
      return json({ ok: true })
    }
    if (action === 'claim') {
      const { data, error } = await admin.rpc('claim_next_sismob_job', { p_worker_id: workerId })
      if (error) throw error
      return json({ job: data?.[0] || null })
    }
    if (action === 'known_proposals') {
      const { data, error } = await admin.from('sismob_sync_snapshots').select('numero_proposta,source_url,collected_at').not('numero_proposta', 'is', null).order('collected_at', { ascending: false }).limit(500)
      if (error) throw error
      const unique = new Map<string, { numero_proposta: string; source_url: string }>()
      for (const row of data || []) {
        if (!unique.has(row.numero_proposta) && /^https:\/\/sismob\.saude\.gov\.br\/sismob2\/#\/municipio\/visualizar-proposta\?proposta-id=\d+$/.test(row.source_url || '')) {
          unique.set(row.numero_proposta, { numero_proposta: row.numero_proposta, source_url: row.source_url })
        }
      }
      return json({ proposals: [...unique.values()] })
    }
    if (action === 'progress') {
      const patch = { status: 'RUNNING', started_at: body.started_at || new Date().toISOString(), heartbeat_at: new Date().toISOString(), lease_until: new Date(Date.now()+120000).toISOString(), progress: body.progress || 0, current_item: body.current_item || null, total_items: body.total_items || null, processed_items: body.processed_items || 0, success_items: body.success_items || 0, failed_items: body.failed_items || 0 }
      await admin.from('sismob_sync_jobs').update(patch).eq('id', body.job_id).eq('claimed_by', workerId)
      return json({ ok: true })
    }
    if (action === 'save_snapshot') {
      const snapshot = body.snapshot
      if (!snapshot?.numero_proposta || !snapshot?.source_url || !snapshot?.collected_at) return json({ error: 'Snapshot inválido.' }, 400)
      const { error } = await admin.from('sismob_sync_snapshots').upsert({ numero_proposta: snapshot.numero_proposta, source_url: snapshot.source_url, collected_at: snapshot.collected_at, snapshot, created_by: null }, { onConflict: 'numero_proposta,collected_at', ignoreDuplicates: true })
      if (error && !String(error.message).includes('no unique')) throw error
      return json({ ok: true })
    }
    if (action === 'finish') {
      const counts = body.result_summary || {}
      await admin.from('sismob_sync_jobs').update({ status: body.success ? 'COMPLETED' : 'FAILED', finished_at: new Date().toISOString(), lease_until: null, heartbeat_at: new Date().toISOString(), progress: body.success ? 100 : body.progress || 0, processed_items: counts.processed || 0, success_items: counts.success || 0, failed_items: counts.failed || 0, total_items: counts.discovered || null, result_summary: counts, error: body.error || null }).eq('id', body.job_id).eq('claimed_by', workerId)
      await admin.from('sismob_workers').update({ status: body.success ? 'ONLINE' : 'ERROR', current_job_id: null, last_error: body.error || null, last_seen_at: new Date().toISOString() }).eq('id', workerId)
      return json({ ok: true })
    }
    return json({ error: 'Ação desconhecida.' }, 400)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
