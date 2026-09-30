FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar dependencias completas para build
RUN npm run install:all

# Copiar todo el código fuente
COPY . .

# Compilar el cliente con Vite
RUN npm run build

# Variables de entorno
ENV PORT=3001
ENV NODE_ENV=production

# Render asigna el puerto automáticamente mediante la variable PORT
EXPOSE 3001

# Iniciar el servidor unificado
CMD ["npm", "start"]
