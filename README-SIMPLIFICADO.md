# Web Security Analyzer - Versão Simplificada

Extensão de navegador focada em analisar links e prover alertas visuais com bloqueio para links suspeitos ou perigosos.

## 🎯 Funcionalidades Principais

- **Análise visual de links**: Marcação automática de links com indicadores visuais
- **Interceptação de cliques**: Bloqueio e análise antes de navegar para links externos
- **Alertas de segurança**: Mensagens detalhadas para links suspeitos ou perigosos
- **Análise dupla**: Léxica (Unicode) + Reputação (PhishTank/URLhaus)

## 🏗️ Arquitetura Simplificada

### Parte 1: Inicializador
- **Arquivo**: `src/background/index.ts`
- **Função**: Garante que todos os recursos estejam operantes
- **Responsabilidade**: Coordenação geral e comunicação entre scripts

### Parte 2: Serviços
1. **LinkScannerService** (`src/services/LinkScannerService.ts`)
   - Varre páginas procurando links HTTP/HTTPS
   - Aplica análise léxica rápida
   - Marca visualmente links suspeitos (tipo 2)

2. **ClickInterceptorService** (`src/services/ClickInterceptorService.ts`)
   - Intercepta cliques em links externos
   - Executa análise completa (léxica + reputação)
   - Decide se bloqueia ou permite navegação

3. **AlertService** (`src/services/AlertService.ts`)
   - Exibe alertas para links tipo 2 (suspeito) ou 3 (perigoso)
   - Mostra detalhes da análise
   - Permite usuário voltar ou prosseguir

### Parte 3: Analisadores
1. **LexicalAnalyzer** (`src/analyzers/LexicalAnalyzer.ts`)
   - Analisa caracteres Unicode na URL
   - Detecta mistura de scripts (tipo 2)
   - Identifica caracteres potencialmente confusos

2. **ReputationAnalyzer** (`src/analyzers/ReputationAnalyzer.ts`)
   - Consulta PhishTank e URLhaus
   - Identifica URLs perigosas (tipo 3)
   - Fornece detalhes das fontes de ameaça

### Parte 4: Configurações
- Interface existente mantida com ajustes para nova estrutura

## 🎨 Sistema de Tipos

| Tipo | Status | Indicador Visual | Ação |
|------|--------|------------------|------|
| 1 | Não suspeito | 🟢 Verde claro | Navegação normal |
| 2 | Suspeito | 🟡 Amarelo + ⚠️ | Alerta + opção de prosseguir |
| 3 | Perigoso | 🔴 Vermelho + 🛡️ | Alerta + opção de prosseguir |

*Sempre considera o tipo de perigo mais alto como válido para a URL*

## 🚀 Como Testar

1. **Build da extensão**:
   ```bash
   npm run build:blink
   ```

2. **Usar script de teste**:
   ```bash
   ./test-extension.sh
   ```

3. **Carregar no navegador**:
   - Chrome/Edge: `chrome://extensions/` → Carregar sem compactação → `dist/build/blink/`
   - Firefox: `about:debugging` → Este Firefox → Carregar complemento temporário

4. **Teste manual**:
   - Abra `public/test.html` para página de teste
   - Observe indicadores visuais nos links
   - Clique em links para testar interceptação
   - Verifique alertas no console (F12)

## 📁 Estrutura de Arquivos

```
src/
├── background/index.ts          # Inicializador principal
├── content/index.ts             # Orquestrador dos serviços
├── services/
│   ├── LinkScannerService.ts    # Varredura e marcação visual
│   ├── ClickInterceptorService.ts # Interceptação de cliques
│   └── AlertService.ts          # Sistema de alertas
├── analyzers/
│   ├── LexicalAnalyzer.ts       # Análise de caracteres Unicode
│   └── ReputationAnalyzer.ts    # Consulta a bases de ameaças
├── types/index.ts               # Tipos TypeScript simplificados
└── styles/globals.css           # Estilos dos indicadores visuais
```

## 🔧 Desenvolvimento

### Comandos úteis:
```bash
# Build para Chrome/Edge
npm run build:blink

# Build para Firefox  
npm run build:gecko

# Teste da extensão
./test-extension.sh

# Limpeza
npm run clean
```

### Logs importantes:
- `🚀 Inicializando Web Security Analyzer...` - Inicializador ativo
- `🔍 Inicializando LinkScannerService...` - Varredura operacional
- `🎯 Inicializando ClickInterceptorService...` - Interceptação ativa
- `✅ AlertService inicializado` - Sistema de alertas pronto

## 🛡️ Segurança

- **Análise local**: Processamento no navegador do usuário
- **APIs externas**: Apenas PhishTank e URLhaus para reputação
- **Privacidade**: Nenhum dado pessoal é coletado ou enviado
- **Transparência**: Logs detalhados no console para auditoria

## 📝 Changelog da Simplificação

### Removido:
- Múltiplos analisadores complexos
- Sistema de scores complexo
- Terminologia "seguro/inseguro"
- Dependências desnecessárias

### Adicionado:
- Sistema de tipos simples (1, 2, 3)
- Arquitetura clara em 4 partes
- Análise dupla eficiente
- Indicadores visuais melhorados
- Documentação detalhada

### Mantido:
- Interface de configurações
- Sistema de histórico
- Storage service
- Compatibilidade com navegadores
