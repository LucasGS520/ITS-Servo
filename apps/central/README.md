# Central Operacional

SPA React/Vite com duas superfícies:

- autosserviço por CPF ou número de inscrição, com compatibilidade dos links antigos e sem sessão administrativa;
- painel de gestão protegido por Supabase Auth, papel `admin` e RLS.

## Estrutura

```text
src/
├── routes/              # mapa de URLs e compatibilidade com o Site
├── layouts/             # shells de autosserviço e gestão
├── pages/               # páginas sistêmicas, como 404
├── providers/           # React Query, Router, toasts e Error Boundary
├── modules/
│   ├── acesso/          # sessão e autorização
│   ├── atividades/      # cursos e simpósios
│   ├── auditoria/       # trilha operacional
│   ├── dashboard/       # indicadores
│   ├── financeiro/      # movimentos de caixa, categorias, recebimentos e devoluções
│   ├── matriculas/      # autosserviço e gestão do ciclo de matrícula
│   └── participantes/   # cadastro único e histórico
├── common/              # UI e utilitários compartilhados
└── services/            # integrações técnicas
```

O acesso a dados fica nas pastas `api/`; regras puras ficam em `model/`; telas ficam em `autosservico/` ou `gestao/`. Veja [ARCHITECTURE.md](ARCHITECTURE.md) para responsabilidades, fluxo financeiro e explicação dos arquivos de composição.

## Comandos

```bash
pnpm --filter @its-servo/central exec tsc -b
pnpm --filter @its-servo/central test
pnpm --filter @its-servo/central lint
pnpm --filter @its-servo/central build
```

## Operação atual

As áreas principais são Dashboard, Inscrições, Financeiro, Instituto e Relatórios. Participação e pagamento são decisões independentes. Não há emissão de cobranças nem geração de mensalidades esperadas.

- [Guia de operação e primeiro uso oficial](GUIA_OPERACAO.md)
- [Verificação da estabilização](VERIFICACAO_ESTABILIZACAO.md)
