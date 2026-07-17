# ITS Servo — Design Ideal

Documento-base para o redesign do site institucional. Mapeia, dobra a dobra, o
copy atualmente em produção e um wireframe ASCII simplificado de cada seção.
Serve como ponto de partida: o copy aqui é o copy real hoje publicado — o
redesign pode reescrevê-lo, mas a estrutura de informação e as chamadas para
ação (CTAs) abaixo são o que já está validado com o usuário e deve ser
preservado ou evoluído conscientemente.

Convenções:
- `[Botão]` = call-to-action clicável
- `H1/H2/H3` = hierarquia de título
- Larguras ASCII são ilustrativas (desktop, ~960px), não literais

---

## COMPONENTES GLOBAIS

### HEADER (fixo, todas as páginas)

**Copy:**
- Logo + "ITS" / "Instituto Teológico Servo"
- Nav: Início · Quem Somos · Cursos · Núcleos · Metodologia
- `[Consultar Inscrição]` (outline) · `[Inscreva-se]` (destaque)

```
+----------------------------------------------------------------------+
| [Logo] ITS              Início  Quem Somos  Cursos  Núcleos  Metodo. |
|  Instituto Teológico            [Consultar Inscrição] [Inscreva-se]  |
+----------------------------------------------------------------------+
```
Mobile: logo + hambúrguer → menu colapsável com os mesmos itens empilhados.

### FOOTER (todas as páginas)

**Copy:**
- Coluna 1 — Institucional: logo + "Instituto Teológico Servo" + "Formando
  servos fiéis para o Reino de Deus, com ensino bíblico sólido, acessível e
  comprometido com a edificação da Igreja."
- Coluna 2 — Parcerias: Assembleia de Deus Ministério Família · CNMCB —
  Convenção Nacional dos Ministros de Cristo do Brasil
- Coluna 3 — Links Rápidos: Início, Quem Somos, Cursos, Núcleos,
  Metodologia, Inscrição, Consultar Inscrição
- Coluna 4 — Contato: WhatsApp (11) 97229-4009 · institutoteologicoits@gmail.com
  · São Paulo — SP, Brasil
- Rodapé: © {ano} Instituto Teológico Servo. Todos os direitos reservados.

```
+----------------------------------------------------------------------+
| [Logo] Instituto      Parcerias        Links Rápidos     Contato     |
| Teológico Servo       - AD Ministério  - Início          WhatsApp    |
| "Formando servos        Família        - Quem Somos       (11)97229- |
|  fiéis para o Reino   - CNMCB          - Cursos           4009       |
|  de Deus..."                           - Núcleos         Email       |
|                                         - Metodologia     São Paulo  |
|                                         - Inscrição       - SP       |
|                                         - Consultar                  |
+----------------------------------------------------------------------+
|         © 2026 Instituto Teológico Servo. Todos os direitos          |
+----------------------------------------------------------------------+
```

---

## PÁGINA: HOME (`/`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Formação teológica sólida, acessível e comprometida com a missão"
- Subheadline: "O Instituto Teológico Servo capacita líderes, obreiros e
  membros para servir ao Reino de Deus com mais profundidade e fidelidade
  bíblica."
- `[Quero me inscrever]` (primário) · `[Conheça o ITS →]` (secundário)

```
+----------------------------------------------------------------------+
|                         (fundo azul institucional)                    |
|                             [ Logo ITS ]                              |
|          Formação teológica sólida, acessível e comprometida         |
|                          com a missão                                 |
|     O Instituto Teológico Servo capacita líderes, obreiros e         |
|         membros para servir ao Reino de Deus com mais...             |
|                                                                        |
|         [ Quero me inscrever ]   [ Conheça o ITS → ]                 |
+----------------------------------------------------------------------+
```

### DOBRA 2 — PROVA SOCIAL (números)

**Copy:**
- 6 — Núcleos ativos
- 2 — Países
- 36 — Disciplinas no currículo
- 3 — Níveis de formação

```
+----------------------------------------------------------------------+
|      6              2              36               3                |
|  Núcleos          Países      Disciplinas no    Níveis de            |
|  ativos                        currículo         formação            |
+----------------------------------------------------------------------+
```

### DOBRA 3 — O QUE É ENSINADO (disciplinas)

**Copy:**
- H2: "O que é ensinado?"
- Subhead: "36 disciplinas organizadas em 3 níveis progressivos —
  Fundamental, Básico e Médio."
- Cards (amostra de 6): Bibliologia, Homilética, Cristologia, Hermenêutica,
  Escatologia, Missiologia (cada um com ícone + descrição curta)
- `[Ver grade curricular completa →]`

```
+----------------------------------------------------------------------+
|                     O que é ensinado?                                 |
|         36 disciplinas em 3 níveis progressivos...                   |
|                                                                        |
|  [📖 Bibliologia]   [📖 Homilética]      [📖 Cristologia]            |
|  desc...            desc...              desc...                     |
|                                                                        |
|  [📖 Hermenêutica]  [📖 Escatologia]     [📖 Missiologia]            |
|  desc...            desc...              desc...                     |
|                                                                        |
|               [ Ver grade curricular completa → ]                    |
+----------------------------------------------------------------------+
```

