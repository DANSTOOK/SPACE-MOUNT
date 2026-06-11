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
    // Armas especiales
    this.kind = weapon.kind || 'normal';
    // Boomerang: vuelve al jugador después de returnTime
    this.returnTime = weapon.returnTime || 0;
    this.lifespan = 0;
    this.isReturning = false;
    // Granada: explota después de fuseTime
    this.fuseTime = weapon.fuseTime || 0;
    this.fuse = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  // bounds es un rectángulo {x, y, w, h}: en mapas cerrados los
  // proyectiles mueren en los muros, no en el borde de la pantalla.
  update(dt, bounds, playerCx = null, playerCy = null) {
    // Granada: cuenta hacia explosión
    if (this.kind === 'grenade') {
      this.fuse += dt;
      if (this.fuse >= this.fuseTime) {
        this.dead = true; // marca para explotar en main
        return;
      }
    }

    // Boomerang: viaja, después vuelve al jugador
    if (this.kind === 'boomerang') {
      this.lifespan += dt;
      if (this.lifespan >= this.returnTime && !this.isReturning) {
        this.isReturning = true;
      }
      if (this.isReturning && playerCx && playerCy) {
        const dx = playerCx - this.cx;
        const dy = playerCy - this.cy;
        const len = Math.hypot(dx, dy) || 1;
        this.dirX = dx / len;
        this.dirY = dy / len;
        // Si llega al jugador, muere
        if (len < 20) {
          this.dead = true;
          return;
        }
      }
    }

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
