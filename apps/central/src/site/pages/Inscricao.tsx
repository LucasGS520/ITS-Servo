/**
 * Página de Inscrição - Instituto Teológico Servo
 * 
 * Componente responsável pelo formulário de inscrição de alunos.
 * Coleta dados pessoais e acadêmicos, valida-os e persiste no banco de dados.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BirthDatePicker } from "@/components/BirthDatePicker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { maskCPF, maskPhone, validateCPF } from "@/lib/masks";
import { supabase } from "@/integrations/supabase/client";
import { criarInscricao, NUCLEO_OPTIONS } from "@its-servo/supabase";
import { useToast } from "@/hooks/use-toast";

// Lista de núcleos disponíveis para inscrição presencial (fonte única do monorepo)
const nucleos = NUCLEO_OPTIONS;

/**
 * Schema de validação para dados de inscrição
 * Define as regras de validação para todos os campos do formulário
 */
const inscricaoSchema = z.object({
  nome_completo: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  cpf: z.string().refine((v) => validateCPF(v), "CPF inválido"),
  telefone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido"),
  email: z.string().trim().email("E-mail inválido").max(255),
  data_nascimento: z.date({ required_error: "Data de nascimento obrigatória" }),
  escolaridade: z.string().min(1, "Selecione o grau de escolaridade"),
  modalidade: z.enum(["presencial", "correspondencia"], { required_error: "Selecione a modalidade" }),
  nucleo: z.string().optional(),
}).refine(
  (data) => data.modalidade !== "presencial" || (data.nucleo && data.nucleo.length > 0),
  { message: "Selecione o núcleo para modalidade presencial", path: ["nucleo"] }
);

// Tipo de dados do formulário inferido do schema Zod
type FormData = z.infer<typeof inscricaoSchema>;

/**
 * Componente Inscricao
 * 
 * Renderiza um formulário de inscrição com validação em tempo real.
 * Após submissão, persiste os dados no Supabase e envia e-mail de confirmação.
 */
const Inscricao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({
    nome_completo: "",
    cpf: "",
    telefone: "",
    email: "",
    escolaridade: "",
    modalidade: undefined,
    nucleo: "",
  });
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToValidate = { ...formData, data_nascimento: dataNascimento };
    const result = inscricaoSchema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Contrato: criação server-side (valida, insere via service_role, gera
      // token de posse e dispara o e-mail com link mágico). O Site/Central não
      // toca a tabela `inscricoes` diretamente. Ver docs/arquitetura.md §5.
      const { numero_inscricao, token } = await criarInscricao(supabase, {
        nome_completo: result.data.nome_completo,
        cpf: result.data.cpf,
        telefone: result.data.telefone,
        email: result.data.email,
        data_nascimento: format(result.data.data_nascimento, "yyyy-MM-dd"),
        escolaridade: result.data.escolaridade,
        modalidade: result.data.modalidade,
        nucleo: result.data.modalidade === "presencial" ? result.data.nucleo : null,
      });

      toast({ title: "Inscrição realizada!", description: `Número: ${numero_inscricao}` });
      navigate(`/inscricao/pagamento/${numero_inscricao}?token=${encodeURIComponent(token)}`);
    } catch (err: any) {
      toast({ title: "Erro ao enviar inscrição", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Seção 1 - Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome completo *</Label>
                    <Input
                      id="nome_completo"
                      placeholder="Seu nome completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    />
                    {errors.nome_completo && <p className="text-sm text-destructive">{errors.nome_completo}</p>}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                      />
                      {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                      <Input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                      />
                      {errors.telefone && <p className="text-sm text-destructive">{errors.telefone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Data de nascimento *</Label>
                      <BirthDatePicker
                        value={dataNascimento}
                        onChange={setDataNascimento}
                      />
                      {errors.data_nascimento && <p className="text-sm text-destructive">{errors.data_nascimento}</p>}
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
                          <SelectItem value="superior">Ensino Superior</SelectItem>
                          <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.escolaridade && <p className="text-sm text-destructive">{errors.escolaridade}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção 2 - Dados Acadêmicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Dados Acadêmicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label>Modalidade *</Label>
                    <RadioGroup
                      value={formData.modalidade}
                      onValueChange={(value) => setFormData({ ...formData, modalidade: value as "presencial" | "correspondencia", nucleo: "" })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="presencial" id="presencial" />
                        <Label htmlFor="presencial" className="font-normal cursor-pointer">Presencial</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="correspondencia" id="correspondencia" />
                        <Label htmlFor="correspondencia" className="font-normal cursor-pointer">Por Correspondência</Label>
                      </div>
                    </RadioGroup>
                    {errors.modalidade && <p className="text-sm text-destructive">{errors.modalidade}</p>}
                  </div>

                  {formData.modalidade === "presencial" && (
                    <div className="space-y-2">
                      <Label>Núcleo *</Label>
                      <Select
                        value={formData.nucleo}
                        onValueChange={(value) => setFormData({ ...formData, nucleo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o núcleo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {nucleos.map((n) => (
                            <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.nucleo && <p className="text-sm text-destructive">{errors.nucleo}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base"
                disabled={loading}
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Continuar para Pagamento"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Inscricao;
