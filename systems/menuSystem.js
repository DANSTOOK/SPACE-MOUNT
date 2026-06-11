// MenuSystem: menús interactivos con mouse
// Menú principal (Play/Options/Quit) → Selección de bioma (1-4)

export class MenuSystem {
  constructor() {
    this.screen = 'main'; // 'main' | 'biome_select'
    this.selectedBiome = 0;
    this.selectedMainMenu = 0; // 0=Play, 1=Options, 2=Quit
    this.hoveredMainMenu = -1;
    this.hoveredBiome = -1;

    this.mainMenuOptions = [
      { label: 'JUGAR', color: '#39ff14' },
      { label: 'OPCIONES', color: '#ffe44f' },
      { label: 'SALIR', color: '#ff4f30' },
    ];

    this.biomes = [
      { key: 'mars', label: 'Marte', desc: '(spawn agresivo)', color: '#ff3864' },
      { key: 'luna', label: 'Luna', desc: '(baja gravedad)', color: '#7db4ff' },
      { key: 'asteroids', label: 'Asteroides', desc: '(rocas)', color: '#ffe44f' },
      { key: 'station', label: 'Estación', desc: '(arena cerrada)', color: '#39ff14' },
    ];
    this.hoveredBiome = -1;
  }

  update(input, mouseX, mouseY) {
    if (this.screen === 'main') {
      return this.updateMainMenu(input, mouseX, mouseY);
    } else if (this.screen === 'biome_select') {
      return this.updateBiomeSelect(input, mouseX, mouseY);
    }
    return null;
  }

  updateMainMenu(input, mouseX, mouseY) {
    // Teclado: 1-3
    for (let i = 0; i < 3; i++) {
      if (input.consume(`Digit${i + 1}`)) {
        if (i === 0) { // JUGAR
          this.screen = 'biome_select';
        } else if (i === 2) { // SALIR
          return 'QUIT';
        }
        return null;
      }
    }

    // Mouse: detectar hover y click
    this.hoveredMainMenu = this.getHoveredMainMenu(mouseX, mouseY);
    if (input.mouseClick && !input.mouseClickConsumed && this.hoveredMainMenu >= 0) {
      input.mouseClickConsumed = true;
      if (this.hoveredMainMenu === 0) { // JUGAR
        this.screen = 'biome_select';
      } else if (this.hoveredMainMenu === 2) { // SALIR
        return 'QUIT';
      }
    }

    return null;
  }

  updateBiomeSelect(input, mouseX, mouseY) {
    // Teclado: 1-4
    for (let i = 0; i < 4; i++) {
      if (input.consume(`Digit${i + 1}`)) {
        this.selectedBiome = i;
        return this.biomes[i].key;
      }
    }

    // Mouse: detectar hover y click
    this.hoveredBiome = this.getHoveredBiome(mouseX, mouseY);
    if (input.mouseClick && !input.mouseClickConsumed && this.hoveredBiome >= 0) {
      input.mouseClickConsumed = true;
      this.selectedBiome = this.hoveredBiome;
      return this.biomes[this.hoveredBiome].key;
    }

    return null;
  }

  getHoveredMainMenu(mouseX, mouseY) {
    const buttonW = 200;
    const buttonH = 50;
    const gap = 30;
    const totalW = 3 * buttonW + 2 * gap;
    const startX = (960 - totalW) / 2; // centrado
    const startY = 300;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (buttonW + gap);
      if (mouseX >= x && mouseX <= x + buttonW &&
          mouseY >= startY && mouseY <= startY + buttonH) {
        return i;
      }
    }
    return -1;
  }

  getHoveredBiome(mouseX, mouseY) {
    const cardW = 920;
    const cardH = 40;
    const startX = 20;
    const gap = 45;

    for (let i = 0; i < 4; i++) {
      const y = 140 + i * (cardH + gap);
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

    if (this.screen === 'main') {
      this.renderMainMenu(r, VIEW_W, VIEW_H);
    } else if (this.screen === 'biome_select') {
      this.renderBiomeSelect(r, VIEW_W, VIEW_H);
    }
  }

  renderMainMenu(r, VIEW_W, VIEW_H) {
    r.text('Bienvenido', VIEW_W / 2 - 50, 150, '#ffe44f', 20);

    const buttonW = 200;
    const buttonH = 50;
    const gap = 30;
    const totalW = 3 * buttonW + 2 * gap;
    const startX = (VIEW_W - totalW) / 2;
    const startY = 300;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (buttonW + gap);
      const isHovered = this.hoveredMainMenu === i;
      const option = this.mainMenuOptions[i];

      // Button background
      const bgColor = isHovered ? 'rgba(50, 80, 150, 0.8)' : '#141a2e';
      r.rect(x, startY, buttonW, buttonH, bgColor);

      // Border
      const borderColor = isHovered ? option.color : '#444';
      r.rect(x, startY, buttonW, 2, borderColor);

      // Text
      r.text(option.label, x + 20, startY + 30, option.color, 16);
    }

    // Instructions
    r.text('1-3 o click para seleccionar', VIEW_W / 2 - 140, VIEW_H - 40, '#7df9ff', 12);
  }

  renderBiomeSelect(r, VIEW_W, VIEW_H) {
    r.text('Elige tu bioma (1-4 o click)', VIEW_W / 2 - 140, 110, '#ffe44f', 18);

    // Cards de biomas
    const cardW = 920;
    const cardH = 40;
    const startX = 20;
    const gap = 45;

    for (let i = 0; i < 4; i++) {
      const y = 140 + i * (cardH + gap);
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
