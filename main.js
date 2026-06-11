// main.js: punto de entrada. Ensambla engine + entidades + sistemas,
// maneja la máquina de estados (menu → playing ⇄ levelup → muerte),
// y dibuja el HUD. La lógica de gameplay vive en entities/ y systems/.

import { Renderer, VIEW_W, VIEW_H } from './engine/renderer.js?v=2';
import { GameLoop } from './engine/gameLoop.js';
import { Input } from './engine/input.js?v=2';
import { Player } from './entities/player.js?v=2';
import { ENEMY_TYPES } from './entities/enemy.js?v=2';
import { Projectile } from './entities/projectile.js?v=2';
import { SpawnSystem } from './systems/spawn.js?v=2';
import { CombatSystem } from './systems/combat.js?v=2';
import { XpSystem } from './systems/xpSystem.js?v=2';
import { UpgradeSystem } from './systems/upgrades.js?v=2';
import { ScenarioSystem, BIOMES, BIOME_KEYS } from './systems/scenarios.js?v=2';
import { Effects } from './systems/effects.js';
import { DevConsole } from './systems/devConsole.js';
import { MenuSystem } from './systems/menuSystem.js';
import { aabb, removeWhere } from './utils/helpers.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const input = new Input();

const session = { kills: 0 };

// Tracking de mouse para el menú
let mouseX = 0, mouseY = 0;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('click', () => {
  input.mouseClick = true;
});

// Limpiar flag de click al final del frame
const originalEndFrame = input.endFrame.bind(input);
input.endFrame = function() {
  originalEndFrame();
  this.mouseClick = false;
};

// Todo el estado de partida se recrea en newGame(): reiniciar con R
// no recarga la página.
let player, enemies, projectiles, enemyShots;
let spawner, combat, xpSystem, upgrades, scenario, effects;
let devConsole, menuSystem;
menuSystem = new MenuSystem();
let state = 'menu';    // 'menu' | 'playing' | 'levelup'
let choices;  // las 3 mejoras ofrecidas durante 'levelup'
let survivalTime;
let selectedBiome = 'mars'; // bioma seleccionado en el menú

function newGame() {
  scenario = new ScenarioSystem(selectedBiome);
  player = new Player(scenario.bounds.x + scenario.bounds.w / 2, scenario.bounds.y + scenario.bounds.h / 2);
  enemies = [];
  projectiles = [];
  enemyShots = [];
  spawner = new SpawnSystem(scenario.biome);
  combat = new CombatSystem(player);
  xpSystem = new XpSystem(player);
  upgrades = new UpgradeSystem(player, combat);
  effects = new Effects();
  devConsole = new DevConsole();
  session.kills = 0;
  survivalTime = 0;
  state = 'playing';
  choices = null;
}

// Dummy mínimo para el menú (antes del primer newGame): nunca se
// renderiza (render() sale temprano en 'menu'), solo evita errores si
// algo lee scenario.
scenario = { biome: { name: 'Cargando...', sky: '#0a0a12' }, world: { w: VIEW_W, h: VIEW_H } };

let elapsed = 0;

// --- Cámara ------------------------------------------------------
// La vista sigue al player y se clampa al mundo. Devuelve el rect
// visible {x,y,w,h} en coordenadas de mundo (para culling y spawn).
function getView() {
  const wld = scenario.world;
  let camX = player.cx - VIEW_W / 2;
  let camY = player.cy - VIEW_H / 2;
  camX = Math.max(0, Math.min(camX, Math.max(0, wld.w - VIEW_W)));
  camY = Math.max(0, Math.min(camY, Math.max(0, wld.h - VIEW_H)));
  return { x: camX, y: camY, w: VIEW_W, h: VIEW_H };
}

// ¿La caja de la entidad toca la vista (+margen)? Para no dibujar lo
// que está fuera de cámara (rendimiento en mundo grande).
function inView(e, view, m = 48) {
  return (
    e.x + e.w >= view.x - m && e.x <= view.x + view.w + m &&
    e.y + e.h >= view.y - m && e.y <= view.y + view.h + m
  );
}

// La función que ve el GameLoop: corre la lógica del frame y SIEMPRE
// limpia los flancos de input al final, sin importar por qué rama de
// tick() se salió.
function update(dt) {
  tick(dt);
  input.endFrame();
}

