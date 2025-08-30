#!/bin/bash

# Script para testar e empacotar a extensão

echo "🔧 Testando a extensão Security Web Analyzer..."

# Verificar se o build foi criado
if [ ! -d "dist/build" ]; then
    echo "❌ Pasta dist/build não encontrada. Execute npm run build primeiro."
    exit 1
fi

# Verificar arquivos essenciais
required_files=("dist/build/manifest.json" "dist/build/background/index.js" "dist/build/content/index.js" "dist/build/popup/index.js")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
done

echo "✅ Todos os arquivos obrigatórios estão presentes"

# Verificar ícones
icon_sizes=(16 32 48 128)
for size in "${icon_sizes[@]}"; do
    if [ ! -f "dist/build/icons/icon-${size}.png" ]; then
        echo "⚠️  Ícone ${size}x${size} não encontrado"
    else
        echo "✅ Ícone ${size}x${size} OK"
    fi
done

# Criar diretório para extensões se não existir
mkdir -p dist/extension

# Criar arquivo ZIP para distribuição
echo "📦 Criando pacote da extensão..."
cd dist/build
zip -r ../extension/security-web-extension.zip ./*
cd ../..

echo "🎉 Extensão empacotada com sucesso!"
echo "📁 Arquivo: dist/extension/security-web-extension.zip"
echo ""
echo "🚀 Para instalar a extensão:"
echo "   Chrome: Acesse chrome://extensions/, ative modo desenvolvedor, clique 'Carregar expandida' e selecione a pasta 'dist/build'"
echo "   Firefox: Acesse about:debugging, clique 'Este Firefox' e 'Carregar extensão temporária', selecione qualquer arquivo da pasta 'dist/build'"
echo ""
echo "📋 Funcionalidades implementadas:"
echo "   ✅ Análise Unicode para detectar spoofing de domínio"
echo "   ✅ Sistema de avisos de segurança"
echo "   ✅ Interface de configuração"
echo "   ✅ Interceptação de cliques em links"
echo "   ✅ Indicadores visuais para links suspeitos"
echo "   ✅ Manifest V3 compatível com Chrome e Firefox"
