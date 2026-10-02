# Central Operacional — stack e organização

## Stack

- React 18 + TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Tailwind CSS + componentes shadcn/Radix;
- Supabase: Postgres, Auth, RLS, Storage, RPC e Edge Functions;
- Vitest + Testing Library;
- pnpm workspace.

## Organização do código

```text
src/
├── App.tsx              # composição mínima: providers + rotas
├── main.tsx             # bootstrap React
├── routes/              # declaração central das rotas
├── layouts/             # shells de autosserviço e gestão
├── pages/               # páginas sistêmicas, como 404
├── providers/           # query client, router, toasts e error boundary
├── modules/             # capacidades de negócio
│   ├── autenticacao/
│   ├── inscricoes/
│   ├── financeiro/
│   └── indicadores/
├── common/              # elementos reutilizáveis, sem regra de negócio
│   ├── assets/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   └── ui/              # primitives visuais geradas/compartilhadas
├── services/            # integrações técnicas, hoje Supabase
├── index.css            # estilos globais
└── vite-env.d.ts         # tipos do Vite
tests/                   # testes da aplicação
```

## Experiências da Central

- `autosservico`: ações do candidato, sem sessão administrativa e protegidas
  pelo token da inscrição;
- `gestao`: operação da equipe, protegida por Supabase Auth e papel admin.

As URLs continuam usando `/consulta`, `/inscricao/*` e `/painel/*`. Os nomes das
pastas representam responsabilidades internas e não alteram o contrato externo.

## Anatomia de um módulo

Um módulo usa somente as pastas necessárias:

```text
modules/<nome>/
├── api/                 # leitura, escrita, queries e commands
├── model/               # tipos e regras puras
├── autosservico/        # UI do candidato, quando existir
├── gestao/              # UI da equipe, quando existir
└── index.ts             # API pública consumida por outros módulos
```

Regras:

- componentes, páginas e layouts não importam o client Supabase; usam a API da
  própria feature;
- regras puras não importam React nem o client Supabase;
- outro módulo importa somente o entrypoint público, nunca uma pasta interna;
- `autosservico` e `gestao` podem usar `api` e `model`, mas não importam UI um
  do outro;
- `App.tsx`, rotas, layouts e providers compõem a aplicação, sem regra de negócio;
- `common` não conhece nenhum módulo.

O ESLint protege essa fronteira: imports do client Supabase são permitidos nas
pastas `modules/*/api`, mas rejeitados na composição e na UI.

## Backend e dados

- `src/services/supabase`: client tipado usado pela Central;
- `packages/supabase`: tipos e contrato público compartilhado com o Site;
- `supabase/migrations`: schema, RLS, triggers e RPCs;
- `supabase/functions`: operações server-side e integrações de e-mail/storage.

Mudanças de schema devem ser feitas por nova migration. Operações públicas não
podem acessar `inscricoes` diretamente; devem usar o contrato por RPC ou Edge
Function.

## Verificação

Na raiz do monorepo:

```bash
pnpm --filter @its-servo/central test
pnpm --filter @its-servo/central lint
pnpm --filter @its-servo/central build
```

Os planos em `docs/plans/PLAN-20261001-central-features.md` e
`docs/plans/PLAN-20261001-central-feature-apis.md` registram a migração
anterior e são históricos. Este arquivo é a fonte de verdade da estrutura atual.
