# 🎰 Ruleta Glampling - Backend con Firebase

Sistema backend para registrar premios de ruleta con Firebase Firestore (GRATIS) y notificaciones por email.

## 🆓 **¿Por qué Firebase?**

- ✅ **Completamente GRATIS** (1GB almacenamiento, 50k operaciones/día)
- ✅ **Sin límites de cluster** como MongoDB Atlas
- ✅ **Fácil configuración** en 5 minutos
- ✅ **Dashboard web** para ver tus datos
- ✅ **Escalable** cuando crezca tu proyecto

## 🚀 **Configuración Rápida**

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `ruleta-glampling`
4. **Desactiva** Google Analytics (no lo necesitas)
5. Haz clic en "Crear proyecto"

### 2. Configurar Firestore

1. En el panel izquierdo, haz clic en "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Iniciar en modo de prueba" (gratis)
4. Elige la ubicación más cercana a ti
5. Haz clic en "Habilitar"

### 3. Obtener Configuración

1. Ve a "Configuración del proyecto" (⚙️)
2. Haz clic en "Configuración del proyecto"
3. Baja hasta "Tus aplicaciones"
4. Haz clic en el ícono de web (</>)
5. Nombra tu app: `ruleta-backend`
6. **NO marques** "Configurar Firebase Hosting"
7. Haz clic en "Registrar app"
8. **Copia la configuración** que aparece

### 4. Configurar Variables de Entorno

Crea un archivo `.env` con esta configuración:

```env
# Firebase Configuration
FIREBASE_API_KEY=tu-api-key-aqui
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto-id-aqui
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
ADMIN_EMAIL=admin@glampling.com

# Server Configuration
PORT=3000
```

### 5. Configurar Email (Gmail)

1. Activa la verificación en 2 pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación:
   - Ve a Configuración de Google → Seguridad → Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Mail"
3. Usa esta contraseña en `EMAIL_PASS`

## 🛠️ **Instalación y Uso**

```bash
# Usar la versión con Firebase
node server-firebase.js

# O cambiar el script en package.json
npm run start:firebase
```

## 📡 **Endpoints (Igual que antes)**

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

## 🔥 **Ventajas de Firebase**

- **Gratis para siempre**: 1GB almacenamiento, 50k operaciones/día
- **Sin configuración de servidor**: Firebase maneja todo
- **Dashboard visual**: Ve tus datos en tiempo real
- **Escalable**: Crece con tu proyecto
- **Seguro**: Autenticación y reglas de seguridad incluidas

## 📊 **Dashboard de Firebase**

Una vez configurado, puedes ver todos tus premios en:
- Firebase Console → Firestore Database
- Ver datos en tiempo real
- Exportar datos
- Configurar reglas de seguridad

## 🚨 **Notas Importantes**

- Firebase es **completamente gratuito** para tu uso
- No hay límites de cluster como MongoDB Atlas
- Los datos se sincronizan automáticamente
- Puedes ver los datos en el dashboard de Firebase
- Si necesitas más espacio, Firebase tiene planes muy económicos

## 🔄 **Migración desde MongoDB**

Si ya tienes datos en MongoDB, puedes:
1. Exportar tus datos
2. Importarlos a Firebase usando el dashboard
3. O crear un script de migración

¿Necesitas ayuda con la configuración de Firebase?
