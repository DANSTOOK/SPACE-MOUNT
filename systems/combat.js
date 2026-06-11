// CombatSystem: dueño del auto-ataque. Cada frame baja cooldowns,
// elige objetivo (enemigo más cercano dentro del range del player),
// dispara y resuelve colisiones proyectil-enemigo. No elimina nada
// de los arrays: solo marca (dead / hp 0); main.js limpia.

import { Projectile } from '../entities/projectile.js?v=2';
import { aabb } from '../utils/helpers.js';

// Armas como datos (spec). Blaster y electric_chain se desbloquean
// vía upgrades en la Fase 5.
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
};

const CHAIN_RANGE = 240;  // px máximos de un rebote
const CHAIN_DECAY = 0.8;  // el daño decae 20% por rebote

export class CombatSystem {
  constructor(player) {
    this.player = player;
    // Cada arma equipada lleva su propio cooldown. Empieza solo con
    // la Raygun; "new_weapon" (Fase 5) hace push aquí.
    this.weapons = [{ ...WEAPONS.raygun, cooldown: 0 }];
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

  update(dt, enemies, projectiles, bounds, effects = null) {
    this.updateWeapons(dt, enemies, projectiles);
    this.updateProjectiles(dt, enemies, projectiles, bounds, effects);
  }

  updateWeapons(dt, enemies, projectiles) {
    for (const w of this.weapons) {
      w.cooldown -= dt;
      if (w.cooldown > 0) continue;

      const target = this.nearestEnemyInRange(enemies);
      if (!target) continue; // sin objetivo: el arma queda lista, no gasta el disparo

      this.fire(w, target, projectiles);

      // attackSpeed del player multiplica la cadencia: los upgrades
      // afectan al combate sin tocar este código.
      w.cooldown = 1 / (w.fireRate * this.player.stats.attackSpeed);
    }
  }

  // Dispara un arma hacia el objetivo. Tira N proyectiles en abanico
  // (count del arma + multishot del player) y aplica crítico por
  // proyectil. Una sola arma, una sola fuente de verdad del disparo.
  fire(w, target, projectiles) {
    const st = this.player.stats;
    const baseAng = Math.atan2(target.cy - this.player.cy, target.cx - this.player.cx);
    const total = (w.count || 1) + (st.multishot || 0);
    // Si hay más de un proyectil pero el arma no abre abanico, abrimos
    // uno mínimo para que el multishot no apile balas encima.
    const spread = total > 1 ? (w.spread || 0.28) : 0;

    for (let i = 0; i < total; i++) {
      const t = total > 1 ? i / (total - 1) - 0.5 : 0; // -0.5..0.5
      const ang = baseAng + t * spread;
      const p = new Projectile(
        this.player.cx, this.player.cy,
        Math.cos(ang), Math.sin(ang), w
      );
      // Crítico por proyectil
      if (Math.random() < (st.crit || 0)) {
        p.damage = Math.round(p.damage * (st.critMult || 2));
        p.crit = true;
      }
      projectiles.push(p);
    }
  }

  nearestEnemyInRange(enemies) {
    // Distancia al cuadrado: evita sqrt en un loop que corre por frame
    const rangeSq = this.player.stats.range ** 2;
    let best = null;
    let bestSq = Infinity;

    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.cx - this.player.cx;
      const dy = e.cy - this.player.cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= rangeSq && dSq < bestSq) {
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
}
