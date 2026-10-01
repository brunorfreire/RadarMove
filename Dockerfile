# Multi-stage Dockerfile para RadarMove (Node + Express + Vite)
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código-fonte e compila frontend
COPY . .
RUN npm run build

# Stage final enxuto para produção
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copia build do frontend e arquivos do servidor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Instala tsx globalmente para rodar server.ts em produção
RUN npm install -g tsx

EXPOSE 3000

CMD ["tsx", "server.ts"]
