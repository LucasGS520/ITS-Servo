import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Globe, BookOpen } from "lucide-react";
import mocambique1 from "@/assets/mocambique1.png";

const QuemSomos = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">Quem Somos</h1>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-lg">
            Conheça a história, a missão e os valores do Instituto Teológico Servo.
          </p>
        </div>
      </section>

      {/* História */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Nossa História</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                O Instituto Teológico Servo (ITS) foi fundado com o propósito de preparar homens e mulheres que desejam
                aprofundar seu conhecimento bíblico e servir ao Senhor Jesus Cristo em obediência à Sua comissão (Mc 16:15).
                Com perfil interdenominacional, o instituto promove uma formação teológica comprometida com a centralidade
                das Escrituras e com a missão da Igreja.
              </p>
              <p>
                Vinculado à Assembleia de Deus Ministério Família, o ITS nasceu da visão de líderes comprometidos com a
                capacitação de servos aptos a atuar com responsabilidade, maturidade espiritual e fundamentação doutrinária
                no Reino de Deus.
              </p>
              <p>
                Desde sua fundação, o instituto dedica-se a oferecer uma formação bíblica sólida, contextualizada e prática.
                Sua atuação ultrapassa o território brasileiro, mantendo também um núcleo ativo de ensino teológico em
                Moçambique, ampliando seu alcance missionário e educacional.
              </p>
              <p>
                Ao longo de sua trajetória, o ITS já formou centenas de alunos, muitos dos quais exercem hoje funções como
                líderes, pastores, missionários e cooperadores em suas comunidades, contribuindo para o fortalecimento da
                Igreja e a expansão do Evangelho.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">Missão, Visão e Valores</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Target className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">Missão</h3>
              <p className="mt-3 text-muted-foreground">
                Formar servos comprometidos com a Palavra de Deus, capacitando-os para o ministério cristão com
                excelência, fidelidade doutrinária e amor ao próximo.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Eye className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">Visão</h3>
              <p className="mt-3 text-muted-foreground">
                Promover maturidade espiritual e fortalecer líderes e educadores para uma vida cristã saudável e comprometida.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                <Heart className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">Valores</h3>
              <p className="mt-3 text-muted-foreground">
                Fidelidade bíblica, compromisso missionário, acessibilidade, excelência no ensino, amor ao próximo
                e respeito à diversidade cultural.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ministério Família */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Assembleia de Deus Ministério Família</h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              O ITS tem parceria com a igreja Assembleia de Deus Ministério Família, bem como com a CNMCB (Convenção
              Nacional dos Ministros de Cristo do Brasil) comprometidas com a evangelização, o discipulado e a formação
              de líderes cristãos. Essa ligação institucional garante que o ensino do instituto esteja alinhado com os
              princípios pentecostais e a sã doutrina.
            </p>
          </div>
        </div>
      </section>

      {/* Moçambique */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col items-center gap-8 lg:flex-row">
            <img
              src={mocambique1}
              alt="Entrega de certificado do ITS em Moçambique"
              className="h-64 w-full max-w-sm rounded-2xl object-cover shadow-md md:h-80"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Impacto em Moçambique</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Em Moçambique, o ITS mantém um núcleo dedicado à formação de líderes e obreiros locais. O impacto
                do instituto naquele país tem sido significativo: comunidades fortalecidas, líderes mais preparados
                e igrejas edificadas sobre fundamentos bíblicos sólidos.
              </p>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                A atuação em Moçambique reflete a vocação missionária do ITS e seu compromisso com a expansão do
                Evangelho além das fronteiras nacionais.
              </p>
              <Button asChild className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/inscricao">Inscreva-se</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lema */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">O Lema</h2>
            <blockquote className="mt-6 text-xl italic leading-relaxed text-muted-foreground">
              "Procura apresentar-te a Deus aprovado como obreiro, que não tem do que se envergonhar, e que maneja
              bem a palavra da verdade (2 Timóteo 2:15)"
            </blockquote>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default QuemSomos;
