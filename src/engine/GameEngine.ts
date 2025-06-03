import Tube from '../models/Tube';

/**
 * pапись одного хода: откуда, куда, сколько капель.
 */
export interface MoveRecord {
  from: number;
  to: number;
  count: number;
}

/**
 * GameEngine отвечает за логику всей игры:
 * создаёт N пробирок, заполняет M из них случайными цветами
 * проверяет возможность хода, выполняет ход, хранит историю steps
 * проверяет условие выигрыша
 */
export default class GameEngine {
  private tubes: Tube[] = [];
  private steps: MoveRecord[] = [];
  private readonly N: number;
  private readonly V: number;
  private readonly M: number;

  constructor(N: number, V: number, M: number) {
    this.N = N;
    this.V = V;
    this.M = M;
    this.initTubes();
  }

  /**
   * возвращает историю ходов (копию массива)
   */
  public getSteps(): MoveRecord[] {
    return this.steps.slice();
  }

  /**
   * инициализирует массив tubes, заполняя первые M пробирок случайными цветами
   * оставшиеся (N−M) пробирок  пустые
   */
  private initTubes(): void {
    // собираем массив цветов: M блоков по V элементов (1,2,...,M)
    const colorsList: number[] = [];
    for (let c = 1; c <= this.M; c++) {
      for (let i = 0; i < this.V; i++) {
        colorsList.push(c);
      }
    }

    // перемешиваем Fisher–Yates
    for (let i = colorsList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorsList[i], colorsList[j]] = [colorsList[j], colorsList[i]];
    }

    // создаем Tube’ы: сначала M цветных, потом пустые
    let idx = 0;
    for (let tubeIdx = 0; tubeIdx < this.N; tubeIdx++) {
      const tube = new Tube(this.V);
      if (tubeIdx < this.M) {
        // заполняем V капель из colorsList
        for (let s = 0; s < this.V; s++) {
          tube.pourIn(colorsList[idx++]);
        }
      }
      // иначе пустой
      this.tubes.push(tube);
    }
  }

  /**
   * проверяет можно ли переместить хотя бы одну каплю из tubes[from] в tubes[to].
   */
  public canMove(from: number, to: number): boolean {
    if (!this.isValidIndex(from) || !this.isValidIndex(to) || from === to) {
      return false;
    }
    const tubeFrom = this.tubes[from];
    const tubeTo   = this.tubes[to];
    const topIdx   = tubeFrom.topColorIndex();
    if (topIdx < 0) return false;           // from-пустая
    const color    = tubeFrom.topColor();
    return tubeTo.canReceive(color);
  }

  /**
   * dыполняет "максимальный" перенос из tubes[from] => tubes[to]:
   * находит stackSize = сколько верхних капель одного цвета
   * переливает либо все, либо столько, сколько поместится
   * записывает в steps запись {from, to, moved}
   */
  public move(from: number, to: number): void {
    if (!this.canMove(from, to)) return;

    const tubeFrom  = this.tubes[from];
    const tubeTo    = this.tubes[to];
    const stackSize = tubeFrom.countTopStack();
    const color     = tubeFrom.topColor();

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
  public undo(): void {
    if (this.steps.length === 0) return;
    const last = this.steps.pop()!;
    const tubeFrom = this.tubes[last.to];
    const tubeTo   = this.tubes[last.from];
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
  public isWin(): boolean {
    let monoCount = 0;
    let emptyCount = 0;

    for (const tube of this.tubes) {
      if (tube.isEmpty()) {
        emptyCount++;
      } else if (tube.isMonochrome()) {
        monoCount++;
      } else {
        return false; // смешанная пробирка
      }
    }
    return monoCount === this.M && emptyCount === (this.N - this.M);
  }

  /**
   * возвращает копию состояния всех пробирок как массива массивов (для рендеринга)
   */
  public getTubesState(): number[][] {
    return this.tubes.map(t => t.getSlotsCopy());
  }

  private isValidIndex(i: number): boolean {
    return i >= 0 && i < this.N;
  }
}
