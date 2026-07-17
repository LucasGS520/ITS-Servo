import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Globe, Users, Heart, ChevronRight,
  Quote, MapPin, Mail, CheckCircle, GraduationCap,
} from "lucide-react";
import logoIts from "@/assets/logo-its.jpeg";
import mocambique2 from "@/assets/mocambique2.png";

const disciplinas = [
  { title: "Bibliologia", desc: "Estudo sobre a Bíblia, sua inspiração, formação e autoridade." },
  { title: "Homilética", desc: "Arte e técnica da pregação bíblica eficaz." },
  { title: "Cristologia", desc: "Estudo sobre a pessoa e a obra de Jesus Cristo." },
  { title: "Hermenêutica", desc: "Princípios e métodos para interpretação correta das Escrituras." },
  { title: "Escatologia", desc: "Estudo das profecias e dos eventos finais segundo as Escrituras." },
  { title: "Missiologia", desc: "Estratégias e princípios para a expansão do Evangelho." },
];

const nucleosResumo = [
  { nome: "Sede Jd. Santa Mônica", cidade: "Barueri/SP", icon: MapPin },
  { nome: "Engenho Novo", cidade: "Barueri/SP", icon: MapPin },
  { nome: "Jd. Conceição", cidade: "Osasco/SP", icon: MapPin },
  { nome: "Ariston", cidade: "Carapicuíba/SP", icon: MapPin },
  { nome: "Maputo", cidade: "Moçambique", icon: Globe },
  { nome: "Correspondência", cidade: "Todo o Brasil e exterior", icon: Mail },
];

const diferenciais = [
  { icon: BookOpen, title: "Ensino Bíblico Sólido", desc: "Fundamentado nas Escrituras Sagradas, com rigor teológico e fidelidade doutrinária." },
  { icon: Users, title: "Acessível a Todos", desc: "Formação teológica aberta a líderes, obreiros e membros com excelente custo-benefício." },
  { icon: Heart, title: "Compromisso Missionário", desc: "Visão global do IDE de Jesus, com atuação local e internacional transformando vidas e ministérios." },
];

const depoimentos = [
  { name: "Pra. Débora Vilela", role: "Núcleo Engenho Novo — Barueri", text: "O instituto tem sido fundamental para meu crescimento espiritual, oferecendo ensinamentos de grande relevância para minha jornada de fé. Sou grata a Deus por ter regado minha fé com sabedoria e inspiração, permitindo transformar vidas em minha comunidade." },
  { name: "Pb. Jhonatas da Silva Mota", role: "Núcleo Jd. Conceição — Osasco", text: "Encontrei no ITS a formação bíblica que tanto buscava: acessível, séria e comprometida com a palavra. Me ajudou muito na reflexão e no estudo prático." },
  { name: "Pr. Norberto Bispo Xerinda", role: "Líder eclesiástico — Moçambique", text: "Durante vários anos, íamos morrendo por falta de conhecimento... Mas conhecemos o ITS que nos ajudou a termos um conhecimento prático e teórico 100% Bíblico. Recomendamos a todos os irmãos." },
];

const Home = () => {
  return (
    <>
      {/* ── 1. HERO — Quem é o ITS? ── */}
      <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(25_95%_55%/0.15),transparent_70%)]" />
        <div className="container relative z-10 text-center">
          <img src={logoIts} alt="Logo ITS" className="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain" />
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Formação teológica sólida,<br className="hidden md:block" /> acessível e comprometida com a missão
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80 md:text-xl">
            O Instituto Teológico Servo capacita líderes, obreiros e membros para servir ao Reino de Deus com mais profundidade e fidelidade bíblica.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 text-base">
              <Link to="/inscricao">Quero me inscrever</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 text-base">
              <Link to="/quem-somos">Conheça o ITS <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. PROVA SOCIAL — Números rápidos ── */}
      <section className="border-b bg-card py-10">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { valor: "6", label: "Núcleos ativos" },
              { valor: "2", label: "Países" },
              { valor: "36", label: "Disciplinas no currículo" },
              { valor: "3", label: "Níveis de formação" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-3xl font-bold text-primary md:text-4xl">{item.valor}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. O QUE É ENSINADO? — Disciplinas ── */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">O que é ensinado?</h2>
            <p className="mt-3 text-muted-foreground">
              36 disciplinas organizadas em 3 níveis progressivos — Fundamental, Básico e Médio.
            </p>
          </div>
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
              <Link to="/cursos">Ver grade curricular completa <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 4. COMO FUNCIONA? — Modalidades ── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Como funciona?</h2>
            <p className="mt-3 text-muted-foreground">
              Escolha a modalidade que melhor se encaixa na sua rotina.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">Presencial</h3>
                <p className="mt-2 text-muted-foreground">
                  Aulas semanais de 1h30 em um dos nossos núcleos. Uma disciplina por mês, com material didático incluso.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Aulas semanais", "Interação com professores e colegas", "4 núcleos em São Paulo e 1 em Moçambique"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 shrink-0 text-secondary" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Mail className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">Por Correspondência</h3>
                <p className="mt-2 text-muted-foreground">
                  Receba o material em casa e estude no seu ritmo. Disponível para todo o Brasil e exterior.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Estude onde e quando quiser", "Material enviado para qualquer localidade", "Ideal para regiões sem núcleo presencial"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 shrink-0 text-secondary" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/metodologia">Ver metodologia completa <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5. ONDE ESTUDAR? — Núcleos ── */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Onde estudar?</h2>
            <p className="mt-3 text-muted-foreground">
              6 núcleos ativos — presencial em São Paulo e Moçambique, ou por correspondência em qualquer lugar.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nucleosResumo.map((n) => (
              <div key={n.nome} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <n.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{n.nome}</p>
                  <p className="text-xs text-muted-foreground">{n.cidade}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/nucleos">Ver detalhes dos núcleos <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 6. QUANTO CUSTA? — Preços ── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Quanto custa?</h2>
            <p className="mt-3 text-muted-foreground">
              Formação teológica séria com excelente custo-benefício.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-md">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Taxa de inscrição</p>
                    <p className="text-sm text-muted-foreground">Pagamento único na entrada</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Matrícula</span>
                    <span className="font-medium text-foreground">R$ 40,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material didático (apostilas — 3 matérias)</span>
                    <span className="font-medium text-foreground">R$ 150,00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">R$ 190,00</span>
                  </div>
                </div>
                <Button asChild className="mt-6 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Link to="/inscricao">Inscreva-se agora</Link>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Pagamento via PIX após o envio do formulário
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 7. POR QUE O ITS? — Diferenciais ── */}
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

      {/* ── 8. DEPOIMENTOS ── */}
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

      {/* ── 9. PRESENÇA EM MOÇAMBIQUE ── */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Globe className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Presença em Moçambique</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O ITS expandiu sua missão para além das fronteiras brasileiras. Em Moçambique, o instituto mantém um núcleo ativo, levando formação teológica de qualidade a líderes e obreiros locais — fortalecendo a igreja e impactando comunidades inteiras.
              </p>
              <Button asChild className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/quem-somos">Conheça nossa história</Link>
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

      {/* ── 10. CTA FINAL ── */}
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Pronto para aprofundar seu conhecimento bíblico?</h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Inscreva-se no ITS e inicie sua formação teológica. Presencial em São Paulo e Moçambique, ou por correspondência para qualquer lugar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 text-base">
              <Link to="/inscricao">Inscreva-se Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 text-base">
              <Link to="/consulta">Consultar minha inscrição</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