### DOBRA 4 — COMO FUNCIONA (modalidades)

**Copy:**
- H2: "Como funciona?" / "Escolha a modalidade que melhor se encaixa na sua
  rotina."
- Card 1 — Presencial: "Aulas semanais de 1h30 em um dos nossos núcleos. Uma
  disciplina por mês, com material didático incluso." Bullets: Aulas
  semanais · Interação com professores e colegas · 4 núcleos em São Paulo e
  1 em Moçambique
- Card 2 — Por Correspondência: "Receba o material em casa e estude no seu
  ritmo. Disponível para todo o Brasil e exterior." Bullets: Estude onde e
  quando quiser · Material enviado para qualquer localidade · Ideal para
  regiões sem núcleo presencial
- `[Ver metodologia completa →]`

```
+----------------------------------------------------------------------+
|                       Como funciona?                                  |
|                                                                        |
|  +----------------------------+  +----------------------------+       |
|  | [👥] Presencial            |  | [✉] Por Correspondência    |       |
|  | Aulas semanais de 1h30...  |  | Receba o material em casa..|       |
|  | ✓ Aulas semanais           |  | ✓ Estude onde/quando quiser|       |
|  | ✓ Interação c/ professores |  | ✓ Material p/ qualquer     |       |
|  | ✓ 4 núcleos SP + 1 Moç.    |  |   localidade                |       |
|  +----------------------------+  +----------------------------+       |
|                                                                        |
|                  [ Ver metodologia completa → ]                      |
+----------------------------------------------------------------------+
```

### DOBRA 5 — ONDE ESTUDAR (núcleos)

**Copy:**
- H2: "Onde estudar?" / "6 núcleos ativos — presencial em São Paulo e
  Moçambique, ou por correspondência em qualquer lugar."
- Lista: Sede Jd. Santa Mônica (Barueri/SP) · Engenho Novo (Barueri/SP) ·
  Jd. Conceição (Osasco/SP) · Ariston (Carapicuíba/SP) · Maputo
  (Moçambique) · Correspondência (Todo o Brasil e exterior)
- `[Ver detalhes dos núcleos →]`

```
+----------------------------------------------------------------------+
|                        Onde estudar?                                  |
|                                                                        |
|  [📍 Sede Jd. Sta Mônica]  [📍 Engenho Novo]   [📍 Jd. Conceição]    |
|      Barueri/SP               Barueri/SP           Osasco/SP          |
|                                                                        |
|  [📍 Ariston]              [🌐 Maputo]         [✉ Correspondência]   |
|      Carapicuíba/SP           Moçambique           Brasil e exterior  |
|                                                                        |
|                  [ Ver detalhes dos núcleos → ]                      |
+----------------------------------------------------------------------+
```

### DOBRA 6 — QUANTO CUSTA (preços)

**Copy:**
- H2: "Quanto custa?" / "Formação teológica séria com excelente
  custo-benefício."
- Card único — Taxa de inscrição (pagamento único na entrada):
  - Matrícula: R$ 40,00
  - Material didático (apostilas — 3 matérias): R$ 150,00
  - Total: R$ 190,00
- `[Inscreva-se agora]`
- Nota: "Pagamento via PIX após o envio do formulário"

```
+----------------------------------------------------------------------+
|                        Quanto custa?                                  |
|                                                                        |
|              +--------------------------------------+                |
|              | [🎓] Taxa de inscrição                |                |
|              |      Pagamento único na entrada       |                |
|              |                                        |                |
|              | Matrícula .......... R$ 40,00          |                |
|              | Material didático .. R$ 150,00         |                |
|              | -------------------------------------- |                |
|              | Total .............. R$ 190,00         |                |
|              |                                        |                |
|              |       [ Inscreva-se agora ]            |                |
|              |  Pagamento via PIX após envio do form. |                |
|              +--------------------------------------+                |
+----------------------------------------------------------------------+
```

### DOBRA 7 — POR QUE O ITS (diferenciais)

**Copy:**
- H2: "Por que escolher o ITS?"
- Ensino Bíblico Sólido — "Fundamentado nas Escrituras Sagradas, com rigor
  teológico e fidelidade doutrinária."
- Acessível a Todos — "Formação teológica aberta a líderes, obreiros e
  membros com excelente custo-benefício."
- Compromisso Missionário — "Visão global do IDE de Jesus, com atuação
  local e internacional transformando vidas e ministérios."

```
+----------------------------------------------------------------------+
|                   Por que escolher o ITS?                            |
|                                                                        |
|     [📖]                    [👥]                    [❤]              |
|  Ensino Bíblico          Acessível a Todos      Compromisso           |
|  Sólido                                          Missionário          |
|  Fundamentado nas...     Formação aberta a...   Visão global do...    |
+----------------------------------------------------------------------+
```

