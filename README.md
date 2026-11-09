# Ruta Digital Zenú

Prototipo funcional (TRL 5) de una plataforma web para el fortalecimiento de competencias digitales básicas en jóvenes del Resguardo Indígena Zenú de Pan Señor, Sampués, Sucre.

Proyecto de grado · Ingeniería de Sistemas · Universidad Nacional Abierta y a Distancia (UNAD) · Grupo 202016907_12

**Autores:** Alexander Manuel Suarez Campo, Laura Lizethe Ospino Vásquez y Kevin Andrés Oliveros Canchila.

## ¿Qué hace?

| Actor | Funcionalidades |
|---|---|
| Estudiante | Registro con alias y rango de edad, aceptación del aviso de privacidad, ingreso, recuperación de contraseña con código, tres módulos formativos con lecciones y actividades con retroalimentación inmediata, progreso por módulo y logros, descarga y eliminación de sus datos. |
| Facilitador | Crear, editar, publicar y eliminar módulos, lecciones y actividades; reportes agregados del grupo sin datos identificables; restablecer contraseñas de estudiantes. |
| Administrador | Todo lo del facilitador, más gestión de roles, activación de cuentas y exportación CSV anonimizada de resultados. |

Módulos incluidos (alineados con DigComp 2.2): Herramientas ofimáticas · Búsqueda y evaluación de información · Navegación segura y uso responsable. En total 9 lecciones y 27 actividades.

## Tecnologías

HTML5, CSS3, JavaScript y Bootstrap 5 (capa de presentación) · Node.js 18+ con Express 5 y plantillas EJS (lógica de negocio) · MySQL 8 o MariaDB 10.6+ (datos) · bcryptjs, helmet, express-session, express-rate-limit (seguridad) · Jest y Supertest (pruebas) · Render (despliegue).

## Instalación local

Requisitos: Node.js 18 o superior y MySQL 8 (o MariaDB 10.6+).

```bash
git clone <URL-del-repositorio>
cd plataforma-zenu
npm install
cp .env.example .env        # en Windows: copy .env.example .env
# edite .env con el usuario y la contraseña de su MySQL
npm run db:init             # crea la base, las tablas, las cuentas iniciales y los contenidos
npm start                   # http://localhost:3000
```

Cuentas iniciales (cambie las contraseñas en `.env` antes de `npm run db:init`):

| Rol | Alias | Contraseña por defecto |
|---|---|---|
| Administrador | `admin` | `Admin-Zenu-2026` |
| Facilitador | `facilitador` | `Facilitador-Zenu-2026` |

Los estudiantes se registran desde la página de inicio.

> `npm run db:init` borra y vuelve a crear las tablas. No lo ejecute sobre una base con datos reales.

## Pruebas

```bash
npm test
```

Ejecuta 26 casos de prueba automatizados (CP-01 a CP-26) sobre una base de datos aparte (`plataforma_zenu_test`), que cubren registro, autenticación, roles, actividades, progreso, panel del facilitador, reportes, exportación anonimizada, derechos del titular y seguridad. Las evidencias de Lighthouse y de las pruebas en conexión de baja velocidad están en `docs/evidencias/`.

## Despliegue en Render

1. Cree una base de datos MySQL en un servicio con plan gratuito (por ejemplo, Aiven for MySQL) y anote host, puerto, usuario y contraseña.
2. Desde su equipo, con esas credenciales en `.env` y `DB_SSL=true`, ejecute `npm run db:init` una sola vez.
3. En Render: *New > Blueprint*, seleccione este repositorio (usa `render.yaml`) y complete las variables `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD`.
4. Render publica la plataforma con HTTPS en `https://<nombre>.onrender.com`. La ruta `/salud` permite verificar la conexión con la base de datos.

## Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Prototipo funcional Ruta Digital Zenú - Fase 4"
git branch -M main
git remote add origin https://github.com/<usuario>/plataforma-zenu.git
git push -u origin main
```

El archivo `.env` no se sube (está en `.gitignore`). Para que el tutor tenga acceso de solo lectura, la forma más simple es dejar el repositorio público. Si debe ser privado, créenlo dentro de una organización de GitHub y agreguen al tutor con el rol *Read*; en un repositorio personal privado, los colaboradores reciben permisos de escritura.

## Estructura

```
database/        schema.sql (modelo de datos), contenidos.js (módulos, lecciones y actividades), init.js
src/app.js       configuración de Express, seguridad, sesiones
src/routes/      auth, estudiante, perfil, facilitador, admin
src/views/       plantillas EJS
src/models.js    consultas de progreso y logros
public/          estilos, JavaScript del cliente e ilustraciones SVG
tests/           pruebas automatizadas (Jest + Supertest)
scripts/         simulación de uso con 25 participantes virtuales y análisis de los instrumentos
docs/evidencias/ reportes de Lighthouse y de pruebas de baja velocidad
docs/guion-video.md guion sugerido para el video de máximo 10 minutos
```

## Privacidad

La plataforma aplica minimización de datos (Ley 1581 de 2012): solo guarda alias, rango de edad, contraseña cifrada, autorizaciones y resultados. No pide nombre, documento, teléfono ni correo. Los reportes son agregados y la exportación usa seudónimos irreversibles.

## Licencia

MIT. Uso académico.
