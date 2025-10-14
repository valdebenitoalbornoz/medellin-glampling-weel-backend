# 🚂 Configuración MongoDB en Railway

## 📋 **Pasos para configurar MongoDB en Railway**

### 1. **Agregar MongoDB a tu proyecto**

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Selecciona tu proyecto "Ruleta glampling backend"
3. Haz clic en **"+ New"** → **"Database"** → **"Add MongoDB"**
4. Railway creará automáticamente un servicio MongoDB

### 2. **Obtener URL de conexión**

1. Haz clic en el servicio **MongoDB** (no en tu aplicación)
2. Ve a la pestaña **"Connect"**
3. Copia la **"MongoDB Connection String"**
   - Ejemplo: `mongodb://mongo:27017/railway`

### 3. **Configurar variables de entorno**

1. Haz clic en tu servicio de **aplicación** (no MongoDB)
2. Ve a la pestaña **"Variables"**
3. Agrega estas variables:

```env
MONGODB_URI=mongodb://mongo:27017/railway
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
ADMIN_EMAIL=admin@glampling.com
PORT=3000
```

### 4. **Configurar Gmail para emails**

1. Activa la verificación en 2 pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación:
   - Ve a Configuración de Google → Seguridad → Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Mail"
3. Usa esta contraseña en `EMAIL_PASS`

## 🚀 **Ventajas de Railway MongoDB**

- ✅ **Gratis**: 500MB almacenamiento incluido
- ✅ **Sin configuración**: Railway maneja todo
- ✅ **Escalable**: Crece con tu proyecto
- ✅ **Integrado**: Mismo dashboard que tu app
- ✅ **Backup automático**: Railway hace backups

## 📊 **Verificar que funciona**

Una vez configurado, tu aplicación debería mostrar:
```
✅ Conectado a MongoDB
🚀 Servidor corriendo en http://localhost:3000
```

## 🔧 **Comandos útiles**

```bash
# Ver logs en Railway
railway logs

# Conectar a MongoDB desde terminal (opcional)
railway connect mongodb
```

## 🆘 **Solución de problemas**

### Si no se conecta:
1. Verifica que `MONGODB_URI` esté configurada correctamente
2. Asegúrate de que el servicio MongoDB esté "Running"
3. Revisa los logs: `railway logs`

### Si los emails no llegan:
1. Verifica que `EMAIL_PASS` sea una contraseña de aplicación de Gmail
2. Asegúrate de que `EMAIL_USER` sea tu email completo
3. Revisa que `ADMIN_EMAIL` esté configurado

## 📈 **Monitoreo**

- **Railway Dashboard**: Ve el estado de tu MongoDB
- **Logs**: `railway logs` para ver errores
- **Métricas**: Railway muestra uso de CPU, memoria y almacenamiento

¿Necesitas ayuda con algún paso específico?
