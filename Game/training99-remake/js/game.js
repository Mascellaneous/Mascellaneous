/*
 * 特訓99｜零依賴 file:// 發布檔
 * 由原始小型模組合併而成；不含 import 或外部執行期依賴。
 */

/* ===== config.js ===== */
const WIDTH = 960;
const HEIGHT = 640;
const SETTINGS_KEY = "training99-web-settings-v1";
const BEST_KEY = "training99-web-best-v1";

const DIFFICULTIES = {
  easy: { label: "校準", spawn: 0.86, speed: 0.78, turn: 0.18, maxBullets: 52, warmup: 2.6 },
  normal: { label: "標準", spawn: 0.57, speed: 1, turn: 0.34, maxBullets: 86, warmup: 1.8 },
  hard: { label: "高壓", spawn: 0.39, speed: 1.22, turn: 0.56, maxBullets: 118, warmup: 1.2 },
  extreme: { label: "極限", spawn: 0.29, speed: 1.48, turn: 0.8, maxBullets: 160, warmup: 0.75 },
};

const DEFAULT_SETTINGS = { difficulty: "normal", lives: 1, controlMode: "direct", sound: true };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved, lives: Number(saved.lives || DEFAULT_SETTINGS.lives) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* local file mode may deny storage */ }
}

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch { return null; }
}

function saveBest(best) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch { /* optional persistence */ }
}

function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }

function formatTime(milliseconds) { return (milliseconds / 1000).toFixed(3).padStart(6, "0"); }

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}


/* ===== input.js ===== */
const KEY_ACTIONS = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
};

class InputManager {
  constructor({ onStart, onAnyGesture }) {
    this.actions = new Set();
    this.onStart = onStart;
    this.onAnyGesture = onAnyGesture;
    this.boundKeyDown = (event) => this.keyDown(event);
    this.boundKeyUp = (event) => this.keyUp(event);
    this.boundBlur = () => this.actions.clear();
    window.addEventListener("keydown", this.boundKeyDown, { passive: false });
    window.addEventListener("keyup", this.boundKeyUp);
    window.addEventListener("blur", this.boundBlur);
    document.querySelectorAll("[data-action]").forEach((button) => this.bindPointer(button));
  }

  keyDown(event) {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault(); this.onAnyGesture(); this.onStart(); return;
    }
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault(); this.onAnyGesture(); this.actions.add(action);
  }

  keyUp(event) {
    const action = KEY_ACTIONS[event.code];
    if (action) this.actions.delete(action);
  }

  bindPointer(button) {
    const action = button.dataset.action;
    const activate = (event) => { event.preventDefault(); this.onAnyGesture(); this.actions.add(action); button.setPointerCapture?.(event.pointerId); };
    const deactivate = (event) => { event.preventDefault(); this.actions.delete(action); };
    button.addEventListener("pointerdown", activate);
    button.addEventListener("pointerup", deactivate);
    button.addEventListener("pointercancel", deactivate);
    button.addEventListener("pointerleave", deactivate);
  }

  axis() {
    return { x: (this.actions.has("right") ? 1 : 0) - (this.actions.has("left") ? 1 : 0), y: (this.actions.has("down") ? 1 : 0) - (this.actions.has("up") ? 1 : 0) };
  }

  destroy() {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    window.removeEventListener("blur", this.boundBlur);
  }
}