function tick(dt) {
  elapsed += dt;

  if (state === 'menu') {
    updateMenu();
    return;
  }

  if (player.isDead) {
    if (input.consume('KeyR')) newGame();
    if (input.consume('KeyM')) state = 'menu';
    return;
  }

  if (state === 'levelup') {
    updateLevelUpMenu();
    return; // mundo congelado mientras se elige
  }

  // DevConsole: actualizar y manejar controles
  devConsole.update(dt, input);
  if (input.consume('KeyX')) devConsole.export();
  if (input.consume('KeyV')) {
    const cfg = prompt('Pega la configuración JSON exportada:');
    if (cfg) devConsole.import(cfg);
  }
  if (input.consume('KeyR') && devConsole.visible) devConsole.reset();

  // Aplicar parámetros del devConsole al juego
  devConsole.applyToGame(player, combat, spawner, enemies);

  survivalTime += dt;
  scenario.update(dt);

  // El multiplicador del bioma afecta la velocidad del player cada frame
  player.envSpeedMult = scenario.playerSpeedMult;

  player.update(dt, input, scenario.bounds);
  scenario.collide(player); // colisión con rocas (asteroides)

  const view = getView(); // rect visible: spawn fuera de él, cull dentro

  spawner.update(dt, enemies, player, scenario.world);

  for (const e of enemies) {
    e.update(dt, player, enemyShots);
    // Daño por contacto: los i-frames del player regulan el ritmo
    if (aabb(player, e) && player.takeDamage(e.damage)) effects.shake(7, 0.25);

    // Healer: cura a enemigos aliados en rango
    if (e.type === 'healer' && !e.isDead) {
      const def = ENEMY_TYPES.healer;
      const healRangeSq = def.healRange ** 2;
      for (const ally of enemies) {
        if (ally === e || ally.isDead) continue;
        const dx = ally.cx - e.cx;
        const dy = ally.cy - e.cy;
        if (dx * dx + dy * dy <= healRangeSq) {
          ally.hp = Math.min(ally.maxHp, ally.hp + def.healPower * dt);
        }
      }
    }

    // Boss Elite: dispara ráfaga cada 3s en 8 direcciones
    if (e.type === 'boss_elite' && !e.isDead) {
      e.burstCd = (e.burstCd || e.burstCooldown) - dt;
      if (e.burstCd <= 0) {
        const def = ENEMY_TYPES.boss_elite;
        const bulletDef = { damage: 6, projectileSpeed: 3, pierce: false, color: '#ff006e' };
        for (let i = 0; i < def.burstCount; i++) {
          const a = (i / def.burstCount) * Math.PI * 2;
          enemyShots.push(new Projectile(e.cx, e.cy, Math.cos(a), Math.sin(a), bulletDef));
        }
        e.burstCd = def.burstCooldown;
        if (effects) effects.burst(e.cx, e.cy, '#ff006e', 16);
      }
    }
  }

  // Proyectiles del player: mueren al salir de la VISTA (no del mundo
  // entero), para no arrastrar balas perdidas por todo el escenario.
  combat.update(dt, enemies, projectiles, view, effects);

  // Actualizar projectiles especiales (boomerang vuelve, grenade explota)
  for (const p of projectiles) {
    if (p.kind === 'boomerang' || p.kind === 'grenade') {
      p.update(dt, view, player.cx, player.cy);
    }
  }

  // Combo meter: sumar al impactar, resetear en inactividad
  // (se actualiza al fin del loop cuando impactos se registran)

  // Rocas bloquean proyectiles del jugador
  removeWhere(projectiles, (p) => scenario.blocksProjectile(p));

  // Granada explota en timer (no al salir de pantalla)
  for (const p of projectiles.filter(pr => pr.kind === 'grenade' && pr.dead)) {
    if (effects) combat.explode(p, enemies, effects);
  }

  // Proyectiles enemigos (drones) contra el player
  for (const s of enemyShots) {
    s.update(dt, view);
    if (!s.dead && aabb(player, s)) {
      if (player.takeDamage(s.damage)) effects.shake(7, 0.25);
      s.dead = true;
    }
  }

  // Los muertos sueltan su orbe y estallan ANTES de la limpieza in-place
  for (const e of enemies) {
    if (!e.isDead) continue;
    effects.burst(e.cx, e.cy, e.color, e.elite ? 24 : 10);

    if (e.type === 'boss') {
      // Botín de jefe: anillo de orbes + sacudida fuerte de recompensa
      effects.shake(10, 0.4);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        xpSystem.spawnOrb(e.cx + Math.cos(a) * 30, e.cy + Math.sin(a) * 30, 3);
      }
    } else {
      xpSystem.spawnOrb(e.cx, e.cy, e.xpValue);
    }

    // Splitter: se parte en crías al morir (se añaden al vuelo; el
    // for..of las visita pero las salta por !isDead).
    if (e.splits && e.splitInto) {
      for (let i = 0; i < e.splits; i++) {
        const a = Math.random() * Math.PI * 2;
        enemies.push(spawner.spawnAt(e.cx + Math.cos(a) * 16, e.cy + Math.sin(a) * 16, e.splitInto));
      }
    }
  }
  session.kills += removeWhere(enemies, (e) => e.isDead);
  removeWhere(projectiles, (p) => p.dead);
  removeWhere(enemyShots, (s) => s.dead);

  xpSystem.update(dt);
  effects.update(dt);

  // ¿Subió de nivel? Abrir menú de mejora (uno por nivel encolado)
  if (xpSystem.pendingLevels > 0) {
    xpSystem.pendingLevels--;
    choices = upgrades.rollChoices();
    state = 'levelup';
  }
}

