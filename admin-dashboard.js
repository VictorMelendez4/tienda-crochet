import { clienteSupabase } from './supabase.js';

let productosGlobales = [];
let galeriaActual = [];

// Componente Loader SVG de Alto Nivel
const SPINNER_SVG = `
    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
`;

// --- SEGURIDAD Y SESIÓN ---
async function verificarSesion() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (!session) window.location.href = 'admin-login.html'; 
}
verificarSesion();

window.cerrarSesion = async function() {
    await clienteSupabase.auth.signOut();
    window.location.href = 'admin-login.html';
}

// --- GESTIÓN INTERACTIVA DE DROPZONES ---
function configurarDropzone(idDropzone, idInput, idText) {
    const dropzone = document.getElementById(idDropzone);
    const input = document.getElementById(idInput);
    const textLabel = document.getElementById(idText);

    if (!dropzone || !input) return;

    // Cuando se selecciona un archivo mediante clic
    input.addEventListener('change', (e) => {
        if (input.files.length > 0) {
            textLabel.innerText = input.files.length === 1 ? input.files[0].name : `${input.files.length} archivos seleccionados`;
            textLabel.classList.remove('hidden');
        } else {
            textLabel.classList.add('hidden');
        }
    });

    // Efectos visuales al arrastrar encima
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dropzone-active');
        }, false);
    });

    // Quitar efectos al soltar o salir
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dropzone-active');
        }, false);
    });

    // Manejar el archivo soltado
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        input.files = files;
        
        // Disparar evento change manualmente para actualizar el texto
        const event = new Event('change');
        input.dispatchEvent(event);
    });
}

// Inicializamos las Dropzones
configurarDropzone('dropzone-crear', 'imagen-crear', 'file-name-crear');
configurarDropzone('dropzone-editar', 'imagenes-editar', 'file-name-editar');

// --- PROCESAMIENTO ASÍNCRONO DE IMÁGENES ---
async function subirImagen(archivo) {
    const fileExt = archivo.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `imagenes/${fileName}`;

    const { error } = await clienteSupabase.storage.from('productos').upload(filePath, archivo);
    if (error) throw error;

    const { data } = clienteSupabase.storage.from('productos').getPublicUrl(filePath);
    return data.publicUrl;
}

// --- REGISTRO DE PRODUCTOS (INSERT) ---
document.getElementById('form-crear').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensaje-crear');
    const textoOriginal = btn.innerHTML;
    
    btn.innerHTML = SPINNER_SVG + "<span>Subiendo Activos...</span>";
    btn.disabled = true;

    try {
        const archivo = document.getElementById('imagen-crear').files[0];
        if (!archivo) throw new Error("Se requiere una imagen base.");
        
        const urlPrincipal = await subirImagen(archivo);

        const nuevoProducto = {
            nombre: document.getElementById('nombre-crear').value.trim(),
            precio: parseFloat(document.getElementById('precio-crear').value),
            descripcion: document.getElementById('desc-crear').value.trim(),
            stock: parseInt(document.getElementById('stock-crear').value),
            categoria: document.getElementById('categoria-crear').value,
            imagen_url: urlPrincipal,
            galeria: [urlPrincipal],
            disponible: true
        };

        const { error } = await clienteSupabase.from('productos').insert([nuevoProducto]);
        if (error) throw error;

        document.getElementById('form-crear').reset();
        document.getElementById('file-name-crear').classList.add('hidden');
        
        mensaje.className = "text-xs text-center font-semibold mt-2 text-emerald-600";
        mensaje.innerText = "Catálogo actualizado de forma exitosa.";
        cargarInventario();
    } catch (err) {
        mensaje.className = "text-xs text-center font-semibold mt-2 text-rose-600";
        mensaje.innerText = `Fallo de carga: ${err.message}`;
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        setTimeout(() => { mensaje.innerText = ""; }, 4000);
    }
});

