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
# Build para ambos os motores
npm run build

# Build específico para Blink (Chromium, Chrome, Edge, Brave, Opera)
npm run build:blink

# Build específico para Gecko (Firefox, LibreWolf) 
npm run build:gecko

# Build completo + empacotamento
npm run build:package
```

3. Carregar a extensão no navegador:
   - **Blink (Chrome/Chromium/Edge/Brave/Opera)**: Vá para `chrome://extensions/`, ative o modo desenvolvedor e clique em "Carregar extensão expandida", selecionando a pasta `dist/build/blink`
   - **Gecko (Firefox/LibreWolf)**: Vá para `about:debugging`, clique em "Este Firefox" e "Carregar extensão temporária", selecionando o arquivo `dist/build/gecko/manifest.json`

## Estrutura de Build

A extensão é agora construída com suporte nativo para diferentes motores de navegadores:

```
dist/
├── build/
│   ├── blink/           # Build para Blink (Chromium, Chrome, Edge, Brave, Opera)
│   │   ├── manifest.json (Manifest V3)
│   │   ├── background/
│   │   ├── content/
│   │   └── popup/
│   └── gecko/           # Build para Gecko (Firefox, LibreWolf)
│       ├── manifest.json (Manifest V2)
│       ├── background/
│       ├── content/
│       └── popup/
└── extension/
    ├── security-web-extension.zip              # Se builds são idênticos
    ├── security-web-extension-blink.zip        # Se builds diferem
    └── security-web-extension-gecko.zip        # Se builds diferem
```

## Scripts Disponíveis

### Scripts de Build
- `npm run dev`: Build em modo desenvolvimento com watch (Blink)
- `npm run dev:blink`: Build em modo desenvolvimento para Blink
- `npm run dev:gecko`: Build em modo desenvolvimento para Gecko
- `npm run build`: Build para produção (Blink + Gecko)
- `npm run build:blink`: Build específico para Blink (Manifest V3)
- `npm run build:gecko`: Build específico para Gecko (Manifest V2)

### Scripts de Empacotamento
- `npm run package:blink`: Empacota extensão Blink em ZIP
- `npm run package:gecko`: Empacota extensão Gecko em ZIP
- `npm run build:package`: Build completo + empacotamento inteligente

**Empacotamento Inteligente:**
- Se os builds são idênticos (exceto manifest): gera `security-web-extension.zip` universal
- Se os builds diferem: gera ZIPs específicos por motor (`-blink.zip`, `-gecko.zip`)

### Scripts de Qualidade
- `npm run lint`: Verificação de código
- `npm run type-check`: Verificação de tipos TypeScript

### Scripts Docker
- `npm run docker:dev`: Desenvolvimento no Docker
- `npm run docker:build`: Build no Docker
- `npm run docker:test`: Testes no Docker
- `npm run docker:package`: Build e empacotamento completo no Docker

## Diferenças entre Motores de Navegadores

### Blink (Manifest V3)
**Navegadores suportados:** Chromium, Google Chrome, Microsoft Edge, Brave, Opera
- Utiliza `service_worker` para background
- API `action` para extensão popup
- Permissões `host_permissions` separadas
- Máxima compatibilidade com navegadores baseados em Chromium

### Gecko (Manifest V2)
**Navegadores suportados:** Mozilla Firefox, LibreWolf
- Utiliza `background.scripts` array
- API `browser_action` para extensão popup
- Inclui configuração `applications.gecko` para Firefox Add-ons
- Permissões integradas no array principal
- Suporte nativo para APIs abertas do WebExtensions
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
