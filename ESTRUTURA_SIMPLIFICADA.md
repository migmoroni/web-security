# Estrutura Simplificada - Web Security Analyzer

## Visão Geral

A extensão foi simplificada e reorganizada em 4 partes principais, focada em analisar links e prover alertas visuais com bloqueio para links suspeitos ou perigosos.

## Terminologia

- **Tipo 1**: Não suspeito (sem alertas)
- **Tipo 2**: Suspeito (alerta visual + bloqueio com opção de prosseguir)  
- **Tipo 3**: Perigoso (alerta visual + bloqueio com opção de prosseguir)

*Nota: Não usamos mais o termo "seguro", apenas "não suspeito" quando não há alertas.*

## Estrutura das 4 Partes

### PARTE 1: INICIALIZADOR (`src/background/index.ts`)
Garante que todos os recursos da extensão estejam funcionando e operantes. A extensão fica alerta, operando em segundo plano.

**Responsabilidades:**
- Inicializar todos os serviços
- Gerenciar comunicação entre scripts
- Monitorar abas e navegação
- Coordenar respostas de segurança

### PARTE 2: SERVIÇOS
Programas que funcionam em segundo plano no navegador, inicializados pelo inicializador e geridos por service workers.

#### 2.1 - LinkScannerService (`src/services/LinkScannerService.ts`)
Programa que varre páginas à procura de links e hiperlinks (http ou https).
- Marca links para usuário saber que é um link
- Solicita apenas análise léxica
- Retorna se é URL do tipo 2 para avisar usuário
- Aplica indicadores visuais nos links

#### 2.2 - ClickInterceptorService (`src/services/ClickInterceptorService.ts`)  
Programa que ao clicar em links:
- Captura a ação
- Não permite carregar página ainda
- Envia para análise do link
- Faz as duas análises (léxica + reputação)
- Decide se bloqueia ou permite navegação

#### 2.3 - AlertService (`src/services/AlertService.ts`)
Programa que mostra mensagem de alerta para links do tipo 2 ou 3:
- Explica o que foi encontrado em detalhes
- Permite ao usuário ler os detalhes
- Oferece opção de voltar ou prosseguir

### PARTE 3: ANALISADORES
Analisam o que é passado a eles e retornam o resultado da análise.

#### 3.1 - LexicalAnalyzer (`src/analyzers/LexicalAnalyzer.ts`)
Analisador léxico de URLs:
- Analisa a grafia das URLs
- Verifica uso de conjuntos diferentes de caracteres Unicode
- Se há mistura: indica como tipo 2 (suspeito)
- Se mantém usando apenas um conjunto: passa como tipo 1 (não suspeito)

#### 3.2 - ReputationAnalyzer (`src/analyzers/ReputationAnalyzer.ts`)
Analisador de reputação de URLs:
- Analisa URLs através de listas para descobrir reputação
- Usa serviços do PhishTank e URLhaus
- Se retorna resultado positivo de periculosidade: indica como tipo 3 (perigoso)

### PARTE 4: CONFIGURAÇÕES
Quadro de configurações e acesso a status (mantém estrutura existente com ajustes para nova arquitetura).

## Fluxo de Funcionamento

1. **Inicialização**: Background script inicializa todos os serviços
2. **Varredura**: LinkScannerService varre página e marca links com análise léxica
3. **Interceptação**: ClickInterceptorService captura cliques em links externos
4. **Análise Completa**: Executa análise léxica + reputação
5. **Decisão**: Baseada no tipo mais alto encontrado:
   - Tipo 1: Permite navegação
   - Tipo 2/3: Mostra alerta via AlertService
6. **Ação do Usuário**: Voltar ou prosseguir com o link

## Indicadores Visuais

- **Tipo 1 (Não suspeito)**: Borda verde, fundo verde claro
- **Tipo 2 (Suspeito)**: Borda amarela, fundo amarelo claro, ícone ⚠️
- **Tipo 3 (Perigoso)**: Borda vermelha, fundo vermelho claro, ícone 🛡️

## Arquivos Principais

```
src/
├── background/index.ts          # Parte 1: Inicializador
├── services/
│   ├── LinkScannerService.ts    # Parte 2.1: Varredura de links
│   ├── ClickInterceptorService.ts # Parte 2.2: Interceptação de cliques
│   └── AlertService.ts          # Parte 2.3: Serviço de alerta
├── analyzers/
│   ├── LexicalAnalyzer.ts       # Parte 3.1: Análise léxica
│   └── ReputationAnalyzer.ts    # Parte 3.2: Análise de reputação
├── content/index.ts             # Orquestrador dos serviços
└── styles/globals.css           # Estilos dos indicadores visuais
```

## Regras de Análise

1. **Sempre considerar o tipo de perigo mais alto** como válido para a URL
2. **Análise léxica é rápida** e executada na varredura inicial
3. **Análise de reputação é mais lenta** e executada apenas no clique
4. **Tipo 3 sempre prevalece** sobre tipo 2
5. **Tipo 2 só é aplicado** se não houver tipo 3
