# Sistema de Hazards Ambientales - Space Mount

## 🌌 Visión General

El entorno es un jugador más. Space Mount implementa un sistema dinámico de peligros ambientales que evolucionan en **3 fases progresivas**, creando dinámicas emergentes de gameplay.

---

## 📊 Fases de Progresión

### **FASE 1 (10s - 60s): Introducción al Caos**

Primeros hazards simples pero efectivos. El jugador aprende a reaccionar al entorno.

#### Meteoritos Cayendo
```
- Caen del cielo cada 10 segundos
- Advertencia de 0.8s (parpadea) antes de caer
- Daño: 15 HP (mata enemigos instantáneamente)
- Radio: 40px
- Visual: rectángulo naranja parpadean
- Estrategia: esquivar temprano, usar para destruir enemigos
```

#### Radiación Solar
```
- Zona circular que aparece cada 45s
- Daña: 2 HP/s si está dentro
- Duración: 15 segundos
- Radio: 150px
- Visual: círculo rojo/naranja pulsante
- Estrategia: moverse constante, zona segura en otro lado del mapa
```

#### Viento Solar
```
- Empuja al jugador y enemigos en dirección aleatoria
- Fuerza: 200 px/s
- Duración: 8 segundos
- Cambio de dirección: cada 15 segundos
- Visual: líneas azul cian moviéndose
- Estrategia: contraatacar con movimiento, enemigos se desorganizan
- Bonus: usar para empujar enemigos a trampas
```

#### Asteroides Móviles
```
- Ya existentes, ahora más interactivos
- Se ven afectados por hazards (explotan con meteoritos)
- Crean dinámica de "balística environmental"
```

---

### **FASE 2 (60s - 120s): Complejidad Media**

Hazards más complejos que requieren táctica. El mapa se vuelve "puzzle" dinámico.

#### Campos de Gravedad (LOW GRAVITY)
```
- Zona que ralentiza: 0.5x velocidad
- Radio: 180px
- Duración: 12 segundos
- Cooldown: 60 segundos
- Visual: círculo azul claro pulsante
- Efecto: ambos (jugador y enemigos) se ralentizan igual
- Estrategia: 
  - Escapar si estás en desventaja
  - Usarlo para "parking" de enemigos
  - Dash es más valioso aquí (velocidad fija)
```

#### Agujeros Negros
```
- Atrae todo hacia el centro
- Fuerza de atracción: 250 px/s
- Daño: 1 HP/s dentro
- Duración: 15 segundos
- Radio: 200px
- Visual: círculo negro con borde cian (evento horizonte)
- Estrategia:
  - Uso ofensivo: agrupar enemigos
  - Uso defensivo: escape rápido antes de ser jalado
  - Puede ser trampa si queda atrapado
```

#### Barreras de Energía
```
- Rectángulo que bloquea movimiento
- No atravesable por nada
- Duración: 30 segundos
- Visual: rectángulo verde con esquinas pulsantes
- Efecto táctica: crea "laberintos" dinámicos
- Estrategia:
  - Planificar ruta de escape
  - Usar para boxear enemigos
  - Bloquea tus propios projectiles
```

---

### **FASE 3 (120s+): Caos Total**

El mapa se vuelve literalmente inestable. Sobrevivir es cuestión de adaptación constante.

#### Distorsiones Espaciales
```
- Zona donde el tiempo va 0.5x lento
- TODO se ralentiza (jugador, enemigos, projectiles)
- Radio: 220px
- Duración: 20 segundos
- Visual: área magenta/púrpura ondulante
- Estrategia:
  - Usarlo para esquivar ataques (todo cae lento)
  - Difícil de escapar una vez dentro
  - Puede ser ventaja o trampa según situación
```

