# 🛡️ Web Security Extension

Uma extensão completa de segurança para Chrome (Blink) e Firefox (Gecko) que protege contra phishing, typosquatting e ataques Unicode.

## ✨ Recursos Principais

### 🔒 Proteção Abrangente
- **Interceptação de Navegação**: Monitora mudanças de URL na barra de endereços
- **Proteção de Cliques**: Analisa links antes do clique
- **Segurança de Formulários**: Verifica URLs de destino de formulários
- **Bloqueio de Popups**: Impede abertura de janelas suspeitas

### 🔍 Análise Avançada
- **Detecção Unicode**: Identifica ataques de spoofing com caracteres similares
- **Typosquatting**: Detecta domínios que imitam sites legítimos
- **APIs de Segurança**: Integração com PhishTank e VirusTotal
- **Análise Dinâmica**: Verificação em tempo real de todas as navegações

### 👁️ Indicadores Visuais
- **Bordas Coloridas**: Links seguros (verde), suspeitos (amarelo), perigosos (vermelho)
- **Configuração Personalizada**: Cores, espessura e estilo das bordas ajustáveis
- **Presets de Acessibilidade**: Esquemas especiais para daltonismo e alto contraste

### ♿ Acessibilidade Completa
- **Esquemas para Daltonismo**: Cores específicas para diferentes tipos de daltonismo
- **Alto Contraste**: Modo de alto contraste para baixa visão
- **Texto Ampliado**: Opção de aumentar tamanho do texto
- **Navegação por Teclado**: Suporte aprimorado para navegação via teclado
- **Redução de Movimento**: Opção para reduzir animações

### 📊 Sistema de Histórico
- **Histórico de 30 Dias**: Mantém log de todas as URLs analisadas
- **Filtros Avançados**: Filtrar por segurança (safe/suspicious/dangerous)
- **Ordenação**: Ordenar por data, domínio ou severidade
- **Estatísticas**: Dashboard com métricas de segurança
- **Gestão Automática**: Limpeza automática após 30 dias

## 🎨 Interface Reorganizada

### Abas do Popup

#### 📈 Status
- Resumo da proteção ativa
- Contador de análises realizadas
- URL atual sendo protegida
- Links rápidos para demonstração e configuração

#### ⚙️ Sistema
- Configurações de segurança e análise
- Ativação/desativação de recursos
- Configurações de bloqueio
- Alertas e notificações

#### 🎨 Design
- **Temas**: Claro, escuro ou automático
- **Esquemas de Cores**: 
  - Padrão (verde/amarelo/vermelho)
  - Daltonismo (azul/vermelho/vermelho escuro)
  - Alto Contraste (preto/cinza/preto)
  - Sutil (tons suaves)
- **Indicadores Visuais**: Configuração de bordas e estilos
- **Acessibilidade**: Opções para diferentes necessidades
- **Presets Rápidos**: Aplicação instantânea de configurações

#### 📚 Histórico
- Lista de URLs analisadas nos últimos 30 dias
- Filtros por nível de segurança
- Estatísticas de uso e detecções
- Exportação e limpeza de dados

## 🚀 Instalação

### Chrome (Manifest V3 - Blink)
1. Vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `dist/build/blink/`

### Firefox (Manifest V2 - Gecko)
1. Vá para `about:debugging`
2. Clique em "Este Firefox"
3. Clique em "Carregar extensão temporária"
4. Selecione o arquivo `manifest.json` em `dist/build/gecko/`

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Configuração
```bash
# Clonar o repositório
git clone [repository-url]
cd web-security-extension

# Instalar dependências
npm install

# Build de desenvolvimento
npm run dev

# Build de produção
npm run build

# Watch mode para desenvolvimento
npm run watch
```

### Estrutura do Projeto
```
src/
├── analyzers/           # Motores de análise de segurança
├── components/          # Componentes React do popup
│   ├── ConfigPanel.tsx     # Configurações do sistema
│   ├── DesignConfigPanel.tsx # Configurações de design e acessibilidade
│   └── HistoryPanel.tsx    # Painel de histórico
├── content/             # Scripts de conteúdo
├── popup/              # Interface principal do popup
├── services/           # Serviços de backend
├── styles/             # Estilos CSS e temas
└── types/              # Definições TypeScript
```

## 🔧 Configurações Disponíveis

### Sistema
- Análise Unicode ativa/inativa
- Bloqueio automático de links suspeitos
- Exibição de avisos de segurança
- Integração com APIs externas

### Design e Acessibilidade
- **Temas**: Claro, escuro, automático (baseado no sistema)
- **Cores Personalizáveis**: Para cada nível de risco
- **Estilos de Borda**: Sólida, tracejada, pontilhada
- **Acessibilidade**: Suporte completo para diferentes necessidades

### Histórico
- Retenção de 30 dias automática
- Filtros por nível de segurança
- Estatísticas detalhadas
- Exportação de dados

## 🔐 Segurança

### Detecções Implementadas
- **Unicode Spoofing**: Caracteres cirílicos/gregos em domínios latinos
- **Typosquatting**: Variações comuns de domínios populares
- **Phishing Bancário**: Padrões típicos de sites fraudulentos
- **Imitações de Serviços**: Falsificações de plataformas conhecidas

### APIs de Verificação
- **PhishTank**: Base de dados colaborativa de phishing
- **VirusTotal**: Análise de reputação de URLs
- **Análise Local**: Algoritmos proprietários de detecção

## 🌐 Compatibilidade

### Navegadores Suportados
- **Chrome**: Versões 88+ (Manifest V3)
- **Firefox**: Versões 89+ (Manifest V2)
- **Edge**: Versões baseadas em Chromium
- **Opera**: Versões baseadas em Chromium

### Plataformas
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, Fedora, Debian)

## 📱 Demonstração

A extensão inclui uma página de demonstração interativa (`demo.html`) com:
- Exemplos de links seguros (bordas verdes)
- Simulações de typosquatting (bordas amarelas)
- Exemplos de phishing avançado (bordas vermelhas)
- Demonstrações de Unicode spoofing

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔄 Histórico de Versões

### v1.0.0 (Setembro 2025)
- ✅ Proteção completa contra phishing e typosquatting
- ✅ Indicadores visuais com bordas coloridas
- ✅ Sistema de configuração com 4 abas (Status/Sistema/Design/Histórico)
- ✅ Suporte completo à acessibilidade
- ✅ Histórico de 30 dias com estatísticas
- ✅ Compatibilidade Chrome MV3 e Firefox MV2
- ✅ Página de demonstração unificada
- ✅ Temas claro/escuro/automático

## 🎯 Próximos Recursos

- [ ] Machine Learning para detecção avançada
- [ ] Sincronização entre dispositivos
- [ ] Whitelist personalizada
- [ ] Relatórios de segurança detalhados
- [ ] API para desenvolvedores

---

**Desenvolvido com ❤️ para manter a web mais segura para todos.**
