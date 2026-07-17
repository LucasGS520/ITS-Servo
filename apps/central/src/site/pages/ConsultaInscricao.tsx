/**
 * Consulta de Inscrição (autosserviço) — SÓ com token de posse.
 *
 * A antiga busca aberta por número/CPF foi removida: era o vetor de enumeração
 * de PII (P1). Agora a leitura passa pela RPC `buscar_inscricao(numero, token)`
 * e o cancelamento por `cancelar_inscricao(numero, token)`. O token vem do link
 * mágico enviado por e-mail (ou é colado manualmente). Ver docs/arquitetura.md §5.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, Loader2, FileText, Clock, CheckCircle, AlertCircle, XCircle, Copy, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buscarInscricao, cancelarInscricao, type InscricaoResumo } from "@its-servo/supabase";
import { useToast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";

const statusLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", icon: <Clock className="h-4 w-4" />, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  comprovante_enviado: { label: "Comprovante Enviado", icon: <FileText className="h-4 w-4" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  confirmada: { label: "Matrícula Confirmada", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-600 bg-green-50 border-green-200" },
  pagamento_nao_identificado: { label: "Pagamento Não Identificado", icon: <AlertCircle className="h-4 w-4" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
  cancelado: { label: "Cancelada", icon: <XCircle className="h-4 w-4" />, color: "text-red-600 bg-red-50 border-red-200" },
};
const getStatus = (s: string) => statusLabels[s] ?? statusLabels.aguardando_pagamento;

const ConsultaInscricao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [numero, setNumero] = useState(searchParams.get("numero") ?? "");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<InscricaoResumo | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const buscar = useCallback(async (n: string, t: string) => {
    if (!n.trim() || !t.trim()) {
      toast({ title: "Informe o número e o token", description: "O token está no e-mail de confirmação da inscrição.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const insc = await buscarInscricao(supabase, n.trim().toUpperCase(), t.trim());
      if (!insc) {
        toast({ title: "Inscrição não encontrada", description: "Verifique o número e o token.", variant: "destructive" });
      } else {
        setResultado(insc);
      }
    } catch (e: any) {
      toast({ title: "Erro na consulta", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  // Se veio pelo link mágico (numero+token na URL), busca automaticamente.
  useEffect(() => {
    const n = searchParams.get("numero");
    const t = searchParams.get("token");
    if (n && t) buscar(n, t);
  }, [searchParams, buscar]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const ok = await cancelarInscricao(supabase, numero.trim().toUpperCase(), token.trim());
      if (ok) {
        setResultado((r) => (r ? { ...r, status: "cancelado" } : r));
        toast({ title: "Inscrição cancelada com sucesso." });
      } else {
        toast({ title: "Não foi possível cancelar", description: "A inscrição pode não estar mais pendente.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" });
    }
    setCancelling(false);
    setCancelOpen(false);
  };

  const copiar = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "Copiado!" }); };

  return (
    <>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Consultar Inscrição</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Acompanhe o status da sua inscrição com o número e o token enviados no seu e-mail.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" /> Buscar Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Número da inscrição</Label>
                  <Input placeholder="Ex: ITS2026-0001" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Token de acesso</Label>
                  <Input placeholder="Cole aqui o token do seu e-mail" value={token} onChange={(e) => setToken(e.target.value)} />
                  <p className="text-xs text-muted-foreground">O token está no link/e-mail de confirmação da inscrição — é o acesso exclusivo à sua inscrição.</p>
                </div>
                <Button onClick={() => buscar(numero, token)} disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Buscar
                </Button>
              </CardContent>
            </Card>

            {resultado && (() => {
              const st = getStatus(resultado.status);
              return (
                <Card className="overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{resultado.nome_completo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-muted-foreground font-mono">{resultado.numero_inscricao}</p>
                          <button onClick={() => copiar(resultado.numero_inscricao)} className="text-muted-foreground hover:text-foreground" title="Copiar número">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${st.color}`}>
                        {st.icon}{st.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
                      <div><span className="text-muted-foreground">Modalidade:</span> <span className="font-medium capitalize">{resultado.modalidade === "correspondencia" ? "Correspondência" : "Presencial"}</span></div>
                      <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date(resultado.created_at).toLocaleDateString("pt-BR")}</span></div>
                      <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{maskCPF(resultado.cpf)}</span></div>
                      <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{resultado.telefone}</span></div>
                      <div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{resultado.email}</span></div>
                      {resultado.nucleo && <div><span className="text-muted-foreground">Núcleo:</span> <span className="font-medium">{resultado.nucleo}</span></div>}
                    </div>

                    {resultado.status === "aguardando_pagamento" && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button onClick={() => navigate(`/inscricao/pagamento/${resultado.numero_inscricao}?token=${encodeURIComponent(token.trim())}`)} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          Ir para Pagamento
                        </Button>
                        <Button variant="outline" onClick={() => setCancelOpen(true)} className="flex-1 border-destructive text-destructive hover:bg-destructive/10">
                          <XCircle className="mr-2 h-4 w-4" /> Cancelar Inscrição
                        </Button>
                      </div>
                    )}
                    {resultado.status === "comprovante_enviado" && (
                      <p className="text-sm text-center text-muted-foreground">Comprovante já enviado — aguardando análise.</p>
                    )}
                    {resultado.status === "confirmada" && (
                      <p className="text-sm text-center font-medium text-green-600">✓ Matrícula confirmada!</p>
                    )}
                    {resultado.status === "pagamento_nao_identificado" && (
                      <Button onClick={() => navigate(`/inscricao/pagamento/${resultado.numero_inscricao}?token=${encodeURIComponent(token.trim())}`)} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <Upload className="mr-2 h-4 w-4" /> Reenviar Comprovante
                      </Button>
                    )}
                    {resultado.status === "cancelado" && (
                      <p className="text-sm text-center text-red-500">Esta inscrição foi cancelada.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      </section>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A inscrição será cancelada permanentemente e você precisará realizar uma nova inscrição caso deseje continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sim, cancelar inscrição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConsultaInscricao;
