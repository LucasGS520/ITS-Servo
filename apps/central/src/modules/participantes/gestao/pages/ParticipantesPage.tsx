import { useMemo, useState, type FormEvent } from "react";
import { Input } from "@/common/ui/input";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Label } from "@/common/ui/label";
import { Loader2, Pencil, Search, Users } from "lucide-react";
import { useParticipantesComHistorico, useSalvarPessoa } from "@/modules/participantes/api";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import type { Tables } from "@/services/supabase/types";

type Filtro = "todos" | "teologico" | "capacitacao_obreiros" | "simposio" | "sem_participacao";

const ParticipantesPage = () => {
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [edicao, setEdicao] = useState<Tables<"pessoas"> | null>(null);
  const { data, isLoading, error } = useParticipantesComHistorico();
  const salvarPessoa = useSalvarPessoa();

  const linhas = useMemo(() => {
    if (!data) return [];
    const porId = new Map(data.cursos.map((curso) => [curso.id, curso.codigo]));
    return data.pessoas.map((pessoa) => {
      const historico = data.inscricoes.filter((inscricao) => inscricao.pessoa_id === pessoa.id && inscricao.status === "confirmada");
      const emAnalise = data.inscricoes.some((inscricao) => inscricao.pessoa_id === pessoa.id && !["confirmada", "cancelado"].includes(inscricao.status));
      const cursos = historico.map((item) => item.curso_id ? porId.get(item.curso_id) : null).filter(Boolean);
      return { pessoa, teologico: cursos.includes("teologico"), capacitacao: cursos.includes("capacitacao_obreiros"), simposio: historico.some((item) => item.edicao_simposio_id), emAnalise };
    }).filter(({ pessoa, teologico, capacitacao, simposio }) => {
      const termo = busca.trim().toLowerCase();
      const buscaOk = !termo || `${pessoa.nome_completo} ${pessoa.cpf} ${pessoa.email ?? ""}`.toLowerCase().includes(termo);
      const filtroOk = filtro === "todos" || (filtro === "teologico" && teologico) || (filtro === "capacitacao_obreiros" && capacitacao) || (filtro === "simposio" && simposio) || (filtro === "sem_participacao" && !teologico && !capacitacao && !simposio);
      return buscaOk && filtroOk;
    });
  }, [busca, data, filtro]);

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edicao) return;
    const form = new FormData(event.currentTarget);
    try {
      await salvarPessoa.mutateAsync({ id: edicao.id, values: {
        nome_completo: String(form.get("nome_completo") ?? "").trim(),
        telefone: String(form.get("telefone") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
        data_nascimento: String(form.get("data_nascimento") ?? "") || null,
        escolaridade: String(form.get("escolaridade") ?? "").trim() || null,
      } });
      toast({ title: "Participante atualizado" });
      setEdicao(null);
    } catch (erro) {
      toast({ title: "Não foi possível salvar", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (error) return <div className="container py-8 text-destructive">Não foi possível carregar os participantes.</div>;

  return <div className="container space-y-6 py-8">
    <div><h1 className="text-2xl font-bold text-foreground">Participantes</h1><p className="mt-1 text-sm text-muted-foreground">Cadastro único e histórico de cursos e simpósios.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome, CPF ou e-mail" /></div>
      <select aria-label="Filtrar histórico" value={filtro} onChange={(event) => setFiltro(event.target.value as Filtro)} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="todos">Todos os históricos</option><option value="teologico">Curso Teológico</option><option value="capacitacao_obreiros">Capacitação de Obreiros</option><option value="simposio">Simpósio</option><option value="sem_participacao">Sem participação</option>
      </select>
    </div>
    <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{linhas.length} participante(s)</CardTitle></CardHeader><CardContent className="space-y-3">
      {linhas.map(({ pessoa, teologico, capacitacao, simposio, emAnalise }) => <div key={pessoa.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{pessoa.nome_completo}</p><p className="text-sm text-muted-foreground">{pessoa.email ?? "Sem e-mail"} · {pessoa.cpf}</p></div><div className="flex flex-wrap items-center gap-2">{teologico && <Badge>Curso Teológico</Badge>}{capacitacao && <Badge variant="secondary">Capacitação</Badge>}{simposio && <Badge variant="outline">Simpósio</Badge>}{emAnalise && <Badge variant="outline">Inscrição em análise</Badge>}{!teologico && !capacitacao && !simposio && !emAnalise && <Badge variant="outline">Sem participação</Badge>}<Button size="sm" variant="ghost" onClick={() => setEdicao(pessoa)}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar</Button></div></div>)}
      {linhas.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum participante encontrado.</p>}
    </CardContent></Card>
    <Dialog open={Boolean(edicao)} onOpenChange={(aberto) => !aberto && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>Editar participante</DialogTitle></DialogHeader>{edicao && <form className="space-y-4" onSubmit={salvar}>
      <div className="space-y-1"><Label htmlFor="pessoa-nome">Nome completo</Label><Input id="pessoa-nome" name="nome_completo" defaultValue={edicao.nome_completo} required /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="pessoa-telefone">Telefone</Label><Input id="pessoa-telefone" name="telefone" defaultValue={edicao.telefone ?? ""} /></div><div className="space-y-1"><Label htmlFor="pessoa-email">E-mail de contato</Label><Input id="pessoa-email" name="email" type="email" defaultValue={edicao.email ?? ""} /></div><div className="space-y-1"><Label htmlFor="pessoa-nascimento">Nascimento</Label><Input id="pessoa-nascimento" name="data_nascimento" type="date" defaultValue={edicao.data_nascimento ?? ""} /></div><div className="space-y-1"><Label htmlFor="pessoa-escolaridade">Escolaridade</Label><Input id="pessoa-escolaridade" name="escolaridade" defaultValue={edicao.escolaridade ?? ""} /></div></div>
      <p className="text-xs text-muted-foreground">CPF: {edicao.cpf}. O documento é a chave única e não pode ser alterado aqui.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEdicao(null)}>Cancelar</Button><Button type="submit" disabled={salvarPessoa.isPending}>{salvarPessoa.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></div>
    </form>}</DialogContent></Dialog>
  </div>;
};

export default ParticipantesPage;
