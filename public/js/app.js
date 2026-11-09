// Mejoras progresivas: la plataforma funciona sin JavaScript; esto solo agiliza la experiencia.
document.addEventListener('DOMContentLoaded', function () {
  // Menú en móviles
  var btn = document.getElementById('btn-menu');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
  }

  // Botón para ver u ocultar la contraseña mientras se escribe
  document.querySelectorAll('input[type="password"]').forEach(function (campo) {
    var grupo = document.createElement('div');
    grupo.className = 'input-group';
    campo.parentNode.insertBefore(grupo, campo);
    grupo.appendChild(campo);
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-outline-secondary ver-clave';
    boton.textContent = 'Ver';
    boton.setAttribute('aria-label', 'Mostrar contraseña');
    boton.setAttribute('aria-pressed', 'false');
    boton.addEventListener('click', function () {
      var visible = campo.type === 'password';
      campo.type = visible ? 'text' : 'password';
      boton.textContent = visible ? 'Ocultar' : 'Ver';
      boton.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      boton.setAttribute('aria-pressed', visible ? 'true' : 'false');
      campo.focus();
    });
    grupo.appendChild(boton);
  });

  // Confirmación antes de acciones destructivas
  document.querySelectorAll('form.confirmar').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!window.confirm(f.dataset.confirmar || '¿Confirmas esta acción?')) e.preventDefault();
    });
  });

  // Registro: mostrar el asentimiento del acudiente solo para 15-17 años
  var bloqueMenor = document.getElementById('bloque-menor');
  if (bloqueMenor) {
    var actualizar = function () {
      var r = document.querySelector('input[name="rango_edad"]:checked');
      bloqueMenor.hidden = !(r && r.value === '15-17');
    };
    document.querySelectorAll('input[name="rango_edad"]').forEach(function (i) { i.addEventListener('change', actualizar); });
    actualizar();
  }

  // Video bajo demanda (RNF-11): no se descarga hasta que el estudiante lo pide
  document.querySelectorAll('.video .cargar-video').forEach(function (b) {
    b.addEventListener('click', function () {
      var cont = b.closest('.video');
      var url = cont.dataset.video;
      var m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if (!m) { window.open(url, '_blank', 'noopener'); return; }
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + m[1];
      iframe.title = 'Video de apoyo';
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      iframe.className = 'w-100 rounded';
      iframe.style.aspectRatio = '16 / 9';
      cont.replaceChildren(iframe);
    });
  });

  // Actividades con retroalimentación inmediata sin recargar la página (RF-06)
  document.querySelectorAll('form.actividad').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var elegida = f.querySelector('input[name="opcion"]:checked');
      var caja = f.querySelector('.retro');
      if (!elegida) { caja.innerHTML = '<div class="alert alert-warning mb-0">Selecciona una opción.</div>'; return; }
      var boton = f.querySelector('button[type="submit"]');
      boton.disabled = true;
      fetch(f.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': f.querySelector('input[name="_csrf"]').value },
        body: JSON.stringify({ opcion: Number(elegida.value) }),
        credentials: 'same-origin'
      }).then(function (r) { return r.json(); }).then(function (d) {
        var alerta = document.createElement('div');
        alerta.className = 'alert mb-0 ' + (d.correcta ? 'alert-success' : 'alert-warning');
        var fuerte = document.createElement('strong');
        fuerte.textContent = d.correcta ? '¡Correcto! ' : 'No es correcto. ';
        alerta.appendChild(fuerte);
        if (!d.correcta) {
          alerta.appendChild(document.createTextNode('La respuesta correcta es: '));
          var em = document.createElement('em'); em.textContent = d.respuestaCorrecta; alerta.appendChild(em);
          alerta.appendChild(document.createTextNode('. '));
        }
        alerta.appendChild(document.createTextNode(d.retroalimentacion));
        caja.replaceChildren(alerta);
        var est = f.querySelector('.estado-actividad');
        est.innerHTML = d.estado === 'aprobada' ? '<span class="text-success">✓ Aprobada</span> · ' + d.intentos + ' intento(s)' : '<span class="text-danger-emphasis">Inténtalo otra vez</span> · ' + d.intentos + ' intento(s)';
        if (d.leccionCompletada && !document.getElementById('aviso-completa')) {
          var aviso = document.createElement('div');
          aviso.id = 'aviso-completa';
          aviso.className = 'alert alert-success';
          aviso.setAttribute('role', 'status');
          aviso.className = 'alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-2';
          var texto = document.createElement('strong');
          texto.textContent = '¡Completaste esta lección!';
          aviso.appendChild(texto);
          var siguiente = document.querySelector('#navegacion-leccion .siguiente-paso');
          if (siguiente) aviso.appendChild(siguiente.cloneNode(true));
          var acts = document.querySelectorAll('form.actividad');
          acts[acts.length - 1].after(aviso);
        }
      }).catch(function () {
        f.submit(); // si falla la conexión asíncrona, se envía el formulario normal
      }).finally(function () { boton.disabled = false; });
    });
  });
});
