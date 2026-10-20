# Plataforma ITS-Servo

Monorepo com dois produtos sobre uma base Supabase compartilhada:

- `apps/site`: Site Institucional em Astro. Apresenta o ITS e inicia a solicitação de matrícula.
- `apps/central`: Central Operacional em React/Vite. Oferece autosserviço por token e painel administrativo.
- `packages/design-system`: tokens e estilos compartilhados.
- `packages/supabase`: client, tipos e contrato público.
- `supabase`: migrations, testes SQL e Edge Functions.

## Fluxo operacional

1. O Site chama `solicitarInscricao` na Edge Function `criar-inscricao`.
2. Uma RPC cria ou atualiza a pessoa e registra a inscrição em análise. Nenhuma cobrança é emitida.
3. O navegador recebe número e código de acesso e abre o autosserviço da Central.
4. O comprovante opcional é salvo em Storage privado como evidência para análise; ele não cria recebimento.
5. A equipe confirma a inscrição na Central, registra eventual isenção com motivo e define o primeiro mês de controle do aluno.
6. Depois de conferir o dinheiro recebido, a equipe registra valor e data no Financeiro e pode atribuir o recebimento a uma ou mais mensalidades, integral ou parcialmente.
7. Alterações relevantes ficam em `auditoria_operacional`; relatórios mensais emitidos ficam versionados.

Não existe envio de e-mail nesse fluxo. O e-mail informado é apenas dado de contato.

## Central Operacional

O painel autenticado cobre:

- dashboard operacional;
- participantes e histórico;
- inscrições pelo site ou pela equipe, comprovantes e confirmação manual;
- catálogo de cursos, taxa de matrícula e mensalidade de referência para controle interno;
- edições e inventário dos simpósios, participantes e resultado financeiro;
- recebimentos conferidos, atribuições de mensalidades, estornos, caixa e relatórios;
- trilha de auditoria.

O histórico de 2026 tem fonte identificada e precisão mensal. Os 65 alunos do Teológico estão provisórios até conferência individual; os R$ 9.170,00 recebidos foram importados por pessoa e mês de entrada, sem inventar dia ou competência paga. A Capacitação entrou de forma agregada. O detalhe do Simpósio permanece separado do caixa anual enquanto houver diferenças de conciliação. Veja o [estado atual e roteiro de operação](supabase/OPERACAO_ITS_2026.md) e o [diagnóstico inicial](supabase/DIAGNOSTICO_DADOS_2026-10-20.md).

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
