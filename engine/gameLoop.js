// GameLoop: corazón del engine. Usa requestAnimationFrame y entrega
// delta time (dt, en segundos) a update(), de modo que la velocidad
// del juego sea independiente de los FPS del monitor (60Hz, 144Hz...).

// dt máximo permitido. Si la pestaña estuvo en background, el primer
// frame al volver puede traer un dt enorme; lo recortamos para evitar
// "saltos" de física (enemigos teletransportándose, etc.).
const MAX_DT = 1 / 30;

export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTime = 0;
    this.fps = 0;
    this._frame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
  }

  _frame(now) {
    if (!this.running) return;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // FPS suavizado (media móvil exponencial) para el HUD de debug
    if (rawDt > 0) {
      this.fps = this.fps * 0.9 + (1 / rawDt) * 0.1;
    }

    const dt = Math.min(rawDt, MAX_DT);

    this.update(dt);
    this.render();

    requestAnimationFrame(this._frame);
  }
}
