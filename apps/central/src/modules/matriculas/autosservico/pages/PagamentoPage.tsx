import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { paramFromUrl } from "@/common/lib/urlToken";
import { consultarInscricao, enviarComprovanteInscricao, type InscricaoResumo } from "@/modules/matriculas/api";
import { validarComprovante } from "@/modules/matriculas/model";

/** Autosserviço: o arquivo é evidência; somente a equipe registra recebimentos. */
const PagamentoPage = () => {
  const { numero } = useParams<{ numero: string }>();
  const token = paramFromUrl("token") ?? "";
  const { toast } = useToast();
  const [inscricao, setInscricao] = useState<InscricaoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!numero || !token) { setLoading(false); return; }
    consultarInscricao(numero, token).then(setInscricao).catch(() => setInscricao(null)).finally(() => setLoading(false));
  }, [numero, token]);

  const enviar = async () => {
    if (!file || !numero) return;
    const resultado = validarComprovante(file);
    if ("motivo" in resultado) {
      toast({ title: "Arquivo inválido", description: "Use JPG, PNG, WebP ou PDF de até 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await enviarComprovanteInscricao(numero, token, file);
      setEnviado(true);
      toast({ title: "Comprovante recebido para análise" });
    } catch (error) {
      toast({ title: "Não foi possível enviar", description: getErrorMessage(error), variant: "destructive" });
    } finally { setUploading(false); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!inscricao) return <div className="container py-20 text-center">Inscrição não encontrada. Confira o número e o código de acesso.</div>;

  return <section className="container max-w-2xl space-y-6 py-16">
    <h1 className="text-3xl font-bold">Acompanhar inscrição</h1>
    <Card><CardHeader><CardTitle>{inscricao.destino_nome ?? "Atividade ITS"}</CardTitle></CardHeader><CardContent className="space-y-2">
      <p><strong>Número:</strong> {inscricao.numero_inscricao}</p>
      <p><strong>Nome:</strong> {inscricao.nome_completo}</p>
      <p><strong>Situação:</strong> {inscricao.status.replace(/_/g, " ")}</p>
      <p className="text-sm text-muted-foreground">A equipe do ITS confere inscrições e pagamentos. O envio de comprovante é opcional e não confirma pagamento ou matrícula automaticamente.</p>
    </CardContent></Card>
    {!enviado && ["em_analise", "comprovante_enviado", "pagamento_nao_identificado"].includes(inscricao.status) &&
      <Card><CardHeader><CardTitle>Enviar comprovante (opcional)</CardTitle></CardHeader><CardContent className="space-y-4">
        <Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button disabled={!file || uploading} onClick={enviar}>{uploading ? "Enviando..." : "Enviar para análise"}</Button>
      </CardContent></Card>}
    {enviado && <p className="text-sm">Arquivo recebido. Aguarde a conferência pela equipe.</p>}
    <Link className="text-primary underline" to={`/consulta#numero=${encodeURIComponent(numero ?? "")}&token=${encodeURIComponent(token)}`}>Consultar inscrição</Link>
  </section>;
};

export default PagamentoPage;