### DOBRA 8 — DEPOIMENTOS

**Copy:**
- H2: "O que dizem nossos alunos"
- Pra. Débora Vilela (Núcleo Engenho Novo — Barueri): "O instituto tem sido
  fundamental para meu crescimento espiritual..."
- Pb. Jhonatas da Silva Mota (Núcleo Jd. Conceição — Osasco): "Encontrei no
  ITS a formação bíblica que tanto buscava..."
- Pr. Norberto Bispo Xerinda (Líder eclesiástico — Moçambique): "Durante
  vários anos, íamos morrendo por falta de conhecimento..."

```
+----------------------------------------------------------------------+
|                  O que dizem nossos alunos                            |
|                                                                        |
|  " Pra. Débora..."   " Pb. Jhonatas..."    " Pr. Norberto..."        |
|  — Débora Vilela     — Jhonatas Mota       — Norberto Xerinda        |
|    Engenho Novo         Jd. Conceição         Moçambique              |
+----------------------------------------------------------------------+
```

### DOBRA 9 — PRESENÇA EM MOÇAMBIQUE

**Copy:**
- H2: "Presença em Moçambique"
- "O ITS expandiu sua missão para além das fronteiras brasileiras. Em
  Moçambique, o instituto mantém um núcleo ativo, levando formação
  teológica de qualidade a líderes e obreiros locais — fortalecendo a
  igreja e impactando comunidades inteiras."
- `[Conheça nossa história]`
- Imagem: formatura de alunos do ITS em Moçambique

```
+----------------------------------------------------------------------+
|  [🌐]                                    +----------------------+     |
|  Presença em Moçambique                  |                      |     |
|  O ITS expandiu sua missão para          |   [foto formatura     |     |
|  além das fronteiras brasileiras...      |    Moçambique]        |     |
|                                           |                      |     |
|  [ Conheça nossa história ]              +----------------------+     |
+----------------------------------------------------------------------+
```

### DOBRA 10 — CTA FINAL

**Copy:**
- H2: "Pronto para aprofundar seu conhecimento bíblico?"
- "Inscreva-se no ITS e inicie sua formação teológica. Presencial em São
  Paulo e Moçambique, ou por correspondência para qualquer lugar."
- `[Inscreva-se Agora]` (primário) · `[Consultar minha inscrição]`
  (secundário)

```
+----------------------------------------------------------------------+
|                         (fundo azul institucional)                    |
|          Pronto para aprofundar seu conhecimento bíblico?            |
|      Inscreva-se no ITS e inicie sua formação teológica...           |
|                                                                        |
|         [ Inscreva-se Agora ]   [ Consultar minha inscrição ]        |
+----------------------------------------------------------------------+
```

---

## PÁGINA: QUEM SOMOS (`/quem-somos`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Quem Somos"
- Subhead: "Conheça a história, a missão e os valores do Instituto
  Teológico Servo."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                          Quem Somos                                   |
