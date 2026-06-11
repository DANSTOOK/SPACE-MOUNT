import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leer archivos en orden de dependencia
const files = [
  'utils/helpers.js',
  'engine/renderer.js',
  'engine/gameLoop.js',
  'engine/input.js',
  'entities/player.js',
  'entities/enemy.js',
  'entities/projectile.js',
  'systems/spawn.js',
  'systems/combat.js',
  'systems/xpSystem.js',
  'systems/upgrades.js',
  'systems/scenarios.js',
  'systems/effects.js',
  'systems/devConsole.js',
  'systems/menuSystem.js',
  'systems/abilitySystem.js',
  'main.js',
];

// Función para convertir módulos ES6 a IIFE global
function convertToGlobal(content, filename) {
  // Extraer nombre del módulo (ej: helpers, renderer, etc)
  const baseName = path.basename(filename, '.js');

  // Remover imports/exports y convertir a IIFE
  content = content
    .replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*['"]/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]*\.js.*['"]/g, '')
    .replace(/export\s+(class|function|const)\s+/g, 'window.$1 ');

  return content;
}

// Leer CSS
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');

// Leer HTML base
const htmlBase = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

// Extraer canvas y scripts
let jsContent = '(function() {\n';

// Agregar cada archivo JS
for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const converted = convertToGlobal(content, file);
    jsContent += `\n// === ${file} ===\n`;
    jsContent += converted + '\n';
  }
}

jsContent += '})();\n';

// Crear HTML standalone
const standalone = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Mount</title>
  <style>
${css}
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
${jsContent}
  </script>
</body>
</html>`;

// Escribir archivo standalone
fs.writeFileSync(path.join(__dirname, 'standalone.html'), standalone);
console.log('✅ standalone.html generado exitosamente en:', path.join(__dirname, 'standalone.html'));
