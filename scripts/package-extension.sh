#!/bin/bash

# Script para empacotar extensão já buildada

echo "📦 Empacotando extensão Security Web Analyzer..."

# Verificar se o build existe
if [ ! -d "dist/build" ]; then
    echo "❌ Pasta dist/build não encontrada. Execute npm run build primeiro."
    exit 1
fi

# Criar diretório de extensão se não existir
mkdir -p dist/extension

# Remover ZIP anterior se existir
rm -f dist/extension/security-web-extension.zip

# Criar novo arquivo ZIP
echo "🗜️  Criando arquivo ZIP..."
cd dist/build
zip -r ../extension/security-web-extension.zip ./*
cd ../..

echo "✅ Extensão empacotada com sucesso!"
echo "📁 Arquivo salvo em: dist/extension/security-web-extension.zip"
echo ""
echo "📊 Informações do pacote:"
ls -lh dist/extension/security-web-extension.zip
echo ""
echo "🚀 Para instalar:"
echo "   📂 Pasta de desenvolvimento: dist/build/"
echo "   📦 Arquivo para distribuição: dist/extension/security-web-extension.zip"
