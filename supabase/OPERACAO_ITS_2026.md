# Operação ITS — estado em 20/10/2026

## Estado de publicação

O banco de produção recebeu as migrations `alinhamento_operacional_its`, `integridade_inscricoes_its` e `permissoes_financeiro_its`, junto da carga de 2026. As Edge Functions `criar-inscricao` e `enviar-comprovante` estão na versão 2. As telas da Central e do Site foram alteradas neste repositório, mas **ainda não foram publicadas no host web**; até essa publicação, a interface no ar pode mostrar o fluxo antigo. Não usar a interface antiga de cobrança para operar os novos registros.

## Como a equipe deverá operar após publicar a interface

1. Em **Inscrições**, cadastrar pela Central ou receber a inscrição do Site. A entrada fica em análise. O comprovante enviado pelo titular é evidência opcional e não representa dinheiro recebido.
2. Conferir os dados e confirmar a inscrição. Para curso, informar o primeiro mês que deve entrar no controle de mensalidades. Para isenção, registrar o motivo. A confirmação do curso cria o aluno vinculado.
3. Em **Financeiro → Recebimentos**, registrar somente dinheiro conferido: pessoa/inscrição, valor, tipo e data real. O caixa usa o mês dessa data. Uma mensalidade pode ser atribuída a vários meses ou parcialmente; a parte sem atribuição continua visível. Correções de atribuição e estornos exigem motivo e ficam auditados.
4. Em **Financeiro → Mensalidades**, acompanhar os meses esperados dos alunos ativos validados. Essa visão é controle interno e não emite cobranças. Receitas e despesas gerais devem ser vinculadas ao curso ou à edição do Simpósio.
5. Em **Simpósios**, cadastrar uma edição independente para cada evento. Doações de bens e serviços ficam no inventário, sem somar ao caixa. Patrocínios e ofertas em dinheiro entram como receita financeira.

## Histórico carregado e conferência

| Fonte | Tratamento |
| --- | --- |
| Planilha anual de 2026 | Caixa mensal oficial: R$ 22.350,00 de entradas, R$ 10.787,99 de saídas e saldo inicial de R$ 13.067,29. Dias de pagamento ausentes continuam desconhecidos. |
| Cinco abas do Teológico | 65 pessoas e alunos provisórios; 67 células de recebimento, R$ 9.170,00 no total. Cada valor tem mês de entrada, sem competência de mensalidade atribuída. Totais por núcleo não foram somados de novo. |
| Capacitação | R$ 2.010,00 agregados no mês disponível, sem fabricar participantes. Continua interna até configurar valores e decidir a publicação. |
| Simpósio 2026 | Edição histórica com 173 inscritos, 159 pagantes e 14 isentos, sem nomes inventados. Os 26 itens de detalhe/inventário preservam sua origem e não duplicam o caixa anual. A edição está privada e inativa. |

Permanecem abertas quatro pendências: o detalhe do Simpósio tem R$ 510,00 a mais de entradas e R$ 560,00 a mais de saídas que o anual; há dois transportes de saldo com diferença de R$ 2,00. As diferenças não geraram lançamentos artificiais.

## Conferência humana necessária

- Validar cada aluno histórico, especialmente nomes incompletos ou possivelmente coletivos, situação atual, CPF quando conhecido e primeiro mês sujeito ao controle. Nenhum dos 65 gera mensalidades esperadas antes da validação individual.
- Conferir a qual mensalidade corresponde cada um dos 67 recebimentos históricos. A coluna da planilha informa o mês de entrada, não necessariamente a mensalidade paga.
- Obter fonte individual da Capacitação se o ITS precisar de ficha financeira por aluno para 2026.
- Conciliar o detalhe do Simpósio com o anual e decidir a origem dos dois erros de R$ 2,00, preservando a trilha da correção.
- Configurar valores da Capacitação antes de torná-la pública; criar e configurar cada nova edição de Simpósio antes de abrir inscrições.

A carga repetível está em `supabase/scripts/prepare_2026.py`. Os arquivos Excel originais ficam fora do repositório; o SQL gerado com dados pessoais fica em `.planilhas_its/`, ignorado pelo Git.

## Verificações executadas

- A carga foi repetida sem alterar as contagens: 65 pessoas/alunos, 67 recebimentos, 78 lançamentos e quatro pendências abertas.
- Inscrição pública, comprovante e consulta por token passaram em transação revertida. O fluxo administrativo passou com confirmação, isenção, mensalidades parciais em dois meses, correção e estorno, sem criar cobrança.
- TypeScript, lint e build local de desenvolvimento da Central passaram; o teste de transporte de saldo passou. O build do Site requer Node.js `>=22.12.0`, enquanto a máquina usada nesta conferência tem Node 20.20.2.
- O Site e a Central são hospedados no Cloudflare. Seus projetos/branches de produção ainda precisam ser identificados para publicar o código; ambos os apps incluem `.node-version` 22.16.0 para o build do Pages.
