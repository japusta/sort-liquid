// src/models/Tube.ts
var Tube = class {
  /**
   * @param capacity — вместимость (V) данной пробирки
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.slots = new Array(capacity).fill(0);
  }
  /**
   * проверяет, что пробирка полностью пустая (все слоты = 0)
   */
  isEmpty() {
    return this.slots.every((c) => c === 0);
  }
  /**
   * роверяет, что пробирка полностью заполнена (нет ни одного нулевого слота)
   */
  isFull() {
    return this.slots.every((c) => c !== 0);
  }
  /**
   * возвращает индекс верхней (последней непустой) капли, либо -1, если нет ни одной капли
   */
  topColorIndex() {
    for (let i = this.capacity - 1; i >= 0; i--) {
      if (this.slots[i] !== 0) {
        return i;
      }
    }
    return -1;
  }
  /**
   * возвращает цвет (число) верхней капли, либо 0, если пробирка пуста
   */
  topColor() {
    const idx = this.topColorIndex();
    return idx >= 0 ? this.slots[idx] : 0;
  }
  /**
   * возвращает индекс первого свободного (нулевого) слота, либо -1, если пробирка полна
   */
  firstEmptySlotIndex() {
    for (let i = 0; i < this.capacity; i++) {
      if (this.slots[i] === 0) {
        return i;
      }
    }
    return -1;
  }
  /**
   * Проверяет, можно ли налить каплю указанного цвета:
   * должен быть свободный слот
   * если пробирка не пуста, её верхний цвет должен совпадать с color
   */
  canReceive(color) {
    const emptyIdx = this.firstEmptySlotIndex();
    if (emptyIdx < 0) return false;
    if (this.isEmpty()) return true;
    return this.topColor() === color;
  }
  /**
   * вытаскивает одну каплю (верхнюю) и возвращает её цвет
   *если пробирка пуста, возвращает 0
   */
  pourOut() {
    const idx = this.topColorIndex();
    if (idx < 0) return 0;
    const color = this.slots[idx];
    this.slots[idx] = 0;
    return color;
  }
  /**
   * наливает одну каплю указанного цвета
   * возвращает true, если удалось (есть место), иначе false
   */
  pourIn(color) {
    const idx = this.firstEmptySlotIndex();
    if (idx < 0) return false;
    this.slots[idx] = color;
    return true;
  }
  /**
   * Считает, сколько верхних капель подряд одного и того же цвета стоит сверху
   * Например: [0,1,1,1] => вернёт 3; [2,2,0,0] => вернёт 2
   */
  countTopStack() {
    const topIdx = this.topColorIndex();
    if (topIdx < 0) return 0;
    const color = this.slots[topIdx];
    let count = 0;
    for (let i = topIdx; i >= 0 && this.slots[i] === color; i--) {
      count++;
    }
    return count;
  }
  /**
   * удаляет ровно count капель сверху (они одного цвета) и возвращает массив их цветов
   */
  popMultiple(count) {
    const popped = [];
    for (let i = 0; i < count; i++) {
      const c = this.pourOut();
      if (c === 0) break;
      popped.push(c);
    }
    return popped;
  }
  /**
   * добавляет ровно count капель цвета color, насколько хватит места
   * возвращает фактически перемещённое количество капель
   */
  pushMultiple(color, count) {
    let moved = 0;
    while (moved < count && this.pourIn(color)) {
      moved++;
    }
    return moved;
  }
  /**
   * проверяет, что пробирка полностью одного цвета (все слоты = один и тот же цвет !== 0)
   */
  isMonochrome() {
    const topIdx = this.topColorIndex();
    if (topIdx < 0) return false;
    const firstColor = this.slots[0];
    if (firstColor === 0) return false;
    return this.slots.every((c) => c === firstColor);
  }
  /**
   * возвращает копию массива слотов (для передачи в рендерер)
   */
  getSlotsCopy() {
    return this.slots.slice();
  }
};

