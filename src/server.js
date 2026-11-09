const app = require('./app');
const PORT = Number(process.env.PORT || 3000);

// Esperar a que el almacén de sesiones esté listo antes de recibir peticiones
app.locals.sessionStore.onReady()
  .then(() => {
    app.listen(PORT, () => console.log(`Plataforma Zenú disponible en http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('No se pudo conectar con la base de datos:', e.message);
    process.exit(1);
  });
