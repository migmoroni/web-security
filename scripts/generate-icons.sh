#!/bin/bash

# Script para gerar ícones da extensão usando ImageMagick
# Instale o ImageMagick se necessário: sudo apt-get install imagemagick

# Criar ícone SVG base
cat > /tmp/security-icon.svg << 'EOF'
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Escudo -->
  <path d="M64 10 L90 25 L90 60 Q90 90 64 110 Q38 90 38 60 L38 25 Z" fill="url(#grad)" stroke="#1e40af" stroke-width="2"/>
  
  <!-- Símbolo de verificação -->
  <path d="M50 65 L58 73 L78 48" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Texto pequeno -->
  <text x="64" y="95" text-anchor="middle" font-family="Arial" font-size="8" fill="white">SEC</text>
</svg>
EOF

# Gerar ícones em diferentes tamanhos
for size in 16 32 48 128; do
  if command -v convert >/dev/null 2>&1; then
    convert -background transparent /tmp/security-icon.svg -resize ${size}x${size} /home/miguel/Projects/security/security-web/public/icons/icon-${size}.png
  else
    echo "ImageMagick não encontrado. Criando arquivo placeholder para icon-${size}.png"
    echo "Placeholder for ${size}x${size} icon" > /home/miguel/Projects/security/security-web/public/icons/icon-${size}.png
  fi
done

echo "Ícones gerados com sucesso!"
