#!/bin/bash

# Script principal de desenvolvimento - versão unificada

show_help() {
    echo "🛡️  Security Web Extension - Development Manager"
    echo ""
    echo "🏠 Comandos Locais:"
    echo "  local dev       - Desenvolvimento local com watch"
    echo "  local build     - Build local para produção"
    echo "  local test      - Testa e empacota (local)"
    echo "  local package   - Empacota extensão já buildada"
    echo "  local install   - Instala dependências"
    echo "  local clean     - Limpa arquivos de build"
    echo ""
    echo "🐳 Comandos Docker:"
    echo "  docker dev      - Desenvolvimento no Docker"
    echo "  docker build    - Build no Docker"
    echo "  docker test     - Testes no Docker"
    echo "  docker package  - Empacotamento no Docker"
    echo "  docker shell    - Shell no container"
    echo "  docker clean    - Limpa containers"
    echo ""
    echo "🚀 Comandos Combinados:"
    echo "  setup           - Setup inicial (ícones + dependências)"
    echo "  all             - Build + package completo (local)"
    echo "  docker-all      - Build + package completo (Docker)"
    echo "  check           - Verifica dependências"
    echo ""
    echo "💡 Exemplos:"
    echo "  ./manage.sh local build    # Build local"
    echo "  ./manage.sh docker build   # Build no Docker"
    echo "  ./manage.sh all            # Build completo local"
}

# Funções para comandos locais
local_dev() {
    echo "🔄 Iniciando desenvolvimento local..."
    npm run dev
}

local_build() {
    echo "🔨 Build local..."
    npm run build
}

local_test() {
    echo "🧪 Teste local..."
    npm run build && scripts/test-extension.sh
}

local_package() {
    echo "📦 Empacotamento local..."
    scripts/package-extension.sh
}

local_install() {
    echo "📦 Instalando dependências..."
    npm install
}

local_clean() {
    echo "🧹 Limpeza local..."
    rm -rf dist/ node_modules/
}

# Funções para comandos Docker
docker_dev() {
    echo "🔄 Desenvolvimento Docker..."
    docker compose up dev
}

docker_build() {
    echo "🔨 Build Docker..."
    docker compose run --rm build
}

docker_test() {
    echo "🧪 Teste Docker..."
    docker compose run --rm test
}

docker_package() {
    echo "📦 Empacotamento Docker..."
    docker compose run --rm build npm run build
    docker compose run --rm build scripts/package-extension.sh
}

docker_shell() {
    echo "🐚 Shell Docker..."
    docker compose run --rm dev sh
}

docker_clean() {
    echo "🧹 Limpeza Docker..."
    docker compose down -v --remove-orphans
    docker system prune -f
}

# Comandos combinados
setup() {
    echo "🔧 Setup inicial..."
    local_install
    scripts/generate-icons.sh
    echo "✅ Setup concluído!"
}

all() {
    echo "🚀 Build completo local..."
    local_build
    local_package
    echo "✅ Build completo finalizado!"
    echo "📂 Extensão: dist/build/"
    echo "📦 ZIP: dist/extension/security-web-extension.zip"
}

docker_all() {
    echo "🚀 Build completo Docker..."
    docker_build
    docker_package
    echo "✅ Build Docker completo finalizado!"
    echo "📂 Extensão: dist/build/"
    echo "📦 ZIP: dist/extension/security-web-extension.zip"
}

check() {
    echo "🔍 Verificando dependências..."
    which node && echo "✅ Node.js: $(node --version)" || echo "❌ Node.js não encontrado"
    which npm && echo "✅ npm: $(npm --version)" || echo "❌ npm não encontrado"
    which docker && echo "✅ Docker: $(docker --version)" || echo "⚠️  Docker não encontrado (opcional)"
    docker compose version &>/dev/null && echo "✅ Docker Compose disponível" || echo "⚠️  Docker Compose não encontrado (opcional)"
    echo "✅ Verificação concluída"
}

# Processar comandos
case "$1" in
    "local")
        case "$2" in
            "dev") local_dev ;;
            "build") local_build ;;
            "test") local_test ;;
            "package") local_package ;;
            "install") local_install ;;
            "clean") local_clean ;;
            *) echo "❌ Comando local desconhecido: $2"; show_help ;;
        esac
        ;;
    "docker")
        case "$2" in
            "dev") docker_dev ;;
            "build") docker_build ;;
            "test") docker_test ;;
            "package") docker_package ;;
            "shell") docker_shell ;;
            "clean") docker_clean ;;
            *) echo "❌ Comando Docker desconhecido: $2"; show_help ;;
        esac
        ;;
    "setup") setup ;;
    "all") all ;;
    "docker-all") docker_all ;;
    "check") check ;;
    "help"|"--help"|"-h"|"") show_help ;;
    *) echo "❌ Comando desconhecido: $1"; show_help ;;
esac
