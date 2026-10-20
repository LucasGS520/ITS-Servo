import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Textarea } from "@/common/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/common/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/common/ui/command";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useToast } from "@/common/hooks/use-toast";
import { cn } from "@/common/lib/utils";
import { UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import {
  useAlunos,
  useCategorias,
  useSalvarLancamento,
  type Lancamento,
  type LancamentoValues,
} from "@/modules/financeiro/api";
import { competenciaParaMes, mesParaCompetencia } from "@/modules/financeiro/model/agregados";
import { getErrorMessage } from "@/common/lib/errors";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";

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
  /** Presente = legado somente leitura; ausente = nova movimentação. */
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
  const { data: categorias = [] } = useCategorias();
  const { data: alunos = [] } = useAlunos();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const salvarLancamento = useSalvarLancamento();

  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [unidade, setUnidade] = useState<string>("geral");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [valor, setValor] = useState<string>("");
  const [data, setData] = useState<string>(hoje());
  const [competencia, setCompetencia] = useState<string>(hoje().slice(0, 7));
  const [descricao, setDescricao] = useState<string>("");
  const [atividade, setAtividade] = useState<string>("geral");
  const [alunoOpen, setAlunoOpen] = useState(false);

  // (Re)inicializa ao abrir — novo ou edição
  useEffect(() => {
    if (!open) return;
    if (lancamento) {
      setTipo(lancamento.tipo as "entrada" | "saida");
      setUnidade(lancamento.unidade ?? "geral");
      setCategoriaId(lancamento.categoria_id);
      setAlunoId(lancamento.aluno_id);
      setValor(String(lancamento.valor));
      setData(lancamento.data ?? "");
      setCompetencia(competenciaParaMes(lancamento.competencia));
      setDescricao(lancamento.descricao ?? "");
      setAtividade(lancamento.curso_id ? `curso:${lancamento.curso_id}` : lancamento.edicao_simposio_id ? `simposio:${lancamento.edicao_simposio_id}` : "geral");
    } else {
      setTipo("entrada");
      setUnidade("geral");
      setCategoriaId("");
      setAlunoId(null);
      setValor("");
      setData(hoje());
      setCompetencia(hoje().slice(0, 7));
      setDescricao("");
      setAtividade("geral");
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
    const categoriaEscolhida = categorias.find((c) => c.id === categoriaId);
    if (tipo === "entrada" && (alunoId || ["Curso Teológico", "Capacitação de Obreiros"].includes(categoriaEscolhida?.nome ?? ""))) {
      toast({ title: "Use Recebimentos para pagamentos de alunos", variant: "destructive" });
      return;
    }
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

    try {
      const payload: LancamentoValues = {
        tipo: parsed.data.tipo,
        unidade: parsed.data.unidade,
        categoria_id: parsed.data.categoria_id,
        aluno_id: parsed.data.aluno_id,
        valor: parsed.data.valor,
        data: parsed.data.data,
        competencia: mesParaCompetencia(parsed.data.competencia),
        descricao: parsed.data.descricao,
        curso_id: atividade.startsWith("curso:") ? atividade.slice(6) : null,
        edicao_simposio_id: atividade.startsWith("simposio:") ? atividade.slice(9) : null,
      };
      await salvarLancamento.mutateAsync({ id: lancamento?.id, values: payload });
      toast({ title: lancamento ? "Lançamento atualizado!" : "Lançamento registrado!" });
      onOpenChange(false);
    } catch (error: unknown) {
      toast({ title: "Erro ao salvar", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lancamento ? "Registro financeiro" : "Nova movimentação"}</DialogTitle>
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

          <div className="space-y-2 sm:col-span-2"><Label htmlFor="lancamento-atividade">Atividade vinculada</Label><select id="lancamento-atividade" className="h-10 w-full rounded-md border bg-background px-3" value={atividade} onChange={(event) => setAtividade(event.target.value)}><option value="geral">Geral do ITS</option>{cursos.map((curso) => <option key={curso.id} value={`curso:${curso.id}`}>{curso.nome}</option>)}{edicoes.map((edicao) => <option key={edicao.id} value={`simposio:${edicao.id}`}>{edicao.nome}</option>)}</select></div>

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

          <div className="space-y-2 sm:col-span-2">
            <Label>Referente / observação (opcional)</Label>
            <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvarLancamento.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={salvarLancamento.isPending}>
            {salvarLancamento.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {lancamento ? "Registro imutável" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoDialog;
