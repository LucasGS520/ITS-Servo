# Plataforma ITS-Servo

Monorepo da plataforma do Instituto Teológico Servo — **dois produtos** sobre uma
fundação compartilhada. Ver a definição completa em
[`docs/arquitetura.md`](docs/arquitetura.md).

- **Produto A — Site Institucional** (`apps/site`): público, estático (Astro),
  representa o instituto e converte visitantes. Só o formulário de inscrição toca
  o backend.
- **Produto B — Central Operacional** (`apps/central`): interno (React + Vite +
  Supabase), opera inscrições, o **financeiro completo** (livro-caixa por
  unidade, relatórios mensais imprimíveis, visão anual — substitui a planilha),
  documentos e indicadores; expõe uma superfície pública de autosserviço travada
  por token.

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
├── docs/arquitetura.md  # visão, especificações, mapa de fronteiras, contrato
├── design_ideal.md      # referência de copy/layout do Site
└── pnpm-workspace.yaml
```

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

## Backend

O diretório `supabase/` (migrations + edge functions) é a verdade do dado. O
acesso passa pelo pacote `@its-servo/supabase` (contrato tipado) — nenhum app
fala com a tabela `inscricoes` diretamente. Regras e fluxos em
[`docs/arquitetura.md`](docs/arquitetura.md).

```bash
supabase db start     # banco local (Docker)
supabase db reset     # aplica migrations + seed (asserts conferem a planilha)
supabase db push      # aplica migrations no projeto remoto
```

Secrets exigidos pelas edge functions no deploy (falham alto se ausentes):
`ALLOWED_ORIGINS`, `SELF_SERVICE_URL`, `EMAIL_FROM`, `ADMIN_EMAIL`,
`RESEND_API_KEY` — via `supabase secrets set`.
