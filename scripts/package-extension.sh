#!/bin/bash

# Script para empacotar a extensão Security Web Extension
set -e

ENGINE=${1:-"both"}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/build"
EXTENSION_DIR="$ROOT_DIR/dist/extension"

echo "Empacotando Security Web Extension..."

# Criar diretório de extensão se não existir
mkdir -p "$EXTENSION_DIR"

# Verificar se os builds são idênticos (exceto manifest.json)
builds_are_identical() {
    local blink_dir="$BUILD_DIR/blink"
    local gecko_dir="$BUILD_DIR/gecko"
    
    # Se um dos diretórios não existir, não são idênticos
    if [ ! -d "$blink_dir" ] || [ ! -d "$gecko_dir" ]; then
        return 1
    fi
    
    # Comparar todos os arquivos exceto manifest.json
    local temp_blink=$(mktemp -d)
    local temp_gecko=$(mktemp -d)
    
    # Copiar conteúdo exceto manifest.json
    rsync -a --exclude='manifest.json' "$blink_dir/" "$temp_blink/"
    rsync -a --exclude='manifest.json' "$gecko_dir/" "$temp_gecko/"
    
    # Comparar diretórios
    if diff -r "$temp_blink" "$temp_gecko" > /dev/null 2>&1; then
        rm -rf "$temp_blink" "$temp_gecko"
        return 0
    else
        rm -rf "$temp_blink" "$temp_gecko"
        return 1
    fi
}

package_engine() {
    local engine=$1
    local build_path="$BUILD_DIR/$engine"
    local zip_file="$EXTENSION_DIR/security-web-extension-$engine.zip"
    
    echo "Empacotando para $engine..."
    
    if [ ! -d "$build_path" ]; then
        echo "Diretório de build não encontrado: $build_path"
        echo "Execute 'npm run build:$engine' primeiro."
        exit 1
    fi
    
    # Remover zip existente se houver
    if [ -f "$zip_file" ]; then
        rm "$zip_file"
    fi
    
    # Criar arquivo zip
    cd "$build_path"
    zip -r "$zip_file" . -x "*.map" "**/node_modules/**" "**/.DS_Store" "**/Thumbs.db"
    cd - > /dev/null
    
    echo "Extensão para $engine empacotada em: $zip_file"
    
    # Mostrar informações do arquivo
    if command -v du &> /dev/null; then
        echo "Tamanho: $(du -h "$zip_file" | cut -f1)"
    fi
}

package_universal() {
    local base_engine=${1:-"blink"}
    local build_path="$BUILD_DIR/$base_engine"
    local zip_file="$EXTENSION_DIR/security-web-extension.zip"
    
    echo "Empacotando extensão universal (baseado em $base_engine)..."
    
    if [ ! -d "$build_path" ]; then
        echo "Diretório de build não encontrado: $build_path"
        return 1
    fi
    
    # Remover zip existente se houver
    if [ -f "$zip_file" ]; then
        rm "$zip_file"
    fi
    
    # Criar arquivo zip
    cd "$build_path"
    zip -r "$zip_file" . -x "*.map" "**/node_modules/**" "**/.DS_Store" "**/Thumbs.db"
    cd - > /dev/null
    
    echo "Extensão universal empacotada em: $zip_file"
    
    # Mostrar informações do arquivo
    if command -v du &> /dev/null; then
        echo "Tamanho: $(du -h "$zip_file" | cut -f1)"
    fi
}

case $ENGINE in
    "blink")
        package_engine "blink"
        ;;
    "gecko")
        package_engine "gecko"
        ;;
    "both"|*)
        # Verificar se os builds são idênticos
        if builds_are_identical; then
            echo "Builds são idênticos (exceto manifest). Criando extensão universal..."
            package_universal "blink"
        else
            echo "Builds têm diferenças. Criando extensões específicas por motor..."
            package_engine "blink"
            package_engine "gecko"
        fi
        ;;
esac

echo ""
echo "Empacotamento concluído!"
echo "Extensões disponíveis em: $EXTENSION_DIR"
echo ""
echo "Para testar:"
if [ "$ENGINE" = "blink" ] || [ "$ENGINE" = "both" ]; then
    echo "  Blink (Chromium/Chrome/Edge/Brave/Opera): Vá para chrome://extensions/, ative 'Modo do desenvolvedor'"
    echo "          e clique em 'Carregar sem compactação', selecionando: $BUILD_DIR/blink"
fi
if [ "$ENGINE" = "gecko" ] || [ "$ENGINE" = "both" ]; then
    echo "  Gecko (Firefox/LibreWolf): Vá para about:debugging, clique em 'Este Firefox' e"
    echo "          'Carregar extensão temporária', selecionando: $BUILD_DIR/gecko/manifest.json"
fi
