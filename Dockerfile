# Dockerfile do backend Monitor de Validade
# Repositório: monitor-validade-api
# Stack: Node.js 24 + TypeScript + Express + MongoDB

# -------------------------------
# Etapa 1: Build
# -------------------------------
FROM node:24-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências primeiro (aproveita cache do Docker)
COPY package*.json ./

# Instala TODAS as dependências, inclusive de desenvolvimento (typescript, tsx)
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Compila o TypeScript para a pasta dist/
RUN npm run build

# -------------------------------
# Etapa 2: Produção
# -------------------------------
FROM node:24-alpine

# Cria usuário não-root para rodar a aplicação
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Copia apenas os arquivos de dependências
COPY package*.json ./

# Instala SOMENTE dependências de produção
RUN npm ci --omit=dev && npm cache clean --force

# Copia o código compilado da etapa anterior
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Expõe a porta da aplicação
EXPOSE 3001

RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Muda para o usuário não-root
USER nodejs

# Comando de inicialização
CMD ["node", "dist/index.js"]
