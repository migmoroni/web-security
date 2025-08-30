# 🚀 Security Web Extension - Guia de Uso

## 📁 Estrutura de Build Atualizada

O projeto agora organiza os arquivos de build da seguinte forma:

```
dist/
├── build/                              # ← Extensão pronta para instalação
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── icons/
│   └── ...
└── extension/                          # ← Arquivo para distribuição
    └── security-web-extension.zip
```

## 🔨 Comandos de Build

### Build Completo
```bash
npm run build                   # Gera arquivos em dist/build/
npm run package                 # Cria ZIP em dist/extension/
npm run build:package           # Build + Package em um comando
```

### Scripts de Desenvolvimento
```bash
./dev.sh build                  # Build de produção
./dev.sh package                # Empacota extensão já buildada
./dev.sh test                   # Build + testa + empacota
./dev.sh clean                  # Limpa todas as pastas de build
```

## 📦 Instalação da Extensão

### Para Desenvolvimento (pasta dist/build/)
- **Chrome**: `chrome://extensions/` → "Carregar expandida" → selecionar pasta `dist/build/`
- **Firefox**: `about:debugging` → "Carregar extensão temporária" → qualquer arquivo da pasta `dist/build/`

### Para Distribuição (arquivo ZIP)
- Use o arquivo `dist/extension/security-web-extension.zip`
- Para publicação nas lojas oficiais ou distribuição manual

## 🎯 Workflow Recomendado

1. **Desenvolvimento**:
   ```bash
   ./dev.sh dev                 # Watch mode para desenvolvimento
   ```

2. **Teste Local**:
   ```bash
   ./dev.sh test                # Build + teste + package
   ```

3. **Distribuição**:
   ```bash
   npm run build:package        # Build final + ZIP
   ```

## 🔍 Verificação dos Arquivos

Após o build, você deve ter:
- ✅ `dist/build/manifest.json` - Manifest da extensão
- ✅ `dist/build/background/index.js` - Service worker
- ✅ `dist/build/content/index.js` - Script de conteúdo
- ✅ `dist/build/popup/index.js` - Interface do popup
- ✅ `dist/build/icons/` - Ícones da extensão
- ✅ `dist/extension/security-web-extension.zip` - Pacote final

## 🛡️ Funcionalidades Implementadas

- **Análise Unicode**: Detecta spoofing via caracteres cirílicos/latinos
- **Sistema Modular**: Arquitetura para adicionar novos analisadores
- **Interface React**: Popup moderno com configurações
- **Avisos de Segurança**: Janelas explicativas antes da navegação
- **Indicadores Visuais**: Bordas coloridas em links suspeitos
- **Compatibilidade**: Manifest V3 para Chrome e Firefox

A estrutura está pronta e organizada conforme solicitado!
