# Arquitetura da Plataforma ITS-Servo

> Documento de definição arquitetural. Fonte da verdade sobre **o que é** a
> plataforma, **como os dois produtos se relacionam** e **onde ficam as
> fronteiras**. Precede o desenvolvimento — mudanças estruturais devem ser
> refletidas aqui primeiro.
>
> Base conceitual: `PRODUTOS_ITS_SERVO.md`. Referência de conteúdo/layout do
> Site: `design_ideal.md`. Referência visual do design system:
> `design-system/ds1.html`.

---

## 1. Visão da Plataforma

O ITS-Servo **não é um sistema** — é uma **plataforma composta por dois
produtos** de escopo fechado, apoiados sobre uma fundação compartilhada.

```
ITS Servo (plataforma)
│
├── Produto A — Site Institucional      (público, converte visitantes)
│
├── Produto B — Central Operacional     (interno, opera o instituto)
│
└── Kernel compartilhado                (design system, contrato de dados,
                                          autenticação, banco)
```

Os dois produtos têm **naturezas opostas**, e é isso que justifica separá-los:

| Dimensão | Site Institucional (A) | Central Operacional (B) |
|---|---|---|
| Público | Anônimo, externo | Interno, autenticado |
| Tráfego | Alto, esporádico | Baixo, recorrente |
| SEO / velocidade | Críticos | Irrelevantes |
| Conteúdo | Quase estático | Dinâmico (CRUD, dashboards) |
| Stack | Estático/SSG | React SPA + Supabase |
| Relação com o dado | Só **escreve** um lead | **Possui** todo o ciclo de vida |

**Como se relacionam:** o Site captura um lead (inscrição) e entrega o visitante
à Central por meio de um **contrato fino** — uma única operação `criarInscricao`.
Tudo que acontece depois da inscrição (pagamento, envio de comprovante, consulta
de status, confirmação) é **responsabilidade da Central**, mesmo quando exposto
publicamente ao candidato.

**Pergunta que decide a fronteira:** _"Isso ajuda alguém que ainda não conhece o
ITS a confiar na instituição?"_ Se sim → Site. Se é operar/administrar → Central.

---

## 2. Especificação — Produto A: Site Institucional

### Missão
Representar o instituto e **converter** visitantes em inscritos. Não administra,
não controla pagamentos, não gerencia alunos.

### Público-alvo
Visitante externo que ainda não conhece (ou está avaliando) o ITS.

### Escopo (fechado)
- **Institucional:** Home, História, Missão, Visão, Valores, Liderança.
- **Acadêmico:** Matérias, Modalidades, Núcleos, Metodologia.
- **Conversão:** Inscrição (formulário), Contato, FAQ.

### Funcionalidades
- Páginas de conteúdo estáticas (renderizadas em build — SSG).
- **Formulário de inscrição** — a única funcionalidade que toca o backend, via a
  operação de contrato `criarInscricao`. Após o envio, redireciona o candidato
  para a superfície de autosserviço da Central (link também enviado por e-mail).

### Limites do escopo (o que NÃO pertence ao Site)
- Qualquer leitura/escrita de status operacional, comprovantes, financeiro.
- Qualquer área autenticada ou administrativa.
- Conhecimento do schema do banco (fala apenas com o contrato).

### Métricas
Visitantes, taxa de inscrição, tempo na página, origem das inscrições.

---

## 3. Especificação — Produto B: Central Operacional

### Missão
Centralizar as informações necessárias para **operar** o instituto e reduzir
trabalho administrativo. Não existe para impressionar visitantes.

### Público-alvo
Equipe administrativa (admin autenticado) e, numa **superfície pública restrita
por token**, o próprio candidato para autosserviço pós-inscrição.

### Rotas (escopo fechado — a Central NÃO serve conteúdo institucional)
| Rota | Acesso |
|---|---|
| `/inscricao/pagamento/:numero` | público + token (autosserviço) |
| `/consulta` | público + token (autosserviço) |
| `/painel/*` | admin autenticado |
| `/`, `/cursos`, `/nucleos`, `/quem-somos`, `/metodologia`, `/inscricao` | **redirect** para o Site (`VITE_SITE_URL`) |

