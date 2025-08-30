#!/bin/bash

# Script para empacotar a extensão Security Web Extension
set -e

BROWSER=${1:-"both"}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/build"
EXTENSION_DIR="$ROOT_DIR/dist/extension"

echo "Empacotando Security Web Extension..."

# Criar diretório de extensões se não existir
mkdir -p "$EXTENSION_DIR"

package_browser() {
    local browser=$1
    local build_path="$BUILD_DIR/$browser"
    local extension_path="$EXTENSION_DIR/$browser"
    local zip_file="$extension_path/security-web-extension.zip"
    
    echo "Empacotando para $browser..."
    
    if [ ! -d "$build_path" ]; then
        echo "Diretório de build não encontrado: $build_path"
        echo "Execute 'npm run build:$browser' primeiro."
        exit 1
    fi
    
    # Criar diretório específico do browser
    mkdir -p "$extension_path"
    
    # Remover zip existente se houver
    if [ -f "$zip_file" ]; then
        rm "$zip_file"
    fi
    
    # Criar arquivo zip
    cd "$build_path"
    zip -r "$zip_file" . -x "*.map" "**/node_modules/**" "**/.DS_Store" "**/Thumbs.db"
    cd - > /dev/null
    
    echo "Extensão para $browser empacotada em: $zip_file"
    
    # Mostrar informações do arquivo
    if command -v du &> /dev/null; then
        echo "Tamanho: $(du -h "$zip_file" | cut -f1)"
    fi
}

case $BROWSER in
    "chrome")
        package_browser "chrome"
        ;;
    "firefox")
        package_browser "firefox"
        ;;
    "both"|*)
        package_browser "chrome"
        package_browser "firefox"
        ;;
esac

echo ""
echo "Empacotamento concluído!"
echo "Extensões disponíveis em: $EXTENSION_DIR"
echo ""
echo "Para testar:"
if [ "$BROWSER" = "chrome" ] || [ "$BROWSER" = "both" ]; then
    echo "  Chrome: Vá para chrome://extensions/, ative 'Modo do desenvolvedor' e clique em 'Carregar sem compactação'"
    echo "          Selecione: $BUILD_DIR/chrome"
fi
if [ "$BROWSER" = "firefox" ] || [ "$BROWSER" = "both" ]; then
    echo "  Firefox: Vá para about:debugging, clique em 'Este Firefox' e 'Carregar extensão temporária'"
    echo "           Selecione: $BUILD_DIR/firefox/manifest.json"
fi
