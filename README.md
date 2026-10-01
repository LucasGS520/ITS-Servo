# Plataforma ITS-Servo

Monorepo da plataforma do Instituto Teológico Servo — **dois produtos** sobre uma
fundação compartilhada. Ver a definição completa em
[`docs/DESENHO_CONTROLE_OPERACIONAL.md`](docs/DESENHO_CONTROLE_OPERACIONAL.md).

- **Produto A — Site Institucional** (`apps/site`): público, estático (Astro),
  adquire, informa e converte visitantes. O formulário apenas **solicita** uma
  inscrição e encaminha o candidato para a Central; não opera pagamento, status
  ou comprovantes.
- **Produto B — Central Operacional** (`apps/central`): interno (React + Vite +
  Supabase), registra, acompanha, valida e confirma inscrições, além de operar o
  **financeiro completo** (livro-caixa por
  unidade, relatórios mensais imprimíveis, visão anual — substitui a planilha),
  documentos e indicadores; expõe uma superfície pública de autosserviço travada
  por token (`/inscricao/pagamento/:numero` e `/consulta`). **Não serve conteúdo
  institucional** — rotas de marketing redirecionam para o Site (`VITE_SITE_URL`).

```
ITS Servo
├── Site Institucional       → aquisição e conversão de visitantes
├── Central de Operações     → execução e administração da operação
└── Supabase + packages      → contrato, dados, autenticação e regras comuns
```

---

## Estrutura

```
its-servo/
├── apps/
│   ├── site/            # Produto A — Site Institucional (Astro/SSG)
│   └── central/         # Produto B — Central Operacional (React SPA + Supabase)
├── packages/
│   ├── design-system/   # tokens da marca + estilos (fonte única) + referência (ds1.html)
│   └── supabase/        # client + types + contrato tipado (RPC/edge)
├── supabase/            # migrations + edge functions (backend)
├── docs/DESENHO_CONTROLE_OPERACIONAL.md # estado atual, avaliação e arquitetura-alvo
├── design_ideal.md      # referência de copy/layout do Site
└── pnpm-workspace.yaml
```

### Site Institucional

Local: `apps/site`
Tecnologia: Astro, páginas estáticas e públicas.

Responsabilidade: apresentar o ITS, cursos, núcleos, metodologia e conduzir o visitante até a solicitação de inscrição.

O Site possui páginas como Home, Cursos, Núcleos, Metodologia, Quem Somos e Solicitar Inscrição. Ele não exibe PIX, status, comprovantes, dados bancários ou controles administrativos.

O único ponto em que toca a operação é no formulário:

1. O visitante preenche seus dados no Site.
2. O Site chama o contrato público `solicitarInscricao`.
3. O backend operacional valida os dados, cria o registro oficial, gera número e token.
4. O visitante é enviado para a Central, no fluxo de inscrição.

Portanto, o Site é responsável por converter uma pessoa interessada em uma solicitação válida — não por operar essa inscrição.

### Central de Operações

Local: `apps/central`
Tecnologia: React, Vite, React Query e Supabase.

Responsabilidade: registrar, acompanhar, validar, confirmar e administrar a operação após a solicitação.

Ela possui duas superfícies:

- Autosserviço público, limitado por token: o candidato acessa pagamento, PIX, envio de comprovante e consulta.
- Painel administrativo autenticado: a equipe acompanha inscrições, altera status, abre comprovantes, confirma inscrições e opera o financeiro.

Rotas institucionais abertas na Central, como `/`, `/cursos` e `/quem-somos`, redirecionam para o Site. Isso evita que ela se torne um segundo site institucional.

A definição de rotas está em [App.tsx](C:/Users/marke/OneDrive/Desktop/ITS-Servo/apps/central/src/App.tsx:1).

### Serviços internos da Central

A regra atual é: tudo que representa uma capacidade operacional fica em `apps/central/src/service/`.

```text
service/
├── inscricao/
├── financeiro/
└── indicadores/
```

#### `service/inscricao`

É o serviço mais completo hoje.

Responsável por:

- Consulta de inscrição por número e token.
- Exibição de PIX.
- Validação e envio de comprovante.
- Status da inscrição.
- Confirmação/cancelamento pela equipe.
- Abertura segura de comprovantes.
- Disparo de e-mail de confirmação.

O antigo diretório `autosservico` foi absorvido por este domínio. O arquivo correto de validação agora é `service/inscricao/lib/comprovante.ts`; a aba antiga do IDE aponta para um caminho que já foi movido.

#### `service/financeiro`

Responsável pelo caixa e pelos cadastros necessários para ele:

- Lançamentos de entrada e saída.
- Categorias financeiras.
- Relatório mensal.
- Visão anual.
- Previsão financeira.
- Cadastro e uso de alunos no contexto financeiro.

Hoje, `alunos` está dentro do financeiro porque é utilizado como pagador/vínculo de lançamentos. Caso o ITS passe a operar vida acadêmica — turmas, disciplinas, frequência, notas — será adequado criar um futuro `service/alunos` ou `service/academico`.

#### `service/indicadores`

Responsável pelo Dashboard operacional:

- Inscrições por status.
- Pendências de comprovante.
- Modalidades e núcleos.
- Quantidade de alunos ativos.
- Receita estimada.

Diagnóstico importante: a “receita confirmada” atual é uma estimativa baseada em inscrições confirmadas × valor padrão, não necessariamente no caixa real. O próximo amadurecimento deveria usar os lançamentos efetivos do `service/financeiro`.

---

## Desenvolvimento

Requer **pnpm** (workspace) e Node ≥ 18.

```bash
pnpm install          # instala todo o workspace

pnpm dev:site         # roda o Site (Astro)   — Produto A
pnpm dev:central      # roda a Central (Vite) — Produto B

pnpm build            # build de todos os pacotes/apps
pnpm build:site       # só o Site
pnpm build:central    # só a Central
```

## Base compartilhada e Backend

O diretório `supabase/` (migrations + edge functions) é a verdade do dado. O
acesso público passa pelo pacote `@its-servo/supabase` (contrato tipado), sem
acesso anônimo direto a `inscricoes`; o painel administrativo usa RLS. Regras e fluxos em
[`docs/DESENHO_CONTROLE_OPERACIONAL.md`](docs/DESENHO_CONTROLE_OPERACIONAL.md).

- `packages/supabase`: contrato público, tipos e funções compartilhadas.
- `packages/design-system`: design system.
- `supabase/functions`: operações protegidas no servidor, como criação de inscrição, envio de comprovante e e-mails.
- Supabase: banco, Storage privado de comprovantes, autenticação e regras de acesso.

```bash
supabase db start     # banco local (Docker)
supabase db reset     # aplica migrations + seed (asserts conferem a planilha)
supabase db push      # aplica migrations no projeto remoto
```

Secrets exigidos pelas edge functions no deploy (falham alto se ausentes):
`ALLOWED_ORIGINS`, `SELF_SERVICE_URL`, `EMAIL_FROM`, `ADMIN_EMAIL`,
`RESEND_API_KEY` — via `supabase secrets set`.
