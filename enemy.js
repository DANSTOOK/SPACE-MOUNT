// Enemigos: una sola clase + tabla de tipos. Los tipos son datos, no
// subclases; las variaciones de IA se ramifican en update() según el
// comportamiento declarado en la tabla.

import { Projectile } from './projectile.js';

// speed en "px por frame @60fps" (misma convención que el player).
export const ENEMY_TYPES = {
  marciano: {
    hp: 20,
    speed: 1.2,
    damage: 10,
    size: 20,
    color: '#ff3864',
    xp: 1,
    behavior: 'chase',
  },
  parasito: {
    // Frágil pero el doble de rápido que el player: obliga a moverse
    // en ángulos en vez de huir en línea recta.
    hp: 10,
    speed: 2.6,
    damage: 5,
    size: 14,
    color: '#b14fff',
    xp: 1,
    behavior: 'chase',
  },
  drone: {
    // Mantiene distancia y dispara: castiga quedarse quieto.
    hp: 30,
    speed: 0.9,
    damage: 8, // daño por contacto; su disparo usa DRONE_SHOT
    size: 18,
    color: '#4fa9ff',
    xp: 2,
    behavior: 'ranged',
  },
};

// "Arma" del drone (mismo formato que las WEAPONS del player, así
// Projectile sirve para ambos bandos).
const DRONE_SHOT = {
  damage: 8,
  projectileSpeed: 3.5,
  pierce: false,
  color: '#7db4ff',
};
const DRONE_PREFERRED_DIST = 180; // px que intenta mantener
const DRONE_FIRE_RANGE = 320;
const DRONE_COOLDOWN = 2; // segundos entre disparos

const SPEED_SCALE = 60; // px/frame@60fps -> px/segundo

export class Enemy {
  constructor(x, y, type) {
    const def = ENEMY_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = def.size;
    this.h = def.size;
    this.speed = def.speed * SPEED_SCALE;
    this.damage = def.damage;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.color = def.color;
    this.xpValue = def.xp;
    this.behavior = def.behavior;
    // Cooldown inicial aleatorio: drones que spawnean juntos no
    // disparan en sincronía perfecta.
    this.shootTimer = 1 + Math.random();
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get isDead() { return this.hp <= 0; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  // shots: array compartido de proyectiles enemigos (lo llena el drone)
  update(dt, player, shots) {
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (this.behavior === 'ranged') {
      // Acercarse si está lejos, retroceder si está demasiado cerca
      if (dist > DRONE_PREFERRED_DIST + 20) {
        this.x += nx * this.speed * dt;
        this.y += ny * this.speed * dt;
      } else if (dist < DRONE_PREFERRED_DIST - 20) {
        this.x -= nx * this.speed * dt;
        this.y -= ny * this.speed * dt;
      }

      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && dist <= DRONE_FIRE_RANGE) {
        shots.push(new Projectile(this.cx, this.cy, nx, ny, DRONE_SHOT));
        this.shootTimer = DRONE_COOLDOWN;
      }
      return;
    }

    // 'chase' (marciano, parásito): persecución directa
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
  }

  render(r) {
    r.rect(this.x, this.y, this.w, this.h, this.color);
    // "Ojos" oscuros: distinguen al enemigo de un simple rectángulo
    r.rect(this.x + 4, this.y + 5, 3, 3, '#0a0a12');
    r.rect(this.x + this.w - 7, this.y + 5, 3, 3, '#0a0a12');
  }
}
