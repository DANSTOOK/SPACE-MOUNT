# 🔨 Cómo Buildear Space Mount.exe

## ⚡ Opción 1: Usar el Script de Build (Recomendado)

### Paso 1: Instalar Node.js
Si no tienes Node.js instalado:
1. Descarga desde: https://nodejs.org/ (versión LTS)
2. Instala normalmente (siguiente, siguiente...)

### Paso 2: Abrir Terminal en la Carpeta del Proyecto
1. Abre el Explorador de Archivos
2. Navega a la carpeta de Space Mount
3. Haz click derecho → "Abrir PowerShell aquí" (o Terminal)

### Paso 3: Instalar Dependencias
Copia y pega este comando:
```powershell
npm install
```

Espera a que termine (puede tomar 2-3 minutos)

### Paso 4: Buildear el Ejecutable
Copia y pega este comando:
```powershell
npm run build
```

El ejecutable se creará en: `dist/Space Mount.exe`

---

## 🎮 Ejecutar el Juego

### Opción A: Desde el Ejecutable (.exe)
1. Ve a la carpeta `dist/`
2. Haz doble-clic en `Space Mount.exe`
3. ¡Juega!

### Opción B: Modo Desarrollo (sin build)
Si solo quieres testear:
```powershell
npm start
```

Se abrirá la ventana de Electron directamente

---

## 📦 Lo que incluye el Ejecutable

✅ Juego completo (standalone.html)
✅ Sin necesidad de servidor
✅ Sin necesidad de navegador externo
✅ Funciona completamente offline
✅ Ventana nativa de Windows
✅ ~150 MB (el ejecutable es portable)

---

## 🛠️ Solución de Problemas

### "npm: The term 'npm' is not recognized"
- Node.js no está instalado correctamente
- Reinstala Node.js y reinicia la terminal

### "node_modules no encontrado"
- Asegúrate de correr `npm install` primero
- Espera a que termine completamente

### El .exe no se abre
- Intenta desde Command Prompt en lugar de PowerShell
- Verifica que tu antivirus no lo bloquea

### El juego se abre pero está en blanco
- Cierra y vuelve a abrir
- Verifica que `standalone.html` esté en la carpeta raíz

---

## 📝 Estructura del Proyecto para Build

```
space-mount/
├── electron-main.js       ← Punto de entrada
├── standalone.html        ← Juego completo
├── package.json           ← Config de Electron
├── BUILD.md               ← Este archivo
└── [otros archivos]
```

---

## ⏱️ Tiempo de Build

- Primera vez: ~5 minutos (descarga Electron)
- Siguientes veces: ~1 minuto

---

**¡Disfruta Space Mount! 🚀**