|      Conheça a história, a missão e os valores do Instituto...       |
+----------------------------------------------------------------------+
```

### DOBRA 2 — NÚMEROS DE CREDIBILIDADE

**Copy:** (idênticos à Home) 6 Núcleos ativos · 2 Países · 36 Disciplinas
no currículo · 3 Níveis de formação

```
+----------------------------------------------------------------------+
|      6              2              36               3                |
|  Núcleos          Países      Disciplinas no    Níveis de            |
+----------------------------------------------------------------------+
```

### DOBRA 3 — NOSSA HISTÓRIA

**Copy:**
- H2: "Nossa História"
- P1: "O Instituto Teológico Servo (ITS) foi fundado com o propósito de
  preparar homens e mulheres que desejam aprofundar seu conhecimento
  bíblico e servir ao Senhor Jesus Cristo em obediência à Sua comissão (Mc
  16:15)..."
- P2: "Vinculado à Assembleia de Deus Ministério Família, o ITS nasceu da
  visão de líderes comprometidos com a capacitação de servos..."
- P3: "Desde sua fundação, o instituto dedica-se a oferecer uma formação
  bíblica sólida, contextualizada e prática... mantendo também um núcleo
  ativo de ensino teológico em Moçambique..."
- P4: "Ao longo de sua trajetória, o ITS já formou centenas de alunos,
  muitos dos quais exercem hoje funções como líderes, pastores,
  missionários e cooperadores..."

```
+----------------------------------------------------------------------+
|                       Nossa História                                  |
|   Lorem parágrafo 1 sobre fundação e propósito do ITS...             |
|   Lorem parágrafo 2 sobre vínculo com AD Ministério Família...       |
|   Lorem parágrafo 3 sobre atuação no Brasil e Moçambique...          |
|   Lorem parágrafo 4 sobre formados e impacto...                      |
|                    (coluna única, texto centralizado)                 |
+----------------------------------------------------------------------+
```

### DOBRA 4 — MISSÃO, VISÃO E VALORES

**Copy:**
- H2: "Missão, Visão e Valores"
- Missão: "Formar servos comprometidos com a Palavra de Deus, capacitando-os
  para o ministério cristão com excelência, fidelidade doutrinária e amor
  ao próximo."
- Visão: "Promover maturidade espiritual e fortalecer líderes e educadores
  para uma vida cristã saudável e comprometida."
- Valores: "Fidelidade bíblica, compromisso missionário, acessibilidade,
  excelência no ensino, amor ao próximo e respeito à diversidade
  cultural."

```
+----------------------------------------------------------------------+
|                  Missão, Visão e Valores                              |
|                                                                        |
|   [🎯] Missão          [👁] Visão            [❤] Valores             |
|   Formar servos...     Promover maturidade   Fidelidade bíblica,      |
|                         espiritual...         compromisso...          |
+----------------------------------------------------------------------+
```

### DOBRA 5 — ASSEMBLEIA DE DEUS MINISTÉRIO FAMÍLIA

**Copy:**
- H2: "Assembleia de Deus Ministério Família"
- "O ITS tem parceria com a igreja Assembleia de Deus Ministério Família,
  bem como com a CNMCB (Convenção Nacional dos Ministros de Cristo do
  Brasil) comprometidas com a evangelização, o discipulado e a formação de
  líderes cristãos. Essa ligação institucional garante que o ensino do
  instituto esteja alinhado com os princípios pentecostais e a sã
  doutrina."

```
+----------------------------------------------------------------------+
|            Assembleia de Deus Ministério Família                      |
|     O ITS tem parceria com a igreja Assembleia de Deus...            |
|                  (texto centralizado, coluna única)                   |
+----------------------------------------------------------------------+
```

### DOBRA 6 — IMPACTO EM MOÇAMBIQUE

**Copy:**
- H2: "Impacto em Moçambique"
- "Em Moçambique, o ITS mantém um núcleo dedicado à formação de líderes e
  obreiros locais. O impacto do instituto naquele país tem sido
  significativo: comunidades fortalecidas, líderes mais preparados e
  igrejas edificadas sobre fundamentos bíblicos sólidos."
- "A atuação em Moçambique reflete a vocação missionária do ITS e seu
  compromisso com a expansão do Evangelho além das fronteiras nacionais."
- `[Inscreva-se]`
- Imagem: entrega de certificado do ITS em Moçambique

```
+----------------------------------------------------------------------+
|  +----------------------+   Impacto em Moçambique                    |
|  |                      |   Em Moçambique, o ITS mantém um núcleo... |
|  |  [foto certificado    |   A atuação em Moçambique reflete...      |
|  |   Moçambique]         |                                            |
|  |                      |   [ Inscreva-se ]                          |
|  +----------------------+                                            |
+----------------------------------------------------------------------+
```

### DOBRA 7 — O LEMA

**Copy:**
- H2: "O Lema"
- Citação: "Procura apresentar-te a Deus aprovado como obreiro, que não tem
  do que se envergonhar, e que maneja bem a palavra da verdade (2 Timóteo
  2:15)"

```
+----------------------------------------------------------------------+
|                            [📖]                                       |
|                          O Lema                                       |
|     " Procura apresentar-te a Deus aprovado como obreiro, que        |
|       não tem do que se envergonhar, e que maneja bem a palavra      |
|       da verdade (2 Timóteo 2:15) "                                  |
+----------------------------------------------------------------------+
```

---

## PÁGINA: CURSOS / GRADE CURRICULAR (`/cursos`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Grade Curricular"
- Subhead: "Nossa formação é dividida em três níveis progressivos:
  Fundamental, Básico e Médio."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                       Grade Curricular                                |
|     Nossa formação é dividida em três níveis progressivos...         |
+----------------------------------------------------------------------+
```

### DOBRA 2 — NÍVEL FUNDAMENTAL (12 matérias)

**Copy:**
- H2: "Nível Fundamental — 12 matérias"
- "Base sólida na fé cristã com 12 matérias essenciais para o início da
  formação teológica."
- Matérias: Bibliologia, Administração Eclesiástica, Doutrina de Deus,
  Família Cristã, Hamartiologia, Homilética, Antropologia, Ministério
  Pastoral, O Pentateuco, Missiologia, Paracletologia, Liderança Cristã

```
+----------------------------------------------------------------------+
| [🎓] Nível Fundamental — 12 matérias                                 |
|      Base sólida na fé cristã com 12 matérias essenciais...          |
|                                                                        |
|  [📖 Bibliologia]   [📖 Adm. Eclesiástica]  [📖 Doutrina de Deus]    |
|  [📖 Família Cristã][📖 Hamartiologia]      [📖 Homilética]          |
|  [📖 Antropologia]  [📖 Ministério Pastoral][📖 O Pentateuco]        |
|  [📖 Missiologia]   [📖 Paracletologia]     [📖 Liderança Cristã]    |
+----------------------------------------------------------------------+
```

### DOBRA 3 — NÍVEL BÁSICO (24 matérias)

