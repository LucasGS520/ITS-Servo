# Segundo marco da Central: modelos e APIs por feature

Data: 2026-10-01  
Branch: `refactor-central`

> Histórico: os caminhos deste plano refletem a organização anterior. Na
> estrutura vigente, `features/` chama-se `modules/` e
> `integrations/supabase` passou a `services/supabase`.

## Objetivo

Consolidar as fronteiras criadas no primeiro marco, retirando acesso direto ao
Supabase de páginas, componentes e layouts. A UI deve consumir queries,
commands e mutations das próprias features, sem alterar URLs, schema ou fluxo
funcional.

## Escopo

### Inscrições

- [x] Centralizar os status e rótulos canônicos em `model/`.
- [x] Encapsular consulta, cancelamento e envio de comprovante do autosserviço.
- [x] Encapsular listagem, comprovante e alteração de status da gestão.
- [x] Manter o envio de e-mail como efeito explícito da confirmação.
- [x] Invalidar inscrições e alunos depois da confirmação.

### Financeiro

- [x] Encapsular escrita de alunos e categorias.
- [x] Encapsular criação, edição e exclusão de lançamentos.
- [x] Concentrar invalidação de cache nas mutations.
- [x] Preservar validações e mensagens atuais.

### Autenticação

- [x] Encapsular login, verificação de acesso e logout.
- [x] Remover conhecimento do client Supabase dos componentes de autenticação.

### Guardrails

- [x] Proibir import direto do client Supabase fora de `modules/*/api`.
- [x] Adicionar testes para o modelo de status.
- [x] Atualizar a documentação arquitetural.

## Fora deste marco

- alteração de schema ou RLS;
- histórico auditável de transições de inscrição;
- substituição da exclusão financeira por estorno;
- mudança das transições permitidas de status;
- divisão de bundle e lazy loading das rotas.

## Verificação

- [x] Testes aprovados: 24 testes.
- [x] Lint sem novos erros ou avisos: 0 erros e 7 avisos preexistentes.
- [x] Build de produção aprovado; permanece o aviso de chunk > 500 kB.
- [x] Nenhuma UI importa `@/services/supabase/client`.
- [x] Comportamento e rotas preservados.
