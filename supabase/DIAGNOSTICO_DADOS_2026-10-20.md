# Diagnóstico da operação atual do ITS — 20/10/2026

**Escopo desta sessão:** levantamento de dados e processos. Nenhum dado foi importado; não houve alteração de telas, schema, funções ou configuração remota.

## Fontes e grau de certeza

- **Confirmado pelo ITS:** PLANILHA ANUAL 2026.xlsx é o controle financeiro anual oficial. Suas abas de alunos e núcleos referem-se ao Curso Teológico. A Capacitação de Obreiros não tem controle individual equivalente nesse arquivo.
- **Verificado no arquivo e no sistema:** números e comportamentos descritos abaixo. O CSV local reproduz apenas a aba “RELATÓRIO GERAL”, sem as abas de alunos.
- **A validar como regra operacional:** respostas preliminares desta conversa sobre cobranças, confirmação de matrícula, cadastro histórico, publicação e início da operação oficial. Elas orientam perguntas futuras, sem alterar a Central nesta sessão.

## Conferência das seis abas do Excel

| Aba do Teológico | Linhas de alunos | Com valor em 2026 | Entradas até setembro |
| --- | ---: | ---: | ---: |
| Engenho Novo | 13 | 12 | R$ 3.530,00 |
| Ariston | 17 | 8 | R$ 1.500,00 |
| Sede | 9 | 1 | R$ 520,00 |
| Osasco | 13 | 9 | R$ 2.190,00 |
| Correspondência | 13 | 5 | R$ 1.430,00 |
| **Total** | **65** | **35** | **R$ 9.170,00** |

As 67 células mensais com valor nessas cinco abas fecham **em todos os meses** com as respectivas linhas de núcleo no “RELATÓRIO GERAL”. As 30 linhas sem recebimento em 2026 continuam no controle; a planilha não informa se representam alunos ativos, inadimplentes ou históricos.

De janeiro a setembro, o relatório geral soma **R$ 22.350,00 de entradas**: R$ 9.170,00 dos núcleos, R$ 200,00 de ofertas/patrocínio, R$ 2.010,00 de Capacitação e R$ 10.970,00 de Simpósio. As **saídas somam R$ 10.787,99**: R$ 8.015,43 de Simpósio, R$ 1.260,00 de materiais e R$ 1.512,56 de contabilidade. O saldo anterior de janeiro é R$ 13.067,29 e o saldo exibido em setembro é R$ 24.629,30. Outubro a dezembro aparecem zerados; isso não comprova ausência de movimentos.

As linhas de entradas e saídas fecham com os totais mensais. Há **duas divergências reais de transporte**: saldo anterior de maio = saldo final de abril **+ R$ 2,00**; saldo anterior de junho = saldo final de maio **− R$ 2,00**. Elas se compensam no acumulado, mas sua origem precisa de conferência. Quatro diferenças literais entre CSV e XLSX são apenas precisão decimal de fórmulas; arredondadas a centavos, não há diferença de valor.

## Mapa dos dados e processos

| Área | Origem e funcionamento verificado | Lacuna ou pergunta |
| --- | --- | --- |
| Alunos do Teológico | Abas por núcleo trazem nome e valor por mês. A tabela alunos admite nome e unidade; pessoas exige CPF único. | O Excel não traz CPF, contato, dia do pagamento, situação acadêmica nem categoria de cada valor. Há 19 nomes de uma palavra, 13 com abreviações e uma linha que parece reunir duas pessoas. |
| Inscrição e atendimento | O site coleta dados pessoais, atividade, modalidade e núcleo. Uma Edge Function cria pessoa, inscrição e cobrança; Atendimento busca, corrige e trata exceções. | Atendimento não oferece nova inscrição manual. O fluxo atual cria uma cobrança pelo preço único do curso; o modelo real de cobrança ainda precisa ser documentado. |
| Financeiro | Há lançamentos, categorias, cobranças, pagamentos, conferência de comprovante, conciliação, recusa e estorno. | O histórico não tem dia nem comprovante. A tela de cobranças age sobre pagamentos pendentes já criados; não oferece registro visível de recebimento bancário sem comprovante. Lançamento manual não envia vínculo de curso ou edição. |
| Capacitação | A linha geral registra R$ 2.010,00 em setembro. O curso existe na base, ativo, sem preço e não público. | Não há aba de participantes ou pagamentos individuais dessa atividade no Excel. |
| Simpósio | O relatório geral traz entradas e saídas; o quadro “Simpósio 2026” está sem detalhes preenchidos. A Central permite configurar edições e calcular resultado por lançamentos vinculados. | Nenhuma edição está cadastrada. O Excel não identifica participantes nem o vínculo de cada valor à edição; o relatório anual também usa a categoria genérica. |
| Relatórios | A Central já monta quadros anual e mensal e guarda versões mensais. | A base operacional está vazia e não reproduz 2026. O relatório mensal pressupõe dia real do movimento, ausente no Excel; a regra para exibir histórico mensal agregado permanece aberta. |

**Base ativa consultada nesta sessão:** pessoas, inscricoes, alunos, lancamentos_financeiros, cobrancas, pagamentos e edicoes_simposio têm zero registros. O Teológico está público com preço único de R$ 190,00; a Capacitação está interna e sem preço. Contas e cadastros de configuração foram preservados na limpeza anterior.

## Prioridades para as próximas sessões

1. **Validar o processo com o ITS:** significado das linhas sem recebimento, situação atual dos alunos, composição dos valores do Teológico, inscrição e conferência bancária na prática, além da origem dos dois ajustes de R$ 2,00.
2. **Fechar identidade e histórico:** obter identificadores dos alunos quando existirem; resolver nomes incompletos e a linha possivelmente coletiva; identificar fonte individual da Capacitação e distinguir mês conhecido de data real.
3. **Depois especificar mudanças e carga:** cadastro manual, vínculo financeiro por atividade, tratamento de simpósios e relatórios fiéis à fonte. Evitar contabilizar simultaneamente valores individuais e seus totais por núcleo.

**Evidências consultadas:** PLANILHA ANUAL 2026.xlsx em Downloads; CSV da aba geral em .planilhas_its; formulário do site, contrato público, telas de Atendimento, Instituto, Financeiro e Relatórios, e migrations em supabase/migrations. Dados pessoais do Excel não foram copiados para este diagnóstico.
