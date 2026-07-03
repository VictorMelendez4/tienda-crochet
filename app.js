// 1. Conexión a Supabase (Usamos la misma de tu admin)
const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ3anljZ2pvbXllamJveXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ3MTIsImV4cCI6MjA5NzkxMDcxMn0.VKIL7Z_4qVw-8XI3Df6xRxK-AcssfifQ1gnoHHcVEWI';
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
            <div class="relative h-56 overflow-hidden bg-white">
                <img src="${prod.imagen_url}" alt="${prod.nombre}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                <span class="absolute top-3 left-3 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                    ${prod.categoria || 'Nuevo'}
                </span>
            </div>
            
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-headline-md text-lg text-on-surface font-bold leading-tight mb-1 truncate" title="${prod.nombre}">${prod.nombre}</h3>
                
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

// 4. Lógica básica del carrito (para que no de error el botón por ahora)
window.agregarAlCarrito = function(id, nombre, precio) {
    // Aquí después programaremos el guardado en localStorage
    alert(`¡${nombre} añadido al carrito por $${precio}!`);
}

// 5. ¡Arrancamos motores!
cargarCatalogoPublico();