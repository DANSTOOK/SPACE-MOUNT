// Enemigos: una sola clase + tabla de tipos. Los tipos son datos, no
// subclases; las variaciones de IA se ramifican en update() según el
// comportamiento declarado en la tabla.

import { Projectile } from './projectile.js?v=2';

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
  brute: {
    // Élite: tanque lento que pega fuerte. Lleva barra de vida.
    hp: 90,
    speed: 0.7,
    damage: 18,
    size: 32,
    color: '#9b5de5',
    xp: 5,
    behavior: 'chase',
    elite: true,
  },
  boss: {
    // Jefe: mucha vida, lento, enorme. Aparece en oleadas y suelta
    // un botín grande de XP al morir.
    hp: 400,
    speed: 0.5,
    damage: 28,
    size: 52,
    color: '#f15bb5',
    xp: 25,
    behavior: 'chase',
    elite: true,
  },
  charger: {
    // Embiste: se acerca, telegrafía y se lanza en línea recta muy
    // rápido. Hay que esquivar la embestida.
    hp: 40,
    speed: 0.8,
    damage: 16,
    size: 24,
    color: '#ff9f1c',
    xp: 3,
    behavior: 'charger',
  },
  splitter: {
    // Al morir se parte en 2 splitlings rápidos: matarlo crea más.
    hp: 50,
    speed: 1.0,
    damage: 12,
    size: 26,
    color: '#2ec4b6',
    xp: 3,
    behavior: 'chase',
    splits: 2,
    splitInto: 'splitling',
  },
  splitling: {
    // Cría del splitter: diminuto, rápido, frágil. No se vuelve a partir.
    hp: 8,
    speed: 2.2,
    damage: 6,
    size: 12,
    color: '#2ec4b6',
    xp: 1,
    behavior: 'chase',
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

// Charger: acercarse, telegrafiar (windup) y embestir (dash).
const CHARGE_RANGE = 260;     // px a los que decide embestir
const CHARGE_WIND = 0.5;      // s de telegrafía (quieto, parpadea)
const CHARGE_DUR = 0.35;      // s de duración de la embestida
const CHARGE_SPEED = 430;     // px/s durante la embestida (muy rápido)
const CHARGE_COOLDOWN = 2.5;  // s entre embestidas

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
    this.elite = def.elite || false; // dibuja barra de vida si true
    this.splits = def.splits || 0;       // nº de crías al morir
    this.splitInto = def.splitInto || null;
    // Cooldown inicial aleatorio: drones que spawnean juntos no
    // disparan en sincronía perfecta.
    this.shootTimer = 1 + Math.random();
    this.hitFlash = 0; // segundos restantes de parpadeo blanco al ser golpeado
    // Estado del charger (embestida)
    this.dashTime = 0;
    this.windT = 0;
    this.dashX = 0;
    this.dashY = 0;
    this.chargeCd = 1 + Math.random() * 2;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get isDead() { return this.hp <= 0; }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.08; // breve flash blanco
  }

  // shots: array compartido de proyectiles enemigos (lo llena el drone)
  update(dt, player, shots) {
    if (this.hitFlash > 0) this.hitFlash -= dt;

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

    if (this.behavior === 'charger') {
      if (this.dashTime > 0) {
        // Embistiendo: dirección fija a alta velocidad
        this.dashTime -= dt;
        this.x += this.dashX * CHARGE_SPEED * dt;
        this.y += this.dashY * CHARGE_SPEED * dt;
      } else if (this.windT > 0) {
        // Telegrafía: quieto un instante; al terminar fija el rumbo
        this.windT -= dt;
        if (this.windT <= 0) {
          this.dashX = nx;
          this.dashY = ny;
          this.dashTime = CHARGE_DUR;
        }
      } else {
        // Acercarse lento; al estar en rango y con el cooldown listo,
        // empieza la telegrafía de embestida.
        this.x += nx * this.speed * dt;
        this.y += ny * this.speed * dt;
        this.chargeCd -= dt;
        if (dist < CHARGE_RANGE && this.chargeCd <= 0) {
          this.windT = CHARGE_WIND;
          this.chargeCd = CHARGE_COOLDOWN;
        }
      }
      return;
    }

    // 'chase' (marciano, parásito, brute, boss, splitter): persecución
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
  }

  render(r) {
    // Color del cuerpo: blanco al recibir impacto; parpadeo de aviso
    // mientras el charger telegrafía la embestida.
    let color = this.color;
    if (this.hitFlash > 0) color = '#ffffff';
    else if (this.windT > 0 && Math.floor(this.windT * 16) % 2 === 0) color = '#fff2a8';
    r.rect(this.x, this.y, this.w, this.h, color);
    // "Ojos" oscuros: distinguen al enemigo de un simple rectángulo
    r.rect(this.x + 4, this.y + 5, 3, 3, '#0a0a12');
    r.rect(this.x + this.w - 7, this.y + 5, 3, 3, '#0a0a12');

    // Barra de vida para élites y jefes (solo si ya recibieron daño)
    if (this.elite && this.hp < this.maxHp) {
      const by = this.y - 7;
      r.rect(this.x, by, this.w, 4, '#1c2030');
      r.rect(this.x, by, this.w * (this.hp / this.maxHp), 4, '#39ff14');
    }
  }
}
