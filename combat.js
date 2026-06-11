// CombatSystem: dueño del auto-ataque. Cada frame baja cooldowns,
// elige objetivo (enemigo más cercano dentro del range del player),
// dispara y resuelve colisiones proyectil-enemigo. No elimina nada
// de los arrays: solo marca (dead / hp 0); main.js limpia.

import { Projectile } from '../entities/projectile.js';
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

  update(dt, enemies, projectiles, bounds) {
    this.updateWeapons(dt, enemies, projectiles);
    this.updateProjectiles(dt, enemies, projectiles, bounds);
  }

  updateWeapons(dt, enemies, projectiles) {
    for (const w of this.weapons) {
      w.cooldown -= dt;
      if (w.cooldown > 0) continue;

      const target = this.nearestEnemyInRange(enemies);
      if (!target) continue; // sin objetivo: el arma queda lista, no gasta el disparo

      const dx = target.cx - this.player.cx;
      const dy = target.cy - this.player.cy;
      const len = Math.hypot(dx, dy) || 1;
      projectiles.push(
        new Projectile(this.player.cx, this.player.cy, dx / len, dy / len, w)
      );

      // attackSpeed del player multiplica la cadencia: los upgrades
      // de la Fase 5 afectan al combate sin tocar este código.
      w.cooldown = 1 / (w.fireRate * this.player.stats.attackSpeed);
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

  updateProjectiles(dt, enemies, projectiles, bounds) {
    for (const p of projectiles) {
      p.update(dt, bounds);
      if (p.dead) continue;

      for (const e of enemies) {
        if (e.isDead || p.hit.has(e) || !aabb(p, e)) continue;
        e.takeDamage(p.damage);
        p.hit.add(e);

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
