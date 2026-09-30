---
plan_id: PLAN-20260930-its-servo-fronteiras-de-produto
title: Fronteiras de Produto — Site Institucional e Central de Operações
created: 2026-09-30
status: active
category: organizational
phase: execution
priority: high
---

# Plano: Fronteiras de Produto ITS-Servo

## Visão e objetivo

O ITS-Servo deve operar como dois produtos com uma transição única, compreensível e segura:

> O Site é responsável por adquirir, informar e converter visitantes. A Central é responsável por registrar, acompanhar, validar, confirmar e administrar inscrições.

O resultado esperado não é uma nova aplicação: é consolidar a fronteira que já existe parcialmente em código, documentação, rotas e dados, eliminando ambiguidades de nome, responsabilidade e acesso.

### Definições de negócio

| Etapa | Dono | Resultado |
|---|---|---|
| Descoberta, conteúdo, cursos, núcleos e CTA | Site | visitante informado e interessado |
| Formulário de **solicitação de inscrição** | Site | dados iniciais enviados ao contrato |
| Criação do registro, número, token e status inicial | Central / backend operacional | inscrição operacional criada |
| PIX, comprovante, consulta, cancelamento e comunicação de status | Central | inscrição acompanhada com token de posse |
| Conferência, confirmação, criação de aluno e financeiro | Central | matrícula/operacão confirmada |

O Site pode exibir a interface do formulário, mas não é dono do ciclo de vida operacional nem do registro oficial. O backend compartilhado é infraestrutura técnica; a regra de negócio de inscrição pertence à Central.

## Estado atual e diagnóstico

### Progresso de execução — 2026-09-30

- [x] Plano, carta de fronteiras e critérios de aceite registrados.
- [x] Site usa `solicitarInscricao` e encaminha incondicionalmente à Central.
- [x] `PUBLIC_CENTRAL_URL` passou a ser obrigatória no build do Site.
- [x] O Site não mostra mais número ou token como contingência pós-envio.
- [x] Copy pública removida de instruções PIX; o Site encaminha para a Central.
- [x] Contrato e documentos diferenciam acesso público de acesso administrativo com RLS.
- [x] Serviços da Central organizados em `src/service/` por domínio; o fluxo de inscrição está em `service/inscricao`.
- [x] Lint da Central sem erros (avisos de Fast Refresh não bloqueantes permanecem).
- [x] Build da Central e build estrutural do Site aprovados.
- [x] Teste do contrato de passagem Site → Central cobre sucesso, compatibilidade e erro do backend.
- [x] Testes de fronteira cobrem token no fragmento, compatibilidade de links antigos e redirecionamento Central → Site.
- [ ] Cobrir token, comprovante e confirmação de matrícula por testes de integração.

### Já alinhado

- `apps/site` contém conteúdo institucional e o formulário em `src/pages/inscricao.astro`.
- `apps/central` expõe autosserviço em `/inscricao/pagamento/:numero` e `/consulta`, e o painel admin em `/painel/*`.
- Rotas institucionais da Central redirecionam ao Site.
- O contrato `criarInscricao` gera número e token; pagamento e envio de comprovante estão na Central/edge functions.
- O financeiro, a confirmação e a criação de aluno já pertencem à Central.

### A alinhar

1. A terminologia mistura "solicitação" (conversão no Site) e "inscrição" (registro operacional).
2. A cobertura ainda não prova o fluxo real de banco e edge functions para token, comprovante e confirmação.

## Escopo e entregáveis

### Incluído

- Carta de fronteiras, matriz de responsabilidades e critérios de aceite.
- Contrato de transição Site → Central claramente nomeado e documentado.
- Rotas e mensagens de interface coerentes com a responsabilidade de cada produto.
- Garantia de configuração de produção para redirecionar à Central.
- Testes dos fluxos de conversão, token, pagamento e confirmação.
- Atualização de documentação, qualidade estática e observabilidade mínima.

### Fora de escopo

- Diário de classe, notas, frequência, AVA, chat interno ou gestão pedagógica.
- Cobrança automática, gateway de pagamento ou conciliação bancária automática.
- Redesign visual amplo que não contribua para a fronteira de produtos.
- Migração de dados existente sem uma necessidade comprovada.

### Entregáveis e aceite

1. **Carta de fronteiras**
   - Aceite: matriz abaixo aprovada por quem decide produto/operação.
2. **Transição única de inscrição**
   - Aceite: Site chama um único contrato; resposta leva a pessoa à Central; nenhum PIX, status ou upload existe no Site.
3. **Central operacional explícita**
   - Aceite: autosserviço e painel têm rotas, nomes e documentação próprios; todo estado de inscrição é administrado na Central/backend.
4. **Qualidade verificável**
   - Aceite: build dos dois apps, lint sem erros e testes cobrindo os fluxos críticos.

## Carta de fronteiras

| Capacidade | Site | Central | Compartilhado / backend |
|---|:---:|:---:|:---:|
| Conteúdo institucional, SEO e campanhas | Dono | Não serve | Design tokens |
| Cursos, metodologia e núcleos como informação pública | Dono | Não serve | Catálogo de núcleos |
| CTA e formulário de solicitação | Dono | Recebe | Contrato tipado |
| Validar e persistir inscrição | Inicia pedido | Dono | Edge function + banco |
| Número, token e estado da inscrição | Não administra | Dono | Banco/RPC |
| PIX e dados bancários operacionais | Não exibe | Dono | Constantes/configuração |
| Comprovante, consulta e cancelamento | Não executa | Dono | Token, bucket privado, edge/RPC |
| Confirmação, aluno, financeiro e relatórios | Não executa | Dono | RLS, triggers e migrations |
| Identidade visual | Consome | Consome | Design system |

