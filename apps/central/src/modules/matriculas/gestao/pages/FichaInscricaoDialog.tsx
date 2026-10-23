import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Card, CardContent } from "@/common/ui/card";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useLancamentos, type Lancamento } from "@/modules/financeiro/api";
import LancamentoDialog from "@/modules/financeiro/gestao/components/LancamentoDialog";
import { DevolucaoDialog } from "@/modules/financeiro/gestao/components/DevolucaoDialog";
import { atualizarDadosAtendimento, cancelarInscricaoInterna, confirmarInscricaoIts, FICHA_INSCRICAO_KEY,
  ISENCOES_INSCRICAO_KEY, marcarPagamentoNaoIdentificado, MATRICULAS_KEY, obterUrlComprovante,
  resolverCancelamento, salvarIsencaoInscricao, useFichaInscricao, type Inscricao } from "@/modules/matriculas/api";
import { nomeAtividade, recebidoLiquido, situacaoFinanceira } from "@/modules/matriculas/model/financeiro";
import { STATUS_INSCRICAO_INFO, statusInscricaoOuPadrao } from "@/modules/matriculas/model";

const finalidadeNome: Record<string, string> = { matricula: "Matrícula", mensalidade: "Mensalidade", inscricao_evento: "Inscrição no Simpósio", outro: "Outro" };
const dataBR = (valor: string) => new Date(valor).toLocaleString("pt-BR");