// --- RENDERIZADO ANALÍTICO E INVENTARIO ---
async function cargarInventario() {
    const { data, error } = await clienteSupabase.from('productos').select('*').order('id', { ascending: false });
    if (error) return console.error("Error estructural de base de datos:", error);
    
    productosGlobales = data;
    actualizarMetricas(data);
    renderizarEstructuraInventario(data);
}

function actualizarMetricas(productos) {
    document.getElementById('kpi-total-productos').innerHTML = `${productos.length} <span class="text-xs font-normal text-gray-400">diseños</span>`;
    const valorTotal = productos.reduce((suma, prod) => suma + (prod.precio || 0), 0);
    document.getElementById('kpi-valor-inventario').innerHTML = `$${valorTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})} <span class="text-xs font-normal text-gray-400">MXN</span>`;
}

function renderizarEstructuraInventario(productos) {
    const lista = document.getElementById('lista-inventario');
    lista.innerHTML = '';

    if (productos.length === 0) {
        lista.innerHTML = `
            <div class="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">inventory</span>
                <p class="text-sm font-medium font-serif italic">No se han indexado productos en el catálogo operativo.</p>
            </div>`;
        return;
    }

    productos.forEach(prod => {
        // Codificamos el producto para pasarlo al modal de forma segura
        const prodData = encodeURIComponent(JSON.stringify(prod));
        
        // Verificamos si tiene galería válida (más de 1 foto)
        let tieneGaleria = false;
        try {
            const galeriaArr = typeof prod.galeria === 'string' ? JSON.parse(prod.galeria) : prod.galeria;
            tieneGaleria = Array.isArray(galeriaArr) && galeriaArr.length > 1;
        } catch(e) {}

        lista.innerHTML += `
        <article class="bg-white rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-[#EFEFD7]/50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-md transition-shadow">
            
            <div class="flex items-center gap-4 min-w-0 flex-1">
                <img src="${prod.imagen_url}" alt="${prod.nombre}" class="w-16 h-16 rounded-xl object-cover bg-[#FAF9F5] border border-gray-100 flex-shrink-0">
                <div class="truncate">
                    <h3 class="font-semibold text-base text-[#1B1D0E] truncate">${prod.nombre}</h3>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-[#7C5544] text-sm font-bold">$${(prod.precio || 0).toFixed(2)} MXN</span>
                        <span class="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md border border-gray-200">${prod.categoria || 'Sin categoría'}</span>
                        ${tieneGaleria ? `<span class="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">filter_none</span>+${prod.galeria.length - 1}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-4 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                
                <div class="flex items-center gap-2 bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-gray-100 shadow-inner">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</label>
                    <input type="number" min="0" value="${prod.stock || 0}" 
                           onchange="actualizarStockRapido(${prod.id}, this.value)" 
                           class="w-14 p-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#7C5544] text-center font-semibold bg-white transition-colors hover:border-gray-300">
                </div>
                
                <div class="flex items-center gap-1">
                    <button onclick="abrirModalEdicion('${prodData}')" class="text-gray-400 hover:text-blue-600 hover:bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center transition-colors" title="Modificar Ficha completa"><span class="material-symbols-outlined text-xl">edit</span></button>
                    <button onclick="borrarProducto(${prod.id})" class="text-gray-400 hover:text-rose-600 hover:bg-rose-50 w-10 h-10 rounded-xl flex items-center justify-center transition-colors" title="Eliminar Registro"><span class="material-symbols-outlined text-xl">delete</span></button>
                </div>
            </div>
        </article>`;
    });
}

// --- ACTUALIZACIÓN RÁPIDA DE STOCK INLINE ---
window.actualizarStockRapido = async function(id, nuevoStock) {
    try {
        const stockInt = parseInt(nuevoStock);
        if (isNaN(stockInt) || stockInt < 0) return; // Evita que metan letras o negativos
        
        // Actualizamos directo a Supabase
        const { error } = await clienteSupabase
            .from('productos')
            .update({ stock: stockInt })
            .eq('id', id);
            
        if (error) throw error;
        
        // Recargamos el inventario en segundo plano para actualizar los KPIs superiores
        await cargarInventario(); 
        
    } catch (err) {
        console.error("Error al actualizar stock rápido:", err);
        alert("Ocurrió un error al actualizar el inventario. Revisa tu conexión.");
        cargarInventario(); // Revertimos al valor real de la base de datos si falla
    }
}

window.filtrarInventario = function() {
    const buscadorInput = document.getElementById('buscador');
    const texto = buscadorInput.value.toLowerCase().trim();
    const filtrados = productosGlobales.filter(p => p.nombre.toLowerCase().includes(texto));
    renderizarEstructuraInventario(filtrados);
}


// --- CONSOLA MODAL DE EDICIÓN AVANZADA ---
// --- CONSOLA MODAL DE EDICIÓN AVANZADA ---
window.abrirModalEdicion = function(encodedData) {
    const prod = JSON.parse(decodeURIComponent(encodedData));
    
    // 1. Cargamos los datos básicos
    document.getElementById('id-editar').value = prod.id;
    document.getElementById('nombre-editar').value = prod.nombre;
    document.getElementById('precio-editar').value = prod.precio;
    document.getElementById('desc-editar').value = prod.descripcion;
    
    // 2. ¡AQUÍ ESTÁ LA MAGIA!: Sincronizamos Stock y Categoría
    document.getElementById('stock-editar').value = prod.stock !== undefined ? prod.stock : 0;
    
    // Si el producto tiene categoría la seleccionamos, si no, por defecto a Amigurumis
    if (prod.categoria) {
        document.getElementById('categoria-editar').value = prod.categoria;
    } else {
        document.getElementById('categoria-editar').value = "Amigurumis";
    }
    
    // 3. Blindaje de la Galería
    let galeriaLimpia = [];
    try {
        if (Array.isArray(prod.galeria)) {
            galeriaLimpia = prod.galeria;
        } else if (typeof prod.galeria === 'string' && prod.galeria.trim() !== "") {
            galeriaLimpia = JSON.parse(prod.galeria);
        }
    } catch(e) { 
        console.warn("Advertencia: No se pudo parsear el historial de la galería."); 
    }
    
    galeriaActual = (galeriaLimpia.length > 0) ? galeriaLimpia : [prod.imagen_url];
    renderizarPreviewGaleria();

    // 4. Animación fluida de entrada
    const modal = document.getElementById('modal-edicion');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.transform').classList.remove('scale-95');
    }, 10);
}

function renderizarPreviewGaleria() {
    const contenedor = document.getElementById('galeria-preview');
    contenedor.innerHTML = '';
    
    galeriaActual.forEach((url, index) => {
        const esPortada = index === 0;
        contenedor.innerHTML += `
        <div class="relative w-24 h-24 flex-shrink-0 group rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <img src="${url}" class="w-full h-full object-cover">
            ${esPortada ? `<span class="absolute top-1 left-1 text-[9px] font-bold bg-[#1B1D0E] text-white px-1.5 py-0.5 rounded-md uppercase tracking-wide">Portada</span>` : ''}
            
            <div class="absolute inset-0 bg-[#1B1D0E]/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <button type="button" onclick="eliminarFotoGaleria(${index})" class="text-white hover:text-rose-400 p-2 rounded-full transition-colors flex items-center justify-center" title="Remover imagen">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        </div>`;
    });
}

