// Utilidades puras compartidas por todo el juego. Sin estado, sin
// dependencias: cualquier módulo puede importarlas sin acoplarse.

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Elimina in-place los elementos que cumplen el predicado. No crea
// arrays nuevos por frame y mantiene válidas las referencias
// compartidas (window.SM, spawner). Devuelve cuántos eliminó.
export function removeWhere(arr, pred) {
  let removed = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) {
      arr.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

// Colisión rectángulo-rectángulo (AABB). Espera objetos con x, y, w, h.
export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
