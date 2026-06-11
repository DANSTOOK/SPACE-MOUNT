// Input: traduce eventos del navegador a un estado consultable.
// El gameplay nunca escucha eventos del DOM directamente; cada frame
// pregunta "¿está esta tecla presionada?". Eso desacopla la lógica del
// navegador y permite añadir gamepad/touch después sin tocar entidades.

export class Input {
  constructor(target = window) {
    this.keys = new Set();

    // Flancos: teclas recién presionadas este "instante", para menús.
    // isDown responde "¿está presionada?"; consume responde "¿acaba de
    // presionarse?" exactamente una vez (mantenerla no re-dispara).
    this.pressed = new Set();

    target.addEventListener('keydown', (e) => {
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      // Evita que flechas/espacio hagan scroll de la página
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });

    target.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.pressed.delete(e.code); // un flanco no consumido caduca al soltar
    });

    // Si la ventana pierde foco, soltamos todo: evita teclas "pegadas"
    // al volver de alt-tab.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressed.clear();
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consume(code) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  // Ejes de movimiento normalizados a -1/0/1 (WASD + flechas).
  // El player consume estos ejes, no teclas sueltas: si mañana hay
  // gamepad, solo cambia cómo se calculan aquí.
  get axisX() {
    return (
      (this.isDown('KeyD') || this.isDown('ArrowRight') ? 1 : 0) -
      (this.isDown('KeyA') || this.isDown('ArrowLeft') ? 1 : 0)
    );
  }

  get axisY() {
    return (
      (this.isDown('KeyS') || this.isDown('ArrowDown') ? 1 : 0) -
      (this.isDown('KeyW') || this.isDown('ArrowUp') ? 1 : 0)
    );
  }
}
