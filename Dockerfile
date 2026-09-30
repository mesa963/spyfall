FROM node:22-alpine

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# 1. Instalar dependencias del servidor
WORKDIR /app/server
RUN npm install

# 2. Instalar dependencias del cliente y compilar
WORKDIR /app/client
RUN npm install --include=dev
RUN npm run build

# 3. Volver al directorio raíz
WORKDIR /app

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"]
