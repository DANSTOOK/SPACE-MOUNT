# Instalación y Uso - Space Mount

## 🚀 Opción 1: Abrir Directamente en el Navegador (Recomendado - Sin Servidor)

Esta es la forma **más simple** de jugar. No necesitas instalar nada ni configurar un servidor.

### Pasos:

1. **Descarga el repositorio**
   ```bash
   git clone https://github.com/DANSTOOK/SPACE-MOUNT.git
   cd SPACE-MOUNT
   ```

2. **Abre `standalone.html` en tu navegador**
   - Busca el archivo `standalone.html` en la carpeta del proyecto
   - **Haz doble-clic** en él
   - ¡El juego abrirá inmediatamente en tu navegador!

   O arrastra el archivo a tu navegador favorito.

### Ventajas:
- ✅ No requiere servidor
- ✅ No requiere instalación
- ✅ Funciona offline
- ✅ 100% autocontenido (91KB)

---

## 🖥️ Opción 2: Servir con Servidor Local (Desarrollo)

Si prefieres ejecutar con un servidor local para desarrollo:

### Usando Python 3:
```bash
cd SPACE-MOUNT
python -m http.server 8000
```
Luego abre: **http://localhost:8000**

### Usando Node.js (http-server):
```bash
npm install -g http-server
cd SPACE-MOUNT
http-server
```

### Usando Python dev-server (original):
```bash
python dev-server.py
```
Luego abre: **http://localhost:8778**

---

## 📁 Archivos Importantes

| Archivo | Uso |
|---------|-----|
| **standalone.html** | Versión autocontenida (Sin servidor) ⭐ |
| **index.html** | Versión modular (requiere servidor) |
| **main.js** | Punto de entrada (versión modular) |
| **dev-server.py** | Servidor de desarrollo con cache-busting |

---

## 🎮 Uso del Juego

Una vez abierto, el juego funciona igual sin importar cómo lo ejecutes:

### Menú Principal
- Presiona **1** o haz **click en JUGAR** para comenzar
- Presiona **2** para ver opciones
- Presiona **3** o haz **click en SALIR** para salir

### Selección de Bioma
- Presiona **1-4** para elegir bioma
- O haz **click** en el bioma que quieras

### Gameplay
- **WASD** o **Flechas** = Movimiento
- **Espacio** = Dash defensivo
- **Click izquierdo** = Activar habilidad
- **1-6** = Cambiar habilidad

---

## ⚠️ Resolución de Problemas

### "El juego no carga"
- Intenta actualizar la página (F5)
- Limpia el caché del navegador (Ctrl+Shift+Delete)
- Prueba con otro navegador (Chrome, Firefox, Edge)

### "Veo errores en la consola"
- Abre la consola del navegador (F12)
- Busca mensajes de error rojo
- Reporta el error en GitHub

### "El archivo no se abre"
- Intenta arrastrar el `standalone.html` a tu navegador
- O abre el navegador y arrastra el archivo a la ventana

### "El juego se ve extraño"
- Asegúrate de que tu navegador tiene JavaScript habilitado
- Intenta maximizar la ventana del navegador
- Prueba en pantalla completa (F11)

---

## 🔄 Regenerar el Bundle Standalone

Si haces cambios al código, puedes regenerar el archivo `standalone.html`:

```bash
node bundle-standalone-v2.mjs
```

---

## 📊 Requisitos del Sistema

- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **JavaScript habilitado**
- **Sin dependencias externas**
- **Recomendado**: Pantalla 1024x768 mínimo

### Navegadores Probados:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

---

## 💡 Consejos

1. **Para mejor rendimiento**: Usa Chrome o Chromium
2. **Para jugar offline**: Usa `standalone.html` (no necesita conexión)
3. **Para desarrollar**: Usa el servidor local con live reload
4. **Para compartir**: Solo necesitas compartir `standalone.html` (un archivo!)

---

## 🐛 Reportar Bugs

Si encuentras un problema:

1. Abre [Issues en GitHub](https://github.com/DANSTOOK/SPACE-MOUNT/issues)
2. Describe qué pasó y cuándo
3. Incluye tu navegador y sistema operativo
4. Si es posible, adjunta una screenshot

---

## 🎉 ¡Que disfrutes el juego!

Para más información, ve a [README.md](README.md) o [GitHub](https://github.com/DANSTOOK/SPACE-MOUNT)
