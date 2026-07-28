import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, ExternalLink, Search, Printer, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";
import { useInscricoes, INSCRICOES_KEY } from "@/painel/hooks/useInscricoes";

const statusLabels: Record<string, string> = {
  aguardando_pagamento: "Aguardando Pagamento",
  comprovante_enviado: "Comprovante Enviado",
  confirmada: "Confirmada",
  pagamento_nao_identificado: "Pag. Não Identificado",
  cancelado: "Cancelada",
};

const statusColors: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-800 border-yellow-200",
  comprovante_enviado: "bg-blue-100 text-blue-800 border-blue-200",
  confirmada: "bg-green-100 text-green-800 border-green-200",
  pagamento_nao_identificado: "bg-red-100 text-red-800 border-red-200",
  cancelado: "bg-gray-100 text-gray-500 border-gray-200",
};

const Inscricoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: inscricoes = [], isLoading } = useInscricoes();

  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [openingComprovante, setOpeningComprovante] = useState(false);

  const handleOpenComprovante = async (comprovanteUrl: string) => {
    // Linhas antigas guardam URL pública completa; as novas, um path no bucket privado.
    if (/^https?:\/\//.test(comprovanteUrl)) {
      window.open(comprovanteUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setOpeningComprovante(true);
    try {
      const { data, error } = await supabase.storage
        .from("comprovantes")
        .createSignedUrl(comprovanteUrl, 600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast({ title: "Erro ao abrir comprovante", description: err.message, variant: "destructive" });
    } finally {
      setOpeningComprovante(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, inscricao: any) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("inscricoes")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;

      let emailFalhou = false;
      if (newStatus === "confirmada") {
        try {
          const { error: fnError } = await supabase.functions.invoke("enviar-email-confirmacao", {
            body: {
              numero_inscricao: inscricao.numero_inscricao,
              nome: inscricao.nome_completo,
              email: inscricao.email,
              modalidade: inscricao.modalidade,
              nucleo: inscricao.nucleo,
            },
          });
          if (fnError) throw fnError;
        } catch {
          emailFalhou = true;
        }
      }

      await queryClient.invalidateQueries({ queryKey: INSCRICOES_KEY });
      if (emailFalhou) {
        toast({
          title: "Status atualizado, mas o e-mail de confirmação NÃO foi enviado",
          description: "Avise o inscrito por outro canal ou tente confirmar novamente.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Status atualizado!" });
      }
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = (inscricao: any) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const esc = (s: string) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    win.document.write(`
      <html><head>
        <title>Ficha - ${esc(inscricao.numero_inscricao)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
          h2 { font-size: 14px; text-align: center; color: #666; margin-bottom: 30px; font-weight: normal; }
          .field { margin-bottom: 12px; display: flex; }
          .label { font-weight: bold; min-width: 180px; }
          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head><body>
        <h1>Instituto Teológico Servo</h1>
        <h2>Ficha de Inscrição — ${esc(inscricao.numero_inscricao)}</h2>
        <hr>
        <div class="field"><span class="label">Nome Completo:</span><span>${esc(inscricao.nome_completo)}</span></div>
        <div class="field"><span class="label">CPF:</span><span>${esc(maskCPF(inscricao.cpf))}</span></div>
        <div class="field"><span class="label">Telefone:</span><span>${esc(inscricao.telefone)}</span></div>
        <div class="field"><span class="label">E-mail:</span><span>${esc(inscricao.email)}</span></div>
        <div class="field"><span class="label">Nascimento:</span><span>${esc(new Date(inscricao.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR"))}</span></div>
        <div class="field"><span class="label">Escolaridade:</span><span>${esc(inscricao.escolaridade)}</span></div>
        <hr>
        <div class="field"><span class="label">Modalidade:</span><span>${esc(inscricao.modalidade === "correspondencia" ? "Por Correspondência" : "Presencial")}</span></div>
        ${inscricao.nucleo ? `<div class="field"><span class="label">Núcleo:</span><span>${esc(inscricao.nucleo)}</span></div>` : ""}
        <div class="field"><span class="label">Status:</span><span>${esc(statusLabels[inscricao.status] ?? inscricao.status)}</span></div>
        <div class="field"><span class="label">Data da Inscrição:</span><span>${esc(new Date(inscricao.created_at).toLocaleDateString("pt-BR"))}</span></div>
        <div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const filtered = inscricoes.filter((i) => {
    const matchStatus = filterStatus === "todos" || i.status === filterStatus;
    if (!searchTerm.trim()) return matchStatus;
    const term = searchTerm.toLowerCase();
    return (
      matchStatus &&
      (i.nome_completo?.toLowerCase().includes(term) ||
        i.numero_inscricao?.toLowerCase().includes(term) ||
        i.cpf?.includes(term.replace(/\D/g, "")) ||
        i.email?.toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inscrições</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie e confirme as inscrições recebidas</p>
      </div>

      {/* Filtros rápidos por status */}
      <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-sm ${filterStatus === "todos" ? "ring-2 ring-primary bg-primary/5" : ""}`}
          onClick={() => setFilterStatus("todos")}
        >
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Todos</p>
            <p className="text-xl font-bold text-foreground">{inscricoes.length}</p>
          </CardContent>
        </Card>
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = inscricoes.filter((i) => i.status === key).length;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-sm ${filterStatus === key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilterStatus(filterStatus === key ? "todos" : key)}
            >
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                <p className="text-xl font-bold text-foreground">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Busca + filtro dropdown */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, nº inscrição, CPF ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Inscrição</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Núcleo / Modalidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhuma inscrição encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((i) => (
                    <TableRow key={i.id} className={i.status === "cancelado" ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-sm">{i.numero_inscricao}</TableCell>
                      <TableCell className="font-medium">{i.nome_completo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {i.modalidade === "correspondencia"
                          ? "Correspondência"
                          : i.nucleo ?? "Presencial"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[i.status]}>
                          {statusLabels[i.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Confirmação inline — aparece só quando há comprovante enviado */}
                          {i.status === "comprovante_enviado" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-700 hover:bg-green-50 hover:text-green-800"
                              title="Confirmar inscrição"
                              onClick={() => handleStatusChange(i.id, "confirmada", i)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setSelected(i)} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(i)} title="Imprimir ficha">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-right text-sm text-muted-foreground">
        {filtered.length} de {inscricoes.length} inscrições
      </p>

      {/* Dialog de detalhe */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{selected?.numero_inscricao}</span>
              {selected && (
                <Button variant="outline" size="sm" onClick={() => handlePrint(selected)}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* Dados pessoais */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome</span><p className="font-medium">{selected.nome_completo}</p></div>
                <div><span className="text-muted-foreground">CPF</span><p className="font-medium">{maskCPF(selected.cpf)}</p></div>
                <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{selected.telefone}</p></div>
                <div><span className="text-muted-foreground">E-mail</span><p className="font-medium break-all">{selected.email}</p></div>
                <div><span className="text-muted-foreground">Nascimento</span><p className="font-medium">{new Date(selected.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Escolaridade</span><p className="font-medium">{selected.escolaridade}</p></div>
                <div><span className="text-muted-foreground">Modalidade</span><p className="font-medium">{selected.modalidade === "correspondencia" ? "Correspondência" : "Presencial"}</p></div>
                {selected.nucleo && <div><span className="text-muted-foreground">Núcleo</span><p className="font-medium">{selected.nucleo}</p></div>}
              </div>

              {/* Comprovante */}
              {selected.comprovante_url && (
                <div className="rounded-lg border bg-muted/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Comprovante enviado</p>
                  <button
                    type="button"
                    disabled={openingComprovante}
                    onClick={() => handleOpenComprovante(selected.comprovante_url)}
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {openingComprovante ? (
                      <>Abrindo… <Loader2 className="ml-1 h-3 w-3 animate-spin" /></>
                    ) : (
                      <>Abrir comprovante <ExternalLink className="ml-1 h-3 w-3" /></>
                    )}
                  </button>
                </div>
              )}

              {/* Alterar status */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alterar status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selected.status === key ? "default" : "outline"}
                      size="sm"
                      disabled={selected.status === key || updatingStatus}
                      onClick={() => handleStatusChange(selected.id, key, selected)}
                    >
                      {updatingStatus && selected.status !== key ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inscricoes;