**Copy:**
- H2: "Nível Básico — 24 matérias"
- "Aprofundamento teológico com 24 matérias, expandindo os fundamentos
  para uma compreensão mais ampla."
- Inclui as 12 do Fundamental + Soteriologia, Tipologia, Evangelismo,
  Livros Históricos 1, Os Evangelhos, Evangelismo/Integração e
  Discipulado, Cristologia, Eclesiologia, Atos dos Apóstolos, Ética Cristã,
  Epístolas Paulinas, Mordomia Cristã

```
+----------------------------------------------------------------------+
| [🎓] Nível Básico — 24 matérias                                      |
|      Aprofundamento teológico com 24 matérias...                     |
|                                                                        |
|  (grid de 24 cards de matéria, mesmo padrão visual do nível acima)   |
+----------------------------------------------------------------------+
```

### DOBRA 4 — NÍVEL MÉDIO (36 matérias)

**Copy:**
- H2: "Nível Médio — 36 matérias"
- "Formação completa com 36 matérias, abrangendo todo o currículo
  teológico do ITS."
- Inclui as 24 do Básico + Hermenêutica, Livros Poéticos, Livros Proféticos
  1 e 2, Batalha Espiritual, Livros Históricos 2, Epístolas Gerais,
  Geografia Bíblica, Escatologia, Angelologia, Doutrinas Bíblicas,
  Soteriologia

```
+----------------------------------------------------------------------+
| [🎓] Nível Médio — 36 matérias                                       |
|      Formação completa com 36 matérias...                            |
|                                                                        |
|  (grid de 36 cards de matéria, mesmo padrão visual dos níveis acima) |
+----------------------------------------------------------------------+
```

### DOBRA 5 — NOTA DE RODAPÉ CURRICULAR

**Copy:**
- "Todos os núcleos compartilham a mesma grade curricular, variando apenas
  a sequência de aprendizado."
- `[Conheça nossos Núcleos →]`

```
+----------------------------------------------------------------------+
|   Todos os núcleos compartilham a mesma grade curricular...          |
|                [ Conheça nossos Núcleos → ]                          |
+----------------------------------------------------------------------+
```

### DOBRA 6 — CTA FINAL

**Copy:**
- H2: "Quer fazer parte?"
- "Inscreva-se e inicie sua formação teológica no ITS."
- `[Inscreva-se Agora]`

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                     Quer fazer parte?                                 |
|         Inscreva-se e inicie sua formação teológica no ITS.          |
|                    [ Inscreva-se Agora ]                              |
+----------------------------------------------------------------------+
```

---

## PÁGINA: METODOLOGIA (`/metodologia`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Metodologia e Material Didático"
- Subhead: "Entenda como funciona o ensino no Instituto Teológico Servo."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                Metodologia e Material Didático                        |
|         Entenda como funciona o ensino no Instituto...               |
+----------------------------------------------------------------------+
```

### DOBRA 2 — METODOLOGIA DE ENSINO

**Copy:**
- H2: "Metodologia de Ensino"
- P1: "O Instituto Teológico Servo (ITS) adota uma metodologia de ensino
  cíclica, que permite ao aluno ingressar no curso no início de qualquer
  disciplina, independentemente do grau escolhido..."
- P2: "Nosso modelo integra fundamentação teórica consistente com
  aplicação prática ministerial, sempre alicerçada nas Escrituras
  Sagradas..."
- P3: "A abordagem cíclica assegura que os principais fundamentos da fé
  sejam continuamente revisitados e aprofundados..."
- H3: "Corpo Docente" — "O ITS conta com professores que são líderes e
  teólogos em atuação — com experiência pastoral e formação acadêmica...
  Não é teoria sem prática: cada professor ministra aquilo que vive."
- H3: "Acompanhamento e Desenvolvimento do Aluno" — "O processo formativo
  inclui acompanhamento personalizado, com tutoria individual e atividades
  em grupo..."

```
+----------------------------------------------------------------------+
|                    Metodologia de Ensino                              |
|   Lorem parágrafo 1 — metodologia cíclica...                         |
|   Lorem parágrafo 2 — teoria + prática ministerial...                |
|   Lorem parágrafo 3 — revisão contínua dos fundamentos...            |
|                                                                        |
|   Corpo Docente                                                       |
|   O ITS conta com professores que são líderes e teólogos...          |
|                                                                        |
|   Acompanhamento e Desenvolvimento do Aluno                          |
|   O processo formativo inclui acompanhamento personalizado...         |
|                    (coluna única, texto alinhado à esquerda)          |
+----------------------------------------------------------------------+
```

### DOBRA 3 — ESTRUTURA PEDAGÓGICA

**Copy:**
- H2: "Estrutura Pedagógica"
- Módulos Temáticos: "O conteúdo é organizado em módulos progressivos,
  permitindo que o aluno avance gradualmente no aprendizado teológico."
- Carga Horária: "Cada disciplina tem duração de aproximadamente 1 mês, com
  aulas semanais de 1h30 — totalizando cerca de 6 horas/aula por
  disciplina."
