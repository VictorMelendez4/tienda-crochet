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