/* ===== renderer.js ===== */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.context.imageSmoothingEnabled = false;
    this.stars = Array.from({ length: 62 }, (_, index) => ({ x: ((index * 149) % WIDTH) + 6, y: ((index * 89) % HEIGHT) + 4, size: index % 11 === 0 ? 2 : 1, glow: index % 7 === 0 }));
  }

  render(world, clock) {
    const ctx = this.context;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#05080b"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    this.drawStars(ctx, clock);
    this.drawBoundary(ctx);
    world.bullets.forEach((bullet) => this.drawBullet(ctx, bullet));
    this.drawPlayer(ctx, world.player, world.invincibleUntil > world.elapsed);
    if (world.flashUntil > world.elapsed) this.drawCloseCall(ctx, world, clock);
    if (world.damageUntil > world.elapsed) {
      ctx.fillStyle = `rgba(214,83,60,${clamp((world.damageUntil - world.elapsed) * 1.9, 0, 0.32)})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (world.countdown > 0) this.drawCountdown(ctx, world.countdown);
  }

  drawStars(ctx, clock) {
    for (const star of this.stars) {
      const pulse = star.glow ? 0.28 + Math.sin(clock / 420 + star.x) * 0.16 : 0.28;
      ctx.fillStyle = `rgba(216,237,230,${pulse})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  drawBoundary(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 1; ctx.strokeRect(18.5, 18.5, WIDTH - 37, HEIGHT - 37);
    ctx.strokeStyle = "rgba(231,169,77,.25)"; ctx.setLineDash([2, 8]); ctx.strokeRect(35.5, 35.5, WIDTH - 71, HEIGHT - 71); ctx.setLineDash([]);
  }

  drawPlayer(ctx, player, invincible) {
    if (invincible && Math.floor(player.phase * 12) % 2 === 0) return;
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(Math.atan2(player.vy, player.vx) + Math.PI / 2 || 0);
    ctx.fillStyle = "rgba(75,168,146,.16)"; ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4ba892"; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(11, 12); ctx.lineTo(0, 8); ctx.lineTo(-11, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff4db"; ctx.fillRect(-2, -8, 4, 12);
    ctx.fillStyle = "#e7a94d"; ctx.fillRect(-3, 11, 6, 6);
    ctx.restore();
  }

  drawBullet(ctx, bullet) {
    ctx.save(); ctx.translate(bullet.x, bullet.y);
    const angle = Math.atan2(bullet.vy, bullet.vx);
    ctx.rotate(angle);
    ctx.fillStyle = bullet.kind === "seeker" ? "rgba(231,169,77,.22)" : "rgba(214,83,60,.20)";
    ctx.beginPath(); ctx.ellipse(-bullet.radius * 1.4, 0, bullet.radius * 2.6, bullet.radius * .7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bullet.kind === "seeker" ? "#e7a94d" : "#d6533c"; ctx.beginPath(); ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffe5ad"; ctx.beginPath(); ctx.arc(-bullet.radius * .25, -bullet.radius * .25, Math.max(1.5, bullet.radius * .32), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawCloseCall(ctx, world) {
    const player = world.player; const alpha = clamp((world.flashUntil - world.elapsed) * 2.8, 0, .9);
    ctx.strokeStyle = `rgba(231,169,77,${alpha})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(player.x, player.y, 35, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(255,245,221,${alpha})`; ctx.font = "700 14px monospace"; ctx.textAlign = "center"; ctx.fillText("絕妙!", player.x, player.y - 42);
  }

  drawCountdown(ctx, seconds) {
    const number = Math.max(1, Math.ceil(seconds));
    ctx.fillStyle = "rgba(255,245,221,.87)"; ctx.font = "700 76px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(number, WIDTH / 2, HEIGHT / 2);
  }
}


/* ===== game.js ===== */



const canvas = document.querySelector("#gameCanvas");
const ui = {
  start: document.querySelector("#startOverlay"), result: document.querySelector("#resultOverlay"),
  startButton: document.querySelector("#startButton"), retryButton: document.querySelector("#retryButton"),
  timer: document.querySelector("#timerReadout"), threats: document.querySelector("#threatReadout"), close: document.querySelector("#closeCallReadout"), lives: document.querySelector("#livesReadout"),
  best: document.querySelector("#bestReadout"), bestDetail: document.querySelector("#bestDetail"),
  resultTime: document.querySelector("#resultTime"), resultActive: document.querySelector("#resultActive"), resultThreats: document.querySelector("#resultThreats"), resultClose: document.querySelector("#resultClose"), recordNote: document.querySelector("#recordNote"),
  difficulty: document.querySelector("#difficultySelect"), livesSelect: document.querySelector("#livesSelect"), control: document.querySelector("#controlSelect"), sound: document.querySelector("#soundToggle"),
};

class TrainingGame {
  constructor() {
    this.settings = loadSettings(); this.best = loadBest(); this.renderer = new Renderer(canvas); this.state = "idle"; this.lastFrame = performance.now(); this.accumulator = 0; this.demo = new URLSearchParams(location.search).has("demo"); this.audioContext = null;
    this.bindSettings(); this.updateBest(); this.newWorld();
    this.input = new InputManager({ onStart: () => this.start(), onAnyGesture: () => this.enableAudio() });
    ui.startButton.addEventListener("click", () => { this.enableAudio(); this.start(); }); ui.retryButton.addEventListener("click", () => { this.enableAudio(); this.start(); });
    if (this.demo) setTimeout(() => this.start(), 180);
    requestAnimationFrame((clock) => this.frame(clock));
  }

  bindSettings() {
    ui.difficulty.value = this.settings.difficulty; ui.livesSelect.value = String(this.settings.lives); ui.control.value = this.settings.controlMode; ui.sound.checked = this.settings.sound;
    const persist = () => { this.settings = { difficulty: ui.difficulty.value, lives: Number(ui.livesSelect.value), controlMode: ui.control.value, sound: ui.sound.checked }; saveSettings(this.settings); };
    [ui.difficulty, ui.livesSelect, ui.control, ui.sound].forEach((node) => node.addEventListener("change", persist));
  }

  newWorld() {
    const seed = this.demo ? 990099 : Math.floor(Math.random() * 2 ** 32); const random = mulberry32(seed); const player = { x: WIDTH / 2, y: HEIGHT / 2 + 80, vx: 0, vy: 0, radius: 11, phase: 0 };
    this.world = { seed, random, player, bullets: [], elapsed: 0, active: 0, countdown: 0, spawnTimer: 0, invincibleUntil: 0, damageUntil: 0, flashUntil: 0, lives: this.settings.lives, threats: 0, closeCalls: 0, closeScore: 0, demoTurn: 0 };
    this.updateUi();
  }

  start() {
    if (this.state === "playing" || this.state === "countdown") return;
    this.newWorld(); this.state = this.demo ? "playing" : "countdown"; this.world.countdown = this.demo ? 0 : 2.45; ui.start.classList.remove("is-visible"); ui.result.hidden = true; this.beep(330, .05, "sine");
  }

  finish() {
    this.state = "ended"; const world = this.world; const isNew = !this.best || world.elapsed > this.best.time;
    if (isNew) { this.best = { time: world.elapsed, close: world.closeScore, date: new Date().toISOString() }; saveBest(this.best); this.updateBest(); }
    ui.resultTime.textContent = formatTime(world.elapsed); ui.resultActive.textContent = formatTime(world.active); ui.resultThreats.textContent = String(world.threats); ui.resultClose.textContent = `${world.closeScore}%`;
    ui.recordNote.textContent = isNew ? "新紀錄已寫入本機檔案。" : this.best ? `距離最佳紀錄還差 ${Math.max(0, (this.best.time - world.elapsed) / 1000).toFixed(3)} 秒。` : "紀錄等待建立。";
    ui.result.hidden = false; requestAnimationFrame(() => ui.result.classList.add("is-visible")); this.beep(110, .14, "sawtooth");
  }

  frame(clock) {
    const delta = Math.min(50, clock - this.lastFrame); this.lastFrame = clock; this.accumulator += delta;
    while (this.accumulator >= 1000 / 60) { this.update(1 / 60); this.accumulator -= 1000 / 60; }
    this.renderer.render(this.world, clock); requestAnimationFrame((next) => this.frame(next));
  }

  update(step) {
    const world = this.world; world.player.phase += step;
    if (this.state === "countdown") { world.countdown -= step; if (world.countdown <= 0) { world.countdown = 0; this.state = "playing"; this.beep(520, .07, "square"); } return; }
    if (this.state !== "playing") return;
    world.elapsed += step * 1000; world.active += step * 1000;
    this.updatePlayer(step); this.updateBullets(step); this.spawnBullets(step); this.checkCollisions(); this.updateUi();
  }

  updatePlayer(step) {
    const world = this.world; const player = world.player; let { x, y } = this.demo ? this.demoAxis() : this.input.axis();
    if (x && y) { const factor = Math.SQRT1_2; x *= factor; y *= factor; }
    if (this.settings.controlMode === "glide") { const thrust = 1800; player.vx += x * thrust * step; player.vy += y * thrust * step; player.vx *= 0.87; player.vy *= 0.87; const max = 310; const speed = Math.hypot(player.vx, player.vy); if (speed > max) { player.vx = player.vx / speed * max; player.vy = player.vy / speed * max; } }
    else { player.vx = x * 365; player.vy = y * 365; }
    player.x = clamp(player.x + player.vx * step, 56, WIDTH - 56); player.y = clamp(player.y + player.vy * step, 56, HEIGHT - 56);
  }

  demoAxis() {
    const world = this.world; world.demoTurn += 1 / 60; const targetX = WIDTH / 2 + Math.sin(world.demoTurn * .95) * 255; const targetY = HEIGHT / 2 + Math.cos(world.demoTurn * 1.32) * 154; return { x: clamp((targetX - world.player.x) / 75, -1, 1), y: clamp((targetY - world.player.y) / 75, -1, 1) };
  }

  spawnBullets(step) {
    const world = this.world; const profile = DIFFICULTIES[this.settings.difficulty]; if (!this.demo && world.elapsed < profile.warmup * 1000) return;
    world.spawnTimer -= step; const timeFactor = 1 + Math.min(1.2, world.elapsed / 55000); if (world.spawnTimer > 0 || world.bullets.length >= profile.maxBullets) return;
    world.spawnTimer = profile.spawn / timeFactor * (.78 + world.random() * .42); this.createBullet(profile);
    if (world.elapsed > 18000 && world.random() > .65) this.createBullet(profile, true);
  }

  createBullet(profile, pair = false) {
    const world = this.world; const random = world.random; const side = Math.floor(random() * 4); const margin = 45; let x; let y;
    if (side === 0) { x = random() * WIDTH; y = -margin; } else if (side === 1) { x = WIDTH + margin; y = random() * HEIGHT; } else if (side === 2) { x = random() * WIDTH; y = HEIGHT + margin; } else { x = -margin; y = random() * HEIGHT; }
    const targetX = clamp(world.player.x + (random() - .5) * 155 + (pair ? (random() - .5) * 110 : 0), 80, WIDTH - 80); const targetY = clamp(world.player.y + (random() - .5) * 125, 80, HEIGHT - 80); const angle = Math.atan2(targetY - y, targetX - x); const seeker = world.elapsed > 9000 && random() < (.12 + profile.turn * .18); const speed = (118 + random() * 54 + Math.min(104, world.elapsed / 520)) * profile.speed;
    world.bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: seeker ? 7 : 5 + Math.floor(random() * 3), kind: seeker ? "seeker" : "fire", turnRate: seeker ? profile.turn : 0, scoredNearMiss: false, age: 0 }); world.threats += 1;
  }

  updateBullets(step) {
    const world = this.world; for (const bullet of world.bullets) { bullet.age += step; if (bullet.turnRate && bullet.age < 2.1) { const current = Math.atan2(bullet.vy, bullet.vx); const target = Math.atan2(world.player.y - bullet.y, world.player.x - bullet.x); let delta = Math.atan2(Math.sin(target - current), Math.cos(target - current)); delta = clamp(delta, -bullet.turnRate * step, bullet.turnRate * step); const speed = Math.hypot(bullet.vx, bullet.vy); bullet.vx = Math.cos(current + delta) * speed; bullet.vy = Math.sin(current + delta) * speed; } bullet.x += bullet.vx * step; bullet.y += bullet.vy * step; }
    world.bullets = world.bullets.filter((bullet) => bullet.x > -90 && bullet.x < WIDTH + 90 && bullet.y > -90 && bullet.y < HEIGHT + 90);
  }

  checkCollisions() {
    const world = this.world; const player = world.player; for (const bullet of world.bullets) { const distance = Math.hypot(bullet.x - player.x, bullet.y - player.y); const collision = bullet.radius + player.radius; if (!this.demo && distance < collision && world.invincibleUntil <= world.elapsed) { world.lives -= 1; world.invincibleUntil = world.elapsed + 1180; world.damageUntil = world.elapsed + 420; world.bullets = world.bullets.filter((item) => item !== bullet); this.beep(145, .08, "sawtooth"); if (world.lives <= 0) { this.finish(); return; } break; }
      const nearThreshold = collision + 24; if (!bullet.scoredNearMiss && distance < nearThreshold && distance >= collision) { bullet.scoredNearMiss = true; world.closeCalls += 1; const intensity = Math.round(clamp((nearThreshold - distance) / (nearThreshold - collision), .15, 1) * 3); world.closeScore += intensity; world.flashUntil = world.elapsed + 360; this.beep(760 + intensity * 90, .035, "triangle"); }
    }
  }

  updateUi() {
    const world = this.world; ui.timer.textContent = formatTime(world.elapsed); ui.threats.textContent = String(world.threats).padStart(3, "0"); ui.close.textContent = `${world.closeScore}%`;
    ui.lives.innerHTML = Array.from({ length: this.settings.lives }, (_, index) => `<i class="life-dot${index >= world.lives ? " is-empty" : ""}"></i>`).join("");
  }

  updateBest() { ui.best.textContent = this.best ? formatTime(this.best.time) : "00.000"; ui.bestDetail.textContent = this.best ? `最高絕妙度：${this.best.close || 0}%` : "尚未建立紀錄"; }

  enableAudio() { if (!this.settings.sound || this.audioContext) return; try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.audioContext = null; } }
  beep(frequency, duration, type) { if (!this.settings.sound || !this.audioContext) return; const context = this.audioContext; const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration); }
}

new TrainingGame();
