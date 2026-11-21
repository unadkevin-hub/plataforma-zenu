# Registro de sprints — Ruta Digital Zenú

Modelo incremental basado en prototipos, ejecutado con Scrum. Cada sprint entregó un incremento ejecutable del prototipo.

| Rol | Responsable |
|---|---|
| Dueño del producto | Alexander Manuel Suarez Campo |
| Scrum Master | Laura Lizethe Ospino Vásquez |
| Equipo de desarrollo | Alexander Manuel Suarez Campo, Laura Lizethe Ospino Vásquez y Kevin Andrés Oliveros Canchila |

**Criterio de terminado:** el código está en el repositorio, funciona en un teléfono móvil, cumple su criterio de aceptación, tiene al menos una prueba automatizada que lo verifica y no rompe las pruebas existentes.

## Trazabilidad de historias de usuario

| Historia de usuario | Requerimiento | Elemento del backlog | Sprint | Pruebas |
|---|---|---|---|---|
| HU-01 Registrarme con un alias sin exponer mis datos | RF-01 | PB-03 | 1 | CP-01 a CP-04, PU-04, PU-05 |
| HU-07 Recuperar mi contraseña sin correo ni teléfono | RF-02 | PB-04, PB-05 | 1 | CP-06, CP-07, PU-06, PU-07 |
| HU-08 Que cada persona entre solo a las funciones de su rol | RF-03 | PB-06 | 1 | CP-09 a CP-11, PU-11, PU-12 |
| HU-02 Ver los módulos y mi avance | RF-04, RF-08 | PB-08, PB-13 | 2 | CP-12, CP-19, CP-27, PU-08 a PU-10 |
| HU-06 Usar las lecciones con conexión lenta | RF-05 | PB-09, PB-12 | 2 | CP-13, CP-26, PU-01 a PU-03 |
| HU-03 Practicar y recibir retroalimentación | RF-06, RF-07 | PB-10, PB-11 | 2 | CP-14 a CP-18, PU-15 |
| HU-04 Publicar lecciones y actividades | RF-09 | PB-14 | 3 | CP-20, CP-21 |
| HU-05 Consultar reportes del grupo sin datos identificables | RF-10 | PB-15 | 3 | CP-22 |
| HU-09 Descargar o eliminar mis datos | RF-11 | PB-16 | 3 | CP-24 |
| HU-10 Exportar resultados sin nombres ni alias | RF-12 | PB-17 | 3 | CP-23 |

## Sprint 1 — Estructura base, registro y acceso seguro (26 al 30 de octubre de 2026)

**Objetivo:** que un joven pueda crear una cuenta con un alias, aceptar el aviso de privacidad e ingresar de forma segura desde su teléfono, y que cada rol vea solo lo que le corresponde.

| Elemento | Tareas | Estado |
|---|---|---|
| PB-01 | Proyecto Node.js con Express, EJS y mysql2; estructura de carpetas; repositorio | Terminado |
| PB-02 | `schema.sql` con tablas, llaves foráneas y borrado en cascada; `init.js` | Terminado |
| PB-03 | Registro con validación de alias y contraseña, aviso de privacidad, autorización y asentimiento del acudiente | Terminado |
| PB-04 | Cifrado con bcrypt, sesión en MySQL con cookie HttpOnly, regeneración de la sesión al ingresar | Terminado |
| PB-05 | Código de recuperación de un solo uso, guardado cifrado | Terminado |
| PB-06 | `requiereSesion` y `requiereRol`; redirección de cada rol a su panel | Terminado |
| PB-07 | Plantilla adaptable, menú móvil, enlace para saltar al contenido, aviso de privacidad | Terminado |

**Resultado:** 25 de 25 puntos terminados. **Retrospectiva:** al regenerar la sesión en el ingreso cambia el token CSRF; se mantuvo la regeneración por seguridad y se ajustaron las pruebas. Desde aquí, toda funcionalidad nueva entra con su prueba.

## Sprint 2 — Módulos formativos y actividades (31 de octubre al 4 de noviembre de 2026)

**Objetivo:** que el estudiante recorra los tres módulos, responda las actividades con retroalimentación inmediata y vea su avance.

| Elemento | Tareas | Estado |
|---|---|---|
| PB-08 | Avance por módulo, tarjetas con barra de progreso, botón «Continuar» | Terminado |
| PB-09 | Marcado sencillo del contenido convertido a HTML escapado; video solo bajo demanda | Terminado |
| PB-10 | Respuesta con `fetch` y JSON sin recargar; envío normal como respaldo sin JavaScript | Terminado |
| PB-11 | Tabla `resultados` con puntaje, intentos y estado; lección completada al responder todo | Terminado |
| PB-12 | 9 lecciones y 27 actividades con ejemplos del contexto Zenú | Terminado |
| PB-13 | Página «Mi progreso» con totales, avance y logros | Terminado |

**Resultado:** 24 de 24 puntos terminados. **Retrospectiva:** se agregó el respaldo sin JavaScript para conexiones inestables y se decidió mostrar la respuesta correcta con su explicación cuando el estudiante se equivoca.

## Sprint 3 — Facilitador, reportes, privacidad y calidad (5 al 8 de noviembre de 2026)

**Objetivo:** gestión de contenidos y reportes sin datos identificables, derechos del titular, seguridad transversal, pruebas y despliegue.

| Elemento | Tareas | Estado |
|---|---|---|
| PB-14 | Crear, editar, publicar y eliminar módulos, lecciones y actividades; restablecer contraseñas | Terminado |
| PB-15 | Reporte por rango de edad, avance, completitud, puntaje e intentos; actividades con más dificultad | Terminado |
| PB-16 | Perfil: editar alias y edad, cambiar contraseña, descargar datos en JSON, eliminar la cuenta | Terminado |
| PB-17 | Cambio de rol, activación de cuentas, exportación CSV con seudónimos (HMAC) | Terminado |
| PB-18 | Política de seguridad de contenido, cabeceras con helmet, token CSRF, límite de intentos | Terminado |
| PB-19 | Pruebas automatizadas, auditoría Lighthouse, pruebas en 3G lenta, 3G y 4G | Terminado |
| PB-20 | `render.yaml`, ruta `/salud`, guía de despliegue | Terminado |

**Resultado:** 29 de 29 puntos terminados. **Retrospectiva:** una consulta del reporte no funcionaba en MariaDB y se resolvió en la capa de lógica; se agregó el restablecimiento de contraseña por el facilitador para no pedir correo ni teléfono.

## Ajustes por prueba exploratoria (9 de noviembre de 2026)

Un integrante del equipo instaló el prototipo en su computador y lo recorrió completo (prueba grabada en video).

| Hallazgo | Ajuste | Verificación |
|---|---|---|
| No se puede ver la contraseña al escribirla | Botón «Ver / Ocultar» en todos los campos de contraseña | Revisión manual |
| Las contraseñas no se leen en la base de datos | Sin cambios: se guardan cifradas con bcrypt a propósito (RNF-05) | CP-05 |
| La respuesta correcta suele ser la opción más larga | Opciones reescritas con longitudes parecidas y orden distinto para cada estudiante | PU-15 |
| No hay botón para pasar al siguiente módulo | Botones «Siguiente módulo» y «Mi panel» al terminar; aviso en el módulo completado | CP-27 |

**Estado de las pruebas:** 42 pruebas automatizadas (15 unitarias y 27 de integración), todas aprobadas.
