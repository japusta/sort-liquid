/**
 * Класс Renderer отвечает за отрисовку массива пробирок в canvas:
 * - получает на вход состояние tubesState: number[][] (N пробирок × V слотов)
 * - выделяет выбранную ячейку (selected) зелёной рамкой, если она не null
 */
 export default class Renderer {
  private ctx: CanvasRenderingContext2D;

  private static readonly bd_x1: number[] = [3, 10, 17, 24, 31, /* … если V>5, добавить ещё элементы */];
  private static readonly bd_x2: number[] = [95, 88, 81, 75, 68, /* … */];
  private static readonly bd_y:  number[] = [144, 124, 104,  84,  64, /* … */];

  constructor(
    private canvas: HTMLCanvasElement,
    private plsx: number,       // отступ слева до первой колонки пробирок
    private tubeWidth: number,  // ширина ячейки (трубы)
    private tubeHeight: number, // высота ячейки (трубы)
    private widco: number,      // число колонок (сколько пробирок в строке)
    private heim: number        // число строк (сколько рядов пробирок)
  ) {
    this.ctx = canvas.getContext("2d")!;
  }

  /**
   * Рисует текущее состояние
   * фон заливается белым
   * для каждой пробирки k = 0..N−1 вычисляем координаты (row, col)
   *  цветные капли, затем контур пробирки
   * - если передан selected, рисуем зелёную рамку вокруг неё
   *
   * @param tubesState - массив N пробирок, каждая — массив length=V
   * @param selected   - {x, y} или null
   */
  public draw(
    tubesState: number[][],
    selected: { x: number; y: number } | null
  ): void {
    const ctx = this.ctx;

    // заливаем фон белым
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // перебираем все пробирки
    for (let k = 0; k < tubesState.length; k++) {
      const row   = Math.floor(k / this.widco);
      const col   = k % this.widco;
      const slots = tubesState[k];  // slots.length === V

      // рисуем капли — трапеции снизу-вверх

      for (let level = 0; level < slots.length; level++) {
        const colorIdx = slots[level];
        if (colorIdx <= 0) continue;  // 0 = пустой слот

        // точка верхнего ребра трапеции = уровень level
        const topX1 = this.plsx + col * this.tubeWidth + Renderer.bd_x1[level];
        const topX2 = this.plsx + col * this.tubeWidth + Renderer.bd_x2[level];
        const topY  = row * this.tubeHeight + Renderer.bd_y[level];

        // точка нижнего ребра трапеции = уровень level+1
        const botX1 = this.plsx + col * this.tubeWidth + Renderer.bd_x1[level + 1];
        const botX2 = this.plsx + col * this.tubeWidth + Renderer.bd_x2[level + 1];
        const botY  = row * this.tubeHeight + Renderer.bd_y[level + 1];

        // задаём цвет из палитры
        ctx.fillStyle   = Renderer.COLOR_PALETTE[colorIdx];
        ctx.strokeStyle = Renderer.COLOR_PALETTE[colorIdx];

        // рисуем трапецию: верхний край (top), нижний край (bot)
        ctx.beginPath();
        ctx.moveTo(topX1, topY);
        ctx.lineTo(topX2, topY);
        ctx.lineTo(botX2, botY);
        ctx.lineTo(botX1, botY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // рисуем контур пробирки чёрным
      ctx.strokeStyle = "black";
      ctx.beginPath();
      const baseX = this.plsx + col * this.tubeWidth;
      const baseY = row * this.tubeHeight;

      ctx.moveTo(baseX + 36, baseY + 6);
      ctx.lineTo(baseX + 62, baseY + 6);
      ctx.lineTo(baseX + 62, baseY + 46);
      ctx.lineTo(baseX + 96, baseY + 144);
      ctx.lineTo(baseX + 4,  baseY + 144);
      ctx.lineTo(baseX + 36, baseY + 46);
      ctx.lineTo(baseX + 36, baseY + 6);
      ctx.closePath();
      ctx.stroke();
    }

    // выделенная пробирка (зелёная рамка), если есть selected
    if (selected !== null) {
      ctx.strokeStyle = "green";
      ctx.strokeRect(
        this.plsx + selected.x * this.tubeWidth,
        selected.y * this.tubeHeight,
        this.tubeWidth,
        this.tubeHeight
      );
    }
  }

  /**
   * статическая палитра цветов
   */
  public static readonly COLOR_PALETTE: string[] = [
    "#FFFFFF", // 0 — пустой уровень
    "#f94144", "#f3722c", "#f9c74f", "#90be6d",
    "#43aa8b", "#577590", "#277da1", "#9d4edd", "#ffadad",
    "#ffd6a5", "#caffbf", "#bdb2ff", "#8f81b7", "#ffb3c1",
    "#ffd166", "#06d6a0", "#118ab2", "#073b4c", "#9b5de5"
  ];
}
