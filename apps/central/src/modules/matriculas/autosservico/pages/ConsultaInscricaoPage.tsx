import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { paramFromUrl } from "@/common/lib/urlToken";
import { consultarPublicamente, enviarComprovanteInscricao, solicitarCancelamento, type InscricaoPublica } from "@/modules/matriculas/api";
import { STATUS_INSCRICAO_INFO, statusInscricaoOuPadrao, validarComprovante } from "@/modules/matriculas/model";

const ConsultaInscricaoPage = () => {
  const { toast } = useToast();
  const [identificador, setIdentificador] = useState(() => paramFromUrl("numero") ?? "");
  const [linhas, setLinhas] = useState<InscricaoPublica[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [acao, setAcao] = useState<string | null>(null);
  const [arquivos, setArquivos] = useState<Record<string, File | null>>({});

  const buscar = async (valor: string) => {
    if (!valor.trim()) return;
    setCarregando(true);
    try { setLinhas(await consultarPublicamente(valor)); }
    catch (error) { toast({ title: "Não foi possível consultar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setCarregando(false); }
  };
  useEffect(() => { const numero = paramFromUrl("numero"); if (numero) void buscar(numero); }, []);

  const enviar = async (numero: string) => {
    const file = arquivos[numero];
    if (!file) return;
    const validacao = validarComprovante(file);
    if (!validacao.valido) { toast({ title: "Use JPG, PNG, WebP ou PDF de até 5 MB", variant: "destructive" }); return; }
    setAcao(numero);
    try {
      await enviarComprovanteInscricao(numero, "", file);
      toast({ title: "Comprovante recebido para análise" });
      await buscar(identificador || numero);
    } catch (error) { toast({ title: "Não foi possível enviar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setAcao(null); }
  };
  const cancelar = async (numero: string) => {
    setAcao(numero);
    try {
      await solicitarCancelamento(numero);
      setLinhas((atuais) => atuais.map((item) => item.numero_inscricao === numero ? { ...item, cancelamento_pendente: true } : item));
      toast({ title: "Pedido enviado à equipe", description: "A inscrição continua válida até a análise do ITS." });
    } catch (error) { toast({ title: "Não foi possível solicitar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setAcao(null); }
  };

  return <section className="container max-w-2xl space-y-6 py-16">
    <div><h1 className="text-3xl font-bold">Consultar inscrição</h1><p className="text-muted-foreground">Informe seu CPF ou o número da inscrição.</p></div>
    <Card><CardHeader><CardTitle>Localizar inscrição</CardTitle></CardHeader><CardContent className="flex gap-2">
      <Input aria-label="CPF ou número da inscrição" placeholder="CPF ou ITS2026-0001" value={identificador} onChange={(e) => setIdentificador(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void buscar(identificador); }} />
      <Button disabled={carregando} onClick={() => void buscar(identificador)}><Search className="mr-2 h-4 w-4" />Buscar</Button>
    </CardContent></Card>
    {linhas.length === 0 && !carregando && <p className="text-sm text-muted-foreground">Nenhuma inscrição exibida. Pesquise para consultar a situação.</p>}
    {linhas.map((item) => <Card key={item.numero_inscricao}><CardContent className="space-y-4 p-5">
      <div><p className="font-semibold">{item.atividade}</p><p className="text-sm">{item.numero_inscricao} · {STATUS_INSCRICAO_INFO[statusInscricaoOuPadrao(item.status)].labelAutosservico}</p></div>
      {item.cancelamento_pendente && <p className="text-sm text-amber-700">Pedido de cancelamento aguardando análise da equipe.</p>}
      {item.status !== "cancelado" && <>
        <div className="space-y-2"><p className="text-sm">Comprovante opcional. O envio não confirma pagamento.</p>
          <Input aria-label={`Comprovante ${item.numero_inscricao}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArquivos((atual) => ({ ...atual, [item.numero_inscricao]: e.target.files?.[0] ?? null }))} />
          <Button variant="outline" disabled={!arquivos[item.numero_inscricao] || acao === item.numero_inscricao} onClick={() => void enviar(item.numero_inscricao)}>Enviar comprovante</Button>
        </div>
        {!item.cancelamento_pendente && <Button variant="outline" disabled={acao === item.numero_inscricao} onClick={() => void cancelar(item.numero_inscricao)}>Solicitar cancelamento</Button>}
      </>}
    </CardContent></Card>)}
  </section>;
};

export default ConsultaInscricaoPage;
