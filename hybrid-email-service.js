// Servicio de email híbrido: Gmail + SendGrid como fallback
const EmailService = require('./email-service');
const SendGridService = require('./sendgrid-service');

class HybridEmailService {
  constructor() {
    this.gmailService = new EmailService();
    this.sendgridService = new SendGridService();
  }

  async enviarEmail(emailData) {
    // Intentar Gmail primero
    try {
      console.log('📧 Intentando con Gmail...');
      return await this.gmailService.enviarEmail(emailData);
    } catch (error) {
      console.log('❌ Gmail falló, intentando con SendGrid...');
      
      // Si Gmail falla, usar SendGrid
      try {
        return await this.sendgridService.enviarEmail(emailData);
      } catch (sendgridError) {
        console.error('❌ SendGrid también falló:', sendgridError);
        throw new Error('Ambos servicios de email fallaron');
      }
    }
  }

  async enviarNotificaciones(premio) {
    // Intentar Gmail primero
    try {
      console.log('📧 Intentando notificaciones con Gmail...');
      const resultado = await this.gmailService.enviarNotificaciones(premio);
      if (resultado) {
        console.log('✅ Notificaciones enviadas con Gmail');
        return true;
      }
    } catch (error) {
      console.log('❌ Gmail falló, intentando con SendGrid...');
    }

    // Si Gmail falla, usar SendGrid
    try {
      const resultado = await this.sendgridService.enviarNotificaciones(premio);
      if (resultado) {
        console.log('✅ Notificaciones enviadas con SendGrid');
        return true;
      }
    } catch (error) {
      console.error('❌ SendGrid también falló:', error);
    }

    return false;
  }

  // Método para probar ambos servicios
  async diagnosticar() {
    const resultados = {
      gmail: { funciona: false, error: null },
      sendgrid: { funciona: false, error: null }
    };

    // Probar Gmail
    try {
      const emailPrueba = {
        from: `"Test" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: 'Test Gmail',
        text: 'Test'
      };
      await this.gmailService.enviarEmail(emailPrueba);
      resultados.gmail.funciona = true;
    } catch (error) {
      resultados.gmail.error = error.message;
    }

    // Probar SendGrid
    try {
      const emailPrueba = {
        to: process.env.ADMIN_EMAIL,
        subject: 'Test SendGrid',
        text: 'Test'
      };
      await this.sendgridService.enviarEmail(emailPrueba);
      resultados.sendgrid.funciona = true;
    } catch (error) {
      resultados.sendgrid.error = error.message;
    }

    return resultados;
  }
}

module.exports = HybridEmailService;
