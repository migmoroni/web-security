# Security Web Extension

Uma extensão de navegador para análise de segurança de websites em tempo real.

## Funcionalidades

- 🔍 **Análise Unicode**: Detecta caracteres suspeitos e scripts mistos em URLs que podem indicar spoofing de domínio
- 🚨 **Alertas de Segurança**: Mostra avisos antes de navegar para sites suspeitos
- ⚙️ **Configurável**: Interface amigável para ajustar as configurações de segurança
- 📊 **Histórico**: Mantém registro das análises realizadas
- 🎨 **Interface Moderna**: Built com React, TypeScript e Tailwind CSS

## Tecnologias

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Webpack 5
- **Manifest**: V3 (compatível com Chrome e Firefox)

## Instalação para Desenvolvimento

### Opção 1: Ambiente Local
1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Build da extensão:
```bash
npm run build
```

### Opção 2: Ambiente Docker
1. Configure o Docker:
```bash
./scripts/docker-setup.sh
```

2. Build da extensão:
```bash
./docker.sh build
# ou
make docker-build
```

4. Carregue a extensão no navegador:
   - **Chrome**: Vá para `chrome://extensions/`, ative o modo desenvolvedor e clique em "Carregar extensão expandida", selecionando a pasta `dist/build`
   - **Firefox**: Vá para `about:debugging`, clique em "Este Firefox" e "Carregar extensão temporária", selecionando qualquer arquivo da pasta `dist/build`

## Estrutura de Build

- `dist/build/`: Contém os arquivos da extensão prontos para instalação
- `dist/extension/`: Contém o arquivo ZIP da extensão para distribuição

## Scripts Disponíveis

### Scripts Nativos
- `npm run dev`: Build em modo desenvolvimento com watch
- `npm run build`: Build para produção
- `npm run build:firefox`: Build específico para Firefox
- `npm run lint`: Verificação de código
- `npm run type-check`: Verificação de tipos TypeScript
- `npm run package`: Empacota extensão em ZIP

### Scripts Docker
- `npm run docker:dev`: Desenvolvimento no Docker
- `npm run docker:build`: Build no Docker
- `npm run docker:test`: Testes no Docker
- `npm run docker:package`: Empacotamento no Docker

### Scripts de Conveniência
- `./dev.sh [comando]`: Script principal de desenvolvimento
- `./docker.sh [comando]`: Gerenciamento Docker
- `make [target]`: Comandos via Makefile

### Comandos Make
- `make setup`: Setup inicial completo
- `make dev`: Desenvolvimento local
- `make docker-dev`: Desenvolvimento no Docker
- `make all`: Build + package completo
- `make docker-all`: Build + package no Docker

## Arquitetura

A extensão é construída de forma modular:

### Analyzers (`src/analyzers/`)
- **UnicodeAnalyzer**: Detecta caracteres suspeitos e scripts mistos
- **SecurityAnalyzer**: Orquestrador principal das análises

### Services (`src/services/`)
- **StorageService**: Gerencia configurações e histórico no storage do navegador

### Components (`src/components/`)
- **SecurityWarning**: Modal de aviso de segurança
- **ConfigPanel**: Painel de configurações

### Scripts
- **Background Script**: Gerencia eventos e comunicação entre componentes
- **Content Script**: Intercepta cliques em links e adiciona indicadores visuais

## Configurações

A extensão permite configurar:
- Ativar/desativar análise de segurança
- Análise Unicode específica
- Bloqueio automático de links suspeitos
- Exibição de avisos

## Segurança

A extensão analisa URLs em busca de:
- **Scripts Unicode Mistos**: URLs que misturam diferentes sistemas de escrita (ex: latino + cirílico)
- **Caracteres Suspeitos**: Caracteres que podem ser confundidos com latinos comuns
- **Spoofing de Domínio**: Tentativas de imitar domínios legítimos

## Desenvolvimento Futuro

A arquitetura permite fácil adição de novos analisadores:
- Análise de reputação de domínio
- Verificação de certificados SSL
- Detecção de phishing baseada em ML
- Análise de conteúdo da página

## Licença

MIT License
