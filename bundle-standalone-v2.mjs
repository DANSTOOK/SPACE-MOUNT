import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Archivos en orden de dependencia
const modules = [
  { file: 'utils/helpers.js', exports: ['clamp', 'removeWhere', 'aabb'] },
  { file: 'engine/renderer.js', exports: ['Renderer', 'VIEW_W', 'VIEW_H'] },
  { file: 'engine/gameLoop.js', exports: ['GameLoop'] },
  { file: 'engine/input.js', exports: ['Input'] },
  { file: 'entities/player.js', exports: ['Player', 'BASE_STATS'] },
  { file: 'entities/enemy.js', exports: ['Enemy', 'ENEMY_TYPES'] },
  { file: 'entities/projectile.js', exports: ['Projectile'] },
  { file: 'systems/spawn.js', exports: ['SpawnSystem'] },
  { file: 'systems/combat.js', exports: ['CombatSystem'] },
  { file: 'systems/xpSystem.js', exports: ['XpSystem'] },
  { file: 'systems/upgrades.js', exports: ['UpgradeSystem'] },
  { file: 'systems/scenarios.js', exports: ['ScenarioSystem', 'BIOMES', 'BIOME_KEYS'] },
  { file: 'systems/effects.js', exports: ['Effects'] },
  { file: 'systems/devConsole.js', exports: ['DevConsole'] },
  { file: 'systems/menuSystem.js', exports: ['MenuSystem'] },
  { file: 'systems/abilitySystem.js', exports: ['AbilitySystem', 'ABILITIES'] },
];

function stripImportsExports(content) {
  // Remover import statements
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*['"]/g, '');
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*\.js\?v=\d+['"]/g, '');

  // Convertir export class/function/const a declaración directa
  content = content.replace(/export\s+(class\s+\w+)/g, '$1');
  content = content.replace(/export\s+(function\s+\w+)/g, '$1');
  content = content.replace(/export\s+(const\s+\w+)/g, '$1');

  // Líneas en blanco extras
  content = content.replace(/^\s*\n/gm, '');

  return content;
}

// Leer CSS
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');

// Construir JavaScript
let jsContent = '(function() {\n';

// Agregar cada módulo
for (const mod of modules) {
  const fullPath = path.join(__dirname, mod.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    content = stripImportsExports(content);
    jsContent += `\n// ============================================\n`;
    jsContent += `// ${mod.file}\n`;
    jsContent += `// ============================================\n`;
    jsContent += content;
    jsContent += '\n';
  }
}

jsContent += '})();\n';

// Leer main.js separado (no dentro del IIFE)
let mainContent = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf-8');
mainContent = stripImportsExports(mainContent);

const finalJs = jsContent + '\n' + mainContent;

// Crear HTML standalone
const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Mount - Standalone</title>
  <style>
${css}
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
${finalJs}
  </script>
</body>
</html>`;

// Escribir archivo
const outPath = path.join(__dirname, 'standalone.html');
fs.writeFileSync(outPath, html);
console.log('✅ Standalone version created successfully!');
console.log(`📦 File: ${outPath}`);
console.log(`📊 Size: ${Math.round(html.length / 1024)}KB`);
console.log('\n💡 You can now open this file directly in your browser without a server!');
console.log(`   Just double-click: ${path.basename(outPath)}`);
