import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Upload, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRICING } from "@/shared/constants/pricing";

/**
 * Componente Pagamento
 * 
 * Página responsável por gerenciar o pagamento da inscrição.
 * Permite ao usuário visualizar os dados de pagamento via PIX e enviar o comprovante.
 * 
 * Página de pagamento renderizada com Layout
 */
const Pagamento = () => {
  // Parâmetro da rota contendo o número da inscrição
  const { numero } = useParams<{ numero: string }>();
  const { toast } = useToast();
  
  // Referência para o elemento input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do componente
  const [inscricao, setInscricao] = useState<any>(null); // Dados da inscrição
  const [loading, setLoading] = useState(true); // Carregamento inicial dos dados
  const [uploading, setUploading] = useState(false); // Estado de envio do arquivo
  const [file, setFile] = useState<File | null>(null); // Arquivo selecionado
  const [enviado, setEnviado] = useState(false); // Indica se o comprovante foi enviado

  /**
   * Hook para buscar os dados da inscrição no Supabase
   * Executa quando o componente monta ou quando o número da inscrição muda
   */
  useEffect(() => {
    const fetchInscricao = async () => {
      const { data, error } = await supabase
        .from("inscricoes")
        .select("*")
        .eq("numero_inscricao", numero)
        .single();

      if (!error && data) {
        setInscricao(data);
        if (data.status !== "aguardando_pagamento" && data.status !== "pagamento_nao_identificado") setEnviado(true);
      }
      setLoading(false);
    };
    if (numero) fetchInscricao();
  }, [numero]);

  /**
   * Função para enviar o comprovante de pagamento
   * 
   * Valida o arquivo, faz upload para o Supabase Storage,
   * atualiza o status da inscrição e envia notificação por email.
   */
  const handleUpload = async () => {
    if (!file || !inscricao) return;

    // Validação de tamanho máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O limite é 5MB.", variant: "destructive" });
      return;
    }

    // Validação de tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG, WebP ou PDF.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Construir caminho único para o arquivo
      const ext = file.name.split(".").pop();
      const filePath = `${numero}/${Date.now()}.${ext}`;

      // Upload do arquivo para o storage do Supabase
      const { error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo enviado
      const { data: urlData } = supabase.storage
        .from("comprovantes")
        .getPublicUrl(filePath);

      // Atualizar registro da inscrição com URL do comprovante
      const { error: updateError } = await supabase
        .from("inscricoes")
        .update({
          comprovante_url: urlData.publicUrl,
          status: "comprovante_enviado",
        })
        .eq("numero_inscricao", numero);

      if (updateError) throw updateError;

      // Tentativa de enviar notificação por email (não-bloqueante)
      try {
        await supabase.functions.invoke("enviar-email-comprovante", {
          body: { numero_inscricao: numero, nome: inscricao.nome_completo, email: inscricao.email },
        });
      } catch {}

      setEnviado(true);
      toast({ title: "Comprovante enviado!", description: "Seu pagamento está em análise." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  /**
   * Copia o texto para a área de transferência
   * 
   * - Texto a ser copiado
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  if (loading) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!inscricao) {
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-foreground">Inscrição não encontrada</h1>
          <p className="mt-2 text-muted-foreground">Verifique o número da inscrição e tente novamente.</p>
        </div>
      </>
    );
  }

  if (enviado) {
    return (
      <>
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
                <CheckCircle className="h-10 w-10 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Comprovante Enviado!</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Seu pagamento está em análise. Você receberá um e-mail com a confirmação em breve.
              </p>
              <Card className="mt-8 text-left">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground"><strong>Número da inscrição:</strong> {numero}</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong>Aluno:</strong> {inscricao.nome_completo}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Pagamento</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Realize o pagamento via PIX e envie o comprovante.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Dados da inscrição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Dados da Inscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Número:</strong> {numero}</p>
                <p><strong>Aluno:</strong> {inscricao.nome_completo}</p>
              </CardContent>
            </Card>

            {/* Valores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matrícula</span>
                    <span className="font-semibold">R$ 40,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material (Apostila 3 matérias)</span>
                    <span className="font-semibold">R$ 150,00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-foreground text-lg">{PRICING.TOTAL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados PIX */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Dados para Pagamento (PIX)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Chave PIX</p>
                    <p className="font-mono text-sm font-semibold">20.424.935/0001-02</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("20424935000102")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Favorecido</p>
                  <p className="text-sm font-semibold">Instituto Teológico Servo</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="text-sm font-semibold">Cora</p>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Enviar Comprovante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Comprovante de pagamento (JPG, PNG ou PDF, máx 5MB)</Label>
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-8 transition-colors hover:border-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "Clique para selecionar o arquivo"}
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  size="lg"
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={!file || uploading}
                >
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Comprovante"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pagamento;