function updateMenu() {
  const selected = menuSystem.update(input, mouseX, mouseY);
  if (selected) {
    selectedBiome = selected;
    newGame();
  }
}

function updateLevelUpMenu() {
  const keys = ['Digit1', 'Digit2', 'Digit3'];
  for (let i = 0; i < choices.length; i++) {
    if (input.consume(keys[i])) {
      upgrades.apply(choices[i]);
      choices = null;
      state = 'playing';
      return;
    }
  }
}

function render() {
  if (state === 'menu') {
    renderMenu();
    return;
  }

  // Fondo a pantalla completa (sin cámara), luego el MUNDO bajo la
  // transformación de cámara. El screen shake se suma al offset de
  // cámara, así sacude el mundo pero no el HUD ni el cielo.
  renderer.clear(scenario.biome.sky || '#0a0a12');
  const view = getView();
  renderer.beginWorld(view.x - effects.offsetX, view.y - effects.offsetY);

  scenario.renderWorld(renderer, elapsed, view);
  xpSystem.render(renderer); // orbes debajo de todo lo vivo
  for (const e of enemies) if (inView(e, view)) e.render(renderer);
  for (const p of projectiles) p.render(renderer);
  for (const s of enemyShots) s.render(renderer);
  player.render(renderer);
  combat.render(renderer); // cuchillas orbitales y barridos de melee
  effects.render(renderer); // partículas y números de daño sobre el mundo

  renderer.endWorld();

  scenario.renderForeground(renderer); // velo de tormenta (pantalla)

  renderHud();

  devConsole.render(renderer, VIEW_W, VIEW_H);

  if (state === 'levelup') renderLevelUpMenu();
}

