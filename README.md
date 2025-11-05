# Sistema de Comentarios - OpenShift

Sistema de microservicios para gestión de comentarios desplegado en OpenShift con Helm y GitHub Actions.

## 🏗️ Arquitectura
```
Frontend (HTML/Nginx) → Backend-API (Node.js) → Backend-Data (Node.js) → PostgreSQL
```

## 📦 Componentes

- **Frontend**: Interfaz web simple en HTML
- **Backend-API**: API Gateway que maneja peticiones del frontend
- **Backend-Data**: Servicio de datos que gestiona la lógica con PostgreSQL
- **Database**: PostgreSQL con almacenamiento persistente

## 🚀 Despliegue

### Requisitos previos

- Cuenta de Docker Hub
- Cluster de OpenShift
- Secrets configurados en GitHub:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`
  - `OPENSHIFT_SERVER`
  - `OPENSHIFT_TOKEN`
  - `OPENSHIFT_NAMESPACE`

### Despliegue Automático

1. Push a la rama `main` activa el workflow de build
2. Las imágenes se construyen y suben a Docker Hub
3. El deployment se ejecuta automáticamente en OpenShift

### Despliegue Manual
```bash
# Build local de imágenes
docker build -t bryanbeltranv/frontend:latest ./frontend
docker build -t bryanbeltranv/backend-api:latest ./backend-api
docker build -t bryanbeltranv/backend-data:latest ./backend-data

# Push a Docker Hub
docker push bryanbeltranv/frontend:latest
docker push bryanbeltranv/backend-api:latest
docker push bryanbeltranv/backend-data:latest

# Deploy con Helm
helm upgrade --install comments-system ./helm/comments-system \
  --namespace comments-system \
  --create-namespace
```

## 🔒 Seguridad

- NetworkPolicies configuradas para limitar tráfico
- Secrets para credenciales sensibles
- TLS habilitado en Route

## 📊 Recursos

- CPU y memoria optimizados para recursos mínimos
- HPA configurado para backend-api y backend-data
- Autoescalado de 2 a 5 réplicas

## 🔗 Acceso

Una vez desplegado, accede a la aplicación mediante la Route generada:
```bash
oc get route -n comments-system
```

## 📝 Licencia

MIT