window.eliminarFotoGaleria = function(index) {
    if (galeriaActual.length === 1) {
        alert("Control de Calidad: El producto requiere al menos una imagen de catálogo activa.");
        return;
    }
    galeriaActual.splice(index, 1);
    renderizarPreviewGaleria();
}

// --- FUNCIÓN GLOBAL PARA CERRAR EL MODAL ---
function cerrarModal() {
    try {
        const modal = document.getElementById('modal-edicion');
        if (!modal) return;
        
        // Iniciamos la animación de salida
        modal.classList.add('opacity-0');
        const innerContent = modal.querySelector('.transform');
        if (innerContent) innerContent.classList.add('scale-95');
        
        // Esperamos a que termine la transición de Tailwind (300ms)
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('form-editar').reset();
            const fileNameLabel = document.getElementById('file-name-editar');
            if (fileNameLabel) fileNameLabel.classList.add('hidden');
            document.getElementById('mensaje-editar').innerText = '';
        }, 300);
    } catch (error) {
        console.error("Error al animar el cierre del modal:", error);
        // Respaldo por si falla la animación
        const modal = document.getElementById('modal-edicion');
        if (modal) modal.classList.add('hidden'); 
    }
}

// Exponemos la función al objeto window para que el HTML (los botones onclick) la puedan ver
window.cerrarModal = cerrarModal;


