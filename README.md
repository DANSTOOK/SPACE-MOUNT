# Space Mount 🚀

Un roguelike-survivor espacial con mecánicas únicas y progresión paulatina.

## 🎮 Cómo Jugar

### Opción 1: Directamente en el Navegador (Sin Servidor)
Simplemente **abre el archivo `standalone.html`** en tu navegador favorito:
- Descarga o clona este repositorio
- Busca el archivo `standalone.html` en la carpeta raíz
- **Haz doble-clic** en él para abrirlo en tu navegador
- ¡Listo! El juego cargará sin necesidad de servidor

### Opción 2: Con Servidor Local (Desarrollo)
Si quieres ejecutar desde el servidor local:
```bash
python dev-server.py
# Luego abre http://localhost:8778
```

## 🎯 Objetivo del Juego

Sobrevive el mayor tiempo posible enfrentándote a oleadas de enemigos espaciales. Recoge mejoras (upgrades), aumenta tu nivel, y desbloquea habilidades destructivas.

## 🕹️ Controles

### Movimiento
- **WASD** o **Flechas** - Movimiento unidireccional
- **Espacio** - Dash defensivo (esquivo rápido)

### Combate
- **Click izquierdo** - Activa tu habilidad actual
- **1-6** - Cambiar entre habilidades
- **Números 1-3** - Seleccionar upgrades en Level Up

### Menú
- **Números 1-3** - Seleccionar opciones del menú principal
- **Números 1-4** - Seleccionar bioma

### Desarrollo
- **~** o **F12** - Abre DevConsole (para tweaking de parámetros)
- **X** - Exportar configuración (DevConsole)
- **V** - Importar configuración (DevConsole)

## 🔥 Características

✅ **Menú Principal Interactivo** - Play/Options/Quit con soporte mouse + teclado
✅ **4 Biomas Únicos** - Marte, Luna, Asteroides, Estación Espacial
✅ **Sistema de Spawn Gradual** - Enemigos diferentes aparecen paulatinamente:
  - Enemigos normales: Al inicio
  - Parásitos: 45s
  - Brutes (élite): 75s
  - Drones: 120s
  - Chargers: 180s
  - Splitters: 240s

✅ **6 Habilidades Destructivas** - Con cooldowns y efectos especiales:
1. **Pulso de Radiación** (5s) - Explosión en área
2. **Rayo Láser** (6s) - Disparo direccional
3. **Agujero Negro** (7s) - Atrae y daña
4. **Escudo Temporal** (4s) - Invulnerabilidad 2s
5. **Explosión Nuclear** (8s) - Daño masivo
6. **Tormenta Plasma** (7s) - Área persistente 3s

✅ **Sistema de Combo Meter** - Daño escala hasta x2.0 por golpes consecutivos
✅ **Sistema de Dash Defensivo** - Movimiento rápido con invulnerabilidad temporal
✅ **Sistema XP Mejorado** - Orbes magnéticos, bosses dropean 60 XP
✅ **Upgrades en Level-up** - Selecciona entre 3 opciones al subir nivel
✅ **DevConsole** - Tweaking en tiempo real de parámetros del juego

## 📦 Archivos Importantes

- **standalone.html** - Versión autocontenida (sin servidor)
- **index.html** - Versión modular (requiere servidor)
- **main.js** - Punto de entrada del juego
- **bundle-standalone-v2.mjs** - Script generador del bundle standalone

## 🔧 Desarrollo

Para hacer cambios y regenerar el bundle standalone:
```bash
node bundle-standalone-v2.mjs
```

## 📊 Especificaciones Técnicas

- **Resolución**: 960x540 (16:9)
- **Engine**: HTML5 Canvas vanilla JavaScript
- **Arquitectura**: Entity-Component con sistemas especializados
- **Estado del Juego**: State machine (main_menu → menu → playing ↔ levelup)
- **Input**: Teclado + Mouse con cache-busting de módulos

## 🎨 Estilo Visual

- Minimalista con neón (sin textures)
- Pixel art simple pero efectivo
- Colores por bioma y por entidad
- Números de daño flotantes
- Partículas de efectos

## 📈 Progresión del Juego

1. **Fase 1** (0-20s): Solo enemigos normales
2. **Fase 2** (20-75s): Introducción gradual de tipos
3. **Fase 3** (75s+): Variedad completa de enemigos
4. **Boss Strikes**: Cada 45s aparece un jefe

## 💻 Requisitos

- **Navegador moderno** con soporte HTML5 Canvas
- **JavaScript ES6+**
- **Sin dependencias externas** ✨

## 📝 Licencia

Este proyecto es de código abierto.

## 🤝 Contribuciones

¿Encontraste un bug o tienes una idea? ¡Abre un issue o PR en GitHub!

---

**Creado con ❤️ para Space Survivors**
