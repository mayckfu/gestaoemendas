import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Filter,
  HardHat,
  Landmark,
  Loader2,
  MapPin,
  Search,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";

type Work = {
  proposal_id: number;
  numero_proposta: string;
  municipio: string | null;
  uf: string | null;
  tipo_obra: string | null;
  tipo_recurso: string | null;
  programa: string | null;
  valor_proposta: number | null;
  situacao_obra: string | null;
  etapa_proposta: string | null;
  percentual_executado: number | null;
  numero_portaria: string | null;
  data_portaria: string | null;
  endereco: Record<string, unknown>;
  parcelas: Array<Record<string, unknown>>;
  fotografias: Array<Record<string, unknown>>;
  empresas: Array<Record<string, unknown>>;
  fonte_url: string;
  synced_at: string;
};
type Repasse = {
  id: string;
  data: string;
  valor: number;
  fonte: string;
  status: string;
  ordem_bancaria?: string | null;
  observacoes?: string | null;
};
type BankAccount = {
  id: string;
  bank_code: string | null;
  branch_number: string | null;
  account_number: string | null;
  account_type: string | null;
  balance: number | null;
  balance_updated_at: string | null;
  official_data: Record<string, unknown>;
};
type FnsLink = {
  emendaId: string;
  valorTotal: number;
  valorRepasse: number;
  repasses: Repasse[];
  accounts: BankAccount[];
};

const money = (v: unknown) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v || 0),
  );
const date = (v: unknown) =>
  v
    ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")
    : "Não informado";
const value = (v: unknown) =>
  v === null || v === undefined || v === "" ? "Não informado" : String(v);
const tone = (s: string | null) =>
  /conclu|finaliz/i.test(s || "")
    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
    : /execu|andamento/i.test(s || "")
      ? "border-blue-200 bg-blue-100 text-blue-800"
      : /paralis|cancel|atras/i.test(s || "")
        ? "border-red-200 bg-red-100 text-red-800"
        : "border-amber-200 bg-amber-100 text-amber-800";