export const FichaInscricaoDialog = ({ inscricao, onClose }: { inscricao: Inscricao | null; onClose: () => void }) => {
  const { toast } = useToast();
  const client = useQueryClient();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: todosMovimentos = [] } = useLancamentos();
  const { data: ficha, isLoading: carregandoFicha, error: erroFicha } = useFichaInscricao(inscricao?.id ?? null);
  const [editandoDados, setEditandoDados] = useState(false);
  const [movimentoAberto, setMovimentoAberto] = useState(false);
  const [movimentoEditado, setMovimentoEditado] = useState<Lancamento | null>(null);
  const [devolvendo, setDevolvendo] = useState<Lancamento | null>(null);
  const [finalidade, setFinalidade] = useState<"matricula" | "mensalidade" | "inscricao_evento">("matricula");
  const [mesIsencao, setMesIsencao] = useState("");
  const [motivoIsencao, setMotivoIsencao] = useState("");
  const [motivoDecisao, setMotivoDecisao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const movimentos = inscricao ? todosMovimentos.filter((item) => item.inscricao_id === inscricao.id ||
    Boolean(item.estorno_de_id && todosMovimentos.some((entrada) => entrada.id === item.estorno_de_id && entrada.inscricao_id === inscricao.id))) : [];
  const curso = cursos.find((item) => item.id === inscricao?.curso_id);
  const edicao = edicoes.find((item) => item.id === inscricao?.edicao_simposio_id);
  const valorBase = inscricao?.destino === "simposio" ? edicao?.valor ?? null : curso?.taxa_matricula ?? null;
  const statusFinanceiro = inscricao ? situacaoFinanceira(inscricao, movimentos, valorBase, ficha?.isencoes) : "";
  const recebido = recebidoLiquido(movimentos);
  const mesesMensalidade = inscricao?.destino === "curso" ? Array.from(new Set([
    ...movimentos.filter((item) => item.tipo === "entrada" && item.finalidade === "mensalidade" && item.mes_referencia)
      .map((item) => item.mes_referencia!.slice(0, 7)),
    ...(ficha?.isencoes ?? []).filter((item) => item.ativo && item.finalidade === "mensalidade" && item.mes_referencia)
      .map((item) => item.mes_referencia!.slice(0, 7)),
  ])).sort() : [];
  const mensalidadeSemMes = movimentos.some((item) => item.tipo === "entrada" && item.finalidade === "mensalidade" && !item.mes_referencia);
  const disponivel = (entrada: Lancamento) => Number(entrada.valor) - movimentos
    .filter((item) => item.estorno_de_id === entrada.id && item.tipo === "saida").reduce((s, item) => s + Number(item.valor), 0);
  const atualizar = async (tarefa: () => Promise<unknown>, titulo: string) => {
    setSalvando(true);
    try {
      await tarefa();
      await Promise.all([
        client.invalidateQueries({ queryKey: MATRICULAS_KEY }),
        client.invalidateQueries({ queryKey: FICHA_INSCRICAO_KEY }),
        client.invalidateQueries({ queryKey: ISENCOES_INSCRICAO_KEY }),
        client.invalidateQueries({ queryKey: ["pedidos-cancelamento-inscricao"] }),
        client.invalidateQueries({ queryKey: ["alunos"] }),
      ]);
      toast({ title: titulo }); setMotivoDecisao(""); setMotivoIsencao(""); setEditandoDados(false);
    } catch (error) { toast({ title: "Não foi possível concluir", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setSalvando(false); }
  };
  const abrirComprovante = async (path: string) => {
    try { window.open(await obterUrlComprovante(path), "_blank", "noopener,noreferrer"); }
    catch (error) { toast({ title: "Não foi possível abrir o comprovante", description: getErrorMessage(error), variant: "destructive" }); }
  };
  const salvarDados = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!inscricao) return;
    const form = new FormData(event.currentTarget);
    void atualizar(() => atualizarDadosAtendimento({ inscricaoId: inscricao.id,
      nomeCompleto: String(form.get("nome") ?? ""), telefone: String(form.get("telefone") ?? ""),
      email: String(form.get("email") ?? ""), dataNascimento: inscricao.data_nascimento,
      escolaridade: inscricao.escolaridade }), "Dados corrigidos");
  };
  const salvarIsencao = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!inscricao) return;
    const item = inscricao.destino === "simposio" ? "inscricao_evento" : finalidade;
    void atualizar(() => salvarIsencaoInscricao(inscricao.id, item, item === "mensalidade" ? mesIsencao : null, motivoIsencao, true), "Isenção registrada");
  };
  const fechar = () => { if (!movimentoAberto && !devolvendo) { setEditandoDados(false); onClose(); } };

  return <>
    <Dialog open={Boolean(inscricao)} onOpenChange={(open) => !open && fechar()}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Inscrição {inscricao?.numero_inscricao}</DialogTitle></DialogHeader>
      {inscricao && <div className="space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-2"><Badge>{STATUS_INSCRICAO_INFO[statusInscricaoOuPadrao(inscricao.status)].labelGestao}</Badge><Badge variant="outline">{statusFinanceiro}</Badge><span className="text-muted-foreground">{inscricao.origem_cadastro} · {dataBR(inscricao.created_at)}</span></div>
        <Card><CardContent className="space-y-1 p-4"><strong>{nomeAtividade(inscricao, cursos, edicoes)}</strong><p>{inscricao.nome_completo} · CPF {inscricao.cpf}</p><p>{inscricao.email} · {inscricao.telefone}</p><p>{inscricao.modalidade === "correspondencia" ? "Correspondência" : `Presencial · ${inscricao.nucleo ?? "núcleo não informado"}`}</p><p>Nascimento: {inscricao.data_nascimento} · Escolaridade: {inscricao.escolaridade}</p></CardContent></Card>
        {erroFicha && <p className="text-destructive">Não foi possível carregar isenções, pedidos e histórico. Ações de decisão ficam indisponíveis.</p>}
        {carregandoFicha && <p>Carregando ficha...</p>}
        <section className="space-y-2"><h3 className="font-semibold">Comprovantes da inscrição</h3>
          {inscricao.comprovante_url ? <>{ficha?.comprovantes.length ? ficha.comprovantes.map((comprovante) => <Button key={comprovante.id} size="sm" variant="outline" onClick={() => void abrirComprovante(comprovante.caminho)}>Abrir · {dataBR(comprovante.created_at)}</Button>) : <Button size="sm" variant="outline" onClick={() => void abrirComprovante(inscricao.comprovante_url!)}>Abrir comprovante</Button>}
            {inscricao.status === "comprovante_enviado" && <div className="flex flex-wrap gap-2"><Input className="max-w-sm" placeholder="Motivo: pagamento não identificado" value={motivoDecisao} onChange={(e) => setMotivoDecisao(e.target.value)} /><Button variant="outline" disabled={!motivoDecisao.trim() || salvando || Boolean(erroFicha)} onClick={() => void atualizar(() => marcarPagamentoNaoIdentificado(inscricao.id, motivoDecisao), "Comprovante marcado para revisão")}>Não identificado</Button></div>}
          </> : <p className="text-muted-foreground">Não enviado. É opcional.</p>}</section>
        <section className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Movimentações vinculadas · líquido {formatBRL(recebido)}</h3>
          {inscricao.status !== "cancelado" && <Button size="sm" onClick={() => { setMovimentoEditado(null); setMovimentoAberto(true); }}>Registrar recebimento</Button>}</div>
          {inscricao.destino === "curso" && <div className="rounded-md bg-muted p-3 text-xs"><p>Matrícula: {statusFinanceiro} · recebido {formatBRL(recebidoLiquido(movimentos, "matricula"))}{curso?.taxa_matricula != null && ` de ${formatBRL(curso.taxa_matricula)}`}</p>
            {mesesMensalidade.map((mes) => { const total = recebidoLiquido(movimentos, "mensalidade", mes);
              const isenta = ficha?.isencoes.some((item) => item.ativo && item.finalidade === "mensalidade" && item.mes_referencia?.slice(0, 7) === mes);
              const referencia = curso?.mensalidade_referencia;
              return <p key={mes}>Mensalidade {mes}: {isenta ? "isenta" : referencia == null || referencia <= 0 ? "valor não configurado" : total <= 0 ? "sem recebimento" : total < referencia ? "parcial" : "valor recebido"} · recebido {formatBRL(total)}{referencia != null && ` de ${formatBRL(referencia)}`}</p>;
            })}
            {mensalidadeSemMes && <p>Há mensalidade histórica recebida sem mês de referência definido.</p>}
            <p>Exibidos apenas meses com movimento ou isenção. Nenhum mês esperado é gerado.</p>
          </div>}
          {movimentos.length === 0 && <p className="text-muted-foreground">Nenhum valor recebido ou devolvido nesta inscrição.</p>}
          {movimentos.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"><span>{item.tipo === "entrada" ? "Entrada" : "Devolução"} · {finalidadeNome[item.finalidade ?? ""] ?? item.categoria?.nome ?? "Movimento"}{item.mes_referencia && ` · ${item.mes_referencia.slice(0, 7)}`} · {item.data ?? `${item.mes_caixa.slice(0, 7)} (dia desconhecido)`} · {formatBRL(Number(item.valor))}</span><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setMovimentoEditado(item); setMovimentoAberto(true); }}>Abrir movimento</Button>{item.tipo === "entrada" && disponivel(item) > 0 && <Button size="sm" variant="outline" onClick={() => setDevolvendo(item)}>Devolver</Button>}{item.comprovante_url && <Button size="sm" variant="ghost" onClick={() => void abrirComprovante(item.comprovante_url!)}>Comprovante</Button>}</div></div>)}
        </section>
        <section className="space-y-2"><h3 className="font-semibold">Isenções</h3>
          {inscricao.isento && <p className="text-amber-700">Isenção anterior: {inscricao.motivo_isencao ?? "sem alcance definido"}. Conferir alcance antes de substituir.</p>}
          {ficha?.isencoes.filter((item) => item.ativo).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2"><span>{finalidadeNome[item.finalidade]}{item.mes_referencia && ` · ${item.mes_referencia.slice(0, 7)}`} · {item.motivo}</span><Button size="sm" variant="outline" disabled={salvando} onClick={() => void atualizar(() => salvarIsencaoInscricao(inscricao.id, item.finalidade, item.mes_referencia?.slice(0, 7) ?? null, "Revogada pela equipe", false), "Isenção revogada")}>Revogar</Button></div>)}
          {inscricao.status !== "cancelado" && !erroFicha && <form className="grid gap-2 sm:grid-cols-4" onSubmit={salvarIsencao}><select aria-label="Item da isenção" className="h-10 rounded-md border bg-background px-2" value={inscricao.destino === "simposio" ? "inscricao_evento" : finalidade} onChange={(e) => setFinalidade(e.target.value as typeof finalidade)}>{inscricao.destino === "simposio" ? <option value="inscricao_evento">Inscrição no Simpósio</option> : <><option value="matricula">Matrícula</option><option value="mensalidade">Mensalidade</option></>}</select>{finalidade === "mensalidade" && inscricao.destino === "curso" && <Input aria-label="Mês da isenção" type="month" value={mesIsencao} onChange={(e) => setMesIsencao(e.target.value)} required />}<Input className="sm:col-span-2" aria-label="Motivo da isenção" placeholder="Motivo da isenção" value={motivoIsencao} onChange={(e) => setMotivoIsencao(e.target.value)} required /><Button disabled={salvando}>Registrar isenção</Button></form>}
        </section>
        <section className="space-y-2"><h3 className="font-semibold">Solicitações de cancelamento</h3>
          {ficha?.pedidos.length ? ficha.pedidos.map((pedido) => <div key={pedido.id} className="rounded-md border p-2"><p>{dataBR(pedido.solicitada_em)} · {pedido.status}</p>{pedido.status === "pendente" && <div className="mt-2 flex flex-wrap gap-2"><Input className="max-w-sm" placeholder="Motivo da decisão" value={motivoDecisao} onChange={(e) => setMotivoDecisao(e.target.value)} /><Button size="sm" disabled={!motivoDecisao.trim() || salvando || Boolean(erroFicha)} onClick={() => void atualizar(() => resolverCancelamento(pedido.id, true, motivoDecisao), "Cancelamento aprovado")}>Aprovar cancelamento</Button><Button size="sm" variant="outline" disabled={!motivoDecisao.trim() || salvando || Boolean(erroFicha)} onClick={() => void atualizar(() => resolverCancelamento(pedido.id, false, motivoDecisao), "Pedido rejeitado")}>Rejeitar</Button></div>}</div>) : <p className="text-muted-foreground">Nenhum pedido.</p>}
        </section>
        <section className="space-y-2"><h3 className="font-semibold">Decisão da equipe</h3>
          {inscricao.status !== "cancelado" && <><Button variant="outline" onClick={() => setEditandoDados(!editandoDados)}>Corrigir dados</Button>{editandoDados && <form className="grid gap-2 sm:grid-cols-2" onSubmit={salvarDados}><div><Label>Nome</Label><Input name="nome" defaultValue={inscricao.nome_completo} required /></div><div><Label>Telefone</Label><Input name="telefone" defaultValue={inscricao.telefone} required /></div><div><Label>E-mail</Label><Input name="email" type="email" defaultValue={inscricao.email} required /></div><Button disabled={salvando}>Salvar correção</Button></form>}</>}
          <div className="flex flex-wrap gap-2">{inscricao.status !== "confirmada" && inscricao.status !== "cancelado" && <Button disabled={salvando || Boolean(erroFicha)} onClick={() => void atualizar(() => confirmarInscricaoIts(inscricao.id, null, false, null), "Inscrição confirmada")}>Confirmar inscrição</Button>}</div>
          {inscricao.status !== "cancelado" && <div className="flex flex-wrap gap-2"><Input className="max-w-sm" placeholder="Motivo do cancelamento" value={motivoDecisao} onChange={(e) => setMotivoDecisao(e.target.value)} /><Button variant="destructive" disabled={!motivoDecisao.trim() || salvando || Boolean(erroFicha)} onClick={() => void atualizar(() => cancelarInscricaoInterna(inscricao.id, motivoDecisao), "Inscrição cancelada")}>Cancelar inscrição</Button></div>}
          <p className="text-xs text-muted-foreground">Confirmar não registra pagamento. Cancelar não registra devolução.</p>
        </section>
        <section className="space-y-2"><h3 className="font-semibold">Histórico de decisões</h3>{ficha?.auditoria.map((evento) => <p key={evento.id} className="border-b pb-1 text-xs">{dataBR(evento.created_at)} · {evento.acao}{evento.motivo && ` · ${evento.motivo}`}{evento.acao === "confirmada_pela_equipe" && evento.dados?.contexto_financeiro ? ` · ${String(evento.dados.contexto_financeiro)}` : ""}{evento.executado_por && ` · usuário ${evento.executado_por.slice(0, 8)}`}</p>)}</section>
      </div>}
    </DialogContent></Dialog>
    <LancamentoDialog open={movimentoAberto} onOpenChange={setMovimentoAberto} lancamento={movimentoEditado} inscricaoInicialId={inscricao?.id} />
    <DevolucaoDialog entrada={devolvendo} disponivel={devolvendo ? disponivel(devolvendo) : 0} onClose={() => setDevolvendo(null)} />
  </>;
};
