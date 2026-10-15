# Desenho operacional e plano de consolidação

**Status:** proposta inicial para validação  
**Escopo desta etapa:** Central Operacional e backend Supabase. O site institucional permanece fora do escopo de mudanças.

## Resultado desejado

Os responsáveis do ITS continuam registrando informações e tomando decisões manualmente. A Central organiza esse trabalho em um fluxo único, mantém o histórico das decisões e gera consultas e relatórios a partir dos dados registrados, reduzindo duplicidade e divergência entre controles.

O banco do Instituto continua sendo a referência para o que foi lançado na Central. Conferência bancária, aprovação de comprovante e correções são decisões humanas; não há pressuposto de integração automática com banco ou planilhas.

## Modelo operacional proposto

1. **Pessoa:** cadastro mestre identificado por CPF, reaproveitado entre cursos e simpósios.
2. **Atividade:** curso configurado no catálogo ou edição específica de simpósio. A Capacitação de Obreiros usa o catálogo existente, mas precisa ter preço e disponibilidade definidos.
3. **Participação:** vínculo entre pessoa e atividade, criado pela equipe na Central ou recebido pelo fluxo público já existente. Guarda modalidade, núcleo, situação, origem e histórico relevante.
4. **Cobrança e pagamentos:** a cobrança pertence à participação. Um pagamento pode ser registrado pela equipe a partir da conferência bancária, com ou sem comprovante enviado pelo participante. A conciliação permanece uma ação explícita do responsável.
5. **Movimentação financeira:** entradas conciliadas e despesas são lançadas com categoria, data/competência, unidade e vínculo à atividade ou edição correspondente. Correções preservam o lançamento anterior e registram motivo.
6. **Relatórios:** são consultas sobre esses registros, com período e dimensões explícitas. Versões emitidas devem continuar identificáveis mesmo quando dados posteriores exigirem revisão.

## Fluxos que a Central deve sustentar

### Cadastro manual de participação

Responsável pesquisa CPF; seleciona ou cria a pessoa; escolhe curso ou edição do simpósio; informa os dados operacionais necessários; registra o valor/cobrança; salva. A Central evita duplicar a pessoa e a participação ativa. A confirmação financeira continua dependendo da conciliação, não de uma mudança manual de status.

O fluxo público atual continua válido como outra origem de participação. Ele não deve ser requisito para a equipe registrar operações iniciadas fora do site.

### Recebimento e conferência financeira

Responsável localiza cobrança/participação e informa o pagamento observado no banco. Se houver comprovante, ele pode ser associado ao registro. O responsável confere e concilia; o sistema atualiza saldo e situação da cobrança e, quando quitada, confirma a participação. Recusa, estorno e correção exigem motivo e preservam histórico.

### Simpósio

Cada edição é uma unidade operacional própria. Participantes, cobranças, pagamentos, entradas e despesas precisam apontar para a edição correta. O resultado por edição não deve depender apenas da categoria genérica “Simpósio”.

### Capacitação de Obreiros

Usar o mesmo fluxo-base de pessoa, participação, cobrança, recebimento e relatório usado para outros cursos. Antes de publicar ou iniciar cadastros, configurar preço e disponibilidade e validar com o ITS se a operação requer turmas/coortes, datas, unidades ou outros campos próprios.

## Critérios de aceite do produto

- A equipe consegue criar e corrigir uma participação sem depender do formulário do Site.
- Uma pessoa mantém um cadastro coerente entre atividades, sem duplicação por variação de nome.
- Todo pagamento registrado pode ser ligado à cobrança e à atividade correspondente; a conciliação é humana e auditável.
- Despesas e receitas de um simpósio podem ser atribuídas à edição, permitindo apurar participantes, previsto, recebido, custo e resultado daquela edição.
- A Capacitação de Obreiros pode ser configurada e operada pelo mesmo fluxo-base, com os campos específicos definidos pelo ITS.
- Relatórios mensal, anual e por atividade usam os mesmos lançamentos de origem e deixam claro período, filtros e regra de cálculo.
- Uma correção após emissão de relatório não apaga a versão anterior; indica que uma nova versão ou revisão é necessária.
- Usuários administrativos e RLS continuam protegendo dados pessoais e financeiros.

## Plano de trabalho desta sessão

### 1. Consolidar as regras e os campos

Levantar os campos realmente usados nas planilhas e relatórios atuais, separando os obrigatórios para todos os serviços dos específicos de curso e simpósio. Confirmar também estados e regras de confirmação, cancelamento, recusa e estorno.

### 2. Fechar o desenho das telas e ações

- Atendimento: busca, cadastro manual e ficha da participação.
- Financeiro: registro de recebimento observado no banco, conferência de comprovante, conciliação, despesas e correções.
- Instituto: catálogo de cursos, edições de simpósio, núcleos e configuração da Capacitação.
- Relatórios: visões por período e atividade, com impressão/exportação e histórico de versões.
- Navegação: expor as telas de Participantes e Auditoria somente onde agregarem valor ao fluxo aprovado.

### 3. Implementar um primeiro fluxo vertical

Prioridade proposta: cadastro manual de uma participação de curso na Central → cobrança → pagamento registrado manualmente → conciliação → confirmação → relatório. Esse caminho valida o padrão que depois será aplicado à Capacitação e aos simpósios.

### 4. Corrigir atribuição financeira por edição

Adicionar no lançamento manual o vínculo explícito à atividade/edição e unidade, atualizar as regras e relatórios para usarem esse vínculo e verificar o resultado por edição de simpósio.

### 5. Consolidar relatórios e auditoria

Comparar as saídas atuais com os relatórios de referência, definir as fórmulas e os filtros, e confirmar como versões emitidas são revisadas após alterações financeiras.

### 6. Verificar o fluxo completo

Cobrir regras críticas no Postgres e automatizar o percurso da Central com dados de teste: cadastro manual, lançamento, conciliação parcial/integral, recusa/estorno e relatório. O smoke test existente não percorre esse fluxo completo.

## Decisões ainda necessárias do ITS

- Quais planilhas/abas e relatórios são a referência oficial para cada curso e simpósio?
- Quais colunas/campos são obrigatórios e quais relatórios precisam ser reproduzidos exatamente?
- Um pagamento observado no extrato pode quitar mais de uma cobrança? Um pagamento pode ser parcelado?
- Como são registradas taxas, devoluções, descontos, bolsas e valores recebidos em moeda diferente?
- Para o simpósio, quais custos devem entrar no resultado por edição e como tratar custos compartilhados?
- A Capacitação terá turmas/coortes, calendário e controle de participantes separado por edição?
- O relatório é baseado na data de recebimento, competência, ou ambos? Qual saldo inicial deve ser considerado?

## Evidências no código atual

- `MatriculasPage` cobre busca, correção de dados e exceções, mas não apresenta ação de novo cadastro manual.
- O comando de lançamento financeiro manual envia os vínculos `curso_id` e `edicao_simposio_id` como nulos.
- A tela de simpósios calcula métricas por edição; o relatório anual também agrupa movimentos pela categoria genérica “Simpósio”.
- A Capacitação de Obreiros já existe no catálogo como ativa, mas sem preço e não pública na migration inicial.
- Relatórios mensais versionados, cadastro financeiro manual, conciliação e trilha de auditoria já têm partes implementadas.

