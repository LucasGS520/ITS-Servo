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

A composição das rotas está em `apps/central/src/app/routes/AppRoutes.tsx`.

### Features da Central

A regra atual é: capacidades operacionais ficam em `apps/central/src/features/`.
As experiências do candidato e da equipe são nomeadas pelo propósito:
`autosservico` e `gestao`.

```text
features/
├── autenticacao/gestao/
├── inscricoes/
│   ├── api/
│   ├── model/
│   ├── autosservico/
│   └── gestao/
├── financeiro/
│   ├── api/
│   ├── model/
│   └── gestao/
└── indicadores/gestao/
```

#### `features/inscricoes`

É a feature mais completa hoje.

Responsável por:

- Consulta de inscrição por número e token.
- Exibição de PIX.
- Validação e envio de comprovante.
- Status da inscrição.
- Confirmação/cancelamento pela equipe.
- Abertura segura de comprovantes.

`autosservico/` contém pagamento e consulta do candidato; `gestao/` contém a
operação da equipe. Regras puras ficam em `model/` e acesso a dados em `api/`.
Páginas, componentes e layouts não importam o client Supabase diretamente;
essa fronteira também é validada pelo ESLint.

#### `features/financeiro`

Responsável pelo caixa e pelos cadastros necessários para ele:

- Lançamentos de entrada e saída.
- Categorias financeiras.
- Relatório mensal.
- Visão anual.
- Previsão financeira.
- Cadastro e uso de alunos no contexto financeiro.

Hoje, `alunos` está dentro do financeiro porque é utilizado como pagador/vínculo de lançamentos. Caso o ITS passe a operar vida acadêmica — turmas, disciplinas, frequência, notas — será adequado criar uma futura feature `alunos` ou `academico`.

#### `features/indicadores`

Responsável pelo Dashboard operacional:

- Inscrições por status.
- Pendências de comprovante.
- Modalidades e núcleos.
- Quantidade de alunos ativos.
- Receita estimada.

Diagnóstico importante: a “receita confirmada” atual é uma estimativa baseada em inscrições confirmadas × valor padrão, não necessariamente no caixa real. O próximo amadurecimento deverá usar os lançamentos efetivos da feature `financeiro`.

---

## Desenvolvimento

Requer **pnpm** (workspace) e Node ≥ 22.12.0.

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
- `supabase/functions`: operações protegidas no servidor, como criação de inscrição e envio de comprovante.
- Supabase: banco, Storage privado de comprovantes, autenticação e regras de acesso.

```bash
supabase db start     # banco local (Docker)
supabase db reset     # aplica migrations + seed (asserts conferem a planilha)
supabase db push      # aplica migrations no projeto remoto
```

Secret exigido pelas edge functions no deploy (falha alto se ausente):
`ALLOWED_ORIGINS` — via `supabase secrets set`.

O roteiro obrigatório de publicação do backend está em
[`docs/SUPABASE_PRODUCAO.md`](docs/SUPABASE_PRODUCAO.md).
