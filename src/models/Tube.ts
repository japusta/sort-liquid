/**
 * класс Tube отвечает за внутреннее состояние одной пробирки:
 * хранит массив слотов (число капель в каждом уровне)
 * предоставляет методы для заполнения/опорожнения, проверки состояния
 */

 export default class Tube {
    private slots: number[];
  
    /**
     * @param capacity — вместимость (V) данной пробирки
     */
    constructor(private capacity: number) {
      // инициализируеь массив нулями (все слоты пустые)
      this.slots = new Array<number>(capacity).fill(0);
    }
  
    /**
     * проверяет, что пробирка полностью пустая (все слоты = 0)
     */
    public isEmpty(): boolean {
      return this.slots.every(c => c === 0);
    }
  
    /**
     * роверяет, что пробирка полностью заполнена (нет ни одного нулевого слота)
     */
    public isFull(): boolean {
      return this.slots.every(c => c !== 0);
    }
  
    /**
     * возвращает индекс верхней (последней непустой) капли, либо -1, если нет ни одной капли
     */
    public topColorIndex(): number {
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
    public topColor(): number {
      const idx = this.topColorIndex();
      return idx >= 0 ? this.slots[idx] : 0;
    }
  
    /**
     * возвращает индекс первого свободного (нулевого) слота, либо -1, если пробирка полна
     */
    public firstEmptySlotIndex(): number {
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
    public canReceive(color: number): boolean {
      const emptyIdx = this.firstEmptySlotIndex();
      if (emptyIdx < 0) return false;          // нет места
      if (this.isEmpty()) return true;         // можно любой цвет
      return this.topColor() === color;
    }
  
    /**
     * вытаскивает одну каплю (верхнюю) и возвращает её цвет
     *если пробирка пуста, возвращает 0
     */
    public pourOut(): number {
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
    public pourIn(color: number): boolean {
      const idx = this.firstEmptySlotIndex();
      if (idx < 0) return false;
      this.slots[idx] = color;
      return true;
    }
  
    /**
     * Считает, сколько верхних капель подряд одного и того же цвета стоит сверху
     * Например: [0,1,1,1] => вернёт 3; [2,2,0,0] => вернёт 2
     */
    public countTopStack(): number {
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
    public popMultiple(count: number): number[] {
      const popped: number[] = [];
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
    public pushMultiple(color: number, count: number): number {
      let moved = 0;
      while (moved < count && this.pourIn(color)) {
        moved++;
      }
      return moved;
    }
  
    /**
     * проверяет, что пробирка полностью одного цвета (все слоты = один и тот же цвет !== 0)
     */
    public isMonochrome(): boolean {
      const topIdx = this.topColorIndex();
      if (topIdx < 0) return false;              // пустая не считается одоцветной
      const firstColor = this.slots[0];
      if (firstColor === 0) return false;
      return this.slots.every(c => c === firstColor);
    }
  
    /**
     * возвращает копию массива слотов (для передачи в рендерер)
     */
    public getSlotsCopy(): number[] {
      return this.slots.slice();
    }
  }
  