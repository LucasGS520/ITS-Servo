# Central Operacional

Aplicação React que atende duas experiências do ITS-Servo:

- autosserviço do candidato, protegido pelo token da inscrição;
- painel de gestão, protegido por sessão Supabase e papel administrativo.

Conteúdo institucional e o formulário inicial de inscrição pertencem ao Site; a
Central apenas preserva rotas antigas como redirecionamentos compatíveis.

## Estrutura

```text
src/
├── App.tsx              # providers e rotas
├── main.tsx             # bootstrap React
├── routes/              # rotas, proteção e redirecionamentos
├── layouts/             # estrutura das experiências
├── pages/               # páginas sistêmicas
├── providers/           # infraestrutura React global
├── modules/             # capacidades de negócio
├── common/              # UI e utilitários reutilizáveis
├── services/            # integrações técnicas
└── index.css            # estilos globais
tests/                   # testes da aplicação
```

`modules/` contém o negócio (`autenticacao`, `inscricoes`, `financeiro` e
`indicadores`). `common/` não conhece módulos. Acesso ao Supabase fica em
`services/` e é consumido exclusivamente pelas APIs dos módulos.

Veja [STACK_ITS.md](STACK_ITS.md) para a árvore detalhada e as regras de
dependência.

## Comandos

Na raiz do monorepo:

```bash
pnpm --filter @its-servo/central dev
pnpm --filter @its-servo/central test
pnpm --filter @its-servo/central lint
pnpm --filter @its-servo/central build
```
