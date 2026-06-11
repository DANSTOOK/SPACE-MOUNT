// CombatSystem: dueño del auto-ataque. Maneja tres CLASES de arma:
//  - 'ranged' (por defecto): dispara proyectiles al enemigo más cercano.
//  - 'orbit': cuchillas que giran alrededor del player y cortan al tocar.
//  - 'melee': barrido en arco corto hacia el enemigo más cercano.
// No elimina nada de los arrays: solo marca; main.js limpia.

import { Projectile } from '../entities/projectile.js?v=2';
import { aabb } from '../utils/helpers.js';

export const WEAPONS = {
  raygun: {
    name: 'Raygun',
    damage: 20,
    fireRate: 1, // disparos por segundo
    projectileSpeed: 5,
    pierce: false,
    color: '#7df9ff',
  },
  blaster: {
    name: 'Blaster',
    damage: 12,
    fireRate: 2,
    projectileSpeed: 6,
    pierce: true, // atraviesa enemigos: bueno contra filas
    color: '#ffa12d',
  },
  electric_chain: {
    name: 'Electric Chain',
    damage: 10,
    fireRate: 0.8,
    projectileSpeed: 7,
    pierce: false,
    chain: 3, // rebota hasta 3 veces al enemigo vivo más cercano
    color: '#e8ff4f',
  },
  shotgun: {
    name: 'Escopeta',
    damage: 8,
    fireRate: 1.1,
    projectileSpeed: 6,
    pierce: false,
    count: 4,      // dispara 4 perdigones...
    spread: 0.5,   // ...en abanico (radianes)
    color: '#ff8a3d',
  },
  missile: {
    name: 'Misil',
    damage: 30,
    fireRate: 0.6,
    projectileSpeed: 4,
    pierce: false,
    splash: 70,    // explota en área al impactar
    color: '#ff5a3c',
  },
  orb_blade: {
    name: 'Cuchilla Orbital',
    kind: 'orbit',
    damage: 14,
    count: 2,           // nº de cuchillas (el multishot suma más)
    orbitRadius: 58,    // distancia al player en px
    orbitSpeed: 3.4,    // velocidad de giro (rad/s)
    hitInterval: 0.35,  // s mínimos entre golpes a un mismo enemigo
    color: '#7df9ff',
  },
  saber: {
    name: 'Sable',
    kind: 'melee',
    damage: 26,
    fireRate: 1.6,      // barridos por segundo
    reach: 78,          // alcance del arco en px
    arc: 1.5,           // amplitud del arco en radianes
    color: '#e8ff4f',
  },
};

const CHAIN_RANGE = 240;  // px máximos de un rebote
const CHAIN_DECAY = 0.8;  // el daño decae 20% por rebote
const BLADE_RADIUS = 10;  // radio de golpe de una cuchilla orbital

export class CombatSystem {
  constructor(player) {
    this.player = player;
    // Cada arma equipada lleva su propio estado mutable (cooldown,
    // ángulo de órbita, etc.). Empieza solo con la Raygun.
    this.weapons = [{ ...WEAPONS.raygun, cooldown: 0 }];
    // Transitorios para render: posiciones de cuchillas este frame y
    // barridos de melee que se están desvaneciendo.
    this.blades = [];
    this.swings = [];
  }

  equip(key) {
    this.weapons.push({ ...WEAPONS[key], cooldown: 0 });
  }

  // Claves de WEAPONS aún no equipadas (para el upgrade new_weapon)
  get unequippedKeys() {
    return Object.keys(WEAPONS).filter(
      (k) => !this.weapons.some((w) => w.name === WEAPONS[k].name)
    );
  }

  // Tira un crítico según los stats del player. Devuelve {value, crit}.
  rollCrit(base) {
    const st = this.player.stats;
    if (Math.random() < (st.crit || 0)) {
      return { value: Math.round(base * (st.critMult || 2)), crit: true };
    }
    return { value: base, crit: false };
  }

  update(dt, enemies, projectiles, bounds, effects = null) {
    // Caducar barridos de melee y limpiar cuchillas del frame anterior
    for (const s of this.swings) s.life -= dt;
    this.swings = this.swings.filter((s) => s.life > 0);
    this.blades.length = 0;

    for (const w of this.weapons) {
      const kind = w.kind || 'ranged';
      if (kind === 'orbit') this.updateOrbit(dt, w, enemies, effects);
      else if (kind === 'melee') this.updateMelee(dt, w, enemies, effects);
      else this.updateRanged(dt, w, enemies, projectiles);
    }

    this.updateProjectiles(dt, enemies, projectiles, bounds, effects);
  }

