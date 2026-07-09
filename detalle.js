import { clienteSupabase } from './supabase.js';
import { escapeHTML } from './utils.js';


// 2. Obtener el ID de la URL
const urlParams = new URLSearchParams(window.location.search);
const productoId = urlParams.get('id');

let cantidadSeleccionada = 1;
let stockDisponible = 0;

// --- CARRITO ---
function agregarAlCarrito(id, nombre, precio, cantidad = 1) {
    let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad = (existente.cantidad || 1) + cantidad;
    } else {
        carrito.push({ id, nombre, precio, cantidad });
    }
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    actualizarContadorCarrito();
    abrirCarritoDrawer();
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    const totalItems = carrito.reduce((total, item) => total + (item.cantidad || 1), 0);
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        contador.innerText = totalItems;
        contador.classList.toggle('hidden', totalItems === 0);
    }
}

// --- SELECTOR DE CANTIDAD ---
window.cambiarCantidadDetalle = function(delta) {
    const nueva = cantidadSeleccionada + delta;
    const tope = stockDisponible > 0 ? stockDisponible : 10;
    if (nueva < 1 || nueva > tope) return;
    cantidadSeleccionada = nueva;
    document.getElementById('cantidad-detalle').innerText = cantidadSeleccionada;
}

// --- CARGA DEL PRODUCTO ---
async function cargarDetalleProducto() {
    if (!productoId) {
        console.error("No hay ID en la URL");
        return;
    }

    let { data: producto, error } = await clienteSupabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .single();

    if (error || !producto) {
        console.error("Error al cargar producto:", error);
        document.getElementById('titulo-producto').innerText = "Producto no encontrado";
        return;
    }

    stockDisponible = producto.stock || 0;
    const categoriaTexto = producto.categoria || 'Tejido';

    const breadcrumbCat = document.getElementById('categoria-breadcrumb');
    if (breadcrumbCat) breadcrumbCat.innerText = categoriaTexto;

    const breadcrumb = document.getElementById('nombre-producto-breadcrumb');
    if (breadcrumb) breadcrumb.innerText = producto.nombre;

    const badge = document.getElementById('categoria-badge');
    if (badge) badge.innerText = categoriaTexto;

    const titulo = document.getElementById('titulo-producto');
    if (titulo) titulo.innerText = producto.nombre;

    const precio = document.getElementById('precio-producto');
    if (precio) precio.innerText = `$${Number(producto.precio).toFixed(2)} MXN`;

    const desc = document.getElementById('desc-producto');
    if (desc) desc.innerText = producto.descripcion;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', `${producto.nombre} — $${producto.precio} MXN. ${producto.descripcion?.slice(0, 100) || ''}`);

    const img = document.getElementById('img-principal');
    if (img) img.src = producto.imagen_url;

    // Badge de stock + estado del botón
    const stockBadge = document.getElementById('stock-badge');
    const btn = document.getElementById('btn-add-cart');
    if (stockBadge) {
        if (stockDisponible <= 0) {
            stockBadge.innerText = 'Agotado';
            stockBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-error/10 text-error';
            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                btn.querySelector('span').innerText = 'Agotado';
            }
        } else if (stockDisponible <= 3) {
            stockBadge.innerText = `Últimas ${stockDisponible} piezas`;
            stockBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary';
        } else {
            stockBadge.innerText = 'Disponible';
            stockBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary';
        }
    }

    // Galería de miniaturas (si el producto tiene más de una foto)
try {
        const galeria = typeof producto.galeria === 'string' ? JSON.parse(producto.galeria) : producto.galeria;
        const contenedorThumbs = document.getElementById('galeria-thumbs');
        if (Array.isArray(galeria) && galeria.length > 1 && contenedorThumbs) {
            contenedorThumbs.innerHTML = galeria.map(url => `
                <button class="miniatura-galeria w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                    <img src="${escapeHTML(url)}" class="w-full h-full object-cover">
                </button>
            `).join('');

            // En vez de meter la URL en un onclick, la leemos del <img> con un listener normal
            contenedorThumbs.querySelectorAll('.miniatura-galeria').forEach(boton => {
                boton.addEventListener('click', () => {
                    document.getElementById('img-principal').src = boton.querySelector('img').src;
                });
            });
        }
    } catch (e) { /* sin galería, no pasa nada */ }

    if (btn && stockDisponible > 0) {
        btn.onclick = () => agregarAlCarrito(producto.id, producto.nombre, producto.precio, cantidadSeleccionada);
    }
}

