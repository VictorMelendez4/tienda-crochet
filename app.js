// 1. Configuración de conexión (Tus llaves van aquí)
const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'sb_publishable_zQY58_EqT5AR_LFHT7_l7w_HYyuTV-z';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

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
    contenedor.innerHTML = ''; // Limpiamos el texto viejo

    productos.forEach(producto => {
        if (producto.disponible) {
            const tarjetaHTML = `
                <div class="tarjeta">
                    <img src="${producto.imagen_url}" alt="${producto.nombre}">
                    <h3 style="color: #4a4a4a; margin: 10px 0;">${producto.nombre}</h3>
                    <p style="color: #7a7a7a; font-size: 14px;">${producto.descripcion}</p>
                    <p style="color: #2c3e50; font-weight: bold; font-size: 18px;">$${producto.precio} MXN</p>
                    <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio})">
                        Agregar al Carrito
                    </button>
                </div>
            `;
            contenedor.innerHTML += tarjetaHTML;
        }
    });
}

obtenerProductos();

// --- LÓGICA DEL CARRITO DE COMPRAS ---

// 1. Iniciamos el carrito leyendo la memoria del navegador (por si el cliente recarga la página)
let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];

// 2. Función para guardar un producto cuando dan clic
function agregarAlCarrito(id, nombre, precio) {
    // Añadimos el producto a nuestra lista
    carrito.push({ id, nombre, precio });
    
    // Lo guardamos en el Local Storage
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    
    // Le avisamos al usuario
    alert(`¡Agregaste: ${nombre} al carrito!`);
}

// 3. Función para cerrar la venta y abrir WhatsApp
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. ¡Agrega algunos tejidos primero!");
        return;
    }

    let textoPedido = "Hola, me interesa hacer el siguiente pedido:\n\n";
    let total = 0;

    // Recorremos el carrito para armar el ticket
    carrito.forEach(item => {
        textoPedido += `- ${item.nombre} ($${item.precio})\n`;
        total += item.precio;
    });

    textoPedido += `\nTotal: $${total} MXN\n\n¿Me pasas tu número de cuenta para depositar?`;

    // Cambia este número por el WhatsApp real de la emprendedora (sin el símbolo +)
    const numeroWhatsApp = "528710000000"; 
    
    // Creamos el enlace y lo abrimos en una pestaña nueva
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(textoPedido)}`;
    window.open(url, '_blank');
    
    // Opcional: Vaciar el carrito después de enviar el pedido
    // carrito = [];
    // localStorage.removeItem('carrito-crochet');
}
