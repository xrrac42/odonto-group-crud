FROM node:18-alpine AS builder
WORKDIR /app

# Copia dependências e instala
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Injetando as variáveis do Supabase e da sua API
ARG VITE_SUPABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL

ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Roda o build direto pelo Vite (ignorando checagem de tipos do TS)
RUN npx vite build

# ---- Estágio 2: Produção ----
FROM nginx:alpine

# Remove a página padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia da pasta dist do Vite para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do React Router para não dar 404 no F5
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; tr>

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]