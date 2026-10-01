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
├── app/                 # composição da aplicação
│   ├── layouts/         # shells de autosserviço e gestão
│   ├── pages/           # páginas sistêmicas, como 404
│   ├── providers/       # router, query client, toasts e error boundary
│   └── routes/          # declaração central das rotas
├── features/            # capacidades de negócio
│   ├── autenticacao/
│   ├── inscricoes/
│   ├── financeiro/
│   └── indicadores/
├── components/ui/       # primitives visuais geradas/compartilhadas
├── integrations/        # integrações técnicas, hoje Supabase
├── shared/              # constantes e utilitários realmente transversais
└── main.tsx              # bootstrap mínimo
```

## Experiências da Central

- `autosservico`: ações do candidato, sem sessão administrativa e protegidas
  pelo token da inscrição;
- `gestao`: operação da equipe, protegida por Supabase Auth e papel admin.

As URLs continuam usando `/consulta`, `/inscricao/*` e `/painel/*`. Os nomes das
pastas representam responsabilidades internas e não alteram o contrato externo.

## Anatomia de uma feature

Uma feature usa somente as pastas necessárias:

```text
features/<nome>/
├── api/                 # leitura, escrita, queries e commands
├── model/               # tipos e regras puras
├── autosservico/        # UI do candidato, quando existir
├── gestao/              # UI da equipe, quando existir
└── index.ts             # API pública consumida por outras features
```

Regras:

- componentes, páginas e layouts não importam o client Supabase; usam a API da
  própria feature;
- regras puras não importam React nem o client Supabase;
- outra feature importa somente o entrypoint público, nunca uma pasta interna;
- `autosservico` e `gestao` podem usar `api` e `model`, mas não importam UI um
  do outro;
- `app` compõe rotas e providers, sem conter regra de negócio;
- `shared` não conhece nenhuma feature.

O ESLint protege essa fronteira: imports do client Supabase são permitidos nas
pastas `features/*/api`, mas rejeitados na composição e na UI.

## Backend e dados

- `src/integrations/supabase`: client tipado usado pela Central;
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

O plano da reestruturação está em
`docs/plans/PLAN-20261001-central-features.md`.
