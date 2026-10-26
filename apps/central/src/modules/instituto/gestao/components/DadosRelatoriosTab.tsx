import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/common/ui/card";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { useEnderecoRelatorios, useSalvarEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";

const DadosRelatoriosTab = () => {
  const { data: endereco, isLoading, error } = useEnderecoRelatorios();
  const salvar = useSalvarEnderecoRelatorios();
  const { toast } = useToast();
  const [valor, setValor] = useState("");
  const inicializado = useRef(false);
  useEffect(() => { if (endereco !== undefined && !inicializado.current) { setValor(endereco); inicializado.current = true; } }, [endereco]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await salvar.mutateAsync(valor.trim());
      toast({ title: "Endereço dos relatórios atualizado" });
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" });
    }
  }

  return <section className="space-y-5">
    <div><h2 className="text-xl font-semibold">Dados para relatórios</h2><p className="text-sm text-muted-foreground">Endereço da Sede nos relatórios gerais. Os endereços dos núcleos são configurados em Instituto → Núcleos.</p></div>
    <Card><CardContent className="p-5">
      {isLoading && <p>Carregando...</p>}
      {error && <p className="text-destructive">Não foi possível carregar o endereço. Verifique a configuração do banco.</p>}
      {!isLoading && !error && <form onSubmit={enviar} className="space-y-4">
        <Label htmlFor="endereco-relatorios">Endereço da Sede</Label>
        <Input id="endereco-relatorios" value={valor} maxLength={240} minLength={5} required onChange={e => setValor(e.target.value)} />
        <Button disabled={salvar.isPending || valor.trim() === endereco}>Salvar endereço</Button>
      </form>}
    </CardContent></Card>
  </section>;
};

export default DadosRelatoriosTab;