O autosserviço usa um layout enxuto (`AutoServicoLayout`) cuja única navegação
é "Voltar ao site" — sem menu institucional. Toda página de marketing e o
formulário de inscrição vivem no Produto A; duplicá-los aqui criaria um "site
pior" e prenderia o visitante fora do Site.

### Módulos (atuais)
- **Cadastros:** inscrições e alunos (aluno nasce automaticamente da inscrição
  confirmada, ou é cadastrado à mão para legados).
- **Financeiro:** livro-caixa completo — substitui a planilha anual do ITS.
  Lançamentos de entrada/saída por unidade, categorias gerenciáveis, relatório
  mensal imprimível (modelo assinado) e visão anual. Ver §6.
- **Documentos:** comprovantes (armazenamento privado, signed URLs).
- **Indicadores:** inscrições, receita (relatórios avançados = futuro).

### Entidades
- `inscricoes` — registro do candidato e ciclo de vida (status, comprovante).
- `alunos` — corpo discente do financeiro; vinculado à inscrição (`inscricao_id`
  único) ou legado manual. Unidade = núcleo ou `correspondencia`.
- `categorias_financeiras` — categorias de entrada/saída, gerenciáveis no painel.
- `lancamentos_financeiros` — livro-caixa (tipo, valor, data, competência,
  unidade, categoria, aluno opcional).
- `user_roles` — papéis de acesso (admin).
- Bucket `comprovantes` — arquivos de comprovante (privado, signed URLs).

### Fluxos
- **Admin:** login (Supabase Auth) → Dashboard, Inscrições, Financeiro. Guarded.
- **Fechamento mensal (financeiro):** lançar pagamentos/despesas ao longo do mês
  → tab Relatório Mensal → imprimir o relatório de cada núcleo e o Geral →
  colher as três assinaturas (Tesoureiro, Presidente, Vice-Presidente).
- **Autosserviço do candidato (público + token):** Pagamento (dados PIX + envio
  de comprovante) e Consulta de status. Fora do guard admin; identidade provada
  pelo **token da inscrição**.
- **Ciclo de status:** `aguardando_pagamento` → `comprovante_enviado` →
  `confirmada` (ou `pagamento_nao_identificado`, `cancelado`).

### Limites do escopo (o que NÃO pertence à Central agora)
Institucional/marketing. E, mesmo dentro de operações, **adiar**: diário de
classe, notas, frequência, AVA, mensagens internas, gestão pedagógica,
cobrança automática de mensalidades e relatórios/indicadores avançados.

---

## 4. Mapa de Fronteiras

| Item | Site (A) | Central (B) | Compartilhado |
|---|:---:|:---:|:---:|
| Conteúdo institucional | ✔ | ✖ (redireciona) | — |
| Formulário de inscrição (UI) | ✔ | ✖ (redireciona) | — |
| Ciclo de vida de inscrição/status | — | ✔ | tabela `inscricoes` |
| Pagamento / envio de comprovante | — | ✔ (público+token) | — |
| Consulta de status | — | ✔ (público+token) | — |
| Financeiro / Indicadores / admin | — | ✔ | — |
| Autenticação admin | — | ✔ | `user_roles` / `is_admin` |
| Design system / tokens | usa | usa | `packages/design-system` |
| Acesso a dados | via `criarInscricao` | wrappers | `packages/supabase` |

### O que é compartilhado (kernel)
- **`packages/design-system`** — tokens da marca (cores pergaminho/azul-marinho/
  ouro, tipografia Fraunces/Raleway, espaçamento, sombras). Fonte única de
  identidade para ambos os produtos.
- **`packages/supabase`** — client, tipos gerados e os **wrappers tipados do
  contrato** (as chamadas às RPC/edge functions). Nenhum app fala com a tabela
  diretamente.
- **Backend (`supabase/`)** — migrações, policies e edge functions. Verdade do
  dado e das regras de acesso.
- **Autenticação** — `user_roles` + `is_admin()`.

### Duas autenticações distintas (importante)
- **Admin:** Supabase Auth (e-mail/senha) → RLS por `is_admin()`. Uso interno.
- **Autosserviço:** **token por inscrição** (hash no banco, entregue por link
  mágico). Não cria sessão; cada operação (consultar/enviar comprovante/cancelar)
  verifica o token no servidor. Prova de **posse** daquela inscrição, sem login.

