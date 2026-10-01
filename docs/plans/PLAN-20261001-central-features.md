# Plano de reestruturação da Central por features

Data: 2026-10-01  
Branch: `refactor-central`

## Objetivo

Reorganizar `apps/central` por capacidades de negócio, usando `features/` como
eixo principal e separando claramente as experiências de `autosservico` e
`gestao`, sem alterar URLs ou comportamento no primeiro marco.

## Decisões

- A Central permanece um monólito modular React + Supabase.
- `features/` contém capacidades de negócio.
- `autosservico` representa a jornada do candidato.
- `gestao` representa a operação da equipe do ITS.
- `app/` compõe providers, rotas, layouts e páginas sistêmicas.
- Componentes de UI gerados permanecem em `components/ui` neste marco para
  evitar uma movimentação grande sem ganho de domínio.
- Páginas preservam o comportamento atual; extração de regras e comandos será
  feita depois que as fronteiras estruturais estiverem estáveis.

## Estrutura-alvo do primeiro marco

```text
apps/central/src/
├── app/
│   ├── layouts/
│   ├── pages/
│   ├── providers/
│   └── routes/
├── features/
│   ├── autenticacao/gestao/
│   ├── inscricoes/
│   │   ├── api/
│   │   ├── model/
│   │   ├── autosservico/
│   │   └── gestao/
│   ├── financeiro/
│   │   ├── api/
│   │   ├── model/
│   │   └── gestao/
│   └── indicadores/gestao/
├── components/ui/
├── integrations/
├── shared/
└── main.tsx
```

## Etapas

### 1. Baseline

- [x] Confirmar branch `refactor-central`.
- [x] Confirmar worktree limpo.
- [x] Executar testes: 15 testes aprovados.
- [x] Executar lint: 0 erros e 7 avisos preexistentes em componentes de UI.
- [x] Executar build: aprovado; aviso preexistente de chunk principal > 500 kB.

### 2. Composição da aplicação

- [x] Extrair providers de `App.tsx`.
- [x] Separar declaração de rotas.
- [x] Mover layouts de autosserviço e gestão para `app/layouts`.
- [x] Mover páginas sistêmicas e redirecionamentos para `app`.

### 3. Features

- [x] Migrar autenticação para `features/autenticacao/gestao`.
- [x] Migrar inscrições para `features/inscricoes`.
- [x] Separar inscrições em `autosservico` e `gestao`.
- [x] Migrar financeiro para `features/financeiro`.
- [x] Migrar indicadores para `features/indicadores`.
- [x] Atualizar imports sem criar dependências entre superfícies.

### 4. Documentação e guardrails

- [x] Atualizar o desenho arquitetural com a estrutura efetiva.
- [x] Atualizar README e documentação técnica da Central.
- [x] Adicionar APIs públicas (`index.ts`) somente onde houver consumidor real.
- [x] Verificar ausência de imports dos caminhos antigos.

### 5. Verificação

- [x] Testes aprovados: 15 testes.
- [x] Lint sem novos erros/avisos: 0 erros e 7 avisos preexistentes.
- [x] Build de produção aprovado; permanece o aviso preexistente de chunk > 500 kB.
- [x] Rotas de autosserviço e gestão preservadas.
- [x] Worktree revisado para arquivos órfãos e referências antigas.

## Próximos marcos, fora desta movimentação estrutural

1. ~~Centralizar modelo e política atual de transições de status de inscrição.~~
2. ~~Encapsular Supabase em queries, commands e mutations por feature.~~
3. Criar comando transacional e histórico de inscrições.
4. Substituir exclusão financeira por estorno auditável.
5. Reestruturar indicadores para distinguir previsão e receita realizada.

Os itens 1 e 2 foram entregues no segundo marco, documentado em
`docs/plans/PLAN-20261001-central-feature-apis.md`.
