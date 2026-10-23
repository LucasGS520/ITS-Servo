import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Textarea } from "@/common/ui/textarea";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import { useAlunos, useCategorias, type Lancamento } from "@/modules/financeiro/api";
import { enviarComprovanteFinanceiro, removerComprovanteFinanceiro, useSalvarMovimentacao, type MovimentacaoInput } from "@/modules/financeiro/api/movimentacoes";
import { useMatriculas, obterUrlComprovante } from "@/modules/matriculas";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";

const hoje = () => new Date().toLocaleDateString("en-CA");
const valorNumerico = (texto: string) => Number(texto.trim().includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
type Pagador = "nenhum" | "inscricao" | "historico";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; lancamento?: Lancamento | null; inscricaoInicialId?: string | null }

const LancamentoDialog = ({ open, onOpenChange, lancamento, inscricaoInicialId }: Props) => {
  const { toast } = useToast();
  const salvar = useSalvarMovimentacao();
  const { data: categorias = [] } = useCategorias();
  const { data: inscricoes = [] } = useMatriculas();
  const { data: alunos = [] } = useAlunos();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const inscricaoInicial = inscricoes.find((item) => item.id === inscricaoInicialId);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [categoriaId, setCategoriaId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje);
  const [mesCaixa, setMesCaixa] = useState(hoje().slice(0, 7));
  const [unidade, setUnidade] = useState("geral");
  const [atividade, setAtividade] = useState("geral");
  const [pagador, setPagador] = useState<Pagador>("nenhum");
  const [inscricaoId, setInscricaoId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [finalidade, setFinalidade] = useState<NonNullable<MovimentacaoInput["finalidade"]>>("mensalidade");
  const [mesReferencia, setMesReferencia] = useState("");
  const [comprovante, setComprovante] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");
  const devolucao = Boolean(lancamento?.estorno_de_id);

  useEffect(() => {
    if (!open) return;
    setTipo((lancamento?.tipo as "entrada" | "saida") ?? "entrada");
    setCategoriaId(lancamento?.categoria_id ?? "");
    setValor(lancamento ? String(lancamento.valor) : "");
    setData(lancamento ? lancamento.data ?? "" : hoje());
    setMesCaixa(lancamento?.mes_caixa.slice(0, 7) ?? hoje().slice(0, 7));
    setUnidade(lancamento?.unidade ?? (inscricaoInicial ? inscricaoInicial.modalidade === "correspondencia" ? "correspondencia" : inscricaoInicial.nucleo ?? "geral" : "geral"));
    setAtividade(lancamento?.curso_id ? `curso:${lancamento.curso_id}` : lancamento?.edicao_simposio_id ? `simposio:${lancamento.edicao_simposio_id}` : inscricaoInicial?.curso_id ? `curso:${inscricaoInicial.curso_id}` : inscricaoInicial?.edicao_simposio_id ? `simposio:${inscricaoInicial.edicao_simposio_id}` : "geral");
    setPagador(lancamento?.inscricao_id || inscricaoInicialId ? "inscricao" : lancamento?.aluno_id && lancamento.finalidade ? "historico" : "nenhum");
    setInscricaoId(lancamento?.inscricao_id ?? inscricaoInicialId ?? "");
    setAlunoId(lancamento?.aluno_id ?? "");
    setFinalidade(lancamento?.finalidade ?? (inscricaoInicial?.destino === "simposio" ? "inscricao_evento" : "matricula"));
    setMesReferencia(lancamento?.mes_referencia?.slice(0, 7) ?? "");
    setComprovante(lancamento?.comprovante_url ?? "");
    setArquivo(null);
    setDescricao(lancamento?.descricao ?? "");
  }, [open, lancamento, inscricaoInicialId, inscricaoInicial]);

  const inscricao = inscricoes.find((item) => item.id === inscricaoId);
  const aluno = alunos.find((item) => item.id === alunoId);
  const inscritos = useMemo(() => inscricoes.filter((item) => item.status !== "cancelado" || item.id === inscricaoId), [inscricoes, inscricaoId]);
  const historicos = useMemo(() => alunos.filter((item) => item.origem_referencia && (item.situacao !== "pendente_validacao" || item.id === alunoId)), [alunos, alunoId]);
  const categoriasDisponiveis = categorias.filter((item) => item.tipo === tipo && (item.ativo || item.id === categoriaId));

  const escolherCategoria = (nome: string) => {
    const item = categorias.find((categoria) => categoria.nome === nome && categoria.tipo === "entrada" && categoria.ativo);
    if (item) setCategoriaId(item.id);
  };

  const selecionarInscricao = (id: string) => {
    setInscricaoId(id);
    const item = inscricoes.find((inscricaoAtual) => inscricaoAtual.id === id);
    if (!item) return;
    setFinalidade(item.destino === "simposio" ? "inscricao_evento" : "mensalidade");
    setAtividade(item.curso_id ? `curso:${item.curso_id}` : item.edicao_simposio_id ? `simposio:${item.edicao_simposio_id}` : "geral");
    setUnidade(item.modalidade === "correspondencia" ? "correspondencia" : item.nucleo ?? "geral");
    escolherCategoria(item.destino === "simposio" ? "Simpósio" : "Mensalidade");
  };

  const selecionarAluno = (id: string) => {
    setAlunoId(id);
    const item = alunos.find((alunoAtual) => alunoAtual.id === id);
    if (!item) return;
    setAtividade(item.curso_id ? `curso:${item.curso_id}` : "geral");
    setUnidade(item.unidade ?? "geral");
    setFinalidade("mensalidade");
    escolherCategoria("Mensalidade");
  };

  const abrirComprovante = async (path: string) => {
    try { window.open(await obterUrlComprovante(path), "_blank", "noopener,noreferrer"); }
    catch (error) { toast({ title: "Não foi possível abrir o comprovante", description: getErrorMessage(error), variant: "destructive" }); }
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numero = valorNumerico(valor);
    if (!Number.isFinite(numero) || numero <= 0 || !categoriaId || !mesCaixa || (data && data.slice(0, 7) !== mesCaixa)) {
      toast({ title: "Confira valor, categoria e data", variant: "destructive" }); return;
    }
    if (pagador === "inscricao" && !inscricaoId || pagador === "historico" && !alunoId) {
      toast({ title: "Selecione a inscrição ou o aluno", variant: "destructive" }); return;
    }
    if (tipo === "entrada" && pagador !== "nenhum" && finalidade === "mensalidade" && !mesReferencia && !lancamento?.origem_referencia) {
      toast({ title: "Informe o mês da mensalidade", variant: "destructive" }); return;
    }
    if (!data && (!lancamento || lancamento.precisao_data !== "mes")) {
      toast({ title: "Informe a data do movimento", variant: "destructive" }); return;
    }
    let pathNovo: string | null = null;
    try {
      if (arquivo) pathNovo = await enviarComprovanteFinanceiro(arquivo);
      const vinculado = tipo === "entrada" && pagador !== "nenhum" && !devolucao;
      await salvar.mutateAsync({
        id: lancamento?.id ?? null, tipo, valor: numero, data: data || null, mesCaixa,
        categoriaId, unidade: unidade === "geral" ? null : unidade,
        cursoId: atividade.startsWith("curso:") ? atividade.slice(6) : null,
        edicaoId: atividade.startsWith("simposio:") ? atividade.slice(9) : null,
        inscricaoId: vinculado && pagador === "inscricao" ? inscricaoId : null,
        alunoHistoricoId: vinculado && pagador === "historico" ? alunoId : null,
        finalidade: vinculado ? finalidade : null,
        mesReferencia: vinculado && finalidade === "mensalidade" ? mesReferencia || null : null,
        comprovanteUrl: pathNovo ?? (comprovante || null),
        descricao: descricao.trim() || null,
      });
      toast({ title: lancamento ? "Movimentação atualizada" : "Movimentação registrada" });
      onOpenChange(false);
    } catch (error) {
      if (pathNovo) await removerComprovanteFinanceiro(pathNovo);
      toast({ title: "Não foi possível salvar", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{lancamento ? "Editar movimentação" : "Nova movimentação"}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={enviar}>
      {lancamento?.origem_referencia && <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">Registro importado: {lancamento.origem_referencia}. A edição mantém a origem e registra a alteração.</p>}
      {devolucao && <p className="text-sm text-muted-foreground">Esta saída permanece vinculada à entrada original. Valor, data, categoria e observação podem ser corrigidos.</p>}
      <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="mov-tipo">Tipo</Label><select id="mov-tipo" className="h-10 w-full rounded-md border bg-background px-3" value={tipo} disabled={devolucao || Boolean(inscricaoInicialId)} onChange={(e) => { setTipo(e.target.value as "entrada" | "saida"); setCategoriaId(""); if (e.target.value === "saida") setPagador("nenhum"); }}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div><div><Label htmlFor="mov-categoria">Categoria</Label><select id="mov-categoria" className="h-10 w-full rounded-md border bg-background px-3" value={categoriaId} required onChange={(e) => setCategoriaId(e.target.value)}><option value="">Selecione</option>{categoriasDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="mov-valor">Valor (R$)</Label><Input id="mov-valor" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" required /></div><div><Label htmlFor="mov-data">Data real</Label><Input id="mov-data" type="date" value={data} onChange={(e) => { setData(e.target.value); if (e.target.value) setMesCaixa(e.target.value.slice(0, 7)); }} />{!data && lancamento?.precisao_data === "mes" && <p className="text-xs text-muted-foreground">Dia desconhecido na fonte histórica</p>}</div></div>
      {!data && <div><Label htmlFor="mov-mes-caixa">Mês conhecido do caixa</Label><Input id="mov-mes-caixa" type="month" value={mesCaixa} onChange={(e) => setMesCaixa(e.target.value)} /></div>}
      {!devolucao && <><div><Label htmlFor="mov-atividade">Atividade</Label><select id="mov-atividade" className="h-10 w-full rounded-md border bg-background px-3" value={atividade} disabled={tipo === "entrada" && pagador !== "nenhum"} onChange={(e) => setAtividade(e.target.value)}><option value="geral">Geral do ITS</option>{cursos.map((item) => <option key={item.id} value={`curso:${item.id}`}>{item.nome}</option>)}{edicoes.map((item) => <option key={item.id} value={`simposio:${item.id}`}>{item.nome}</option>)}</select></div><div><Label htmlFor="mov-unidade">Unidade</Label><select id="mov-unidade" className="h-10 w-full rounded-md border bg-background px-3" value={unidade} disabled={tipo === "entrada" && pagador !== "nenhum"} onChange={(e) => setUnidade(e.target.value)}><option value="geral">Geral institucional</option>{UNIDADES_FINANCEIRO.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></>}
      {tipo === "entrada" && !devolucao && <><div><Label htmlFor="mov-pagador">Vínculo do pagamento</Label><select id="mov-pagador" className="h-10 w-full rounded-md border bg-background px-3" value={pagador} disabled={Boolean(inscricaoInicialId)} onChange={(e) => { setPagador(e.target.value as Pagador); setInscricaoId(""); setAlunoId(""); }}><option value="nenhum">Entrada sem inscrição (oferta, patrocínio etc.)</option><option value="inscricao">Inscrição de curso ou Simpósio</option><option value="historico">Aluno histórico validado, sem inscrição</option></select></div>
        {pagador === "inscricao" && <div><Label htmlFor="mov-inscricao">Inscrição</Label><select id="mov-inscricao" className="h-10 w-full rounded-md border bg-background px-3" value={inscricaoId} disabled={Boolean(inscricaoInicialId)} onChange={(e) => selecionarInscricao(e.target.value)} required><option value="">Selecione</option>{inscritos.map((item) => <option key={item.id} value={item.id}>{item.nome_completo} · {item.numero_inscricao}</option>)}</select>{inscricao && <p className="text-xs text-muted-foreground">{inscricao.status} · {inscricao.destino === "simposio" ? "Simpósio" : "Curso"}</p>}</div>}
        {pagador === "historico" && <div><Label htmlFor="mov-aluno">Aluno histórico</Label><select id="mov-aluno" className="h-10 w-full rounded-md border bg-background px-3" value={alunoId} onChange={(e) => selecionarAluno(e.target.value)} required><option value="">Selecione</option>{historicos.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.unidade}</option>)}</select>{aluno?.situacao === "pendente_validacao" && <p className="text-xs text-amber-700">Esta linha histórica pode ser editada; novos pagamentos exigem validação do aluno.</p>}</div>}
        {pagador !== "nenhum" && <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="mov-finalidade">Referente a</Label><select id="mov-finalidade" className="h-10 w-full rounded-md border bg-background px-3" value={finalidade} onChange={(e) => { const nova = e.target.value as typeof finalidade; setFinalidade(nova); if (nova === "mensalidade") escolherCategoria("Mensalidade"); else if (nova === "matricula") escolherCategoria("Matrícula"); else if (nova === "inscricao_evento") escolherCategoria("Simpósio"); }}><option value="matricula">Matrícula</option><option value="mensalidade">Mensalidade</option><option value="inscricao_evento">Inscrição em evento</option><option value="outro">Outro</option></select></div>{finalidade === "mensalidade" && <div><Label htmlFor="mov-mes-ref">Mês pago</Label><Input id="mov-mes-ref" type="month" value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} required={!lancamento?.origem_referencia} />{lancamento?.origem_referencia && !mesReferencia && <p className="text-xs text-muted-foreground">Desconhecido no histórico</p>}</div>}</div>}
      </>}
      <div><Label htmlFor="mov-descricao">Descrição ou observação</Label><Textarea id="mov-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} /></div>
      {!devolucao && <div className="space-y-2"><Label htmlFor="mov-arquivo">Comprovante opcional (PDF ou imagem, até 10 MB)</Label><Input id="mov-arquivo" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />{inscricao?.comprovante_url && <Button type="button" variant="outline" size="sm" onClick={() => setComprovante(inscricao.comprovante_url!)}>Associar comprovante da inscrição</Button>}{comprovante && <div className="flex items-center gap-3 text-xs"><span>Comprovante associado</span><button type="button" className="underline" onClick={() => void abrirComprovante(comprovante)}>Abrir</button><button type="button" className="underline" onClick={() => setComprovante("")}>Remover vínculo</button></div>}</div>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : lancamento ? "Salvar alterações" : "Registrar movimento"}</Button></div>
    </form>
  </DialogContent></Dialog>;
};

export default LancamentoDialog;
