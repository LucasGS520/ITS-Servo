# Plataforma ITS-Servo

Monorepo com dois produtos sobre uma base Supabase compartilhada:

- `apps/site`: Site Institucional em Astro. Apresenta o ITS e inicia a solicitação de matrícula.
- `apps/central`: Central Operacional em React/Vite. Oferece autosserviço por token e painel administrativo.
- `packages/design-system`: tokens e estilos compartilhados.
- `packages/supabase`: client, tipos e contrato público.
- `supabase`: migrations, testes SQL e Edge Functions.

## Fluxo operacional

1. O Site chama `solicitarInscricao` na Edge Function `criar-inscricao`.
2. Uma RPC cria participante, matrícula e cobrança na mesma transação, usando o preço configurado no curso ou simpósio.
3. O navegador recebe número e código de acesso e abre o autosserviço da Central.
4. O comprovante é salvo em Storage privado e registrado como pagamento pendente.
5. A equipe confere o documento no Financeiro. A conciliação cria o lançamento de caixa e confirma a matrícula somente quando a cobrança está integralmente quitada.
6. Alterações relevantes ficam em `auditoria_operacional`; relatórios mensais emitidos ficam versionados.

Não existe envio de e-mail nesse fluxo. O e-mail informado é apenas dado de contato.

## Central Operacional

O painel autenticado cobre:

- dashboard operacional;
- participantes e histórico;
- matrículas, comprovantes e exceções de status;
- catálogo e preços de cursos;
- edições, participantes e resultado de simpósios;
- cobranças, pagamentos, conciliação, caixa e relatórios;
- trilha de auditoria.

Rotas institucionais abertas na Central redirecionam para o Site. A arquitetura detalhada está em [`apps/central/ARCHITECTURE.md`](apps/central/ARCHITECTURE.md).

## Desenvolvimento

Requer pnpm e Node.js `>=22.12.0`.

```bash
pnpm install
pnpm dev:site
pnpm dev:central
pnpm build
```

Validação da Central:

```bash
pnpm --filter @its-servo/central exec tsc -b
pnpm --filter @its-servo/central test
pnpm --filter @its-servo/central lint
pnpm --filter @its-servo/central build
```

Validação local do backend:

```bash
npx supabase start
npx supabase db reset
Get-Content supabase/tests/central_operacional.sql -Raw |
  docker exec -i supabase_db_eeyebnhilphfxfklvruo psql -v ON_ERROR_STOP=1 -U postgres -d postgres
```

O deploy remoto de migrations, funções ou secrets não é automático e deve ser executado explicitamente no ambiente de destino.
