import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudDownload,
  ExternalLink,
  Loader2,
  LockKeyhole,
  LogOut,
  Play,
  Save,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import {
  SismobBatchJob,
  SismobSessionStatus,
  SismobSnapshot,
  sismobAgentService,
} from "@/services/sismobAgentService";
import { Progress } from "@/components/ui/progress";

export function SismobSyncTab() {
  const { toast } = useToast();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<SismobSessionStatus>({
    state: "closed",
    authenticated: false,
  });
  const [snapshot, setSnapshot] = useState<SismobSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<SismobBatchJob | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [remoteJobs, setRemoteJobs] = useState<any[]>([]);
  const [remoteBusy, setRemoteBusy] = useState(false);

  const refreshRemote = useCallback(async () => {
    const [workerResult, jobResult] = await Promise.all([
      (supabase as any).from("sismob_workers").select("*").order("priority"),
      (supabase as any)
        .from("sismob_sync_jobs")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(10),
    ]);
    if (!workerResult.error) setWorkers(workerResult.data || []);
    if (!jobResult.error) setRemoteJobs(jobResult.data || []);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await sismobAgentService.status();
      setStatus(next);
    } catch {
      setAvailable(false);
      setStatus({ state: "closed", authenticated: false });
    }
  }, []);

  useEffect(() => {
    void sismobAgentService
      .health()
      .then((health) => {
        setAvailable(health.ok && health.browserAvailable);
        return refreshStatus();
      })
      .catch(() => setAvailable(false));
  }, [refreshStatus]);

  useEffect(() => {
    void refreshRemote();
    const timer = window.setInterval(() => void refreshRemote(), 15000);
    return () => window.clearInterval(timer);
  }, [refreshRemote]);

  useEffect(() => {
    if (status.state !== "waiting_login") return;
    const timer = window.setInterval(() => void refreshStatus(), 2000);
    return () => window.clearInterval(timer);
  }, [refreshStatus, status.state]);

  useEffect(() => {
    if (batch?.state !== "running") return;
    const timer = window.setInterval(async () => {
      try {
        const { job } = await sismobAgentService.collectAllStatus();
        if (!job) return;
        setBatch(job);
        if (job.state === "completed") {
          toast({
            title: "Coleta automática concluída",
            description: `${job.results.length} proposta(s) coletada(s).`,
          });
        }
      } catch {
        // Uma falha temporária será verificada novamente no próximo intervalo.
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [batch?.state, toast]);

  const open = async () => {
    setBusy(true);
    setSnapshot(null);
    try {
      setStatus(await sismobAgentService.open());
      toast({
        title: "Janela segura aberta",
        description: "Conclua o login diretamente no SISMOB.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível abrir o SISMOB",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const collect = async () => {
    setBusy(true);
    try {
      const result = await sismobAgentService.collectCurrent();
      setSnapshot(result);
      toast({
        title: "Prévia coletada",
        description: "Nada foi salvo ou alterado no SISMOB.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível coletar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const collectAll = async () => {
    setBusy(true);
    setSnapshot(null);
    try {
      setBatch(await sismobAgentService.startCollectAll());
      toast({
        title: "Coleta automática iniciada",
        description: "O robô está entrando nas propostas sozinho.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível iniciar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!snapshot) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("sismob_sync_snapshots")
        .insert({
          numero_proposta: snapshot.numero_proposta,
          source_url: snapshot.source_url,
          collected_at: snapshot.collected_at,
          snapshot: snapshot,
          created_by: user?.id,
        });
      if (error) throw error;
      toast({
        title: "Consulta salva",
        description: "A cópia protegida foi registrada para comparação.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    setBusy(true);
    try {
      const result = await sismobAgentService.close();
      setStatus({ state: "closed", authenticated: false });
      setSnapshot(null);
      toast({
        title: "Sessão encerrada",
        description: result.logoutAttempted
          ? "O logout foi solicitado e todos os dados locais da sessão foram apagados."
          : "A janela foi fechada e todos os cookies locais da sessão foram apagados.",
      });
    } catch (error: any) {
      toast({
        title: "Falha ao encerrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const requestRemoteCollection = async () => {
    setRemoteBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("sismob_sync_jobs")
        .insert({ mode: "AUTHENTICATED_FULL", requested_by: user?.id });
      if (error) throw error;
      toast({
        title: "Coleta enviada à fila",
        description: "O computador principal ou reserva executará o trabalho.",
      });
      await refreshRemote();
    } catch (error: any) {
      toast({
        title: "Falha ao solicitar coleta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRemoteBusy(false);
    }
  };

  const syncPublic = async () => {
    setRemoteBusy(true);
    try {
      const { data, error } =
        await supabase.functions.invoke("sync-sismob-public");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Consulta pública concluída",
        description: `${data.success} atualizada(s) e ${data.failed} falha(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Falha na consulta pública",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRemoteBusy(false);
    }
  };

  const statusBadge = status.authenticated ? (
    <Badge className="bg-emerald-600">Autenticado</Badge>
  ) : status.state === "waiting_login" ? (
    <Badge variant="secondary">Aguardando login</Badge>
  ) : (
    <Badge variant="outline">Desconectado</Badge>
  );

  return (
    <div className="space-y-5">
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-blue-700" /> Automação e
            sincronização
          </CardTitle>
          <CardDescription>
            Área técnica exclusiva do administrador. Controle a consulta
            pública, a fila e os computadores executores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-muted-foreground">
                Computadores cadastrados
              </p>
              <p className="mt-1 text-xl font-bold">{workers.length}</p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-muted-foreground">Disponíveis agora</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {
                  workers.filter(
                    (worker) =>
                      worker.last_seen_at &&
                      Date.now() - new Date(worker.last_seen_at).getTime() <
                        90000,
                  ).length
                }
              </p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-muted-foreground">Última rotina</p>
              <p className="mt-1 text-sm font-bold">
                {remoteJobs[0]?.status || "Nenhuma"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={syncPublic}
              disabled={remoteBusy}
              className="gap-2"
            >
              <CloudDownload className="h-4 w-4" /> Atualizar dados públicos
            </Button>
            <Button
              variant="outline"
              onClick={requestRemoteCollection}
              disabled={
                remoteBusy ||
                remoteJobs.some((job) =>
                  ["PENDING", "CLAIMED", "RUNNING"].includes(job.status),
                )
              }
              className="gap-2"
            >
              <Play className="h-4 w-4" /> Solicitar coleta autenticada
            </Button>
          </div>
          {remoteJobs[0] && (
            <div className="rounded-xl border bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>
                  Última solicitação:{" "}
                  {new Date(remoteJobs[0].requested_at).toLocaleString("pt-BR")}
                </span>
                <Badge
                  variant={
                    remoteJobs[0].status === "FAILED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {remoteJobs[0].status}
                </Badge>
              </div>
              <Progress value={remoteJobs[0].progress || 0} className="mt-3" />
              {remoteJobs[0].error && (
                <p className="mt-2 text-red-700">{remoteJobs[0].error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Sessão isolada e somente leitura</AlertTitle>
        <AlertDescription>
          A senha é digitada diretamente no SISMOB e não é salva no sistema.
          CPF, telefone e e-mail encontrados são ocultados da prévia.
        </AlertDescription>
      </Alert>

      {available === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Este computador não é um executor SISMOB</AlertTitle>
          <AlertDescription>
            Use “Solicitar coleta autenticada” acima. O computador principal ou
            reserva fará o login e a coleta automaticamente. A conexão local só
            aparece no computador em que o conector foi instalado.
          </AlertDescription>
        </Alert>
      )}

      {available !== false && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Conexão com o SISMOB</CardTitle>
                <CardDescription>
                  Abra a sessão, faça login e escolha uma proposta na janela
                  segura.
                </CardDescription>
              </div>
              {statusBadge}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={open}
              disabled={busy || available !== true || status.authenticated}
              className="gap-2"
            >
              {busy && status.state === "closed" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              Abrir login seguro
            </Button>
            <Button
              variant="outline"
              onClick={() => void refreshStatus()}
              disabled={busy}
            >
              Verificar login
            </Button>
            <Button
              variant="outline"
              onClick={collect}
              disabled={busy || !status.authenticated}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Coletar proposta aberta
            </Button>
            <Button
              onClick={collectAll}
              disabled={
                busy || !status.authenticated || batch?.state === "running"
              }
              className="gap-2"
            >
              {batch?.state === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Coletar todas automaticamente
            </Button>
            <Button
              variant="destructive"
              onClick={close}
              disabled={busy || status.state === "closed"}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" /> Encerrar e apagar sessão
            </Button>
          </CardContent>
        </Card>
      )}

      {batch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coleta automática</CardTitle>
            <CardDescription>
              {batch.state === "running"
                ? `Processando ${batch.current || "lista de propostas"}...`
                : `${batch.results.length} coletada(s) · ${batch.errors.length} falha(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              value={
                batch.discovered
                  ? Math.min(100, (batch.processed / batch.discovered) * 100)
                  : 5
              }
            />
            <p className="text-sm text-muted-foreground">
              {batch.processed} processada(s) de {batch.discovered}{" "}
              encontrada(s)
            </p>
            {batch.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{batch.error}</AlertDescription>
              </Alert>
            )}
            {batch.state === "completed" && batch.results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {batch.results.map((item, index) => (
                  <Button
                    key={`${item.numero_proposta}-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setSnapshot(item)}
                  >
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Prévia
                  da coleta
                </CardTitle>
                <CardDescription>
                  Proposta {snapshot.numero_proposta || "não identificada"} ·{" "}
                  {new Date(snapshot.collected_at).toLocaleString("pt-BR")}
                </CardDescription>
              </div>
              {snapshot.contains_redactions && (
                <Badge variant="secondary">Dados pessoais protegidos</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={snapshot.protected_text}
              readOnly
              className="min-h-[320px] resize-y font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={save}
                disabled={busy || !snapshot.numero_proposta}
                className="gap-2"
              >
                <Save className="h-4 w-4" /> Autorizar e salvar consulta
              </Button>
              <Button
                variant="outline"
                onClick={() => setSnapshot(null)}
                disabled={busy}
              >
                Descartar prévia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