- Material Didático: "Apostilas próprias, textos bíblicos selecionados e
  material complementar preparado por professores especializados."
- Avaliações: "Avaliações contínuas incluindo trabalhos escritos,
  participação em sala e provas ao final de cada módulo."

```
+----------------------------------------------------------------------+
|                     Estrutura Pedagógica                              |
|                                                                        |
|  [📖] Módulos Temáticos          [⏰] Carga Horária                  |
|  O conteúdo é organizado em...   Cada disciplina tem duração de...    |
|                                                                        |
|  [📄] Material Didático          [✓] Avaliações                      |
|  Apostilas próprias, textos...   Avaliações contínuas incluindo...    |
+----------------------------------------------------------------------+
```

### DOBRA 4 — CTA FINAL

**Copy:**
- H2: "Ensino Acessível, Bíblico e Prático"
- "O ITS acredita que a formação teológica deve ser acessível a todos,
  independentemente de sua formação acadêmica prévia. Nosso compromisso é
  oferecer um ensino que seja ao mesmo tempo rigoroso em seu fundamento
  bíblico e prático em sua aplicação ao ministério e à vida cristã
  cotidiana."
- `[Inscreva-se Agora]`

```
+----------------------------------------------------------------------+
|             Ensino Acessível, Bíblico e Prático                       |
|    O ITS acredita que a formação teológica deve ser acessível...     |
|                    [ Inscreva-se Agora ]                              |
+----------------------------------------------------------------------+
```

---

## PÁGINA: NÚCLEOS (`/nucleos`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Nossos Núcleos"
- Subhead: "O ITS está presente em diversas localidades, levando formação
  teológica de qualidade para onde há necessidade."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                      Nossos Núcleos                                   |
|   O ITS está presente em diversas localidades, levando formação...   |
+----------------------------------------------------------------------+
```

### DOBRA 2 — GRID DE NÚCLEOS

**Copy:**
- Intro: "Todos os núcleos compartilham a mesma grade curricular, variando
  apenas a sequência de aprendizado das matérias. Isso garante a mesma
  qualidade e profundidade em qualquer localidade."
- Sede Jd. Santa Mônica — Barueri/SP — Assembleia de Deus Ministério
  Família — Presencial
- Engenho Novo — Barueri/SP — Assembleia de Deus Ministério Família —
  Presencial
- Jd. Conceição — Osasco/SP — Assembleia de Deus Ministério Família —
  Presencial
- Ariston — Carapicuíba/SP — Assembleia de Deus Ministério Família —
  Presencial
- Maputo — Moçambique — Núcleo missionário internacional — Presencial
- Correspondência — Todo o Brasil e exterior — Material enviado para
  qualquer endereço — À distância
- `[Ver Grade Curricular →]`

```
+----------------------------------------------------------------------+
|   Todos os núcleos compartilham a mesma grade curricular...          |
|                                                                        |
|  [📍] Sede Jd. Sta Mônica   [📍] Engenho Novo    [📍] Jd. Conceição  |
|       Barueri — SP               Barueri — SP        Osasco — SP     |
|       AD Ministério Família      AD Min. Família      AD Min. Família |
|       (Presencial)                (Presencial)         (Presencial)   |
|                                                                        |
|  [📍] Ariston                [🌐] Maputo         [✉] Correspondência |
|       Carapicuíba — SP            Moçambique          Brasil/exterior |
|       AD Ministério Família       Núcleo missionário  Material p/     |
|       (Presencial)                (Presencial)        qq endereço     |
|                                                        (À distância)   |
|                                                                        |
|                  [ Ver Grade Curricular → ]                          |
+----------------------------------------------------------------------+
```

### DOBRA 3 — CONTATO / QUAL NÚCLEO ESCOLHER

**Copy:**
- "Não sabe qual núcleo fica mais próximo de você?"
- "Entre em contato via WhatsApp: (11) 97229-4009" (link)

```
+----------------------------------------------------------------------+
|         +------------------------------------------------+           |
|         |  Não sabe qual núcleo fica mais próximo?        |           |
|         |  Entre em contato via WhatsApp: (11) 97229-4009 |           |
|         +------------------------------------------------+           |
+----------------------------------------------------------------------+
```

### DOBRA 4 — CTA FINAL

**Copy:**
- H2: "Estude no núcleo mais próximo de você"
- "Inscreva-se e inicie sua formação teológica no ITS."
- `[Inscreva-se Agora]`

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|              Estude no núcleo mais próximo de você                   |
|         Inscreva-se e inicie sua formação teológica no ITS.          |
|                    [ Inscreva-se Agora ]                              |
+----------------------------------------------------------------------+
```

---

## PÁGINA: CONSULTAR INSCRIÇÃO (`/consulta`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Consultar Inscrição"
- Subhead: "Encontre sua inscrição, acompanhe o status e acesse a página de
  pagamento."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                    Consultar Inscrição                                |
