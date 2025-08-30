#!/bin/bash

# Script de setup do ambiente Docker

echo "🐳 Configurando ambiente Docker para Security Web Extension"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "📖 Para instalar no Ubuntu/Debian:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sh get-docker.sh"
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está disponível!"
    echo "📖 Docker Compose deve estar incluído no Docker moderno"
    exit 1
fi

echo "✅ Docker instalado: $(docker --version)"
echo "✅ Docker Compose instalado: $(docker compose version)"

# Verificar permissões do Docker
if ! docker ps &> /dev/null; then
    echo "⚠️  Usuário não tem permissões para usar Docker"
    echo "🔧 Para adicionar usuário ao grupo docker:"
    echo "   sudo usermod -aG docker $USER"
    echo "   newgrp docker  # ou faça logout/login"
    echo ""
    echo "🔄 Tentando executar com sudo..."
    USE_SUDO="sudo "
else
    echo "✅ Permissões Docker OK"
    USE_SUDO=""
fi

# Construir imagem base
echo "🔨 Construindo imagem Docker..."
${USE_SUDO}docker compose build dev

echo ""
echo "🎉 Setup Docker concluído!"
echo ""
echo "📋 Comandos disponíveis:"
echo "  ./docker.sh dev     - Desenvolvimento"
echo "  ./docker.sh build   - Build da extensão"
echo "  ./docker.sh test    - Executar testes"
echo "  ./docker.sh package - Empacotar extensão"
echo "  make docker-all     - Build completo no Docker"
echo ""
echo "💡 Dica: Se tiver problemas de permissão, execute:"
echo "   sudo ./scripts/docker-setup.sh"
