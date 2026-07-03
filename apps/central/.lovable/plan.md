
# Fluxo Completo de Inscricao - Instituto Teologico Servo

## Resumo

Implementar o processo completo de matricula digital do ITS: formulario de inscricao em duas secoes, pagina de pagamento com upload de comprovante PIX, painel administrativo para gerenciamento, e notificacoes por e-mail automaticas em cada etapa.

## Pre-requisitos

- Habilitar **Lovable Cloud** (banco de dados, storage e edge functions)
- O Cloud sera configurado antes de qualquer implementacao

## Arquitetura do Sistema

### Banco de Dados (Supabase)

**Tabela `inscricoes`:**
- `id` (uuid, PK)
- `numero_inscricao` (text, unique) - formato ITS2026-0001
- `nome_completo` (text)
- `cpf` (text)
- `telefone` (text)
- `email` (text)
- `data_nascimento` (date)
- `escolaridade` (text)
- `modalidade` (text) - "presencial" ou "correspondencia"
- `nucleo` (text, nullable) - obrigatorio se presencial
- `status` (text) - "aguardando_pagamento", "comprovante_enviado", "confirmada", "pagamento_nao_identificado"
- `comprovante_url` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Storage bucket `comprovantes`** para upload de comprovantes (imagem/PDF).

**Funcao SQL** para gerar numero de inscricao sequencial automaticamente.

### Politicas de Seguranca (RLS)

- Inscricoes podem ser **criadas** por qualquer pessoa (formulario publico, sem login)
- Inscricoes podem ser **lidas/atualizadas** apenas por administradores
- Comprovantes podem ser **enviados** por qualquer pessoa com o numero de inscricao
- Painel admin protegido por autenticacao Supabase

### Edge Functions

1. **`enviar-email-inscricao`** - Envia e-mail de confirmacao ao aluno apos inscricao
2. **`enviar-email-comprovante`** - Notifica ITS sobre comprovante recebido e aluno sobre analise
3. **`enviar-email-confirmacao`** - Envia e-mail final de confirmacao com instrucoes

> Nota: Os e-mails serao preparados para integracao com servico de e-mail. Inicialmente, a logica ficara pronta mas o envio real dependera de configurar um provedor (ex: Resend).

## Paginas e Componentes

### 1. Pagina de Inscricao (`/inscricao`) - Reformulada

Substituir o formulario atual por um formulario em duas secoes:

**Secao 1 - Dados Pessoais:**
- Nome completo (texto com validacao min 3 caracteres)
- CPF (input com mascara `000.000.000-00` e validacao de digitos)
- Telefone/WhatsApp (input com mascara `(00) 00000-0000`)
- E-mail (validacao de formato)
- Data de nascimento (date picker com calendario)
- Grau de escolaridade (select: Fundamental, Medio, Superior, Pos-graduacao, Outro)

**Secao 2 - Dados Academicos:**
- Modalidade (radio buttons: Presencial / Por Correspondencia)
- Nucleo (select, visivel e obrigatorio apenas se modalidade = Presencial)
  - Opcoes: Sede Jd. Santa Monica (Barueri/SP), Engenho Novo (Barueri/SP), Jd. Conceicao (Osasco/SP), Ariston (Carapicuiba/SP), Maputo (Mocambique)

**Botao:** "Continuar para Pagamento"

Validacao com Zod em todos os campos. Mascaras de CPF e telefone aplicadas no frontend.

### 2. Pagina de Pagamento (`/inscricao/pagamento/:numero`)

Exibe apos envio do formulario:
- Numero da inscricao (gerado automaticamente)
- Nome do aluno
- Detalhes do pagamento:
  - Matricula: R$ 40,00
  - Material (Apostila 3 materias): R$ 150,00
  - Total: R$ 190,00
- Dados PIX (genericos por enquanto):
  - Chave PIX: placeholder
  - Favorecido: placeholder
  - Banco: Cora
- Campo de upload de comprovante (imagem ou PDF, max 5MB)
- Botao: "Enviar Comprovante"

Apos envio: tela de confirmacao informando que o pagamento esta em analise.

### 3. Painel Administrativo (`/admin`)

Protegido por login (autenticacao Supabase):
- Tabela com todas as inscricoes
- Filtros por status
- Para cada inscricao: visualizar dados, ver comprovante, alterar status
- Status disponiveis: Aguardando Pagamento, Comprovante Enviado, Confirmada, Pagamento Nao Identificado
- Ao confirmar: dispara e-mail ao aluno com instrucoes (presencial = info do nucleo, correspondencia = instrucoes de envio)

### 4. Pagina de Login Admin (`/admin/login`)

Login simples com e-mail e senha via Supabase Auth.

## Sequencia de Implementacao

1. Habilitar Lovable Cloud
2. Projetar arquitetura de seguranca (security architecture agent)
3. Criar migracoes: tabela `inscricoes`, funcao de numero sequencial, bucket de storage, RLS policies
4. Criar pagina de inscricao reformulada com formulario em 2 secoes
5. Criar pagina de pagamento com upload de comprovante
6. Criar painel administrativo com login
7. Criar edge functions para e-mails (estrutura pronta para integracao)
8. Conectar tudo e testar fluxo completo

## Detalhes Tecnicos

- **Mascaras de input**: Implementadas com funcoes utilitarias no frontend (sem biblioteca extra)
- **Validacao CPF**: Algoritmo basico de validacao dos digitos verificadores
- **Upload**: Via Supabase Storage, limitado a 5MB, formatos JPG/PNG/PDF
- **Numero de inscricao**: Gerado via funcao SQL `generate_numero_inscricao()` usando sequencia
- **Rotas**: Novas rotas `/inscricao/pagamento/:numero`, `/admin`, `/admin/login` adicionadas ao App.tsx
- **Responsividade**: Layout mobile-first em todas as novas paginas