  // --- Armas a distancia -------------------------------------------
  updateRanged(dt, w, enemies, projectiles) {
    w.cooldown -= dt;
    if (w.cooldown > 0) return;

    const target = this.nearestEnemyInRange(enemies);
    if (!target) return; // sin objetivo: queda lista, no gasta el disparo

    this.fire(w, target, projectiles);
    // attackSpeed del player multiplica la cadencia de todas las armas.
    w.cooldown = 1 / (w.fireRate * this.player.stats.attackSpeed);
  }

  // Tira N proyectiles en abanico (count + multishot) con crítico.
  fire(w, target, projectiles) {
    const st = this.player.stats;
    const baseAng = Math.atan2(target.cy - this.player.cy, target.cx - this.player.cx);
    const total = (w.count || 1) + (st.multishot || 0);
    const spread = total > 1 ? (w.spread || 0.28) : 0;

    for (let i = 0; i < total; i++) {
      const t = total > 1 ? i / (total - 1) - 0.5 : 0; // -0.5..0.5
      const ang = baseAng + t * spread;
      const p = new Projectile(
        this.player.cx, this.player.cy,
        Math.cos(ang), Math.sin(ang), w
      );
      const c = this.rollCrit(p.damage);
      p.damage = c.value;
      p.crit = c.crit;
      projectiles.push(p);
    }
  }

  // --- Cuchillas orbitales (cuerpo a cuerpo defensivo) -------------
  updateOrbit(dt, w, enemies, effects) {
    w.angle = (w.angle || 0) + w.orbitSpeed * dt;
    const n = (w.count || 1) + (this.player.stats.multishot || 0);

    // Cooldown por enemigo: una cuchilla no borra toda la vida en un
    // solo frame; cada enemigo solo puede ser golpeado cada hitInterval.
    const cds = w.hitCooldowns || (w.hitCooldowns = new Map());
    for (const [e, t] of cds) {
      const nt = t - dt;
      if (nt <= 0 || e.isDead) cds.delete(e);
      else cds.set(e, nt);
    }

    for (let i = 0; i < n; i++) {
      const a = w.angle + i * ((Math.PI * 2) / n);
      const bx = this.player.cx + Math.cos(a) * w.orbitRadius;
      const by = this.player.cy + Math.sin(a) * w.orbitRadius;
      this.blades.push({ x: bx, y: by, color: w.color });

      for (const e of enemies) {
        if (e.isDead || cds.has(e)) continue;
        const reach = BLADE_RADIUS + e.w / 2;
        const dx = e.cx - bx;
        const dy = e.cy - by;
        if (dx * dx + dy * dy <= reach * reach) {
          const c = this.rollCrit(w.damage);
          e.takeDamage(c.value);
          cds.set(e, w.hitInterval);
          if (effects) {
            effects.popText(e.cx, e.cy - 6, c.value, c.crit ? '#ffffff' : w.color);
            effects.burst(bx, by, w.color, 3);
          }
        }
      }
    }
  }

