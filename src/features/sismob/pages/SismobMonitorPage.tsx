import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, CloudDownload, Computer, Database, Loader2, Play, RefreshCw, Server, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

type Worker = { id:string; name:string; priority:number; enabled:boolean; status:string; last_seen_at:string|null; current_job_id:string|null; version:string|null; last_error:string|null; metadata:Record<string,unknown> }
type Job = { id:string; status:string; mode:string; requested_at:string; claimed_by:string|null; progress:number; current_item:string|null; total_items:number|null; processed_items:number; success_items:number; failed_items:number; finished_at:string|null; error:string|null }

const presence = (worker: Worker) => worker.last_seen_at && Date.now() - new Date(worker.last_seen_at).getTime() < 90_000
const relative = (date: string|null) => !date ? 'Nunca' : new Intl.RelativeTimeFormat('pt-BR', { numeric:'auto' }).format(-Math.max(0, Math.round((Date.now()-new Date(date).getTime())/60000)), 'minute')

export default function SismobMonitorPage() {
  const { toast } = useToast()
  const [workers,setWorkers] = useState<Worker[]>([])
  const [jobs,setJobs] = useState<Job[]>([])
  const [snapshots,setSnapshots] = useState(0)
  const [loading,setLoading] = useState(true)
  const [creating,setCreating] = useState(false)
  const [syncingPublic,setSyncingPublic] = useState(false)
  const [publicWorks,setPublicWorks] = useState(0)

  const load = useCallback(async () => {
    const [w,j,s,p] = await Promise.all([
      (supabase as any).from('sismob_workers').select('*').order('priority'),
      (supabase as any).from('sismob_sync_jobs').select('*').order('requested_at',{ascending:false}).limit(30),
      (supabase as any).from('sismob_sync_snapshots').select('id',{count:'exact',head:true}),
      (supabase as any).from('sismob_public_works').select('proposal_id',{count:'exact',head:true}),
    ])
    if (w.error) throw w.error
    if (j.error) throw j.error
    setWorkers(w.data || []); setJobs(j.data || []); setSnapshots(s.count || 0); setPublicWorks(p.count || 0); setLoading(false)
  },[])

  useEffect(()=>{ void load().catch((e)=>toast({title:'Falha ao carregar SISMOB',description:e.message,variant:'destructive'})); const timer=window.setInterval(()=>void load(),15_000); const channel=supabase.channel('sismob-fleet').on('postgres_changes',{event:'*',schema:'public',table:'sismob_workers'},()=>void load()).on('postgres_changes',{event:'*',schema:'public',table:'sismob_sync_jobs'},()=>void load()).subscribe(); return()=>{window.clearInterval(timer);void supabase.removeChannel(channel)} },[load,toast])

  const activeJob=jobs.find(j=>['PENDING','CLAIMED','RUNNING'].includes(j.status))
  const online=workers.filter(presence)
  const principal=workers.find(w=>w.priority===1)
  const reserve=workers.find(w=>w.priority===2)
  const completed=useMemo(()=>jobs.filter(j=>j.status==='COMPLETED').length,[jobs])

  const enqueue=async()=>{ setCreating(true); try { const {data:{user}}=await supabase.auth.getUser(); const {error}=await (supabase as any).from('sismob_sync_jobs').insert({mode:'AUTHENTICATED_FULL',requested_by:user?.id}); if(error)throw error; toast({title:'Sincronização solicitada',description:'O primeiro computador elegível assumirá o trabalho.'}); await load() } catch(e:any){toast({title:'Não foi possível solicitar',description:e.message,variant:'destructive'})} finally{setCreating(false)} }
  const syncPublic=async()=>{setSyncingPublic(true);try{const {data,error}=await supabase.functions.invoke('sync-sismob-public');if(error)throw error;if(data?.error)throw new Error(data.error);toast({title:'SISMOB público atualizado',description:`${data.success} proposta(s) atualizada(s); ${data.failed} falha(s).`});await load()}catch(e:any){toast({title:'Falha na consulta pública',description:e.message,variant:'destructive'})}finally{setSyncingPublic(false)}}

  if(loading)return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Central SISMOB</h1><p className="mt-1 text-muted-foreground">Acompanhe computadores, dados públicos, coletas autenticadas e histórico.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>void load()} className="gap-2"><RefreshCw className="h-4 w-4"/>Atualizar</Button><Button variant="outline" onClick={syncPublic} disabled={syncingPublic} className="gap-2">{syncingPublic?<Loader2 className="h-4 w-4 animate-spin"/>:<CloudDownload className="h-4 w-4"/>}Atualizar dados públicos</Button><Button onClick={enqueue} disabled={creating||!!activeJob} className="gap-2">{creating?<Loader2 className="h-4 w-4 animate-spin"/>:<Play className="h-4 w-4"/>}Sincronizar autenticado</Button></div></div>

    {online.length===0&&<Alert variant="destructive"><WifiOff className="h-4 w-4"/><AlertTitle>Nenhum computador disponível</AlertTitle><AlertDescription>A solicitação ficará na fila até o principal ou o reserva voltar a responder.</AlertDescription></Alert>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Wifi className="h-6 w-6"/></div><div><p className="text-2xl font-bold">{online.length}/{workers.length}</p><p className="text-sm text-muted-foreground">Computadores online</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-blue-100 p-3 text-blue-700"><Activity className="h-6 w-6"/></div><div><p className="text-2xl font-bold">{activeJob?'Em andamento':'Livre'}</p><p className="text-sm text-muted-foreground">Fila autenticada</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-violet-100 p-3 text-violet-700"><Database className="h-6 w-6"/></div><div><p className="text-2xl font-bold">{snapshots}</p><p className="text-sm text-muted-foreground">Snapshots protegidos</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-amber-100 p-3 text-amber-700"><CheckCircle2 className="h-6 w-6"/></div><div><p className="text-2xl font-bold">{completed}</p><p className="text-sm text-muted-foreground">Trabalhos concluídos</p></div></CardContent></Card>
    </div>
    <Card className="border-sky-200 bg-sky-50/40"><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2"><CloudDownload className="h-5 w-5 text-sky-700"/>SISMOB Cidadão online</CardTitle><CardDescription>Consulta pública sem login e independente dos computadores executores.</CardDescription></div><Badge variant="outline">{publicWorks} proposta(s)</Badge></div></CardHeader></Card>

    {activeJob&&<Card className="border-blue-200"><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Sincronização ativa</CardTitle><CardDescription>{activeJob.current_item||'Aguardando computador...'}</CardDescription></div><Badge>{activeJob.status}</Badge></div></CardHeader><CardContent className="space-y-3"><Progress value={activeJob.progress}/><div className="grid grid-cols-3 gap-2 text-center text-sm"><div><strong>{activeJob.processed_items}</strong><span className="block text-muted-foreground">Processadas</span></div><div><strong className="text-emerald-600">{activeJob.success_items}</strong><span className="block text-muted-foreground">Sucesso</span></div><div><strong className="text-red-600">{activeJob.failed_items}</strong><span className="block text-muted-foreground">Falhas</span></div></div></CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">
      {[principal,reserve].map((worker,index)=><Card key={worker?.id||index} className={worker&&presence(worker)?'border-emerald-200':'border-neutral-200'}><CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-muted p-3">{index===0?<Server className="h-6 w-6"/>:<Computer className="h-6 w-6"/>}</div><div><CardTitle className="text-lg">{worker?.name||(index===0?'PC Principal não instalado':'PC Reserva')}</CardTitle><CardDescription>{index===0?'Prioridade 1 · executor preferencial':'Prioridade 2 · assume na ausência do principal'}</CardDescription></div></div><Badge variant={worker&&presence(worker)?'default':'secondary'}>{worker&&presence(worker)?worker.status:'OFFLINE'}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Último contato</span><span>{worker?relative(worker.last_seen_at):'Nunca'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span>{worker?.version||'—'}</span></div>{worker?.last_error&&<Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertDescription>{worker.last_error}</AlertDescription></Alert>}</CardContent></Card>)}
    </div>

    <Card><CardHeader><CardTitle>Histórico de sincronizações</CardTitle><CardDescription>Últimas solicitações e qual computador executou cada uma.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Solicitada</TableHead><TableHead>Estado</TableHead><TableHead>Computador</TableHead><TableHead>Progresso</TableHead><TableHead>Resultado</TableHead></TableRow></TableHeader><TableBody>{jobs.map(job=>{const worker=workers.find(w=>w.id===job.claimed_by);return <TableRow key={job.id}><TableCell className="whitespace-nowrap">{new Date(job.requested_at).toLocaleString('pt-BR')}</TableCell><TableCell><Badge variant={job.status==='COMPLETED'?'default':job.status==='FAILED'?'destructive':'secondary'}>{job.status}</Badge></TableCell><TableCell>{worker?.name||'Aguardando'}</TableCell><TableCell className="min-w-40"><div className="flex items-center gap-2"><Progress value={job.progress}/><span>{job.progress}%</span></div></TableCell><TableCell>{job.status==='COMPLETED'?`${job.success_items} sucesso(s)`:job.error||'—'}</TableCell></TableRow>})}</TableBody></Table></div></CardContent></Card>

    <Alert><ShieldCheck className="h-4 w-4"/><AlertTitle>Operação protegida</AlertTitle><AlertDescription>Somente um computador assume cada trabalho. Se o principal parar de responder, a trava expira e o reserva pode continuar sem duplicação.</AlertDescription></Alert>
  </div>
}