function renderHud() {
  // Barra de XP: franja fina arriba de todo (clásico del género)
  const xpPct = xpSystem.xp / xpSystem.xpToNext;
  renderer.rect(0, 0, VIEW_W, 4, '#1c2030');
  renderer.rect(0, 0, VIEW_W * xpPct, 4, '#ffe44f');

  // Combo meter: si hay combo, mostrar en grande en la esquina superior derecha
  if (player.combo > 0) {
    const comboMult = (1 + Math.min(1, player.combo * 0.05)).toFixed(2);
    renderer.text(`COMBO x${comboMult}`, VIEW_W - 180, 30, '#ff00ff', 18);
  }

  // Barra de recarga del Dash (esquina superior derecha)
  const dashPct = 1 - (player.dashCooldown / player.dashMaxCooldown);
  const dashBarW = 120;
  renderer.rect(VIEW_W - dashBarW - 10, 50, dashBarW, 8, '#1c2030');
  renderer.rect(VIEW_W - dashBarW - 10, 50, dashBarW * dashPct, 8, dashPct >= 1 ? '#00ff88' : '#ff9f1c');
  renderer.text(`DASH`, VIEW_W - dashBarW - 10, 65, dashPct >= 1 ? '#00ff88' : '#999', 10);

  // Barra de HP
  const pct = player.hp / player.stats.hp;
  renderer.rect(10, 10, 150, 14, '#1c2030');
  renderer.rect(10, 10, 150 * pct, 14, pct > 0.3 ? '#39ff14' : '#ff4f30');
  renderer.text(`HP ${Math.ceil(player.hp)}/${player.stats.hp}`, 14, 21, '#05050a', 11);
  renderer.text(`Nv ${xpSystem.level}`, 170, 21, '#ffe44f', 12);
  if (player.stats.shieldMax > 0) {
    renderer.text(`Escudo ${player.shield}/${player.stats.shieldMax}`, 214, 21, '#7df9ff', 12);
  }

  // Tiempo de supervivencia (el "score" natural del género)
  const mm = String(Math.floor(survivalTime / 60)).padStart(2, '0');
  const ss = String(Math.floor(survivalTime % 60)).padStart(2, '0');
  renderer.text(`${mm}:${ss}`, VIEW_W / 2 - 18, 24, '#7df9ff', 16);

  renderer.text(`FPS: ${loop.fps.toFixed(0)}`, 10, 42, '#7df9ff');
  renderer.text(`Enemigos: ${enemies.length}`, 10, 60, '#ff3864', 12);
  renderer.text(`Kills: ${session.kills}`, 10, 78, '#39ff14', 12);
  renderer.text(`Armas: ${combat.weapons.map((w) => w.name).join(', ')}`, 10, 96, '#9aa0b4', 12);

  if (state !== 'menu') {
    renderer.text(`Bioma: ${scenario.biome.name}`, 10, 114, '#7db4ff', 11);
  }

  if (player.isDead) {
    renderer.text('GAME OVER', VIEW_W / 2 - 64, VIEW_H / 2, '#ff4f30', 24);
    renderer.text(
      `Sobreviviste ${mm}:${ss} · Nivel ${xpSystem.level} · ${session.kills} kills`,
      VIEW_W / 2 - 130, VIEW_H / 2 + 26, '#9aa0b4', 14
    );
    renderer.text('R: reiniciar · M: menú', VIEW_W / 2 - 86, VIEW_H / 2 + 50, '#7df9ff', 12);
  }
}

function renderMenu() {
  try {
    menuSystem.render(renderer, VIEW_W, VIEW_H);
  } catch (e) {
    renderer.text('ERROR EN MENU: ' + e.message, 100, 100, '#ff0000', 12);
  }
}

function renderLevelUpMenu() {
  // Velo oscuro: el mundo sigue visible pero claramente en pausa
  renderer.rect(0, 0, VIEW_W, VIEW_H, 'rgba(5, 5, 10, 0.78)');

  renderer.text('LEVEL UP', VIEW_W / 2 - 54, 150, '#ffe44f', 24);
  renderer.text('Elige una mejora (1, 2 o 3)', VIEW_W / 2 - 100, 178, '#9aa0b4', 14);

  const cardW = 210;
  const cardH = 120;
  const gap = 24;
  const totalW = choices.length * cardW + (choices.length - 1) * gap;
  const startX = (VIEW_W - totalW) / 2;
  const y = 215;

  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    const x = startX + i * (cardW + gap);

    renderer.rect(x, y, cardW, cardH, '#141a2e');
    renderer.rect(x, y, cardW, 3, '#7df9ff'); // borde superior neón

    renderer.text(`[${i + 1}]`, x + 14, y + 30, '#ffe44f', 16);
    renderer.text(c.title, x + 14, y + 58, '#ffffff', 14);
    c.lines.forEach((line, j) => {
      renderer.text(line, x + 14, y + 82 + j * 16, '#9aa0b4', 12);
    });
  }
}

const loop = new GameLoop({ update, render });
loop.start();

// Handle de debug para la consola del navegador (solo desarrollo).
// Getters: las referencias cambian en cada newGame().
window.SM = {
  session, loop, input, newGame, selectedBiome,
  get player() { return player; },
  get enemies() { return enemies; },
  get projectiles() { return projectiles; },
  get enemyShots() { return enemyShots; },
  get spawner() { return spawner; },
  get effects() { return effects; },
  get combat() { return combat; },
  get xpSystem() { return xpSystem; },
  get upgrades() { return upgrades; },
  get scenario() { return scenario; },
  get state() { return state; },
  get choices() { return choices; },
  get devConsole() { return devConsole; },
  get menuSystem() { return menuSystem; },
  get survivalTime() { return survivalTime; },
};
