# ==========================================
# Estágio 1: Build e Dependências de Desenvolvimento
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências e a pasta do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo as de desenvolvimento)
RUN npm ci

# Copia o resto do código
COPY . .

# Passa a DATABASE_URL para o build, necessária para o prisma generate
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Gera o Prisma Client (essencial para o build do TS se você usa os tipos do Prisma)
RUN npx prisma generate

# Compila o TypeScript para JavaScript (geralmente vai para a pasta /dist)
RUN npm run build

# Remove as devDependencies e limpa o cache para deixar o node_modules magro
RUN npm prune --production

# ==========================================
# Estágio 2: Ambiente de Produção Limpo
# ==========================================
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

# O CMD deve APENAS iniciar a aplicação
CMD ["npm", "run", "start"]