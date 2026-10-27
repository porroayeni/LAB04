const API = 'https://jsonplaceholder.typicode.com';

// Elementos del DOM
const formBuscar   = document.querySelector('#form-buscar');
const formCrear    = document.querySelector('#form-crear');
const formComentar = document.querySelector('#form-comentar'); // Actividad 3

const inputUsuario = document.querySelector('#input-usuario');
const inputLimite  = document.querySelector('#input-limite');  // Actividad 2
const inputFiltro  = document.querySelector('#input-filtro');  // Actividad 2

const inputTitulo  = document.querySelector('#input-titulo');
const inputCuerpo  = document.querySelector('#input-cuerpo');
const errorTitulo  = document.querySelector('#error-titulo');  // Actividad 3
const errorCuerpo  = document.querySelector('#error-cuerpo');  // Actividad 3

const btnCrear     = document.querySelector('#btn-crear');
const btnComentar  = document.querySelector('#btn-comentar');  // Actividad 3
const estado       = document.querySelector('#estado');
const lista        = document.querySelector('#lista');

// 1. Petición genérica
async function peticion(url, opciones = {}) {
    const res = await fetch(url, opciones);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return { status: res.status, datos: await res.json() };
}

// 2. Crear Tarjeta e interactividad
function crearTarjeta(post, esNuevo = false) {
    const art = document.createElement('article');
    art.className = esNuevo ? 'post nuevo' : 'post';
    
    const h3 = document.createElement('h3');
    h3.textContent = `#${post.id} ${post.title}`;
    
    const p = document.createElement('p');
    p.textContent = post.body;

    // Actividad 2: Contenedor para cargar comentarios
    const divComentarios = document.createElement('div');
    divComentarios.className = 'comentarios';

    art.append(h3, p, divComentarios);

    // Actividad 2: Evento para hacer GET a los comentarios al hacer clic
    art.addEventListener('click', async () => {
        if (divComentarios.style.display === 'block') {
            divComentarios.style.display = 'none';
            return;
        }
        
        divComentarios.style.display = 'block';
        divComentarios.textContent = 'Cargando comentarios...';
        
        try {
            const { datos } = await peticion(`${API}/posts/${post.id}/comments`);
            divComentarios.innerHTML = '<strong>Comentarios:</strong><hr>';
            
            datos.forEach(c => {
                const cDiv = document.createElement('div');
                cDiv.className = 'comentario-item';
                cDiv.innerHTML = `<em>${c.email}</em>: ${c.body}`;
                divComentarios.appendChild(cDiv);
            });
        } catch (error) {
            divComentarios.textContent = 'Error al cargar los comentarios.';
        }
    });

    return art;
}

function mostrarEstado(texto, esError = false) {
    estado.textContent = texto;
    estado.className = esError ? 'error' : '';
}

// 3. GET: Listar publicaciones (Incluye Límite y Filtro de la Actividad 2)
formBuscar.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams({
        userId: inputUsuario.value,
        _limit: inputLimite.value 
    });
    
    mostrarEstado('Cargando...');
    try {
        const { status, datos } = await peticion(`${API}/posts?${params}`);
        
        const textoFiltro = inputFiltro.value.trim().toLowerCase();
        const filtrados = textoFiltro 
            ? datos.filter(post => post.title.toLowerCase().includes(textoFiltro))
            : datos;

        lista.replaceChildren(...filtrados.map(p => crearTarjeta(p)));
        mostrarEstado(`GET ${status}: ${filtrados.length} publicaciones mostradas`);
    } catch (error) {
        mostrarEstado(error.message, true);
    }
});

// 4. POST: Crear una publicación con validaciones (Actividad 3)
formCrear.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorTitulo.textContent = '';
    errorCuerpo.textContent = '';

    const tituloVal = inputTitulo.value.trim();
    const cuerpoVal = inputCuerpo.value.trim();
    let hayError = false;

    if (tituloVal.length < 5) {
        errorTitulo.textContent = 'El título debe tener al menos 5 caracteres.';
        hayError = true;
    }
    
    if (cuerpoVal === '') {
        errorCuerpo.textContent = 'El contenido no puede estar vacío.';
        hayError = true;
    }

    if (hayError) return;

    const nuevo = {
        title: tituloVal,
        body: cuerpoVal,
        userId: Number(inputUsuario.value)
    };
    
    btnCrear.disabled = true;
    mostrarEstado('Enviando publicación...');
    try {
        const { status, datos } = await peticion(`${API}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevo)
        });
        lista.prepend(crearTarjeta(datos, true));
        mostrarEstado(`POST ${status}: creada con id ${datos.id}`);
        formCrear.reset();
    } catch (error) {
        mostrarEstado(error.message, true);
    } finally {
        btnCrear.disabled = false;
    }
});

// 5. POST: Enviar comentario usando FormData (Actividad 3)
formComentar.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnComentar.disabled = true;
    mostrarEstado('Enviando comentario...');
    
    const formData = new FormData(formComentar);
    const cuerpoComentario = Object.fromEntries(formData);
    
    cuerpoComentario.postId = Number(cuerpoComentario.postId);

    try {
        const { status, datos } = await peticion(`${API}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpoComentario)
        });
        mostrarEstado(`Estado ${status}: Comentario creado con id ${datos.id}`);
        formComentar.reset();
    } catch (error) {
        mostrarEstado(error.message, true);
    } finally {
        btnComentar.disabled = false;
    }
});

// Carga inicial
formBuscar.requestSubmit();