  // --- Sable (cuerpo a cuerpo ofensivo) ----------------------------
  updateMelee(dt, w, enemies, effects) {
    w.cooldown -= dt;
    if (w.cooldown > 0) return;

    // Apunta al enemigo más cercano; si no hay, hacia donde mira.
    const target = this.nearestEnemyInRange(enemies) || this.nearest(enemies);
    const ang = target
      ? Math.atan2(target.cy - this.player.cy, target.cx - this.player.cx)
      : Math.atan2(this.player.facingY, this.player.facingX);

    // Registrar el barrido para dibujarlo (se desvanece solo).
    this.swings.push({
      cx: this.player.cx, cy: this.player.cy,
      ang, reach: w.reach, arc: w.arc, color: w.color,
      life: 0.15, maxLife: 0.15,
    });

    // Daño a todos los enemigos dentro del arco y el alcance.
    const reachSq = w.reach ** 2;
    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.cx - this.player.cx;
      const dy = e.cy - this.player.cy;
      if (dx * dx + dy * dy > reachSq) continue;
      // Diferencia angular normalizada a -PI..PI
      let da = Math.atan2(dy, dx) - ang;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) <= w.arc / 2) {
        const c = this.rollCrit(w.damage);
        e.takeDamage(c.value);
        if (effects) {
          effects.popText(e.cx, e.cy - 6, c.value, c.crit ? '#ffffff' : w.color);
          effects.burst(e.cx, e.cy, w.color, 4);
        }
      }
    }

    w.cooldown = 1 / (w.fireRate * this.player.stats.attackSpeed);
  }

  nearestEnemyInRange(enemies) {
    // Distancia al cuadrado: evita sqrt en un loop que corre por frame
    const rangeSq = this.player.stats.range ** 2;
    return this.nearest(enemies, rangeSq);
  }

  // Enemigo vivo más cercano (opcionalmente dentro de maxSq).
  nearest(enemies, maxSq = Infinity) {
    let best = null;
    let bestSq = Infinity;
    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.cx - this.player.cx;
      const dy = e.cy - this.player.cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= maxSq && dSq < bestSq) {
        bestSq = dSq;
        best = e;
      }
    }
    return best;
  }

  updateProjectiles(dt, enemies, projectiles, bounds, effects) {
    for (const p of projectiles) {
      p.update(dt, bounds);
      if (p.dead) continue;

      for (const e of enemies) {
        if (e.isDead || p.hit.has(e) || !aabb(p, e)) continue;
        e.takeDamage(p.damage);
        p.hit.add(e);
        if (effects) {
          // Los críticos se ven en blanco y con más chispas
          effects.popText(e.cx, e.cy - 6, p.damage, p.crit ? '#ffffff' : p.color);
          effects.burst(p.cx, p.cy, p.color, p.crit ? 8 : 4);
        }

        // Daño en área (misil): golpea a todos alrededor y muere.
        if (p.splash > 0) {
          this.explode(p, enemies, effects);
          p.dead = true;
          break;
        }

        if (p.pierce) continue;

        // Electric chain: en vez de morir, rebota hacia el siguiente
        // enemigo vivo más cercano que aún no haya golpeado.
        if (p.chainLeft > 0) {
          const next = this.nearestChainTarget(p, enemies, e);
          if (next) {
            const dx = next.cx - p.cx;
            const dy = next.cy - p.cy;
            const len = Math.hypot(dx, dy) || 1;
            p.dirX = dx / len;
            p.dirY = dy / len;
            p.chainLeft--;
            p.damage = Math.max(1, Math.round(p.damage * CHAIN_DECAY));
            break;
          }
        }

        p.dead = true;
        break;
      }
    }
  }

  // Explosión en área: daña a todos los enemigos dentro del radio de
  // splash que aún no recibieron el impacto directo.
  explode(p, enemies, effects) {
    const rSq = p.splash ** 2;
    for (const e of enemies) {
      if (e.isDead || p.hit.has(e)) continue;
      const dx = e.cx - p.cx;
      const dy = e.cy - p.cy;
      if (dx * dx + dy * dy <= rSq) {
        e.takeDamage(p.damage);
        p.hit.add(e);
        if (effects) effects.popText(e.cx, e.cy - 6, p.damage, p.color);
      }
    }
    if (effects) effects.burst(p.cx, p.cy, p.color, 16); // estallido grande
  }

  nearestChainTarget(p, enemies, from) {
    const rangeSq = CHAIN_RANGE ** 2;
    let best = null;
    let bestSq = Infinity;
    for (const e of enemies) {
      if (e.isDead || p.hit.has(e)) continue;
      const dx = e.cx - from.cx;
      const dy = e.cy - from.cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= rangeSq && dSq < bestSq) {
        bestSq = dSq;
        best = e;
      }
    }
    return best;
  }

  // Dibuja cuchillas orbitales y barridos de melee (lo llama main
  // dentro del bloque de screen shake, junto al resto del mundo).
  render(r) {
    for (const b of this.blades) {
      r.rect(b.x - 5, b.y - 5, 10, 10, b.color);
      r.rect(b.x - 2, b.y - 2, 4, 4, '#ffffff'); // brillo central
    }
    for (const s of this.swings) {
      const steps = 7;
      for (let i = 0; i <= steps; i++) {
        const a = s.ang - s.arc / 2 + s.arc * (i / steps);
        const x = s.cx + Math.cos(a) * s.reach;
        const y = s.cy + Math.sin(a) * s.reach;
        r.rect(x - 3, y - 3, 6, 6, s.color);
      }
    }
  }
}
