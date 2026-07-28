import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UNIDADES_FINANCEIRO } from "@/shared/constants/unidades";
import { LANCAMENTOS_KEY, useAlunos, useCategorias, type Lancamento } from "@/painel/hooks/useFinanceiro";
import { competenciaParaMes, mesParaCompetencia } from "./agregados";

const schema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  unidade: z.string().nullable(),
  categoria_id: z.string().uuid("Selecione a categoria."),
  aluno_id: z.string().uuid().nullable(),
  valor: z.number().positive("Informe um valor maior que zero."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, "Informe o mês de referência."),
  descricao: z.string().max(300, "Descrição muito longa.").nullable(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = novo lançamento */
  lancamento?: Lancamento | null;
}

const hoje = () => new Date().toISOString().slice(0, 10);

/** Aceita "150", "150.50", "150,50" e "1.234,56". */
const parseValor = (s: string) => {
  const t = s.trim();
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
};

const LancamentoDialog = ({ open, onOpenChange, lancamento }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categorias = [] } = useCategorias();
  const { data: alunos = [] } = useAlunos();

  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [unidade, setUnidade] = useState<string>("geral");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [valor, setValor] = useState<string>("");
  const [data, setData] = useState<string>(hoje());
  const [competencia, setCompetencia] = useState<string>(hoje().slice(0, 7));
  const [descricao, setDescricao] = useState<string>("");
  const [alunoOpen, setAlunoOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // (Re)inicializa ao abrir — novo ou edição
  useEffect(() => {
    if (!open) return;
    if (lancamento) {
      setTipo(lancamento.tipo as "entrada" | "saida");
      setUnidade(lancamento.unidade ?? "geral");
      setCategoriaId(lancamento.categoria_id);
      setAlunoId(lancamento.aluno_id);
      setValor(String(lancamento.valor));
      setData(lancamento.data);
      setCompetencia(competenciaParaMes(lancamento.competencia));
      setDescricao(lancamento.descricao ?? "");
    } else {
      setTipo("entrada");
      setUnidade("geral");
      setCategoriaId("");
      setAlunoId(null);
      setValor("");
      setData(hoje());
      setCompetencia(hoje().slice(0, 7));
      setDescricao("");
    }
  }, [open, lancamento]);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo && (c.ativo || c.id === categoriaId)),
    [categorias, tipo, categoriaId],
  );

  const alunosDaUnidade = useMemo(
    () =>
      alunos.filter(
        (a) => (a.ativo || a.id === alunoId) && (unidade === "geral" || a.unidade === unidade),
      ),
    [alunos, unidade, alunoId],
  );

  const alunoSelecionado = alunos.find((a) => a.id === alunoId) ?? null;

  const handleSave = async () => {
    const parsed = schema.safeParse({
      tipo,
      unidade: unidade === "geral" ? null : unidade,
      categoria_id: categoriaId,
      aluno_id: tipo === "entrada" ? alunoId : null,
      valor: parseValor(valor),
      data,
      competencia,
      descricao: descricao.trim() || null,
    });
    if (!parsed.success) {
      toast({
        title: "Verifique o formulário",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...parsed.data, competencia: mesParaCompetencia(parsed.data.competencia) };
      const { error } = lancamento
        ? await supabase.from("lancamentos_financeiros").update(payload).eq("id", lancamento.id)
        : await supabase.from("lancamentos_financeiros").insert(payload);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: LANCAMENTOS_KEY });
      toast({ title: lancamento ? "Lançamento atualizado!" : "Lançamento registrado!" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lancamento ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as "entrada" | "saida");
                setCategoriaId("");
                if (v === "saida") setAlunoId(null);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select
              value={unidade}
              onValueChange={(v) => {
                setUnidade(v);
                setAlunoId(null);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral (institucional)</SelectItem>
                {UNIDADES_FINANCEIRO.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === "entrada" && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Aluno (opcional)</Label>
              <div className="flex gap-2">
                <Popover open={alunoOpen} onOpenChange={setAlunoOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                      {alunoSelecionado ? alunoSelecionado.nome : "Buscar aluno…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Nome do aluno…" />
                      <CommandList>
                        <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                        <CommandGroup>
                          {alunosDaUnidade.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={a.nome}
                              onSelect={() => {
                                setAlunoId(a.id);
                                if (unidade === "geral") setUnidade(a.unidade);
                                setAlunoOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", alunoId === a.id ? "opacity-100" : "opacity-0")} />
                              {a.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {alunoId && (
                  <Button variant="ghost" size="icon" onClick={() => setAlunoId(null)} title="Limpar aluno">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            {/* type=text: input number rejeita vírgula decimal em locales estrangeiros */}
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label>Data do movimento</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                if (e.target.value) setCompetencia(e.target.value.slice(0, 7));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Mês de referência</Label>
            <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
            <p className="text-xs text-muted-foreground">Mês em que o lançamento aparece nos relatórios.</p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição (opcional)</Label>
            <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {lancamento ? "Salvar alterações" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoDialog;
