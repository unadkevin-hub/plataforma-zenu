// Utilidades de presentación y validación
function escapar(t = '') {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Convierte el marcado sencillo de las lecciones en HTML seguro:
// "## " subtítulo, "- " viñeta, línea en blanco separa párrafos.
function lecciónAHtml(texto = '') {
  const bloques = String(texto).replace(/\r/g, '').split(/\n\s*\n/);
  return bloques.map((b) => {
    const lineas = b.split('\n').filter((l) => l.trim() !== '');
    let html = '';
    let lista = [];
    const cerrarLista = () => { if (lista.length) { html += '<ul>' + lista.map((i) => `<li>${escapar(i)}</li>`).join('') + '</ul>'; lista = []; } };
    let parrafo = [];
    const cerrarParrafo = () => { if (parrafo.length) { html += `<p>${escapar(parrafo.join(' '))}</p>`; parrafo = []; } };
    for (const l of lineas) {
      if (l.startsWith('## ')) { cerrarParrafo(); cerrarLista(); html += `<h2 class="h5 mt-4">${escapar(l.slice(3))}</h2>`; }
      else if (l.startsWith('- ')) { cerrarParrafo(); lista.push(l.slice(2)); }
      else { cerrarLista(); parrafo.push(l.trim()); }
    }
    cerrarParrafo(); cerrarLista();
    return html;
  }).join('\n');
}

const ALIAS_RE = /^[a-zA-Z0-9_.ñÑ-]{3,30}$/;

function validarContrasena(c = '') {
  return typeof c === 'string' && c.length >= 8 && /[A-Za-zñÑ]/.test(c) && /\d/.test(c);
}

// Orden de presentación de las opciones de una actividad: una permutación estable para cada
// estudiante y actividad, para que la respuesta correcta no esté siempre en la misma posición.
function barajar(n, semilla) {
  let h = 2166136261;
  for (const c of String(semilla)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const azar = () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; };
  const orden = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}

module.exports = { escapar, leccionAHtml: lecciónAHtml, ALIAS_RE, validarContrasena, barajar };
