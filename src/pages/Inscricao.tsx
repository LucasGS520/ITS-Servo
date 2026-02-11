import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { z } from "zod";

const inscricaoSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido"),
  escolaridade: z.string().min(1, "Selecione o grau de escolaridade"),
  endereco: z.string().trim().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200, "Endereço muito longo"),
});

type FormData = z.infer<typeof inscricaoSchema>;

const Inscricao = () => {
  const [formData, setFormData] = useState<FormData>({ nome: "", telefone: "", escolaridade: "", endereco: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = inscricaoSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
                <CheckCircle className="h-10 w-10 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Inscrição Enviada!</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Obrigado pelo seu interesse no Instituto Teológico Servo. Sua inscrição foi recebida com sucesso.
              </p>
              <Card className="mt-8 text-left">
                <CardContent className="p-6">
                  <h3 className="font-serif font-bold text-foreground">Próximos passos:</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>Nossa equipe entrará em contato pelo telefone informado em até 3 dias úteis.</li>
                    <li>Você receberá as orientações sobre matrícula e início das aulas.</li>
                    <li>Prepare-se para uma jornada transformadora de aprendizado bíblico!</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Inscrição</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Preencha o formulário abaixo para se inscrever no Instituto Teológico Servo.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-lg">
            <Card>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome completo"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                    {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                    {errors.telefone && <p className="text-sm text-destructive">{errors.telefone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Grau de escolaridade *</Label>
                    <Select
                      value={formData.escolaridade}
                      onValueChange={(value) => setFormData({ ...formData, escolaridade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                        <SelectItem value="medio">Ensino Médio</SelectItem>
                        <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                        <SelectItem value="superior">Superior Completo</SelectItem>
                        <SelectItem value="pos">Pós-graduação</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.escolaridade && <p className="text-sm text-destructive">{errors.escolaridade}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                    {errors.endereco && <p className="text-sm text-destructive">{errors.endereco}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base">
                    Enviar Inscrição
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Inscricao;
