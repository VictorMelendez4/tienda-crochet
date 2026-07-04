import { clienteSupabase } from './supabase.js';

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
    contenedor.innerHTML = ''; // Limpiamos el "Cargando..."

    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="col-span-full text-center py-10 font-body-lg text-on-surface-variant">Próximamente nuevos diseños disponibles.</p>';
        return;
    }

    productos.forEach(prod => {
        contenedor.innerHTML += `
        <article class="bg-surface-container-lowest rounded-2xl overflow-hidden soft-shadow group flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <a href="detalle.html?id=${prod.id}" class="block">
                <div class="relative h-56 overflow-hidden bg-white">
                    <img src="${prod.imagen_url}" alt="${prod.nombre}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                    <span class="absolute top-3 left-3 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                        ${prod.categoria || 'Nuevo'}
                    </span>
                </div>
            </a>
            
            <div class="p-5 flex flex-col flex-grow">
                <a href="detalle.html?id=${prod.id}" class="block">
                    <h3 class="font-headline-md text-lg text-on-surface font-bold leading-tight mb-1 truncate hover:text-primary transition-colors" title="${prod.nombre}">${prod.nombre}</h3>
                </a>
                
                <div class="mt-auto pt-3">
                    <p class="font-body-lg text-primary font-bold text-xl mb-4">$${prod.precio.toFixed(2)} <span class="text-xs text-on-surface-variant font-normal">MXN</span></p>
                    
                    <button onclick="agregarAlCarrito(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', ${prod.precio})" class="w-full bg-primary text-on-primary font-label-lg text-sm px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 squish-click shadow-sm">
                        <span class="material-symbols-outlined text-base">shopping_bag</span>
                        Add to Cart
                    </button>
                </div>
            </div>
        </article>`;
    });
}

// 4. Lógica del carrito: guardar en localStorage
window.agregarAlCarrito = function(id, nombre, precio) {
    let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];

    // Si el producto ya está en el carrito, solo le sumamos cantidad
    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad = (existente.cantidad || 1) + 1;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }

    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    actualizarContadorCarrito();
    alert(`¡${nombre} añadido al carrito!`);
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