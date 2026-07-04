import { clienteSupabase } from './supabase.js';

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
    alert(`¡Agregaste ${cantidad} x ${nombre} al carrito!`);
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
                <button onclick="document.getElementById('img-principal').src='${url}'" class="w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                    <img src="${url}" class="w-full h-full object-cover">
                </button>
            `).join('');
        }
    } catch (e) { /* sin galería, no pasa nada */ }

    if (btn && stockDisponible > 0) {
        btn.onclick = () => agregarAlCarrito(producto.id, producto.nombre, producto.precio, cantidadSeleccionada);
    }
}

// Ejecutar
cargarDetalleProducto();
actualizarContadorCarrito();