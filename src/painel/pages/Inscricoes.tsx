import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Eye, ExternalLink, Search, Printer, Users, DollarSign, BookOpen, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";

/** Mapeamento de chaves de status para seus rótulos em português */
const statusLabels: Record<string, string> = {
  aguardando_pagamento: "Aguardando Pagamento",
  comprovante_enviado: "Comprovante Enviado",
  confirmada: "Confirmada",
  pagamento_nao_identificado: "Pagamento Não Identificado",
  cancelado: "Cancelada",
};

/** Mapeamento de chaves de status para suas classes CSS de cor */
const statusColors: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-800",
  comprovante_enviado: "bg-blue-100 text-blue-800",
  confirmada: "bg-green-100 text-green-800",
  pagamento_nao_identificado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-500",
};

/**
 * Componente de painel administrativo para gerenciar inscrições
 * Permite visualizar, filtrar, atualizar status e imprimir fichas de inscrição
 */
const Inscricoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchInscricoes();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/painel/login");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roles || (roles as any).role !== "admin") {
      await supabase.auth.signOut();
      navigate("/painel/login");
    }
  };

  const fetchInscricoes = async () => {
    const { data, error } = await supabase
      .from("inscricoes" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setInscricoes(data as any[]);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string, inscricao: any) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("inscricoes" as any)
        .update({ status: newStatus } as any)
        .eq("id", id);

      if (error) throw error;

      if (newStatus === "confirmada") {
        try {
          await supabase.functions.invoke("enviar-email-confirmacao", {
            body: {
              numero_inscricao: inscricao.numero_inscricao,
              nome: inscricao.nome_completo,
              email: inscricao.email,
              modalidade: inscricao.modalidade,
              nucleo: inscricao.nucleo,
            },
          });
        } catch {}
      }

      toast({ title: "Status atualizado!" });
      fetchInscricoes();
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/painel/login");
  };

  const handlePrint = (inscricao: any) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Ficha de Inscrição - ${inscricao.numero_inscricao}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
          h2 { font-size: 14px; text-align: center; color: #666; margin-bottom: 30px; font-weight: normal; }
          .field { margin-bottom: 12px; display: flex; }
          .label { font-weight: bold; min-width: 180px; }
          .value { flex: 1; }
          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Instituto Teológico Servo</h1>
        <h2>Ficha de Inscrição — ${inscricao.numero_inscricao}</h2>
        <hr>
        <div class="field"><span class="label">Nome Completo:</span><span class="value">${inscricao.nome_completo}</span></div>
        <div class="field"><span class="label">CPF:</span><span class="value">${maskCPF(inscricao.cpf)}</span></div>
        <div class="field"><span class="label">Telefone:</span><span class="value">${inscricao.telefone}</span></div>
        <div class="field"><span class="label">E-mail:</span><span class="value">${inscricao.email}</span></div>
        <div class="field"><span class="label">Data de Nascimento:</span><span class="value">${new Date(inscricao.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}</span></div>
        <div class="field"><span class="label">Escolaridade:</span><span class="value">${inscricao.escolaridade}</span></div>
        <hr>
        <div class="field"><span class="label">Modalidade:</span><span class="value">${inscricao.modalidade === "correspondencia" ? "Por Correspondência" : "Presencial"}</span></div>
        ${inscricao.nucleo ? `<div class="field"><span class="label">Núcleo:</span><span class="value">${inscricao.nucleo}</span></div>` : ""}
        <div class="field"><span class="label">Status:</span><span class="value">${statusLabels[inscricao.status] || inscricao.status}</span></div>
        <div class="field"><span class="label">Data da Inscrição:</span><span class="value">${new Date(inscricao.created_at).toLocaleDateString("pt-BR")}</span></div>
        <div class="footer">Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // Filter + search
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

  // Dashboard stats
  const total = inscricoes.length;
  const confirmadas = inscricoes.filter((i) => i.status === "confirmada").length;
  const receitaEstimada = confirmadas * 190;
  const porModalidade = {
    presencial: inscricoes.filter((i) => i.modalidade === "presencial" && i.status !== "cancelado").length,
    correspondencia: inscricoes.filter((i) => i.modalidade === "correspondencia" && i.status !== "cancelado").length,
  };
  const nucleosCount: Record<string, number> = {};
  inscricoes.forEach((i) => {
    if (i.nucleo && i.status !== "cancelado") {
      nucleosCount[i.nucleo] = (nucleosCount[i.nucleo] || 0) + 1;
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-primary py-10 text-primary-foreground">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Painel Administrativo</h1>
          <Button variant="outline" onClick={handleLogout} className="border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container space-y-8">
          {/* Dashboard */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Visão Geral</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Inscrições</p>
                    <p className="text-2xl font-bold text-foreground">{total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2.5">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita (confirmadas)</p>
                    <p className="text-2xl font-bold text-foreground">
                      R$ {receitaEstimada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2.5">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modalidade</p>
                    <p className="text-sm font-medium text-foreground">
                      {porModalidade.presencial} presencial · {porModalidade.correspondencia} corresp.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-2.5">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Núcleos ativos</p>
                    <p className="text-sm font-medium text-foreground">
                      {Object.keys(nucleosCount).length} núcleos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = inscricoes.filter((i) => i.status === key).length;
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${filterStatus === key ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setFilterStatus(filterStatus === key ? "todos" : key)}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, nº, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[220px]">
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

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Inscrição</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma inscrição encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((i) => (
                        <TableRow key={i.id} className={i.status === "cancelado" ? "opacity-60" : ""}>
                          <TableCell className="font-mono text-sm">{i.numero_inscricao}</TableCell>
                          <TableCell>{i.nome_completo}</TableCell>
                          <TableCell className="capitalize">{i.modalidade === "correspondencia" ? "Correspondência" : "Presencial"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[i.status]}>
                              {statusLabels[i.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{new Date(i.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
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

          <p className="text-sm text-muted-foreground text-right">
            Exibindo {filtered.length} de {total} inscrições
          </p>
        </div>
      </section>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Inscrição {selected?.numero_inscricao}</span>
              {selected && (
                <Button variant="outline" size="sm" onClick={() => handlePrint(selected)}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Nome:</strong> {selected.nome_completo}</div>
                <div><strong>CPF:</strong> {maskCPF(selected.cpf)}</div>
                <div><strong>Telefone:</strong> {selected.telefone}</div>
                <div><strong>E-mail:</strong> {selected.email}</div>
                <div><strong>Nascimento:</strong> {new Date(selected.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                <div><strong>Escolaridade:</strong> {selected.escolaridade}</div>
                <div><strong>Modalidade:</strong> {selected.modalidade === "correspondencia" ? "Correspondência" : "Presencial"}</div>
                {selected.nucleo && <div><strong>Núcleo:</strong> {selected.nucleo}</div>}
              </div>

              {selected.comprovante_url && (
                <div>
                  <strong className="text-sm">Comprovante:</strong>
                  <a href={selected.comprovante_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-sm text-primary hover:underline">
                    Ver comprovante <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="space-y-2 border-t pt-4">
                <strong className="text-sm">Alterar Status:</strong>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selected.status === key ? "default" : "outline"}
                      size="sm"
                      disabled={selected.status === key || updatingStatus}
                      onClick={() => handleStatusChange(selected.id, key, selected)}
                    >
                      {updatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Inscricoes;
