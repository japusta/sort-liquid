/**
 * пользователь вводит только параметры N, V и M
 * проверяетcя корректность N, V, M и создаёт корректную случайную раскладку:
 * ровно M пробирок, каждая заполнена V каплями одного цвета (цвета пронумерованы 1..M),
 * оставшиеся N−M пробирок пусты (все V слотов = 0)
 * 
 */

// ==================== 1. пустые init_imgs и init_game_dynamic ====================

/**
 * init_imgs  здесь мы ничего не грузим (в этой версии картинок не используем),
 * но функция должна существовать, чтобы draw() мог её вызвать
 */
function init_imgs() {
	// гечего загружать, поэтому оставляем пустой
}

/**
 * init_game_dynamic – читает параметры N, V, M и aaMain, 
 * но поскольку раскладка уже подготовлена, мы оставим этот метод пустым 
 * (можем использовать для самостоятельного заполнения пробирок)
 */
function init_game_dynamic() {
	// раскладка (aaMain) уже создана в момент handleFormSubmit()  => generateRandomLayout(),
	// поэтому здесь ничего специально делать не нужно
}

// ==================== 2. Глобальные переменные для игры ====================

// глобальный двумерный массив aaMain[i][j]:
// i принадлежит [0..N-1] – индекс пробирки, j принажделжит [0..V-1] 
// Значение 0 означает пустой слот, 1..M – цвета
var aaMain = [];

// палитра из 20 HEX‐цветов (индекс 0 оставляем белым для пустых слотов)
// реально используем только aColors[1..M].
var aColors = [
	'#FFFFFF', // 0 – цвет "пусто" (не заполнено)
	'#f94144', // 1
	'#f3722c', // 2
	'#f9c74f', // 3
	'#90be6d', // 4
	'#43aa8b', // 5
	'#577590', // 6
	'#277da1', // 7
	'#9d4edd', // 8
	'#ffadad', // 9
	'#ffd6a5', // 10
	'#caffbf', // 11
	'#bdb2ff', // 12
	'#8f81b7', // 13
	'#ffb3c1', // 14
	'#ffd166', // 15
	'#06d6a0', // 16
	'#118ab2', // 17
	'#073b4c', // 18
	'#9b5de5'  // 19
];

// количество пробирок, вместимость, число цветов
var N = 0, V = 0, M = 0;

// co2 = N (текущее число пробирок), widco – сколько пробирок в строку, heim – сколько строк
var co2 = 0;
var widco = 1;
var heim = 1;

// смещение слева для отрисовки, а также координаты капли (трапеции)
var plsx = 20;
var bd_x1 = [3, 10, 17, 24, 31];
var bd_x2 = [95, 88, 81, 75, 68];
var bd_y = [144, 124, 104, 84, 64];

// для выделения выбранной пробирки (зелёная рамка)
var numx = -1, numy = -1;

// история ходов: каждый элемент = [fromIndex, toIndex, countMoved]
var steps = [];

// Флаг этапа – перед первой отрисовкой нужно вызвать init_imgs и init_game_dynamic
var stage = 0;

// ==================== 3. Обработка формы (обработка N, V, M и генерируем раскладку) ====================

document.addEventListener("DOMContentLoaded", function () {
	var form = document.getElementById("puzzleForm");
	form.addEventListener("submit", function (event) {
		event.preventDefault();
		handleFormSubmit();
	});
});

/**
 * handleFormSubmit – валидирует поля N, V, M и, если всё корректно,
 * вызывает generateRandomLayout(), настраивает параметры сетки и запускает игру
 */
function handleFormSubmit() {
	// сбросим сообщение об ошибке
	var errorDiv = document.getElementById("errorMessage");
	errorDiv.textContent = "";

	// считываем значения
	var N_val = parseInt(document.getElementById("inputN").value, 10);
	var V_val = parseInt(document.getElementById("inputV").value, 10);
	var M_val = parseInt(document.getElementById("inputM").value, 10);

	// 1) проверка: числа должны быть не NaN
	if (Number.isNaN(N_val) || Number.isNaN(V_val) || Number.isNaN(M_val)) {
		errorDiv.textContent = "Поля N, V и M должны быть целыми числами.";
		return;
	}

	// 2) N ≥ 2
	if (N_val < 2) {
		errorDiv.textContent = "N (число пробирок) должно быть ≥ 2.";
		return;
	}

	// 3) V ≥ 1
	if (V_val < 1) {
		errorDiv.textContent = "V (вместимость пробирки) должно быть ≥ 1.";
		return;
	}

	// 4) 1 ≤ M < N
	if (M_val < 1 || M_val >= N_val) {
		errorDiv.textContent = "M (число цветов) должно быть ≥ 1 и < N.";
		return;
	}

	// сохраняем глобально
	N = N_val;
	V = V_val;
	M = M_val;
	co2 = N;

	// генерируем корректную случайную раскладку
	generateRandomLayout();

	// пересчитываем, как рисовать на canvas (сколько в ряд и сколько рядов)
	// чтобы не превышать 1000 Х 700, берем widco = min(N,7), heim = ceil(N/widco)
	widco = Math.min(N, 7);
	heim = Math.ceil(N / widco);

	// скрываем панель с формой и показываем сам canvas
	document.getElementById("config-panel").style.display = "none";
	document.getElementById("game-container").style.display = "block";

	// сбрасываем историю ходов, выделение и этап
	steps = [];
	numx = -1;
	numy = -1;
	stage = 0;

	// запускаем цикл отрисовки
	timer();
}