// src/engine/GameEngine.ts
var GameEngine = class {
  constructor(N, V, M) {
    this.tubes = [];
    this.steps = [];
    this.N = N;
    this.V = V;
    this.M = M;
    this.initTubes();
  }
  /**
   * возвращает историю ходов (копию массива)
   */
  getSteps() {
    return this.steps.slice();
  }
  /**
   * инициализирует массив tubes, заполняя первые M пробирок случайными цветами
   * оставшиеся (N−M) пробирок  пустые
   */
  initTubes() {
    const colorsList = [];
    for (let c = 1; c <= this.M; c++) {
      for (let i = 0; i < this.V; i++) {
        colorsList.push(c);
      }
    }
    for (let i = colorsList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorsList[i], colorsList[j]] = [colorsList[j], colorsList[i]];
    }
    let idx = 0;
    for (let tubeIdx = 0; tubeIdx < this.N; tubeIdx++) {
      const tube = new Tube(this.V);
      if (tubeIdx < this.M) {
        for (let s = 0; s < this.V; s++) {
          tube.pourIn(colorsList[idx++]);
        }
      }
      this.tubes.push(tube);
    }
  }
  /**
   * проверяет можно ли переместить хотя бы одну каплю из tubes[from] в tubes[to].
   */
  canMove(from, to) {
    if (!this.isValidIndex(from) || !this.isValidIndex(to) || from === to) {
      return false;
    }
    const tubeFrom = this.tubes[from];
    const tubeTo = this.tubes[to];
    const topIdx = tubeFrom.topColorIndex();
    if (topIdx < 0) return false;
    const color = tubeFrom.topColor();
    return tubeTo.canReceive(color);
  }
  /**
   * dыполняет "максимальный" перенос из tubes[from] => tubes[to]:
   * находит stackSize = сколько верхних капель одного цвета
   * переливает либо все, либо столько, сколько поместится
   * записывает в steps запись {from, to, moved}
   */
  move(from, to) {
    if (!this.canMove(from, to)) return;
    const tubeFrom = this.tubes[from];
    const tubeTo = this.tubes[to];
    const stackSize = tubeFrom.countTopStack();
    const color = tubeFrom.topColor();
    let moved = 0;
    for (let i = 0; i < stackSize; i++) {
      if (!tubeTo.canReceive(color)) break;
      tubeFrom.pourOut();
      tubeTo.pourIn(color);
      moved++;
    }
    this.steps.push({ from, to, count: moved });
  }
  /**
   * jтменяет последний ход
   * берёт последнюю запись из steps, извлекает массив цветов из tubes[to]
   * возвращает эти капли в tubes[from]
   */
  undo() {
    if (this.steps.length === 0) return;
    const last = this.steps.pop();
    const tubeFrom = this.tubes[last.to];
    const tubeTo = this.tubes[last.from];
    const poppedColors = tubeFrom.popMultiple(last.count);
    for (const c of poppedColors) {
      tubeTo.pourIn(c);
    }
  }
  /**
   * проверяет условие победы
   * ровно M пробирок  (каждая заполнена V каплями одного цвета !== 0)
   * остальные N−M пробирок полностью пусты
   */
  isWin() {
    let monoCount = 0;
    let emptyCount = 0;
    for (const tube of this.tubes) {
      if (tube.isEmpty()) {
        emptyCount++;
      } else if (tube.isMonochrome()) {
        monoCount++;
      } else {
        return false;
      }
    }
    return monoCount === this.M && emptyCount === this.N - this.M;
  }
  /**
   * возвращает копию состояния всех пробирок как массива массивов (для рендеринга)
   */
  getTubesState() {
    return this.tubes.map((t) => t.getSlotsCopy());
  }
  isValidIndex(i) {
    return i >= 0 && i < this.N;
  }
};

