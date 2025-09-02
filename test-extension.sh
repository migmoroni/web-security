#!/bin/bash

# Script para testar a extensão simplificada
echo "🔧 Testando Web Security Analyzer - Estrutura Simplificada"
echo "=================================================="

# 1. Build da extensão
echo "📦 Fazendo build da extensão..."
npm run build:blink

if [ $? -eq 0 ]; then
    echo "✅ Build concluída com sucesso!"
else
    echo "❌ Erro na build!"
    exit 1
fi

# 2. Abrir página de teste
echo ""
echo "🌐 Abrindo página de teste..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_FILE="file://$SCRIPT_DIR/public/test.html"

# Detectar navegador disponível
if command -v google-chrome &> /dev/null; then
    google-chrome "$TEST_FILE" 2>/dev/null &
    echo "🚀 Página aberta no Chrome: $TEST_FILE"
elif command -v chromium-browser &> /dev/null; then
    chromium-browser "$TEST_FILE" 2>/dev/null &
    echo "🚀 Página aberta no Chromium: $TEST_FILE"
elif command -v firefox &> /dev/null; then
    firefox "$TEST_FILE" 2>/dev/null &
    echo "🚀 Página aberta no Firefox: $TEST_FILE"
else
    echo "⚠️ Navegador não encontrado. Abra manualmente: $TEST_FILE"
fi

echo ""
echo "📋 Instruções de teste:"
echo "1. Carregue a extensão no navegador (pasta dist/build/blink/)"
echo "2. Observe os indicadores visuais nos links"
echo "3. Clique nos links para testar interceptação"
echo "4. Verifique alertas para links suspeitos/perigosos"
echo "5. Abra o console (F12) para ver logs dos serviços"
echo ""
echo "🎯 Pasta da extensão para carregar: $(pwd)/dist/build/blink/"
