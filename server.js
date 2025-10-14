const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Array para almacenar premios (en producción usarías una base de datos)
const premiosRegistrados = [];

// Endpoint para registrar premios
app.post('/api/registrar-premio', (req, res) => {
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
      id: Date.now(),
      email,
      premio,
      timestamp,
      fechaRegistro: new Date().toLocaleString('es-ES')
    };
    
    // Guardar en "base de datos" (array)
    premiosRegistrados.push(nuevoPremio);
    
    console.log('🎉 Nuevo premio registrado:', nuevoPremio);
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Premio registrado exitosamente',
      premio: nuevoPremio
    });
    
  } catch (error) {
    console.error('Error al registrar premio:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para ver todos los premios (opcional)
app.get('/api/premios', (req, res) => {
  res.json({
    total: premiosRegistrados.length,
    premios: premiosRegistrados
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ver premios: http://localhost:${PORT}/api/premios`);
});