---

## 5. Contrato de Inscrição (a fronteira crítica)

O Site conhece **apenas** esta superfície — nunca o schema:

```
criarInscricao(dto) → { numero_inscricao, token }
```

- **Onde vive:** edge function `criar-inscricao` (valida os dados, insere a
  linha, gera o `numero_inscricao` e um `token` cujo hash é gravado, e dispara o
  e-mail de inscrição com o **link mágico** para a Central). Servidor valida —
  nada de confiança no client.
- **Pós-inscrição (superfície da Central, público + token):**
  - `buscarInscricao(numero, token)` — RPC `SECURITY DEFINER`; retorna apenas
    campos seguros (sem PII sensível além do necessário) mediante token válido.
  - `enviarComprovante(numero, token, arquivo)` — valida token, sobe o arquivo
    para o bucket **privado**, atualiza status.
  - `cancelarInscricao(numero, token)` — valida token e posse antes de cancelar.
- **Regra de ouro:** nenhuma leitura/escrita anônima direta na tabela
  `inscricoes`. As policies `USING(true)` são removidas; todo acesso passa por
  RPC/edge que verificam token ou papel admin.

Esse contrato é, ao mesmo tempo, a **fronteira arquitetural** entre os produtos e
a **correção dos riscos de segurança** (enumeração de PII e adulteração anônima).

---

## 6. Módulo Financeiro (Central)

Substitui a planilha anual do ITS (aba GERAL + uma aba por unidade). Decisões
estruturais:

- **Unidade** de relatório = os 4 núcleos (slugs de `packages/supabase/src/nucleos.ts`)
  + `correspondencia` (modalidade tratada como unidade, como na planilha).
  `unidade NULL` num lançamento = movimento geral/institucional.
- **`data` vs `competencia`:** `data` é o dia real do movimento (coluna DATA do
  relatório impresso); `competencia` (sempre dia 1) é o mês em que o lançamento
  aparece nos relatórios — uma mensalidade de junho paga em julho fecha em junho.
- **Saldo inicial** = lançamento de ajuste (R$ 13.067,29, competência dez/2025,
  categoria "Saldo inicial"). O "SALDO ANTERIOR" de qualquer mês é a soma
  uniforme de tudo antes dele — sem caso especial no código.
- **Inscrição → aluno:** trigger `criar_aluno_de_inscricao` no banco; quando o
  status vira `confirmada`, o aluno é criado (idempotente). Vale para qualquer
  caminho de confirmação, presente ou futuro.
- **Acesso:** admin-only via RLS `is_admin()` nas três tabelas.
- **Histórico 2026:** importado por migration de seed com `ASSERT`s que conferem
  os totais mês a mês contra a planilha (a migration falha se divergir). A
  planilha tinha um typo de R$ 2,00 no saldo anterior de maio; o sistema calcula
  a cadeia correta, que converge no saldo real de junho (R$ 18.517,29).
- **UI** (`/painel/financeiro`, tabs com `?tab=`): Lançamentos (CRUD + cards do
  mês), Relatório Mensal (espelho do papel + impressão com 3 assinaturas),
  Visão Anual (grade unidades × meses com rodapé encadeado ENTRADA MÊS → SALDO
  ANTERIOR → TOTAL GERAL → SAÍDA → SALDO), Alunos, Categorias e Previsão
  (receita potencial de taxas de inscrição — não é caixa).

---

## 7. Topologia do Repositório (alvo)

```
its-servo/                       (repo raiz — pnpm monorepo)
├── pnpm-workspace.yaml
├── apps/
│   ├── site/            # Produto A — Site Institucional (SSG)
│   └── central/         # Produto B — Central Operacional (React SPA + Supabase)
├── packages/
│   ├── design-system/   # tokens da marca + fontes + estilos base
│   └── supabase/        # client + types + wrappers do contrato
├── supabase/            # migrations + edge functions (backend)
└── docs/arquitetura.md  # este documento
```

Princípio: **compartilhado = pacotes; produtos = apps.** Deploys independentes
(Site estático no domínio raiz; Central em subdomínio `painel.*`, com as rotas
públicas de autosserviço fora do guard admin).
