# Makefile para Security Web Extension

.PHONY: help install dev build test package clean docker-dev docker-build docker-test docker-package docker-clean

# Comando padrão
help:
	@echo "🛡️  Security Web Extension - Makefile"
	@echo ""
	@echo "Comandos nativos:"
	@echo "  make install        - Instala dependências"
	@echo "  make dev            - Modo desenvolvimento (watch)"
	@echo "  make build          - Build para produção"
	@echo "  make test           - Testa e empacota"
	@echo "  make package        - Empacota extensão"
	@echo "  make clean          - Limpa arquivos"
	@echo ""
	@echo "Comandos Docker:"
	@echo "  make docker-dev     - Desenvolvimento no Docker"
	@echo "  make docker-build   - Build no Docker"
	@echo "  make docker-test    - Testes no Docker"
	@echo "  make docker-package - Empacotamento no Docker"
	@echo "  make docker-clean   - Limpa containers Docker"
	@echo ""
	@echo "Comandos combinados:"
	@echo "  make all            - Build + package completo"
	@echo "  make docker-all     - Build + package no Docker"

# Comandos nativos
install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	./dev.sh test

package:
	npm run package

clean:
	./dev.sh clean

# Comandos Docker
docker-dev:
	./docker.sh dev

docker-build:
	./docker.sh build

docker-test:
	./docker.sh test

docker-package:
	./docker.sh package

docker-clean:
	./docker.sh clean

# Comandos combinados
all: build package
	@echo "✅ Build completo finalizado!"
	@echo "📂 Extensão: dist/build/"
	@echo "📦 ZIP: dist/extension/security-web-extension.zip"

docker-all:
	./docker.sh build
	./docker.sh package
	@echo "✅ Build Docker completo finalizado!"
	@echo "📂 Extensão: dist/build/"
	@echo "📦 ZIP: dist/extension/security-web-extension.zip"

# Comando para setup inicial
setup: install
	./scripts/generate-icons.sh
	@echo "🎉 Setup inicial concluído!"
	@echo "Execute 'make dev' ou 'make docker-dev' para começar o desenvolvimento"

# Comando para verificar dependências
check:
	@echo "🔍 Verificando dependências..."
	@which node || echo "❌ Node.js não encontrado"
	@which npm || echo "❌ npm não encontrado"
	@which docker || echo "❌ Docker não encontrado (opcional)"
	@which docker-compose || echo "❌ Docker Compose não encontrado (opcional)"
	@echo "✅ Verificação concluída"
