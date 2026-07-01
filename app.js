// 1. Configuración de conexión (Tus llaves van aquí)
const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ3anljZ2pvbXllamJveXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ3MTIsImV4cCI6MjA5NzkxMDcxMn0.VKIL7Z_4qVw-8XI3Df6xRxK-AcssfifQ1gnoHHcVEWI';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DEL CARRITO ---
let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];

function agregarAlCarrito(id, nombre, precio) {
    carrito.push({ id, nombre, precio });
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    alert(`¡Agregaste: ${nombre} al carrito!`);
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. ¡Agrega algunos tejidos primero!");
        return;
    }

    // Usamos %0A en lugar de \n para que WhatsApp respete los saltos de línea
    let textoPedido = "Hola, me interesa hacer el siguiente pedido:%0A%0A";
    let total = 0;

    carrito.forEach(item => {
        textoPedido += `- ${item.nombre} ($${item.precio})%0A`;
        total += item.precio;
    });

    textoPedido += `%0ATotal: $${total} MXN%0A%0A¿Me pasas tu número de cuenta para depositar?`;

    const numeroWhatsApp = "528710000000"; // Pon el número real aquí
    const url = `https://wa.me/${numeroWhatsApp}?text=${textoPedido}`;
    window.open(url, '_blank');
}

// --- LÓGICA DE RENDERIZADO CON DISEÑO YARNLY ---
async function obtenerProductos() {
    let { data: productos, error } = await clienteSupabase
        .from('productos')
        .select('*');

    if (error) {
        console.error("Hubo un error conectando:", error);
        document.getElementById('contenedor-productos').innerText = "Error al cargar el catálogo.";
        return;
    }

    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = ''; 

    productos.forEach(producto => {
        if (producto.disponible) {
            // ENVOLVEMOS TODA LA TARJETA EN UN ENLACE HACIA EL DETALLE
            const tarjetaHTML = `
            <a href="detalle.html?id=${producto.id}" class="block group">
                <div class="bg-surface-container-lowest rounded-2xl overflow-hidden soft-shadow flex flex-col squish-click transition-transform">
                    <div class="relative p-1">
                        <div class="w-full h-48 md:h-56 bg-surface-container rounded-t-xl overflow-hidden">
                            <img alt="${producto.nombre}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="${producto.imagen_url}" />
                        </div>
                        <button class="absolute top-3 right-3 w-8 h-8 bg-surface-container-lowest/80 backdrop-blur text-primary rounded-full flex items-center justify-center hover:bg-primary-container transition-colors">
                            <span class="material-symbols-outlined text-[18px]" data-icon="favorite_border">favorite_border</span>
                        </button>
                    </div>
                    <div class="p-4 flex flex-col flex-grow">
                        <h3 class="font-body-lg text-body-lg font-medium text-on-surface mb-1">${producto.nombre}</h3>
                        <p class="font-label-sm text-label-sm text-on-surface-variant mb-3 flex-grow truncate">${producto.descripcion}</p>
                        <div class="flex justify-between items-center mt-auto">
                            <span class="font-label-lg text-label-lg text-primary">$${producto.precio} MXN</span>
                            <button class="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center hover:bg-primary transition-colors hover:text-on-primary" 
                                    onclick="event.preventDefault(); agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio})">
                                <span class="material-symbols-outlined text-[18px]" data-icon="add">add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </a>
            `;
            contenedor.innerHTML += tarjetaHTML;
        }
    });
}

obtenerProductos();