#### Portales de Gusano
```
- Aparecer en pares (entrada/salida)
- Teletransportan al otro portal
- Pueden estar muy lejos
- Radio: 60px (pequeño, difícil de encontrar)
- Duración: 25 segundos
- Visual: espiral púrpura/violeta
- Estrategia:
  - Escape rápido
  - O atrapar enemigos
  - Paired mechanics: descubrir dónde salen
```

#### Ondas Nucleares Residuales
```
- Onda expandiéndose desde un punto
- Empieza pequeña: 20px
- Expande hasta: 250px (100 px/s)
- Daño: 3 HP/s dentro
- Duración: 25 segundos
- Visual: onda amarilla expandiéndose con borde brillante
- Estrategia:
  - Moverse radialmente (adentro/afuera)
  - No se puede quedarse en el mismo lugar
  - Fuerza movimiento y acción
```

---

## 🔄 Ciclo de Hazards

```
Tiempo (segundos)  | Hazards Activos      | Dificultad
0-10               | Ninguno              | Solo enemigos
10-60              | Fase 1 (3-4)         | Moderado
60-120             | Fase 1 + Fase 2 (5-6)| Difícil
120+               | Todas (8-9)          | CAOS
```

Cada hazard tiene su propio cooldown, por lo que no todos aparecen simultáneamente.

---

## 📈 Dinámicas Emergentes

### **Jugador**
- **Reacción**: debe evitar/usar hazards
- **Táctica**: elegir cuándo luchar vs. moverse
- **Movimiento**: más importante que en muchos roguelikes

### **Enemigos**
- **Comportamiento**: se afectan igual que el jugador
- **Oportunidad**: hazards mata enemigos (meteoritos)
- **Desorganización**: viento solar los empuja

### **Entorno Vivo**
- **Cambio**: mapa evoluciona cada 15-50 segundos
- **Presión**: obliga a estar en movimiento
- **Puzzle**: "¿Dónde es seguro ahora?"

---

## 🎮 Ejemplo de Partida

```
TIEMPO    EVENTO
0:10s     Primer meteorito cae (jugador esquiva)
0:25s     Radiación solar aparece en esquina → jugador se mueve
0:40s     Viento solar empuja norte → enemigos vuelan
1:00      FASE 2 activa - Campo gravedad aparece
1:15      Agujero negro cerca de enemigos → jugador usa para agruparlos
2:00      FASE 3 activa - Distorsión espacial aparece
2:30      Onda nuclear expande → caos total
3:00+     Múltiples hazards simultáneos → sobrevivir es victoria
```

---

## 💡 Implementación Técnica

### **Archivo**
- `systems/hazards.js` - Sistema modular completo

### **Clases**
- `Hazard` - Una instancia individual
- `HazardSystem` - Manager de todos los hazards

### **Métodos Clave**
- `applyEffect(entity, dt)` - Qué daño/efecto hace a entidad
- `render(r)` - Visualización
- `getAvailableHazards(elapsed)` - Qué hazards aparecen según tiempo

### **Integración**
- `main.js` importa y actualiza HazardSystem
- Los efectos se aplican al player y enemigos cada frame
- El rendering ocurre en mundo (transformado por cámara)

---

## 🚀 Extensión Futura

Hazards adicionales ya listados en ROADMAP pero no implementados:
- Estructuras de hielo (Luna)
- Grietas volcánicas (Marte)
- Túneles y pasajes (Asteroides)
- Sistemas de defensa de Estación
- Ciclos ambientales más complejos

---

## 📊 Balance

**Fase 1**: ~3-4 hazards simultáneos max
**Fase 2**: ~5-6 hazards simultáneos max
**Fase 3**: ~8-9 hazards simultáneos max

Cooldowns están diseñados para que NO todo aparezca de golpe.

El entorno es challenge pero no injusto.

---

**Commit**: `c34fc5b` (Fase 1) + `40e8561` (Fase 2 & 3)
**Archivo**: `systems/hazards.js` (370+ líneas)
**Status**: ✅ Listo en producción
