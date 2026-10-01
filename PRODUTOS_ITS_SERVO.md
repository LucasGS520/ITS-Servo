# Minha leitura do estado atual

Pela nossa conversa e pelo que existe hoje, eu deixaria de pensar no ITS-Servo como "um sistema".

Eu passaria a tratá-lo como uma **plataforma composta por dois produtos**.

```
ITS Servo
│
├── Produto A
│   Site Institucional
│
└── Produto B
    Central Operacional
```

Essa mudança parece pequena, mas altera completamente as decisões futuras.

---

# Produto A — Site Institucional

## Missão

Representar o Instituto Teológico Servo.

Não administrar.

Não controlar pagamentos.

Não gerenciar alunos.

Seu objetivo é:

* transmitir credibilidade;
* explicar quem é o instituto;
* apresentar os cursos;
* responder dúvidas;
* converter visitantes em inscritos.

### Métricas

* visitantes;
* taxa de inscrição;
* tempo na página;
* origem das inscrições.

### Pergunta que guia todas as decisões

> Isso ajuda uma pessoa que ainda não conhece o ITS a confiar na instituição?

Se a resposta for "não", provavelmente pertence ao outro produto.

---

# Produto B — Central Operacional

## Missão

Organizar o funcionamento interno do instituto.

Ela não existe para impressionar visitantes.

Existe para reduzir trabalho administrativo.

### Objetivos

* inscrições;
* pagamentos;
* mensalidades;
* documentos/comprovantes;
* materiais;
* indicadores;
* acompanhamento operacional.

Ela continua sendo apenas uma **Central Operacional**.

> Centralizar todas as informações necessárias para operar o Instituto.

Essa definição é menor e mais sustentável.

---

# Como eu dividiria os escopos

## Site Institucional

Escopo fechado.

### Institucional

* Home
* História
* Missão
* Visão
* Valores
* Liderança

### Acadêmico

* Matérias
* Modalidades
* Núcleos
* Metodologia

### Conversão

* Inscrição
* Contato
* FAQ

Nada administrativo.

---

## Central Operacional

Também teria escopo fechado.

### Cadastros

* alunos;
* inscrições;
* núcleos.

### Financeiro

* pagamentos;
* mensalidades;
* situação financeira.

### Documentos

* comprovantes;
* documetos;
* relatórios.

### Indicadores

* inscrições;
* receita;
* inadimplência;
* crescimento.

Nada institucional.

---

# O que eu ainda evitaria

Mesmo na Central Operacional, eu não implementaria agora:

* diário de classe;
* notas;
* frequência;
* ambiente virtual de aprendizagem;
* mensagens internas;
* gestão pedagógica completa.

São módulos que aumentam significativamente a complexidade e não atacam os gargalos definidos.

---

# O que considero ser a próxima etapa

Na minha avaliação, **não é mais uma etapa de desenvolvimento**, e sim de definição arquitetural.

Eu produziria um documento de arquitetura funcional contendo:

1. **Visão da Plataforma**

   * O que é o ITS-Servo.
   * Como os dois produtos se relacionam.

2. **Especificação do Site Institucional**

   * missão;
   * público-alvo;
   * páginas;
   * funcionalidades;
   * limites do escopo.

3. **Especificação da Central Operacional**

   * missão;
   * módulos;
   * entidades;
   * fluxos;
   * limites do escopo.

4. **Mapa de fronteiras**

   * o que pertence ao Site;
   * o que pertence à Central;
   * o que é compartilhado (autenticação, banco, design system, componentes etc.).

---

## Estado atual (2026-07-27) — separação CONSOLIDADA

A separação conceitual acima **já está implementada** no monorepo pnpm:

- `apps/site` — Produto A no ar (Astro, 7 páginas, tema manuscrito/mapa antigo).
- `apps/central` — Produto B com Inscrições (funil completo com autosserviço por
  token) e **Financeiro completo** (livro-caixa por unidade, alunos, categorias,
  relatório mensal imprimível com 3 assinaturas e visão anual — a planilha Excel
  foi substituída e seu histórico de 2026 importado com conferência automática).
- `packages/design-system` + `packages/supabase` — kernel compartilhado.
- Fronteiras, contratos e o modelo do financeiro documentados em
  `docs/DESENHO_CONTROLE_OPERACIONAL.md` (fonte da verdade arquitetural).

Próximos módulos continuam guiados pela lista "o que eu ainda evitaria" acima.



---


## Ideais do Design - Alinhamento (IMPLEMENTADOS)

- ✔ Modelo **Escrituras, templos, mapa antigo** (período bíblico) em vez de "estrelas/celestes"
- ✔ Mapa "Encontre o núcleo mais próximo de você" (Leaflet + geocoding por endereço)
- ✔ "Maputo" removido como núcleo — apenas os presenciais no Brasil + correspondência
  (a lista de núcleos agora tem fonte única em `packages/supabase/src/nucleos.ts`)
