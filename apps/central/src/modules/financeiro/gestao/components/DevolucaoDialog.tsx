import { useOperationalStatus } from "@/common/hooks/useOperationalStatus";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useCategorias, type Lancamento } from "@/modules/financeiro/api";
import { useDevolverMovimentacao } from "@/modules/financeiro/api/movimentacoes";

const hoje = () => new Date().toLocaleDateString("en-CA");
const numero = (texto: string) => Number(texto.trim().includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);

export const DevolucaoDialog = ({ entrada, disponivel, onClose }: { entrada: Lancamento | null; disponivel: number; onClose: () => void }) => {
  const inicializado = useRef<string | null>(null);
  const enviando = useRef(false);
  const operacaoId = useRef(crypto.randomUUID());
  const { toast } = useToast();
  const devolver = useDevolverMovimentacao();
  const { data: categorias = [] } = useCategorias();
  const saude = useOperationalStatus(["categorias_financeiras", "lancamentos_financeiros"]);
  const categoriaPadraoId = categorias.find((item) => item.nome === "Devolução Matrícula/Livros" && item.tipo === "saida" && item.ativo)?.id ?? "";
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje);
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  useEffect(() => {
    if (!entrada) { inicializado.current = null; return; }
    if (inicializado.current === entrada.id) return;
    inicializado.current = entrada.id; operacaoId.current = crypto.randomUUID();
    setValor(String(disponivel)); setData(hoje()); setDescricao("");
    setCategoriaId(categoriaPadraoId);
  }, [entrada, disponivel, categoriaPadraoId]);
  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!entrada || saude.bloqueado || enviando.current) return;
    const quantia = numero(valor);
    if (!Number.isFinite(quantia) || quantia <= 0 || quantia > disponivel) {
      toast({ title: "Valor de devolução inválido", variant: "destructive" }); return;
    }
    enviando.current = true;
    try {
      await devolver.mutateAsync({ operacaoId: operacaoId.current, id: entrada.id, valor: quantia, data, categoriaId, descricao: descricao.trim() || null });
      toast({ title: "Devolução registrada no caixa" }); onClose();
    } catch (error) { toast({ title: "Não foi possível devolver", description: getErrorMessage(error), variant: "destructive" }); }
    finally { enviando.current = false; }
  };
  return <Dialog open={Boolean(entrada)} onOpenChange={(open) => !open && !enviando.current && onClose()}><DialogContent><DialogHeader><DialogTitle>Registrar devolução real</DialogTitle></DialogHeader>
    <form className="space-y-3" onSubmit={salvar}>
      {saude.bloqueado && <p role="status">{saude.erro ? "Falha ao atualizar os dados. Aguarde a recuperação antes de salvar." : "Carregando dados necessários..."}</p>}
      <p className="text-sm text-muted-foreground">A entrada original permanece no caixa. Disponível: {formatBRL(disponivel)}.</p>
      <div><Label htmlFor="dev-valor">Valor</Label><Input id="dev-valor" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" required /></div>
      <div><Label htmlFor="dev-data">Data real</Label><Input id="dev-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required /></div>
      <div><Label htmlFor="dev-categoria">Categoria de saída</Label><select id="dev-categoria" className="h-10 w-full rounded-md border bg-background px-3" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required><option value="">Selecione</option>{categorias.filter((item) => item.tipo === "saida" && item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div>
      <div><Label htmlFor="dev-observacao">Observação</Label><Input id="dev-observacao" value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={devolver.isPending} onClick={() => { if (!enviando.current) onClose(); }}>Cancelar</Button><Button disabled={devolver.isPending || saude.bloqueado}>{devolver.isPending ? "Registrando..." : "Registrar saída"}</Button></div>
    </form></DialogContent></Dialog>;
};
