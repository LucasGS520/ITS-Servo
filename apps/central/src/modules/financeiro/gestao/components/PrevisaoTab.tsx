import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { formatBRL } from "@/common/constants/pricing";
import { useAlunos } from "@/modules/financeiro/api";
import { useCursos } from "@/modules/atividades/api";
import { useAtribuicoesMensalidade, useRecebimentosIts } from "@/modules/financeiro/api/its";

type AlunoControle = { id: string; nome: string; curso_id: string | null; situacao: string; primeira_competencia: string | null };
type CursoControle = { id: string; nome: string; mensalidade_referencia: number | null };

function mesesAteHoje(inicio: string): string[] {
  const atual = new Date();
  const cursor = new Date(`${inicio.slice(0, 7)}-01T12:00:00`);
  const fim = new Date(atual.getFullYear(), atual.getMonth(), 1, 12);
  const meses: string[] = [];
  while (cursor <= fim && meses.length < 120) {
    meses.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

const PrevisaoTab = () => {
  const { data: alunos = [] } = useAlunos();
  const { data: cursos = [] } = useCursos();
  const { data: atribuicoes = [] } = useAtribuicoesMensalidade();
  const { data: recebimentos = [] } = useRecebimentosIts();
  const alunosControle = alunos as unknown as AlunoControle[];
  const cursosControle = cursos as unknown as CursoControle[];
  const validos = new Set(recebimentos.filter((r) => r.status === "confirmado").map((r) => r.id));
  const linhas = alunosControle.filter((a) => a.situacao === "ativo" && a.primeira_competencia).flatMap((aluno) => {
    const curso = cursosControle.find((c) => c.id === aluno.curso_id);
    if (!curso?.mensalidade_referencia) return [];
    return mesesAteHoje(aluno.primeira_competencia!).map((competencia) => {
      const pago = atribuicoes.filter((a) => a.aluno_id === aluno.id && a.competencia === competencia && validos.has(a.recebimento_id)).reduce((s, a) => s + Number(a.valor), 0);
      return { aluno, curso, competencia, pago, esperado: Number(curso.mensalidade_referencia), restante: Math.max(0, Number(curso.mensalidade_referencia) - pago) };
    });
  });
  const pendentes = linhas.filter((l) => l.restante > 0);
  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">Controle interno de mensalidades. Não há emissão de cobrança. Alunos históricos pendentes de validação não geram meses esperados.</p>
    <Card><CardHeader><CardTitle>Mensalidades até o mês atual</CardTitle></CardHeader><CardContent><p>{linhas.length} competências · {pendentes.length} com saldo · {formatBRL(pendentes.reduce((s, l) => s + l.restante, 0))} ainda não atribuído</p></CardContent></Card>
    <div className="space-y-2">{pendentes.map((l) => <div key={`${l.aluno.id}:${l.competencia}`} className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-sm"><span>{l.aluno.nome} · {l.curso.nome} · {l.competencia.slice(0, 7)}</span><span>Pago: {formatBRL(l.pago)} · Pendente: {formatBRL(l.restante)}</span></div>)}</div>
  </div>;
};

export default PrevisaoTab;
