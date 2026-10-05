# Central Operacional — arquitetura e responsabilidades

Este documento descreve a estrutura vigente da Central e é a referência para
nomear módulos, páginas e fluxos operacionais.

## Áreas do produto

| Módulo | Responsabilidade |
| --- | --- |
| `acesso` | Login, sessão Supabase e autorização administrativa. |
| `matriculas` | Autosserviço e gestão do ciclo de matrícula, comprovantes e status. |
| `participantes` | Cadastro único por CPF e histórico de participação. |
| `atividades` | Catálogo de cursos e edições de simpósio, inclusive preço, publicação, participantes e resultado histórico. |
| `financeiro` | Cobranças, pagamentos, conciliação, livro-caixa e relatórios. |
| `dashboard` | Resumo operacional; não contém regras de negócio próprias. |
| `auditoria` | Consulta somente leitura das ações relevantes registradas no banco. |

Os diretórios `api/` contêm acesso a dados e mutations. Os diretórios
`model/` contêm regras puras. As pastas `autosservico/` e `gestao/` contêm
somente composição de interface.

## Fluxo financeiro da matrícula

1. O Site solicita a matrícula pela Edge Function `criar-inscricao`.
2. Uma RPC transacional cria ou atualiza a pessoa, cria a matrícula e sua
   cobrança usando o preço vigente da atividade.
3. O candidato acessa a Central com número e token e vê a descrição e o valor
   da própria cobrança.
4. `enviar-comprovante` grava o arquivo no Storage privado e uma RPC registra o
   pagamento pendente. Se a RPC falhar, o arquivo é removido.
5. A equipe usa uma única ação: **Conciliar pagamento**. A RPC cria o registro
   financeiro, atualiza pagamento e cobrança e confirma a matrícula somente
   quando o valor devido estiver quitado.
6. A confirmação cria/reativa o aluno do Curso Teológico. Uma saída do estado
   confirmado desativa esse aluno, preservando o histórico.

Não há envio de e-mail. O token é entregue ao navegador no término da
solicitação e permanece no fragmento da URL.

## Regras de dependência

- UI acessa Supabase somente pelas APIs do próprio módulo.
- Operações anônimas sobre matrícula passam por RPC ou Edge Function.
- Mutações financeiras e de status são feitas por RPCs auditáveis.
- Preço exibido vem de `cursos`, `edicoes_simposio` ou `cobrancas`; constantes
  locais não representam preço de atividade.
- RLS é a autorização final; guards React existem apenas para experiência do
  usuário.

## Arquivos de infraestrutura da aplicação

- `src/pages/NotFoundPage.tsx`: fallback das rotas desconhecidas. Oferece uma
  saída segura para a página inicial e não contém regra operacional.
- `src/providers/AppProviders.tsx`: ponto único que instala os contextos globais
  do React Query, Router, tooltips e notificações. Mantém essa infraestrutura
  fora das páginas e dos módulos de negócio.
- `src/providers/ErrorBoundary.tsx`: captura falhas inesperadas de renderização,
  apresenta uma recuperação simples e evita uma tela inteiramente vazia.
- `src/routes/AppRoutes.tsx`: mapa declarativo das áreas públicas, do
  autosserviço e da gestão. Também preserva redirecionamentos de URLs antigas
  após a renomeação dos módulos.
- `src/routes/RedirectToSite.tsx`: redirecionamento intencional para o Site
  institucional. É usado quando a navegação sai da responsabilidade da Central;
  não consulta dados nem decide regras de matrícula.
