/* Design reminder: retain the SWF's 550×350 white stage, original board SVG and original cube SVG; new UI must remain outside the playfield. */
(() => {
  "use strict";

  const BOARD_SIZE = 4;
  const STAGE = { width: 550, height: 350, originX: 170, originY: 175, radius: 40 };
  const PLAYER = {
    red: { label: "紅方", top: "#ef6570", left: "#c9384a", right: "#a82338", outline: "#8a1c2a" },
    blue: { label: "藍方", top: "#5b9cff", left: "#2468cc", right: "#134f9c", outline: "#0c3b7e" },
  };

  const canvas = document.querySelector("#gameCanvas");
  const context = canvas.getContext("2d");
  const axisButtons = [...document.querySelectorAll(".axis-button")];
  const layerControls = document.querySelector("#layerControls");
  const turnStatus = document.querySelector("#turnStatus");
  const planeStatus = document.querySelector("#planeStatus");
  const announcer = document.querySelector("#announcer");
  const pauseButton = document.querySelector("#pauseButton");
  const resetButtons = [document.querySelector("#resetButton"), document.querySelector("#resetButtonMobile")];

  const boardImage = new Image();
  const cubeImage = new Image();
  boardImage.src = "assets/original-board.svg";
  cubeImage.src = "assets/original-cube.svg";
  boardImage.addEventListener("load", draw);
  cubeImage.addEventListener("load", draw);

  let cells = Array(BOARD_SIZE ** 3).fill(null);
  let activeAxis = "i";
  let activeLayer = 0;
  let currentPlayer = "red";
  let hoveredIndex = null;
  let winningLine = [];
  let gameOver = false;
  let paused = false;

  const indexOf = (i, j, k) => i * 16 + j * 4 + k;
  const coordinatesOf = (index) => ({ i: Math.floor(index / 16), j: Math.floor((index % 16) / 4), k: index % 4 });
  const pointFor = (i, j, k) => ({
    x: STAGE.originX + Math.round((j - k) * STAGE.radius * Math.sqrt(3) / 2),
    y: STAGE.originY + Math.round((j + k - 2 * i) * STAGE.radius / 2),
  });

  function buildWinningLines() {
    const directions = [];
    for (let di = -1; di <= 1; di += 1) {
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let dk = -1; dk <= 1; dk += 1) {
          if (di === 0 && dj === 0 && dk === 0) continue;
          const firstNonZero = [di, dj, dk].find((value) => value !== 0);
          if (firstNonZero < 0) continue;
          directions.push([di, dj, dk]);
        }
      }
    }
    const lines = [];
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      for (let j = 0; j < BOARD_SIZE; j += 1) {
        for (let k = 0; k < BOARD_SIZE; k += 1) {
          for (const [di, dj, dk] of directions) {
            const previous = [i - di, j - dj, k - dk];
            const end = [i + di * 3, j + dj * 3, k + dk * 3];
            const inside = (point) => point.every((value) => value >= 0 && value < BOARD_SIZE);
            if (inside(previous) || !inside(end)) continue;
            lines.push([0, 1, 2, 3].map((step) => indexOf(i + di * step, j + dj * step, k + dk * step)));
          }
        }
      }
    }
    return lines;
  }

  const winningLines = buildWinningLines();

  function activePlaneIndices() {
    const result = [];
    for (let first = 0; first < BOARD_SIZE; first += 1) {
      for (let second = 0; second < BOARD_SIZE; second += 1) {
        if (activeAxis === "i") result.push(indexOf(activeLayer, first, second));
        if (activeAxis === "j") result.push(indexOf(first, activeLayer, second));
        if (activeAxis === "k") result.push(indexOf(first, second, activeLayer));
      }
    }
    return result;
  }

  function drawOriginalCube(index, alpha = 1) {
    if (!cubeImage.complete) return;
    const { i, j, k } = coordinatesOf(index);
    const point = pointFor(i, j, k);
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(cubeImage, point.x - 31.65, point.y - 36.5, 63.3, 73);
    context.restore();
  }

  function drawPlayerCube(index, player, isWinningCube) {
    const { i, j, k } = coordinatesOf(index);
    const { x, y } = pointFor(i, j, k);
    const colors = PLAYER[player];
    const polygon = (points, fill) => {
      context.beginPath();
      context.moveTo(x + points[0][0], y + points[0][1]);
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) context.lineTo(x + points[pointIndex][0], y + points[pointIndex][1]);
      context.closePath();
      context.fillStyle = fill;
      context.fill();
      context.strokeStyle = colors.outline;
      context.lineWidth = 1.15;
      context.stroke();
    };
    polygon([[0, -32], [27.7, -16], [0, 0], [-27.7, -16]], colors.top);
    polygon([[-27.7, -16], [0, 0], [0, 30], [-27.7, 14]], colors.left);
    polygon([[0, 0], [27.7, -16], [27.7, 14], [0, 30]], colors.right);
    if (isWinningCube) {
      context.save();
      context.beginPath();
      context.arc(x, y - 1, 35, 0, Math.PI * 2);
      context.strokeStyle = "#caa86a";
      context.lineWidth = 2.5;
      context.stroke();
      context.restore();
    }
  }

  function drawInstructionOverlay() {
    if (!paused) return;
    context.save();
    context.fillStyle = "rgba(10, 16, 24, 0.72)";
    context.fillRect(0, 0, STAGE.width, STAGE.height);
    context.fillStyle = "#eaf0f9";
    context.textAlign = "center";
    context.font = "700 18px ui-monospace, monospace";
    context.fillText("遊戲已暫停", STAGE.width / 2, 155);
    context.fillStyle = "#a5c8ff";
    context.font = "14px ui-monospace, monospace";
    context.fillText("按 Esc 或空白鍵繼續", STAGE.width / 2, 185);
    context.restore();
  }

  function draw() {
    context.clearRect(0, 0, STAGE.width, STAGE.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, STAGE.width, STAGE.height);

    if (boardImage.complete) context.drawImage(boardImage, 31, 14, 278, 321.25);

    const plane = activePlaneIndices();
    for (const index of plane) {
      if (!cells[index]) drawOriginalCube(index, index === hoveredIndex ? 0.93 : 0.24);
    }

    const occupied = cells.map((player, index) => ({ player, index })).filter(({ player }) => player);
    occupied.sort((a, b) => {
      const pointA = pointFor(...Object.values(coordinatesOf(a.index)));
      const pointB = pointFor(...Object.values(coordinatesOf(b.index)));
      return pointA.y - pointB.y || pointA.x - pointB.x;
    });
    for (const { player, index } of occupied) drawPlayerCube(index, player, winningLine.includes(index));

    if (!gameOver && !paused && hoveredIndex !== null && !cells[hoveredIndex]) {
      const { i, j, k } = coordinatesOf(hoveredIndex);
      const point = pointFor(i, j, k);
      context.save();
      context.beginPath();
      context.arc(point.x, point.y - 2, 37, 0, Math.PI * 2);
      context.strokeStyle = currentPlayer === "red" ? "rgba(223, 76, 89, 0.8)" : "rgba(38, 115, 223, 0.85)";
      context.lineWidth = 1.75;
      context.setLineDash([4, 4]);
      context.stroke();
      context.restore();
    }
    drawInstructionOverlay();
  }

  function isWinningMove(index) {
    const line = winningLines.find((candidate) => candidate.includes(index) && candidate.every((cellIndex) => cells[cellIndex] === currentPlayer));
    return line || [];
  }

  function place(index) {
    if (paused || gameOver || cells[index] || !activePlaneIndices().includes(index)) return;
    cells[index] = currentPlayer;
    winningLine = isWinningMove(index);
    if (winningLine.length) {
      gameOver = true;
      hoveredIndex = null;
      announce(`${PLAYER[currentPlayer].label}獲勝，已連成四格。`);
      updateUI();
      draw();
      return;
    }
    if (cells.every(Boolean)) {
      gameOver = true;
      hoveredIndex = null;
      announce("棋盤已滿，平手。\n請按 R 重新開局。");
      updateUI();
      draw();
      return;
    }
    currentPlayer = currentPlayer === "red" ? "blue" : "red";
    announce(`${PLAYER[currentPlayer].label}回合。`);
    updateUI();
    draw();
  }

  function setAxis(axis) {
    if (gameOver) return;
    activeAxis = axis;
    axisButtons.forEach((button) => {
      const active = button.dataset.axis === axis;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderLayerButtons();
    announce(`已選擇 ${axis} 軸，第 ${activeLayer + 1} 層。`);
    updateUI();
    draw();
  }

  function setLayer(layer) {
    if (gameOver) return;
    activeLayer = layer;
    renderLayerButtons();
    announce(`已選擇 ${activeAxis} 軸，第 ${activeLayer + 1} 層。`);
    updateUI();
    draw();
  }

  function renderLayerButtons() {
    layerControls.replaceChildren(...Array.from({ length: BOARD_SIZE }, (_, layer) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `layer-button${layer === activeLayer ? " is-active" : ""}`;
      button.textContent = String(layer + 1);
      button.setAttribute("aria-pressed", String(layer === activeLayer));
      button.setAttribute("aria-label", `選擇第 ${layer + 1} 層`);
      button.addEventListener("click", () => setLayer(layer));
      return button;
    }));
  }

  function updateUI() {
    if (gameOver) {
      const winner = winningLine.length ? PLAYER[currentPlayer].label : "平手";
      turnStatus.textContent = winningLine.length ? `${winner}獲勝` : "平手";
      turnStatus.dataset.player = "win";
    } else if (paused) {
      turnStatus.textContent = "遊戲暫停";
      turnStatus.dataset.player = "paused";
    } else {
      turnStatus.textContent = `${PLAYER[currentPlayer].label}回合`;
      turnStatus.dataset.player = currentPlayer;
    }
    planeStatus.textContent = `選擇平面：${activeAxis} 軸，第 ${activeLayer + 1} 層`;
    pauseButton.textContent = paused ? "繼續 <Esc>" : "暫停 <Esc>";
    pauseButton.innerHTML = paused ? "繼續 <kbd>Esc</kbd>" : "暫停 <kbd>Esc</kbd>";
  }

  function reset() {
    cells = Array(BOARD_SIZE ** 3).fill(null);
    activeAxis = "i";
    activeLayer = 0;
    currentPlayer = "red";
    hoveredIndex = null;
    winningLine = [];
    gameOver = false;
    paused = false;
    axisButtons.forEach((button) => {
      const active = button.dataset.axis === "i";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderLayerButtons();
    updateUI();
    announce("新的一局開始。紅方先行，已選擇 i 軸第 1 層。");
    draw();
    canvas.focus({ preventScroll: true });
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    hoveredIndex = null;
    announce(paused ? "遊戲已暫停。" : "遊戲繼續。" );
    updateUI();
    draw();
  }

  function announce(message) { announcer.textContent = message; }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * (STAGE.width / bounds.width), y: (event.clientY - bounds.top) * (STAGE.height / bounds.height) };
  }

  function findCellAt(point) {
    let closest = null;
    let distanceSquared = Number.POSITIVE_INFINITY;
    for (const index of activePlaneIndices()) {
      if (cells[index]) continue;
      const { i, j, k } = coordinatesOf(index);
      const candidate = pointFor(i, j, k);
      const dx = point.x - candidate.x;
      const dy = point.y - candidate.y;
      const distance = dx * dx + dy * dy;
      if (distance < distanceSquared && distance < 30 * 30) {
        closest = index;
        distanceSquared = distance;
      }
    }
    return closest;
  }

  canvas.addEventListener("pointermove", (event) => {
    if (gameOver || paused) return;
    const nextHover = findCellAt(canvasPoint(event));
    if (nextHover !== hoveredIndex) {
      hoveredIndex = nextHover;
      canvas.style.cursor = hoveredIndex === null ? "crosshair" : "pointer";
      draw();
    }
  });
  canvas.addEventListener("pointerleave", () => { hoveredIndex = null; canvas.style.cursor = "crosshair"; draw(); });
  canvas.addEventListener("click", (event) => place(findCellAt(canvasPoint(event))));

  axisButtons.forEach((button) => button.addEventListener("click", () => setAxis(button.dataset.axis)));
  resetButtons.forEach((button) => button.addEventListener("click", reset));
  pauseButton.addEventListener("click", togglePause);

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["i", "j", "k", "r", "escape", " ", "1", "2", "3", "4"].includes(key)) event.preventDefault();
    if (key === "r") reset();
    if (key === "escape" || key === " ") togglePause();
    if (["i", "j", "k"].includes(key)) setAxis(key);
    if (["1", "2", "3", "4"].includes(key)) setLayer(Number(key) - 1);
    if (key === "enter" && hoveredIndex !== null) place(hoveredIndex);
  });

  renderLayerButtons();
  updateUI();
  draw();
})();