// --- ACTUALIZACIÓN DE PRODUCTO CON MULTI-UPLOAD PARALELO ---
document.getElementById('form-editar').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensaje-editar');
    const textoOriginal = btn.innerHTML;
    
    btn.innerHTML = SPINNER_SVG + "<span>Guardando Cambios...</span>";
    btn.disabled = true;

    try {
        const id = document.getElementById('id-editar').value;
        const archivosNuevos = document.getElementById('imagenes-editar').files;
        
        if (archivosNuevos.length > 0) {
            mensaje.className = "text-xs text-center font-semibold mt-2 text-blue-600";
            mensaje.innerText = `Subiendo lote multimedios (${archivosNuevos.length} archivos)...`;
            
            const promesasSubida = Array.from(archivosNuevos).map(archivo => subirImagen(archivo));
            const nuevasUrls = await Promise.all(promesasSubida);
            
            galeriaActual = galeriaActual.concat(nuevasUrls);
        }

        const datosActualizados = {
            nombre: document.getElementById('nombre-editar').value.trim(),
            precio: parseFloat(document.getElementById('precio-editar').value),
            stock: parseInt(document.getElementById('stock-editar').value), 
            categoria: document.getElementById('categoria-editar').value,
            descripcion: document.getElementById('desc-editar').value.trim(),
            imagen_url: galeriaActual[0], 
            galeria: galeriaActual
        };

        mensaje.className = "text-xs text-center font-semibold mt-2 text-blue-600";
        mensaje.innerText = "Sincronizando base de datos...";
        
        // BLINDAJE: Agregamos .select() para obligar a Supabase a confirmar la escritura
        const { data, error } = await clienteSupabase.from('productos')
            .update(datosActualizados)
            .eq('id', id)
            .select();

        if (error) throw error;

        // Si Supabase devuelve 0 filas, RLS nos está bloqueando en silencio
        if (!data || data.length === 0) {
            throw new Error("Bloqueo de seguridad: La tabla denegó la edición (0 filas afectadas).");
        }

        mensaje.className = "text-sm text-center font-bold mt-2 text-emerald-600";
        mensaje.innerText = "¡Actualización exitosa!";
        
        // Usamos await para asegurarnos de que la tabla local tiene la info más reciente
        await cargarInventario();

        setTimeout(() => {
            cerrarModal();
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }, 1500);

    } catch (err) {
        mensaje.className = "text-xs text-center font-bold mt-2 text-rose-600";
        mensaje.innerText = `Error: ${err.message}`;
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
});

// --- ELIMINACIÓN DE REGISTROS ---
window.borrarProducto = async function(id) {
    if(confirm("¿Estás seguro de que quieres eliminar este tejido de forma definitiva del catálogo central? Esta acción no se puede revertir.")) {
        const { error } = await clienteSupabase.from('productos').delete().eq('id', id);
        if (!error) {
            cargarInventario();
        } else {
            alert("Acción denegada por la base de datos. Revisa la consola.");
            console.error(error);
        }
    }
}

// ==========================================
// MÓDULO DE GESTIÓN DE CATEGORÍAS (CRUD)
// ==========================================

