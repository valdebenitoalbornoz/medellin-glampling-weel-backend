# 🎰 Ruleta Glampling - Backend

Sistema backend para registrar premios de ruleta con base de datos MongoDB y notificaciones por email.

## 🚀 Características

- ✅ Registro de premios en MongoDB Atlas (base de datos gratuita)
- 📧 Notificaciones automáticas por email al usuario y administración
- 📊 Endpoints para consultar premios y estadísticas
- 🔒 Variables de entorno para configuración segura

## 📋 Configuración

### 1. Variables de Entorno

Edita el archivo `.env` con tus datos:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ruleta-glampling?retryWrites=true&w=majority

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
ADMIN_EMAIL=admin@glampling.com

# Server Configuration
PORT=3000
```

### 2. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster
4. Obtén la cadena de conexión y reemplaza en `MONGODB_URI`

### 3. Configurar Email (Gmail)

1. Activa la verificación en 2 pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación:
   - Ve a Configuración de Google → Seguridad → Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Mail"
3. Usa esta contraseña en `EMAIL_PASS`

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

## 📡 Endpoints

### Registrar Premio
```http
POST /api/registrar-premio
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "premio": "Descuento del 20%",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Ver Premios
```http
GET /api/premios
```

### Estadísticas
```http
GET /api/estadisticas
```

## 📧 Notificaciones

El sistema envía automáticamente:

1. **Email al usuario**: Confirmación del premio ganado
2. **Email a administración**: Notificación del nuevo premio otorgado

## 🔧 Estructura del Proyecto

```
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── .env              # Variables de entorno
└── README.md       # Documentación
```

## 📊 Funcionalidades

- **Registro persistente**: Los premios se guardan en MongoDB
- **Notificaciones automáticas**: Emails HTML personalizados
- **Estadísticas**: Contadores de premios y notificaciones
- **Validación**: Verificación de datos requeridos
- **Manejo de errores**: Respuestas consistentes en caso de fallos

## 🚨 Notas Importantes

- Asegúrate de configurar correctamente las variables de entorno
- Para Gmail, usa contraseñas de aplicación, no tu contraseña normal
- MongoDB Atlas tiene un plan gratuito con 512MB de almacenamiento
- El sistema maneja errores de conexión y notificaciones automáticamente
