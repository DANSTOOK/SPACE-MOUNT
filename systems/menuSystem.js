// MenuSystem: menú principal interactivo con mouse
// Selecciona bioma con click o teclado (1-4)

export class MenuSystem {
  constructor() {
    this.selectedBiome = 0; // índice del bioma seleccionado
    this.biomes = [
      { key: 'mars', label: 'Marte', desc: '(spawn agresivo)', color: '#ff3864' },
      { key: 'luna', label: 'Luna', desc: '(baja gravedad)', color: '#7db4ff' },
      { key: 'asteroids', label: 'Asteroides', desc: '(rocas)', color: '#ffe44f' },
      { key: 'station', label: 'Estación', desc: '(arena cerrada)', color: '#39ff14' },
    ];
    this.hoveredBiome = -1;
  }

  update(input, mouseX, mouseY) {
    // Teclado: 1-4
    for (let i = 0; i < 4; i++) {
      if (input.consume(`Digit${i + 1}`)) {
        this.selectedBiome = i;
        return this.biomes[i].key;
      }
    }

    // Mouse: detectar hover y click sobre cards
    this.hoveredBiome = this.getHoveredBiome(mouseX, mouseY);
    if (input.mouseClick && this.hoveredBiome >= 0) {
      this.selectedBiome = this.hoveredBiome;
      return this.biomes[this.hoveredBiome].key;
    }

    return null; // sin selección
  }

  getHoveredBiome(mouseX, mouseY) {
    const cardW = 920;
    const cardH = 50;
    const startX = 20;
    const gap = 60;

    for (let i = 0; i < 4; i++) {
      const y = 200 + i * (cardH + gap);
      if (mouseX >= startX && mouseX <= startX + cardW &&
          mouseY >= y && mouseY <= y + cardH) {
        return i;
      }
    }
    return -1;
  }

  render(r, VIEW_W, VIEW_H) {
    // Fondo
    r.rect(0, 0, VIEW_W, VIEW_H, 'rgba(5, 5, 10, 0.95)');

    // Título
    r.text('SPACE MOUNT', VIEW_W / 2 - 140, 80, '#39ff14', 32);
    r.text('Elige tu bioma (1-4 o click)', VIEW_W / 2 - 140, 130, '#ffe44f', 18);

    // Cards de biomas
    const cardW = 920;
    const cardH = 50;
    const startX = 20;
    const gap = 60;

    for (let i = 0; i < 4; i++) {
      const y = 200 + i * (cardH + gap);
      const isHovered = this.hoveredBiome === i;
      const isSelected = this.selectedBiome === i;
      const color = this.biomes[i].color;

      // Card background
      const bgColor = isHovered ? 'rgba(30, 50, 100, 0.8)' : '#141a2e';
      r.rect(startX, y, cardW, cardH, bgColor);

      // Borde (más brillante si está seleccionado o hovered)
      const borderColor = isSelected ? color : (isHovered ? '#7df9ff' : '#444');
      r.rect(startX, y, cardW, 2, borderColor);

      // Número y label
      r.text(`${i + 1} - ${this.biomes[i].label}`, startX + 20, y + 18, color, 16);
      r.text(this.biomes[i].desc, startX + 300, y + 18, '#999', 14);

      // Indicador de selección
      if (isSelected) {
        r.rect(startX + cardW - 30, y + 15, 10, 10, color);
      }
    }

    // Instrucciones abajo
    r.text('Click en un bioma o presiona 1-4 para empezar', VIEW_W / 2 - 200, VIEW_H - 40, '#7df9ff', 12);
  }
}
