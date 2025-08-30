#!/bin/bash

# Script para limpar e reconstruir ambiente Docker

echo "🧹 Limpando ambiente Docker..."

# Parar todos os containers relacionados ao projeto
sudo docker compose down -v --remove-orphans

# Remover imagens antigas do projeto
echo "🗑️  Removendo imagens antigas..."
sudo docker image prune -f
sudo docker images | grep security-web | awk '{print $3}' | xargs -r sudo docker rmi -f

# Limpar cache npm do Docker
echo "🧽 Limpando cache npm..."
sudo docker system prune -f

# Reconstruir imagens
echo "🔨 Reconstruindo imagens..."
sudo docker compose build --no-cache

echo "✅ Ambiente Docker limpo e reconstruído!"
echo ""
echo "🚀 Para iniciar:"
echo "  sudo docker compose up dev          # Desenvolvimento"
echo "  sudo docker compose run --rm build  # Build"
