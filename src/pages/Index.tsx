import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Globe, Users, Heart, ChevronRight, Quote } from "lucide-react";
import Layout from "@/components/Layout";
import logoIts from "@/assets/logo-its.jpeg";
import mocambique2 from "@/assets/mocambique2.png";

/**
 * Array de disciplinas oferecidas pelo Instituto Teológico Servo
 * Cada disciplina contém um título e uma descrição
 */
const disciplinas = [
  { title: "Bibliologia", desc: "Estudo sobre a Bíblia, sua inspiração, formação e autoridade." },
  { title: "Homilética", desc: "Arte e técnica da pregação bíblica eficaz." },
  { title: "Cristologia", desc: "Estudo sobre a pessoa e a obra de Jesus Cristo." },
  { title: "Hermenêutica", desc: "Princípios e métodos para interpretação correta das Escrituras." },
  { title: "Escatologia", desc: "Estudo das profecias e dos eventos finais segundo as Escrituras." },
  { title: "Missiologia", desc: "Estratégias e princípios para a expansão do Evangelho." },
];

/**
 * Array com os diferenciais do Instituto
 * Cada diferencial possui ícone, título e descrição dos benefícios
 */
const diferenciais = [
  { icon: BookOpen, title: "Ensino Bíblico Sólido", desc: "Fundamentado nas Escrituras Sagradas, com rigor teológico e fidelidade doutrinária." },
  { icon: Users, title: "Acessível a Todos", desc: "Formação teológica aberta a líderes, obreiros e membros com excelente custo benefício." },
  { icon: Heart, title: "Compromisso Missionário", desc: "Visão global do IDE de Jesus, com atuação local e internacional transformando vidas e ministérios." },
];

/**
 * Array com depoimentos de alunos e líderes que frequentaram o Instituto
 * Contém nome, cargo/função, e texto do depoimento
 */
const depoimentos = [
  { name: "Pra. Débora Vilela", role: "Aluna do núcleo Engenho Novo - Barueri", text: "O instituto tem Sido fundamental para meu crescimento espiritual, oferecendo ensinamentos de grande relevância para minha jornada de fé. Sou grata a Deus, por ter regado minha fé com sabedoria e inspiração, permitindo transformar vidas em minha comunidade." },
  { name: "Pb. Jhonatas da Silva Mota", role: "Aluno do núcleo Jd. Conceição - Osasco", text: "Encontrei no ITS a formação bíblica que tanto buscava: acessível, séria e comprometida com a palavra. Me ajudou muito na reflexão e no estudo prático." },
  { name: "Pr. Norberto Bispo Xerinda", role: "Líder eclesiástico em Moçambique", text: "Durante vários anos, íamos morrendo por falta de conhecimento... Mas conhecemos o ITS que nos ajudou a termos um conhecimento prático e teórico 100% Bíblico. Recomendamos a todos os irmãos que vivam o conhecimento com o Instituto Teológico Servo." },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(25_95%_55%/0.15),transparent_70%)]" />
        <div className="container relative z-10 text-center">
          <img src={logoIts} alt="Logo ITS" className="mx-auto h-20 w-20 rounded-2xl object-contain mb-6" />
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Instituto Teológico Servo
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80 md:text-xl">
            Formando servos fiéis para o Reino de Deus — com ensino bíblico sólido, acessível e comprometido com a missão.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8">
              <Link to="/inscricao">Inscreva-se Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 text-base">
              <Link to="/quem-somos">Conheça o ITS <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Apresentação */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Sobre o Instituto</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              O Instituto Teológico Servo nasceu do desejo de oferecer formação teológica acessível e de qualidade,
              vinculado à Assembleia de Deus — Ministério Família. Nossa missão é capacitar homens e mulheres para um
              serviço cristão mais profundo, fundamentado na Palavra de Deus e comprometido com a expansão do Reino.
            </p>
          </div>
        </div>
      </section>

      {/* Disciplinas */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">Disciplinas Disponíveis</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Conheça algumas das disciplinas oferecidas pelo ITS
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {disciplinas.map((d) => (
              <Card key={d.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <BookOpen className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground">{d.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/cursos">Ver Todos os Cursos <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Núcleo Moçambique */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Globe className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Atuação em Moçambique</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O ITS expandiu sua missão para além das fronteiras brasileiras. Em Moçambique, o instituto mantém um núcleo
                ativo, levando formação teológica de qualidade a líderes e obreiros locais, fortalecendo a igreja e
                impactando comunidades inteiras com o Evangelho.
              </p>
              <Button asChild className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/quem-somos">Saiba Mais</Link>
              </Button>
            </div>
            <img
              src={mocambique2}
              alt="Formatura de alunos do ITS em Moçambique"
              className="h-80 w-full max-w-sm rounded-2xl object-cover object-top shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">Por que escolher o ITS?</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {diferenciais.map((d) => (
              <div key={d.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <d.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">{d.title}</h3>
                <p className="mt-2 text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">O que dizem nossos alunos</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {depoimentos.map((d) => (
              <Card key={d.name} className="relative flex flex-col h-full">
                <CardContent className="flex flex-col flex-1 p-6">
                  <Quote className="mb-3 h-8 w-8 shrink-0 text-secondary/40" />
                  <p className="flex-1 text-sm italic leading-relaxed text-muted-foreground">"{d.text}"</p>
                  <div className="mt-4 border-t pt-4">
                    <p className="font-serif text-sm font-bold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Pronto para iniciar sua jornada teológica?</h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Inscreva-se no Instituto Teológico Servo e aprofunde seu conhecimento bíblico para servir com excelência.
          </p>
          <Button asChild size="lg" className="mt-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8">
            <Link to="/inscricao">Inscreva-se Agora</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
