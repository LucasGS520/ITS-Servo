import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Switch } from "@/common/ui/switch";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useCursos, useEdicoesSimposio, useSalvarCurso, useSalvarEdicaoSimposio } from "@/modules/atividades/api";
import { useMatriculas } from "@/modules/matriculas";
import type { Tables } from "@/services/supabase/types";

const preco = (n: number | null) => n == null ? "A configurar" : formatBRL(Number(n));
const Toggle = ({ name, label, checked }: { name: string; label: string; checked: boolean }) =>
  <label className="flex items-center justify-between rounded border p-3">{label}<Switch name={name} defaultChecked={checked} /></label>;

export const CursosPage = () => {
  const { data: cursos = [], isLoading, error } = useCursos();
  const salvarCurso = useSalvarCurso();
  const { toast } = useToast();
  const [edicao, setEdicao] = useState<Tables<"cursos"> | null>(null);
  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edicao) return;
    const f = new FormData(event.currentTarget);
    const taxa = f.get("taxa") ? Number(f.get("taxa")) : null;
    const mensalidade = f.get("mensalidade") ? Number(f.get("mensalidade")) : null;
    const ativo = f.get("ativo") === "on";
    const publico = f.get("publico") === "on";
    if (publico && (!ativo || taxa == null || mensalidade == null)) {
      toast({ title: "Configure matrícula e mensalidade e ative o curso antes de publicar", variant: "destructive" }); return;
    }
    try {
      await salvarCurso.mutateAsync({ id: edicao.id, values: {
        nome: String(f.get("nome") ?? "").trim(), taxa_matricula: taxa,
        mensalidade_referencia: mensalidade, ativo, publico,
      } });
      setEdicao(null); toast({ title: "Curso atualizado" });
    } catch (e) { toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" }); }
  }
  return <section className="space-y-5">
    <div><h2 className="text-xl font-semibold">Cursos</h2><p className="text-sm text-muted-foreground">Valores oficiais, publicação e alunos por curso.</p></div>
    {error && <p className="text-destructive">Falha ao carregar cursos.</p>}{isLoading && <p>Carregando...</p>}
    <div className="grid gap-4 md:grid-cols-2">{cursos.map(c => <Card key={c.id}><CardHeader><CardTitle className="flex justify-between gap-2 text-lg">{c.nome}<Badge variant={c.ativo ? "default" : "outline"}>{c.ativo ? "Ativo" : "Inativo"}</Badge></CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
      <p>Matrícula: <strong>{preco(c.taxa_matricula)}</strong></p><p>Mensalidade: <strong>{preco(c.mensalidade_referencia)}</strong></p>
      <p>{c.publico ? "Publicado no Site" : "Uso interno"}</p>
      <div className="flex gap-2"><Button variant="outline" onClick={() => setEdicao(c)}>Configurar</Button><Button asChild variant="outline"><Link to={`/painel/instituto?secao=alunos&curso=${c.id}`}>Ver alunos</Link></Button></div>
    </CardContent></Card>)}</div>
    <Dialog open={!!edicao} onOpenChange={v => !v && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>Configurar curso</DialogTitle></DialogHeader>{edicao && <form key={edicao.id} onSubmit={salvar} className="space-y-3">
      <Label>Nome<Input name="nome" defaultValue={edicao.nome} required /></Label>
      <div className="grid grid-cols-2 gap-3"><Label>Matrícula<Input name="taxa" type="number" min="0" step="0.01" defaultValue={edicao.taxa_matricula ?? ""} /></Label><Label>Mensalidade<Input name="mensalidade" type="number" min="0" step="0.01" defaultValue={edicao.mensalidade_referencia ?? ""} /></Label></div>
      <Toggle name="ativo" label="Curso ativo" checked={edicao.ativo} /><Toggle name="publico" label="Publicado no Site" checked={edicao.publico} />
      <Button disabled={salvarCurso.isPending}>Salvar</Button>
    </form>}</DialogContent></Dialog>
  </section>;
};

