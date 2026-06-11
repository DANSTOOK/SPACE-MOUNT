// Effects: feedback visual transitorio (game feel). Agrupa tres cosas
// cohesionadas porque todas son "juice" de vida corta: partículas,
// números de daño flotantes y screen shake. Nada de esto afecta la
// simulación; si se quita, el juego sigue funcionando igual.

import { removeWhere } from '../utils/helpers.js';

// '#rrggbb' -> 'rgba(r,g,b,a)'. Permite desvanecer partículas/textos
// reutilizando los colores hex del juego.
function fade(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

export class Effects {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shakeT = 0;    // tiempo restante de sacudida
    this.shakeDur = 0;  // duración total (para atenuar al final)
    this.shakeMag = 0;  // amplitud en px
  }

  // Estallido de chispas en (cx,cy): muerte de enemigo, impactos...
  burst(cx, cy, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 130;
      const life = 0.35 + Math.random() * 0.35;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life, max: life,
        size: 2 + Math.random() * 2,
        color,
      });
    }
  }

  // Número de daño que sube y se desvanece.
  popText(cx, cy, str, color = '#ffe44f') {
    this.texts.push({ x: cx, y: cy, str: String(str), color, life: 0.6, max: 0.6 });
  }

  // Sacudida de pantalla; toma el máximo si ya había una activa.
  shake(mag = 6, time = 0.25) {
    if (mag >= this.shakeMag || this.shakeT <= 0) {
      this.shakeMag = mag;
      this.shakeT = time;
      this.shakeDur = time;
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9; // fricción: se frenan al expandirse
      p.vy *= 0.9;
      p.life -= dt;
    }
    for (const t of this.texts) {
      t.y -= 34 * dt; // flotan hacia arriba
      t.life -= dt;
    }
    removeWhere(this.particles, (p) => p.life <= 0);
    removeWhere(this.texts, (t) => t.life <= 0);

    if (this.shakeT > 0) this.shakeT -= dt;
  }

  // Desplazamiento de cámara para el frame actual (0 si no hay shake).
  // Atenúa hacia el final para que la sacudida "se asiente".
  get offsetX() {
    if (this.shakeT <= 0) return 0;
    const k = this.shakeT / (this.shakeDur || 1);
    return (Math.random() * 2 - 1) * this.shakeMag * k;
  }

  get offsetY() {
    if (this.shakeT <= 0) return 0;
    const k = this.shakeT / (this.shakeDur || 1);
    return (Math.random() * 2 - 1) * this.shakeMag * k;
  }

  render(r) {
    for (const p of this.particles) {
      r.rect(p.x, p.y, p.size, p.size, fade(p.color, Math.max(0, p.life / p.max)));
    }
    for (const t of this.texts) {
      r.text(t.str, t.x, t.y, fade(t.color, Math.max(0, t.life / t.max)), 12);
    }
  }
}
