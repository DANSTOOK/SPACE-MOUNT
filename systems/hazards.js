// Sistema de Hazards Ambientales Espaciales
// Dinámicas que hacen del entorno un jugador más en el juego

import { aabb } from '../utils/helpers.js';

const HAZARD_TYPES = {
  // Fase 1
  radiation_zone: {
    name: 'radiacion',
    cooldown: 45,  // aparece cada 45s
    duration: 15,  // dura 15s
    radius: 150,
    damage: 2,     // hp/s dentro
    color: '#ff6633',
    opacity: 0.15,
  },
  falling_meteor: {
    name: 'meteorito',
    cooldown: 10,  // cada 10s
    duration: 1,   // cae rápido
    radius: 40,
    damage: 15,
    color: '#ffaa00',
  },
  solar_wind: {
    name: 'viento',
    cooldown: 15,
    duration: 8,
    force: 200,    // px/s empuje
    color: '#00ccff',
  },
  // Fase 2
  gravity_field: {
    name: 'gravedad',
    cooldown: 60,
    duration: 12,
    radius: 180,
    speedMult: 0.5,  // LOW_GRAVITY
    color: '#66ccff',
    type: 'low',
  },
  black_hole: {
    name: 'agujero',
    cooldown: 90,
    duration: 15,
    radius: 200,
    pullForce: 250,  // fuerza de atracción
    damage: 1,       // hp/s dentro
    color: '#000000',
  },
  // Fase 3
  space_distortion: {
    name: 'distorsion',
    cooldown: 120,
    duration: 20,
    radius: 220,
    timeMult: 0.5,   // 0.5x velocidad
    color: '#ff00ff',
  },
};

export class Hazard {
  constructor(type, cx, cy) {
    const def = HAZARD_TYPES[type];
    this.type = type;
    this.def = def;
    this.cx = cx;
    this.cy = cy;
    this.remainingTime = def.duration;
    this.maxTime = def.duration;

    // Para meteoritos: tiempo antes de caer
    if (type === 'falling_meteor') {
      this.warningTime = 0.8;  // aparece 0.8s antes de caer
      this.hasLanded = false;
    }

    // Para viento: dirección
    if (type === 'solar_wind') {
      this.angle = Math.random() * Math.PI * 2;
      this.windX = Math.cos(this.angle);
      this.windY = Math.sin(this.angle);
    }
  }

  get isDead() {
    return this.remainingTime <= 0;
  }

  update(dt) {
    this.remainingTime -= dt;
  }

  // Aplica efecto a entidad (jugador o enemigo)
  applyEffect(entity, dt) {
    const dx = entity.cx - this.cx;
    const dy = entity.cy - this.cy;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.type === 'radiation_zone' && dist < this.def.radius) {
      return { damage: this.def.damage * dt };
    }

    if (this.type === 'black_hole' && dist < this.def.radius) {
      const pull = this.def.pullForce;
      const nx = -dx / dist;
      const ny = -dy / dist;
      return {
        pushX: nx * pull * dt,
        pushY: ny * pull * dt,
        damage: this.def.damage * dt,
      };
    }

    if (this.type === 'gravity_field' && dist < this.def.radius) {
      const alpha = 1 - (dist / this.def.radius);  // más fuerte al centro
      return { speedMult: 1 - (1 - this.def.speedMult) * alpha };
    }

    if (this.type === 'solar_wind') {
      return {
        pushX: this.windX * this.def.force * dt,
        pushY: this.windY * this.def.force * dt,
      };
    }

    if (this.type === 'space_distortion' && dist < this.def.radius) {
      return { timeMult: this.def.timeMult };
    }

