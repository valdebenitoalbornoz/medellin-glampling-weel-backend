const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } = require('firebase/firestore');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

console.log('✅ Firebase inicializado correctamente');

// Configurar transporter de email
const transporter = nodemailer.createTransporter({
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
    const nuevoPremio = {
      email,
      premio,
      timestamp: timestamp || new Date(),
      fechaRegistro: new Date().toLocaleString('es-ES'),
      notificado: false
    };
    
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'premios'), nuevoPremio);
    const premioGuardado = { id: docRef.id, ...nuevoPremio };
    
    console.log('🎉 Nuevo premio registrado:', premioGuardado);
    
    // Enviar notificaciones por email
    const emailsEnviados = await enviarNotificaciones(premioGuardado);
    
    // Actualizar estado de notificación
    if (emailsEnviados) {
      // En Firestore, actualizaríamos el documento, pero por simplicidad lo marcamos como notificado
      premioGuardado.notificado = true;
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
    const premiosSnapshot = await getDocs(query(collection(db, 'premios'), orderBy('timestamp', 'desc')));
    const premios = premiosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
    const premiosSnapshot = await getDocs(collection(db, 'premios'));
    const premios = premiosSnapshot.docs.map(doc => doc.data());
    
    const totalPremios = premios.length;
    const premiosNotificados = premios.filter(p => p.notificado).length;
    
    // Premios de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    
    const premiosHoy = premios.filter(p => {
      const fechaPremio = new Date(p.timestamp);
      return fechaPremio >= hoy && fechaPremio < mañana;
    }).length;
    
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
  console.log(`🔥 Usando Firebase Firestore`);
});
