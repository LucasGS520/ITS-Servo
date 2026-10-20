import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { adicionarDoacaoSimposio, ITENS_SIMPOSIO_KEY, useItensSimposio } from "@/modules/atividades/api/itensSimposio";

export const ItensSimposio = ({ edicaoId }: { edicaoId: string }) => {
  const client = useQueryClient();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const { data: itens = [] } = useItensSimposio(edicaoId);
  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSalvando(true);
    try {
      await adicionarDoacaoSimposio(edicaoId, String(form.get("descricao") ?? "").trim(), String(form.get("doador") ?? "").trim() || null);
      await client.invalidateQueries({ queryKey: [...ITENS_SIMPOSIO_KEY, edicaoId] });
      event.currentTarget.reset();
      toast({ title: "Doação registrada no inventário" });
    } catch (error) { toast({ title: "Não foi possível registrar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setSalvando(false); }
  };
  return <Card><CardHeader><CardTitle className="text-base">Inventário e detalhes da planilha</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Bens e serviços não entram no caixa. Receitas e despesas do detalhe de 2026 aguardam conciliação com o relatório anual.</p>
    {itens.map((item) => <div key={item.id} className="rounded-md border p-2 text-sm"><strong>{item.descricao}</strong><p className="text-muted-foreground">{item.tipo === "doacao_bem_servico" ? "Doação de bem/serviço" : item.tipo === "receita_detalhe" ? "Receita da planilha do evento" : "Despesa da planilha do evento"}{item.doador ? ` · ${item.doador}` : ""}{item.valor != null ? ` · R$ ${Number(item.valor).toFixed(2)}` : ""}</p></div>)}
    <form className="grid gap-2 border-t pt-3 sm:grid-cols-2" onSubmit={salvar}><div><Label htmlFor={`item-${edicaoId}`}>Bem ou serviço</Label><Input id={`item-${edicaoId}`} name="descricao" required /></div><div><Label htmlFor={`doador-${edicaoId}`}>Doador (opcional)</Label><Input id={`doador-${edicaoId}`} name="doador" /></div><Button disabled={salvando} className="sm:col-span-2">Adicionar ao inventário</Button></form>
  </CardContent></Card>;
};
