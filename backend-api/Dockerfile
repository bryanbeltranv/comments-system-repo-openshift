FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY server.js ./

# Exponer puerto
EXPOSE 8080

# Usuario no-root para seguridad
USER node

# Comando de inicio
CMD ["node", "server.js"]