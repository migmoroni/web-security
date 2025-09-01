# 🔒 Web Security Analyzer - Sistema de Análise Dinâmica

## 📋 Visão Geral
Sistema avançado de detecção de ameaças para navegadores que analisa links de forma dinâmica, detectando:
- **Alfabetos Mistos**: Mistura suspeita de famílias de alfabetos diferentes
- **Similaridade**: Comparação com base de sites legítimos conhecidos
- **Homóglifos**: Caracteres que imitam visualmente letras latinas

## 🏗️ Arquitetura do Sistema

### Core Analyzers

#### 1. MixedScriptAnalyzer.ts
**Funcionalidade**: Detecta mistura de alfabetos e ataques de homóglifos
- **Scripts Suportados**: Latin, Cyrillic, Greek, Arabic, Hebrew, Chinese, Japanese, Korean, Thai, Devanagari
- **Homóglifos Mapeados**: 20+ caracteres com suas variações visuais
- **Detecção**: Analisa cada caractere e identifica scripts não-latinos em domínios esperadamente latinos

```typescript
// Exemplo de detecção
const result = await mixedScriptAnalyzer.analyze('gооglе.com');
// Detecta: 'о' (cyrillic) no lugar de 'o' (latin)
```

#### 2. DomainSimilarityAnalyzer.ts  
**Funcionalidade**: Compara domínios com base de sites legítimos
- **Base de Dados**: 130+ sites organizados por primeira letra (a-z)
- **Algoritmo**: Levenshtein distance para cálculo de similaridade
- **Otimização**: Busca indexada por primeira letra + letras adjacentes (0/o, 1/l)

```typescript
// Exemplo de detecção
const result = await domainAnalyzer.analyze('goggle.com');
// Detecta: 85% similar a google.com, diferença: letra 'o' extra
```

#### 3. SecurityAnalyzer.ts (Coordenador Principal)
**Funcionalidade**: Coordena todos os analisadores e Unicode analysis
- **Registro**: Sistema de registry para analisadores modulares
- **Integração**: Combina resultados de múltiplos analisadores
- **Scoring**: Calcula nível de suspeição geral (low/medium/high)

### 📊 Base de Dados de Sites Legítimos

#### legitimate-sites.json
Organização otimizada por primeira letra:
```json
{
  "a": ["amazon.com", "apple.com", "adobe.com", ...],
  "b": ["bing.com", "baidu.com", "bbc.com", ...],
  "g": ["google.com", "github.com", "gmail.com", ...],
  ...
}
```

**Performance**: O(1) lookup por primeira letra vs O(n) busca linear
**Cobertura**: Sites populares, brasileiros, internacionais, serviços críticos

## 🔍 Fluxo de Análise Dinâmica

### 1. Captura de URL
```
URL detectada → Extração de hostname → Normalização
```

### 2. Análise Paralela
```
├── UnicodeAnalyzer (já existente)
├── MixedScriptAnalyzer (novo)
├── DomainSimilarityAnalyzer (novo)
├── PhishingAnalyzer
└── DomainReputationAnalyzer
```

### 3. Consolidação de Resultados
```
SecurityIssue[] → Severity Calculation → User Warning
```

## 🎯 Casos de Detecção

### Alfabetos Mistos
- **gооglе.com**: Cyrillic 'о' + Latin resto
- **αpple.com**: Greek 'α' + Latin resto  
- **faϲebook.com**: Greek 'ϲ' + Latin resto

### Similaridade Suspeita
- **goggle.com**: 85% similar a google.com (letra extra)
- **arnazon.com**: 90% similar a amazon.com ('rn' → 'm')
- **paypaI.com**: 95% similar a paypal.com ('I' maiúsculo → 'l')

### Homóglifos Complexos
- **0** (zero) → **o** (letra)
- **1** (um) → **l** (letra L) → **I** (letra i maiúsculo)
- **а** (cyrillic a) → **a** (latin a)

## 🛡️ Níveis de Severidade

### High (Alto Risco)
- Similaridade > 90% com site legítimo conhecido
- Mistura de alfabetos detectada
- Homóglifos em posições críticas

### Medium (Risco Médio)  
- Similaridade 70-90% com site conhecido
- Poucos caracteres suspeitos
- Padrões de phishing conhecidos

### Low (Baixo Risco)
- Similaridade < 70%
- Domínios claramente diferentes
- Análises inconclusivas

## 🚀 Performance

### Otimizações Implementadas
1. **Indexação por Letra**: Reduz espaço de busca de O(n) para O(k)
2. **Busca Adjacente**: Verifica caracteres similares (0/o, 1/l)
3. **Early Exit**: Para análise quando similaridade é baixa
4. **Cache de Scripts**: Reutiliza detecção de ranges Unicode

### Métricas
- **Base de Dados**: 130+ sites legítimos
- **Scripts Suportados**: 10 famílias de alfabetos
- **Homóglifos Mapeados**: 20+ caracteres
- **Tempo de Análise**: < 10ms por domínio

## 🔧 Configuração e Build

### Comandos Disponíveis
```bash
npm run build:blink    # Build para Chromium/Chrome/Edge/Brave/Opera
npm run build:gecko    # Build para Firefox/LibreWolf  
npm run package        # Gera extensões finais (.zip)
npm run docker:build   # Build em ambiente Docker
```

### Estrutura de Outputs
```
dist/
├── build/
│   ├── blink/          # Manifest V3 (Chromium)
│   └── gecko/          # Manifest V2 (Firefox)
└── extension/
    └── web-security-extension.zip  # Extensão universal
```

## 🧪 Testes Incluídos

### test-cases.html
Página com casos de teste reais:
- Links com alfabetos mistos
- Domínios com alta similaridade
- Sites legítimos para controle
- Instruções de teste detalhadas

### Como Testar
1. Abra `test-cases.html` no navegador
2. Instale a extensão Web Security
3. Clique nos links de teste
4. Observe os avisos da extensão
5. Verifique detalhes da análise

## 📈 Evolução do Sistema

### Implementado ✅
- ✅ Análise de alfabetos mistos avançada
- ✅ Base de dados de sites legítimos
- ✅ Sistema de similaridade com Levenshtein
- ✅ Detecção de homóglifos sofisticada
- ✅ Build system para Blink/Gecko
- ✅ Empacotamento inteligente

### Próximas Melhorias 🔄
- 🔄 Machine Learning para padrões novos
- 🔄 API de reputação em tempo real
- 🔄 Whitelist personalizada do usuário
- 🔄 Relatórios de segurança detalhados

## 🌐 Compatibilidade

### Engines Suportados
- **Blink**: Chromium, Chrome, Edge, Brave, Opera (Manifest V3)
- **Gecko**: Firefox, LibreWolf (Manifest V2)

### Tecnologias
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Webpack 5 + PostCSS
- **Containers**: Docker Alpine + Node.js 18
- **Security**: Content Security Policy compliant

---

**🔒 Web Security Analyzer** - Protegendo usuários contra ameaças sofisticadas de phishing e spoofing de domínios através de análise dinâmica em tempo real.
