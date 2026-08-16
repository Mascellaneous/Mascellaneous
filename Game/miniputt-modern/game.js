/* Mini Putt Modern — dependency-free canvas reconstruction of the verified Flash play loop. */
(() => {
  "use strict";

  const WORLD = { width: 960, height: 600 };
  const BALL_RADIUS = 12;
  const MAX_STROKES = 10;
  const FLASH_FRICTION = 0.94;
  const FLASH_TICKS_PER_SECOND = 12;
  const ASSETS = {
    felt: "./assets/original-felt-texture.png",
    putt: "./assets/original-putt.mp3",
    sink: "./assets/original-sink.mp3",
    tube: "./assets/original-tube.mp3",
  };

  const el = {
    canvas: document.querySelector("#courseCanvas"),
    startDialog: document.querySelector("#startDialog"),
    finishDialog: document.querySelector("#finishDialog"),
    startForm: document.querySelector("#startForm"),
    playerName: document.querySelector("#playerName"),
    courseName: document.querySelector("#courseName"),
    holeNumber: document.querySelector("#holeNumber"),
    canvasHole: document.querySelector("#canvasHole"),
    parValue: document.querySelector("#parValue"),
    strokeValue: document.querySelector("#strokeValue"),
    scoreList: document.querySelector("#scoreList"),
    totalScore: document.querySelector("#totalScore"),
    powerFill: document.querySelector("#powerFill"),
    powerValue: document.querySelector("#powerValue"),
    status: document.querySelector("#statusMessage"),
    shotHint: document.querySelector("#shotHint"),
    soundButton: document.querySelector("#soundButton"),
    spotButton: document.querySelector("#spotButton"),
    nextButton: document.querySelector("#nextButton"),
    restartButton: document.querySelector("#restartButton"),
    finishSummary: document.querySelector("#finishSummary"),
  };
  const ctx = el.canvas.getContext("2d");

  const rect = (x, y, w, h, type = "wall") => ({ x, y, w, h, type });
  const bumper = (x, y, r = 24) => ({ x, y, r });
  const slope = (x, y, r, ax, ay) => ({ x, y, r, ax, ay });
  const tube = (a, b, r = 21) => ({ a, b, r });

  // Each course uses the original stage's collision vocabulary: blocks, columns, slopes, tubes and low-speed cups.
  const courses = [
    { name: "First Line", par: 2, start: [118, 492], cup: [830, 122], walls: [rect(250, 215, 375, 28), rect(478, 244, 28, 205)], bumpers: [], slopes: [], tubes: [] },
    { name: "Corner Pocket", par: 3, start: [126, 132], cup: [825, 482], walls: [rect(262, 94, 32, 334), rect(294, 396, 360, 30), rect(654, 252, 30, 174)], bumpers: [], slopes: [], tubes: [] },
    { name: "Three Rings", par: 3, start: [120, 306], cup: [834, 306], walls: [], bumpers: [bumper(370, 180, 34), bumper(490, 420, 34), bumper(620, 182, 34)], slopes: [], tubes: [] },
    { name: "Castle Turn", par: 3, start: [140, 480], cup: [812, 116], walls: [rect(260, 70, 36, 354), rect(296, 70, 274, 30), rect(534, 100, 34, 326), rect(568, 396, 206, 30)], bumpers: [bumper(730, 260, 26)], slopes: [], tubes: [] },
    { name: "Double Back", par: 4, start: [150, 150], cup: [818, 142], walls: [rect(250, 105, 500, 26), rect(250, 130, 30, 225), rect(280, 328, 390, 28), rect(640, 177, 30, 151), rect(670, 177, 172, 27)], bumpers: [], slopes: [], tubes: [] },
    { name: "Bumper Garden", par: 3, start: [130, 485], cup: [824, 120], walls: [rect(390, 222, 170, 26), rect(620, 355, 160, 26)], bumpers: [bumper(300, 300, 31), bumper(450, 430, 31), bumper(610, 180, 31), bumper(765, 292, 31)], slopes: [], tubes: [] },
    { name: "Downhill Run", par: 2, start: [145, 135], cup: [820, 480], walls: [rect(260, 180, 30, 260), rect(560, 80, 30, 285)], bumpers: [], slopes: [slope(440, 300, 125, 52, 44)], tubes: [] },
    { name: "Twin Tunnels", par: 3, start: [130, 300], cup: [830, 300], walls: [rect(300, 102, 36, 240), rect(624, 260, 36, 238)], bumpers: [bumper(480, 300, 35)], slopes: [], tubes: [tube([220, 478], [738, 120]), tube([437, 140], [530, 462])] },
    { name: "Red Gate", par: 3, start: [125, 486], cup: [833, 120], walls: [rect(260, 96, 30, 294), rect(290, 360, 260, 28), rect(520, 205, 30, 183), rect(550, 205, 225, 28)], bumpers: [bumper(690, 462, 29)], slopes: [], tubes: [] },
    { name: "Switchback", par: 4, start: [142, 140], cup: [815, 465], walls: [rect(212, 88, 470, 28), rect(212, 115, 30, 170), rect(242, 258, 388, 28), rect(600, 285, 30, 170), rect(630, 427, 245, 28)], bumpers: [], slopes: [], tubes: [] },
    { name: "Spiral Post", par: 3, start: [145, 300], cup: [820, 300], walls: [rect(360, 138, 30, 200), rect(390, 138, 220, 28), rect(580, 166, 30, 270), rect(430, 408, 150, 28)], bumpers: [bumper(490, 287, 46)], slopes: [], tubes: [] },
    { name: "Slope Theory", par: 3, start: [126, 455], cup: [835, 135], walls: [rect(265, 315, 245, 27), rect(606, 132, 30, 225)], bumpers: [bumper(760, 413, 28)], slopes: [slope(360, 177, 105, 50, 70), slope(690, 325, 100, -46, -24)], tubes: [] },
    { name: "The Long Loop", par: 4, start: [124, 124], cup: [833, 474], walls: [rect(220, 86, 560, 28), rect(220, 114, 30, 355), rect(250, 441, 450, 28), rect(670, 197, 30, 244), rect(700, 197, 170, 28)], bumpers: [], slopes: [], tubes: [] },
    { name: "Column Parade", par: 3, start: [132, 305], cup: [827, 306], walls: [], bumpers: [bumper(300, 188, 27), bumper(395, 410, 27), bumper(485, 190, 27), bumper(575, 410, 27), bumper(665, 190, 27)], slopes: [], tubes: [] },
    { name: "Warp Lane", par: 3, start: [132, 470], cup: [830, 122], walls: [rect(270, 142, 30, 246), rect(300, 142, 215, 28), rect(515, 348, 30, 116), rect(545, 436, 198, 28)], bumpers: [bumper(700, 266, 29)], slopes: [], tubes: [tube([400, 492], [704, 108])] },
    { name: "Narrow Escape", par: 4, start: [125, 124], cup: [830, 470], walls: [rect(210, 90, 500, 26), rect(210, 116, 30, 120), rect(240, 210, 340, 27), rect(550, 237, 30, 184), rect(580, 394, 225, 27)], bumpers: [bumper(455, 350, 28), bumper(730, 220, 28)], slopes: [], tubes: [] },
    { name: "Final Flag", par: 3, start: [138, 490], cup: [820, 106], walls: [rect(250, 222, 300, 28), rect(520, 88, 30, 162), rect(550, 88, 225, 28), rect(680, 320, 30, 154)], bumpers: [bumper(330, 110, 30), bumper(756, 300, 32)], slopes: [slope(440, 460, 95, 26, -65)], tubes: [] },
    { name: "Classic Finish", par: 4, start: [126, 298], cup: [830, 298], walls: [rect(255, 105, 30, 185), rect(285, 105, 230, 28), rect(485, 133, 30, 338), rect(515, 443, 230, 28), rect(715, 267, 30, 176)], bumpers: [bumper(350, 405, 29), bumper(650, 195, 29)], slopes: [], tubes: [tube([192, 474], [776, 124])] },
  ];

  const state = {
    courseIndex: 0,
    course: courses[0],
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL_RADIUS, settled: 0, sunk: false },
    strokes: 0,
    scores: Array(courses.length).fill(null),
    aiming: false,
    pointer: { x: 0, y: 0 },
    soundEnabled: true,
    playing: false,
    finishedHole: false,
    portalLock: 0,
    ballColor: "#fff8e3",
    playerName: "Player One",
    texture: null,
    textureReady: false,
  };

  const audio = Object.fromEntries(Object.entries({ putt: ASSETS.putt, sink: ASSETS.sink, tube: ASSETS.tube }).map(([name, src]) => [name, new Audio(src)]));
  for (const clip of Object.values(audio)) clip.preload = "auto";

  const texture = new Image();
  texture.src = ASSETS.felt;
  texture.addEventListener("load", () => {
    state.texture = texture;
    state.textureReady = true;
  });

  function playSound(name) {
    if (!state.soundEnabled) return;
    const clip = audio[name];
    if (!clip) return;
    clip.pause();
    clip.currentTime = 0;
    clip.play().catch(() => {});
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function speed() { return Math.hypot(state.ball.vx, state.ball.vy); }
  function formattedHole(index) { return String(index + 1).padStart(2, "0"); }

  function updateScorecard() {
    el.scoreList.replaceChildren(...courses.map((course, index) => {
      const entry = document.createElement("li");
      if (index === state.courseIndex) entry.classList.add("current");
      if (state.scores[index] !== null) entry.classList.add("completed");
      entry.innerHTML = `<span class="hole-index">${index + 1}</span><span class="score-value">${state.scores[index] ?? "—"}</span>`;
      entry.setAttribute("aria-label", `Hole ${index + 1}, par ${course.par}, score ${state.scores[index] ?? "not completed"}`);
      return entry;
    }));
    const total = state.scores.reduce((sum, value) => sum + (value ?? 0), 0);
    const completed = state.scores.filter((value) => value !== null).length;
    el.totalScore.textContent = completed ? String(total) : "—";
  }

  function updateHUD() {
    const course = state.course;
    const number = formattedHole(state.courseIndex);
    el.holeNumber.textContent = number;
    el.canvasHole.textContent = `${number} / ${String(courses.length).padStart(2, "0")}`;
    el.courseName.textContent = course.name;
    el.parValue.textContent = String(course.par);
    el.strokeValue.textContent = String(state.strokes);
    updateScorecard();
  }

  function setStatus(message, hint = message) {
    el.status.textContent = message;
    el.shotHint.textContent = hint;
  }

  function loadCourse(index, announce = true) {
    state.courseIndex = index;
    state.course = courses[index];
    state.ball = { x: state.course.start[0], y: state.course.start[1], vx: 0, vy: 0, r: BALL_RADIUS, settled: 0, sunk: false };
    state.strokes = 0;
    state.aiming = false;
    state.finishedHole = false;
    state.portalLock = 0;
    el.nextButton.hidden = true;
    updatePower(0);
    updateHUD();
    if (announce) setStatus(`Hole ${index + 1}: ${state.course.name}. Par ${state.course.par}.`, "Pull back from the ball, then release.");
  }

  function resetRound() {
    state.scores.fill(null);
    state.playing = true;
    loadCourse(0);
    el.finishDialog.close();
  }

  function getPointer(event) {
    const box = el.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * (WORLD.width / box.width),
      y: (event.clientY - box.top) * (WORLD.height / box.height),
    };
  }

  function updatePower(value) {
    const percent = clamp(value, 0, 1);
    el.powerFill.style.width = `${percent * 100}%`;
    el.powerValue.textContent = percent > 0 ? `${Math.round(percent * 100)}%` : "READY";
  }

  function aimVector() {
    const dx = state.ball.x - state.pointer.x;
    const dy = state.ball.y - state.pointer.y;
    const pull = Math.hypot(dx, dy);
    const maxPull = 218;
    const ratio = clamp(pull / maxPull, 0, 1);
    if (!pull) return { x: 0, y: 0, power: 0, ratio: 0 };
    const capped = Math.min(pull, maxPull);
    const maxVelocity = 1010;
    return { x: (dx / pull) * ratio * maxVelocity, y: (dy / pull) * ratio * maxVelocity, power: capped, ratio };
  }

  function takeShot() {
    const aim = aimVector();
    if (aim.ratio < 0.045 || !state.playing || state.finishedHole || speed() > 1) return;
    state.ball.vx = aim.x;
    state.ball.vy = aim.y;
    state.ball.settled = 0;
    state.strokes += 1;
    state.aiming = false;
    updatePower(0);
    updateHUD();
    playSound("putt");
    setStatus(`Stroke ${state.strokes} is rolling.`, "Ball in motion — wait for it to settle.");
  }

  function respaceBall() {
    if (!state.playing || state.finishedHole || speed() > 1) return;
    state.strokes = Math.min(MAX_STROKES, state.strokes + 1);
    state.ball.x = state.course.start[0];
    state.ball.y = state.course.start[1];
    state.ball.vx = 0;
    state.ball.vy = 0;
    updateHUD();
    setStatus(`Ball re-spotted. Stroke ${state.strokes} recorded.`, "Pull back from the ball, then release.");
    if (state.strokes >= MAX_STROKES) completeHole(false, "The ten-stroke limit closed this hole.");
  }

  function reflectFromRect(wall) {
    const ball = state.ball;
    const closestX = clamp(ball.x, wall.x, wall.x + wall.w);
    const closestY = clamp(ball.y, wall.y, wall.y + wall.h);
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const overlap = ball.r * ball.r - dx * dx - dy * dy;
    if (overlap <= 0) return;
    let nx = 0;
    let ny = 0;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      nx = dx / length;
      ny = dy / length;
    } else {
      const left = Math.abs(ball.x - wall.x);
      const right = Math.abs(wall.x + wall.w - ball.x);
      const top = Math.abs(ball.y - wall.y);
      const bottom = Math.abs(wall.y + wall.h - ball.y);
      const min = Math.min(left, right, top, bottom);
      if (min === left) nx = -1;
      else if (min === right) nx = 1;
      else if (min === top) ny = -1;
      else ny = 1;
    }
    const depth = Math.sqrt(Math.max(0, overlap));
    ball.x += nx * depth;
    ball.y += ny * depth;
    const along = ball.vx * nx + ball.vy * ny;
    if (along < 0) {
      ball.vx -= 1.72 * along * nx;
      ball.vy -= 1.72 * along * ny;
    }
  }

  function collideWorld() {
    const ball = state.ball;
    if (ball.x - ball.r < 28) { ball.x = 28 + ball.r; ball.vx = Math.abs(ball.vx) * .82; }
    if (ball.x + ball.r > WORLD.width - 28) { ball.x = WORLD.width - 28 - ball.r; ball.vx = -Math.abs(ball.vx) * .82; }
    if (ball.y - ball.r < 28) { ball.y = 28 + ball.r; ball.vy = Math.abs(ball.vy) * .82; }
    if (ball.y + ball.r > WORLD.height - 28) { ball.y = WORLD.height - 28 - ball.r; ball.vy = -Math.abs(ball.vy) * .82; }
  }

  function collideBumper(item) {
    const ball = state.ball;
    const dx = ball.x - item.x;
    const dy = ball.y - item.y;
    const minDistance = ball.r + item.r;
    const actual = Math.hypot(dx, dy);
    if (!actual || actual >= minDistance) return;
    const nx = dx / actual;
    const ny = dy / actual;
    ball.x = item.x + nx * minDistance;
    ball.y = item.y + ny * minDistance;
    const along = ball.vx * nx + ball.vy * ny;
    if (along < 0) {
      ball.vx -= 1.8 * along * nx;
      ball.vy -= 1.8 * along * ny;
    }
  }

  function applySlope(item, dt) {
    const ball = state.ball;
    if (distance(ball.x, ball.y, item.x, item.y) <= item.r) {
      ball.vx += item.ax * dt;
      ball.vy += item.ay * dt;
    }
  }

  function useTubes(dt) {
    state.portalLock = Math.max(0, state.portalLock - dt);
    if (state.portalLock > 0) return;
    const ball = state.ball;
    for (const item of state.course.tubes) {
      const a = { x: item.a[0], y: item.a[1] };
      const b = { x: item.b[0], y: item.b[1] };
      let from = null;
      let to = null;
      if (distance(ball.x, ball.y, a.x, a.y) < item.r + ball.r && speed() < 330) { from = a; to = b; }
      if (distance(ball.x, ball.y, b.x, b.y) < item.r + ball.r && speed() < 330) { from = b; to = a; }
      if (!from || !to) continue;
      const direction = Math.atan2(ball.vy, ball.vx);
      ball.x = to.x + Math.cos(direction) * (item.r + ball.r + 5);
      ball.y = to.y + Math.sin(direction) * (item.r + ball.r + 5);
      state.portalLock = .44;
      playSound("tube");
      setStatus("Tube transfer — follow the new line.", "Ball in motion — wait for it to settle.");
      break;
    }
  }

  function checkCup() {
    const ball = state.ball;
    const [x, y] = state.course.cup;
    const cupSpeed = speed();
    if (distance(ball.x, ball.y, x, y) < 20 && cupSpeed < 238) {
      ball.x = x;
      ball.y = y;
      ball.vx = 0;
      ball.vy = 0;
      ball.sunk = true;
      completeHole(true, "Cup! The low-speed capture rule took the ball.");
      return true;
    }
    if (distance(ball.x, ball.y, x, y) < 27) {
      ball.vx *= .97;
      ball.vy *= .97;
    }
    return false;
  }

  function updateBall(dt) {
    if (!state.playing || state.finishedHole || state.ball.sunk) return;
    const ball = state.ball;
    const currentSpeed = speed();
    if (currentSpeed < .4) return;
    const steps = clamp(Math.ceil((currentSpeed * dt) / (ball.r * .66)), 1, 12);
    const step = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      for (const item of state.course.slopes) applySlope(item, step);
      ball.x += ball.vx * step;
      ball.y += ball.vy * step;
      collideWorld();
      for (const wall of state.course.walls) reflectFromRect(wall);
      for (const item of state.course.bumpers) collideBumper(item);
      useTubes(step);
      if (checkCup()) return;
    }
    const surfaceFriction = Math.pow(FLASH_FRICTION, dt * FLASH_TICKS_PER_SECOND);
    ball.vx *= surfaceFriction;
    ball.vy *= surfaceFriction;
    if (speed() < 17) ball.settled += dt;
    else ball.settled = 0;
    if (ball.settled > .45) {
      ball.vx = 0;
      ball.vy = 0;
      ball.settled = 0;
      if (state.strokes >= MAX_STROKES) completeHole(false, "The ten-stroke limit closed this hole.");
      else setStatus(`Ball settled after ${state.strokes} stroke${state.strokes === 1 ? "" : "s"}.`, "Pull back from the ball, then release.");
    }
  }

  function completeHole(sunk, message) {
    if (state.finishedHole) return;
    state.finishedHole = true;
    state.aiming = false;
    state.scores[state.courseIndex] = clamp(state.strokes || 1, 1, MAX_STROKES);
    if (sunk) playSound("sink");
    updateHUD();
    updatePower(0);
    setStatus(message, state.courseIndex === courses.length - 1 ? "Round complete." : "Use Next hole when you are ready.");
    el.nextButton.hidden = false;
    el.nextButton.textContent = state.courseIndex === courses.length - 1 ? "Finish scorecard →" : "Next hole →";
  }

  function advanceCourse() {
    if (!state.finishedHole) return;
    if (state.courseIndex < courses.length - 1) {
      loadCourse(state.courseIndex + 1);
      return;
    }
    state.playing = false;
    const total = state.scores.reduce((sum, score) => sum + (score ?? 0), 0);
    const par = courses.reduce((sum, course) => sum + course.par, 0);
    const relative = total - par;
    const word = relative === 0 ? "exactly on par" : relative < 0 ? `${Math.abs(relative)} under par` : `${relative} over par`;
    el.finishSummary.textContent = `${state.playerName}, you finished all 18 holes in ${total} strokes — ${word} on a ${par}-par course.`;
    el.finishDialog.showModal();
  }

  function drawRoundRect(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function drawCourse() {
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#2e8a49";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    if (state.textureReady) {
      const pattern = ctx.createPattern(state.texture, "repeat");
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = .27;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, WORLD.width, WORLD.height);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255, 249, 232, .12)";
    ctx.lineWidth = 2;
    for (let x = 100; x < WORLD.width; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 135, WORLD.height); ctx.stroke(); }
    ctx.restore();
    drawRoundRect(28, 28, WORLD.width - 56, WORLD.height - 56, 25, "rgba(48, 148, 73, .24)", "#e3c766");
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#17251c";
    ctx.stroke();

    for (const item of state.course.slopes) {
      const gradient = ctx.createRadialGradient(item.x - item.r * .3, item.y - item.r * .3, 8, item.x, item.y, item.r);
      gradient.addColorStop(0, "rgba(244, 205, 54, .68)");
      gradient.addColorStop(1, "rgba(217, 74, 58, .18)");
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(23, 37, 28, .64)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = "rgba(23, 37, 28, .62)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(item.x - item.ax * .42, item.y - item.ay * .42); ctx.lineTo(item.x + item.ax * .42, item.y + item.ay * .42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(item.x + item.ax * .42, item.y + item.ay * .42); ctx.lineTo(item.x + item.ax * .25 - item.ay * .12, item.y + item.ay * .25 + item.ax * .12); ctx.moveTo(item.x + item.ax * .42, item.y + item.ay * .42); ctx.lineTo(item.x + item.ax * .25 + item.ay * .12, item.y + item.ay * .25 - item.ax * .12); ctx.stroke();
    }

    for (const wall of state.course.walls) {
      ctx.save();
      ctx.translate(wall.x, wall.y);
      drawRoundRect(0, 5, wall.w, wall.h, 8, "#8c672c", null);
      drawRoundRect(0, 0, wall.w, wall.h, 8, "#e3c766", "#17251c");
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.fillRect(8, 6, Math.max(0, wall.w - 16), 6);
      ctx.restore();
    }

    for (const item of state.course.bumpers) {
      ctx.fillStyle = "#8c672c"; ctx.beginPath(); ctx.arc(item.x + 3, item.y + 5, item.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f5ce3a"; ctx.beginPath(); ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = "#17251c"; ctx.stroke();
      ctx.fillStyle = "#d94a3a"; ctx.beginPath(); ctx.arc(item.x, item.y, Math.max(8, item.r * .36), 0, Math.PI * 2); ctx.fill();
    }

    for (const item of state.course.tubes) {
      for (const [x, y] of [item.a, item.b]) {
        ctx.fillStyle = "#8c672c"; ctx.beginPath(); ctx.arc(x + 3, y + 5, item.r + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d94a3a"; ctx.beginPath(); ctx.arc(x, y, item.r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = "#17251c"; ctx.stroke();
        ctx.fillStyle = "#17251c"; ctx.beginPath(); ctx.arc(x, y, item.r * .48, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff9e8"; ctx.beginPath(); ctx.moveTo(x - 5, y - 7); ctx.lineTo(x + 8, y); ctx.lineTo(x - 5, y + 7); ctx.fill();
      }
    }

    drawCup();
    if (state.aiming && !state.finishedHole && speed() < 1) drawAim();
    drawBall();
  }

  function drawCup() {
    const [x, y] = state.course.cup;
    ctx.fillStyle = "rgba(23,37,28,.26)"; ctx.beginPath(); ctx.ellipse(x + 7, y + 10, 27, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0e1711"; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff9e8"; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = "#17251c"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 78); ctx.stroke();
    ctx.fillStyle = "#d94a3a"; ctx.beginPath(); ctx.moveTo(x + 2, y - 76); ctx.lineTo(x + 54, y - 61); ctx.lineTo(x + 2, y - 45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#17251c"; ctx.lineWidth = 4; ctx.stroke();
  }

  function drawAim() {
    const aim = aimVector();
    updatePower(aim.ratio);
    if (!aim.power) return;
    const ball = state.ball;
    const magnitude = Math.hypot(aim.x, aim.y) || 1;
    const dx = aim.x / magnitude;
    const dy = aim.y / magnitude;
    const length = 64 + aim.ratio * 135;
    ctx.save();
    ctx.setLineDash([9, 9]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,249,232,.92)";
    ctx.beginPath(); ctx.moveTo(ball.x + dx * 20, ball.y + dy * 20); ctx.lineTo(ball.x + dx * length, ball.y + dy * length); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff9e8";
    ctx.beginPath(); ctx.moveTo(ball.x + dx * (length + 15), ball.y + dy * (length + 15)); ctx.lineTo(ball.x + dx * (length - 4) - dy * 10, ball.y + dy * (length - 4) + dx * 10); ctx.lineTo(ball.x + dx * (length - 4) + dy * 10, ball.y + dy * (length - 4) - dx * 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#17251c"; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  function drawBall() {
    const ball = state.ball;
    ctx.save();
    ctx.fillStyle = "rgba(23,37,28,.28)"; ctx.beginPath(); ctx.ellipse(ball.x + 6, ball.y + 9, ball.r * .95, ball.r * .52, 0, 0, Math.PI * 2); ctx.fill();
    const gradient = ctx.createRadialGradient(ball.x - 4, ball.y - 5, 2, ball.x, ball.y, ball.r + 3);
    gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(.42, state.ballColor); gradient.addColorStop(1, "#a9aa99");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#17251c"; ctx.stroke();
    ctx.fillStyle = "rgba(23,37,28,.25)";
    for (const [dx, dy] of [[-3, -2], [4, -1], [1, 5]]) { ctx.beginPath(); ctx.arc(ball.x + dx, ball.y + dy, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(.035, (now - lastFrame) / 1000);
    lastFrame = now;
    updateBall(dt);
    drawCourse();
    requestAnimationFrame(frame);
  }

  el.canvas.addEventListener("pointerdown", (event) => {
    if (!state.playing || state.finishedHole || speed() > 1) return;
    const point = getPointer(event);
    if (distance(point.x, point.y, state.ball.x, state.ball.y) > 80) return;
    state.aiming = true;
    state.pointer = point;
    el.canvas.setPointerCapture(event.pointerId);
  });
  el.canvas.addEventListener("pointermove", (event) => {
    if (!state.aiming) return;
    state.pointer = getPointer(event);
  });
  el.canvas.addEventListener("pointerup", (event) => {
    if (!state.aiming) return;
    state.pointer = getPointer(event);
    takeShot();
  });
  el.canvas.addEventListener("pointercancel", () => { state.aiming = false; updatePower(0); });

  el.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.playerName = el.playerName.value.trim() || "Player One";
    state.ballColor = el.startForm.querySelector("input[name=ballColor]:checked").value;
    state.playing = true;
    loadCourse(0);
    el.startDialog.close();
    el.canvas.focus({ preventScroll: true });
  });
  el.soundButton.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    el.soundButton.textContent = `Sound: ${state.soundEnabled ? "on" : "off"}`;
    el.soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
  });
  el.spotButton.addEventListener("click", respaceBall);
  el.nextButton.addEventListener("click", advanceCourse);
  el.restartButton.addEventListener("click", resetRound);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "m") el.soundButton.click();
    if (event.key.toLowerCase() === "r") respaceBall();
  });

  loadCourse(0, false);
  updateScorecard();
  requestAnimationFrame(frame);
  if (typeof el.startDialog.showModal === "function") el.startDialog.showModal();
})();
