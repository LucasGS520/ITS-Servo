import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, FileText, CheckCircle } from "lucide-react";

const estrutura = [
  { icon: BookOpen, title: "Módulos Temáticos", desc: "O conteúdo é organizado em módulos progressivos, permitindo que o aluno avance gradualmente no aprendizado teológico." },
  { icon: Clock, title: "Carga Horária", desc: "Cada disciplina possui entre 30 e 60 horas/aula, distribuídas ao longo do semestre letivo, com encontros semanais ou quinzenais." },
  { icon: FileText, title: "Material Didático", desc: "Apostilas próprias, textos bíblicos selecionados e material complementar preparado por professores especializados." },
  { icon: CheckCircle, title: "Avaliações", desc: "Avaliações contínuas incluindo trabalhos escritos, participação em sala e provas ao final de cada módulo." },
];

const Metodologia = () => {
  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Metodologia e Material Didático</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Entenda como funciona o ensino no Instituto Teológico Servo.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Nossa Abordagem Pedagógica</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                O ITS adota uma metodologia que combina exposição teórica com aplicação prática, sempre fundamentada
                nas Escrituras Sagradas. Acreditamos que a teologia deve ser vivida, e não apenas estudada.
              </p>
              <p>
                Nossos professores são líderes e teólogos com experiência pastoral e acadêmica, garantindo um ensino
                contextualizado e relevante para a realidade da igreja local.
              </p>
              <p>
                O acompanhamento dos alunos é personalizado, com tutoria individual e atividades em grupo que promovem
                o crescimento mútuo e a edificação da comunidade de aprendizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">Estrutura Pedagógica</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {estrutura.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Ensino Acessível, Bíblico e Prático</h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              O ITS acredita que a formação teológica deve ser acessível a todos, independentemente de sua formação
              acadêmica prévia. Nosso compromisso é oferecer um ensino que seja ao mesmo tempo rigoroso em seu
              fundamento bíblico e prático em sua aplicação ao ministério e à vida cristã cotidiana.
            </p>
            <Button asChild size="lg" className="mt-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/inscricao">Inscreva-se Agora</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Metodologia;
