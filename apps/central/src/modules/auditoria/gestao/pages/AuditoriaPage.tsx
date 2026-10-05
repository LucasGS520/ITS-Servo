import { useMemo, useState } from "react";
import { Card, CardContent } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { Loader2, Search } from "lucide-react";
import { useAuditoria } from "@/modules/auditoria/api/useAuditoria";

const AuditoriaPage = () => {
  const { data = [], isLoading, error } = useAuditoria();
  const [busca, setBusca] = useState("");
  const linhas = useMemo(() => data.filter((item) => JSON.stringify(item).toLowerCase().includes(busca.trim().toLowerCase())), [busca, data]);
  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (error) return <div className="container py-8 text-destructive">Não foi possível carregar a auditoria.</div>;
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Auditoria</h1><p className="mt-1 text-sm text-muted-foreground">Histórico imutável das decisões operacionais e financeiras.</p></div><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar entidade, ação, motivo ou identificador" /></div><Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Motivo</TableHead><TableHead>Identificador</TableHead></TableRow></TableHeader><TableBody>{linhas.map((item) => <TableRow key={item.id}><TableCell className="whitespace-nowrap">{new Date(item.created_at).toLocaleString("pt-BR")}</TableCell><TableCell>{item.entidade}</TableCell><TableCell>{item.acao}</TableCell><TableCell>{item.motivo ?? "—"}</TableCell><TableCell className="font-mono text-xs">{item.entidade_id}</TableCell></TableRow>)}{linhas.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Nenhum evento encontrado.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card></div>;
};

export default AuditoriaPage;
