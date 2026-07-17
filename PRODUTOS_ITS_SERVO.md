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

## Um último ponto

Pela inspeção do repositório, **eu ainda não consigo afirmar que essa separação já foi consolidada na estrutura do código**. A documentação e os artefatos que consegui acessar continuam descrevendo um único produto. Isso significa que, antes de definir um roadmap detalhado, vale revisar a organização das pastas, rotas, layouts e módulos para verificar se a arquitetura implementada realmente acompanha a separação conceitual.

Esse diagnóstico estrutural (pastas, módulos, dependências e fronteiras entre os dois produtos) seria o próximo passo mais útil antes de discutir novas funcionalidades.



---


## Ideais do Design - Alinhamento

- Modelo ao invés de "estrelas" ou "celestes", ser **Escrituras, templos, mapa antigo** coisas mais voltadas para periodo biblico, e como era ensinamentos naquela epoca
- Escritura 

- Adicionar um Mapa, e campo para "Encontre o núcleo mais próximo de você", que ao adicionar seu endereço, mostre os nucleos mais próximos
- Remover como núcleo "Maputo", manter apenas os presenciais no Brasil
