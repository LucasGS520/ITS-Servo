import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { useAlunos, ALUNOS_KEY } from "@/modules/financeiro/api";
import { UNIDADE_LABELS } from "@/modules/financeiro/model/unidades";
import { validarAlunoHistorico } from "@/modules/financeiro/api/its";

type AlunoHistorico = { id: string; nome: string; unidade: string; situacao?: string; origem_referencia?: string | null; primeira_competencia?: string | null };

const AlunosTab = () => {
  const { data = [] } = useAlunos();
  const client = useQueryClient();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [aluno, setAluno] = useState<AlunoHistorico | null>(null);
  const [situacao, setSituacao] = useState("ativo");
  const [salvando, setSalvando] = useState(false);
  const alunos = data as unknown as AlunoHistorico[];
  const linhas = useMemo(() => alunos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase())), [alunos, busca]);

  const validar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!aluno) return;
    const form = new FormData(event.currentTarget);
    const primeira = String(form.get("primeira") ?? "");
    setSalvando(true);
    try {
      await validarAlunoHistorico({
        alunoId: aluno.id, nome: String(form.get("nome") ?? "").trim(),
        cpf: String(form.get("cpf") ?? ""), situacao,
        primeiraCompetencia: primeira ? `${primeira}-01` : null,
      });
      await client.invalidateQueries({ queryKey: ALUNOS_KEY });
      toast({ title: "Histórico do aluno validado" }); setAluno(null);
    } catch (error) { toast({ title: "Não foi possível validar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setSalvando(false); }
  };

  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Alunos da planilha de 2026 ficam pendentes de validação. Apenas alunos ativos validados geram controle interno de mensalidades. Novos alunos entram por Atendimento.</p>
    <Input placeholder="Buscar aluno" value={busca} onChange={(event) => setBusca(event.target.value)} />
    <Card><CardContent className="divide-y p-0">{linhas.map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><strong>{a.nome}</strong><p className="text-xs text-muted-foreground">{UNIDADE_LABELS[a.unidade] ?? a.unidade}</p></div><div className="flex items-center gap-3"><Badge variant="outline">{a.situacao ?? "Ativo"}</Badge>{a.origem_referencia && <Button size="sm" variant="outline" onClick={() => { setAluno(a); setSituacao(a.situacao === "pendente_validacao" ? "ativo" : a.situacao ?? "ativo"); }}>Validar</Button>}</div></div>)}</CardContent></Card>
    <Dialog open={Boolean(aluno)} onOpenChange={(open) => !open && setAluno(null)}><DialogContent><DialogHeader><DialogTitle>Validar aluno histórico</DialogTitle></DialogHeader>{aluno && <form className="space-y-3" onSubmit={validar}><div><Label htmlFor="historico-nome">Nome completo conferido</Label><Input id="historico-nome" name="nome" defaultValue={aluno.nome} required /></div><div><Label htmlFor="historico-cpf">CPF (obrigatório para ativo)</Label><Input id="historico-cpf" name="cpf" inputMode="numeric" /></div><div><Label htmlFor="historico-situacao">Situação</Label><select id="historico-situacao" className="h-10 w-full rounded-md border bg-background px-3" value={situacao} onChange={(event) => setSituacao(event.target.value)}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></div>{situacao === "ativo" && <div><Label htmlFor="historico-primeira">Primeiro mês esperado</Label><Input id="historico-primeira" name="primeira" type="month" defaultValue={aluno.primeira_competencia?.slice(0, 7) ?? ""} required /></div>}<p className="text-xs text-muted-foreground">Os valores recebidos em 2026 permanecem sem mês de mensalidade atribuído até conferência individual.</p><Button disabled={salvando}>{salvando ? "Salvando..." : "Confirmar validação"}</Button></form>}</DialogContent></Dialog>
  </div>;
};

export default AlunosTab;
