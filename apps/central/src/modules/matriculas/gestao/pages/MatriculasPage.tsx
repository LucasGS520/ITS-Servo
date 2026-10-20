import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Search } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { atualizarDadosAtendimento, cancelarInscricaoInterna, confirmarInscricaoIts, MATRICULAS_KEY, useMatriculas, type Inscricao } from "@/modules/matriculas/api";
import { STATUS_INSCRICAO_INFO, statusInscricaoOuPadrao } from "@/modules/matriculas/model";
import { NovaInscricaoDialog } from "./NovaInscricaoDialog";

const AtendimentoPage = () => {
  const { toast } = useToast();
  const client = useQueryClient();
  const { data: inscricoes = [] } = useMatriculas();
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Inscricao | null>(null);
  const [nova, setNova] = useState(false);
  const [editando, setEditando] = useState(false);
  const [competencia, setCompetencia] = useState("");
  const [isento, setIsento] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const linhas = useMemo(() => inscricoes.filter((i) => [i.nome_completo, i.numero_inscricao, i.email, i.cpf].some((v) => v?.toLowerCase().includes(busca.toLowerCase()))), [inscricoes, busca]);

  const abrir = (i: Inscricao) => { setSelecionada(i); setEditando(false); setCompetencia(""); setIsento(false); setMotivo(""); };
  const atualizar = async (acao: () => Promise<void>, titulo: string) => {
    setSalvando(true);
    try { await acao(); await client.invalidateQueries({ queryKey: MATRICULAS_KEY }); toast({ title: titulo }); setSelecionada(null); }
    catch (error) { toast({ title: "Não foi possível atualizar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setSalvando(false); }
  };

  const corrigir = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selecionada) return;
    const f = new FormData(event.currentTarget);
    void atualizar(() => atualizarDadosAtendimento({ inscricaoId: selecionada.id, nomeCompleto: String(f.get("nome") ?? ""), telefone: String(f.get("telefone") ?? ""), email: String(f.get("email") ?? ""), dataNascimento: selecionada.data_nascimento, escolaridade: selecionada.escolaridade }), "Dados atualizados");
  };

  return <div className="container space-y-6 py-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Atendimento</h1><p className="text-sm text-muted-foreground">Inscrições, confirmação pela equipe e acompanhamento de participantes.</p></div><Button onClick={() => setNova(true)}><Plus className="mr-2 h-4 w-4" />Nova inscrição</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar nome, CPF, inscrição ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Inscrição</TableHead><TableHead>Nome</TableHead><TableHead>Atividade</TableHead><TableHead>Status</TableHead><TableHead>Núcleo</TableHead><TableHead /></TableRow></TableHeader><TableBody>{linhas.map((i) => <TableRow key={i.id}><TableCell>{i.numero_inscricao}</TableCell><TableCell>{i.nome_completo}</TableCell><TableCell>{i.destino === "simposio" ? "Simpósio" : "Curso"}</TableCell><TableCell><Badge variant="outline">{STATUS_INSCRICAO_INFO[statusInscricaoOuPadrao(i.status)].labelGestao}</Badge></TableCell><TableCell>{i.nucleo ?? "Correspondência"}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label="Abrir inscrição" onClick={() => abrir(i)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
    <NovaInscricaoDialog open={nova} onClose={() => setNova(false)} />
    <Dialog open={Boolean(selecionada)} onOpenChange={(aberto) => !aberto && setSelecionada(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selecionada?.numero_inscricao}</DialogTitle></DialogHeader>{selecionada && (editando ?
      <form className="space-y-3" onSubmit={corrigir}><div><Label>Nome</Label><Input name="nome" defaultValue={selecionada.nome_completo} required /></div><div><Label>Telefone</Label><Input name="telefone" defaultValue={selecionada.telefone} required /></div><div><Label>E-mail</Label><Input name="email" type="email" defaultValue={selecionada.email} required /></div><Button disabled={salvando}>Salvar correção</Button></form>
      : <div className="space-y-4 text-sm"><p><strong>{selecionada.nome_completo}</strong><br />{selecionada.email} · {selecionada.telefone}</p><p>Modalidade: {selecionada.modalidade} · Núcleo: {selecionada.nucleo ?? "Correspondência"}</p><p>Comprovante: {selecionada.comprovante_url ? "enviado para conferência" : "não enviado"}</p>
        {selecionada.status !== "confirmada" && selecionada.status !== "cancelado" && <>
          <Button variant="outline" onClick={() => setEditando(true)}>Corrigir dados</Button>
          {selecionada.destino === "curso" && <div><Label htmlFor="primeira-competencia">Primeiro mês esperado</Label><Input id="primeira-competencia" type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} /></div>}
          <label className="flex items-center gap-2"><input type="checkbox" checked={isento} onChange={(e) => setIsento(e.target.checked)} /> Isento</label>
          {isento && <div><Label htmlFor="motivo-isencao">Motivo da isenção</Label><Input id="motivo-isencao" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>}
          <Button disabled={salvando || (selecionada.destino === "curso" && !competencia) || (isento && !motivo.trim())} onClick={() => void atualizar(() => confirmarInscricaoIts(selecionada.id, selecionada.destino === "curso" ? `${competencia}-01` : null, isento, motivo || null), "Inscrição confirmada pela equipe")}>Confirmar inscrição</Button>
          <Button variant="destructive" disabled={salvando} onClick={() => { const razao = window.prompt("Motivo do cancelamento:"); if (razao?.trim()) void atualizar(() => cancelarInscricaoInterna(selecionada.id, razao), "Inscrição cancelada"); }}>Cancelar inscrição</Button>
        </>}
      </div>)}</DialogContent></Dialog>
  </div>;
};

export default AtendimentoPage;
