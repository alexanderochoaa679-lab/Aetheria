'use strict';

const CLAVE_STORAGE = 'aetheria_contactos';

/* 1. Mensaje de bienvenida al cargar completamente el sitio */
window.addEventListener('load', () => {
    alert('¡Bienvenido a Aetheria!\n\nSoluciones informáticas para tu empresa.');
});

/* 2. Reloj en tiempo real (formato de 12 horas) en el header */
const elReloj = document.getElementById('reloj');

function dosDigitos(n) {
    return String(n).padStart(2, '0');
}

function formatearHora12(fecha) {
    const horas24 = fecha.getHours();
    const periodo = horas24 >= 12 ? 'PM' : 'AM';
    const horas12 = horas24 % 12 || 12; // 0 -> 12, 13 -> 1, etc.
    return `${dosDigitos(horas12)}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())} ${periodo}`;
}

function actualizarReloj() {
    elReloj.textContent = formatearHora12(new Date());
}

actualizarReloj();
setInterval(actualizarReloj, 1000);

/* 3. Detectar la selección de un servicio en el <select> */
const formulario = document.getElementById('formulario-contacto');
const selectServicio = document.getElementById('servicio');
const infoServicio = document.getElementById('info-servicio');

const descripcionesServicio = {
    'Soporte técnico': 'Resolvemos problemas y mantenemos tu infraestructura funcionando.',
    'Desarrollo web': 'Aplicaciones web modernas y escalables.',
    'Redes corporativas': 'Redes seguras y eficientes para tu comunicación interna.',
    'Ciberseguridad': 'Protección de tus datos y de tus sistemas.',
    'Nube y respaldos': 'Servicios en la nube y respaldos automatizados.',
    'Bases de datos': 'Consultoría e implementación de bases de datos.'
};

selectServicio.addEventListener('change', () => {
    const nombre = selectServicio.options[selectServicio.selectedIndex].text;
    const detalle = descripcionesServicio[nombre] || '';
    infoServicio.textContent = `Servicio seleccionado: ${nombre}. ${detalle}`;
    console.log('Servicio seleccionado:', nombre);
});

/* 4. Eventos del mouse (mouseover / mouseleave) en botones */
const barraEstado = document.getElementById('barra-estado');

document.querySelectorAll('.boton').forEach((boton) => {
    boton.addEventListener('mouseover', () => {
        const texto = boton.textContent.trim();
        barraEstado.textContent = `Cursor sobre el botón: "${texto}"`;
        barraEstado.classList.add('visible');
        console.log('mouseover →', texto);
    });

    boton.addEventListener('mouseleave', () => {
        barraEstado.classList.remove('visible');
        console.log('mouseleave →', boton.textContent.trim());
    });
});

/* 5. Validación: ningún campo puede enviarse vacío */
const CAMPOS = ['nombre', 'correo', 'telefono', 'servicio', 'mensaje'];
const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mostrarError(campo, mensaje) {
    const spanError = document.getElementById(`error-${campo.id}`);
    spanError.textContent = mensaje;
    if (mensaje) {
        campo.setAttribute('aria-invalid', 'true');
    } else {
        campo.removeAttribute('aria-invalid');
    }
}

function validarCampo(campo) {
    const valor = campo.value.trim();
    let mensaje = '';

    if (valor === '') {
        mensaje = campo.tagName === 'SELECT'
            ? 'Selecciona un servicio.'
            : 'Este campo es obligatorio.';
    } else if (campo.type === 'email' && !patronCorreo.test(valor)) {
        mensaje = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
    }

    mostrarError(campo, mensaje);
    return mensaje === '';
}

// Si un campo ya tenía error, se revalida mientras la persona corrige
['input', 'change'].forEach((evento) => {
    formulario.addEventListener(evento, (e) => {
        if (e.target.getAttribute('aria-invalid') === 'true') {
            validarCampo(e.target);
        }
    });
});

// Al borrar el formulario se limpian errores y avisos
formulario.addEventListener('reset', () => {
    CAMPOS.forEach((id) => mostrarError(document.getElementById(id), ''));
    infoServicio.textContent = '';
});

/* 7. Guardado en localStorage */
function leerRegistros() {
    try {
        const lista = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        return [];
    }
}

function guardarRegistros(lista) {
    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(lista));
        return true;
    } catch (error) {
        console.error('No se pudo usar localStorage:', error);
        return false;
    }
}

/* 6. Ventana emergente para revisar y enviar los datos
   Etapa 1: la persona revisa y pulsa "Confirmar y enviar".
   Etapa 2: se guarda el registro y se muestra la confirmación. */
