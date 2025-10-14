// Configuración para Firebase Firestore
// Copia este archivo como .env y configura tus variables

module.exports = {
  // Firebase Configuration (Recomendado - GRATIS)
  firebase: {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com", 
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  },
  
  // Email Configuration
  email: {
    host: "smtp.gmail.com",
    port: 587,
    user: "tu-email@gmail.com",
    pass: "tu-app-password",
    admin: "admin@glampling.com"
  },
  
  // Server Configuration
  server: {
    port: 3000
  }
};
