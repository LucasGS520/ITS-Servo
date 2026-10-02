import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Badge } from "@/common/ui/badge";
import { Loader2 } from "lucide-react";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";

const moeda = (valor: number | null) => valor == null ? "Valor a configurar" : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const CursosPage = () => {
  const { data: cursos = [], isLoading } = useCursos();
  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Cursos</h1><p className="mt-1 text-sm text-muted-foreground">Curso Teológico e Capacitação de Obreiros, cada qual com sua matrícula e valor.</p></div><div className="grid gap-4 md:grid-cols-2">{cursos.map((curso) => <Card key={curso.id}><CardHeader><CardTitle className="flex items-center justify-between text-lg">{curso.nome}<Badge variant={curso.ativo ? "default" : "outline"}>{curso.ativo ? "Ativo" : "Inativo"}</Badge></CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Valor: <strong>{moeda(curso.valor)}</strong></p><p className="text-muted-foreground">{curso.publico ? "Disponível no Site" : "Uso interno"}</p></CardContent></Card>)}</div></div>;
};

export const SimposioPage = () => {
  const { data: edicoes = [], isLoading } = useEdicoesSimposio();
  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Simpósio</h1><p className="mt-1 text-sm text-muted-foreground">Edições, participantes e resultado financeiro próprio.</p></div><Card><CardContent className="space-y-3 p-6">{edicoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma edição cadastrada.</p> : edicoes.map((edicao) => <div key={edicao.id} className="flex flex-col gap-1 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{edicao.nome}</p><p className="text-sm text-muted-foreground">{edicao.inicio ?? "Data a definir"}{edicao.fim ? ` até ${edicao.fim}` : ""}</p></div><div className="flex items-center gap-2"><span className="text-sm font-medium">{moeda(edicao.valor)}</span><Badge variant={edicao.publico ? "default" : "outline"}>{edicao.publico ? "Publicado" : "Interno"}</Badge></div></div>)}</CardContent></Card></div>;
};
