// SpawnSystem: decide cuándo y dónde nacen enemigos. Los enemigos
// aparecen en un anillo justo FUERA de la pantalla alrededor del
// player (estándar survivor): siempre entran desde el borde visible,
// nunca encima de ti, sin importar por dónde te muevas en el mundo.

import { Enemy } from '../entities/enemy.js?v=2';

// Rampa de dificultad: el intervalo entre spawns baja con el tiempo.
const START_INTERVAL = 2.0;
const MIN_INTERVAL = 0.4;
const RAMP_RATE = 0.025;

// Cap de enemigos normales (rendimiento). Los jefes lo ignoran.
const MAX_ENEMIES = 50;

// Oleadas de jefe cada BOSS_INTERVAL segundos.
const BOSS_INTERVAL = 45;

// Distancia de aparición: justo más allá de la media-diagonal del
// viewport (~550px) para que nazcan fuera de cámara.
const SPAWN_DIST = 560;

export class SpawnSystem {
  constructor(biome) {
    this.biome = biome;
    this.elapsed = 0;
    this.timer = START_INTERVAL / biome.enemyMultiplier;
    this.bossTimer = BOSS_INTERVAL;
  }

  get interval() {
    const base = Math.max(MIN_INTERVAL, START_INTERVAL - this.elapsed * RAMP_RATE);
    return base / this.biome.enemyMultiplier;
  }

  update(dt, enemies, player, world) {
    this.elapsed += dt;
    this.timer -= dt;
    this.bossTimer -= dt;

    if (this.timer <= 0 && enemies.length < MAX_ENEMIES) {
      enemies.push(this.spawnOne(player, world));
      this.timer = this.interval;
    }

    // Oleada de jefe: ignora el cap (es un evento, no relleno).
    if (this.bossTimer <= 0) {
      enemies.push(this.spawnOne(player, world, 'boss'));
      this.bossTimer = BOSS_INTERVAL;
    }
  }

  // Tabla de pesos según el tiempo: variedad creciente. Parásitos
  // desde 20s, brutes (élite) 30s, drones 45s, charger 60s, splitter 75s.
  pickType() {
    const table = [['marciano', 1]];
    if (this.elapsed >= 20) table.push(['parasito', 0.5]);
    if (this.elapsed >= 30) table.push(['brute', 0.25]);
    if (this.elapsed >= 45) table.push(['drone', 0.35]);
    if (this.elapsed >= 60) table.push(['charger', 0.3]);
    if (this.elapsed >= 75) table.push(['splitter', 0.3]);

    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [type, w] of table) {
      roll -= w;
      if (roll <= 0) return type;
    }
    return 'marciano';
  }

  // Anillo alrededor del player, justo fuera de cámara, clampeado al
  // mundo para que no nazca fuera de los límites del escenario.
  spawnOne(player, world, type = null) {
    const size = 24;
    const ang = Math.random() * Math.PI * 2;
    const dist = SPAWN_DIST + Math.random() * 140;
    let x = player.cx + Math.cos(ang) * dist;
    let y = player.cy + Math.sin(ang) * dist;
    x = Math.max(0, Math.min(x, world.w - size));
    y = Math.max(0, Math.min(y, world.h - size));
    return new Enemy(x, y, type || this.pickType());
  }

  // Crea un enemigo en una posición concreta (lo usa main para las
  // crías del splitter al morir).
  spawnAt(x, y, type) {
    return new Enemy(x, y, type);
  }
}
