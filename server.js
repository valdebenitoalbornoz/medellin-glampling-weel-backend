const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const HybridEmailService = require('./hybrid-email-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB (Railway o Atlas)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruleta-glampling';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Modelo de Premio
const PremioSchema = new mongoose.Schema({
  email: { type: String, required: true },
  premio: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  fechaRegistro: { type: String, required: true },
  notificado: { type: Boolean, default: false }
});

// Índice compuesto para optimizar búsquedas por email y timestamp
PremioSchema.index({ email: 1, timestamp: -1 });

const Premio = mongoose.model('Premio', PremioSchema);

// Configuración de tiempo de espera entre participaciones (en días)
const DIAS_ESPERA_PARTICIPACION = 7;

// Inicializar servicio de email híbrido (Gmail + SendGrid)
const emailService = new HybridEmailService();

// Función para validar si un email puede participar
async function validarEmailPuedeParticipar(email) {
  const emailNormalizado = email.toLowerCase().trim();
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - DIAS_ESPERA_PARTICIPACION);
  
  const participacionReciente = await Premio.findOne({
    email: emailNormalizado,
    timestamp: { $gte: fechaLimite }
  });
  
  if (participacionReciente) {
    const diasTranscurridos = Math.floor(
      (new Date() - participacionReciente.timestamp) / (1000 * 60 * 60 * 24)
    );
    const diasRestantes = DIAS_ESPERA_PARTICIPACION - diasTranscurridos;
    
    return {
      puedeParticipar: false,
      ultimaParticipacion: participacionReciente.timestamp,
      diasTranscurridos: diasTranscurridos,
      diasRestantes: diasRestantes,
      mensaje: `Debes esperar ${diasRestantes} día(s) más antes de poder participar nuevamente`
    };
  }
  
  return {
    puedeParticipar: true,
    mensaje: 'El email puede participar'
  };
}

// Función para enviar emails usando el servicio mejorado
async function enviarNotificaciones(premio) {
  try {
    console.log('📧 Enviando notificaciones con servicio mejorado...');
    return await emailService.enviarNotificaciones(premio);
  } catch (error) {
    console.error('❌ Error enviando emails:', error);
    return false;
  }
}

// Función para enviar emails en segundo plano (no bloquea la respuesta)
async function enviarNotificacionesEnSegundoPlano(premio) {
  try {
    console.log('📧 Enviando emails en segundo plano...');
    
    // Enviar notificaciones por email
    const emailsEnviados = await enviarNotificaciones(premio);
    
    // Actualizar estado de notificación en la base de datos
    if (emailsEnviados) {
      await Premio.findByIdAndUpdate(premio._id, { notificado: true });
      console.log('✅ Emails enviados y estado actualizado');
    } else {
      console.log('⚠️ Emails no enviados, se reintentará más tarde');
    }
    
  } catch (error) {
    console.error('❌ Error enviando emails en segundo plano:', error);
    // Aquí podrías implementar un sistema de reintentos o cola de emails
  }
}

