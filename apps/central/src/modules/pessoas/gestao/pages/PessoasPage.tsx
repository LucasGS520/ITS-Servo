import { useMemo, useState } from "react";
import { Input } from "@/common/ui/input";
import { Badge } from "@/common/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Loader2, Search, Users } from "lucide-react";
import { usePessoasComHistorico } from "@/modules/pessoas/api";

type Filtro = "todos" | "teologico" | "capacitacao_obreiros" | "simposio" | "sem_participacao";

const PessoasPage = () => {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const { data, isLoading, error } = usePessoasComHistorico();

  const linhas = useMemo(() => {
    if (!data) return [];
    const porId = new Map(data.cursos.map((curso) => [curso.id, curso.codigo]));
    return data.pessoas.map((pessoa) => {
      const historico = data.inscricoes.filter((inscricao) => inscricao.pessoa_id === pessoa.id && inscricao.status !== "cancelado");
      const cursos = historico.map((item) => item.curso_id ? porId.get(item.curso_id) : null).filter(Boolean);
      return { pessoa, teologico: cursos.includes("teologico"), capacitacao: cursos.includes("capacitacao_obreiros"), simposio: historico.some((item) => item.edicao_simposio_id) };
    }).filter(({ pessoa, teologico, capacitacao, simposio }) => {
      const termo = busca.trim().toLowerCase();
      const buscaOk = !termo || `${pessoa.nome_completo} ${pessoa.cpf} ${pessoa.email ?? ""}`.toLowerCase().includes(termo);
      const filtroOk = filtro === "todos" || (filtro === "teologico" && teologico) || (filtro === "capacitacao_obreiros" && capacitacao) || (filtro === "simposio" && simposio) || (filtro === "sem_participacao" && !teologico && !capacitacao && !simposio);
      return buscaOk && filtroOk;
    });
  }, [busca, data, filtro]);

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (error) return <div className="container py-8 text-destructive">Não foi possível carregar as pessoas.</div>;

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pessoas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastros únicos e histórico de participação no ITS.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome, CPF ou e-mail" /></div>
        <select aria-label="Filtrar histórico" value={filtro} onChange={(event) => setFiltro(event.target.value as Filtro)} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="todos">Todos os históricos</option><option value="teologico">Curso Teológico</option><option value="capacitacao_obreiros">Capacitação de Obreiros</option><option value="simposio">Simpósio</option><option value="sem_participacao">Sem participação</option>
        </select>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{linhas.length} pessoa(s)</CardTitle></CardHeader><CardContent className="space-y-3">
        {linhas.map(({ pessoa, teologico, capacitacao, simposio }) => <div key={pessoa.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{pessoa.nome_completo}</p><p className="text-sm text-muted-foreground">{pessoa.email ?? "Sem e-mail"} · {pessoa.cpf}</p></div><div className="flex flex-wrap gap-2">{teologico && <Badge>Curso Teológico</Badge>}{capacitacao && <Badge variant="secondary">Capacitação de Obreiros</Badge>}{simposio && <Badge variant="outline">Simpósio</Badge>}{!teologico && !capacitacao && !simposio && <Badge variant="outline">Sem participação</Badge>}</div></div>)}
        {linhas.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>}
      </CardContent></Card>
    </div>
  );
};

export default PessoasPage;