|      Encontre sua inscrição, acompanhe o status e acesse...          |
+----------------------------------------------------------------------+
```

### DOBRA 2 — FORMULÁRIO DE BUSCA

**Copy:**
- Card: "Buscar Inscrição"
- Tabs: "Nº de Inscrição" | "CPF"
  - Aba Nº: campo "Número da inscrição" (placeholder "Ex: ITS2026-0001") +
    `[Buscar]`
  - Aba CPF: campo "CPF" (placeholder "000.000.000-00") + `[Buscar]`

```
+----------------------------------------------------------------------+
|              +--------------------------------------+                |
|              | [🔍] Buscar Inscrição                 |                |
|              |                                        |                |
|              |  [Nº de Inscrição] [CPF]  <- tabs      |                |
|              |  Número da inscrição                  |                |
|              |  [ Ex: ITS2026-0001______________ ]   |                |
|              |          [ Buscar ]                    |                |
|              +--------------------------------------+                |
+----------------------------------------------------------------------+
```

### DOBRA 3 — RESULTADOS DA BUSCA

**Copy:**
- "Inscrição encontrada" / "N inscrições encontradas"
- Por card: nome, número da inscrição (copiável), badge de status
  (Aguardando Pagamento / Comprovante Enviado / Matrícula Confirmada /
  Pagamento Não Identificado / Cancelada), modalidade, data
- "Ver detalhes completos" (expansível): CPF, telefone, e-mail, nascimento,
  escolaridade, núcleo
- Ações condicionais por status:
  - Aguardando Pagamento → `[Ir para Pagamento]` + `[Cancelar Inscrição]`
  - Comprovante Enviado → "Comprovante já enviado — aguardando análise."
  - Confirmada → "✓ Matrícula confirmada!"
  - Pagamento Não Identificado → "⚠ Pagamento não identificado. Envie um
    novo comprovante." + `[Reenviar Comprovante]`
  - Cancelada → "Esta inscrição foi cancelada."

```
+----------------------------------------------------------------------+
|   Inscrição encontrada                                                |
|                                                                        |
|   +----------------------------------------------------------+       |
|   | Nome Completo               [Status: Aguardando Pagto]   |       |
|   | ITS2026-0001 [copiar]                                     |       |
|   | Modalidade: Presencial      Data: 01/01/2026               |       |
|   | v Ver detalhes completos                                   |       |
|   |                                                              |       |
|   | [ Ir para Pagamento ]     [ Cancelar Inscrição ]           |       |
|   +----------------------------------------------------------+       |
+----------------------------------------------------------------------+
```

### DOBRA 4 — DIÁLOGO DE CANCELAMENTO (modal, sob demanda)

**Copy:**
- Título: "Cancelar Inscrição?"
- Descrição: "Esta ação não pode ser desfeita. A inscrição será cancelada
  permanentemente e você precisará realizar uma nova inscrição caso deseje
  continuar."
- `[Voltar]` · `[Sim, cancelar inscrição]`

```
              +--------------------------------------+
              |  Cancelar Inscrição?                  |
              |  Esta ação não pode ser desfeita...   |
              |                                        |
              |     [ Voltar ]  [ Sim, cancelar ]     |
              +--------------------------------------+
```

---

## PÁGINA: INSCRIÇÃO (`/inscricao`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Inscrição"
- Subhead: "Preencha o formulário abaixo para se inscrever no Instituto
  Teológico Servo."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                          Inscrição                                    |
|    Preencha o formulário abaixo para se inscrever no Instituto...    |
+----------------------------------------------------------------------+
```

### DOBRA 2 — DADOS PESSOAIS (formulário, parte 1)

**Copy:**
- Card: "Dados Pessoais"
- Campos: Nome completo* · CPF* · Telefone/WhatsApp* · E-mail* · Data de
  nascimento* · Grau de escolaridade* (Ensino Fundamental, Ensino Médio,
  Ensino Superior, Pós-graduação, Outro)

```
+----------------------------------------------------------------------+
|   Dados Pessoais                                                      |
|   Nome completo *                                                     |
|   [_____________________________________________]                    |
|   CPF *                        Telefone / WhatsApp *                 |
|   [_______________]            [_______________]                     |
|   E-mail *                                                            |
|   [_____________________________________________]                    |
|   Data de nascimento *         Grau de escolaridade *                |
|   [___/___/______]             [ Selecione... v ]                    |
+----------------------------------------------------------------------+
```

### DOBRA 3 — DADOS ACADÊMICOS (formulário, parte 2)

**Copy:**
- Card: "Dados Acadêmicos"
- Modalidade* (radio): Presencial / Por Correspondência
- Se Presencial → Núcleo* (select): Sede Jd. Santa Mônica (Barueri/SP) ·
  Engenho Novo (Barueri/SP) · Jd. Conceição (Osasco/SP) · Ariston
  (Carapicuíba/SP) · Maputo (Moçambique)
- `[Continuar para Pagamento]`

