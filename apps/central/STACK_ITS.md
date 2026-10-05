# Central Operacional — stack e organização

## Stack

- React 18, TypeScript e Vite;
- React Router e TanStack Query;
- Tailwind CSS com componentes shadcn/Radix;
- Supabase Postgres, Auth, RLS, Storage, RPC e Edge Functions;
- Vitest e testes SQL transacionais;
- pnpm workspace.

## Limites de responsabilidade

- `acesso`: login, sessão e autorização administrativa.
- `atividades`: cursos e simpósios, seus preços oficiais e publicação.
- `auditoria`: consulta somente leitura do histórico operacional.
- `dashboard`: projeções do estado atual, sem regras próprias.
- `financeiro`: cobranças, comprovantes, pagamentos, conciliação, livro-caixa e relatórios versionados.
- `matriculas`: consulta por token, pagamento e ciclo operacional da matrícula.
- `participantes`: cadastro único por CPF e histórico de participação.

`common` não conhece regras de módulos. A UI não escreve diretamente status de matrícula nem lançamentos financeiros: usa commands/RPCs auditáveis.

## Backend

- `src/services/supabase`: client tipado da Central;
- `packages/supabase`: tipos e contrato público compartilhado com o Site;
- `supabase/migrations`: schema, RLS, triggers e RPCs;
- `supabase/functions`: validação server-side, rate limit, Storage privado e orquestração das RPCs;
- `supabase/tests`: invariantes transacionais executáveis no Postgres local.

Preço de atividade nunca é uma constante da interface: vem de `cursos`, `edicoes_simposio` ou da `cobrancas` associada.
