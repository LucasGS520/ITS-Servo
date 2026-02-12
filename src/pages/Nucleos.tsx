import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Globe, Mail, ChevronRight } from "lucide-react";

const nucleos = [
  { nome: "Sede Jd. Santa Mônica", cidade: "Barueri/SP", formato: "Presencial", icon: MapPin },
  { nome: "Engenho Novo", cidade: "Barueri/SP", formato: "Presencial", icon: MapPin },
  { nome: "Jd. Conceição", cidade: "Osasco/SP", formato: "Presencial", icon: MapPin },
  { nome: "Ariston", cidade: "Carapicuíba/SP", formato: "Presencial", icon: MapPin },
  { nome: "Maputo", cidade: "Moçambique", formato: "Presencial", icon: Globe },
  { nome: "Correspondência", cidade: "Todo o Brasil e exterior", formato: "À distância", icon: Mail },
];

const Nucleos = () => {
  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Nossos Núcleos</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            O ITS está presente em diversas localidades, levando formação teológica de qualidade para onde há necessidade.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Todos os núcleos compartilham a mesma grade curricular, variando apenas a sequência de aprendizado das matérias.
              Isso garante a mesma qualidade e profundidade em qualquer localidade.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nucleos.map((nucleo) => (
              <Card key={nucleo.nome} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <nucleo.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground">{nucleo.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{nucleo.cidade}</p>
                  <div className="mt-3 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {nucleo.formato}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link to="/cursos">Ver Grade Curricular <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Estude no núcleo mais próximo de você</h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Inscreva-se e inicie sua formação teológica no ITS.
          </p>
          <Button asChild size="lg" className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link to="/inscricao">Inscreva-se Agora</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Nucleos;
