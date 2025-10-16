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
    rejectUnauthorized: false
  },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,   // 30 segundos
  socketTimeout: 60000     // 60 segundos
});

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

    // Verificar conexión SMTP
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

    // Enviar emails
    const resultadoUsuario = await transporter.sendMail(emailUsuario);
    console.log('✅ Email al usuario enviado:', resultadoUsuario.messageId);
    
    const resultadoAdmin = await transporter.sendMail(emailAdmin);
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
      admin: process.env.ADMIN_EMAIL
    };
    
    console.log('📧 Configuración actual:', config);
    
    // Verificar conexión SMTP
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
    res.status(500).json({
      success: false,
      error: 'Error enviando email de prueba',
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
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
  console.log(`🔄 Reintentar emails: POST http://localhost:${PORT}/api/reintentar-emails`);
  console.log(`📧 Configuración de email: ${process.env.EMAIL_USER}`);
  console.log(`⚡ Los emails se envían en segundo plano (no bloquean la respuesta)`);
});