export const SimposioPage = () => {
  const { data: edicoes = [], isLoading, error } = useEdicoesSimposio();
  const { data: inscricoes = [] } = useMatriculas();
  const salvarEdicao = useSalvarEdicaoSimposio();
  const { toast } = useToast();
  const [edicao, setEdicao] = useState<Tables<"edicoes_simposio"> | "nova" | null>(null);
  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const inicio = String(f.get("inicio") ?? "") || null;
    const fim = String(f.get("fim") ?? "") || null;
    const valor = f.get("valor") ? Number(f.get("valor")) : null;
    const ativo = f.get("ativo") === "on", publico = f.get("publico") === "on";
    if (inicio && fim && fim < inicio) { toast({ title: "Fim anterior ao início", variant: "destructive" }); return; }
    if (publico && (!ativo || valor == null)) { toast({ title: "Ative a edição e informe o preço antes de publicar", variant: "destructive" }); return; }
    try {
      await salvarEdicao.mutateAsync({ id: edicao === "nova" ? undefined : edicao?.id, values: {
        nome: String(f.get("nome") ?? "").trim(), inicio, fim, valor, ativo, publico,
      } });
      setEdicao(null); toast({ title: "Edição salva" });
    } catch (e) { toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" }); }
  }
  const atual = edicao === "nova" ? null : edicao;
  return <section className="space-y-5">
    <div className="flex justify-between gap-3"><div><h2 className="text-xl font-semibold">Edições do Simpósio</h2><p className="text-sm text-muted-foreground">Configuração, participação e inventário por edição.</p></div><Button onClick={() => setEdicao("nova")}>Nova edição</Button></div>
    {error && <p className="text-destructive">Falha ao carregar edições.</p>}{isLoading && <p>Carregando...</p>}
    {edicoes.map(e => {
      const lista = inscricoes.filter(i => i.edicao_simposio_id === e.id);
      const analise = lista.filter(i => ["em_analise", "comprovante_enviado", "pagamento_nao_identificado"].includes(i.status)).length;
      const confirmados = lista.filter(i => i.status === "confirmada").length;
      return <Card key={e.id}><CardHeader><CardTitle className="flex justify-between gap-2 text-lg">{e.nome}<span className="flex gap-2"><Badge variant={e.ativo ? "default" : "outline"}>{e.ativo ? "Ativa" : "Inativa"}</Badge><Badge variant={e.publico ? "default" : "outline"}>{e.publico ? "Publicada" : "Interna"}</Badge></span></CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <p>Período: {e.inicio ?? "Desconhecido"}{e.fim ? ` a ${e.fim}` : ""} · Preço único: <strong>{preco(e.valor)}</strong></p>
        <div className="grid gap-2 sm:grid-cols-3"><div className="rounded border p-3"><strong>{e.inscritos_historicos ?? "—"}</strong><p>Inscritos históricos agregados</p><small>{e.pagantes_historicos ?? "—"} pagantes · {e.isentos_historicos ?? "—"} isentos</small></div><div className="rounded border p-3"><strong>{analise}</strong><p>Inscrições em análise identificadas</p></div><div className="rounded border p-3"><strong>{confirmados}</strong><p>Participantes confirmados identificados</p></div></div>
        <div className="flex flex-wrap gap-2"><Button asChild><Link to={`/painel/instituto/simposios/${e.id}`}>Abrir edição</Link></Button><Button variant="outline" onClick={() => setEdicao(e)}>Configurar</Button></div>
      </CardContent></Card>;
    })}
    <Dialog open={!!edicao} onOpenChange={v => !v && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>{edicao === "nova" ? "Nova edição" : "Configurar edição"}</DialogTitle></DialogHeader><form key={atual?.id ?? "nova"} onSubmit={salvar} className="space-y-3">
      <Label>Nome<Input name="nome" defaultValue={atual?.nome ?? ""} required /></Label><div className="grid grid-cols-2 gap-3"><Label>Início<Input name="inicio" type="date" defaultValue={atual?.inicio ?? ""} /></Label><Label>Fim<Input name="fim" type="date" defaultValue={atual?.fim ?? ""} /></Label></div>
      <Label>Preço único<Input name="valor" type="number" min="0" step="0.01" defaultValue={atual?.valor ?? ""} /></Label>
      <Toggle name="ativo" label="Edição ativa" checked={atual?.ativo ?? true} /><Toggle name="publico" label="Publicado no Site" checked={atual?.publico ?? false} />
      <Button disabled={salvarEdicao.isPending}>Salvar</Button>
    </form></DialogContent></Dialog>
  </section>;
};
