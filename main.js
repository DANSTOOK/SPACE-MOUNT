// main.js: punto de entrada. Ensambla engine + entidades + sistemas,
// maneja la máquina de estados (menu → playing ⇄ levelup → muerte),
// y dibuja el HUD. La lógica de gameplay vive en entities/ y systems/.

import { Renderer, VIEW_W, VIEW_H } from './engine/renderer.js';
import { GameLoop } from './engine/gameLoop.js';
import { Input } from './engine/input.js?v=2';
import { Player } from './entities/player.js';
import { SpawnSystem } from './systems/spawn.js';
import { CombatSystem } from './systems/combat.js';
import { XpSystem } from './systems/xpSystem.js';
import { UpgradeSystem } from './systems/upgrades.js';
import { ScenarioSystem, BIOMES, BIOME_KEYS } from './systems/scenarios.js';
import { aabb, removeWhere } from './utils/helpers.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const input = new Input();

const session = { kills: 0 };

// Todo el estado de partida se recrea en newGame(): reiniciar con R
// no recarga la página.
let player, enemies, projectiles, enemyShots;
let spawner, combat, xpSystem, upgrades, scenario;
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
  session.kills = 0;
  survivalTime = 0;
  state = 'playing';
  choices = null;
}

// Inicializar al cargar (comienza en menú, pero newGame() no se ejecuta hasta que el usuario selecciona)
// Para evitar errores en render() cuando scenario es undefined, inicializo con un dummy
scenario = { renderBackground: () => {}, renderForeground: () => {}, biome: { name: 'Cargando...' } };

// --- Fondo decorativo: cielo de Marte (de la Fase 1) ---
const stars = Array.from({ length: 120 }, () => ({
  x: Math.random() * VIEW_W,
  y: Math.random() * (VIEW_H * 0.8),
  size: Math.random() < 0.85 ? 1 : 2,
  phase: Math.random() * Math.PI * 2,
  speed: 0.5 + Math.random() * 1.5,
}));

let elapsed = 0;

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

  survivalTime += dt;
  scenario.update(dt);

  // El multiplicador del bioma afecta la velocidad del player cada frame
  player.envSpeedMult = scenario.playerSpeedMult;

  player.update(dt, input, scenario.bounds);
  scenario.collide(player); // colisión con rocas (asteroides)
  spawner.update(dt, enemies, scenario.bounds, scenario.closed);

  for (const e of enemies) {
    e.update(dt, player, enemyShots);
    // Daño por contacto: los i-frames del player regulan el ritmo
    if (aabb(player, e)) player.takeDamage(e.damage);
  }

  combat.update(dt, enemies, projectiles, scenario.bounds);

  // Rocas bloquean proyectiles del jugador
  removeWhere(projectiles, (p) => scenario.blocksProjectile(p));

  // Proyectiles enemigos (drones) contra el player
  for (const s of enemyShots) {
    s.update(dt, scenario.bounds);
    if (!s.dead && aabb(player, s)) {
      player.takeDamage(s.damage);
      s.dead = true;
    }
  }

  // Los muertos sueltan su orbe ANTES de la limpieza in-place
  for (const e of enemies) {
    if (e.isDead) xpSystem.spawnOrb(e.cx, e.cy, e.xpValue);
  }
  session.kills += removeWhere(enemies, (e) => e.isDead);
  removeWhere(projectiles, (p) => p.dead);
  removeWhere(enemyShots, (s) => s.dead);

  xpSystem.update(dt);

  // ¿Subió de nivel? Abrir menú de mejora (uno por nivel encolado)
  if (xpSystem.pendingLevels > 0) {
    xpSystem.pendingLevels--;
    choices = upgrades.rollChoices();
    state = 'levelup';
  }
}

function updateMenu() {
  const biomeKeys = ['mars', 'luna', 'asteroids', 'station'];
  for (let i = 0; i < 4; i++) {
    if (input.consume(`Digit${i + 1}`)) {
      selectedBiome = biomeKeys[i];
      newGame();
      return;
    }
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

  scenario.renderBackground(renderer, elapsed, stars);

  if (xpSystem) xpSystem.render(renderer); // orbes debajo de todo lo vivo
  for (const e of enemies) e.render(renderer);
  for (const p of projectiles) p.render(renderer);
  for (const s of enemyShots) s.render(renderer);
  player.render(renderer);

  scenario.renderForeground(renderer);

  renderHud();

  if (state === 'levelup') renderLevelUpMenu();
}

function renderHud() {
  // Barra de XP: franja fina arriba de todo (clásico del género)
  const xpPct = xpSystem.xp / xpSystem.xpToNext;
  renderer.rect(0, 0, VIEW_W, 4, '#1c2030');
  renderer.rect(0, 0, VIEW_W * xpPct, 4, '#ffe44f');

  // Barra de HP
  const pct = player.hp / player.stats.hp;
  renderer.rect(10, 10, 150, 14, '#1c2030');
  renderer.rect(10, 10, 150 * pct, 14, pct > 0.3 ? '#39ff14' : '#ff4f30');
  renderer.text(`HP ${player.hp}/${player.stats.hp}`, 14, 21, '#05050a', 11);
  renderer.text(`Nv ${xpSystem.level}`, 170, 21, '#ffe44f', 12);

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
    renderer.rect(0, 0, 960, 540, 'rgba(5, 5, 10, 0.88)');
    renderer.text('SPACE MOUNT', 350, 80, '#39ff14', 28);
    renderer.text('Elige tu bioma (1-4)', 350, 130, '#ffe44f', 18);

    renderer.rect(20, 200, 920, 50, '#141a2e');
    renderer.rect(20, 260, 920, 50, '#141a2e');
    renderer.rect(20, 320, 920, 50, '#141a2e');
    renderer.rect(20, 380, 920, 50, '#141a2e');

    renderer.text('1 - Marte (spawn agresivo)', 40, 220, '#ffe44f', 16);
    renderer.text('2 - Luna (baja gravedad)', 40, 280, '#ffe44f', 16);
    renderer.text('3 - Asteroides (rocas)', 40, 340, '#ffe44f', 16);
    renderer.text('4 - Estacion (arena cerrada)', 40, 400, '#ffe44f', 16);
  } catch (e) {
    renderer.text('ERROR EN MENU', 100, 100, '#ff0000', 16);
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
  get combat() { return combat; },
  get xpSystem() { return xpSystem; },
  get upgrades() { return upgrades; },
  get scenario() { return scenario; },
  get state() { return state; },
  get choices() { return choices; },
};
