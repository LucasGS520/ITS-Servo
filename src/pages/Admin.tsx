import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, LogOut, Eye, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  aguardando_pagamento: "Aguardando Pagamento",
  comprovante_enviado: "Comprovante Enviado",
  confirmada: "Confirmada",
  pagamento_nao_identificado: "Pagamento Não Identificado",
};

const statusColors: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-800",
  comprovante_enviado: "bg-blue-100 text-blue-800",
  confirmada: "bg-green-100 text-green-800",
  pagamento_nao_identificado: "bg-red-100 text-red-800",
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [selected, setSelected] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchInscricoes();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roles || (roles as any).role !== "admin") {
      await supabase.auth.signOut();
      navigate("/admin/login");
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
    navigate("/admin/login");
  };

  const filtered = filterStatus === "todos"
    ? inscricoes
    : inscricoes.filter((i) => i.status === filterStatus);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-10 text-primary-foreground">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Painel Administrativo</h1>
          <Button variant="outline" onClick={handleLogout} className="border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container">
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = inscricoes.filter((i) => i.status === key).length;
              return (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(key)}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center gap-4">
            <Label className="text-sm font-medium">Filtrar:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
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
                        <TableRow key={i.id}>
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
                            <Button variant="ghost" size="sm" onClick={() => setSelected(i)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inscrição {selected?.numero_inscricao}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Nome:</strong> {selected.nome_completo}</div>
                <div><strong>CPF:</strong> {selected.cpf}</div>
                <div><strong>Telefone:</strong> {selected.telefone}</div>
                <div><strong>E-mail:</strong> {selected.email}</div>
                <div><strong>Nascimento:</strong> {new Date(selected.data_nascimento).toLocaleDateString("pt-BR")}</div>
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
    </Layout>
  );
};

export default Admin;
