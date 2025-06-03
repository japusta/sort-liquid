import GameEngine, { MoveRecord } from '../engine/GameEngine';
import Renderer from '../render/Renderer';

/**
 * UIController отвечает за
 * привязку DOM‐элементов (форма, canvas, контейнер шагов)
 * валидацию параметров N, V, M
 * создание экземпляров GameEngine и Renderer
 * обработку кликов по canvas 
 * вывод истории ходов при выигрыше
 */
export default class UIController {
  private game?: GameEngine;
  private renderer?: Renderer;
  private selected: { x: number; y: number } | null = null;

  constructor(
    private form: HTMLFormElement,
    private errorDiv: HTMLElement,
    private gameContainer: HTMLElement,
    private canvas: HTMLCanvasElement,
    private movesContainer: HTMLElement
  ) {
    //Сабмит формы
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      this.onFormSubmit();
    });

    // клик по canvas
    this.canvas.addEventListener('mousedown', e => {
      this.onCanvasClick(e);
    });

  }

  /**
   * срабатывает при сабмите формы: проверяем N, V, M, создаём GameEngine, Renderer
   */
  private onFormSubmit(): void {
    this.errorDiv.textContent = '';

    const inputN = document.getElementById('inputN') as HTMLInputElement;
    const inputV = document.getElementById('inputV') as HTMLInputElement;
    const inputM = document.getElementById('inputM') as HTMLInputElement;

    const N_val = parseInt(inputN.value, 10);
    const V_val = parseInt(inputV.value, 10);
    const M_val = parseInt(inputM.value, 10);

    if (isNaN(N_val) || isNaN(V_val) || isNaN(M_val)) {
      this.errorDiv.textContent = 'Поля N, V и M должны быть целыми числами.';
      return;
    }
    if (N_val < 2) {
      this.errorDiv.textContent = 'N (число пробирок) должно быть ≥ 2.';
      return;
    }
    if (V_val < 1) {
      this.errorDiv.textContent = 'V (вместимость пробирки) должно быть ≥ 1.';
      return;
    }
    if (M_val < 1 || M_val >= N_val) {
      this.errorDiv.textContent = 'M (число цветов) должно быть ≥ 1 и < N.';
      return;
    }

    // параметры корректны, создаём GameEngine
    this.game = new GameEngine(N_val, V_val, M_val);

    // скрываем форму, показываем canvas
    this.form.parentElement!.style.display = 'none';
    this.gameContainer.style.display = 'block';

    // рассчитываем сетку (widco X heim)
    const widco = Math.min(N_val, 7);
    const heim = Math.ceil(N_val / widco);

    // cоздаём Renderer: plsx=20, tubeWidth=100, tubeHeight=150
    this.renderer = new Renderer(
      this.canvas,
      20,      // plsx
      100,     // tubeWidth
      150,     // tubeHeight
      widco,
      heim
    );

    // один кадр отрисовки стартового состояния
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
  private onCanvasClick(e: MouseEvent): void {
    if (!this.game || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const x_in = e.clientX - rect.left;
    const y_in = e.clientY - rect.top;

    const tubeW = 100, tubeH = 150, plsx = 20;
    const widco: number = (this.renderer as any).widco;
    const heim: number  = (this.renderer as any).heim;

    // Если клик мимо области пробирок
    if (
      x_in < plsx || x_in >= plsx + widco * tubeW ||
      y_in < 0    || y_in >= heim * tubeH
    ) {
      this.selected = null;
      this.renderFrame();
      return;
    }

    const j = Math.floor((x_in - plsx) / tubeW);
    const i = Math.floor(y_in / tubeH);
    const clickedIndex = i * widco + j;

    if (clickedIndex < 0 || clickedIndex >= (this.game as any).N) {
      this.selected = null;
      this.renderFrame();
      return;
    }

    if (this.selected === null) {
      this.selected = { x: j, y: i };
      this.renderFrame();
    } else {
      const fromIndex = this.selected.y * widco + this.selected.x;
      const toIndex   = clickedIndex;

      if (this.game.canMove(fromIndex, toIndex)) {
        this.game.move(fromIndex, toIndex);
        if (this.game.isWin()) {
          setTimeout(() => {
            alert('Поздравляем! Вы решили головоломку!');
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
  private renderFrame(): void {
    if (!this.game || !this.renderer) return;
    const state = this.game.getTubesState();
    this.renderer.draw(state, this.selected);
  }

  /**
   * отображает в movesContainer полный список ходов из GameEngine.getSteps()
   */
  private showMoves(): void {
    if (!this.game) return;
    const moves: MoveRecord[] = this.game.getSteps();
    this.movesContainer.innerHTML = '';

    if (moves.length === 0) {
      this.movesContainer.style.display = 'block';
      this.movesContainer.innerText = 'Ходов не было (игра сразу выиграна).';
      return;
    }

    let html = '<h3>Список ходов (в порядке выполнения):</h3><ul>';
    moves.forEach((mv, idx) => {
      const c = mv.count;
      let suffix = 'капель';
      if (c % 10 === 1 && c !== 11) suffix = 'капля';
      else if ([2,3,4].includes(c % 10) && (c < 10 || c > 20)) suffix = 'капли';

      html += `<li>Ход №${idx + 1}: из пробирки ${mv.from} => пробирку ${mv.to} (перелито ${c} ${suffix})</li>`;
    });
    html += '</ul>';
    this.movesContainer.innerHTML = html;
    this.movesContainer.style.display = 'block';
  }
}
