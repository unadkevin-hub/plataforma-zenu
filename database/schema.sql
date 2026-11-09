-- Plataforma web para el fortalecimiento de competencias digitales básicas
-- Resguardo Zenú de Pan Señor, Sampués, Sucre
-- Esquema de base de datos (MySQL 8 / MariaDB 10.6+)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS resultados;
DROP TABLE IF EXISTS progreso_lecciones;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS lecciones;
DROP TABLE IF EXISTS modulos;
DROP TABLE IF EXISTS consentimientos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- Roles del sistema (RF-03)
CREATE TABLE roles (
  id_rol      TINYINT UNSIGNED PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios: solo alias y rango de edad (minimización de datos, Ley 1581 de 2012)
CREATE TABLE usuarios (
  id_usuario        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alias             VARCHAR(30) NOT NULL UNIQUE,
  rango_edad        ENUM('15-17','18-20','adulto') NOT NULL,
  hash_contrasena   VARCHAR(100) NOT NULL,
  hash_recuperacion VARCHAR(100) NOT NULL,
  id_rol            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_ingreso    DATETIME NULL,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consentimientos otorgados (aviso de privacidad / tratamiento de datos)
CREATE TABLE consentimientos (
  id_consentimiento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT UNSIGNED NOT NULL,
  tipo              ENUM('aviso_privacidad','tratamiento_datos','asentimiento_menor') NOT NULL,
  version_texto     VARCHAR(10) NOT NULL,
  aceptado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consent_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Módulos formativos (alineados con DigComp 2.2)
CREATE TABLE modulos (
  id_modulo    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(120) NOT NULL,
  area_digcomp VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(400) NOT NULL,
  icono        VARCHAR(40)  NOT NULL DEFAULT 'modulo.svg',
  orden        SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  publicado    TINYINT(1) NOT NULL DEFAULT 0,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lecciones (texto con marcado sencillo; video opcional bajo demanda)
CREATE TABLE lecciones (
  id_leccion    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_modulo     INT UNSIGNED NOT NULL,
  titulo        VARCHAR(150) NOT NULL,
  resumen       VARCHAR(300) NOT NULL,
  contenido     TEXT NOT NULL,
  url_video     VARCHAR(255) NULL,
  minutos       TINYINT UNSIGNED NOT NULL DEFAULT 5,
  orden         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  publicado     TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_leccion_modulo FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actividades prácticas de selección con retroalimentación inmediata
CREATE TABLE actividades (
  id_actividad     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_leccion       INT UNSIGNED NOT NULL,
  tipo             ENUM('seleccion','caso','tarea_guiada') NOT NULL DEFAULT 'seleccion',
  enunciado        VARCHAR(600) NOT NULL,
  opciones         JSON NOT NULL,
  respuesta        TINYINT UNSIGNED NOT NULL,
  retroalimentacion VARCHAR(600) NOT NULL,
  orden            SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_actividad_leccion FOREIGN KEY (id_leccion) REFERENCES lecciones(id_leccion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lecciones completadas por cada estudiante (RF-04, RF-08)
CREATE TABLE progreso_lecciones (
  id_usuario  INT UNSIGNED NOT NULL,
  id_leccion  INT UNSIGNED NOT NULL,
  completada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_leccion),
  CONSTRAINT fk_prog_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_prog_leccion FOREIGN KEY (id_leccion) REFERENCES lecciones(id_leccion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resultados: puntaje, intentos y estado por actividad (RF-07)
CREATE TABLE resultados (
  id_resultado  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT UNSIGNED NOT NULL,
  id_actividad  INT UNSIGNED NOT NULL,
  puntaje       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  intentos      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  estado        ENUM('pendiente','aprobada','no_aprobada') NOT NULL DEFAULT 'pendiente',
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_actividad (id_usuario, id_actividad),
  CONSTRAINT fk_res_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_res_actividad FOREIGN KEY (id_actividad) REFERENCES actividades(id_actividad) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id_rol, nombre, descripcion) VALUES
 (1, 'estudiante',    'Joven del Resguardo que realiza los módulos formativos'),
 (2, 'facilitador',   'Docente o líder comunitario que gestiona contenidos y consulta reportes'),
 (3, 'administrador', 'Gestiona usuarios, roles y exportación de datos anonimizados');