// src/render/Renderer.ts
var Renderer = class _Renderer {
  constructor(canvas, plsx, tubeWidth, tubeHeight, widco, heim) {
    this.canvas = canvas;
    this.plsx = plsx;
    this.tubeWidth = tubeWidth;
    this.tubeHeight = tubeHeight;
    this.widco = widco;
    this.heim = heim;
    this.ctx = canvas.getContext("2d");
  }
  static {
    this.bd_x1 = [
      3,
      10,
      17,
      24,
      31
      /* … если V>5, добавить ещё элементы */
    ];
  }
  static {
    this.bd_x2 = [
      95,
      88,
      81,
      75,
      68
      /* … */
    ];
  }
  static {
    this.bd_y = [
      144,
      124,
      104,
      84,
      64
      /* … */
    ];
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
  draw(tubesState, selected) {
    const ctx = this.ctx;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let k = 0; k < tubesState.length; k++) {
      const row = Math.floor(k / this.widco);
      const col = k % this.widco;
      const slots = tubesState[k];
      for (let level = 0; level < slots.length; level++) {
        const colorIdx = slots[level];
        if (colorIdx <= 0) continue;
        const topX1 = this.plsx + col * this.tubeWidth + _Renderer.bd_x1[level];
        const topX2 = this.plsx + col * this.tubeWidth + _Renderer.bd_x2[level];
        const topY = row * this.tubeHeight + _Renderer.bd_y[level];
        const botX1 = this.plsx + col * this.tubeWidth + _Renderer.bd_x1[level + 1];
        const botX2 = this.plsx + col * this.tubeWidth + _Renderer.bd_x2[level + 1];
        const botY = row * this.tubeHeight + _Renderer.bd_y[level + 1];
        ctx.fillStyle = _Renderer.COLOR_PALETTE[colorIdx];
        ctx.strokeStyle = _Renderer.COLOR_PALETTE[colorIdx];
        ctx.beginPath();
        ctx.moveTo(topX1, topY);
        ctx.lineTo(topX2, topY);
        ctx.lineTo(botX2, botY);
        ctx.lineTo(botX1, botY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "black";
      ctx.beginPath();
      const baseX = this.plsx + col * this.tubeWidth;
      const baseY = row * this.tubeHeight;
      ctx.moveTo(baseX + 36, baseY + 6);
      ctx.lineTo(baseX + 62, baseY + 6);
      ctx.lineTo(baseX + 62, baseY + 46);
      ctx.lineTo(baseX + 96, baseY + 144);
      ctx.lineTo(baseX + 4, baseY + 144);
      ctx.lineTo(baseX + 36, baseY + 46);
      ctx.lineTo(baseX + 36, baseY + 6);
      ctx.closePath();
      ctx.stroke();
    }
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
  static {
    /**
     * статическая палитра цветов
     */
    this.COLOR_PALETTE = [
      "#FFFFFF",
      // 0 — пустой уровень
      "#f94144",
      "#f3722c",
      "#f9c74f",
      "#90be6d",
      "#43aa8b",
      "#577590",
      "#277da1",
      "#9d4edd",
      "#ffadad",
      "#ffd6a5",
      "#caffbf",
      "#bdb2ff",
      "#8f81b7",
      "#ffb3c1",
      "#ffd166",
      "#06d6a0",
      "#118ab2",
      "#073b4c",
      "#9b5de5"
    ];
  }
};

// src/ui/UIController.ts
var UIController = class {
  constructor(form, errorDiv, gameContainer, canvas, movesContainer) {
    this.form = form;
    this.errorDiv = errorDiv;
    this.gameContainer = gameContainer;
    this.canvas = canvas;
    this.movesContainer = movesContainer;
    this.selected = null;
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.onFormSubmit();
    });
    this.canvas.addEventListener("mousedown", (e) => {
      this.onCanvasClick(e);
    });
  }
  /**
   * срабатывает при сабмите формы: проверяем N, V, M, создаём GameEngine, Renderer
   */
  onFormSubmit() {
    this.errorDiv.textContent = "";
    const inputN = document.getElementById("inputN");
    const inputV = document.getElementById("inputV");
    const inputM = document.getElementById("inputM");
    const N_val = parseInt(inputN.value, 10);
    const V_val = parseInt(inputV.value, 10);
    const M_val = parseInt(inputM.value, 10);
    if (isNaN(N_val) || isNaN(V_val) || isNaN(M_val)) {
      this.errorDiv.textContent = "\u041F\u043E\u043B\u044F N, V \u0438 M \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0446\u0435\u043B\u044B\u043C\u0438 \u0447\u0438\u0441\u043B\u0430\u043C\u0438.";
      return;
    }
    if (N_val < 2) {
      this.errorDiv.textContent = "N (\u0447\u0438\u0441\u043B\u043E \u043F\u0440\u043E\u0431\u0438\u0440\u043E\u043A) \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u2265 2.";
      return;
    }
    if (V_val < 1) {
      this.errorDiv.textContent = "V (\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u044C \u043F\u0440\u043E\u0431\u0438\u0440\u043A\u0438) \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u2265 1.";
      return;
    }
    if (M_val < 1 || M_val >= N_val) {
      this.errorDiv.textContent = "M (\u0447\u0438\u0441\u043B\u043E \u0446\u0432\u0435\u0442\u043E\u0432) \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u2265 1 \u0438 < N.";
      return;
    }
    this.game = new GameEngine(N_val, V_val, M_val);
    this.form.parentElement.style.display = "none";
    this.gameContainer.style.display = "block";
    const widco = Math.min(N_val, 7);
    const heim = Math.ceil(N_val / widco);
    this.renderer = new Renderer(
      this.canvas,
      20,
      // plsx
      100,
      // tubeWidth
      150,
      // tubeHeight
      widco,
      heim
    );
    this.renderFrame();
  }
  /**
   * Обработка клика по canvas:
   * - вычисляем local coordinates (x_in, y_in)
   * - проверяем, попал ли клик внутрь области пробирок
   * - если это первый клик (selected=null) => запоминаем {x,y}
   * - если второй клик => пытаемся сделать move(fromIndex, toIndex)
   *   и проверяем isWin()
   */
  onCanvasClick(e) {
    if (!this.game || !this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    const x_in = e.clientX - rect.left;
    const y_in = e.clientY - rect.top;
    const tubeW = 100, tubeH = 150, plsx = 20;
    const widco = this.renderer.widco;
    const heim = this.renderer.heim;
    if (x_in < plsx || x_in >= plsx + widco * tubeW || y_in < 0 || y_in >= heim * tubeH) {
      this.selected = null;
      this.renderFrame();
      return;
    }
    const j = Math.floor((x_in - plsx) / tubeW);
    const i = Math.floor(y_in / tubeH);
    const clickedIndex = i * widco + j;
    if (clickedIndex < 0 || clickedIndex >= this.game.N) {
      this.selected = null;
      this.renderFrame();
      return;
    }
    if (this.selected === null) {
      this.selected = { x: j, y: i };
      this.renderFrame();
    } else {
      const fromIndex = this.selected.y * widco + this.selected.x;
      const toIndex = clickedIndex;
      if (this.game.canMove(fromIndex, toIndex)) {
        this.game.move(fromIndex, toIndex);
        if (this.game.isWin()) {
          setTimeout(() => {
            alert("\u041F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044F\u0435\u043C! \u0412\u044B \u0440\u0435\u0448\u0438\u043B\u0438 \u0433\u043E\u043B\u043E\u0432\u043E\u043B\u043E\u043C\u043A\u0443!");
            this.showMoves();
          }, 50);
        }
      }
      this.selected = null;
      this.renderFrame();
    }
  }
  /**
   * один кадр рендера берём состояние tubesState и передаём вместе с selected в Renderer.draw()
   */
  renderFrame() {
    if (!this.game || !this.renderer) return;
    const state = this.game.getTubesState();
    this.renderer.draw(state, this.selected);
  }
  /**
   * отображает в movesContainer полный список ходов из GameEngine.getSteps()
   */
  showMoves() {
    if (!this.game) return;
    const moves = this.game.getSteps();
    this.movesContainer.innerHTML = "";
    if (moves.length === 0) {
      this.movesContainer.style.display = "block";
      this.movesContainer.innerText = "\u0425\u043E\u0434\u043E\u0432 \u043D\u0435 \u0431\u044B\u043B\u043E (\u0438\u0433\u0440\u0430 \u0441\u0440\u0430\u0437\u0443 \u0432\u044B\u0438\u0433\u0440\u0430\u043D\u0430).";
      return;
    }
    let html = "<h3>\u0421\u043F\u0438\u0441\u043E\u043A \u0445\u043E\u0434\u043E\u0432 (\u0432 \u043F\u043E\u0440\u044F\u0434\u043A\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F):</h3><ul>";
    moves.forEach((mv, idx) => {
      const c = mv.count;
      let suffix = "\u043A\u0430\u043F\u0435\u043B\u044C";
      if (c % 10 === 1 && c !== 11) suffix = "\u043A\u0430\u043F\u043B\u044F";
      else if ([2, 3, 4].includes(c % 10) && (c < 10 || c > 20)) suffix = "\u043A\u0430\u043F\u043B\u0438";
      html += `<li>\u0425\u043E\u0434 \u2116${idx + 1}: \u0438\u0437 \u043F\u0440\u043E\u0431\u0438\u0440\u043A\u0438 ${mv.from} => \u043F\u0440\u043E\u0431\u0438\u0440\u043A\u0443 ${mv.to} (\u043F\u0435\u0440\u0435\u043B\u0438\u0442\u043E ${c} ${suffix})</li>`;
    });
    html += "</ul>";
    this.movesContainer.innerHTML = html;
    this.movesContainer.style.display = "block";
  }
};

// src/index.ts
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("puzzleForm");
  const errorDiv = document.getElementById("errorMessage");
  const gameContainer = document.getElementById("game-container");
  const canvas = document.getElementById("canvas1");
  const movesContainer = document.getElementById("movesContainer");
  new UIController(form, errorDiv, gameContainer, canvas, movesContainer);
});