// Endpoint para registrar premios
app.post('/api/registrar-premio', async (req, res) => {
  try {
    const { email, premio, timestamp } = req.body;
    
    // Validar datos
    if (!email || !premio) {
      return res.status(400).json({ 
        error: 'Email y premio son requeridos' 
      });
    }
    
    // Validar que el email pueda participar
    const validacion = await validarEmailPuedeParticipar(email);
    
    if (!validacion.puedeParticipar) {
      return res.status(403).json({
        success: false,
        error: 'Este correo electrónico ya participó recientemente',
        message: validacion.mensaje,
        ultimaParticipacion: validacion.ultimaParticipacion,
        diasTranscurridos: validacion.diasTranscurridos,
        diasRestantes: validacion.diasRestantes
      });
    }
    
    // Crear registro del premio
    const nuevoPremio = new Premio({
      email: email.toLowerCase().trim(),
      premio,
      timestamp: timestamp || new Date(),
      fechaRegistro: new Date().toLocaleString('es-CO')
    });
    
    // Guardar en MongoDB
    const premioGuardado = await nuevoPremio.save();
    
    console.log('🎉 Nuevo premio registrado:', premioGuardado);
    
    // Responder inmediatamente al usuario
    res.status(200).json({
      success: true,
      message: 'Premio registrado exitosamente',
      premio: premioGuardado,
      notificacion: 'Los emails se están enviando en segundo plano'
    });
    
    // Enviar notificaciones por email en segundo plano (no bloquea la respuesta)
    enviarNotificacionesEnSegundoPlano(premioGuardado);
    
  } catch (error) {
    console.error('Error al registrar premio:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para validar si un email puede participar
app.post('/api/validar-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validar que se proporcione el email
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'El email es requerido' 
      });
    }
    
    // Validar si el email puede participar
    const validacion = await validarEmailPuedeParticipar(email);
    
    res.status(200).json({
      success: true,
      ...validacion,
      diasEspera: DIAS_ESPERA_PARTICIPACION
    });
    
  } catch (error) {
    console.error('Error al validar email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para ver todos los premios
app.get('/api/premios', async (req, res) => {
  try {
    const premios = await Premio.find().sort({ timestamp: -1 });
    res.json({
      total: premios.length,
      premios: premios
    });
  } catch (error) {
    console.error('Error obteniendo premios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalPremios = await Premio.countDocuments();
    const premiosNotificados = await Premio.countDocuments({ notificado: true });
    const premiosHoy = await Premio.countDocuments({
      timestamp: {
        $gte: new Date(new Date().setHours(0,0,0,0)),
        $lt: new Date(new Date().setHours(23,59,59,999))
      }
    });
    
    res.json({
      totalPremios,
      premiosNotificados,
      premiosHoy,
      porcentajeNotificados: totalPremios > 0 ? Math.round((premiosNotificados / totalPremios) * 100) : 0
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para probar configuración de email
app.post('/api/test-email', async (req, res) => {
  try {
    console.log('🧪 Probando configuración de email...');
    
    // Verificar configuración
    const config = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      admin: process.env.ADMIN_EMAIL,
      pass: process.env.EMAIL_PASS ? '***configurada***' : '❌ NO CONFIGURADA'
    };
    
    console.log('📧 Configuración actual:', config);
    
    // Verificar que todas las variables estén configuradas
    const variablesRequeridas = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'ADMIN_EMAIL'];
    const variablesFaltantes = variablesRequeridas.filter(v => !process.env[v]);
    
    if (variablesFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Variables de entorno faltantes',
        faltantes: variablesFaltantes,
        config: config
      });
    }
    
    // Enviar email de prueba usando el servicio mejorado
    const emailPrueba = {
      from: `"Glampling Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '🧪 Email de prueba - Glampling',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email de prueba</h2>
          <p>Este es un email de prueba del sistema de premios de Glampling.</p>
          <p>Fecha: ${new Date().toLocaleString('es-CO')}</p>
          <p>Si recibes este email, la configuración está funcionando correctamente.</p>
        </div>
      `
    };
    
    const resultado = await emailService.enviarEmail(emailPrueba);
    console.log('✅ Email de prueba enviado:', resultado.messageId);
    
    res.json({
      success: true,
      message: 'Email de prueba enviado exitosamente',
      messageId: resultado.messageId,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER
      }
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de email:', error);
    
    // Diagnóstico detallado del error
    let diagnostico = 'Error desconocido';
    if (error.code === 'ETIMEDOUT') {
      diagnostico = 'Timeout de conexión - Verifica la configuración SMTP y la contraseña de aplicación';
    } else if (error.code === 'EAUTH') {
      diagnostico = 'Error de autenticación - Verifica la contraseña de aplicación de Gmail';
    } else if (error.code === 'ECONNREFUSED') {
      diagnostico = 'Conexión rechazada - Verifica el host y puerto SMTP';
    } else if (error.code === 'ENOTFOUND') {
      diagnostico = 'Host no encontrado - Verifica EMAIL_HOST';
    }
    
    res.status(500).json({
      success: false,
      error: 'Error enviando email de prueba',
      diagnostico: diagnostico,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
        message: error.message
      }
    });
  }
});

// Endpoint para diagnosticar servicios de email
app.post('/api/diagnosticar-email', async (req, res) => {
  try {
    console.log('🔍 Iniciando diagnóstico completo de servicios de email...');
    
    // Verificar variables de entorno
    const variables = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '***configurada***' : '❌ NO CONFIGURADA',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '***configurada***' : '❌ NO CONFIGURADA',
      EMAIL_FROM: process.env.EMAIL_FROM
    };
    
    console.log('📧 Variables de entorno:', variables);
    
    // Diagnosticar ambos servicios
    const diagnosticos = await emailService.diagnosticar();
    
    const gmailFunciona = diagnosticos.gmail.funciona;
    const sendgridFunciona = diagnosticos.sendgrid.funciona;
    const algunoFunciona = gmailFunciona || sendgridFunciona;
    
    res.json({
      success: algunoFunciona,
      variables,
      diagnosticos: {
        gmail: {
          funciona: gmailFunciona,
          error: diagnosticos.gmail.error
        },
        sendgrid: {
          funciona: sendgridFunciona,
          error: diagnosticos.sendgrid.error
        }
      },
      recomendaciones: algunoFunciona ? [
        '✅ Al menos un servicio de email está funcionando',
        gmailFunciona ? 'Gmail está funcionando' : 'Gmail no funciona',
        sendgridFunciona ? 'SendGrid está funcionando' : 'SendGrid no funciona',
        'Los emails se enviarán automáticamente'
      ] : [
        '❌ Ningún servicio de email funciona',
        '1. Para Gmail: Verifica la contraseña de aplicación',
        '2. Para SendGrid: Configura SENDGRID_API_KEY en Railway',
        '3. Railway puede estar bloqueando conexiones SMTP'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: 'Error durante el diagnóstico',
      detalles: error.message
    });
  }
});

// Endpoint para reintentar emails no enviados
app.post('/api/reintentar-emails', async (req, res) => {
  try {
    console.log('🔄 Reintentando envío de emails no notificados...');
    
    // Buscar premios no notificados
    const premiosNoNotificados = await Premio.find({ notificado: false });
    
    if (premiosNoNotificados.length === 0) {
      return res.json({
        success: true,
        message: 'No hay premios pendientes de notificación',
        total: 0
      });
    }
    
    console.log(`📧 Reintentando ${premiosNoNotificados.length} premios...`);
    
    let exitosos = 0;
    let fallidos = 0;
    
    // Reintentar cada premio
    for (const premio of premiosNoNotificados) {
      try {
        const emailsEnviados = await enviarNotificaciones(premio);
        if (emailsEnviados) {
          await Premio.findByIdAndUpdate(premio._id, { notificado: true });
          exitosos++;
          console.log(`✅ Email enviado para premio ${premio._id}`);
        } else {
          fallidos++;
          console.log(`❌ Error enviando email para premio ${premio._id}`);
        }
      } catch (error) {
        fallidos++;
        console.error(`❌ Error procesando premio ${premio._id}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: 'Reintento de emails completado',
      total: premiosNoNotificados.length,
      exitosos,
      fallidos
    });
    
  } catch (error) {
    console.error('❌ Error en reintento de emails:', error);
    res.status(500).json({
      success: false,
      error: 'Error reintentando emails'
    });
  }
});

// Endpoint de estado del sistema
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    database: 'MongoDB',
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      admin: process.env.ADMIN_EMAIL
    },
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ver premios: http://localhost:${PORT}/api/premios`);
  console.log(`📈 Estadísticas: http://localhost:${PORT}/api/estadisticas`);
  console.log(`✅ Validar email: POST http://localhost:${PORT}/api/validar-email`);
  console.log(`🎁 Registrar premio: POST http://localhost:${PORT}/api/registrar-premio`);
  console.log(`🧪 Probar email: POST http://localhost:${PORT}/api/test-email`);
  console.log(`🔍 Diagnosticar Email: POST http://localhost:${PORT}/api/diagnosticar-email`);
  console.log(`🔄 Reintentar emails: POST http://localhost:${PORT}/api/reintentar-emails`);
  console.log(`📧 Configuración de email: ${process.env.EMAIL_USER}`);
  console.log(`⏱️  Días de espera entre participaciones: ${DIAS_ESPERA_PARTICIPACION}`);
  console.log(`⚡ Los emails se envían en segundo plano (no bloquean la respuesta)`);
});
