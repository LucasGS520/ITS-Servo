import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { fetchAllPages } from "@/common/lib/fetchAllPages";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useNucleos } from "@/modules/instituto/api";
import { useAlunos, ALUNOS_KEY } from "@/modules/financeiro/api";
import { useMatriculas } from "@/modules/matriculas/api";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";

type Pessoa = Tables<"pessoas">;
type Auditoria = Tables<"auditoria_operacional">;
const situacoes = ["pendente_validacao", "ativo", "pausado", "concluido", "cancelado"] as const;
const rotulo: Record<string, string> = { pendente_validacao: "Histórico pendente", ativo: "Ativo", pausado: "Pausado", concluido: "Concluído", cancelado: "Cancelado" };
const rpc = supabase.rpc as unknown as (nome: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>;

const usePessoasAlunos = () => useQuery({ queryKey: ["pessoas", "alunos"], queryFn: async () =>
  fetchAllPages((from, to) => supabase.from("pessoas").select("*").order("nome_completo").order("id").range(from, to)),
});

const useAuditoriaAluno = (alunoId: string | undefined, pessoaId: string | null | undefined) => useQuery({
  queryKey: ["auditoria", "aluno", alunoId, pessoaId],
  enabled: Boolean(alunoId),
  queryFn: async () => {
    const [aluno, pessoa] = await Promise.all([
      supabase.from("auditoria_operacional").select("*").eq("entidade", "aluno").eq("entidade_id", alunoId!).order("created_at", { ascending: false }).limit(100),
      pessoaId ? supabase.from("auditoria_operacional").select("*").eq("entidade", "pessoa").eq("entidade_id", pessoaId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    ]);
    if (aluno.error) throw aluno.error;
    if (pessoa.error) throw pessoa.error;
    return [...(aluno.data ?? []), ...(pessoa.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)) as Auditoria[];
  },
});

export const AlunosPage = () => {
  const { data: alunos = [], isLoading, error } = useAlunos();
  const { data: pessoas = [] } = usePessoasAlunos();
  const { data: cursos = [] } = useCursos();
  const { data: nucleos = [] } = useNucleos();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const curso = params.get("curso") ?? "todos";
  const situacao = params.get("situacao") ?? "todos";
  const nucleo = params.get("nucleo") ?? "todos";
  const origem = params.get("origem") ?? "todas";
  const setFiltro = (chave: string, valor: string) => { const p = new URLSearchParams(params); valor === "todos" || valor === "todas" ? p.delete(chave) : p.set(chave, valor); setParams(p); };
  const pessoasId = new Map(pessoas.map(p => [p.id, p]));
  const linhas = alunos.filter(a => {
    const p = a.pessoa_id ? pessoasId.get(a.pessoa_id) : null;
    const termo = busca.trim().toLowerCase();
    return (!termo || [a.nome, p?.nome_completo, p?.cpf].some(v => v?.toLowerCase().includes(termo))) &&
      (curso === "todos" || a.curso_id === curso) && (situacao === "todos" || a.situacao === situacao) &&
      (nucleo === "todos" || a.unidade === nucleo) &&
      (origem === "todas" || (origem === "historico" ? !!a.origem_referencia : !a.origem_referencia));
  });
  return <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">Alunos</h2><p className="text-sm text-muted-foreground">Um vínculo por pessoa e curso. Inscrições resolve novas participações e cancelamentos.</p></div><Button asChild><Link to="/painel/inscricoes?nova=1">Nova inscrição de curso</Link></Button></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Input aria-label="Buscar aluno" placeholder="Nome ou CPF" value={busca} onChange={e => setBusca(e.target.value)} className="lg:col-span-2" />
      <select aria-label="Curso" className="h-10 rounded border bg-background px-2" value={curso} onChange={e => setFiltro("curso",e.target.value)}><option value="todos">Todos os cursos</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      <select aria-label="Situação" className="h-10 rounded border bg-background px-2" value={situacao} onChange={e => setFiltro("situacao",e.target.value)}><option value="todos">Todas as situações</option>{situacoes.map(s => <option key={s} value={s}>{rotulo[s]}</option>)}</select>
      <select aria-label="Núcleo" className="h-10 rounded border bg-background px-2" value={nucleo} onChange={e => setFiltro("nucleo",e.target.value)}><option value="todos">Todos os núcleos</option><option value="correspondencia">Correspondência</option>{nucleos.map(n => <option key={n.id} value={n.slug}>{n.nome}</option>)}</select>
      <select aria-label="Origem" className="h-10 rounded border bg-background px-2" value={origem} onChange={e => setFiltro("origem",e.target.value)}><option value="todas">Todas as origens</option><option value="historico">Planilha histórica</option><option value="inscricao">Inscrição</option></select>
    </div>
    <p className="text-sm text-muted-foreground">{linhas.length} de {alunos.length} vínculos exibidos.</p>
    {error && <p className="text-destructive">Falha ao carregar alunos.</p>}{isLoading && <p>Carregando...</p>}
    <Card><CardContent className="divide-y p-0">{linhas.map(a => <Link key={a.id} to={`/painel/instituto/alunos/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-muted/50"><span><strong>{a.nome}</strong><small className="block text-muted-foreground">{cursos.find(c => c.id === a.curso_id)?.nome ?? "Curso desconhecido"} · {a.unidade === "correspondencia" ? "Correspondência" : nucleos.find(n => n.slug === a.unidade)?.nome ?? a.unidade}{a.origem_referencia ? " · histórico" : ""}</small></span><Badge variant="outline">{rotulo[a.situacao] ?? a.situacao}</Badge></Link>)}{!isLoading && linhas.length === 0 && <p className="p-4 text-muted-foreground">Nenhum aluno encontrado.</p>}</CardContent></Card>
  </section>;
};

export const AlunoDetalhePage = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { data: alunos = [] } = useAlunos();
  const { data: pessoas = [] } = usePessoasAlunos();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: nucleos = [] } = useNucleos();
  const { data: inscricoes = [] } = useMatriculas();
  const { toast } = useToast();
  const client = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const aluno = alunos.find(a => a.id === alunoId);
  const pessoa = pessoas.find(p => p.id === aluno?.pessoa_id);
  const { data: auditoria = [], error: erroAuditoria } = useAuditoriaAluno(alunoId, aluno?.pessoa_id);
  const outros = alunos.filter(a => a.pessoa_id && a.pessoa_id === aluno?.pessoa_id && a.id !== aluno?.id);
  const participacoes = inscricoes.filter(i => i.pessoa_id && i.pessoa_id === aluno?.pessoa_id);
  const inscricao = inscricoes.find(i => i.id === aluno?.inscricao_id);
  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aluno || !pessoa) return;
    const f = new FormData(event.currentTarget);
    setSalvando(true);
    try {
      const { error } = await rpc("atualizar_aluno_its", {
        p_aluno_id: aluno.id, p_nome: String(f.get("nome") ?? "").trim(), p_cpf: String(f.get("cpf") ?? ""),
        p_telefone: String(f.get("telefone") ?? ""), p_email: String(f.get("email") ?? ""),
        p_nascimento: String(f.get("nascimento") ?? "") || null, p_escolaridade: String(f.get("escolaridade") ?? ""),
        p_unidade: String(f.get("unidade") ?? ""), p_situacao: String(f.get("situacao") ?? ""),
        p_observacoes: String(f.get("observacoes") ?? ""),
      });
      if (error) throw error;
      await Promise.all([
        client.invalidateQueries({ queryKey: ALUNOS_KEY }),
        client.invalidateQueries({ queryKey: ["pessoas", "alunos"] }),
        client.invalidateQueries({ queryKey: ["inscricoes"] }),
        client.invalidateQueries({ queryKey: ["auditoria", "aluno", aluno.id] }),
      ]);
      toast({ title: "Ficha do aluno atualizada" });
    } catch (e) { toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSalvando(false); }
  }
  if (!aluno || !pessoa) return <div className="container space-y-3 py-8"><Button variant="link" onClick={() => navigate("/painel/instituto?secao=alunos")}>Voltar a Alunos</Button><p>Aluno não encontrado ou cadastro ainda carregando.</p></div>;
  const bloqueado = inscricao?.status === "cancelado";
  return <div className="container space-y-5 py-8"><Link className="text-sm underline" to="/painel/instituto?secao=alunos">Instituto / Alunos</Link><div><h1 className="text-2xl font-bold">{pessoa.nome_completo}</h1><p>{cursos.find(c => c.id === aluno.curso_id)?.nome ?? "Curso"} · {rotulo[aluno.situacao] ?? aluno.situacao}</p></div>
    <div className="flex flex-wrap gap-2">{inscricao && <Button asChild variant="outline"><Link to={`/painel/inscricoes?id=${inscricao.id}`}>Abrir inscrição</Link></Button>}<Button asChild variant="outline"><Link to={`/painel/financeiro?tab=lancamentos&aluno=${aluno.id}${inscricao ? `&inscricao=${inscricao.id}` : ""}`}>Movimentações do aluno</Link></Button><Button asChild variant="outline"><Link to={`/painel/relatorios?tab=cursos&curso=${aluno.curso_id}`}>Relatório do curso</Link></Button><Button asChild variant="outline"><Link to="/painel/inscricoes?nova=1">Nova inscrição em outro curso</Link></Button></div>
    {aluno.origem_referencia && <p className="rounded border p-3 text-sm">Origem histórica: {aluno.origem_referencia}. Confira identidade e CPF antes de ativar; não há geração de meses esperados.</p>}
    {bloqueado && <p className="rounded border p-3 text-sm">Inscrição cancelada. A participação só pode ser alterada em Inscrições.</p>}
    <Card><CardHeader><CardTitle>Cadastro e vínculo acadêmico</CardTitle></CardHeader><CardContent><form key={aluno.id + pessoa.updated_at + aluno.updated_at} onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
      <Label>Nome<Input name="nome" defaultValue={pessoa.nome_completo} required /></Label><Label>CPF<Input name="cpf" inputMode="numeric" defaultValue={pessoa.cpf ?? ""} /></Label>
      <Label>Telefone<Input name="telefone" defaultValue={pessoa.telefone ?? ""} /></Label><Label>E-mail<Input name="email" type="email" defaultValue={pessoa.email ?? ""} /></Label>
      <Label>Nascimento<Input name="nascimento" type="date" defaultValue={pessoa.data_nascimento ?? ""} /></Label><Label>Escolaridade<Input name="escolaridade" defaultValue={pessoa.escolaridade ?? ""} /></Label>
      <Label>Unidade atual<select name="unidade" className="h-10 w-full rounded border bg-background px-2" defaultValue={aluno.unidade}><option value="correspondencia">Correspondência</option>{nucleos.filter(n => n.ativo || n.id === aluno.nucleo_id).map(n => <option key={n.id} value={n.slug}>{n.nome}</option>)}</select></Label>
      <Label>Situação acadêmica<select name="situacao" className="h-10 w-full rounded border bg-background px-2" defaultValue={aluno.situacao}>{situacoes.filter(s => s !== "cancelado" || aluno.situacao === "cancelado").filter(s => s !== "pendente_validacao" || aluno.situacao === "pendente_validacao").map(s => <option key={s} value={s}>{rotulo[s]}</option>)}</select></Label>
      <Label className="sm:col-span-2">Observações acadêmicas<textarea name="observacoes" className="min-h-24 w-full rounded border bg-background p-2" defaultValue={aluno.observacoes ?? ""} /></Label>
      <div className="sm:col-span-2"><Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</Button></div>
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>Participação e outros vínculos</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Inscrição do vínculo: {inscricao ? `${inscricao.numero_inscricao} · ${inscricao.status}` : "Histórico sem inscrição individual"}</p><p>Núcleo informado na inscrição: {inscricao?.nucleo ?? "não disponível"} · Unidade acadêmica atual: {aluno.unidade}</p>{outros.map(a => <Link key={a.id} className="block underline" to={`/painel/instituto/alunos/${a.id}`}>{cursos.find(c => c.id === a.curso_id)?.nome ?? "Curso"} · {rotulo[a.situacao] ?? a.situacao}</Link>)}{participacoes.map(i => <Link key={i.id} className="block underline" to={`/painel/inscricoes?id=${i.id}`}>{i.curso_id ? cursos.find(c => c.id === i.curso_id)?.nome ?? "Curso" : edicoes.find(e => e.id === i.edicao_simposio_id)?.nome ?? "Simpósio"} · {i.numero_inscricao} · {i.status}</Link>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Histórico de alterações</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{erroAuditoria && <p>Não foi possível carregar a auditoria.</p>}{auditoria.length ? auditoria.map(a => <p key={a.id} className="border-b pb-2">{new Date(a.created_at).toLocaleString("pt-BR")} · {a.acao} · usuário {a.executado_por?.slice(0, 8) ?? "não identificado"}</p>) : <p>Sem alterações registradas.</p>}</CardContent></Card>
  </div>;
};
