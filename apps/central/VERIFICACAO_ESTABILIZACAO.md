# Verificação da estabilização — 26/10/2026

## Controles executados

- TypeScript: `tsc -p tsconfig.app.json --noEmit`, aprovado.
- Vitest: 29 testes aprovados, incluindo RPC com cliente que exige contexto, situação financeira, cálculos e impressão.
- ESLint: sem erros; oito avisos existentes de Fast Refresh/dependências de hook.
- Build da Central aprovado. Build do Site aprovado com Node 22 em instalação limpa; dependências incompletas do diretório original exigiram essa instalação isolada.
- Migração instalada e validada no Supabase local antes da base oficial.
- `supabase/tests/estabilizacao_central.sql`: execução transacional com rollback; preço preservado, gratuidade, confirmação, isenção, pausa, troca de núcleo, cancelamento, devoluções, ciclo de edição, contrato público e edição de histórico.
- `supabase/tests/integracao_local.py`: HTTP local, mesma operação simultânea com um único efeito, devoluções simultâneas com limite respeitado, bloqueio anônimo, bucket privado e inscrições públicas nos dois cursos e Simpósio. Preço enviado pelo cliente ignorado pelo servidor.
- `tests/e2e_estabilizacao.py`: navegador local com conta de teste; cinco áreas, formulário preservado durante atualização, entrada, edição, devolução, falha de consulta com dados anteriores visíveis e ações bloqueadas, inscrição/confirmar sem pagamento, impressão e logout.

Os testes que gravam dados usam exclusivamente o Supabase local. O build local de validação não é enviado ao Cloudflare: a publicação é feita pelo build da branch `refactor-central`, com as variáveis de produção do projeto.

## Preservação da base oficial

Referência anterior à migração:

| Tabela | Registros | MD5 do conjunto ordenado por ID |
| --- | ---: | --- |
| Movimentos | 78 | af99fd9a94e24404d20bd980d365aec6 |
| Recebimentos históricos | 67 | 1c9d4cf6832735ec4b82b2bd21f88e50 |
| Alunos | 65 | 306c0f913733ccaec515418713888f4e |
| Itens do Simpósio | 26 | f7e9e2a755f34c4f71d059dacd6cc9f4 |

Entradas menos saídas dos movimentos: R$ 11.562,01 (sem adicionar saldo inicial). Recebimentos históricos: R$ 9.170,00. Nenhuma inscrição existente no momento da migração.

## Limites e entrada oficial

- A primeira operação real e a impressão autenticada em produção ainda devem ser acompanhadas com o responsável. Não foram criados registros fictícios no caixa oficial nem foi alterada a conta administrativa existente.
- A data de início oficial depende dessa conferência, conforme [guia de operação](GUIA_OPERACAO.md).
- Permanecem as validações individuais dos alunos históricos, competências desconhecidas, endereços ausentes e divergências de conciliação. Não foram encerradas automaticamente.
- A conta compartilhada não identifica o operador individual. O Supabase também informa que a proteção contra senhas vazadas não está habilitada; não houve alteração de credenciais nesta entrega.
- As funções administrativas anteriores permanecem compatíveis durante a publicação. A versão nova usa a operação financeira com identificador de repetição. Sessões antigas devem recarregar a Central para usar esse fluxo.
- O teste público nesta etapa exercitou as Edge Functions e o contrato real do formulário; não representa uma execução visual completa de todas as páginas do Site.
