import { clienteSupabase } from './supabase.js';

// 2. Lógica del formulario de login
document.getElementById('login-form').addEventListener('submit', async function(evento) {
    evento.preventDefault(); // Evita que la página recargue

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensaje = document.getElementById('mensaje-login');

    mensaje.innerText = "Verificando...";
    mensaje.style.color = "#7c5544";

    // Intentamos iniciar sesión con Supabase
    const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    // Manejo del resultado
    if (error) {
        mensaje.style.color = "#ba1a1a"; // Rojo error
        mensaje.innerText = "Credenciales incorrectas. Intenta de nuevo.";
        console.error("Error de login:", error.message);
    } else {
        mensaje.style.color = "#366758"; // Verde éxito
        mensaje.innerText = "¡Acceso concedido!";
        // Redirigimos al dashboard si todo sale bien
        window.location.href = 'admin-dashboard.html';
    }
});