async function cargarCategorias() {
    const { data, error } = await clienteSupabase.from('categorias').select('*').order('nombre');
    
    if (error) {
        console.error("Error al cargar categorías:", error);
        return;
    }

    const selectCrear = document.getElementById('categoria-crear');
    const selectEditar = document.getElementById('categoria-editar');
    const listaModal = document.getElementById('lista-categorias-modal');
    
    let opcionesHTML = '<option value="" disabled selected>Clasifica este diseño...</option>';
    let listaHTML = '';

    if (data.length === 0) {
        listaHTML = '<li class="p-4 text-center text-xs text-gray-500 italic">No hay categorías registradas.</li>';
    }

    data.forEach(cat => {
        // Llenamos los <select>
        opcionesHTML += `<option value="${cat.nombre}">${cat.nombre}</option>`;
        
        // Llenamos la lista del modal incluyendo tu campo de descripción
        listaHTML += `
            <li class="flex justify-between items-center p-3 hover:bg-white transition-colors">
                <div>
                    <span class="text-sm font-semibold text-gray-700 block">${cat.nombre}</span>
                    ${cat.descripcion ? `<span class="text-[10px] text-gray-400 block mt-0.5">${cat.descripcion}</span>` : ''}
                </div>
                <button onclick="borrarCategoria(${cat.id}, '${cat.nombre}')" class="text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors" title="Eliminar Categoría">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </li>`;
    });

    if (selectCrear) selectCrear.innerHTML = opcionesHTML;
    if (selectEditar) selectEditar.innerHTML = opcionesHTML;
    if (listaModal) listaModal.innerHTML = listaHTML;
}

document.getElementById('form-agregar-categoria').addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputNombre = document.getElementById('nueva-categoria-nombre');
    const inputDesc = document.getElementById('nueva-categoria-desc');
    
    const nombre = inputNombre.value.trim();
    const descripcion = inputDesc.value.trim();
    
    if (!nombre) return;

    // Armamos el objeto dinámicamente con los campos de tu tabla
    const nuevaCat = { nombre: nombre };
    if (descripcion) nuevaCat.descripcion = descripcion;

    const { error } = await clienteSupabase.from('categorias').insert([nuevaCat]);
    
    if (error) {
        alert("Error al guardar: Revisa la consola.");
        console.error(error);
    } else {
        inputNombre.value = '';
        inputDesc.value = '';
        cargarCategorias(); 
    }
});

window.borrarCategoria = async function(id, nombre) {
    if (confirm(`¿Eliminar la categoría "${nombre}"? Los productos que la tengan seguirán conservando el texto, pero no aparecerá en las opciones de filtro.`)) {
        const { error } = await clienteSupabase.from('categorias').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar. Revisa la consola.");
            console.error(error);
        } else {
            cargarCategorias();
        }
    }
}

window.abrirModalCategorias = function() {
    const modal = document.getElementById('modal-categorias');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.transform').classList.remove('scale-95');
    }, 10);
}

window.cerrarModalCategorias = function() {
    const modal = document.getElementById('modal-categorias');
    modal.classList.add('opacity-0');
    modal.querySelector('.transform').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// --- GESTIÓN DE PEDIDOS ---
let pedidosGlobales = [];
let filtroEstadoActual = 'todos';

const ESTILOS_ESTADO = {
    pendiente:  'bg-amber-50 text-amber-700 border-amber-200',
    confirmado: 'bg-blue-50 text-blue-700 border-blue-200',
    enviado:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelado:  'bg-red-50 text-red-600 border-red-200'
};

async function cargarPedidos() {
    const { data: pedidos, error } = await clienteSupabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al cargar pedidos:", error);
        return;
    }

    pedidosGlobales = pedidos || [];
    actualizarBadgePedidos();
    renderizarPedidos();
}

function actualizarBadgePedidos() {
    const pendientes = pedidosGlobales.filter(p => p.estado === 'pendiente').length;
    const badge = document.getElementById('badge-pedidos-pendientes');
    if (badge) {
        badge.innerText = pendientes;
        badge.classList.toggle('hidden', pendientes === 0);
    }
}

