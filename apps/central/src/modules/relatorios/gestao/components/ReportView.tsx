import { Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { useToast } from "@/common/hooks/use-toast";
import { imprimirRelatorio, type DocumentoRelatorio } from "../lib/imprimirRelatorio";

export default function ReportView({ documento, pronto }: { documento: DocumentoRelatorio; pronto: boolean }) {
  const { toast } = useToast();
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Prévia · {documento.titulo}</h2><p className="text-sm text-muted-foreground">{documento.periodo} · {pronto ? "Dados atualizados" : "Atualizando dados..."}</p></div><Button disabled={!pronto || !documento.endereco} onClick={() => { if (!imprimirRelatorio(documento)) toast({ title: "O navegador bloqueou a janela de impressão", variant: "destructive" }); }}><Printer className="mr-2 h-4 w-4" />Imprimir ou salvar em PDF</Button></div>
    {!documento.endereco && <p className="text-sm text-destructive">Configure o endereço {documento.enderecoEm === "nucleo" ? <>do núcleo em <Link className="underline" to="/painel/instituto?secao=nucleos">Instituto → Núcleos</Link></> : <>da Sede em <Link className="underline" to="/painel/instituto?secao=relatorios">Instituto → Dados para relatórios</Link></>} antes de imprimir.</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{documento.resumo.map(item => <Card key={item.rotulo}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item.rotulo}</p><strong className="text-lg">{item.valor}</strong></CardContent></Card>)}</div>
    <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{documento.colunas.map(c => <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{c}</th>)}</tr></thead><tbody>{documento.linhas.map((linha, i) => <tr key={i} className="border-t">{linha.map((celula, j) => <td key={j} className="px-3 py-2">{celula}</td>)}</tr>)}{documento.linhas.length === 0 && <tr><td colSpan={documento.colunas.length} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>}</tbody></table></CardContent></Card>
    {!!documento.observacoes?.length && <aside aria-label="Avisos internos da prévia" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Conferência interna</strong><p className="mb-2 text-xs">Estas informações ajudam na conferência e não aparecem no PDF.</p>{documento.observacoes.map((nota, i) => <p key={i}>{nota}</p>)}</aside>}
  </section>;
}
