FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos HTML
COPY index.html /usr/share/nginx/html/

# Exponer puerto 8080
EXPOSE 8080

# Nginx se ejecuta automáticamente
CMD ["nginx", "-g", "daemon off;"]