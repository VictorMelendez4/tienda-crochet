// 1. Configuración 
const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ3anljZ2pvbXllamJveXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ3MTIsImV4cCI6MjA5NzkxMDcxMn0.VKIL7Z_4qVw-8XI3Df6xRxK-AcssfifQ1gnoHHcVEWI';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Obtener el ID de la URL
const urlParams = new URLSearchParams(window.location.search);
const productoId = urlParams.get('id');

// Lógica del carrito
let carrito = JSON.parse(localStorage.getItem('carrito-crochet')) || [];

function agregarAlCarrito(id, nombre, precio) {
    carrito.push({ id, nombre, precio });
    localStorage.setItem('carrito-crochet', JSON.stringify(carrito));
    alert(`¡Agregaste: ${nombre} al carrito!`);
}

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
        return;
    }

    // 3. Rellenamos el diseño una sola vez
    const breadcrumb = document.getElementById('nombre-producto-breadcrumb');
    if (breadcrumb) breadcrumb.innerText = producto.nombre;

    const titulo = document.getElementById('titulo-producto');
    if (titulo) titulo.innerText = producto.nombre;

    const precio = document.getElementById('precio-producto');
    if (precio) precio.innerText = `$${producto.precio} MXN`;

    const desc = document.getElementById('desc-producto');
    if (desc) desc.innerText = producto.descripcion;

    const img = document.getElementById('img-principal');
    if (img) img.src = producto.imagen_url;

    // Conectamos el botón de compra de forma segura
    const btn = document.getElementById('btn-add-cart');
    if (btn) {
        btn.onclick = () => agregarAlCarrito(producto.id, producto.nombre, producto.precio);
    }
}

// Ejecutar
cargarDetalleProducto();