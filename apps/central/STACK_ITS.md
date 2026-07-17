# STACK_ITS — Stack e responsabilidades

Este documento resume a stack tecnológica do projeto "ITS-Servo", descreve qual é a responsabilidade de cada tecnologia e indica onde alterar/implementar novas funcionalidades com menor risco de quebrar o sistema.

## Visão geral
- Aplicação: SPA frontend em React + TypeScript.
- Bundler / dev server: Vite.
- Styling: Tailwind CSS.
- Testes: Vitest.
- Backend / BaaS: Supabase (Postgres + Edge Functions).
- Funções serverless: `supabase/functions/*` (pequenas tarefas como envio de e-mail).
- Migrações: `supabase/migrations` (arquivos SQL versionados).
- Lockfile: `bun.lockb` (sugere uso de Bun como gerenciador/ runtime, confirmar em `package.json`).

## Principais tecnologias e responsabilidades
- **React**: implementação da UI (componentes, páginas, roteamento). Código principal em `src/`.
- **TypeScript**: tipagem estática e redução de erros em tempo de desenvolvimento.
- **Vite**: servidor de desenvolvimento com HMR, bundling e build rápida para produção.
- **Tailwind CSS**: sistema utilitário de estilos; configuração em `tailwind.config.ts` e CSS em `src/index.css` / `src/App.css`.
- **Vitest**: runner de testes unitários/integração leve para manter estabilidade ao refatorar.
- **Supabase (Postgres)**: persistência de dados, autenticação e storage; responsabilidades do banco em `supabase/migrations` e integrações em `src/integrations/supabase`.
- **Supabase Edge Functions**: funções serverless em `supabase/functions` para tarefas backend (ex.: envio de e-mails).
- **UI primitives / design system**: `src/components/ui` contém componentes reutilizáveis (botões, inputs, dialogs) usados pela aplicação inteira.
- **Hooks e utilitários**: `src/hooks` e `src/lib` com lógica reutilizável e helpers.
- **Config e tooling**: `package.json`, `tsconfig.*`, `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `vitest.config.ts`.

## Estrutura relevante (onde mexer)
- `src/pages/` — views/rotas; adicionar novas telas aqui.
- `src/components/` — componentes compartilhados (Layout, Header, Footer).
- `src/components/ui/` — primitives/design system; alterações aqui afetam muitas telas.
- `src/integrations/supabase/` — cliente supabase e tipos; ponto central de acesso a dados.
- `supabase/functions/` — novas funções serverless (cada pasta = função).
- `supabase/migrations/` — adicionar migração quando alterar o schema do banco.
- `public/` — assets estáticos (ícones, imagens públicas).

## Boas práticas para modificar / implementar funcionalidades
- Prefira mudanças incrementais: crie componentes/props novos em vez de alterar comportamentos globais.
- Antes de alterar `src/components/ui/*`, verifique todas as importações/uso; prefira adicionar variações ao invés de refatorar APIs existentes.
- Para qualquer alteração de banco: crie um novo arquivo de migração em `supabase/migrations` e teste em ambiente local/staging antes de aplicar em produção.
- Ao adicionar lógica backend, crie uma nova função em `supabase/functions/<nome>/index.ts` e teste isoladamente.
- Escreva ou atualize testes unitários/integração em `test/` e rode `vitest` antes de abrir PR.
- Use feature branches pequenas e PRs com descrições claras e checklist de verificação (build, testes, smoke test manual).

## Comandos úteis (verifique `package.json` para scripts exatos)
Usando npm (exemplos genéricos):

```bash
npm install
npm run dev    # start de desenvolvimento (Vite)
npm run build  # build para produção
npm run test   # roda testes com Vitest
```

Se o projeto usa Bun (verificar `bun.lockb` e `package.json`):

```bash
bun install
bun run dev
```

Para migrations e funções (com Supabase CLI):

```bash
supabase db reset   # use com cautela; verifique docs da equipe
supabase functions deploy <nome> --project-ref <ref>
```

## Observações finais
- Alterações em `src/components/ui` e em `src/integrations/supabase` têm alto impacto — proteger com testes e revisão.
- Verifique variáveis de ambiente (ex.: `SUPABASE_URL`, `SUPABASE_KEY`) antes de rodar localmente ou ao implantar.
- Se quiser, eu posso abrir esse arquivo para revisão, criar um PR automático ou gerar um checklist de testes para uma alteração específica.

---
Arquivo criado automaticamente para documentação da stack.
