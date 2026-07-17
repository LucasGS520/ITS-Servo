import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Globe, Mail, ChevronRight } from "lucide-react";

/**
 * Array com dados dos núcleos do ITS
 * Contém informações sobre localização, formato e ícone de cada núcleo
 */
const nucleos = [
  {
    nome: "Sede Jd. Santa Mônica",
    cidade: "Barueri — SP",
    referencia: "Assembleia de Deus Ministério Família",
    formato: "Presencial",
    icon: MapPin,
  },
  {
    nome: "Engenho Novo",
    cidade: "Barueri — SP",
    referencia: "Assembleia de Deus Ministério Família",
    formato: "Presencial",
    icon: MapPin,
  },
  {
    nome: "Jd. Conceição",
    cidade: "Osasco — SP",
    referencia: "Assembleia de Deus Ministério Família",
    formato: "Presencial",
    icon: MapPin,
  },
  {
    nome: "Ariston",
    cidade: "Carapicuíba — SP",
    referencia: "Assembleia de Deus Ministério Família",
    formato: "Presencial",
    icon: MapPin,
  },
  {
    nome: "Maputo",
    cidade: "Moçambique",
    referencia: "Núcleo missionário internacional",
    formato: "Presencial",
    icon: Globe,
  },
  {
    nome: "Correspondência",
    cidade: "Todo o Brasil e exterior",
    referencia: "Material enviado para qualquer endereço",
    formato: "À distância",
    icon: Mail,
  },
];

/**
 * Componente de página que exibe todos os núcleos do ITS
 * Apresenta uma visão geral dos diferentes locais de estudos,
 * seus formatos e oferece acesso a inscrição
 * 
 * Página de núcleos com seções de apresentação e CTA
 */
const Nucleos = () => {
  return (
    <>
      {/* Seção de cabeçalho com título e descrição */}
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Nossos Núcleos</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            O ITS está presente em diversas localidades, levando formação teológica de qualidade para onde há necessidade.
          </p>
        </div>
      </section>

      {/* Seção principal com grid de núcleos */}
      <section className="py-16 md:py-24">
        <div className="container">
          {/* Texto explicativo sobre o currículo unificado */}
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Todos os núcleos compartilham a mesma grade curricular, variando apenas a sequência de aprendizado das matérias.
              Isso garante a mesma qualidade e profundidade em qualquer localidade.
            </p>
          </div>

          {/* Grid responsivo com cards dos núcleos */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nucleos.map((nucleo) => (
              <Card key={nucleo.nome} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  {/* Ícone do núcleo */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <nucleo.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  {/* Informações do núcleo */}
                  <h3 className="font-serif text-lg font-bold text-foreground">{nucleo.nome}</h3>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{nucleo.cidade}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{nucleo.referencia}</p>
                  <div className="mt-3 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {nucleo.formato}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botão para visualizar grade curricular */}
          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link to="/cursos">Ver Grade Curricular <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contato para localizar o núcleo */}
      <section className="py-10 border-b">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl bg-muted/60 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não sabe qual núcleo fica mais próximo de você?
            </p>
            <p className="mt-1 font-medium text-foreground">
              Entre em contato via WhatsApp:{" "}
              <a
                href="https://wa.me/5511972294009"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                (11) 97229-4009
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Seção de chamada para ação (CTA) para inscrição */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Estude no núcleo mais próximo de você</h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Inscreva-se e inicie sua formação teológica no ITS.
          </p>
          {/* Botão principal de inscrição */}
          <Button asChild size="lg" className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/inscricao">Inscreva-se Agora</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default Nucleos;
