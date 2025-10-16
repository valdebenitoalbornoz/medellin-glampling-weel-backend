// Servicio de email alternativo para Railway
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporters = [];
    this.initializeTransporters();
  }

  initializeTransporters() {
    // Configuración 1: Gmail con configuración especial para Railway
    this.transporters.push({
      name: 'Gmail Railway',
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465, // Puerto SSL
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      })
    });

    // Configuración 2: Gmail con puerto 587
    this.transporters.push({
      name: 'Gmail 587',
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      })
    });

    // Configuración 3: Gmail con service
    this.transporters.push({
      name: 'Gmail Service',
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      })
    });
  }

  async enviarEmail(emailData) {
    console.log('📧 Intentando enviar email...');
    
    for (let i = 0; i < this.transporters.length; i++) {
      const config = this.transporters[i];
      console.log(`🔍 Probando configuración ${i + 1}: ${config.name}`);
      
      try {
        // Verificar conexión
        await config.transporter.verify();
        console.log(`✅ Conexión exitosa con ${config.name}`);
        
        // Enviar email
        const resultado = await config.transporter.sendMail(emailData);
        console.log(`✅ Email enviado exitosamente con ${config.name}:`, resultado.messageId);
        
        return {
          success: true,
          messageId: resultado.messageId,
          transporter: config.name
        };
        
      } catch (error) {
        console.log(`❌ ${config.name} falló:`, error.message);
        
        // Si es el último transporter, lanzar error
        if (i === this.transporters.length - 1) {
          throw new Error(`Todas las configuraciones fallaron. Último error: ${error.message}`);
        }
      }
    }
  }

  async enviarNotificaciones(premio) {
    try {
      console.log('📧 Enviando notificaciones...');
      
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

      // Enviar emails
      const resultadoUsuario = await this.enviarEmail(emailUsuario);
      const resultadoAdmin = await this.enviarEmail(emailAdmin);
      
      console.log('📧 Emails enviados exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error enviando emails:', error);
      return false;
    }
  }
}

module.exports = EmailService;
