# Estágio de Build
FROM node:24-alpine AS builder

WORKDIR /app

# Variáveis de ambiente para o Vite (injetadas em tempo de build)
ARG VITE_GROQ_API_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY

# Cache de dependências
COPY package*.json ./
RUN npm ci # 'npm ci' é mais limpo e rápido para ambientes de CI/CD do que 'npm install'

# Copia o resto dos arquivos e builda
COPY . .
RUN npm run build

# Estágio de Produção com Nginx
FROM nginx:alpine

# Copia o build do Vite do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração customizada do Nginx (substituindo o RUN echo antigo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8082

CMD ["nginx", "-g", "daemon off;"]