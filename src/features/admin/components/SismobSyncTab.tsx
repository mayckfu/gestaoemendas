import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, LockKeyhole, LogOut, Save, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { SismobBatchJob, SismobSessionStatus, SismobSnapshot, sismobAgentService } from '@/services/sismobAgentService'
import { Progress } from '@/components/ui/progress'

export function SismobSyncTab() {
  const { toast } = useToast()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [status, setStatus] = useState<SismobSessionStatus>({ state: 'closed', authenticated: false })
  const [snapshot, setSnapshot] = useState<SismobSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [batch, setBatch] = useState<SismobBatchJob | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const next = await sismobAgentService.status()
      setStatus(next)
    } catch {
      setAvailable(false)
      setStatus({ state: 'closed', authenticated: false })
    }
  }, [])

  useEffect(() => {
    void sismobAgentService.health()
      .then((health) => {
        setAvailable(health.ok && health.browserAvailable)
        return refreshStatus()
      })
      .catch(() => setAvailable(false))
  }, [refreshStatus])

  useEffect(() => {
    if (status.state !== 'waiting_login') return
    const timer = window.setInterval(() => void refreshStatus(), 2000)
    return () => window.clearInterval(timer)
  }, [refreshStatus, status.state])

  useEffect(() => {
    if (batch?.state !== 'running') return
    const timer = window.setInterval(async () => {
      try {
        const { job } = await sismobAgentService.collectAllStatus()
        if (!job) return
        setBatch(job)
        if (job.state === 'completed') {
          toast({ title: 'Coleta automática concluída', description: `${job.results.length} proposta(s) coletada(s).` })
        }
      } catch {
        // Uma falha temporária será verificada novamente no próximo intervalo.
      }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [batch?.state, toast])

  const open = async () => {
    setBusy(true)
    setSnapshot(null)
    try {
      setStatus(await sismobAgentService.open())
      toast({ title: 'Janela segura aberta', description: 'Conclua o login diretamente no SISMOB.' })
    } catch (error: any) {
      toast({ title: 'Não foi possível abrir o SISMOB', description: error.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const collect = async () => {
    setBusy(true)
    try {
      const result = await sismobAgentService.collectCurrent()
      setSnapshot(result)
      toast({ title: 'Prévia coletada', description: 'Nada foi salvo ou alterado no SISMOB.' })
    } catch (error: any) {
      toast({ title: 'Não foi possível coletar', description: error.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const collectAll = async () => {
    setBusy(true)
    setSnapshot(null)
    try {
      setBatch(await sismobAgentService.startCollectAll())
      toast({ title: 'Coleta automática iniciada', description: 'O robô está entrando nas propostas sozinho.' })
    } catch (error: any) {
      toast({ title: 'Não foi possível iniciar', description: error.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (!snapshot) return
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await (supabase as any).from('sismob_sync_snapshots').insert({
        numero_proposta: snapshot.numero_proposta,
        source_url: snapshot.source_url,
        collected_at: snapshot.collected_at,
        snapshot: snapshot,
        created_by: user?.id,
      })
      if (error) throw error
      toast({ title: 'Consulta salva', description: 'A cópia protegida foi registrada para comparação.' })
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const close = async () => {
    setBusy(true)
    try {
      const result = await sismobAgentService.close()
      setStatus({ state: 'closed', authenticated: false })
      setSnapshot(null)
      toast({
        title: 'Sessão encerrada',
        description: result.logoutAttempted
          ? 'O logout foi solicitado e todos os dados locais da sessão foram apagados.'
          : 'A janela foi fechada e todos os cookies locais da sessão foram apagados.',
      })
    } catch (error: any) {
      toast({ title: 'Falha ao encerrar', description: error.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const statusBadge = status.authenticated
    ? <Badge className="bg-emerald-600">Autenticado</Badge>
    : status.state === 'waiting_login'
      ? <Badge variant="secondary">Aguardando login</Badge>
      : <Badge variant="outline">Desconectado</Badge>

  return (
    <div className="space-y-5">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Sessão isolada e somente leitura</AlertTitle>
        <AlertDescription>
          A senha é digitada diretamente no SISMOB e não é salva no sistema. CPF, telefone e e-mail encontrados são ocultados da prévia.
        </AlertDescription>
      </Alert>

      {available === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Agente local indisponível</AlertTitle>
          <AlertDescription>Inicie o projeto pelo atalho ou pelo comando npm start para carregar também o conector do SISMOB.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Conexão com o SISMOB</CardTitle>
              <CardDescription>Abra a sessão, faça login e escolha uma proposta na janela segura.</CardDescription>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={open} disabled={busy || available === false || status.authenticated} className="gap-2">
            {busy && status.state === 'closed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            Abrir login seguro
          </Button>
          <Button variant="outline" onClick={() => void refreshStatus()} disabled={busy}>Verificar login</Button>
          <Button variant="outline" onClick={collect} disabled={busy || !status.authenticated} className="gap-2">
            <ExternalLink className="h-4 w-4" /> Coletar proposta aberta
          </Button>
          <Button onClick={collectAll} disabled={busy || !status.authenticated || batch?.state === 'running'} className="gap-2">
            {batch?.state === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Coletar todas automaticamente
          </Button>
          <Button variant="destructive" onClick={close} disabled={busy || status.state === 'closed'} className="gap-2">
            <LogOut className="h-4 w-4" /> Encerrar e apagar sessão
          </Button>
        </CardContent>
      </Card>

      {batch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coleta automática</CardTitle>
            <CardDescription>
              {batch.state === 'running' ? `Processando ${batch.current || 'lista de propostas'}...` : `${batch.results.length} coletada(s) · ${batch.errors.length} falha(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={batch.discovered ? Math.min(100, (batch.processed / batch.discovered) * 100) : 5} />
            <p className="text-sm text-muted-foreground">{batch.processed} processada(s) de {batch.discovered} encontrada(s)</p>
            {batch.error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{batch.error}</AlertDescription></Alert>}
            {batch.state === 'completed' && batch.results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {batch.results.map((item, index) => (
                  <Button key={`${item.numero_proposta}-${index}`} variant="outline" size="sm" onClick={() => setSnapshot(item)}>
                    {item.numero_proposta || `Proposta ${index + 1}`}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {snapshot && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Prévia da coleta</CardTitle>
                <CardDescription>Proposta {snapshot.numero_proposta || 'não identificada'} · {new Date(snapshot.collected_at).toLocaleString('pt-BR')}</CardDescription>
              </div>
              {snapshot.contains_redactions && <Badge variant="secondary">Dados pessoais protegidos</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={snapshot.protected_text} readOnly className="min-h-[320px] resize-y font-mono text-xs" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy || !snapshot.numero_proposta} className="gap-2"><Save className="h-4 w-4" /> Autorizar e salvar consulta</Button>
              <Button variant="outline" onClick={() => setSnapshot(null)} disabled={busy}>Descartar prévia</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
