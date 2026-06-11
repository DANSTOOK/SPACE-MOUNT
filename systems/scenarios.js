// ScenarioSystem: biomas + sus efectos especiales jugables. Define el
// MUNDO (mucho mayor que la pantalla: la cámara sigue al player) y su
// estrellado, bordes, rocas y muros. Cada bioma tiene un specialEffect:
// tormentas, baja gravedad, rocas a la deriva o arena cerrada.

import { VIEW_W, VIEW_H } from '../engine/renderer.js?v=2';
import { aabb } from '../utils/helpers.js';

// Tamaño del mundo grande (varios pantallazos). La estación es cerrada
// y más pequeña.
const BIG_W = 2600;
const BIG_H = 1800;

export const BIOMES = {
  mars: {
    name: 'Marte',
    enemyMultiplier: 1.0,  // bajado de 1.2 (balance: curva de dificultad suave)
    specialEffect: 'dust_storm',
    sky: '#0a0a12',
    edge: '#ff4f30',
    world: { w: BIG_W, h: BIG_H },
    playerSpeedMult: 1,
    lines: ['Spawn moderado y tormentas', 'de polvo que te frenan'],
  },
  luna: {
    name: 'Luna',
    enemyMultiplier: 0.9,
    specialEffect: 'low_gravity',
    sky: '#0b0e14',
    edge: '#aab4c8',
    world: { w: BIG_W, h: BIG_H },
    playerSpeedMult: 1.25,
    lines: ['Baja gravedad: te mueves', '25% mas rapido'],
  },
  asteroids: {
    name: 'Asteroides',
    enemyMultiplier: 1.0,
    specialEffect: 'obstacles',
    sky: '#070a10',
    edge: '#7df9ff',
    world: { w: BIG_W, h: BIG_H },
    playerSpeedMult: 1,
    lines: ['Rocas a la deriva bloquean', 'tu paso y tus disparos'],
  },
  station: {
    name: 'Estacion espacial',
    enemyMultiplier: 1.1,
    specialEffect: 'closed_map',
    sky: '#0c1018',
    edge: '#39ff14',
    world: { w: 1400, h: 1000 }, // arena cerrada, más chica
    playerSpeedMult: 1,
    lines: ['Arena cerrada y compacta:', 'sin escapatoria'],
  },
};

export const BIOME_KEYS = Object.keys(BIOMES);

const STORM_CALM = 30;
const STORM_DURATION = 2;
const STORM_SLOW = 0.6;  // ralentiza más (antes 0.8)
const STORM_WARNING = 3;  // segundos antes de que avise de tormenta
const STAR_DENSITY = 1 / 9000; // estrellas por px² de mundo
const ROCK_DENSITY = 1 / 90000; // rocas por px² (bioma asteroides)
const SAFE_RADIUS = 220;        // nada nace sobre el spawn del player (centro)

export class ScenarioSystem {
  constructor(key) {
    this.key = key;
    this.biome = BIOMES[key];
    this.world = { ...this.biome.world };
    // El área jugable es todo el mundo (player y enemigos se mueven por él).
    this.bounds = { x: 0, y: 0, w: this.world.w, h: this.world.h };

    this.storming = false;
    this.stormTimer = STORM_CALM;

    this.stars = this.generateStars();
    this.rocks = [];
    if (this.biome.specialEffect === 'obstacles') this.generateRocks();
  }

  get closed() {
    return this.biome.specialEffect === 'closed_map';
  }

  get playerSpeedMult() {
    return (this.biome.playerSpeedMult || 1) * (this.storming ? STORM_SLOW : 1);
  }

  // Estrellas en coordenadas de MUNDO (parallax-free, simples).
  generateStars() {
    const n = Math.floor(this.world.w * this.world.h * STAR_DENSITY);
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * this.world.w,
        y: Math.random() * this.world.h,
        size: Math.random() < 0.85 ? 1 : 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    return stars;
  }

  generateRocks() {
    const cx = this.world.w / 2;
    const cy = this.world.h / 2;
    const target = Math.floor(this.world.w * this.world.h * ROCK_DENSITY);
    let guard = 0;
    while (this.rocks.length < target && guard++ < target * 8) {
      const s = 30 + Math.random() * 44;
      const rock = {
        x: Math.random() * (this.world.w - s),
        y: Math.random() * (this.world.h - s),
        w: s, h: s,
        vx: (Math.random() * 2 - 1) * 18,
        vy: (Math.random() * 2 - 1) * 18,
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
        this.stormTimer = this.storming ? STORM_DURATION : (STORM_CALM + STORM_WARNING);
        this.stormWarning = !this.storming ? STORM_WARNING : 0; // activa advertencia cuando entra en calma
      } else if (!this.storming && this.stormTimer <= STORM_WARNING) {
        // En el período de calma, mostrar advertencia
        this.stormWarning = this.stormTimer;
      }
    }

    // Rocas a la deriva: rebotan en los bordes del mundo.
    for (const r of this.rocks) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (r.x < 0 || r.x > this.world.w - r.w) r.vx *= -1;
      if (r.y < 0 || r.y > this.world.h - r.h) r.vy *= -1;
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

  // Dibuja el mundo BAJO la transformación de cámara (coords de mundo).
  // view = rect visible {x,y,w,h} para culling.
  renderWorld(r, elapsed, view) {
    const b = this.biome;
    const vx0 = view.x - 4, vy0 = view.y - 4;
    const vx1 = view.x + view.w + 4, vy1 = view.y + view.h + 4;

    // Estrellas (solo las visibles)
    if (!this.storming) {
      for (const s of this.stars) {
        if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * s.speed + s.phase));
        r.rect(s.x, s.y, s.size, s.size, `rgba(255,255,255,${a.toFixed(2)})`);
      }
    }

    // Rocas visibles
    for (const rock of this.rocks) {
      if (rock.x + rock.w < vx0 || rock.x > vx1 || rock.y + rock.h < vy0 || rock.y > vy1) continue;
      r.rect(rock.x, rock.y, rock.w, rock.h, '#2a3142');
      r.rect(rock.x, rock.y, rock.w, 2, '#454f68');
    }

    // Borde del mundo (neón): el jugador ve los límites del escenario.
    const t = 4;
    r.rect(0, 0, this.world.w, t, b.edge);
    r.rect(0, this.world.h - t, this.world.w, t, b.edge);
    r.rect(0, 0, t, this.world.h, b.edge);
    r.rect(this.world.w - t, 0, t, this.world.h, b.edge);
  }

  renderForeground(r) {
    if (this.storming) {
      r.rect(0, 0, VIEW_W, VIEW_H, 'rgba(255, 99, 48, 0.08)');
    }

    // Alerta de tormenta incoming
    if (this.stormWarning && this.stormWarning > 0) {
      const alpha = (this.stormWarning / STORM_WARNING) * 0.7; // parpadea
      const blinkAlpha = Math.sin(this.stormWarning * 4) > 0 ? 0.9 : 0.4;
      r.text('⚠ TORMENTA INCOMING', VIEW_W / 2 - 130, VIEW_H / 2 - 100,
             `rgba(255, 150, 0, ${blinkAlpha})`, 20);
      const timeLeft = Math.ceil(this.stormWarning);
      r.text(timeLeft + 's', VIEW_W / 2 - 15, VIEW_H / 2 - 60,
             `rgba(255, 200, 0, ${blinkAlpha})`, 24);
    }
  }
}
