import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { CheckCircle, Upload, Loader2, Copy, XCircle } from "lucide-react";
import {
  consultarInscricao,
  enviarComprovanteInscricao,
  type InscricaoResumo,
} from "@/modules/inscricoes/api";
import { useToast } from "@/common/hooks/use-toast";
import { PRICING, PIX, formatBRL } from "@/common/constants/pricing";
import { paramFromUrl } from "@/common/lib/urlToken";
import { getErrorMessage } from "@/common/lib/errors";
import { validarComprovante } from "@/modules/inscricoes/model";

/**
 * Componente Pagamento
 * 
 * Página responsável por gerenciar o pagamento da inscrição.
 * Permite ao usuário visualizar os dados de pagamento via PIX e enviar o comprovante.
 * 
 * Página de pagamento renderizada com Layout
 */
const PagamentoPage = () => {
  // Parâmetro da rota contendo o número da inscrição + token de posse (link mágico)
  const { numero } = useParams<{ numero: string }>();
  const [token] = useState(() => paramFromUrl("token") ?? "");
  const { toast } = useToast();
  
  // Referência para o elemento input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do componente
  const [inscricao, setInscricao] = useState<InscricaoResumo | null>(null);
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
      try {
        // Contrato: leitura só com token de posse (RPC). Sem token → sem acesso.
        const insc = await consultarInscricao(numero!, token);
        // A tela certa é derivada do status real (cancelada/confirmada/em
        // análise); `enviado` fica só para o upload feito nesta sessão.
        if (insc) setInscricao(insc);
      } catch {
        // não encontrada / token inválido → inscricao permanece null
      }
      setLoading(false);
    };
    if (numero && token) fetchInscricao();
    else setLoading(false);
  }, [numero, token]);

  /**
   * Função para enviar o comprovante de pagamento
   * 
   * Valida o arquivo, faz upload para o Supabase Storage,
   * atualiza o status da inscrição no backend.
   */
  const handleUpload = async () => {
    if (!file || !inscricao) return;

    const validacao = validarComprovante(file);
    if (!validacao.valido && validacao.motivo === "tamanho") {
      toast({ title: "Arquivo muito grande", description: "O limite é 5MB.", variant: "destructive" });
      return;
    }

    if (!validacao.valido && validacao.motivo === "tipo") {
      toast({ title: "Formato inválido", description: "Use JPG, PNG, WebP ou PDF.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Contrato: upload em bucket PRIVADO + atualização de status + e-mail,
      // tudo server-side (edge), validando o token de posse. O client não fala
      // com o storage nem com a tabela diretamente. Ver docs/arquitetura.md §5.
      await enviarComprovanteInscricao(numero!, token, file);

      setEnviado(true);
      toast({ title: "Comprovante enviado!", description: "Seu pagamento está em análise." });
    } catch (error: unknown) {
      toast({ title: "Erro ao enviar", description: getErrorMessage(error), variant: "destructive" });
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

  // Telas terminais/estado — derivadas do status real da inscrição
  if (inscricao.status === "cancelado") {
    return (
      <StatusScreen
        icone={<XCircle className="h-10 w-10 text-destructive" />}
        iconeBg="bg-destructive/10"
        titulo="Inscrição cancelada"
        texto="Esta inscrição foi cancelada e não aceita mais pagamentos. Se desejar estudar no ITS, faça uma nova inscrição."
        numero={numero}
        nome={inscricao.nome_completo}
      />
    );
  }

  if (inscricao.status === "confirmada") {
    return (
      <StatusScreen
        icone={<CheckCircle className="h-10 w-10 text-secondary" />}
        iconeBg="bg-secondary/10"
        titulo="Matrícula confirmada!"
        texto="Seu pagamento foi confirmado. Bem-vindo(a) ao Instituto Teológico Servo — você receberá as orientações por e-mail."
        numero={numero}
        nome={inscricao.nome_completo}
      />
    );
  }

  if (enviado || inscricao.status === "comprovante_enviado") {
    return (
      <StatusScreen
        icone={<CheckCircle className="h-10 w-10 text-secondary" />}
        iconeBg="bg-secondary/10"
        titulo="Comprovante Enviado!"
        texto="Seu pagamento está em análise. Você receberá um e-mail com a confirmação em breve."
        numero={numero}
        nome={inscricao.nome_completo}
      />
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
                    <span className="font-semibold">{formatBRL(PRICING.MATRICULA)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material (Apostila 3 matérias)</span>
                    <span className="font-semibold">{formatBRL(PRICING.MATERIAL)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-foreground text-lg">{formatBRL(PRICING.TOTAL)}</span>
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
                    <p className="font-mono text-sm font-semibold">{PIX.CHAVE_EXIBICAO}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(PIX.CHAVE_COPIA)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Favorecido</p>
                  <p className="text-sm font-semibold">{PIX.FAVORECIDO}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="text-sm font-semibold">{PIX.BANCO}</p>
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
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    to={`/consulta#numero=${encodeURIComponent(numero ?? "")}&token=${encodeURIComponent(token)}`}
                    className="text-primary hover:underline"
                  >
                    Acompanhar minha inscrição
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

/** Tela terminal do autosserviço (cancelada / confirmada / em análise). */
const StatusScreen = ({
  icone,
  iconeBg,
  titulo,
  texto,
  numero,
  nome,
}: {
  icone: React.ReactNode;
  iconeBg: string;
  titulo: string;
  texto: string;
  numero?: string;
  nome: string;
}) => (
  <section className="py-24 md:py-32">
    <div className="container">
      <div className="mx-auto max-w-md text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${iconeBg}`}>
          {icone}
        </div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{titulo}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{texto}</p>
        <Card className="mt-8 text-left">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground"><strong>Número da inscrição:</strong> {numero}</p>
            <p className="text-sm text-muted-foreground mt-1"><strong>Aluno:</strong> {nome}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

export default PagamentoPage;
