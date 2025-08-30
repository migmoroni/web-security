FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    bash \
    zip \
    imagemagick \
    curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY webpack.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY .eslintrc.js ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Dar permissões aos scripts
RUN chmod +x scripts/*.sh

# Expor porta para desenvolvimento (se necessário)
EXPOSE 3000

# Comando padrão
CMD ["npm", "run", "dev"]
