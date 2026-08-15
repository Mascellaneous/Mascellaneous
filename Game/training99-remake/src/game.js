import { BEST_KEY, DIFFICULTIES, HEIGHT, WIDTH, clamp, formatTime, loadBest, loadSettings, mulberry32, saveBest, saveSettings } from "./config.js";
import { InputManager } from "./input.js";
import { Renderer } from "./renderer.js";

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
