#!/bin/bash

# Script de desenvolvimento para a extensão Security Web

show_help() {
    echo "🛡️  Security Web Extension - Development Script"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev       - Inicia o modo de desenvolvimento com watch"
    echo "  build     - Faz build para produção"
    echo "  test      - Testa e empacota a extensão"
    echo "  package   - Empacota extensão já buildada"
    echo "  clean     - Limpa arquivos de build"
    echo "  install   - Instala dependências"
    echo "  lint      - Executa verificação de código"
    echo "  icons     - Gera ícones da extensão"
    echo "  serve     - Abre página de teste no navegador"
    echo "  docker    - Gerencia ambiente Docker (use: dev.sh docker help)"
    echo "  help      - Mostra esta ajuda"
}

case "$1" in
    "dev")
        echo "🔄 Iniciando modo de desenvolvimento..."
        npm run dev
        ;;
    "build")
        echo "🔨 Fazendo build da extensão..."
        npm run build
        ;;
    "test")
        echo "🧪 Testando extensão..."
        npm run build && scripts/test-extension.sh
        ;;
    "package")
        echo "📦 Empacotando extensão..."
        scripts/package-extension.sh
        ;;
    "clean")
        echo "🧹 Limpando arquivos..."
        rm -rf dist/ node_modules/ 
        echo "✅ Limpeza concluída"
        ;;
    "install")
        echo "📦 Instalando dependências..."
        npm install
        ;;
    "lint")
        echo "🔍 Verificando código..."
        npm run lint
        ;;
    "icons")
        echo "🎨 Gerando ícones..."
        scripts/generate-icons.sh
        ;;
    "serve")
        echo "🌐 Abrindo página de teste..."
        if command -v xdg-open > /dev/null; then
            xdg-open "file://$(pwd)/test-page.html"
        elif command -v open > /dev/null; then
            open "file://$(pwd)/test-page.html"
        else
            echo "Abra manualmente: file://$(pwd)/test-page.html"
        fi
        ;;
    "docker")
        if [ -z "$2" ]; then
            echo "🐳 Modo Docker disponível! Use: ./dev.sh docker [comando]"
            echo "Para ver comandos Docker: ./docker.sh help"
        else
            shift
            ./docker.sh "$@"
        fi
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ Comando desconhecido: $1"
        echo "Use './dev.sh help' para ver comandos disponíveis"
        ;;
esac
