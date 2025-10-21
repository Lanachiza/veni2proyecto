// src/index.js
require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Crea el servidor HTTP a partir de Express
const server = http.createServer(app);

// Manejo de errores no controlados
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Escucha el puerto
server.listen(PORT, () => {
  console.log(`🚀 VENI 2 backend corriendo en puerto ${PORT} (modo: ${process.env.NODE_ENV || 'development'})`);
});

// Cierre controlado del servidor
process.on('SIGINT', () => {
  console.log('\n🛑 Servidor detenido manualmente.');
  server.close(() => {
    console.log('Conexión cerrada.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Finalización recibida (SIGTERM). Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente.');
    process.exit(0);
  });
});
