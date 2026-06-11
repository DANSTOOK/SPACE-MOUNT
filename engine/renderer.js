// Renderer: dueño único del canvas. El resto del juego nunca toca el
// contexto 2D directamente; solo usa estas primitivas de dibujo.
// Eso permite cambiar la implementación (capas, cámara, WebGL) sin
// tocar entidades ni sistemas.

// Resolución lógica fija. Todas las coordenadas del juego viven en
// este espacio: origen (0,0) arriba-izquierda, Y crece hacia abajo.
export const VIEW_W = 960;
export const VIEW_H = 540;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.ctx.imageSmoothingEnabled = false; // pixel art nítido
  }

  clear(color = '#0a0a12') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  circle(x, y, radius, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  text(str, x, y, color = '#ffffff', size = 14) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.fillText(str, x, y);
  }

  // Cámara: translada el origen para que todo lo dibujado entre
  // beginWorld() y endWorld() use coordenadas de MUNDO. (camX,camY) es
  // la esquina superior-izquierda visible del mundo. Pensado para el
  // mundo (fondo + entidades); el HUD se dibuja fuera, en coords de
  // pantalla. El redondeo evita "temblor" de subpíxel al moverse.
  beginWorld(camX, camY) {
    this.ctx.save();
    this.ctx.translate(-Math.round(camX), -Math.round(camY));
  }

  endWorld() {
    this.ctx.restore();
  }
}
