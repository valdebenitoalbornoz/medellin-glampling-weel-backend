const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
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

const Premio = mongoose.model('Premio', PremioSchema);

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 30000, // 30 segundos (reducido)
  greetingTimeout: 15000,   // 15 segundos (reducido)
  socketTimeout: 30000,     // 30 segundos (reducido)
  debug: true,              // Habilitar debug
  logger: true              // Habilitar logs
});

// Configuración alternativa para Gmail (si la principal falla)
const transporterAlternativo = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 30000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  debug: true,
  logger: true
});

// Función para probar conexión SMTP
async function probarConexionSMTP() {
  try {
    console.log('🔍 Probando conexión SMTP principal...');
    await transporter.verify();
    console.log('✅ Conexión SMTP principal exitosa');
    return transporter;
  } catch (error) {
    console.log('❌ Conexión SMTP principal falló:', error.message);
    
    try {
      console.log('🔍 Probando conexión SMTP alternativa...');
      await transporterAlternativo.verify();
      console.log('✅ Conexión SMTP alternativa exitosa');
      return transporterAlternativo;
    } catch (error2) {
      console.log('❌ Conexión SMTP alternativa también falló:', error2.message);
      throw new Error('Ambas configuraciones SMTP fallaron');
    }
  }
}

// Función para enviar emails
async function enviarNotificaciones(premio) {
  try {
    console.log('📧 Intentando enviar emails...');
    console.log('📧 Configuración SMTP:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      admin: process.env.ADMIN_EMAIL
    });

    // Verificar configuración
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Configuración de email incompleta');
    }

    // Probar conexión SMTP
    const transporterActivo = await probarConexionSMTP();

    // Email al usuario
    const emailUsuario = {
      from: `"Glampling" <${process.env.EMAIL_USER}>`,
      to: premio.email,
      subject: '🎉 ¡Felicidades! Has ganado un premio en Glampling',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">¡Felicidades!</h2>
          <p>Has ganado el siguiente premio en nuestra ruleta:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0;">${premio.premio}</h3>
          </div>
          <p>Fecha: ${premio.fechaRegistro}</p>
          <p>¡Gracias por participar en Glampling!</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Este es un email automático del sistema de premios de Glampling.</p>
        </div>
      `
    };

    // Email a administración
    const emailAdmin = {
      from: `"Glampling" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '📊 Nuevo premio otorgado - Glampling',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nuevo premio otorgado</h2>
          <p>Se ha registrado un nuevo premio en el sistema:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Usuario:</strong> ${premio.email}</p>
            <p><strong>Premio:</strong> ${premio.premio}</p>
            <p><strong>Fecha:</strong> ${premio.fechaRegistro}</p>
          </div>
          <p>Este premio ha sido notificado al usuario automáticamente.</p>
        </div>
      `
    };

    // Enviar emails usando el transporter activo
    const resultadoUsuario = await transporterActivo.sendMail(emailUsuario);
    console.log('✅ Email al usuario enviado:', resultadoUsuario.messageId);
    
    const resultadoAdmin = await transporterActivo.sendMail(emailAdmin);
    console.log('✅ Email a administración enviado:', resultadoAdmin.messageId);
    
    console.log('📧 Emails enviados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error enviando emails:', error);
    console.error('❌ Detalles del error:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
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
    
    // Crear registro del premio
    const nuevoPremio = new Premio({
      email,
      premio,
      timestamp: timestamp || new Date(),
      fechaRegistro: new Date().toLocaleString('es-ES')
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
    
    // Verificar conexión SMTP
    console.log('🔍 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');
    
    // Enviar email de prueba
    const emailPrueba = {
      from: `"Glampling Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '🧪 Email de prueba - Glampling',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email de prueba</h2>
          <p>Este es un email de prueba del sistema de premios de Glampling.</p>
          <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
          <p>Si recibes este email, la configuración está funcionando correctamente.</p>
        </div>
      `
    };
    
    const resultado = await transporter.sendMail(emailPrueba);
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

// Endpoint para diagnosticar problemas de Gmail
app.post('/api/diagnosticar-gmail', async (req, res) => {
  try {
    console.log('🔍 Iniciando diagnóstico completo de Gmail...');
    
    // Verificar variables de entorno
    const variables = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '***configurada***' : '❌ NO CONFIGURADA',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL
    };
    
    console.log('📧 Variables de entorno:', variables);
    
    // Verificar que todas las variables estén configuradas
    const variablesFaltantes = Object.entries(variables)
      .filter(([key, value]) => !value || value.includes('NO CONFIGURADA'))
      .map(([key]) => key);
    
    if (variablesFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Variables de entorno faltantes',
        faltantes: variablesFaltantes,
        solucion: 'Configura todas las variables en Railway'
      });
    }
    
    // Probar conexión SMTP principal
    let resultadoPrincipal = null;
    try {
      console.log('🔍 Probando configuración SMTP principal...');
      await transporter.verify();
      resultadoPrincipal = { exito: true, mensaje: 'Conexión SMTP principal exitosa' };
      console.log('✅ Configuración SMTP principal funciona');
    } catch (error) {
      resultadoPrincipal = { 
        exito: false, 
        mensaje: 'Conexión SMTP principal falló',
        error: error.message,
        codigo: error.code
      };
      console.log('❌ Configuración SMTP principal falló:', error.message);
    }
    
    // Probar conexión SMTP alternativa
    let resultadoAlternativo = null;
    try {
      console.log('🔍 Probando configuración SMTP alternativa...');
      await transporterAlternativo.verify();
      resultadoAlternativo = { exito: true, mensaje: 'Conexión SMTP alternativa exitosa' };
      console.log('✅ Configuración SMTP alternativa funciona');
    } catch (error) {
      resultadoAlternativo = { 
        exito: false, 
        mensaje: 'Conexión SMTP alternativa falló',
        error: error.message,
        codigo: error.code
      };
      console.log('❌ Configuración SMTP alternativa falló:', error.message);
    }
    
    // Determinar qué configuración usar
    let configuracionRecomendada = null;
    if (resultadoPrincipal.exito) {
      configuracionRecomendada = 'principal';
    } else if (resultadoAlternativo.exito) {
      configuracionRecomendada = 'alternativa';
    } else {
      configuracionRecomendada = 'ninguna';
    }
    
    res.json({
      success: configuracionRecomendada !== 'ninguna',
      configuracionRecomendada,
      variables,
      pruebas: {
        principal: resultadoPrincipal,
        alternativa: resultadoAlternativo
      },
      recomendaciones: configuracionRecomendada === 'ninguna' ? [
        '1. Verifica que la contraseña de aplicación de Gmail sea correcta',
        '2. Asegúrate de que la verificación en 2 pasos esté activada',
        '3. Genera una nueva contraseña de aplicación',
        '4. Verifica que no haya restricciones de red en Railway'
      ] : [
        `Usar configuración ${configuracionRecomendada}`,
        'El sistema funcionará correctamente'
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
  console.log(`🧪 Probar email: POST http://localhost:${PORT}/api/test-email`);
  console.log(`🔍 Diagnosticar Gmail: POST http://localhost:${PORT}/api/diagnosticar-gmail`);
  console.log(`🔄 Reintentar emails: POST http://localhost:${PORT}/api/reintentar-emails`);
  console.log(`📧 Configuración de email: ${process.env.EMAIL_USER}`);
  console.log(`⚡ Los emails se envían en segundo plano (no bloquean la respuesta)`);
});