const dialogo = document.getElementById('confirmacion');
const dialogoTitulo = document.getElementById('confirmacion-titulo');
const dialogoTexto = document.getElementById('confirmacion-texto');
const dialogoDatos = document.getElementById('confirmacion-datos');
const accionesRevision = document.getElementById('acciones-revision');
const accionesExito = document.getElementById('acciones-exito');
const botonEnviar = document.getElementById('confirmacion-enviar');
const botonEditar = document.getElementById('confirmacion-editar');
const botonAceptar = document.getElementById('confirmacion-aceptar');
const botonBorrar = document.getElementById('confirmacion-borrar');

let registroActual = null;
let enviado = false;

function pintarDatos(registro) {
    // textContent (no innerHTML) para no interpretar HTML escrito por la persona
    dialogoDatos.replaceChildren();
    const filas = [
        ['Nombre', registro.nombre],
        ['Correo', registro.correo],
        ['Teléfono', registro.telefono],
        ['Servicio', registro.servicio],
        ['Mensaje', registro.mensaje]
    ];
    filas.forEach(([etiqueta, valor]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = etiqueta;
        dd.textContent = valor;
        dialogoDatos.append(dt, dd);
    });
}

// Etapa 1: revisión antes de enviar
function abrirRevision(registro) {
    registroActual = registro;
    enviado = false;

    dialogoTitulo.textContent = 'Revisa tus datos';
    dialogoTexto.textContent = 'Confirma que la información es correcta para enviarla.';
    pintarDatos(registro);
    accionesRevision.hidden = false;
    accionesExito.hidden = true;

    if (typeof dialogo.showModal === 'function') {
        dialogo.showModal();
        botonEnviar.focus();
    } else if (confirm('¿Enviar los datos del formulario?')) {
        // Respaldo para navegadores sin <dialog>
        registro.fecha = new Date().toISOString();
        const lista = leerRegistros();
        lista.push(registro);
        guardarRegistros(lista);
        alert(`¡Gracias, ${registro.nombre}! Tu solicitud fue registrada.`);
        formulario.reset();
    }
}

// Etapa 2: envío realizado
function mostrarExito(seGuardo) {
    dialogoTitulo.textContent = `¡Gracias, ${registroActual.nombre}!`;
    dialogoTexto.textContent = seGuardo
        ? 'Tus datos fueron enviados y guardados en este navegador (localStorage).'
        : 'Tus datos fueron enviados, pero el navegador no permitió guardarlos en localStorage.';
    accionesRevision.hidden = true;
    accionesExito.hidden = false;
    botonBorrar.disabled = !seGuardo;
    botonAceptar.focus();
}

botonEnviar.addEventListener('click', () => {
    registroActual.fecha = new Date().toISOString();
    const lista = leerRegistros();
    lista.push(registroActual);
    const seGuardo = guardarRegistros(lista);
    enviado = true;

    console.log('Formulario enviado:', registroActual);
    mostrarExito(seGuardo);
});

// "Volver a editar" cierra la ventana y conserva lo escrito
botonEditar.addEventListener('click', () => dialogo.close());

botonAceptar.addEventListener('click', () => dialogo.close());

botonBorrar.addEventListener('click', () => {
    if (!registroActual) return;
    const restantes = leerRegistros().filter((r) => r.fecha !== registroActual.fecha);
    guardarRegistros(restantes);
    dialogoTexto.textContent = 'El registro se eliminó de este navegador.';
    botonBorrar.disabled = true;
    console.log('Registro eliminado. Quedan:', restantes.length);
});

// Al cerrar (botón o tecla Esc): si ya se envió, se limpia el formulario;
// si no, se conservan los datos y el foco vuelve al formulario
dialogo.addEventListener('close', () => {
    if (enviado) {
        formulario.reset();
    } else {
        formulario.nombre.focus();
    }
    registroActual = null;
    enviado = false;
});

/* Envío del formulario: valida y abre la ventana emergente */
formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const campos = CAMPOS.map((id) => document.getElementById(id));
    const resultados = campos.map(validarCampo); // valida todos para mostrar todos los errores

    if (resultados.includes(false)) {
        formulario.querySelector('[aria-invalid="true"]').focus();
        return;
    }

    abrirRevision({
        nombre: formulario.nombre.value.trim(),
        correo: formulario.correo.value.trim(),
        telefono: formulario.telefono.value.trim(),
        servicio: formulario.servicio.value,
        mensaje: formulario.mensaje.value.trim()
    });
});