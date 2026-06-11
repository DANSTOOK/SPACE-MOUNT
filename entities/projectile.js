// Proyectil: viaja en línea recta con dirección normalizada y daña
// enemigos al impactar (la colisión la resuelve systems/combat.js).
// Se auto-marca muerto al salir de pantalla: nada vive fuera del mundo.

const SPEED_SCALE = 60; // px/frame@60fps -> px/segundo (convención global)
const SIZE = 6;
const OFFSCREEN_MARGIN = 20;

export class Projectile {
  constructor(cx, cy, dirX, dirY, weapon) {
    this.w = SIZE;
    this.h = SIZE;
    this.x = cx - SIZE / 2;
    this.y = cy - SIZE / 2;
    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = weapon.projectileSpeed * SPEED_SCALE;
    this.damage = weapon.damage;
    this.pierce = weapon.pierce;
    this.color = weapon.color;
    this.dead = false;
    this.splash = weapon.splash || 0; // radio de daño en área al impactar
    this.crit = false;                // combat lo marca si el disparo fue crítico
    // Rebotes restantes (electric chain) y enemigos ya golpeados
    // (para no rebotar en círculos sobre el mismo objetivo).
    this.chainLeft = weapon.chain || 0;
    this.hit = new Set();
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  // bounds es un rectángulo {x, y, w, h}: en mapas cerrados los
  // proyectiles mueren en los muros, no en el borde de la pantalla.
  update(dt, bounds) {
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;

    if (
      this.x < bounds.x - OFFSCREEN_MARGIN ||
      this.x > bounds.x + bounds.w + OFFSCREEN_MARGIN ||
      this.y < bounds.y - OFFSCREEN_MARGIN ||
      this.y > bounds.y + bounds.h + OFFSCREEN_MARGIN
    ) {
      this.dead = true;
    }
  }

  render(r) {
    r.rect(this.x, this.y, this.w, this.h, this.color);
  }
}
