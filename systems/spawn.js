// SpawnSystem: decide cuándo y dónde nacen enemigos. No sabe de
// colisiones ni combate; solo produce instancias de Enemy según el
// ritmo del bioma activo.

import { Enemy } from '../entities/enemy.js?v=2';

// Rampa de dificultad: el intervalo entre spawns baja con el tiempo
// de partida. Con enemyMultiplier 1.2 (Marte), todo va un 20% más rápido.
const START_INTERVAL = 2.0; // segundos entre spawns al inicio
const MIN_INTERVAL = 0.5;   // ritmo máximo
const RAMP_RATE = 0.025;    // cuánto baja el intervalo por segundo jugado

// Sin combate (hasta Fase 4) los enemigos no mueren: el cap evita
// llenar la pantalla y degradar FPS.
const MAX_ENEMIES = 40;

export class SpawnSystem {
  constructor(biome) {
    this.biome = biome;
    this.elapsed = 0;
    this.timer = START_INTERVAL / biome.enemyMultiplier;
  }

  get interval() {
    const base = Math.max(MIN_INTERVAL, START_INTERVAL - this.elapsed * RAMP_RATE);
    return base / this.biome.enemyMultiplier;
  }

  // inside=true (mapas cerrados): los enemigos nacen pegados al muro
  // por dentro, porque no hay "fuera" desde donde entrar caminando.
  update(dt, enemies, bounds, inside = false) {
    this.elapsed += dt;
    this.timer -= dt;

    if (this.timer <= 0 && enemies.length < MAX_ENEMIES) {
      enemies.push(this.spawnOne(bounds, inside));
      this.timer = this.interval;
    }
  }

  // Tabla de pesos según el tiempo de partida: la dificultad no es
  // solo cantidad, también variedad. Parásitos desde los 20s, drones
  // desde los 45s.
  pickType() {
    const table = [['marciano', 1]];
    if (this.elapsed >= 20) table.push(['parasito', 0.5]);
    if (this.elapsed >= 45) table.push(['drone', 0.35]);

    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [type, w] of table) {
      roll -= w;
      if (roll <= 0) return type;
    }
    return 'marciano';
  }

  // Posición aleatoria en un borde aleatorio del rectángulo jugable:
  // fuera (entra caminando) o justo dentro si el mapa es cerrado.
  // Nunca aparece encima del jugador.
  spawnOne(bounds, inside = false) {
    const size = 20;
    const off = inside ? 2 : size + 4; // separación respecto al borde
    const sign = inside ? 1 : -1;
    const edge = Math.floor(Math.random() * 4); // 0=arriba 1=derecha 2=abajo 3=izquierda
    let x, y;

    switch (edge) {
      case 0:
        x = bounds.x + Math.random() * (bounds.w - size);
        y = bounds.y + sign * off;
        break;
      case 1:
        x = bounds.x + bounds.w - (inside ? off + size : -off);
        y = bounds.y + Math.random() * (bounds.h - size);
        break;
      case 2:
        x = bounds.x + Math.random() * (bounds.w - size);
        y = bounds.y + bounds.h - (inside ? off + size : -off);
        break;
      default:
        x = bounds.x + sign * off;
        y = bounds.y + Math.random() * (bounds.h - size);
        break;
    }

    return new Enemy(x, y, this.pickType());
  }
}