// --- LIGHTBOX DE IMAGEN ---
window.abrirLightbox = function() {
    const imgPrincipal = document.getElementById('img-principal');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    lightboxImg.src = imgPrincipal.src;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden'; // evita scroll de fondo mientras está abierto
}

window.cerrarLightbox = function(evento) {
    // Si el clic vino del botón de cerrar (sin evento) o directo en el fondo negro, cerramos.
    // Si el clic fue sobre la imagen misma, no cerramos (para poder hacer zoom con calma).
    if (evento && evento.target.id !== 'lightbox') return;

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
}

// Cerrar con la tecla Escape
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarLightbox();
});

// Ejecutar
cargarDetalleProducto();
actualizarContadorCarrito();
// --- CARRITO LATERAL (DRAWER) ---
window.abrirCarritoDrawer = function() {
    renderizarDrawerCarrito();
    document.getElementById('overlay-carrito').classList.remove('hidden');
    document.getElementById('drawer-carrito').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
}

window.cerrarCarritoDrawer = function() {
    document.getElementById('drawer-carrito').classList.add('translate-x-full');
    document.getElementById('overlay-carrito').classList.add('hidden');
    document.body.style.overflow = '';
}

function renderizarDrawerCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    const lista = document.getElementById('drawer-lista-items');
    const subtotalEl = document.getElementById('drawer-subtotal');

    if (carrito.length === 0) {
        lista.innerHTML = `<p class="text-center text-on-surface-variant text-sm py-10">Tu carrito está vacío.</p>`;
        subtotalEl.innerText = '$0.00 MXN';
        return;
    }

    let subtotal = 0;
    lista.innerHTML = carrito.map((item, index) => {
        const cantidad = item.cantidad || 1;
        subtotal += item.precio * cantidad;
        return `
        <div class="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <div class="flex-grow">
                <p class="font-bold text-sm text-on-surface">${escapeHTML(item.nombre)}</p>
                <p class="text-xs text-on-surface-variant">$${item.precio} MXN</p>
            </div>
            <div class="flex items-center gap-1 bg-surface-container rounded-full px-1">
                <button onclick="cambiarCantidadDrawer(${index}, -1)" class="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high rounded-full text-sm font-bold">-</button>
                <span class="text-sm font-bold w-5 text-center">${cantidad}</span>
                <button onclick="cambiarCantidadDrawer(${index}, 1)" class="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high rounded-full text-sm font-bold">+</button>
            </div>
            <button onclick="eliminarDelDrawer(${index})" class="text-on-surface-variant hover:text-error transition-colors" aria-label="Eliminar">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>`;
    }).join('');

    subtotalEl.innerText = `$${subtotal.toFixed(2)} MXN`;
}

window.cambiarCantidadDrawer = function(index, delta) {
    let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    if (!carrito[index]) return;
    carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    renderizarDrawerCarrito();
    actualizarContadorCarrito();
}

window.eliminarDelDrawer = function(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    renderizarDrawerCarrito();
    actualizarContadorCarrito();
}

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarCarritoDrawer();
});

// --- COMPARTIR PRODUCTO ---
window.compartirProducto = async function() {
    const titulo = document.getElementById('titulo-producto').innerText;
    const url = window.location.href;
    const texto = `¡Mira este tejido! ${titulo}`;

    // En celulares modernos, usa el menú nativo de compartir del sistema
    if (navigator.share) {
        try {
            await navigator.share({ title: titulo, text: texto, url: url });
        } catch (e) {
            // El usuario cerró el menú de compartir sin elegir nada — no es un error real
        }
        return;
    }

    // En desktop (sin soporte nativo), copiamos el link al portapapeles
    try {
        await navigator.clipboard.writeText(url);
        mostrarAvisoCompartir('¡Link copiado! Ya puedes pegarlo donde quieras.');
    } catch (e) {
        mostrarAvisoCompartir(url, true);
    }
}

function mostrarAvisoCompartir(mensaje, esFallback = false) {
    const aviso = document.createElement('div');
    aviso.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1B1D0E] text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl z-[100] max-w-[90vw] text-center';
    aviso.innerText = esFallback ? `Copia este link: ${mensaje}` : mensaje;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3500);
}

// --- RESEÑAS ---
let calificacionSeleccionada = 0;

