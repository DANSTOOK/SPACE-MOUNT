// UpgradeSystem: el pool de mejoras (los 4 tipos de la spec) y la
// lógica de "ofrecer 3, aplicar 1". Las mejoras son datos + closure
// apply(); añadir una nueva es agregar una entrada al pool.

import { WEAPONS } from './combat.js?v=2';

export class UpgradeSystem {
  constructor(player, combat) {
    this.player = player;
    this.combat = combat;
  }

  // El pool se reconstruye en cada level-up porque depende del estado:
  // new_weapon solo se ofrece si queda un arma sin equipar.
  buildPool() {
    const pool = [
      {
        id: 'increase_damage',
        title: 'Más daño',
        lines: ['+20% de daño en', 'todas las armas'],
        apply: () => {
          for (const w of this.combat.weapons) {
            w.damage = Math.round(w.damage * 1.2);
          }
        },
      },
      {
        id: 'increase_speed',
        title: 'Más velocidad',
        lines: ['+15% velocidad', 'de movimiento'],
        apply: () => {
          this.player.stats.speed *= 1.15;
        },
      },
      {
        id: 'upgrade_weapon',
        title: 'Mejorar arma',
        lines: ['+25% daño y +10%', 'cadencia a un arma'],
        apply: () => {
          const ws = this.combat.weapons;
          const w = ws[Math.floor(Math.random() * ws.length)];
          w.damage = Math.round(w.damage * 1.25);
          w.fireRate *= 1.1;
        },
      },
      {
        id: 'attack_speed',
        title: 'Cadencia rápida',
        lines: ['+15% cadencia de', 'todas las armas'],
        apply: () => { this.player.stats.attackSpeed *= 1.15; },
      },
      {
        id: 'max_hp',
        title: 'Vida máxima +25',
        lines: ['+25 de vida máxima', 'y te cura 25'],
        apply: () => {
          this.player.stats.hp += 25;
          this.player.hp = Math.min(this.player.stats.hp, this.player.hp + 25);
        },
      },
      {
        id: 'regen',
        title: 'Regeneración',
        lines: ['+1 de vida por', 'segundo'],
        apply: () => { this.player.stats.regen += 1; },
      },
      {
        id: 'shield',
        title: 'Escudo +1',
        lines: ['+1 carga de escudo', 'que absorbe un golpe'],
        apply: () => {
          this.player.stats.shieldMax += 1;
          this.player.shield += 1; // una carga lista de inmediato
        },
      },
      {
        id: 'magnet',
        title: 'Imán de XP',
        lines: ['+40% de radio de', 'recogida de orbes'],
        apply: () => { this.player.stats.magnet *= 1.4; },
      },
      {
        id: 'range_up',
        title: 'Más alcance',
        lines: ['+20% de alcance', 'de las armas'],
        apply: () => { this.player.stats.range *= 1.2; },
      },
      {
        id: 'multishot',
        title: 'Proyectil extra',
        lines: ['+1 proyectil en', 'cada disparo'],
        apply: () => { this.player.stats.multishot += 1; },
      },
      {
        id: 'crit',
        title: 'Golpe crítico',
        lines: ['+10% de prob. de', 'crítico (x2 daño)'],
        apply: () => {
          this.player.stats.crit = Math.min(0.6, this.player.stats.crit + 0.1);
        },
      },
      {
        id: 'xp_up',
        title: 'XP acelerada',
        lines: ['+20% de XP', 'por orbe'],
        apply: () => { this.player.stats.xpMult *= 1.2; },
      },
      {
        id: 'dash_speed',
        title: 'Dash Turbocargado',
        lines: ['+30% velocidad', 'durante el dash'],
        apply: () => { this.player.dashSpeed *= 1.3; },
      },
      {
        id: 'dash_cooldown',
        title: 'Dash Frecuente',
        lines: ['-25% de tiempo de', 'recarga del dash'],
        apply: () => { this.player.dashMaxCooldown *= 0.75; },
      },
      {
        id: 'dash_duration',
        title: 'Dash Prolongado',
        lines: ['+40% duración del', 'dash defensivo'],
        apply: () => { this.player.dashMaxDuration *= 1.4; },
      },
    ];

    const free = this.combat.unequippedKeys;
    if (free.length > 0) {
      const key = free[0];
      pool.push({
        id: 'new_weapon',
        title: `Nueva arma: ${WEAPONS[key].name}`,
        lines: ['Equipa un arma', 'adicional'],
        apply: () => this.combat.equip(key),
      });
    }

    return pool;
  }

  rollChoices(n = 3) {
    const pool = this.buildPool();
    // Fisher-Yates: barajado uniforme sin sesgos
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
  }

  apply(choice) {
    choice.apply();
  }
}