function renderizarPedidos() {
    const lista = document.getElementById('lista-pedidos');
    if (!lista) return;

    const pedidosFiltrados = filtroEstadoActual === 'todos'
        ? pedidosGlobales
        : pedidosGlobales.filter(p => p.estado === filtroEstadoActual);

    if (pedidosFiltrados.length === 0) {
        lista.innerHTML = `<p class="text-center text-gray-400 py-10 text-sm">No hay pedidos en esta categoría.</p>`;
        return;
    }

    lista.innerHTML = pedidosFiltrados.map(pedido => {
        const fecha = new Date(pedido.created_at).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const itemsHtml = (pedido.items || []).map(item => {
            const cantidad = item.cantidad || 1;
            return `<li class="flex justify-between text-sm text-gray-600 py-1">
                        <span>${item.nombre} <span class="text-gray-400">x${cantidad}</span></span>
                        <span class="font-medium">$${(item.precio * cantidad).toFixed(2)}</span>
                    </li>`;
        }).join('');

        const estiloBadge = ESTILOS_ESTADO[pedido.estado] || ESTILOS_ESTADO.pendiente;

        return `
        <div class="bg-white p-6 rounded-2xl border border-[#EFEFD7]/50 shadow-[0_4px_20px_rgba(27,29,14,0.02)]">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <p class="font-bold text-[#1B1D0E]">Pedido #${pedido.id}</p>
                    <p class="text-xs text-gray-400">${fecha}</p>
                </div>
                <span class="text-xs font-bold px-3 py-1 rounded-full border ${estiloBadge} capitalize">${pedido.estado}</span>
            </div>

            <ul class="border-t border-b border-gray-100 py-2 mb-4 divide-y divide-gray-50">
                ${itemsHtml}
            </ul>

            <div class="flex justify-between items-center">
                <p class="font-bold text-lg text-[#1B1D0E]">Total: $${Number(pedido.total).toFixed(2)} MXN</p>
                <select onchange="actualizarEstadoPedido(${pedido.id}, this.value)" class="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-[#FAF9F5] focus:outline-none focus:border-[#7C5544] cursor-pointer">
                    <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmado" ${pedido.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>`;
    }).join('');
}

window.filtrarPedidos = function(estado) {
    filtroEstadoActual = estado;
    document.querySelectorAll('.filtro-pedido').forEach(btn => {
        const activo = btn.dataset.estado === estado;
        btn.classList.toggle('bg-[#1B1D0E]', activo);
        btn.classList.toggle('text-white', activo);
        btn.classList.toggle('bg-white', !activo);
        btn.classList.toggle('border', !activo);
        btn.classList.toggle('border-gray-200', !activo);
        btn.classList.toggle('text-gray-500', !activo);
    });
    renderizarPedidos();
}

window.actualizarEstadoPedido = async function(id, nuevoEstado) {
    const { error } = await clienteSupabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

    if (error) {
        alert("No se pudo actualizar el estado. Revisa la consola.");
        console.error(error);
        return;
    }
    cargarPedidos();
}

// --- CAMBIO ENTRE PESTAÑAS ---
window.cambiarVista = function(vista) {
    const vistaInventario = document.getElementById('vista-inventario');
    const vistaPedidos = document.getElementById('vista-pedidos');
    const tabInventario = document.getElementById('tab-inventario');
    const tabPedidos = document.getElementById('tab-pedidos');

    if (vista === 'pedidos') {
        vistaInventario.classList.add('hidden');
        vistaPedidos.classList.remove('hidden');
        tabPedidos.classList.add('border-[#7C5544]', 'text-[#7C5544]');
        tabPedidos.classList.remove('border-transparent', 'text-gray-400');
        tabInventario.classList.remove('border-[#7C5544]', 'text-[#7C5544]');
        tabInventario.classList.add('border-transparent', 'text-gray-400');
    } else {
        vistaPedidos.classList.add('hidden');
        vistaInventario.classList.remove('hidden');
        tabInventario.classList.add('border-[#7C5544]', 'text-[#7C5544]');
        tabInventario.classList.remove('border-transparent', 'text-gray-400');
        tabPedidos.classList.remove('border-[#7C5544]', 'text-[#7C5544]');
        tabPedidos.classList.add('border-transparent', 'text-gray-400');
    }
}


// Inicializar la carga al abrir el panel
cargarCategorias();
cargarInventario();
cargarPedidos();
