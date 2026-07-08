// utils.js
// Función de sanitización: convierte caracteres especiales de HTML en su
// versión "de texto", para que nunca se interpreten como etiquetas o
// atributos al insertarlos con innerHTML.
export function escapeHTML(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}