function Metric({
  icon: Icon,
  label,
  metric,
  detail,
  color,
}: {
  icon: typeof Activity;
  label: string;
  metric: string | number;
  detail: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {metric}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-2xl p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

export default function SismobMonitorPage() {
  const { toast } = useToast();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [selected, setSelected] = useState<Work | null>(null);
  const [fns, setFns] = useState<Record<string, FnsLink>>({});

  const load = useCallback(async () => {
    const [p, e] = await Promise.all([
      (supabase as any)
        .from("sismob_public_works")
        .select("*")
        .order("synced_at", { ascending: false }),
      supabase
        .from("emendas")
        .select("id,numero_proposta,valor_total,valor_repasse"),
    ]);
    const failure = [p, e].find((r) => r.error);
    if (failure?.error) throw failure.error;
    const emendas = e.data || [],
      ids = emendas.map((item) => item.id);
    let repasses: any[] = [];
    let accounts: any[] = [];
    if (ids.length) {
      const [r, a] = await Promise.all([
        supabase.from("repasses").select("*").in("emenda_id", ids),
        (supabase as any)
          .from("fns_bank_accounts")
          .select("*")
          .in("emenda_id", ids),
      ]);
      repasses = r.data || [];
      accounts = a.data || [];
    }
    const links: Record<string, FnsLink> = {};
    for (const item of emendas as any[]) {
      const key = String(item.numero_proposta || "").replace(/\D/g, "");
      if (key)
        links[key] = {
          emendaId: item.id,
          valorTotal: Number(item.valor_total || 0),
          valorRepasse: Number(item.valor_repasse || 0),
          repasses: repasses.filter((r) => r.emenda_id === item.id),
          accounts: accounts.filter((a) => a.emenda_id === item.id),
        };
    }
    setWorks(p.data || []);
    setFns(links);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load().catch((e) =>
      toast({
        title: "Falha ao carregar SISMOB",
        description: e.message,
        variant: "destructive",
      }),
    );
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load, toast]);

  const total = works.reduce(
      (sum, w) => sum + Number(w.valor_proposta || 0),
      0,
    ),
    avg = works.length
      ? Math.round(
          works.reduce(
            (sum, w) => sum + Number(w.percentual_executado || 0),
            0,
          ) / works.length,
        )
      : 0;
  const attention = works.filter((w) =>
    /paralis|cancel|atras|pend/i.test(w.situacao_obra || ""),
  ).length;
  const statuses = useMemo(
    () =>
      Array.from(
        new Set(works.map((w) => w.situacao_obra).filter(Boolean) as string[]),
      ).sort(),
    [works],
  );
  const filtered = useMemo(
    () =>
      works.filter(
        (w) =>
          [
            w.numero_proposta,
            w.municipio,
            w.uf,
            w.tipo_obra,
            w.programa,
            w.numero_portaria,
            w.situacao_obra,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "all" || w.situacao_obra === status),
      ),
    [works, query, status],
  );
  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-6 py-7 text-white shadow-xl md:px-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex gap-4">
          <div className="h-fit rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
            <HardHat className="h-8 w-8 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel de Obras SISMOB</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Acompanhamento gerencial das obras, recursos, portarias e
              pagamentos vinculados no FNS.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Dados atualizados em{" "}
              {works[0]?.synced_at
                ? new Date(works[0].synced_at).toLocaleString("pt-BR")
                : "data ainda não informada"}
            </p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={Building2}
          label="Obras monitoradas"
          metric={works.length}
          detail={`${works.filter((w) => w.numero_portaria).length} com portaria`}
          color="bg-blue-100 text-blue-700"
        />
        <Metric
          icon={Banknote}
          label="Valor acompanhado"
          metric={money(total)}
          detail="Total das propostas"
          color="bg-emerald-100 text-emerald-700"
        />
        <Metric
          icon={TrendingUp}
          label="Execução média"
          metric={`${avg}%`}
          detail="Execução física"
          color="bg-cyan-100 text-cyan-700"
        />
        <Metric
          icon={AlertTriangle}
          label="Exigem atenção"
          metric={attention}
          detail="Pendentes ou paralisadas"
          color="bg-amber-100 text-amber-700"
        />
        <Metric
          icon={CheckCircle2}
          label="Com financeiro FNS"
          metric={
            works.filter(
              (w) => fns[String(w.numero_proposta).replace(/\D/g, "")],
            ).length
          }
          detail="Depósitos vinculados"
          color="bg-violet-100 text-violet-700"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
          <TabsTrigger
            value="overview"
            className="gap-2 rounded-xl px-4 py-2.5"
          >
            <Activity className="h-4 w-4" />
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="works" className="gap-2 rounded-xl px-4 py-2.5">
            <Building2 className="h-4 w-4" />
            Obras e financeiro
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Situação das obras</CardTitle>
                <CardDescription>
                  Distribuição conforme o SISMOB Cidadão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statuses.map((s) => {
                  const count = works.filter(
                      (w) => w.situacao_obra === s,
                    ).length,
                    pct = Math.round((count / works.length) * 100);
                  return (
                    <div key={s}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium">{s}</span>
                        <span>
                          {count} · {pct}%
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
                {!statuses.length && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Sincronize para exibir os indicadores.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Qualidade dos dados</CardTitle>
                <CardDescription>
                  Completude para tomada de decisão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  [
                    "Portaria",
                    works.filter((w) => w.numero_portaria).length,
                    Landmark,
                  ],
                  [
                    "Localização",
                    works.filter((w) =>
                      Object.values(w.endereco || {}).some(Boolean),
                    ).length,
                    MapPin,
                  ],
                  [
                    "Fotos",
                    works.filter((w) => w.fotografias?.length).length,
                    Camera,
                  ],
                  [
                    "Empresa",
                    works.filter((w) => w.empresas?.length).length,
                    HardHat,
                  ],
                  [
                    "Vínculo financeiro FNS",
                    works.filter(
                      (w) => fns[String(w.numero_proposta).replace(/\D/g, "")],
                    ).length,
                    Banknote,
                  ],
                ].map(([label, count, Icon]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between rounded-xl border bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-blue-700" />
                      <span className="text-sm font-medium">
                        {label as string}
                      </span>
                    </div>
                    <strong>
                      {count as number}/{works.length}
                    </strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Atualizações recentes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {works.slice(0, 6).map((w) => (
                <button
                  key={w.proposal_id}
                  onClick={() => setSelected(w)}
                  className="group rounded-2xl border p-4 text-left transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        PROPOSTA {w.numero_proposta}
                      </p>
                      <p className="mt-1 font-semibold">
                        {w.tipo_obra || w.programa || "Obra SISMOB"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600" />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Badge variant="outline" className={tone(w.situacao_obra)}>
                      {w.situacao_obra || "Sem situação"}
                    </Badge>
                    <strong className="text-sm">
                      {money(w.valor_proposta)}
                    </strong>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="works" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar proposta, município, programa ou portaria..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full lg:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as situações</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Cadastro de obras</CardTitle>
              <CardDescription>
                {filtered.length} registro(s) · SISMOB + financeiro FNS
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposta / obra</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Execução</TableHead>
                      <TableHead>Financeiro FNS</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((w) => {
                      const link =
                          fns[String(w.numero_proposta).replace(/\D/g, "")],
                        paid =
                          link?.repasses
                            .filter((r) => r.status === "REPASSADO")
                            .reduce((n, r) => n + Number(r.valor || 0), 0) || 0;
                      return (
                        <TableRow
                          key={w.proposal_id}
                          className="cursor-pointer"
                          onClick={() => setSelected(w)}
                        >
                          <TableCell className="min-w-64">
                            <strong>{w.numero_proposta}</strong>
                            <p className="max-w-72 truncate text-sm text-slate-500">
                              {w.tipo_obra ||
                                w.programa ||
                                "Obra não informada"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {w.municipio || "—"}
                            {w.uf ? `/${w.uf}` : ""}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={tone(w.situacao_obra)}
                            >
                              {w.situacao_obra || "Não informada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {money(w.valor_proposta)}
                          </TableCell>
                          <TableCell className="min-w-40">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={Number(w.percentual_executado || 0)}
                              />
                              <small>
                                {Number(w.percentual_executado || 0)}%
                              </small>
                            </div>
                          </TableCell>
                          <TableCell>
                            {link ? (
                              <div>
                                <p className="font-medium text-emerald-700">
                                  {money(paid)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {link.repasses.length} pagamento(s)
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Sem vínculo
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Ver ficha
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <WorkDialog
        work={selected}
        fnsLink={
          selected
            ? fns[String(selected.numero_proposta).replace(/\D/g, "")]
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function WorkDialog({
  work,
  fnsLink,
  onClose,
}: {
  work: Work | null;
  fnsLink?: FnsLink;
  onClose: () => void;
}) {
  if (!work) return null;
  const paid =
    fnsLink?.repasses
      .filter((r) => r.status === "REPASSADO")
      .reduce((sum, r) => sum + Number(r.valor || 0), 0) || 0;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Proposta {work.numero_proposta}</Badge>
            <Badge variant="outline" className={tone(work.situacao_obra)}>
              {work.situacao_obra || "Situação não informada"}
            </Badge>
          </div>
          <DialogTitle className="pt-2 text-2xl">
            {work.tipo_obra || work.programa || "Ficha da obra"}
          </DialogTitle>
          <DialogDescription>
            {work.municipio || "Município não informado"}
            {work.uf ? `/${work.uf}` : ""} · SISMOB e FNS reunidos
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary
            label="Valor da proposta"
            data={money(work.valor_proposta)}
            color="bg-blue-50 text-blue-950"
          />
          <Summary
            label="Repassado pelo FNS"
            data={money(paid || fnsLink?.valorRepasse)}
            color="bg-emerald-50 text-emerald-950"
          />
          <Summary
            label="Execução física"
            data={`${Number(work.percentual_executado || 0)}%`}
            color="bg-cyan-50 text-cyan-950"
          />
          <Summary
            label="Portaria"
            data={work.numero_portaria || "Não informada"}
            color="bg-violet-50 text-violet-950"
          />
        </div>
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-blue-700" />
            Dados oficiais da obra
          </h3>
          <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Etapa">{value(work.etapa_proposta)}</Info>
            <Info label="Tipo de recurso">{value(work.tipo_recurso)}</Info>
            <Info label="Programa">{value(work.programa)}</Info>
            <Info label="Portaria / data">
              {value(work.numero_portaria)} · {date(work.data_portaria)}
            </Info>
            <Info label="Endereço">
              {value(work.endereco?.logradouro)}, {value(work.endereco?.numero)}{" "}
              · {value(work.endereco?.bairro)}
            </Info>
            <Info label="CEP">{value(work.endereco?.cep)}</Info>
          </div>
        </section>
        <Separator />
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <Banknote className="h-5 w-5 text-emerald-700" />
              Financeiro FNS
            </h3>
            {fnsLink ? (
              <Badge className="bg-emerald-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Proposta vinculada
              </Badge>
            ) : (
              <Badge variant="secondary">Sem vínculo no cadastro</Badge>
            )}
          </div>
          {fnsLink ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Summary
                  label="Valor no cadastro"
                  data={money(fnsLink.valorTotal)}
                  color="bg-slate-50 text-slate-950"
                />
                <Summary
                  label="Total de pagamentos"
                  data={money(paid)}
                  color="bg-emerald-50 text-emerald-950"
                />
                <Summary
                  label="Saldo das contas"
                  data={money(
                    fnsLink.accounts.reduce(
                      (s, a) => s + Number(a.balance || 0),
                      0,
                    ),
                  )}
                  color="bg-amber-50 text-amber-950"
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Depósitos e ordens bancárias
                  </p>
                  {fnsLink.repasses.length ? (
                    fnsLink.repasses.map((r) => (
                      <div key={r.id} className="rounded-xl border p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <strong>{money(r.valor)}</strong>
                          <Badge variant="outline">{r.status}</Badge>
                        </div>
                        <p className="mt-1 text-slate-600">
                          OB: {r.ordem_bancaria || "não informada"} ·{" "}
                          {date(r.data)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Fonte: {r.fonte}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Nenhum pagamento registrado.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Contas bancárias divulgadas
                  </p>
                  {fnsLink.accounts.length ? (
                    fnsLink.accounts.map((a) => (
                      <div key={a.id} className="rounded-xl border p-3 text-sm">
                        <p className="font-medium">
                          Banco {a.bank_code || "—"} · Ag.{" "}
                          {a.branch_number || "—"}
                        </p>
                        <p>
                          Conta {a.account_number || "—"}{" "}
                          {a.account_type ? `· ${a.account_type}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Saldo divulgado: {money(a.balance)} · referência{" "}
                          {date(a.balance_updated_at)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Conta pública do beneficiário; confirmação por OB
                          somente quando houver vínculo direto no FNS.
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Nenhuma conta divulgada.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta obra ainda não encontrou uma proposta igual no cadastro de
                emendas. O cruzamento financeiro será exibido assim que os
                números coincidirem.
              </AlertDescription>
            </Alert>
          )}
        </section>
        <Separator />
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 font-semibold">
              Parcelas SISMOB ({work.parcelas?.length || 0})
            </h3>
            {work.parcelas?.map((p, i) => (
              <div
                key={i}
                className="mb-2 flex justify-between rounded-xl border p-3 text-sm"
              >
                <span>
                  {value(p.numero)}ª parcela · {date(p.data)}
                </span>
                <strong>{money(p.valor)}</strong>
              </div>
            )) || null}
          </section>
          <section>
            <h3 className="mb-2 font-semibold">
              Empresas ({work.empresas?.length || 0})
            </h3>
            {work.empresas?.map((e, i) => (
              <div key={i} className="mb-2 rounded-xl border p-3 text-sm">
                <strong>{value(e.noEmpresa || e.razaoSocial || e.nome)}</strong>
                <p className="text-slate-500">{value(e.nuCnpj || e.cnpj)}</p>
              </div>
            )) || null}
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4" />
            {work.fotografias?.length || 0} grupo(s) de fotos
          </span>
          <Button variant="outline" asChild>
            <a
              href={work.fonte_url}
              target="_blank"
              rel="noreferrer"
              className="gap-2"
            >
              Abrir fonte oficial
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Summary({
  label,
  data,
  color,
}: {
  label: string;
  data: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-xs font-semibold uppercase opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{data}</p>
    </div>
  );
}
