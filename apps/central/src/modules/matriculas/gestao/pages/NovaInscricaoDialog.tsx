import { useOperationalStatus } from "@/common/hooks/useOperationalStatus";
import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/common/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useNucleos } from "@/modules/instituto/api";
import { criarInscricaoInterna, MATRICULAS_KEY } from "@/modules/matriculas/api";

export const NovaInscricaoDialog = ({ open, onClose, onCreated, atividadeInicial = "" }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void; atividadeInicial?: string }) => {
  const { toast } = useToast();
  const client = useQueryClient();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: nucleos = [] } = useNucleos();
  const trava = useRef(false);
  const saude = useOperationalStatus(["cursos", "edicoes_simposio", "nucleos"]);
  const [atividade, setAtividade] = useState(atividadeInicial);
  const [modalidade, setModalidade] = useState("presencial");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trava.current || saude.bloqueado) return;
    const form = new FormData(event.currentTarget);
    const [tipo, id] = atividade.split(":");
    if (!id) { toast({ title: "Selecione a atividade", variant: "destructive" }); return; }
    trava.current = true;
    setSalvando(true);
    try {
      const inscricaoId = await criarInscricaoInterna({
        nome: String(form.get("nome") ?? "").trim(), cpf: String(form.get("cpf") ?? ""),
        telefone: String(form.get("telefone") ?? ""), email: String(form.get("email") ?? ""),
        nascimento: String(form.get("nascimento") ?? ""), escolaridade: String(form.get("escolaridade") ?? ""),
        modalidade, nucleo: modalidade === "presencial" ? String(form.get("nucleo") ?? "") : null,
        cursoId: tipo === "curso" ? id : null, edicaoId: tipo === "simposio" ? id : null,
      });
      await client.invalidateQueries();
      toast({ title: "Inscrição registrada para análise" });
      setAtividade(atividadeInicial); setModalidade("presencial");
      if (onCreated) onCreated(inscricaoId); else onClose();
    } catch (error) { toast({ title: "Não foi possível criar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { trava.current = false; setSalvando(false); }
  };

  return <Dialog open={open} onOpenChange={(value) => !value && !trava.current && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova inscrição pela Central</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={salvar}>
    <div><Label htmlFor="nova-insc-nome">Nome completo</Label><Input id="nova-insc-nome" name="nome" minLength={3} required /></div>
    <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="nova-insc-cpf">CPF</Label><Input id="nova-insc-cpf" name="cpf" inputMode="numeric" required /></div><div><Label htmlFor="nova-insc-nascimento">Nascimento</Label><Input id="nova-insc-nascimento" name="nascimento" type="date" required /></div></div>
    <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="nova-insc-telefone">Telefone</Label><Input id="nova-insc-telefone" name="telefone" required /></div><div><Label htmlFor="nova-insc-email">E-mail</Label><Input id="nova-insc-email" name="email" type="email" required /></div></div>
    <div><Label htmlFor="nova-insc-escolaridade">Escolaridade</Label><Input id="nova-insc-escolaridade" name="escolaridade" required /></div>
    <div><Label htmlFor="nova-insc-atividade">Atividade</Label><select id="nova-insc-atividade" className="h-10 w-full rounded-md border bg-background px-3" value={atividade} onChange={(e) => setAtividade(e.target.value)} required><option value="">Selecione</option>{cursos.filter((c) => c.ativo).map((c) => <option key={c.id} value={`curso:${c.id}`}>{c.nome}</option>)}{edicoes.filter((e) => e.ativo).map((e) => <option key={e.id} value={`simposio:${e.id}`}>{e.nome}</option>)}</select></div>
    <div><Label htmlFor="nova-insc-modalidade">Modalidade</Label><select id="nova-insc-modalidade" className="h-10 w-full rounded-md border bg-background px-3" value={modalidade} onChange={(e) => setModalidade(e.target.value)}><option value="presencial">Presencial</option><option value="correspondencia">Correspondência</option></select></div>
    {modalidade === "presencial" && <div><Label htmlFor="nova-insc-nucleo">Núcleo</Label><select id="nova-insc-nucleo" name="nucleo" className="h-10 w-full rounded-md border bg-background px-3" required><option value="">Selecione</option>{nucleos.filter((n) => n.ativo).map((n) => <option key={n.id} value={n.slug}>{n.nome}</option>)}</select></div>}
    <p className="text-xs text-muted-foreground">A inscrição fica em análise até a confirmação pela equipe. Nenhuma cobrança será emitida.</p>
    <Button type="submit" disabled={salvando || saude.bloqueado}>{salvando ? "Salvando..." : "Criar inscrição"}</Button>
  </form></DialogContent></Dialog>;
};
