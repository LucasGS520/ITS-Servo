# ITS-Servo - Instituto Teológico Servo

Plataforma web moderna para gerenciamento e documentação do Instituto Teológico Servo, construída com tecnologias modernas e boas práticas de desenvolvimento.

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Visão Geral

O ITS-Servo é uma aplicação web desenvolvida para o Instituto Teológico Servo, facilitando a gestão de informações e interações com a comunidade teológica.

## ✨ Características

- Interface responsiva e intuitiva
- Design moderno com componentes reutilizáveis
- Compilação otimizada com Vite
- TypeScript para maior segurança de tipos
- Componentes UI profissionais com shadcn-ui
- Estilização utilitária com Tailwind CSS
- Ambiente de desenvolvimento com recarga instantânea

## 🛠️ Tecnologias

Este projeto foi construído com:

- **[Vite](https://vitejs.dev/)** - Build tool e dev server rápido
- **[React](https://react.dev/)** - Biblioteca JavaScript para interfaces de usuário
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[shadcn-ui](https://ui.shadcn.com/)** - Componentes UI de alta qualidade
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário

## 📦 Pré-requisitos

- Node.js (versão 16 ou superior) - [Instale com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm (incluído com Node.js)
- Git

## 🚀 Instalação

### Passo 1: Clone o repositório

```bash
git clone https://github.com/seu-usuario/ITS-Servo.git
cd ITS-Servo
```

### Passo 2: Instale as dependências

```bash
npm install
```

### Passo 3: Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📖 Como Usar

### Comandos disponíveis

```bash
# Inicia o servidor de desenvolvimento com recarga automática
npm run dev

# Compila o projeto para produção
npm run build

# Visualiza o build de produção localmente
npm run preview

# Executa linter (se configurado)
npm run lint
```

### Desenvolvimento

1. Faça alterações nos arquivos do projeto
2. O navegador recarregará automaticamente com suas mudanças
3. Abra as Developer Tools (F12) para debugging

## 📁 Estrutura do Projeto

```
ITS-Servo/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── styles/           # Arquivo de estilos global
│   ├── App.tsx           # Componente raiz
│   └── main.tsx          # Ponto de entrada
├── public/               # Arquivos estáticos
├── node_modules/         # Dependências instaladas
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
├── vite.config.ts        # Configuração Vite
└── README.md             # Este arquivo
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** este repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código

- Use TypeScript para novo código
- Siga as convenções de nomenclatura do projeto
- Componentes React em PascalCase
- Arquivos em kebab-case
- Mantenha a formatação consistente

## 🐛 Reportando Bugs

Se encontrar um bug, por favor abra uma [Issue](../../issues) com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. comportamento atual
- Screenshots se aplicável
- Seu ambiente (SO, versão do Node.js, etc.)

## 📝 Licença

Este projeto é licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📧 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato através das [Issues](../../issues) do repositório.

---

**Desenvolvido com ❤️ para o Instituto Teológico Servo**
