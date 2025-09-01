# 🚀 Guia de Instalação Rápida - Web Security Extension

## Para Chrome/Edge/Brave/Opera (Blink Engine)

### 1. Preparar a Extensão
```bash
# No terminal, dentro da pasta do projeto:
npm run build
```

### 2. Instalar no Chrome
1. Abra o Chrome e vá para: `chrome://extensions/`
2. No canto superior direito, ative o **"Modo do desenvolvedor"**
3. Clique no botão **"Carregar sem compactação"**
4. Navegue até a pasta do projeto e selecione: `dist/build/blink/`
5. A extensão será instalada e aparecerá na barra de ferramentas

## Para Firefox (Gecko Engine)

### 1. Preparar a Extensão
```bash
# No terminal, dentro da pasta do projeto:
npm run build
```

### 2. Instalar no Firefox
1. Abra o Firefox e vá para: `about:debugging`
2. Clique em **"Este Firefox"** na lateral esquerda
3. Clique no botão **"Carregar extensão temporária"**
4. Navegue até `dist/build/gecko/` e selecione o arquivo `manifest.json`
5. A extensão será instalada temporariamente

## ✅ Verificar Instalação

### 1. Ícone da Extensão
- Procure o ícone 🛡️ na barra de ferramentas do navegador
- Se não estiver visível, clique no ícone de extensões (puzzle) e fixe a extensão

### 2. Testar Funcionalidade
- Clique no ícone da extensão para abrir o popup
- Você deve ver 4 abas: **Status**, **Sistema**, **Design**, **Histórico**
- Vá para a aba **Design** para personalizar cores e acessibilidade

### 3. Página de Demonstração
- No popup, clique em **"Ver Demonstração"**
- Você será redirecionado para a página de teste com links de exemplo
- Os links devem aparecer com bordas coloridas (verde=seguro, amarelo=suspeito, vermelho=perigoso)

## 🎨 Personalização Rápida

### Para Usuários com Daltonismo
1. Abra o popup da extensão
2. Vá para a aba **"Design"**
3. Em **"Esquema de Cores"**, selecione **"Para Daltonismo"**
4. As cores mudarão para azul (seguro) e vermelho (suspeito/perigoso)

### Para Alto Contraste
1. Na aba **"Design"**
2. Selecione **"Alto Contraste"** no esquema de cores
3. Ative também **"Alto contraste"** nas opções de acessibilidade

### Para Reduzir Animações
1. Na aba **"Design"**
2. Em **"Acessibilidade"**, marque **"Reduzir animações"**

## 🔧 Solução de Problemas

### A extensão não aparece
- Verifique se o "Modo do desenvolvedor" está ativado
- Tente recarregar a extensão em `chrome://extensions/`

### Links não têm bordas coloridas
- Verifique se está na aba **"Design"** e se **"Ativar indicadores visuais nos links"** está marcado
- Teste na página de demonstração primeiro

### Firefox não carrega
- Certifique-se de selecionar o arquivo `manifest.json` em `dist/build/gecko/`
- A extensão no Firefox é temporária e precisa ser recarregada após reiniciar o navegador

## 📞 Suporte

Se encontrar problemas, verifique:
1. Se o Node.js 18+ está instalado
2. Se todas as dependências foram instaladas (`npm install`)
3. Se o build foi executado com sucesso (`npm run build`)

---

**Instalação concluída! Sua navegação agora está mais segura. 🛡️**
