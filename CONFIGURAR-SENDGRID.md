# 📧 Configurar SendGrid para Railway

## 🚨 **Problema actual:**
Railway está bloqueando todas las conexiones SMTP a Gmail, causando timeouts.

## ✅ **Solución: SendGrid**

SendGrid es más confiable con Railway y ofrece:
- ✅ **100 emails gratis por día**
- ✅ **Sin bloqueos de red**
- ✅ **API simple y confiable**
- ✅ **Mejor deliverability**

## 🚀 **Configuración paso a paso:**

### **1. Crear cuenta en SendGrid**
1. Ve a [SendGrid](https://sendgrid.com/)
2. Haz clic en **"Start for free"**
3. Completa el registro
4. Verifica tu email

### **2. Crear API Key**
1. En el dashboard de SendGrid, ve a **"Settings"** → **"API Keys"**
2. Haz clic en **"Create API Key"**
3. Nombre: `Glampling Backend`
4. Permisos: **"Full Access"** (o solo "Mail Send")
5. Copia la API Key (empieza con `SG.`)

### **3. Configurar en Railway**
1. Ve a tu proyecto en Railway
2. Haz clic en **"Variables"**
3. Agrega estas variables:

```env
SENDGRID_API_KEY=SG.tu-api-key-aqui
EMAIL_FROM=admonmedellinglamping@gmail.com
```

### **4. Verificar configuración**
```bash
# Probar diagnóstico
curl -X POST https://tu-app.railway.app/api/diagnosticar-email

# Probar envío
curl -X POST https://tu-app.railway.app/api/test-email
```

## 🔧 **Sistema híbrido implementado:**

### **Funcionamiento:**
1. **Intenta Gmail primero** (por si Railway lo desbloquea)
2. **Si Gmail falla** → Usa SendGrid automáticamente
3. **Logs detallados** para ver qué servicio funciona

### **Ventajas:**
- ✅ **Doble respaldo**: Gmail + SendGrid
- ✅ **Automático**: No necesitas cambiar código
- ✅ **Confiabilidad**: Al menos uno funcionará
- ✅ **Monitoreo**: Logs de qué servicio se usa

## 📊 **Endpoints actualizados:**

- `POST /api/registrar-premio` - Registra premio (respuesta inmediata)
- `POST /api/diagnosticar-email` - Diagnostica Gmail + SendGrid
- `POST /api/test-email` - Prueba envío con servicio activo
- `POST /api/reintentar-emails` - Reintenta emails fallidos

## 🎯 **Próximos pasos:**

1. **Configurar SendGrid** (5 minutos)
2. **Probar el sistema** con el diagnóstico
3. **¡Listo!** Los emails funcionarán automáticamente

## 💡 **¿Por qué SendGrid?**

- **Railway compatible**: No hay bloqueos de red
- **Gratis**: 100 emails/día es suficiente para empezar
- **Profesional**: Mejor deliverability que Gmail SMTP
- **Escalable**: Fácil aumentar límites cuando crezcas

¿Quieres que te ayude con la configuración de SendGrid?
