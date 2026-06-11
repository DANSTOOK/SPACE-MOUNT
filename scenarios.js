// ScenarioSystem: biomas (estructura de la spec) + sus efectos
// especiales jugables. Cada bioma define paleta, multiplicador de
// spawn y un specialEffect que este sistema implementa: tormentas,
// baja gravedad, rocas a la deriva o mapa cerrado.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { aabb } from '../utils/helpers.js';

export const BIOMES = {
  mars: {
    name: 'Marte',
    gravity: 1,
    enemyMultiplier: 1.2,
    specialEffect: 'dust_storm',
    sky: '#0a0a12',
    ground: '#3d1410',
    groundEdge: '#ff4f30',
    playerSpeedMult: 1,
    lines: ['Spawn agresivo y tormentas', 'de polvo que te frenan'],
  },
  luna: {
    name: 'Luna',
    gravity: 0.16,
    enemyMultiplier: 0.9,
    specialEffect: 'low_gravity',
    sky: '#0b0e14',
    ground: '#3a3f4a',
    groundEdge: '#aab4c8',
    playerSpeedMult: 1.25,
    lines: ['Baja gravedad: te mueves', '25% mas rapido'],
  },
  asteroids: {
    name: 'Asteroides',
    gravity: 0.05,
    enemyMultiplier: 1.0,
    specialEffect: 'obstacles',
    sky: '#070a10',
    ground: '#1c2030',
    groundEdge: '#7df9ff',
    playerSpeedMult: 1,
    lines: ['Rocas a la deriva bloquean', 'tu paso y tus disparos'],
  },
  station: {
    name: 'Estacion espacial',
    gravity: 1,
    enemyMultiplier: 1.1,
    specialEffect: 'closed_map',
    sky: '#0c1018',
    ground: '#141a2e',
    groundEdge: '#39ff14',
    playerSpeedMult: 1,
    lines: ['Arena cerrada: los enemigos', 'aparecen dentro, contigo'],
  },
};

export const BIOME_KEYS = Object.keys(BIOMES);

const STORM_CALM = 15;     // s de calma entre tormentas
const STORM_DURATION = 5;  // s que dura la tormenta
const STORM_SLOW = 0.8;    // multiplicador de velocidad del player en tormenta
const ROCK_COUNT = 7;
const SAFE_RADIUS = 180;   // las rocas nunca nacen sobre el spawn del player

export class ScenarioSystem {
  constructor(key) {
    this.key = key;
    this.biome = BIOMES[key];

    // Mapa cerrado: el área jugable es un rectángulo interior con muros
    this.bounds = this.biome.specialEffect === 'closed_map'
      ? { x: 120, y: 60, w: VIEW_W - 240, h: VIEW_H - 120 }
      : { x: 0, y: 0, w: VIEW_W, h: VIEW_H };

    this.storming = false;
    this.stormTimer = STORM_CALM;

    this.rocks = [];
    if (this.biome.specialEffect === 'obstacles') this.generateRocks();
  }

  get closed() {
    return this.biome.specialEffect === 'closed_map';
  }

  get playerSpeedMult() {
    return (this.biome.playerSpeedMult || 1) * (this.storming ? STORM_SLOW : 1);
  }

  generateRocks() {
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    while (this.rocks.length < ROCK_COUNT) {
      const s = 28 + Math.random() * 32;
      const rock = {
        x: Math.random() * (VIEW_W - s),
        y: Math.random() * (VIEW_H - s),
        w: s,
        h: s,
        vx: (Math.random() * 2 - 1) * 22, // deriva lenta en px/s
        vy: (Math.random() * 2 - 1) * 22,
      };
      const dx = rock.x + s / 2 - cx;
      const dy = rock.y + s / 2 - cy;
      if (dx * dx + dy * dy > SAFE_RADIUS ** 2) this.rocks.push(rock);
    }
  }

  update(dt) {
    if (this.biome.specialEffect === 'dust_storm') {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0) {
        this.storming = !this.storming;
        this.stormTimer = this.storming ? STORM_DURATION : STORM_CALM;
      }
    }

    // Rocas a la deriva: cruzan la pantalla y reaparecen del otro lado
    for (const r of this.rocks) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (r.x < -r.w) r.x = VIEW_W;
      if (r.x > VIEW_W) r.x = -r.w;
      if (r.y < -r.h) r.y = VIEW_H;
      if (r.y > VIEW_H) r.y = -r.h;
    }
  }

  // Empuja a la entidad fuera de las rocas por el eje de menor solape
  collide(ent) {
    for (const r of this.rocks) {
      if (!aabb(ent, r)) continue;
      const overlapX = Math.min(ent.x + ent.w, r.x + r.w) - Math.max(ent.x, r.x);
      const overlapY = Math.min(ent.y + ent.h, r.y + r.h) - Math.max(ent.y, r.y);
      if (overlapX < overlapY) {
        ent.x += ent.x + ent.w / 2 < r.x + r.w / 2 ? -overlapX : overlapX;
      } else {
        ent.y += ent.y + ent.h / 2 < r.y + r.h / 2 ? -overlapY : overlapY;
      }
    }
  }

  blocksProjectile(p) {
    for (const r of this.rocks) {
      if (aabb(p, r)) return true;
    }
    return false;
  }

  renderBackground(r, elapsed, stars) {
    const b = this.biome;
    r.clear(b.sky);

    // La tormenta oculta las estrellas
    if (!this.storming) {
      for (const s of stars) {
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * s.speed + s.phase));
        r.rect(s.x, s.y, s.size, s.size, `rgba(255,255,255,${alpha.toFixed(2)})`);
      }
    }

    r.rect(0, VIEW_H - 60, VIEW_W, 60, b.ground);
    r.rect(0, VIEW_H - 60, VIEW_W, 3, b.groundEdge);

    for (const rock of this.rocks) {
      r.rect(rock.x, rock.y, rock.w, rock.h, '#2a3142');
      r.rect(rock.x, rock.y, rock.w, 2, '#454f68'); // brillo superior
    }

    if (this.closed) {
      const { x, y, w, h } = this.bounds;
      // Muros: todo lo que queda fuera del área jugable
      r.rect(0, 0, VIEW_W, y, '#10141f');
      r.rect(0, y + h, VIEW_W, VIEW_H - y - h, '#10141f');
      r.rect(0, y, x, h, '#10141f');
      r.rect(x + w, y, VIEW_W - x - w, h, '#10141f');
      // Borde neón del perímetro
      r.rect(x - 2, y - 2, w + 4, 2, b.groundEdge);
      r.rect(x - 2, y + h, w + 4, 2, b.groundEdge);
      r.rect(x - 2, y, 2, h, b.groundEdge);
      r.rect(x + w, y, 2, h, b.groundEdge);
    }
  }

  renderForeground(r) {
    if (this.storming) {
      r.rect(0, 0, VIEW_W, VIEW_H, 'rgba(255, 99, 48, 0.18)');
    }
  }
}
