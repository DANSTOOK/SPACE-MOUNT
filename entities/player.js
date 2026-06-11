// Dan Armstrong — astronauta explorador interplanetario (alemán).
// Entidad controlada por el jugador: movimiento, colisión con límites
// del mapa y recepción de daño. No sabe nada de enemigos ni armas;
// eso vive en systems/ (fases 3-4).

import { clamp } from '../utils/helpers.js';

// Stats base exactos de la spec. speed está en "px por frame @60fps"
// (la unidad clásica del género); se convierte a px/segundo abajo.
export const BASE_STATS = {
  hp: 100,         // también es la vida MÁXIMA (this.hp es la vida actual)
  speed: 2,
  damage: 10,      // reservado (las armas llevan su propio daño)
  attackSpeed: 1,  // multiplicador de cadencia
  range: 100,
  regen: 0,        // vida regenerada por segundo (power-up)
  magnet: 60,      // radio de recogida de orbes de XP en px (power-up)
  xpMult: 1,       // multiplicador de XP ganada (power-up)
  multishot: 0,    // proyectiles extra por disparo (power-up)
  crit: 0,         // probabilidad de golpe crítico 0..1 (power-up)
  critMult: 2,     // multiplicador de daño en crítico
  shieldMax: 0,    // cargas de escudo máximas (power-up)
};

const SPEED_SCALE = 60; // speed de la spec -> px/segundo (para usar dt)
const INVULN_TIME = 0.5; // i-frames tras recibir daño (estándar del género)
const SHIELD_REGEN = 6;  // segundos para recuperar 1 carga de escudo

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
    // Escudo: cargas actuales que absorben golpes (power-up). Se
    // regeneran con el tiempo hasta stats.shieldMax.
    this.shield = 0;
    this.shieldTimer = SHIELD_REGEN;
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

    // Regeneración pasiva (power-up): cura sin pasar de la vida máxima.
    if (this.stats.regen > 0 && this.hp < this.stats.hp) {
      this.hp = Math.min(this.stats.hp, this.hp + this.stats.regen * dt);
    }

    // Recarga de escudo (power-up): +1 carga cada SHIELD_REGEN s.
    if (this.stats.shieldMax > 0 && this.shield < this.stats.shieldMax) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shield++;
        this.shieldTimer = SHIELD_REGEN;
      }
    }
  }

  // Devuelve true si hubo impacto (para el screen shake). Si hay escudo,
  // consume una carga y NO pierde vida. Devuelve false si estaba en
  // i-frames o ya muerto.
  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.isDead) return false;
    this.invulnTimer = INVULN_TIME;

    if (this.shield > 0) {
      this.shield--;                 // el escudo absorbe el golpe
      this.shieldTimer = SHIELD_REGEN; // y reinicia su recarga
      return true;
    }

    this.hp = Math.max(0, this.hp - amount);
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

    // Aura de escudo: marco cian alrededor del player por cada carga
    // (capas concéntricas = cuántas cargas tiene).
    for (let i = 0; i < this.shield; i++) {
      const pad = 4 + i * 3;
      const x = this.x - pad;
      const y = this.y - pad;
      const w = this.w + pad * 2;
      const h = this.h + pad * 2;
      r.rect(x, y, w, 2, '#7df9ff');
      r.rect(x, y + h - 2, w, 2, '#7df9ff');
      r.rect(x, y, 2, h, '#7df9ff');
      r.rect(x + w - 2, y, 2, h, '#7df9ff');
    }
  }
}
