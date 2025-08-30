#!/bin/bash

# Script para gerenciar ambiente Docker da extensão Security Web

show_help() {
    echo "🐳 Security Web Extension - Docker Management"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev       - Inicia container de desenvolvimento com watch"
    echo "  build     - Faz build da extensão no container"
    echo "  test      - Executa testes no container"
    echo "  shell     - Abre shell no container de desenvolvimento"
    echo "  logs      - Mostra logs do container de desenvolvimento"
    echo "  stop      - Para todos os containers"
    echo "  clean     - Remove containers e volumes"
    echo "  rebuild   - Reconstrói as imagens Docker"
    echo "  package   - Empacota a extensão"
    echo "  help      - Mostra esta ajuda"
}

case "$1" in
    "dev")
        echo "🔄 Iniciando ambiente de desenvolvimento Docker..."
        docker compose up dev
        ;;
    "build")
        echo "🔨 Fazendo build da extensão no Docker..."
        docker compose run --rm build
        echo "✅ Build concluído! Arquivos em dist/build/"
        ;;
    "test")
        echo "🧪 Executando testes no Docker..."
        docker compose run --rm test
        ;;
    "shell")
        echo "🐚 Abrindo shell no container..."
        docker compose run --rm dev sh
        ;;
    "logs")
        echo "📋 Mostrando logs do container de desenvolvimento..."
        docker compose logs -f dev
        ;;
    "stop")
        echo "⏹️  Parando containers..."
        docker compose down
        ;;
    "clean")
        echo "🧹 Limpando containers e volumes..."
        docker compose down -v --remove-orphans
        docker system prune -f
        ;;
    "rebuild")
        echo "🔄 Reconstruindo imagens Docker..."
        docker compose build --no-cache
        ;;
    "package")
        echo "📦 Empacotando extensão no Docker..."
        docker compose run --rm -T build npm run build
        docker compose run --rm -T build scripts/package-extension.sh
        echo "✅ Extensão empacotada! Arquivo em dist/extension/"
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ Comando desconhecido: $1"
        echo "Use './docker.sh help' para ver comandos disponíveis"
        ;;
esac