## Plano de ação

### Fase 1 — Decisão de produto e linguagem

**Responsável:** produto/gestão do ITS, com apoio técnico.

1. Aprovar a carta de fronteiras deste plano.
   - Saída: uma decisão escrita sobre responsabilidades e exceções.
   - Verificação: nenhuma capacidade possui dois donos sem justificativa.
2. Escolher a linguagem pública:
   - Recomendação: Site usa "Solicitar inscrição"; Central usa "Minha inscrição" até a confirmação e "Matrícula confirmada" após ela.
   - Saída: glossário de termos usado em conteúdo, UI e e-mails.
3. Definir o evento de passagem:
   - `solicitarInscricao(dto)` é o nome conceitual recomendado para o contrato atual `criarInscricao(dto)`.
   - Decisão: manter o nome técnico com documentação/alias, ou renomear com migração compatível.

### Fase 2 — Consolidar a passagem Site → Central

**Responsável:** desenvolvimento.

1. Tratar `PUBLIC_CENTRAL_URL` como obrigatório em build/deploy de produção.
   - Eliminar a experiência de contingência que revela número/token no Site em produção.
   - Verificação: envio bem-sucedido sempre redireciona para `/inscricao/pagamento/:numero#token=...` na Central.
2. Documentar o contrato como propriedade operacional da Central:
   - entrada: dados iniciais do interessado;
   - saída: número, token e status inicial;
   - invariantes: token somente no fragmento, hash no banco, validação no servidor.
3. Garantir que falhas de e-mail não criem duplicidade e deixem uma recuperação segura na Central.
   - Verificação: teste de criação com e-mail indisponível e acesso posterior controlado.

### Fase 3 — Tornar a Central semanticamente explícita

**Responsável:** desenvolvimento.

1. Organizar os domínios operacionais em `apps/central/src/service/`.
   - `service/inscricao` concentra o autosserviço por token e a gestão administrativa de inscrições;
     `service/financeiro` e `service/indicadores` concentram suas respectivas capacidades.
   - Não muda URLs nem comportamento; remove ambiguidade interna.
2. Manter na Central somente:
   - autosserviço por token;
   - login e painel administrativo;
   - pagamentos, comprovantes, status, confirmação e financeiro.
3. Manter no Site somente uma página de consulta orientativa/redirect, sem ler ou exibir dados de inscrição.
4. Ajustar `docs/arquitetura.md` para permitir consultas administrativas autenticadas via RLS e proibir somente o acesso público direto à tabela `inscricoes`.

### Fase 4 — Provar a fronteira com qualidade

**Responsável:** desenvolvimento/QA.

1. Manter o lint sem erros antes de ampliar o produto.
2. Adicionar testes para:
   - Site monta o DTO correto e chama o contrato;
   - Central recusa consulta sem número/token válidos;
   - upload aceita apenas tipo/tamanho permitidos;
   - status só permite transições válidas;
   - confirmação cria aluno uma única vez;
   - rotas institucionais da Central redirecionam ao Site.
3. Executar build de `apps/site` e `apps/central` em ambiente sem cache bloqueado.
   - O cache do Vite do Site usa agora `apps/site/.astro/vite`; o build exige
     as variáveis públicas reais de deploy e foi verificado com valores temporários.

### Fase 5 — Medir e publicar

**Responsável:** produto/operação.

1. Medir visitantes → formulários iniciados → solicitações concluídas → confirmações.
2. Registrar erros de transição, e-mails não enviados e comprovantes pendentes.
3. Publicar um guia operacional: onde o time acompanha inscrições, confirma pagamentos e fecha o financeiro.

## Ordem recomendada

1. Aprovar Fase 1.
2. Executar Fase 2 e os testes que a acompanham.
3. Executar a limpeza semântica da Fase 3.
4. Fechar Fase 4 como gate de release.
5. Habilitar métricas da Fase 5 após a operação estar estável.

## Riscos e respostas

| Risco | Resposta |
|---|---|
| Mover nomes/pastas quebra imports | Fazer em PR isolado, com busca global e build dos dois apps. |
| Site passa a expor operação novamente | Usar a carta de fronteiras como critério de revisão. |
| Token aparece em logs ou URLs externas | Manter token no fragmento e testar os links. |
| Configuração da Central ausente em produção | Falhar o build/deploy antes de publicar. |
| Regras de banco e UI divergem | Testar os fluxos na edge/RPC e manter banco como fonte de verdade. |

## Métricas de sucesso

- 100% das rotas institucionais servidas pelo Site; Central as redireciona.
- 100% dos pagamentos, comprovantes, estados e confirmações operados pela Central.
- Uma única chamada de contrato para a transição Site → Central.
- Zero acesso público direto a `inscricoes`.
- Lint sem erros; builds dos dois apps; testes críticos aprovados.
- Taxas de solicitação, pagamento pendente e confirmação mensuráveis.

## Próxima decisão necessária

Validar a carta de fronteiras e escolher se o produto usará o termo público **"Solicitar inscrição"** no Site. Com isso decidido, a Fase 2 pode começar sem ambiguidade.
