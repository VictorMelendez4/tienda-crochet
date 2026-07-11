import { clienteSupabase } from './supabase.js';
import { escapeHTML } from './utils.js';

let productosCache = [];

// 2. Traer el catálogo de Supabase
async function cargarCatalogoPublico() {
    const contenedor = document.getElementById('contenedor-productos');

    try {
        // Pedimos los productos ordenados por los más nuevos y que tengan stock
        const { data: productos, error } = await clienteSupabase
            .from('productos')
            .select('*')
            .gt('stock', 0) 
            .order('id', { ascending: false });

        if (error) throw error;
        productosCache = productos;
        poblarFiltroCategorias(productos);
        renderizarProductos(productos);
    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenedor.innerHTML = `
            <div class="col-span-full text-center py-12 bg-error-container rounded-2xl">
                <span class="material-symbols-outlined text-error text-4xl mb-2">error</span>
                <p class="text-error font-body-lg">Lo sentimos, no pudimos cargar el catálogo en este momento.</p>
            </div>`;
    }
}

// 3. Dibujar las tarjetas usando TUS colores de Tailwind
function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="col-span-full text-center py-10 font-body-lg text-on-surface-variant">Próximamente nuevos diseños disponibles.</p>';
        return;
    }

    productos.forEach(prod => {
        contenedor.innerHTML += `
        <article class="bg-surface-container-lowest rounded-2xl overflow-hidden soft-shadow group flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <a href="detalle.html?id=${prod.id}" class="block">
                <div class="relative h-56 overflow-hidden bg-white">
                    <img src="${escapeHTML(prod.imagen_url)}" alt="${escapeHTML(prod.nombre)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                    <span class="absolute top-3 left-3 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                        ${escapeHTML(prod.categoria) || 'Nuevo'}
                    </span>
                </div>
            </a>
            
            <div class="p-5 flex flex-col flex-grow">
                <a href="detalle.html?id=${prod.id}" class="block">
                    <h3 class="font-headline-md text-lg text-on-surface font-bold leading-tight mb-1 truncate hover:text-primary transition-colors" title="${escapeHTML(prod.nombre)}">${escapeHTML(prod.nombre)}</h3>
                </a>
                
                <div class="mt-auto pt-3">
                    <p class="font-body-lg text-primary font-bold text-xl mb-4">$${prod.precio.toFixed(2)} <span class="text-xs text-on-surface-variant font-normal">MXN</span></p>
                    
                    <button onclick="agregarAlCarrito(${prod.id})" class="w-full bg-primary text-on-primary font-label-lg text-sm px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 squish-click shadow-sm">
                        <span class="material-symbols-outlined text-base">shopping_bag</span>
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </article>`;
    });
}

// 4. Lógica del carrito: guardar en localStorage
window.agregarAlCarrito = function(id) {
    const producto = productosCache.find(p => p.id === id);
    if (!producto) return;

    let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad = (existente.cantidad || 1) + 1;
    } else {
        carrito.push({ id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
    }

    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    actualizarContadorCarrito();
    abrirCarritoDrawer();
}

// 5. Actualiza el numerito del carrito en el header
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];
    const totalItems = carrito.reduce((total, item) => total + (item.cantidad || 1), 0);
    const contador = document.getElementById('contador-carrito');

    if (contador) {
        contador.innerText = totalItems;
        contador.classList.toggle('hidden', totalItems === 0);
    }
}

// Llamamos al contador en cuanto carga la página
actualizarContadorCarrito();

// 5. ¡Arrancamos motores!
cargarCatalogoPublico();

// --- BÚSQUEDA Y FILTROS ---
function poblarFiltroCategorias(productos) {
    const select = document.getElementById('filtro-categoria');
    if (!select) return;

    const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    select.innerHTML = '<option value="">Todas las categorías</option>' +
        categoriasUnicas.map(cat => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join('');
}

window.aplicarFiltros = function() {
    const textoBusqueda = document.getElementById('buscador-catalogo').value.trim().toLowerCase();
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const orden = document.getElementById('filtro-orden').value;

    let resultado = productosCache.filter(prod => {
        const coincideTexto = !textoBusqueda || prod.nombre.toLowerCase().includes(textoBusqueda);
        const coincideCategoria = !categoriaSeleccionada || prod.categoria === categoriaSeleccionada;
        return coincideTexto && coincideCategoria;
    });

    if (orden === 'precio-asc') {
        resultado.sort((a, b) => a.precio - b.precio);
    } else if (orden === 'precio-desc') {
        resultado.sort((a, b) => b.precio - a.precio);
    } else {
        resultado.sort((a, b) => b.id - a.id);
    }

    renderizarProductos(resultado);

    if (resultado.length === 0) {
        document.getElementById('contenedor-productos').innerHTML = `
            <div class="col-span-full text-center py-12">
                <span class="material-symbols-outlined text-on-surface-variant text-4xl mb-2">search_off</span>
                <p class="text-on-surface-variant">No encontramos tejidos con esos filtros. Intenta con otra búsqueda.</p>
            </div>`;
    }
}
// --- CARRITO LATERAL (DRAWER) ---
window.abrirCarritoDrawer = function() {
    renderizarDrawerCarrito();
    document.getElementById('overlay-carrito').classList.remove('hidden');
    document.getElementById('drawer-carrito').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    const btnFlotante = document.getElementById('btn-whatsapp');
    if (btnFlotante) btnFlotante.classList.add('hidden');
}

window.cerrarCarritoDrawer = function() {
    document.getElementById('drawer-carrito').classList.add('translate-x-full');
    document.getElementById('overlay-carrito').classList.add('hidden');
    document.body.style.overflow = '';
    const btnFlotante = document.getElementById('btn-whatsapp');
    if (btnFlotante) btnFlotante.classList.remove('hidden');
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