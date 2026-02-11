import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, MapPin } from "lucide-react";

const cursos = [
  {
    nucleo: "Núcleo São Paulo",
    formato: "Presencial",
    disciplinas: [
      { title: "Teologia Sistemática", desc: "Estudo das doutrinas cristãs de forma organizada e aprofundada.", publico: "Líderes e obreiros" },
      { title: "Hermenêutica Bíblica", desc: "Métodos e princípios para interpretação fiel das Escrituras.", publico: "Todos os interessados" },
      { title: "Homilética", desc: "Técnicas de pregação e comunicação do Evangelho.", publico: "Pregadores e líderes" },
      { title: "História da Igreja", desc: "A trajetória do Cristianismo desde os primeiros séculos.", publico: "Todos os interessados" },
      { title: "Aconselhamento Pastoral", desc: "Fundamentos bíblicos para cuidado e orientação pastoral.", publico: "Líderes e pastores" },
    ],
  },
  {
    nucleo: "Núcleo Moçambique",
    formato: "Presencial / Híbrido",
    disciplinas: [
      { title: "Fundamentos da Fé Cristã", desc: "Introdução às bases da fé e da vida cristã.", publico: "Membros e novos convertidos" },
      { title: "Liderança Bíblica", desc: "Princípios de liderança segundo o modelo bíblico.", publico: "Líderes locais" },
      { title: "Missões e Evangelismo", desc: "Estratégias e chamado para a expansão do Evangelho.", publico: "Missionários e obreiros" },
    ],
  },
];

const Cursos = () => {
  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Cursos, Disciplinas e Núcleos</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Conheça os cursos e disciplinas disponíveis em cada núcleo do ITS.
          </p>
        </div>
      </section>

      {cursos.map((nucleo) => (
        <section key={nucleo.nucleo} className="py-16 md:py-20 odd:bg-muted/50">
          <div className="container">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground md:text-2xl">{nucleo.nucleo}</h2>
                <p className="text-sm text-muted-foreground">Formato: {nucleo.formato}</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nucleo.disciplinas.map((d) => (
                <Card key={d.title} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <BookOpen className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{d.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{d.publico}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

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
