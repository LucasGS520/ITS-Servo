import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Switch } from "@/common/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useCursos, useEdicoesSimposio, useSalvarCurso, useSalvarEdicaoSimposio } from "@/modules/atividades/api";
import { useMatriculas } from "@/modules/matriculas";
import { useCobrancas, useLancamentos } from "@/modules/financeiro";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import type { Tables } from "@/services/supabase/types";

const moeda = (valor: number | null) => valor == null ? "Valor a configurar" : formatBRL(Number(valor));

export const CursosPage = () => {
  const { toast } = useToast();
  const { data: cursos = [], isLoading } = useCursos();
  const salvarCurso = useSalvarCurso();
  const [edicao, setEdicao] = useState<Tables<"cursos"> | null>(null);

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edicao) return;
    const form = new FormData(event.currentTarget);
    try {
      await salvarCurso.mutateAsync({ id: edicao.id, values: {
        nome: String(form.get("nome") ?? "").trim(),
        valor: Number(form.get("valor")),
        ativo: form.get("ativo") === "on",
        publico: form.get("publico") === "on",
      } });
      toast({ title: "Curso atualizado" });
      setEdicao(null);
    } catch (erro) { toast({ title: "Não foi possível salvar", description: getErrorMessage(erro), variant: "destructive" }); }
  };

  if (isLoading) return <Carregando />;
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Cursos</h1><p className="mt-1 text-sm text-muted-foreground">Oferta, preço oficial e publicação de cada curso.</p></div><div className="grid gap-4 md:grid-cols-2">{cursos.map((curso) => <Card key={curso.id}><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-lg">{curso.nome}<Badge variant={curso.ativo ? "default" : "outline"}>{curso.ativo ? "Ativo" : "Inativo"}</Badge></CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>Valor oficial: <strong>{moeda(curso.valor)}</strong></p><p className="text-muted-foreground">{curso.publico ? "Disponível para matrícula" : "Uso interno"}</p><Button variant="outline" size="sm" onClick={() => setEdicao(curso)}><Pencil className="mr-2 h-4 w-4" />Editar curso</Button></CardContent></Card>)}</div>
    <Dialog open={Boolean(edicao)} onOpenChange={(aberto) => !aberto && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>Editar curso</DialogTitle></DialogHeader>{edicao && <form onSubmit={salvar} className="space-y-4"><div className="space-y-1"><Label htmlFor="curso-nome">Nome</Label><Input id="curso-nome" name="nome" defaultValue={edicao.nome} required /></div><div className="space-y-1"><Label htmlFor="curso-valor">Valor oficial</Label><Input id="curso-valor" name="valor" type="number" min="0.01" step="0.01" defaultValue={edicao.valor ?? ""} required /></div><ToggleField id="curso-ativo" name="ativo" label="Curso ativo" defaultChecked={edicao.ativo} /><ToggleField id="curso-publico" name="publico" label="Disponível no formulário público" defaultChecked={edicao.publico} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEdicao(null)}>Cancelar</Button><Button disabled={salvarCurso.isPending}>Salvar</Button></div></form>}</DialogContent></Dialog>
  </div>;
};

export const SimposioPage = () => {
  const { toast } = useToast();
  const { data: edicoes = [], isLoading } = useEdicoesSimposio();
  const { data: inscricoes = [] } = useMatriculas();
  const { data: cobrancas = [] } = useCobrancas();
  const { data: lancamentos = [] } = useLancamentos();
  const salvarEdicao = useSalvarEdicaoSimposio();
  const [edicao, setEdicao] = useState<Tables<"edicoes_simposio"> | null | "nova">(null);

  const metricas = useMemo(() => new Map(edicoes.map((item) => {
    const matriculas = inscricoes.filter((i) => i.edicao_simposio_id === item.id && i.status !== "cancelado");
    const receitaPrevista = cobrancas.filter((c) => c.edicao_simposio_id === item.id && c.status !== "cancelada").reduce((s, c) => s + Number(c.valor_devido), 0);
    const movimentos = lancamentos.filter((l) => l.edicao_simposio_id === item.id);
    const receita = movimentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
    const custo = movimentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
    return [item.id, { matriculas, receitaPrevista, receita, custo, resultado: receita - custo }];
  })), [cobrancas, edicoes, inscricoes, lancamentos]);

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await salvarEdicao.mutateAsync({ id: edicao === "nova" ? undefined : edicao?.id, values: {
        nome: String(form.get("nome") ?? "").trim(), inicio: String(form.get("inicio") ?? "") || null,
        fim: String(form.get("fim") ?? "") || null, valor: Number(form.get("valor")),
        ativo: form.get("ativo") === "on", publico: form.get("publico") === "on",
      } });
      toast({ title: edicao === "nova" ? "Edição criada" : "Edição atualizada" }); setEdicao(null);
    } catch (erro) { toast({ title: "Não foi possível salvar", description: getErrorMessage(erro), variant: "destructive" }); }
  };

  if (isLoading) return <Carregando />;
  const atual = edicao === "nova" ? null : edicao;
  return <div className="container space-y-6 py-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold">Simpósios</h1><p className="mt-1 text-sm text-muted-foreground">Edições, participantes, receita, custo e resultado comparável.</p></div><Button onClick={() => setEdicao("nova")}><Plus className="mr-2 h-4 w-4" />Nova edição</Button></div>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Edição</TableHead><TableHead>Período</TableHead><TableHead className="text-right">Participantes</TableHead><TableHead className="text-right">Previsto</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Resultado</TableHead><TableHead /></TableRow></TableHeader><TableBody>{edicoes.map((item) => { const dados = metricas.get(item.id)!; return <TableRow key={item.id}><TableCell><p className="font-medium">{item.nome}</p><Badge variant={item.publico ? "default" : "outline"}>{item.publico ? "Publicado" : "Interno"}</Badge></TableCell><TableCell>{item.inicio ?? "A definir"}{item.fim ? ` a ${item.fim}` : ""}</TableCell><TableCell className="text-right">{dados.matriculas.length}</TableCell><TableCell className="text-right">{formatBRL(dados.receitaPrevista)}</TableCell><TableCell className="text-right">{formatBRL(dados.receita)}</TableCell><TableCell className="text-right">{formatBRL(dados.custo)}</TableCell><TableCell className="text-right font-semibold">{formatBRL(dados.resultado)}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => setEdicao(item)}><Pencil className="h-4 w-4" /><span className="sr-only">Editar {item.nome}</span></Button></TableCell></TableRow>; })}{edicoes.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma edição cadastrada.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
    {edicoes.map((item) => { const participantes = metricas.get(item.id)?.matriculas ?? []; return participantes.length > 0 && <Card key={`${item.id}-participantes`}><CardHeader><CardTitle className="text-base">Participantes — {item.nome}</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{participantes.map((i) => <div key={i.id} className="rounded-md border p-3"><p className="font-medium">{i.nome_completo}</p><p className="text-xs text-muted-foreground">{i.numero_inscricao} · {i.status}</p></div>)}</div></CardContent></Card>; })}
    <Dialog open={Boolean(edicao)} onOpenChange={(aberto) => !aberto && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>{edicao === "nova" ? "Nova edição" : "Editar edição"}</DialogTitle></DialogHeader><form onSubmit={salvar} className="space-y-4"><div className="space-y-1"><Label htmlFor="simposio-nome">Nome</Label><Input id="simposio-nome" name="nome" defaultValue={atual?.nome ?? ""} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="simposio-inicio">Início</Label><Input id="simposio-inicio" name="inicio" type="date" defaultValue={atual?.inicio ?? ""} /></div><div className="space-y-1"><Label htmlFor="simposio-fim">Fim</Label><Input id="simposio-fim" name="fim" type="date" defaultValue={atual?.fim ?? ""} /></div></div><div className="space-y-1"><Label htmlFor="simposio-valor">Valor oficial</Label><Input id="simposio-valor" name="valor" type="number" min="0.01" step="0.01" defaultValue={atual?.valor ?? ""} required /></div><ToggleField id="simposio-ativo" name="ativo" label="Edição ativa" defaultChecked={atual?.ativo ?? true} /><ToggleField id="simposio-publico" name="publico" label="Disponível no formulário público" defaultChecked={atual?.publico ?? false} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEdicao(null)}>Cancelar</Button><Button disabled={salvarEdicao.isPending}>Salvar</Button></div></form></DialogContent></Dialog>
  </div>;
};

const ToggleField = ({ id, name, label, defaultChecked }: { id: string; name: string; label: string; defaultChecked: boolean }) => <div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor={id}>{label}</Label><Switch id={id} name={name} defaultChecked={defaultChecked} /></div>;
const Carregando = () => <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
