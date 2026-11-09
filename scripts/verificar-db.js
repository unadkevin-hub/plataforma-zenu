// Verifica que MySQL (por ejemplo, el de XAMPP) esté encendido y que el usuario del .env pueda entrar.
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
}).then(async (c) => {
  await c.end();
  console.log('MySQL OK');
  process.exit(0);
}).catch((e) => {
  if (e.code === 'ECONNREFUSED') {
    console.log('\n  MySQL no esta encendido.\n  Abra el panel de XAMPP y dele "Start" a MySQL. Luego vuelva a abrir este archivo.\n');
  } else if (e.code === 'ER_ACCESS_DENIED_ERROR') {
    console.log('\n  MySQL rechazo el usuario o la clave.\n  Abra el archivo .env con el Bloc de notas y revise DB_USER y DB_PASSWORD\n  (en XAMPP normalmente es DB_USER=root y DB_PASSWORD vacio).\n');
  } else {
    console.log('\n  No se pudo conectar con MySQL: ' + e.message + '\n');
  }
  process.exit(1);
});