function generarEstrellas(calificacion, tamano = 'text-base') {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="material-symbols-outlined ${tamano} ${i <= Math.round(calificacion) ? 'text-primary' : 'text-outline-variant'}" style="font-variation-settings: 'FILL' ${i <= Math.round(calificacion) ? 1 : 0};">star</span>`;
    }
    return html;
}

function renderizarSelectorEstrellas() {
    const contenedor = document.getElementById('selector-estrellas');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'selector-estrella';
        boton.innerHTML = `<span class="material-symbols-outlined text-2xl ${i <= calificacionSeleccionada ? 'text-primary' : 'text-outline-variant'}" style="font-variation-settings: 'FILL' ${i <= calificacionSeleccionada ? 1 : 0};">star</span>`;
        boton.addEventListener('click', () => {
            calificacionSeleccionada = i;
            renderizarSelectorEstrellas();
        });
        contenedor.appendChild(boton);
    }
}

window.abrirFormResena = function() {
    const form = document.getElementById('form-resena');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        renderizarSelectorEstrellas();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

async function cargarResenas() {
    const { data: resenas, error } = await clienteSupabase
        .from('resenas')
        .select('*')
        .eq('producto_id', productoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al cargar reseñas:", error);
        return;
    }

    const resumen = document.getElementById('resenas-resumen');
    const lista = document.getElementById('lista-resenas');

    if (!resenas || resenas.length === 0) {
        resumen.innerHTML = '<span>Sé la primera en dejar una reseña</span>';
        lista.innerHTML = '';
        return;
    }

    const promedio = resenas.reduce((suma, r) => suma + r.calificacion, 0) / resenas.length;
    resumen.innerHTML = `${generarEstrellas(promedio)} <span class="ml-1">${promedio.toFixed(1)} · ${resenas.length} ${resenas.length === 1 ? 'reseña' : 'reseñas'}</span>`;

    lista.innerHTML = resenas.map(r => `
        <div class="bg-surface-container-lowest rounded-2xl p-5 soft-shadow">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                    <p class="font-bold text-sm text-on-surface">${escapeHTML(r.nombre_cliente)}</p>
                    ${r.compra_verificada ? `<span class="flex items-center gap-0.5 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full"><span class="material-symbols-outlined text-[12px]">verified</span>Compra verificada</span>` : ''}
                </div>
                <div class="flex">${generarEstrellas(r.calificacion, 'text-sm')}</div>
            </div>
            ${r.comentario ? `<p class="text-sm text-on-surface-variant leading-relaxed">${escapeHTML(r.comentario)}</p>` : ''}
        </div>
    `).join('');
}

window.enviarResena = async function() {
    const nombre = document.getElementById('resena-nombre').value.trim();
    const telefono = document.getElementById('resena-telefono').value.trim();
    const comentario = document.getElementById('resena-comentario').value.trim();
    const mensaje = document.getElementById('mensaje-resena');

    if (!nombre || calificacionSeleccionada === 0) {
        mensaje.innerText = 'Por favor pon tu nombre y selecciona una calificación.';
        mensaje.className = 'text-xs font-medium mt-3 text-error';
        mensaje.classList.remove('hidden');
        return;
    }

    // Si dejó su teléfono, revisamos si compró este producto
    let compraVerificada = false;
    if (telefono) {
        const { data: verificado, error: errorVerificacion } = await clienteSupabase
            .rpc('verificar_compra', { p_telefono: telefono, p_producto_id: Number(productoId) });

        if (errorVerificacion) {
            console.warn("No se pudo verificar la compra:", errorVerificacion);
        } else {
            compraVerificada = verificado === true;
        }
    }

    const { error } = await clienteSupabase
        .from('resenas')
        .insert([{
            producto_id: Number(productoId),
            nombre_cliente: nombre,
            calificacion: calificacionSeleccionada,
            comentario: comentario || null,
            compra_verificada: compraVerificada
        }]);

    if (error) {
        console.error("Error al enviar reseña:", error);
        mensaje.innerText = 'Hubo un problema al enviar tu reseña. Intenta de nuevo.';
        mensaje.className = 'text-xs font-medium mt-3 text-error';
    } else {
        mensaje.innerText = '¡Gracias por tu reseña!';
        mensaje.className = 'text-xs font-medium mt-3 text-secondary';
        document.getElementById('resena-nombre').value = '';
        document.getElementById('resena-telefono').value = '';
        document.getElementById('resena-comentario').value = '';
        calificacionSeleccionada = 0;
        renderizarSelectorEstrellas();
        cargarResenas();
    }
    mensaje.classList.remove('hidden');
}

cargarResenas();