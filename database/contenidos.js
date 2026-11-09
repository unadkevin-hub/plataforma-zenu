// Contenidos iniciales de los tres módulos formativos (Tabla 9 del documento maestro).
// Marcado sencillo en "contenido": "## " subtítulo, "- " viñeta, línea en blanco = párrafo nuevo.

module.exports = [
  {
    titulo: 'Herramientas ofimáticas',
    area_digcomp: 'Creación de contenidos digitales',
    descripcion: 'Aprende a hacer documentos, tablas con sumas y presentaciones sencillas, y a guardar tus archivos en la nube para no perderlos.',
    icono: 'ofimatica.svg',
    lecciones: [
      {
        titulo: 'Tu primer documento: una tradición Zenú',
        resumen: 'Títulos, párrafos, viñetas e imágenes en un procesador de texto.',
        minutos: 7,
        contenido: `Un procesador de texto (como Word, Google Docs o WPS Office en el celular) sirve para escribir trabajos con buena presentación. Vamos a practicar escribiendo sobre una tradición de la comunidad, por ejemplo el tejido de la caña flecha para el sombrero vueltiao.

## Partes de un buen documento
- Título: va al inicio, en letra más grande o con el estilo "Título 1".
- Párrafos: cada idea en un párrafo distinto. Deja que el programa haga el salto de línea; no presiones Enter al final de cada renglón.
- Viñetas: sirven para listas, por ejemplo los pasos del tejido o los materiales.
- Imágenes: se insertan desde el menú Insertar > Imagen. Escribe debajo de dónde salió la foto.

## Estilos, no espacios
Para centrar o dar formato usa los botones de alineación y los estilos. Si usas la barra espaciadora para "empujar" el texto, el documento se desordena cuando lo abren en otro equipo.

## Guarda con un nombre claro
Ejemplo: "Tradicion_cana_flecha_Grado10.docx". Así tu docente y tú encuentran el archivo fácil.`,
        actividades: [
          {
            enunciado: 'Vas a escribir los pasos para tejer la trenza de caña flecha. ¿Qué herramienta del procesador de texto es la más adecuada?',
            opciones: ['Escribir todos los pasos seguidos en un solo párrafo', 'Usar una lista numerada con un paso en cada línea', 'Pegar una imagen distinta para cada uno de los pasos', 'Separar los pasos con la barra espaciadora y Enter'],
            respuesta: 1,
            retroalimentacion: 'Las listas numeradas o con viñetas ordenan los pasos y hacen que el texto se lea fácil. Los espacios en blanco desordenan el documento en otros equipos.'
          },
          {
            enunciado: '¿Cuál es la forma correcta de poner el título de tu trabajo?',
            opciones: ['Escribirlo en mayúsculas y con muchos espacios antes', 'Copiarlo como imagen y pegarlo al inicio del archivo', 'Aplicarle el estilo «Título 1» desde la cinta de estilos', 'Escribirlo al final del documento, después de todo'],
            respuesta: 2,
            retroalimentacion: 'El estilo "Título 1" da formato uniforme y además permite crear tablas de contenido automáticas.'
          },
          {
            enunciado: '¿Cuál de estos nombres de archivo es mejor para entregar tu trabajo?',
            opciones: ['Tradicion_cana_flecha_Grado10.docx', 'trabajo final final ahora si.docx', 'documento1_final_definitivo.docx', 'mi_tarea_de_tecnologia_nueva.docx'],
            respuesta: 0,
            retroalimentacion: 'Un nombre claro dice de qué trata el archivo y de quién es, sin espacios raros ni palabras repetidas.'
          }
        ]
      },
      {
        titulo: 'Hoja de cálculo: la tabla de gastos',
        resumen: 'Celdas, filas, columnas y la fórmula SUMA.',
        minutos: 8,
        contenido: `Una hoja de cálculo (Excel, Google Sheets) organiza datos en celdas. Cada celda tiene una dirección: la columna es una letra y la fila un número. Por ejemplo, B3 es la columna B, fila 3.

## Ejemplo: gastos de una venta de artesanías
- En la columna A escribe el material: caña flecha, tinte natural, hilo.
- En la columna B escribe el valor de cada material.
- En la celda B5 escribe la fórmula =SUMA(B2:B4) para obtener el total.

## Las fórmulas empiezan con "="
Si escribes SUMA(B2:B4) sin el signo igual, la hoja lo toma como texto y no calcula nada. Otras fórmulas útiles: =PROMEDIO(), =MAX() y =MIN().

## Ventaja de las fórmulas
Si cambias un precio, el total se actualiza solo. Por eso no se debe escribir el total "a mano".`,
        actividades: [
          {
            enunciado: 'En la hoja, los valores de los materiales están en las celdas B2, B3 y B4. ¿Qué escribes en B5 para obtener el total?',
            opciones: ['SUMA(B2:B4)', '=B2+B4', '=SUMA(B2;B5)', '=SUMA(B2:B4)'],
            respuesta: 3,
            retroalimentacion: 'Las fórmulas empiezan con "=" y el rango se escribe con dos puntos: =SUMA(B2:B4).'
          },
          {
            enunciado: '¿Qué significa la dirección de celda C7?',
            opciones: ['Fila C, columna 7', 'Hoja C, celda número 7', 'Columna C, fila 7', 'Columna 7, fila C'],
            respuesta: 2,
            retroalimentacion: 'Primero va la letra de la columna y luego el número de la fila.'
          },
          {
            enunciado: 'Cambiaste el precio del tinte y el total no cambió. ¿Qué pasó probablemente?',
            opciones: ['La hoja está dañada y hay que crear otra nueva', 'El total se escribió a mano y no con una fórmula', 'Las hojas de cálculo no suman números con decimales', 'Hay que cerrar el archivo para que se actualice'],
            respuesta: 1,
            retroalimentacion: 'Cuando el total es un número escrito a mano, no se recalcula. Con =SUMA() se actualiza solo.'
          }
        ]
      },
      {
        titulo: 'Presentaciones y archivos en la nube',
        resumen: 'Diapositivas claras y cómo guardar en Google Drive.',
        minutos: 6,
        contenido: `Una presentación acompaña lo que dices; no reemplaza tu exposición. Una buena diapositiva tiene pocas palabras y una imagen que ayude a entender.

## Reglas para diapositivas claras
- Un tema por diapositiva.
- Máximo cinco viñetas cortas.
- Letra grande y buen contraste: texto oscuro sobre fondo claro, o al revés.
- Cita de dónde sacaste las imágenes.

## Guardar en la nube
Google Drive y OneDrive guardan tus archivos en internet. Si se daña o se pierde el celular, el archivo sigue ahí. Para compartirlo con tu docente usa la opción Compartir y escoge "Lector" si solo lo va a revisar.`,
        actividades: [
          {
            enunciado: '¿Cuál diapositiva se entiende mejor?',
            opciones: ['Una con dos párrafos largos en letra pequeña', 'Una con texto amarillo claro sobre fondo blanco', 'Una con diez imágenes pequeñas y sin título', 'Una con título, tres viñetas cortas y una foto'],
            respuesta: 3,
            retroalimentacion: 'Pocas palabras, buen contraste y una imagen de apoyo hacen que la diapositiva se entienda rápido.'
          },
          {
            enunciado: 'Quieres que tu docente revise tu trabajo en Drive pero sin poder cambiarlo. ¿Qué permiso le das?',
            opciones: ['Lector, para que solo pueda verlo', 'Editor, para que pueda cambiarlo', 'Propietario, para que lo administre', 'Ninguno: le das tu contraseña'],
            respuesta: 0,
            retroalimentacion: 'El permiso de Lector deja ver el archivo sin modificarlo. Nunca compartas la contraseña de tu cuenta.'
          },
          {
            enunciado: '¿Cuál es una ventaja de guardar tus archivos en la nube?',
            opciones: ['Los archivos se pueden abrir sin internet siempre', 'Los archivos ocupan más memoria en el teléfono', 'Si pierdes el celular, tus archivos no se pierden', 'Cualquier persona puede verlos sin pedir permiso'],
            respuesta: 2,
            retroalimentacion: 'La nube funciona como copia de respaldo: tus archivos quedan en tu cuenta aunque cambies de equipo.'
          }
        ]
      }
    ]
  },
  {
    titulo: 'Búsqueda y evaluación de información',
    area_digcomp: 'Alfabetización en información y datos',
    descripcion: 'Busca mejor en internet, reconoce fuentes confiables, detecta noticias falsas y aprende a citar de dónde sacas la información.',
    icono: 'busqueda.svg',
    lecciones: [
      {
        titulo: 'Buscar con palabras clave',
        resumen: 'Cómo escribir búsquedas precisas en Google.',
        minutos: 6,
        contenido: `Los buscadores no entienden preguntas largas como una persona. Funcionan mejor con palabras clave: las palabras más importantes del tema.

## De pregunta a palabras clave
Pregunta: "¿Cómo era la forma en que los antiguos Zenúes manejaban el agua en el río San Jorge?"
Palabras clave: canales hidráulicos zenú río San Jorge

## Trucos útiles
- Comillas: "sombrero vueltiao" busca la frase exacta.
- Signo menos: jaguar -carro quita resultados que no quieres.
- site: busca dentro de un sitio, por ejemplo: zenú site:banrepcultural.org
- filetype:pdf muestra solo documentos PDF.`,
        actividades: [
          {
            enunciado: '¿Cuál búsqueda es mejor para encontrar información sobre el sistema de canales de los Zenúes?',
            opciones: ['cosas de los zenúes de antes para mi tarea', 'qué hacían los indígenas con el agua del río', 'río San Jorge', 'canales hidráulicos zenú río San Jorge'],
            respuesta: 3,
            retroalimentacion: 'Las palabras clave específicas (qué, quién y dónde) dan resultados más precisos.'
          },
          {
            enunciado: '¿Qué hacen las comillas en una búsqueda como "sombrero vueltiao"?',
            opciones: ['Buscan la frase exacta', 'Borran la búsqueda anterior', 'Buscan solo imágenes', 'Traducen la frase al inglés'],
            respuesta: 0,
            retroalimentacion: 'Las comillas le piden al buscador que encuentre esas palabras juntas y en ese orden.'
          },
          {
            enunciado: 'Buscas documentos en PDF sobre competencias digitales. ¿Qué agregas a la búsqueda?',
            opciones: ['-pdf', '\"pdf pdf pdf\"', 'filetype:pdf', 'site:pdf'],
            respuesta: 2,
            retroalimentacion: 'El operador filetype:pdf filtra los resultados para que solo aparezcan archivos PDF.'
          }
        ]
      },
      {
        titulo: '¿Esta fuente es confiable?',
        resumen: 'Autor, fecha, propósito y evidencia.',
        minutos: 7,
        contenido: `No todo lo que aparece en internet es cierto. Antes de usar una página para una tarea, revísala con cuatro preguntas.

## Las cuatro preguntas
- ¿Quién lo escribió? Busca el autor o la institución (una universidad, el Ministerio de Educación, el Banco de la República).
- ¿Cuándo se publicó? En temas que cambian, como tecnología o salud, la fecha importa.
- ¿Para qué se publicó? ¿Para informar o para vender algo?
- ¿Muestra de dónde saca los datos? Las fuentes serias citan estudios o documentos.

## Señales de alerta
Páginas sin autor, llenas de anuncios, con títulos exagerados o que piden compartir "antes de que lo borren".`,
        actividades: [
          {
            enunciado: '¿Cuál de estas fuentes es más confiable para una tarea sobre la historia del pueblo Zenú?',
            opciones: ['Un video sin autor que dice «lo que nadie te contó»', 'Un comentario muy compartido en una página de Facebook', 'Una página sin fecha, con muchos anuncios y ventanas', 'Un artículo del Banco de la República con autor y fuentes'],
            respuesta: 3,
            retroalimentacion: 'Una institución reconocida, un autor identificado y referencias son señales de confiabilidad.'
          },
          {
            enunciado: 'Una página sobre celulares no tiene fecha de publicación. ¿Por qué es un problema?',
            opciones: ['La información puede estar desactualizada', 'No es un problema si la página se ve moderna', 'Google no muestra las páginas que no tienen fecha', 'Sin fecha la página carga más lento en el celular'],
            respuesta: 0,
            retroalimentacion: 'En temas que cambian rápido, sin fecha no sabes si la información todavía es válida.'
          },
          {
            enunciado: 'Una página dice que un té cura todas las enfermedades y al final vende el té. ¿Cuál es su propósito principal?',
            opciones: ['Informar de manera neutral', 'Enseñar ciencia', 'Vender un producto', 'Hacer un chiste'],
            respuesta: 2,
            retroalimentacion: 'Cuando la página vende lo que recomienda, su objetivo es comercial y la información puede ser exagerada.'
          }
        ]
      },
      {
        titulo: 'Noticias falsas y cómo citar',
        resumen: 'Verificar antes de compartir y dar crédito a los autores.',
        minutos: 7,
        contenido: `Las noticias falsas circulan rápido por WhatsApp y redes sociales porque usan títulos que asustan o emocionan. Antes de reenviar, verifica.

## Pasos para verificar
- Lee la noticia completa, no solo el título.
- Busca si medios reconocidos publican lo mismo.
- Revisa la fecha: a veces circulan noticias viejas como si fueran nuevas.
- Consulta sitios de verificación como ColombiaCheck.

## Citar es dar crédito
Cuando usas información de otra persona debes decir de dónde la tomaste. Una cita básica en normas APA tiene autor, año, título y enlace. Ejemplo: Banco de la República. (2020). Los zenúes y el manejo del agua. https://...`,
        actividades: [
          {
            enunciado: 'Te llega por WhatsApp: "¡URGENTE! Cierran el colegio mañana, compártelo ya". ¿Qué haces primero?',
            opciones: ['Lo reenvío rápido a todos mis grupos', 'Lo reenvío solo a mi familia por si acaso', 'Le cambio el texto y lo comparto en mi estado', 'Verifico con el colegio o fuentes oficiales'],
            respuesta: 3,
            retroalimentacion: 'Los mensajes con urgencia y sin fuente son una señal típica de noticia falsa. Primero verifica con la fuente oficial.'
          },
          {
            enunciado: '¿Qué elementos tiene una cita básica en normas APA?',
            opciones: ['Solo el enlace de la página', 'El nombre del buscador que usaste', 'Autor, año, título y fuente o enlace', 'Tu nombre y la fecha de hoy'],
            respuesta: 2,
            retroalimentacion: 'Autor, año, título y fuente permiten que cualquiera encuentre el documento original.'
          },
          {
            enunciado: 'Una foto de una inundación circula como si fuera de hoy en Sampués. ¿Qué te puede ayudar a verificarla?',
            opciones: ['Hacer una búsqueda inversa de la imagen', 'Contar cuántos «me gusta» tiene la publicación', 'Preguntar en el grupo si alguien la cree', 'Ampliar la imagen para verla con más detalle'],
            respuesta: 0,
            retroalimentacion: 'La búsqueda inversa de imágenes (Google Lens) muestra si la foto ya se había publicado antes y en qué lugar.'
          }
        ]
      }
    ]
  },
  {
    titulo: 'Navegación segura y uso responsable',
    area_digcomp: 'Seguridad',
    descripcion: 'Protege tus cuentas con contraseñas seguras, configura tu privacidad, reconoce fraudes y cuida tu huella digital.',
    icono: 'seguridad.svg',
    lecciones: [
      {
        titulo: 'Contraseñas seguras',
        resumen: 'Frases de contraseña y verificación en dos pasos.',
        minutos: 6,
        contenido: `Una contraseña débil se adivina en segundos. Una buena contraseña es larga y no tiene datos tuyos fáciles de conseguir, como tu nombre o tu fecha de nacimiento.

## Usa una frase de contraseña
Junta tres o cuatro palabras que solo tú relaciones y agrega números o signos: Caña-Rio-Tigre-27. Es larga, fácil de recordar y difícil de adivinar.

## Reglas básicas
- Una contraseña distinta para cada cuenta importante.
- No la compartas, ni siquiera con tu mejor amigo.
- Activa la verificación en dos pasos en WhatsApp, Facebook y tu correo.`,
        actividades: [
          {
            enunciado: '¿Cuál de estas contraseñas es más segura?',
            opciones: ['MiNombreCompleto2008', '1234567890', 'contraseña123', 'Caña-Rio-Tigre-27'],
            respuesta: 3,
            retroalimentacion: 'Una frase larga con varias palabras y signos es mucho más difícil de adivinar que un nombre o una fecha.'
          },
          {
            enunciado: '¿Para qué sirve la verificación en dos pasos?',
            opciones: ['Para entrar más rápido sin escribir la clave', 'Para pedir un código extra si alguien sabe tu clave', 'Para borrar los mensajes viejos de la cuenta', 'Para gastar menos datos al usar la aplicación'],
            respuesta: 1,
            retroalimentacion: 'Con la verificación en dos pasos, aunque alguien tenga tu contraseña, necesita también un código que solo llega a ti.'
          },
          {
            enunciado: 'Tu amigo te pide la contraseña de tu Facebook "solo para ver algo". ¿Qué haces?',
            opciones: ['Se la doy porque es mi amigo de confianza', 'Se la doy y la cambio dentro de un año', 'No la comparto; si necesita algo, se lo muestro', 'Le doy mejor la contraseña de mi correo'],
            respuesta: 2,
            retroalimentacion: 'Las contraseñas son personales. Compartirlas pone en riesgo tu cuenta y tu información.'
          }
        ]
      },
      {
        titulo: 'Fraudes y suplantación',
        resumen: 'Reconocer mensajes engañosos antes de caer.',
        minutos: 7,
        contenido: `Los estafadores se hacen pasar por bancos, empresas, familiares o concursos para que entregues datos o dinero. A esto se le llama suplantación o phishing.

## Señales de fraude
- Te ofrecen un premio que no pediste.
- Te presionan con urgencia: "si no respondes en una hora, pierdes tu cuenta".
- Te piden códigos que llegan por mensaje de texto.
- El enlace tiene letras raras o no corresponde a la empresa real.

## Qué hacer
No abras el enlace, no envíes códigos, bloquea el número y avisa a un adulto o a tu docente. Si ya entregaste un dato, cambia la contraseña de inmediato.`,
        actividades: [
          {
            enunciado: 'Te escriben: "Ganaste un celular. Envíanos el código de 6 dígitos que te llegó por mensaje para reclamarlo". ¿Qué es esto?',
            opciones: ['Un fraude para robar tu cuenta de WhatsApp', 'Un premio real de una empresa conocida', 'Un mensaje oficial del colegio o del cabildo', 'Una actualización normal del celular'],
            respuesta: 0,
            retroalimentacion: 'Ninguna empresa seria pide códigos de verificación. Ese código sirve para entrar a tu cuenta de WhatsApp.'
          },
          {
            enunciado: '¿Cuál enlace es sospechoso?',
            opciones: ['https://www.bancolombia.com', 'https://www.mineducacion.gov.co', 'https://bancoIombia-premios.xyz', 'https://www.unad.edu.co'],
            respuesta: 2,
            retroalimentacion: 'El enlace usa una "I" mayúscula en vez de la "l" y un dominio raro (.xyz). Es una imitación.'
          },
          {
            enunciado: 'Ya enviaste tu contraseña a una página falsa. ¿Qué haces?',
            opciones: ['Nada, ya pasó y no se puede hacer nada', 'Borro la aplicación y la vuelvo a instalar', 'Envío también mi correo para que me ayuden', 'Cambio la contraseña y activo los dos pasos'],
            respuesta: 3,
            retroalimentacion: 'Cambiar la contraseña rápido y activar la verificación en dos pasos impide que el estafador use tu cuenta.'
          }
        ]
      },
      {
        titulo: 'Privacidad y huella digital',
        resumen: 'Qué publicar, quién lo ve y cuánto dura.',
        minutos: 6,
        contenido: `La huella digital es todo el rastro que dejas en internet: fotos, comentarios, "me gusta" y búsquedas. Es muy difícil de borrar y otras personas, como futuros empleadores o universidades, pueden verla.

## Configura tu privacidad
- En Facebook e Instagram revisa quién puede ver tus publicaciones: "Amigos" en lugar de "Público".
- Desactiva la ubicación en las fotos.
- Revisa qué aplicaciones tienen permiso de usar tu cámara, micrófono y contactos.

## Antes de publicar, piensa
¿Me molestaría que esto lo viera mi familia, mi docente o el gobernador del cabildo? Si la respuesta es sí, mejor no lo publiques. Nunca publiques tu dirección, tu número de documento ni tu ubicación en tiempo real.`,
        actividades: [
          {
            enunciado: '¿Cuál de estos datos NO deberías publicar en redes sociales?',
            opciones: ['Tu número de documento de identidad', 'Una foto del paisaje del resguardo', 'Una frase que te gusta mucho', 'Tu canción favorita del momento'],
            respuesta: 0,
            retroalimentacion: 'El número de documento permite suplantar tu identidad. Es un dato personal que debes proteger.'
          },
          {
            enunciado: '¿Qué opción de privacidad es más segura para tus publicaciones personales?',
            opciones: ['Público', 'Cualquiera con el enlace', 'Todos los grupos', 'Amigos'],
            respuesta: 3,
            retroalimentacion: 'Con "Amigos" solo las personas que aceptaste pueden ver lo que publicas.'
          },
          {
            enunciado: '¿Qué es la huella digital?',
            opciones: ['La huella de tu dedo que queda en la pantalla', 'El rastro de lo que publicas y haces en internet', 'Un programa antivirus que protege el celular', 'La contraseña que usas para desbloquear el celular'],
            respuesta: 1,
            retroalimentacion: 'La huella digital es todo lo que queda registrado de ti en internet, y puede durar muchos años.'
          }
        ]
      }
    ]
  }
];
