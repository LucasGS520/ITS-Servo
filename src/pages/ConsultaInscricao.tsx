import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskCPF } from "@/lib/masks";

const statusLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  aguardando_pagamento: {
    label: "Aguardando Pagamento",
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  comprovante_enviado: {
    label: "Comprovante Enviado",
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  confirmado: {
    label: "Matrícula Confirmada",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  cancelado: {
    label: "Cancelado",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-red-600 bg-red-50 border-red-200",
  },
};

const ConsultaInscricao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [numero, setNumero] = useState("");
  const [cpf, setCpf] = useState("");
  const [resultados, setResultados] = useState<any[] | null>(null);

  const buscarPorNumero = async () => {
    if (!numero.trim()) {
      toast({ title: "Informe o número da inscrição", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultados(null);
    const { data, error } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("numero_inscricao", numero.trim().toUpperCase())
      .limit(1);

    if (error || !data?.length) {
      toast({ title: "Inscrição não encontrada", description: "Verifique o número e tente novamente.", variant: "destructive" });
    } else {
      setResultados(data);
    }
    setLoading(false);
  };

  const buscarPorCpf = async () => {
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF completo.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultados(null);
    const { data, error } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("cpf", cpfLimpo);

    if (error || !data?.length) {
      toast({ title: "Nenhuma inscrição encontrada", description: "Não encontramos inscrições com esse CPF.", variant: "destructive" });
    } else {
      setResultados(data);
    }
    setLoading(false);
  };

  const getStatus = (status: string) => statusLabels[status] || statusLabels.aguardando_pagamento;

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Consultar Inscrição</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Encontre sua inscrição, acompanhe o status e acesse a página de pagamento.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" />
                  Buscar Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="numero">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="numero">Nº de Inscrição</TabsTrigger>
                    <TabsTrigger value="cpf">CPF</TabsTrigger>
                  </TabsList>

                  <TabsContent value="numero" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Número da inscrição</Label>
                      <Input
                        placeholder="Ex: ITS2026-0001"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && buscarPorNumero()}
                      />
                    </div>
                    <Button onClick={buscarPorNumero} disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Buscar
                    </Button>
                  </TabsContent>

                  <TabsContent value="cpf" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(applyCpfMask(e.target.value))}
                        onKeyDown={(e) => e.key === "Enter" && buscarPorCpf()}
                        maxLength={14}
                      />
                    </div>
                    <Button onClick={buscarPorCpf} disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Buscar
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Resultados */}
            {resultados && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {resultados.length === 1 ? "Inscrição encontrada" : `${resultados.length} inscrições encontradas`}
                </h2>
                {resultados.map((insc: any) => {
                  const st = getStatus(insc.status);
                  return (
                    <Card key={insc.id} className="overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{insc.nome_completo}</p>
                            <p className="text-sm text-muted-foreground font-mono">{insc.numero_inscricao}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${st.color}`}>
                            {st.icon}
                            {st.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Modalidade:</span>{" "}
                            <span className="font-medium text-foreground">{insc.modalidade}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">E-mail:</span>{" "}
                            <span className="font-medium text-foreground">{insc.email}</span>
                          </div>
                          {insc.nucleo && (
                            <div>
                              <span className="text-muted-foreground">Núcleo:</span>{" "}
                              <span className="font-medium text-foreground">{insc.nucleo}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Data:</span>{" "}
                            <span className="font-medium text-foreground">
                              {new Date(insc.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        {insc.status === "aguardando_pagamento" && (
                          <Button
                            onClick={() => navigate(`/inscricao/pagamento/${insc.numero_inscricao}`)}
                            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          >
                            Ir para Pagamento
                          </Button>
                        )}
                        {insc.status === "comprovante_enviado" && (
                          <p className="text-sm text-center text-muted-foreground">
                            Comprovante já enviado — aguardando análise.
                          </p>
                        )}
                        {insc.status === "confirmado" && (
                          <p className="text-sm text-center font-medium text-green-600">
                            ✓ Matrícula confirmada!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ConsultaInscricao;