    return {};
  }

  // Detectar colisión para meteorito
  hitsEntity(entity) {
    if (this.type === 'falling_meteor' && this.hasLanded) {
      return aabb(
        { x: this.cx - this.def.radius, y: this.cy - this.def.radius,
          w: this.def.radius * 2, h: this.def.radius * 2 },
        entity
      );
    }
    return false;
  }

  render(r) {
    const alpha = Math.max(0, this.remainingTime / this.maxTime);

    if (this.type === 'radiation_zone') {
      const color = `rgba(255, 102, 51, ${this.def.opacity * alpha})`;
      r.rect(
        this.cx - this.def.radius, this.cy - this.def.radius,
        this.def.radius * 2, this.def.radius * 2,
        color
      );
      // Borde pulsante
      const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
      r.rect(
        this.cx - this.def.radius - 2, this.cy - this.def.radius - 2,
        this.def.radius * 2 + 4, 2,
        `rgba(255, 102, 51, ${alpha * (0.5 + pulse * 0.5)})`
      );
    }

    if (this.type === 'falling_meteor') {
      // Meteorito cayendo: rectángulo moviéndose hacia abajo
      if (!this.hasLanded) {
        const sz = this.def.radius * 2;
        const blink = this.warningTime > 0 && Math.sin(this.warningTime * 10) > 0;
        r.rect(
          this.cx - sz / 2, this.cy - sz / 2, sz, sz,
          blink ? '#ffaa00' : 'rgba(255, 170, 0, 0.6)'
        );
        // Indicador de dónde cae
        r.rect(this.cx - 20, 520, 40, 2, '#ff6600');
      }
    }

    if (this.type === 'solar_wind') {
      // Líneas de viento azules
      const numLines = 5;
      for (let i = 0; i < numLines; i++) {
        const offX = this.windX * 200;
        const offY = this.windY * 200;
        const startX = this.cx - this.windX * 300 + (Math.random() - 0.5) * 100;
        const startY = this.cy - this.windY * 300 + (Math.random() - 0.5) * 100;
        r.rect(startX, startY, 60, 2, `rgba(0, 204, 255, ${0.3 * alpha})`);
      }
    }

    if (this.type === 'black_hole') {
      // Círculo negro con efecto de succión
      r.rect(
        this.cx - this.def.radius, this.cy - this.def.radius,
        this.def.radius * 2, this.def.radius * 2,
        `rgba(0, 0, 0, ${0.4 * alpha})`
      );
      // Borde brillante (efecto evento horizonte)
      r.rect(
        this.cx - this.def.radius - 2, this.cy - this.def.radius - 2,
        this.def.radius * 2 + 4, 3,
        `rgba(100, 200, 255, ${alpha})`
      );
    }

    if (this.type === 'gravity_field') {
      const color = `rgba(102, 204, 255, ${0.12 * alpha})`;
      r.rect(
        this.cx - this.def.radius, this.cy - this.def.radius,
        this.def.radius * 2, this.def.radius * 2,
        color
      );
    }

    if (this.type === 'space_distortion') {
      // Efecto de distorsión: líneas ondulantes
      const waveSize = Math.sin(Date.now() / 200) * 10;
      r.rect(
        this.cx - this.def.radius, this.cy - this.def.radius,
        this.def.radius * 2, this.def.radius * 2,
        `rgba(255, 0, 255, ${0.1 * alpha})`
      );
    }
  }
}

export class HazardSystem {
  constructor() {
    this.hazards = [];
    this.timers = {};  // tracking de timers para cada tipo
    this.elapsedTime = 0;
  }

  // Determinar qué hazards pueden aparecer según tiempo
  getAvailableHazards(elapsed) {
    const phase1 = elapsed >= 10;  // primeros 10s sin hazards
    const phase2 = elapsed >= 60;  // a los 60s, más hazards
    const phase3 = elapsed >= 120; // a los 120s, caos

    const available = [];

    if (phase1) {
      available.push('falling_meteor', 'radiation_zone', 'solar_wind');
    }
    if (phase2) {
      available.push('gravity_field', 'black_hole');
    }
    if (phase3) {
      available.push('space_distortion');
    }

    return available;
  }

  update(dt, world, elapsed) {
    this.elapsedTime = elapsed;

    // Actualizar hazards existentes
    for (const h of this.hazards) {
      h.update(dt);
      if (h.type === 'falling_meteor' && h.warningTime > 0) {
        h.warningTime -= dt;
        if (h.warningTime <= 0) {
          h.hasLanded = true;
        }
      }
    }

    // Remover hazards muertos
    this.hazards = this.hazards.filter(h => !h.isDead);

    // Generar nuevos hazards
    const available = this.getAvailableHazards(elapsed);
    for (const hazardType of available) {
      if (!this.timers[hazardType]) this.timers[hazardType] = 0;
      this.timers[hazardType] -= dt;

      if (this.timers[hazardType] <= 0) {
        const def = HAZARD_TYPES[hazardType];
        const cx = Math.random() * world.w;
        const cy = Math.random() * world.h;

        // Evitar spawn en centro (donde está el player)
        const distFromCenter = Math.hypot(cx - world.w / 2, cy - world.h / 2);
        if (distFromCenter > 300) {
          this.hazards.push(new Hazard(hazardType, cx, cy));
          this.timers[hazardType] = def.cooldown;
        }
      }
    }
  }

  render(r) {
    for (const h of this.hazards) {
      h.render(r);
    }
  }
}