/**
 * generateRandomLayout() – создаёт случайную раскладку, которая гарантированно удовлетворяет условию
 *  ровно M цветных пробирок (каждая из них содержит V капель одного и того же цвета),
 *  ровно N−M пустых пробирок (каждая из них — V "нулей")
 *
 * алгоритм:
 * 1) Создаём массив colorsList длины M*V: [1,1,...(V раз), 2,2,...(V раз), ..., M,M,...(V раз)]
 * 2) Перемешиваем Fisher–Yates (алгоритм Фишера–Йейтса (Fisher–Yates shuffle) способ получить случайную перестановку (перемешивание) элементов массива так, чтобы каждая возможная перестановка была одинаково вероятной.)
 * 3) Первые V элементов => пробирка 0; следующие V => пробирка 1;..., пока не заполним M пробирок
 * 4) Оставшиеся (N−M) пробирок заполняем массивами из V нулей
 */
function generateRandomLayout() {
	// 1) собираем массив цветов
	var colorsList = [];
	for (var c = 1; c <= M; c++) {
		for (var k = 0; k < V; k++) {
			colorsList.push(c);
		}
	}

	// 2) перемешиваем Fisher–Yates
	for (var i = colorsList.length - 1; i > 0; i--) {
		var r = Math.floor(Math.random() * (i + 1));
		var tmp = colorsList[i];
		colorsList[i] = colorsList[r];
		colorsList[r] = tmp;
	}

	// 3) заполняем aaMain: первые M пробирок по V элементов из colorsList
	aaMain = [];
	var idx = 0;
	for (var tube = 0; tube < N; tube++) {
		if (tube < M) {
			// пробирка будет цветной: берём V элементов из colorsList
			var row = [];
			for (var j = 0; j < V; j++) {
				row.push(colorsList[idx + j]);
			}
			idx += V;
			aaMain.push(row);
		} else {
			// пустая пробирка: V нулей
			var emptyRow = [];
			for (var j = 0; j < V; j++) {
				emptyRow.push(0);
			}
			aaMain.push(emptyRow);
		}
	}
}

// ==================== 4. Игровые функции логики ====================

/**
 * num_root_fr(n_fr)  возвращает индекс верхней капли (последний ненулевой элемент)
 * в aaMain[n_fr], либо −1, если в пробирке нет ни одной капли
 */
function num_root_fr(n_fr) {
	var res = -1;
	for (var i = 0; i < V; i++) {
		if (aaMain[n_fr][i] !== 0) {
			res = i;
		}
	}
	return res;
}

/**
 * num_root_to(n_to)  возвращает индекс первого свободного слота (0) в aaMain[n_to],
 * либо −1, если пробирка заполнена (нет нулей)
 */
function num_root_to(n_to) {
	for (var i = 0; i < V; i++) {
		if (aaMain[n_to][i] === 0) {
			return i;
		}
	}
	return -1;
}

/**
 * can_move(n_fr, n_to) – проверяет, можно ли перелить хотя бы одну каплю из n_fr => n_to
 * Условия:
 * 1) idx_fr = num_root_fr(n_fr) ≥ 0  (есть капля, которую можно взять)
 * 2) idx_to = num_root_to(n_to) ≥ 0  (есть свободное место, чтобы её положить)
 * 3) Если idx_to == 0, значит пробирка "to" пустая => можно переливать
 *    Иначе верхний цвет в to ( idx_to-1 ) должен совпадать с цветом верхней капли в from
 */
function can_move(n_fr, n_to) {
	var idx_fr = num_root_fr(n_fr);
	if (idx_fr < 0) return false;

	var idx_to = num_root_to(n_to);
	if (idx_to < 0) return false;

	if (idx_to === 0) return true;
	return (aaMain[n_fr][idx_fr] === aaMain[n_to][idx_to - 1]);
}

