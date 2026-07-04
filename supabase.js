// supabase.js
// Configuración central de conexión a Supabase.
// Todas las páginas que necesiten hablar con la base de datos importan este archivo,
// así si algún día rotas la key, solo la cambias aquí.

const supabaseUrl = 'https://caffwjycgjomyejboyup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ3anljZ2pvbXllamJveXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ3MTIsImV4cCI6MjA5NzkxMDcxMn0.VKIL7Z_4qVw-8XI3Df6xRxK-AcssfifQ1gnoHHcVEWI';

export const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);