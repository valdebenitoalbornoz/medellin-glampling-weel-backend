// Servicio de email usando SendGrid (más confiable con Railway)
const sgMail = require('@sendgrid/mail');

class SendGridService {
  constructor() {
    // Configurar SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async enviarEmail(emailData) {
    try {
      console.log('📧 Enviando email con SendGrid...');
      
      const msg = {
        to: emailData.to,
        from: {
          email: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          name: 'Glampling'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.subject
      };

      const response = await sgMail.send(msg);
      console.log('✅ Email enviado con SendGrid:', response[0].statusCode);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        transporter: 'SendGrid'
      };
      
    } catch (error) {
      console.error('❌ Error enviando email con SendGrid:', error);
      throw error;
    }
  }

  async enviarNotificaciones(premio) {
    try {
      console.log('📧 Enviando notificaciones con SendGrid...');
      
      // Email al usuario
      const emailUsuario = {
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
      
      console.log('📧 Emails enviados exitosamente con SendGrid');
      return true;
      
    } catch (error) {
      console.error('❌ Error enviando emails con SendGrid:', error);
      return false;
    }
  }
}

module.exports = SendGridService;
