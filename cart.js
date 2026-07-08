import { clienteSupabase } from './supabase.js';
import { escapeHTML } from './utils.js';

// 1. Cargamos el carrito desde el almacenamiento del navegador
let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];

function renderizarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const subtotalEl = document.getElementById('subtotal-precio');
    const totalEl = document.getElementById('total-precio');
    const contadorEl = document.getElementById('contador-items');
    
    // Limpiamos el contenedor antes de dibujar
    contenedor.innerHTML = '';
    let subtotal = 0;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p class="text-gray-500 text-center py-10">Tu carrito está vacío. ¡Ve al catálogo y elige tus tejidos favoritos!</p>';
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        contadorEl.innerText = 'Tu carrito está vacío.';
        return;
    }

    contadorEl.innerText = `${carrito.length} ${carrito.length === 1 ? 'item' : 'items'} en tu carrito.`;

    // 2. Dibujamos cada producto en la lista
carrito.forEach((item, index) => {
    // Usamos (item.cantidad || 1) para asegurar que siempre haya un valor
    const cantidad = item.cantidad || 1;
    const precioTotalItem = item.precio * cantidad;
    
    subtotal += precioTotalItem;
    
    contenedor.innerHTML += `
        <div class="bg-white rounded-xl p-4 flex gap-4 shadow-sm items-center border border-gray-100">
            <div class="flex-grow">
                <h3 class="font-bold text-lg">${escapeHTML(item.nombre)}</h3>
                <p class="text-[#7c5544] font-bold">$${item.precio} MXN</p>
            </div>
            
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-2">
                <button onclick="cambiarCantidad(${index}, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full">-</button>
                <span class="font-bold w-6 text-center">${cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full">+</button>
            </div>

            <button onclick="eliminarProducto(${index})" class="text-gray-400 hover:text-red-500 p-2">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    `;

    });

    // 3. Actualizamos los totales
    subtotalEl.innerText = `$${subtotal} MXN`;
    totalEl.innerText = `$${subtotal} MXN`;
}

// 4. Función para eliminar un producto
window.eliminarProducto = function(index) {
    carrito.splice(index, 1);
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    renderizarCarrito();
}

// 5. Función de Checkout: Conexión con WhatsApp
window.enviarPedidoWhatsApp = async function() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    const nombreCliente = document.getElementById('cliente-nombre').value.trim();
    const telefonoCliente = document.getElementById('cliente-telefono').value.trim();
    const errorEl = document.getElementById('error-datos-cliente');

    if (!nombreCliente || !telefonoCliente) {
        errorEl.innerText = "Por favor completa tu nombre y WhatsApp para continuar.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const btnCheckout = document.querySelector('[onclick="enviarPedidoWhatsApp()"]');
    if (btnCheckout) {
        btnCheckout.disabled = true;
        btnCheckout.innerText = "Guardando pedido...";
    }

    let total = 0;
    carrito.forEach(item => {
        const cantidad = item.cantidad || 1;
        total += item.precio * cantidad;
    });

    // 1. Guardamos el pedido en Supabase antes que nada
    // 1. Guardamos el pedido en Supabase antes que nada
    const { data: pedidoGuardado, error } = await clienteSupabase
        .from('pedidos')
        .insert([{
            items: carrito,
            total: total,
            estado: 'pendiente',
            cliente_nombre: nombreCliente,
            cliente_telefono: telefonoCliente
        }])
        .select()
        .single();

    if (error) {
        console.error("Error al guardar el pedido:", error);
        alert("Hubo un problema al registrar tu pedido. Por favor intenta de nuevo o contáctanos directamente.");
        if (btnCheckout) {
            btnCheckout.disabled = false;
            btnCheckout.innerText = "Checkout →";
        }
        return;
    }

    // 2. Armamos el mensaje de WhatsApp, incluyendo el número de pedido
    let textoPedido = `Hola, soy ${nombreCliente}. Quiero confirmar mi pedido #${pedidoGuardado.id}:%0A%0A`;

    carrito.forEach(item => {
        const cantidad = item.cantidad || 1;
        textoPedido += `- ${item.nombre} (x${cantidad}): $${item.precio * cantidad} MXN%0A`;
    });

    textoPedido += `%0ATotal: $${total} MXN%0A%0A¿Me pasas tu número de cuenta para depositar?`;

    // Cambia este número por el de la clienta (formato MX: 521XXXXXXXXXX)
    const numeroWhatsApp = "528710000000";
    const url = `https://wa.me/${numeroWhatsApp}?text=${textoPedido}`;

    // 3. Vaciamos el carrito, ya quedó registrado el pedido
    localStorage.removeItem('carrito-crochet');
    carrito = [];
    renderizarCarrito();

    window.open(url, '_blank');
}

window.cambiarCantidad = function(index, delta) {
    if (!carrito[index].cantidad) carrito[index].cantidad = 1;
    
    carrito[index].cantidad += delta;
    
    if (carrito[index].cantidad <= 0) {
        eliminarProducto(index); // Si llega a 0, lo borramos
    } else {
        localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
        renderizarCarrito();
    }
}

// Inicializar la vista
renderizarCarrito();