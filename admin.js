// 1. Configuración de conexión (Usa tus mismas llaves del frontend)
const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ3anljZ2pvbXllamJveXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ3MTIsImV4cCI6MjA5NzkxMDcxMn0.VKIL7Z_4qVw-8XI3Df6xRxK-AcssfifQ1gnoHHcVEWI';
const clienteSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Escuchamos cuando la clienta le da clic a "Guardar Producto"
document.getElementById('form-producto').addEventListener('submit', async function(evento) {
    // Evitamos que la página recargue bruscamente
    evento.preventDefault();

    // Capturamos los datos del formulario
    const nombre = document.getElementById('nombre').value;
    const descripcion = document.getElementById('descripcion').value;
    const precio = document.getElementById('precio').value;
    const imagen_url = document.getElementById('imagen_url').value;
    const mensajeAdmin = document.getElementById('mensaje-admin');

    mensajeAdmin.style.color = '#333';
    mensajeAdmin.innerText = "Guardando producto...";

    // 3. Hacemos el INSERT en la tabla productos de Supabase
    // (Por ahora le asignamos categoria_id: 1 por defecto)
    const { data, error } = await clienteSupabase
        .from('productos')
        .insert([
            { 
                nombre: nombre, 
                descripcion: descripcion, 
                precio: parseFloat(precio), 
                imagen_url: imagen_url, 
                categoria_id: 1, 
                disponible: true 
            }
        ]);

    // 4. Manejo de éxito o error
    if (error) {
        console.error("Error de Supabase:", error);
        mensajeAdmin.style.color = 'red';
        mensajeAdmin.innerText = "Hubo un error al guardar. Revisa la consola (F12).";
    } else {
        mensajeAdmin.style.color = 'green';
        mensajeAdmin.innerText = "¡Tejido guardado exitosamente en el catálogo!";
        document.getElementById('form-producto').reset(); // Limpiamos las cajas de texto
    }
});

// --- LÓGICA DEL INVENTARIO ADMIN ---

async function cargarInventario() {
    const { data: productos, error } = await clienteSupabase
        .from('productos')
        .select('*')
        .order('id', { ascending: false }); // Los más nuevos arriba

    const lista = document.getElementById('lista-inventario');
    lista.innerHTML = '';

    if (productos && productos.length > 0) {
        productos.forEach(prod => {
            lista.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee; background:#fafafa; margin-bottom:10px; border-radius:8px;">
                <div>
                    <strong style="color:#2c3e50;">${prod.nombre}</strong><br>
                    <span style="color:#7f8c8d; font-size:14px;">$${prod.precio} MXN</span>
                </div>
                <button onclick="borrarProducto(${prod.id})" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">
                    Eliminar
                </button>
            </div>`;
        });
    } else {
        lista.innerHTML = "<p style='color:#7f8c8d;'>No hay productos en el catálogo.</p>";
    }
}

// Hacemos la función global para que el botón HTML la pueda encontrar
window.borrarProducto = async function(id) {
    if(confirm("¿Estás segura de que quieres eliminar este tejido del catálogo?")) {
        const { error } = await clienteSupabase
            .from('productos')
            .delete()
            .eq('id', id);
        
        if(!error) {
            cargarInventario(); // Recargamos la lista si se borró con éxito
        } else {
            alert("Hubo un error al intentar borrar el producto.");
        }
    }
}

// Cargamos la lista en cuanto se abre el panel admin
cargarInventario();