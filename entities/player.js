// Dan Armstrong — astronauta explorador interplanetario (alemán).
// Entidad controlada por el jugador: movimiento, colisión con límites
// del mapa y recepción de daño. No sabe nada de enemigos ni armas;
// eso vive en systems/ (fases 3-4).

import { clamp } from '../utils/helpers.js';

// Stats base exactos de la spec. speed está en "px por frame @60fps"
// (la unidad clásica del género); se convierte a px/segundo abajo.
export const BASE_STATS = {
  hp: 100,
  speed: 2,
  damage: 10,
  attackSpeed: 1, // ataques por segundo
  range: 100,
};

const SPEED_SCALE = 60; // speed de la spec -> px/segundo (para usar dt)
const INVULN_TIME = 0.5; // i-frames tras recibir daño (estándar del género)

export class Player {
  constructor(cx, cy) {
    this.w = 24;
    this.h = 24;
    this.x = cx - this.w / 2;
    this.y = cy - this.h / 2;

    // Copia de los stats: los upgrades (Fase 5) modifican esta copia,
    // nunca los BASE_STATS compartidos.
    this.stats = { ...BASE_STATS };
    this.hp = this.stats.hp;

    this.invulnTimer = 0;
    // Multiplicador ambiental (bioma): baja gravedad, tormentas...
    // Lo fija main.js cada frame desde el ScenarioSystem.
    this.envSpeedMult = 1;
    // Última dirección de movimiento: el auto-ataque (Fase 4) la usará
    // como dirección de apuntado por defecto.
    this.facingX = 1;
    this.facingY = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get isDead() { return this.hp <= 0; }

  update(dt, input, bounds) {
    let dx = input.axisX;
    let dy = input.axisY;

    if (dx !== 0 || dy !== 0) {
      // Normalizar la diagonal: sin esto, moverse en diagonal sería
      // ~41% más rápido que en línea recta.
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.facingX = dx;
      this.facingY = dy;

      const v = this.stats.speed * SPEED_SCALE * this.envSpeedMult;
      this.x += dx * v * dt;
      this.y += dy * v * dt;
    }

    // Colisión con los límites del mapa (rectángulo {x,y,w,h}): clamp.
    this.x = clamp(this.x, bounds.x, bounds.x + bounds.w - this.w);
    this.y = clamp(this.y, bounds.y, bounds.y + bounds.h - this.h);

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
  }

  // Devuelve true solo si el daño se aplicó (no en i-frames): main lo
  // usa para disparar el screen shake únicamente en golpes reales.
  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.isDead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = INVULN_TIME;
    return true;
  }

  render(r) {
    // Parpadeo durante i-frames: feedback visual de invulnerabilidad
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
      return;
    }

    // Placeholder pixel-art: traje verde neón + visor cian
    r.rect(this.x, this.y, this.w, this.h, '#39ff14');
    r.rect(this.x + 5, this.y + 5, this.w - 10, 8, '#7df9ff');

    // Indicador de dirección (futuro apuntado del auto-ataque)
    r.rect(
      this.cx - 2 + this.facingX * 18,
      this.cy - 2 + this.facingY * 18,
      4, 4, '#ff4f30'
    );
  }
}
