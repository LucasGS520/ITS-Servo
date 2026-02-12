import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";

const gradeFundamental = [
  "Bibliologia",
  "Administração Eclesiástica",
  "Doutrina de Deus",
  "Família Cristã",
  "Hamartiologia",
  "Homilética",
  "Antropologia",
  "Ministério Pastoral",
  "O Pentateuco",
  "Missiologia",
  "Paracletologia",
  "Liderança Cristã",
];

const gradeBasico = [
  ...gradeFundamental,
  "Soteriologia",
  "Tipologia",
  "Evangelismo",
  "Livros Históricos 1",
  "Os Evangelhos",
  "Evangelismo, Integração e Discipulado",
  "Cristologia",
  "Eclesiologia",
  "Atos dos Apóstolos",
  "Ética Cristã",
  "Epístolas Paulinas",
  "Mordomia Cristã",
];

const gradeMedio = [
  ...gradeBasico,
  "Hermenêutica",
  "Livros Poéticos",
  "Livros Proféticos 1",
  "Livros Proféticos 2",
  "Batalha Espiritual",
  "Livros Históricos 2",
  "Epístolas Gerais",
  "Geografia Bíblica",
  "Escatologia",
  "Angelologia",
  "Doutrinas Bíblicas",
  "Soteriologia",
];

const niveis = [
  {
    titulo: "Fundamental",
    descricao: "Base sólida na fé cristã com 12 matérias essenciais para o início da formação teológica.",
    materias: gradeFundamental,
    cor: "bg-accent",
  },
  {
    titulo: "Básico",
    descricao: "Aprofundamento teológico com 24 matérias, expandindo os fundamentos para uma compreensão mais ampla.",
    materias: gradeBasico,
    cor: "bg-secondary/10",
  },
  {
    titulo: "Médio",
    descricao: "Formação completa com 36 matérias, abrangendo todo o currículo teológico do ITS.",
    materias: gradeMedio,
    cor: "bg-primary/10",
  },
];

const Cursos = () => {
  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Grade Curricular</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Nossa formação é dividida em três níveis progressivos: Fundamental, Básico e Médio.
          </p>
        </div>
      </section>

      {niveis.map((nivel) => (
        <section key={nivel.titulo} className="py-16 md:py-20 odd:bg-muted/50">
          <div className="container">
            <div className="mb-8 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${nivel.cor}`}>
                <GraduationCap className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground md:text-2xl">
                  Nível {nivel.titulo} — {nivel.materias.length} matérias
                </h2>
                <p className="text-sm text-muted-foreground">{nivel.descricao}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {nivel.materias.map((materia, i) => (
                <Card key={`${nivel.titulo}-${i}`} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <BookOpen className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{materia}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-12 md:py-16">
        <div className="container text-center">
          <p className="text-muted-foreground">
            Todos os núcleos compartilham a mesma grade curricular, variando apenas a sequência de aprendizado.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/nucleos">Conheça nossos Núcleos <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Quer fazer parte?</h2>
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

export default Cursos;
