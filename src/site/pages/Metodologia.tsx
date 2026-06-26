import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, FileText, CheckCircle } from "lucide-react";

/**
 * Array contendo os dados da estrutura pedagógica do ITS
 * Cada item representa um aspecto importante da metodologia de ensino
 */
const estrutura = [
  { icon: BookOpen, title: "Módulos Temáticos", desc: "O conteúdo é organizado em módulos progressivos, permitindo que o aluno avance gradualmente no aprendizado teológico." },
  { icon: Clock, title: "Carga Horária", desc: "Cada disciplina tem duração de aproximadamente 1 mês, com aulas semanais de 1h30 — totalizando cerca de 6 horas/aula por disciplina." },
  { icon: FileText, title: "Material Didático", desc: "Apostilas próprias, textos bíblicos selecionados e material complementar preparado por professores especializados." },
  { icon: CheckCircle, title: "Avaliações", desc: "Avaliações contínuas incluindo trabalhos escritos, participação em sala e provas ao final de cada módulo." },
];

/**
 * Componente Metodologia
 * 
 * Renderiza a página com informações sobre a metodologia de ensino,
 * estrutura pedagógica e material didático do Instituto Teológico Servo.
 * 
 * Página de metodologia com seções de conteúdo
 */
const Metodologia = () => {
  return (
    <>
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
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Metodologia de Ensino</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
              O Instituto Teológico Servo (ITS) adota uma metodologia de ensino cíclica, que permite ao aluno ingressar no curso no início de qualquer disciplina, independentemente do grau escolhido (Fundamental, Básico ou Médio). Essa estrutura oferece flexibilidade sem comprometer a progressão pedagógica.
              </p>
              <p>
                Nosso modelo integra fundamentação teórica consistente com aplicação prática ministerial, sempre alicerçada nas Escrituras Sagradas. Cada conteúdo é desenvolvido com foco na formação bíblica sólida e na capacitação para o serviço cristão.
              </p>
              <p>
                A abordagem cíclica assegura que os principais fundamentos da fé sejam continuamente revisitados e aprofundados à medida que novos temas são introduzidos, promovendo consolidação do conhecimento e maturidade teológica.
              </p>

              <h3 className="text-xl font-bold text-foreground pt-4">Corpo Docente</h3>
              <p>
                O ITS conta com professores que atuam como líderes e teólogos com experiência pastoral e formação acadêmica, garantindo um ensino contextualizado, relevante e alinhado à realidade da igreja local.
              </p>

              <h3 className="text-xl font-bold text-foreground pt-4">Acompanhamento e Desenvolvimento do Aluno</h3>
              <p>
                O processo formativo inclui acompanhamento personalizado, com tutoria individual e atividades em grupo. Essa dinâmica favorece o desenvolvimento espiritual, o crescimento acadêmico e a edificação mútua dentro da comunidade de aprendizado.
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
    </>
  );
};

export default Metodologia;