```
+----------------------------------------------------------------------+
|   Dados Acadêmicos                                                    |
|   Modalidade *                                                        |
|   ( ) Presencial     ( ) Por Correspondência                          |
|                                                                        |
|   Núcleo *  (visível apenas se "Presencial")                         |
|   [ Selecione o núcleo... v ]                                        |
|                                                                        |
|              [ Continuar para Pagamento ]                            |
+----------------------------------------------------------------------+
```

---

## PÁGINA: PAGAMENTO (`/inscricao/pagamento/:numero`)

### DOBRA 1 — HERO

**Copy:**
- H1: "Pagamento"
- Subhead: "Realize o pagamento via PIX e envie o comprovante."

```
+----------------------------------------------------------------------+
|                    (fundo azul institucional)                         |
|                          Pagamento                                    |
|         Realize o pagamento via PIX e envie o comprovante.           |
+----------------------------------------------------------------------+
```

### DOBRA 2 — DADOS DA INSCRIÇÃO + VALORES

**Copy:**
- Card "Dados da Inscrição": Número · Aluno
- Card "Valores": Matrícula R$ 40,00 · Material (Apostila 3 matérias)
  R$ 150,00 · Total R$ 190,00

```
+----------------------------------------------------------------------+
|   Dados da Inscrição              Valores                            |
|   Número: ITS2026-0001            Matrícula ........ R$ 40,00        |
|   Aluno: Nome Completo            Material .......... R$ 150,00      |
|                                    ------------------------------     |
|                                    Total ............. R$ 190,00      |
+----------------------------------------------------------------------+
```

### DOBRA 3 — DADOS PARA PAGAMENTO (PIX)

**Copy:**
- Card "Dados para Pagamento (PIX)"
- Chave PIX: 20.424.935/0001-02 (copiável)
- Favorecido: Instituto Teológico Servo
- Banco: Cora

```
+----------------------------------------------------------------------+
|   Dados para Pagamento (PIX)                                          |
|   Chave PIX: 20.424.935/0001-02             [copiar]                 |
|   Favorecido: Instituto Teológico Servo                              |
|   Banco: Cora                                                         |
+----------------------------------------------------------------------+
```

### DOBRA 4 — ENVIAR COMPROVANTE

**Copy:**
- Card "Enviar Comprovante"
- "Comprovante de pagamento (JPG, PNG ou PDF, máx 5MB)"
- Dropzone: "Clique para selecionar o arquivo"
- `[Enviar Comprovante]`

```
+----------------------------------------------------------------------+
|   Enviar Comprovante                                                   |
|   Comprovante de pagamento (JPG, PNG ou PDF, máx 5MB)                |
|   +----------------------------------------------------+             |
|   |          [⬆]  Clique para selecionar o arquivo      |             |
|   +----------------------------------------------------+             |
|                  [ Enviar Comprovante ]                              |
+----------------------------------------------------------------------+
```

### DOBRA 5 — ESTADO: COMPROVANTE ENVIADO (confirmação)

**Copy:**
- H1: "Comprovante Enviado!"
- "Seu pagamento está em análise. Você receberá um e-mail com a
  confirmação em breve."
- Resumo: Número da inscrição · Aluno

```
+----------------------------------------------------------------------+
|                            [✓]                                        |
|                   Comprovante Enviado!                                |
|     Seu pagamento está em análise. Você receberá um e-mail...        |
|                                                                        |
|     +--------------------------------------------+                   |
|     | Número da inscrição: ITS2026-0001            |                   |
|     | Aluno: Nome Completo                          |                   |
|     +--------------------------------------------+                   |
+----------------------------------------------------------------------+
```

### DOBRA 6 — ESTADO: INSCRIÇÃO NÃO ENCONTRADA

**Copy:**
- H1: "Inscrição não encontrada"
- "Verifique o número da inscrição e tente novamente."

```
+----------------------------------------------------------------------+
|                  Inscrição não encontrada                             |
|         Verifique o número da inscrição e tente novamente.           |
+----------------------------------------------------------------------+
```

---

## RESUMO DE JORNADA (fluxo entre páginas)

```
Home ──┬─→ Quem Somos ─────────────┐
       ├─→ Cursos ──────────────────┤
       ├─→ Núcleos ─────────────────┼─→ Inscrição ──→ Pagamento ──→ (confirmação por e-mail)
       ├─→ Metodologia ─────────────┘         ▲
       └─→ Consultar Inscrição ────────────────┘ (retomar pagamento / reenviar comprovante / cancelar)
```

## PRÓXIMOS PASSOS SUGERIDOS PARA O REDESIGN

- Definir se o copy será reescrito integralmente ou apenas redesenhado
  visualmente (hoje o copy é funcional, mas repetitivo entre páginas —
  ex.: números de credibilidade e CTAs finais aparecem quase idênticos em
  Home, Cursos, Núcleos).
- Avaliar consolidar "Quanto custa" + "Dados PIX" num fluxo mais visual de
  progresso (Inscrição → Pagamento → Confirmação) com indicador de etapas.
- Padronizar os 5 estados de status de inscrição (cores/ícones) como um
  componente reutilizável, já que aparecem em Consulta e Pagamento.