/**
 * move(n_fr, n_to) – переливает максимальное число капель (одного цвета) из n_fr => n_to:
 * пока can_move == true и не перелито V капель (максимум заполнения), перемещаем по одной капле
 * Сохраняем в steps: [n_fr, n_to, cntMoved]
 * После переноса вызываем check_win()
 */
function move(n_fr, n_to) {
	var cnt = 0;
	while (can_move(n_fr, n_to) && (cnt < V)) {
		var idx_fr = num_root_fr(n_fr);
		var col = aaMain[n_fr][idx_fr];
		aaMain[n_fr][idx_fr] = 0;

		var idx_to = num_root_to(n_to);
		aaMain[n_to][idx_to] = col;

		cnt++;
	}
	steps.push([n_fr, n_to, cnt]);

	if (check_win()) {
		setTimeout(function () {
			alert("Поздравляем! Вы решили головоломку!");
			showMoves();   // вызываем функцию, которая выведет все ходы
		}, 50);
	}
}

function showMoves() {
	var container = document.getElementById("movesContainer");
	if (!container) return;

	// сбрасываем старое содержимое (на случай, если showMoves вызовется дважды)
	container.innerHTML = "";

	// если ходов нет (массив пуст), покажем, что ходов нет
	if (steps.length === 0) {
		container.style.display = "block";
		container.innerText = "Ходов не было (игра сразу выиграна).";
		return;
	}

	// HTML-список (<ul><li>...</li>...) из массива steps
	var html = "<h3>Список ходов (в порядке выполнения):</h3>";
	html += "<ul>";
	for (var k = 0; k < steps.length; k++) {
		var step = steps[k];          // например [2, 5, 3] = перелили 3 капли из пробирки 2 => пробирку 5
		var fromIndex = step[0];
		var toIndex = step[1];
		var cntMoved = step[2];
		html += "<li>Ход №" + (k + 1) + ": пробирка " + fromIndex +
			" => пробирка " + toIndex +
			" (перелито " + cntMoved + " кап" + (cntMoved % 10 === 1 && cntMoved !== 11 ? "ля" : "ель") + ")</li>";
	}
	html += "</ul>";

	// вставляем этот HTML в контейнер и делаем его видимым
	container.innerHTML = html;
	container.style.display = "block";
}


/**
 * check_win() – проверяет условие победы:
 * M пробирок должны быть одного цвета (каждая заполнена V каплями одного цвета !== 0)
 * остальные N−M пробирок должны быть пустыми (все V слотов = 0)
 */
function check_win() {
	var monoCount = 0;
	var emptyCount = 0;

	for (var i = 0; i < N; i++) {
		// является ли пробирка пустой:
		var allZero = true;
		for (var j = 0; j < V; j++) {
			if (aaMain[i][j] !== 0) {
				allZero = false;
				break;
			}
		}
		if (allZero) {
			emptyCount++;
			continue;
		}

		// иначе проверим, что все элементы в этой пробирке равны первому (и не 0):
		var firstColor = aaMain[i][0];
		if (firstColor === 0) return false; // частично пустая => не победа
		var mono = true;
		for (var j = 1; j < V; j++) {
			if (aaMain[i][j] !== firstColor) {
				mono = false;
				break;
			}
		}
		if (!mono) return false;
		monoCount++;
	}

	return (monoCount === M && emptyCount === (N - M));
}

// ==================== 5. Обработка кликов по canvas ====================

/**
 * click1(e) – устанавливает numx,numy; второй click делает from=>to:
 * 1) Если numx,numy == -1 => вычисляем (numx, numy) и выходим (ждём второго клика)
 * 2) Если numx,numy уже заданы, вычисляем (tmpx,tmpy) => fromIndex, toIndex
 *    Если can_move(fromIndex,toIndex), то делаем move(fromIndex,toIndex)
 *    В любом случае сбрасываем numx=numy=-1.
 */
