// DevConsole: panel de control en tiempo real para tweakear parámetros del juego
// Abre con backtick (~) o F12. Exporta/importa JSON para compartir configuraciones.

export class DevConsole {
  constructor() {
    this.visible = false;
    this.params = {};
    this.defaultParams = {
      'Player Speed': { value: 3.2, min: 1, max: 8, step: 0.1, key: 'playerSpeed' },
      'Dash Cooldown': { value: 1.5, min: 0.5, max: 5, step: 0.1, key: 'dashCooldown' },
      'Dash Duration': { value: 0.3, min: 0.1, max: 1, step: 0.05, key: 'dashDuration' },
      'Dash Speed': { value: 8, min: 3, max: 15, step: 0.5, key: 'dashSpeed' },
      'Combo Multiplier': { value: 0.05, min: 0, max: 0.2, step: 0.01, key: 'comboMult' },
      'Enemy Spawn Rate': { value: 1, min: 0.3, max: 3, step: 0.1, key: 'spawnRate' },
      'Enemy Damage': { value: 1, min: 0.1, max: 3, step: 0.1, key: 'enemyDamage' },
      'Enemy Speed': { value: 1, min: 0.3, max: 2.5, step: 0.1, key: 'enemySpeed' },
    };

    // Copiar valores por defecto
    for (const [label, cfg] of Object.entries(this.defaultParams)) {
      this.params[cfg.key] = cfg.value;
    }
  }

  toggle() {
    this.visible = !this.visible;
  }

  update(dt, input) {
    if (input.consume('Backquote') || input.consume('F12')) {
      this.toggle();
    }
  }

  applyToGame(player, combat, spawner, enemies) {
    // Aplicar parámetros al player
    if (player) {
      player.stats.speed = this.params.playerSpeed;
      player.dashMaxCooldown = this.params.dashCooldown;
      player.dashMaxDuration = this.params.dashDuration;
      player.dashSpeed = this.params.dashSpeed;
    }

    // Aplicar a enemigos activos
    for (const e of enemies) {
      e.speed = (e.type === 'boss' || e.type === 'boss_elite' ? 0.5 : e.speed || 1.2) * this.params.enemySpeed;
      e.damage = (e.damage || 1) * this.params.enemyDamage;
    }

    // Spawner rate (ajusta cooldown de spawn)
    if (spawner) {
      spawner.spawnCooldown = Math.max(0.1, 2 / this.params.spawnRate);
    }
  }

  render(r, VIEW_W, VIEW_H) {
    if (!this.visible) return;

    // Fondo oscuro semi-transparente
    const panelW = 400;
    const panelH = 480;
    const panelX = VIEW_W - panelW - 10;
    const panelY = 10;

    r.rect(panelX, panelY, panelW, panelH, '#05050a');
    r.rect(panelX, panelY, panelW, 2, '#7df9ff'); // borde superior
    r.rect(panelX, panelY, 2, panelH, '#7df9ff'); // borde izquierdo
    r.rect(panelX + panelW - 2, panelY, 2, panelH, '#7df9ff'); // borde derecho
    r.rect(panelX, panelY + panelH - 2, panelW, 2, '#7df9ff'); // borde inferior

    // Título
    r.text('DEV CONSOLE', panelX + 10, panelY + 20, '#7df9ff', 14);
    r.text('` o F12 para cerrar', panelX + 10, panelY + 35, '#999', 10);

    // Parámetros
    let y = panelY + 55;
    const lineH = 35;
    let idx = 0;

    for (const [label, cfg] of Object.entries(this.defaultParams)) {
      if (idx >= 12) break; // Máximo 12 parámetros visibles

      const value = this.params[cfg.key];
      const pct = (value - cfg.min) / (cfg.max - cfg.min);

      // Label
      r.text(label, panelX + 10, y, '#ffe44f', 10);

      // Barra de slider
      const barW = panelW - 30;
      const barX = panelX + 10;
      const barY = y + 12;
      r.rect(barX, barY, barW, 6, '#1c2030');
      r.rect(barX, barY, barW * pct, 6, '#39ff14');

      // Valor
      r.text(value.toFixed(2), panelX + panelW - 50, y, '#7df9ff', 10);

      y += lineH;
      idx++;
    }

    // Botones: Export / Import / Reset
    const btnY = panelY + panelH - 50;
    const btnH = 16;

    r.rect(panelX + 10, btnY, 110, btnH, '#1c2030');
    r.text('EXPORT (X)', panelX + 15, btnY + 12, '#39ff14', 9);

    r.rect(panelX + 130, btnY, 110, btnH, '#1c2030');
    r.text('IMPORT (V)', panelX + 135, btnY + 12, '#7df9ff', 9);

    r.rect(panelX + 250, btnY, 110, btnH, '#1c2030');
    r.text('RESET (R)', panelX + 255, btnY + 12, '#ff4f30', 9);

    // Info de mouse si está cerca
    r.text(`Mouse: ${this.lastMouseX || 0}, ${this.lastMouseY || 0}`, panelX + 10, btnY - 20, '#666', 9);
  }

  // Exportar configuración como JSON
  export() {
    const cfg = JSON.stringify(this.params, null, 2);
    console.log('=== CONFIGURACIÓN EXPORTADA ===');
    console.log(cfg);
    console.log('=== COPIA EL JSON DE ARRIBA ===');
    return cfg;
  }

  // Importar configuración desde JSON
  import(jsonStr) {
    try {
      const cfg = JSON.parse(jsonStr);
      Object.assign(this.params, cfg);
      console.log('✓ Configuración importada exitosamente');
      return true;
    } catch (e) {
      console.error('✗ Error al parsear JSON:', e.message);
      return false;
    }
  }

  // Resetear a valores por defecto
  reset() {
    for (const [label, cfg] of Object.entries(this.defaultParams)) {
      this.params[cfg.key] = cfg.value;
    }
    console.log('✓ Configuración reseteada a valores por defecto');
  }
}
