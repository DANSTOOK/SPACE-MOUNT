// AbilitySystem: habilidades destructivas masivas con cooldown
// Se disparan con click izquierdo (botón de mouse)
// Cada habilidad consume toda la barra y vuelve a cargar

export const ABILITIES = {
  pulso_radiacion: {
    name: 'Pulso de Radiación',
    cooldown: 5,
    damage: 50,
    radius: 180,
    color: '#ff00ff',
    description: 'Explosión en área que daña todos',
  },
  rayo_laser: {
    name: 'Rayo Láser',
    cooldown: 6,
    damage: 80,
    radius: 0, // línea recta
    color: '#00ffff',
    description: 'Dispara rayo destructivo adelante',
  },
  agujero_negro: {
    name: 'Agujero Negro',
    cooldown: 7,
    damage: 60,
    radius: 200,
    pull: true, // atrae enemigos
    color: '#000000',
    description: 'Atrae y daña enemigos cercanos',
  },
  escudo_temporal: {
    name: 'Escudo Temporal',
    cooldown: 4,
    duration: 2,
    color: '#00ff88',
    description: 'Invulnerabilidad por 2 segundos',
  },
  explosion_nuclear: {
    name: 'Explosión Nuclear',
    cooldown: 8,
    damage: 120,
    radius: 250,
    color: '#ffaa00',
    description: 'Destruye todo en área masiva',
  },
  tormenta_plasma: {
    name: 'Tormenta Plasma',
    cooldown: 7,
    damage: 40,
    duration: 3,
    radius: 150,
    color: '#ff44ff',
    description: 'Área de daño que persiste 3s',
  },
};

export class AbilitySystem {
  constructor(player) {
    this.player = player;
    this.currentAbility = null;
    this.abilityIndex = 0;
    this.cooldown = 0;
    this.maxCooldown = 5; // cooldown inicial
    this.activeAreas = []; // áreas de daño persistentes
  }

  // Cambiar habilidad con números (1-6)
  selectAbility(index) {
    const keys = Object.keys(ABILITIES);
    if (index >= 0 && index < keys.length) {
      this.abilityIndex = index;
      this.currentAbility = ABILITIES[keys[index]];
      this.maxCooldown = this.currentAbility.cooldown;
      return this.currentAbility.name;
    }
  }

  // Triggear habilidad con click izquierdo
  activate(enemies, effects) {
    if (this.cooldown > 0) return false;

    const ability = this.currentAbility;
    if (!ability) return false;

    const player = this.player;
    const cx = player.cx;
    const cy = player.cy;

    // Escudo temporal: invulnerabilidad
    if (ability.name === 'Escudo Temporal') {
      player.invulnTimer = ability.duration;
      if (effects) {
        effects.burst(cx, cy, ability.color, 12);
      }
    }
    // Tormenta Plasma: área persistente de daño
    else if (ability.name === 'Tormenta Plasma') {
      this.activeAreas.push({
        cx, cy,
        radius: ability.radius,
        damage: ability.damage,
        duration: ability.duration,
        maxDuration: ability.duration,
        color: ability.color,
      });
      if (effects) {
        effects.burst(cx, cy, ability.color, 16);
      }
    }
    // Agujero Negro: atrae y daña
    else if (ability.name === 'Agujero Negro') {
      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = cx - e.cx;
        const dy = cy - e.cy;
        const dist = Math.hypot(dx, dy) || 1;

        // Atraer
        if (dist < ability.radius) {
          const pull = 200; // velocidad de atracción en px/s
          e.x += (dx / dist) * pull * 0.016;
          e.y += (dy / dist) * pull * 0.016;
          e.takeDamage(ability.damage / 20); // daño gradual
        }
      }
      if (effects) {
        effects.burst(cx, cy, ability.color, 20);
      }
    }
    // Rayo Láser: línea recta
    else if (ability.name === 'Rayo Láser') {
      const dirX = player.facingX;
      const dirY = player.facingY;
      const rayLength = 400;

      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.cx - cx;
        const dy = e.cy - cy;
        const dotProduct = (dx * dirX + dy * dirY);

        // Está en el rayo si dot > 0 y distancia perpendicular es pequeña
        if (dotProduct > 0 && dotProduct < rayLength) {
          const perpDist = Math.abs(-dy * dirX + dx * dirY);
          if (perpDist < 30) {
            e.takeDamage(ability.damage);
          }
        }
      }
      if (effects) {
        // Dibujar línea del rayo
        for (let i = 0; i < rayLength; i += 20) {
          effects.burst(cx + dirX * i, cy + dirY * i, ability.color, 1);
        }
      }
    }
    // Resto: explosión en área
    else {
      const radiusSq = ability.radius ** 2;
      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.cx - cx;
        const dy = e.cy - cy;
        if (dx * dx + dy * dy <= radiusSq) {
          e.takeDamage(ability.damage);
        }
      }
      if (effects) {
        effects.burst(cx, cy, ability.color, 24);
      }
    }

    // Iniciar cooldown
    this.cooldown = this.maxCooldown;
    return true;
  }

  update(dt, input) {
    if (this.cooldown > 0) this.cooldown -= dt;

    // Actualizar áreas persistentes
    for (const area of this.activeAreas) {
      area.duration -= dt;
    }
    this.activeAreas = this.activeAreas.filter(a => a.duration > 0);
  }

  render(r, VIEW_W, VIEW_H) {
    const ability = this.currentAbility;
    if (!ability) return;

    // Barra de cooldown del ability (lado derecho, debajo del dash)
    const barW = 120;
    const barX = VIEW_W - barW - 10;
    const barY = 70; // debajo del dash bar
    const cooldownPct = 1 - (this.cooldown / this.maxCooldown);

    r.rect(barX, barY, barW, 8, '#1c2030');
    r.rect(barX, barY, barW * cooldownPct, 8, cooldownPct >= 1 ? ability.color : '#666');
    r.text('ABILITY', barX, barY + 18, cooldownPct >= 1 ? ability.color : '#666', 9);

    // Nombre de la ability en el HUD
    r.text(`[${this.abilityIndex + 1}] ${ability.name}`, 10, VIEW_H - 30, ability.color, 11);
    r.text('Click izq para activar (1-6 para cambiar)', 10, VIEW_H - 15, '#888', 9);
  }

  // Debug: listar abilities
  listAbilities() {
    return Object.values(ABILITIES).map(a => a.name);
  }
}