function click1(e) {
	var canvas = document.getElementById("canvas1");
	//границы canvas на странице
	var rect = canvas.getBoundingClientRect();

	// считаем позиции клика относительно левого-верхнего угла canvas
	var x_in_canvas = e.clientX - rect.left;
	var y_in_canvas = e.clientY - rect.top;

	// Проверяем, попал ли клик внутрь области, где рисуем пробирки:
	// по горизонтали: от plsx до plsx + widco*100
	// по вертикали: от 0 до heim*150
	if (x_in_canvas < plsx || x_in_canvas >= (plsx + widco * 100) ||
		y_in_canvas < 0 || y_in_canvas >= (heim * 150)) {
		// Клик произошёл **за пределами** нарисованных пробирок:
		// Сбрасываем текущее выделение (если оно было), но не назначаем новый from.
		numx = -1;
		numy = -1;
		return;
	}

	//вычисляем столбец (j) и ряд (i), куда нажал пользователь:
	// j = floor( (x_in_canvas - plsx) / 100 )
	// i = floor( y_in_canvas / 150 )
	var j = Math.floor((x_in_canvas - plsx) / 100);
	var i = Math.floor(y_in_canvas / 150);

	// приводим (i, j) к индексу пробирки k = i*widco + j
	var clickedIndex = i * widco + j;
	// роверяем что индекс < co2 (иначе была бы "пустая клетка" после последнего ряда)
	if (clickedIndex < 0 || clickedIndex >= co2) {
		numx = -1;
		numy = -1;
		return;
	}

	// выбор from => to:
	if (numx === -1 && numy === -1) {
		// первый клик: запоминаем координаты столбца и ряда
		numx = j;
		numy = i;
		return;
	} else {
		// второй клик: считаем новый столбец/ряд
		var prevFromX = numx;
		var prevFromY = numy;
		var fromIndex = prevFromY * widco + prevFromX;
		var toIndex = clickedIndex;

		// делаем ход, если можно
		if (can_move(fromIndex, toIndex)) {
			move(fromIndex, toIndex);
		}
		// сброс выделения во всех случаях
		numx = -1;
		numy = -1;
		return;
	}
}

// ==================== цикл отрисовки (draw) ====================

/**
 * timer() – вызывает draw() каждые 200 мс
 */
function timer() {
	draw();
	window.setTimeout(timer, 200);
}

/**
 * draw()  отрисовывает текущее состояние aaMain в canvas
 * 1) Если stage == 0 => вызываем init_imgs() и init_game_dynamic(), затем stage=1
 * 2) Заливаем весь canvas белым
 * 3) Перебираем все co2 пробирок (k = 0..co2−1)
 *    – i = floor(k / widco), j = k % widco   (каждая пробирка в сетке widco Х heim)
 *    – для каждого уровня l = 0..V−1 (снизу вверх)
 *         если aaMain[k][l] > 0 => рисуем трапецию капли цветом aColors[…]
 *    – затем рисуем контур пробирки чёрным
 * 4) Если numx,numy !== −1 => рисуем зелёную рамку вокруг выделенной ячейки.
 */
function draw() {
	if (stage === 0) {
		init_imgs();
		init_game_dynamic();
		stage = 1;
	}

	var canvas = document.getElementById("canvas1");
	var ctx = canvas.getContext("2d");

	// заливаем фон белым
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, 1000, 700);

	// рисуем каждую пробирку
	for (var k = 0; k < co2; k++) {
		var i = Math.floor(k / widco); // номер ряда (0..heim-1)
		var j = k - widco * i;         // номер столбца (0..widco-1)

		// рисуем капли уровней l = 0..V−1
		for (var l = 0; l < V; l++) {
			var colIndex = aaMain[k][l];
			if (colIndex > 0) {
				ctx.fillStyle = aColors[colIndex];
				ctx.strokeStyle = aColors[colIndex];
				ctx.beginPath();
				ctx.moveTo(bd_x1[l] + j * 100 + plsx, bd_y[l] + i * 150);
				ctx.lineTo(bd_x2[l] + j * 100 + plsx, bd_y[l] + i * 150);
				ctx.lineTo(bd_x2[l + 1] + j * 100 + plsx, bd_y[l + 1] + i * 150);
				ctx.lineTo(bd_x1[l + 1] + j * 100 + plsx, bd_y[l + 1] + i * 150);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			}
		}

		// рисуем контур пробирки чёрным
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(36 + j * 100 + plsx, 6 + i * 150);
		ctx.lineTo(62 + j * 100 + plsx, 6 + i * 150);
		ctx.lineTo(62 + j * 100 + plsx, 46 + i * 150);
		ctx.lineTo(96 + j * 100 + plsx, 144 + i * 150);
		ctx.lineTo(4 + j * 100 + plsx, 144 + i * 150);
		ctx.lineTo(36 + j * 100 + plsx, 46 + i * 150);
		ctx.lineTo(36 + j * 100 + plsx, 6 + i * 150);
		ctx.closePath();
		ctx.stroke();
	}

	// если есть активное выделение (выбрали какую-либо из пробирок) (numx,numy != -1), рисуем зелёную рамку
	if (numx !== -1 && numy !== -1) {
		ctx.strokeStyle = "green";
		ctx.strokeRect(100 * numx + plsx, 150 * numy, 100, 150);
	}
}
