// XpSystem: orbes de experiencia y niveles. Los enemigos sueltan un
// orbe al morir; el orbe vuela hacia el player cuando se acerca
// (efecto imán) y al recogerlo suma XP. Los level-ups se ENCOLAN en
// pendingLevels: main.js abre una pantalla de mejora por cada uno.

import { aabb, removeWhere } from '../utils/helpers.js';

const ORB_SIZE = 6;
const MAGNET_RADIUS = 60;  // px a los que el orbe empieza a volar hacia ti
const MAGNET_SPEED = 260;  // px/s del vuelo del orbe
const SCATTER = 8;         // dispersión al soltar (kills apilados no se solapan)

// Curva de nivel: 5, 9, 13, 17... Primeros niveles rápidos (el "hook"
// del género), después se estira sola.
const BASE_XP = 5;
const XP_PER_LEVEL = 4;

class XpOrb {
  constructor(cx, cy, value) {
    this.w = ORB_SIZE;
    this.h = ORB_SIZE;
    this.x = cx - ORB_SIZE / 2 + (Math.random() * 2 - 1) * SCATTER;
    this.y = cy - ORB_SIZE / 2 + (Math.random() * 2 - 1) * SCATTER;
    this.value = value;
    this.dead = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

export class XpSystem {
  constructor(player) {
    this.player = player;
    this.orbs = [];
    this.level = 1;
    this.xp = 0;
    this.pendingLevels = 0;
  }

  get xpToNext() {
    return BASE_XP + (this.level - 1) * XP_PER_LEVEL;
  }

  spawnOrb(cx, cy, value) {
    this.orbs.push(new XpOrb(cx, cy, value));
  }

  update(dt) {
    const p = this.player;
    // Radio de imán desde los stats del player (power-up "imán de XP").
    const magnetSq = (p.stats.magnet || MAGNET_RADIUS) ** 2;

    for (const o of this.orbs) {
      const dx = p.cx - o.cx;
      const dy = p.cy - o.cy;
      const dSq = dx * dx + dy * dy;

      if (dSq < magnetSq) {
        const len = Math.sqrt(dSq) || 1;
        o.x += (dx / len) * MAGNET_SPEED * dt;
        o.y += (dy / len) * MAGNET_SPEED * dt;
      }

      if (aabb(o, p)) {
        o.dead = true;
        this.gain(o.value * (p.stats.xpMult || 1)); // power-up "XP +%"
      }
    }

    removeWhere(this.orbs, (o) => o.dead);
  }

  gain(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.pendingLevels++;
    }
  }

  render(r) {
    for (const o of this.orbs) {
      r.rect(o.x, o.y, o.w, o.h, '#ffe44f');
      r.rect(o.x + 2, o.y + 2, 2, 2, '#fff7c2'); // brillo interior
    }
  }
}
