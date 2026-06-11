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
  }

  update(dt, bounds) {
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;

    if (
      this.x < -OFFSCREEN_MARGIN ||
      this.x > bounds.w + OFFSCREEN_MARGIN ||
      this.y < -OFFSCREEN_MARGIN ||
      this.y > bounds.h + OFFSCREEN_MARGIN
    ) {
      this.dead = true;
    }
  }

  render(r) {
    r.rect(this.x, this.y, this.w, this.h, this.color);
  }
}
