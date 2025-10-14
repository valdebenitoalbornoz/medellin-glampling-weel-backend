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
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar emails
async function enviarNotificaciones(premio) {
  try {
    // Email al usuario
    const emailUsuario = {
      from: process.env.EMAIL_USER,
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
      from: process.env.EMAIL_USER,
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

    // Enviar emails
    await transporter.sendMail(emailUsuario);
    await transporter.sendMail(emailAdmin);
    
    console.log('📧 Emails enviados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error enviando emails:', error);
    return false;
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
    
    // Enviar notificaciones por email
    const emailsEnviados = await enviarNotificaciones(premioGuardado);
    
    // Actualizar estado de notificación
    if (emailsEnviados) {
      premioGuardado.notificado = true;
      await premioGuardado.save();
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Premio registrado exitosamente',
      premio: premioGuardado,
      notificado: emailsEnviados
    });
    
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ver premios: http://localhost:${PORT}/api/premios`);
  console.log(`📈 Estadísticas: http://localhost:${PORT}/api/estadisticas`);
  console.log(`📧 Configuración de email: ${process.env.EMAIL_USER}`);
});
