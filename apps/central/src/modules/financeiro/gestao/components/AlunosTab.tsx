import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { useAlunos, ALUNOS_KEY } from "@/modules/financeiro/api";
import { UNIDADE_LABELS } from "@/modules/financeiro/model/unidades";
import { validarAlunoHistorico } from "@/modules/financeiro/api/its";

type Aluno = { id: string; nome: string; curso_id: string | null; unidade: string; situacao: string | null; origem_referencia: string | null; inscricao_id: string | null };

const AlunosTab = ({ cursoId, cursoNome }: { cursoId: string; cursoNome: string }) => {
  const { data = [], isLoading, error } = useAlunos();
  const client = useQueryClient();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [unidade, setUnidade] = useState("todas");
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [situacao, setSituacao] = useState("ativo");
  const [salvando, setSalvando] = useState(false);
  const alunos = (data as unknown as Aluno[]).filter(a => a.curso_id === cursoId);
  const unidades = Array.from(new Set(alunos.map(a => a.unidade))).sort();
  const linhas = useMemo(() => alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.trim().toLowerCase()) &&
    (filtro === "todos" || (a.situacao ?? "pendente_validacao") === filtro) &&
    (unidade === "todas" || a.unidade === unidade)
  ), [alunos, busca, filtro, unidade]);

  async function validar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aluno) return;
    const form = new FormData(event.currentTarget);
    setSalvando(true);
    try {
      await validarAlunoHistorico({ alunoId: aluno.id, nome: String(form.get("nome") ?? "").trim(),
        cpf: String(form.get("cpf") ?? ""), situacao, primeiraCompetencia: null });
      await client.invalidateQueries({ queryKey: ALUNOS_KEY });
      setAluno(null); toast({ title: "Aluno histórico validado" });
    } catch (e) { toast({ title: "Não foi possível validar", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSalvando(false); }
  }

  return <section className="space-y-3"><div><h3 className="text-lg font-semibold">Alunos · {cursoNome}</h3><p className="text-sm text-muted-foreground">Históricos dependem de conferência da identidade. Alunos novos são resolvidos em Inscrições. Nenhum mês esperado é criado aqui.</p></div>
    <div className="grid gap-2 sm:grid-cols-3"><Input aria-label="Buscar aluno" placeholder="Buscar aluno" value={busca} onChange={e => setBusca(e.target.value)} />
      <select aria-label="Situação" className="h-10 rounded border bg-background px-2" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="todos">Todas as situações</option><option value="pendente_validacao">Histórico pendente</option><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select>
      <select aria-label="Núcleo" className="h-10 rounded border bg-background px-2" value={unidade} onChange={e => setUnidade(e.target.value)}><option value="todas">Todas as unidades</option>{unidades.map(u => <option key={u} value={u}>{UNIDADE_LABELS[u] ?? u}</option>)}</select></div>
    <p className="text-xs text-muted-foreground">{linhas.length} de {alunos.length} aluno(s) exibidos.</p>
    {error && <p className="text-destructive">Falha ao carregar alunos.</p>}{isLoading && <p>Carregando...</p>}
    <Card><CardContent className="divide-y p-0">{linhas.map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><strong>{a.nome}</strong><p className="text-xs text-muted-foreground">{UNIDADE_LABELS[a.unidade] ?? a.unidade}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{a.situacao === "pendente_validacao" ? "Histórico pendente" : a.situacao ?? "Não informada"}</Badge>{a.origem_referencia && <Button size="sm" variant="outline" onClick={() => { setAluno(a); setSituacao(a.situacao === "pendente_validacao" ? "ativo" : a.situacao ?? "ativo"); }}>Validar</Button>}{a.inscricao_id && <Button asChild size="sm" variant="link"><Link to={`/painel/inscricoes?id=${a.inscricao_id}`}>Abrir inscrição</Link></Button>}</div></div>)}{!isLoading && linhas.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum aluno encontrado.</p>}</CardContent></Card>
    <Dialog open={!!aluno} onOpenChange={v => !v && setAluno(null)}><DialogContent><DialogHeader><DialogTitle>Validar aluno histórico</DialogTitle></DialogHeader>{aluno && <form className="space-y-3" onSubmit={validar}><Label>Nome conferido<Input name="nome" defaultValue={aluno.nome} required /></Label><Label>CPF (obrigatório para ativo)<Input name="cpf" inputMode="numeric" /></Label><Label>Situação<select className="h-10 w-full rounded border bg-background px-2" value={situacao} onChange={e => setSituacao(e.target.value)}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></Label><p className="text-xs text-muted-foreground">O mês da mensalidade permanece desconhecido até conferência individual. Informações históricas existentes serão preservadas.</p><Button disabled={salvando}>{salvando ? "Salvando..." : "Confirmar validação"}</Button></form>}</DialogContent></Dialog>
  </section>;
};
export default AlunosTab;
