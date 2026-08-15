/**
 * 天下太平 - 網頁重製版
 * 核心遊戲邏輯
 *
 * 遊戲規則（逆向自原始 Flash SWF v5）：
 *  - 雙方各有 10 HP 與最多 10 格建設
 *  - 每回合猜拳（布剪刀石頭）
 *  - 猜拳勝者可選擇「建設」（+1 格）或「攻擊」（消耗 7 格，敵方 -1 HP）
 *  - 猜拳敗者：電腦自動行動（建設或攻擊）
 *  - 平手：重新猜拳
 *  - 任一方 HP 歸零即結束
 */

'use strict';

// ──────────────────────────────────────────
// 常數
// ──────────────────────────────────────────
const MAX_HP      = 10;
const MAX_BUILD   = 10;
const ATTACK_COST = 7;   // 攻擊需消耗的建設格數

const CHOICES = ['paper', 'scissors', 'rock'];
const CHOICE_LABEL = { paper: '布', scissors: '剪刀', rock: '石頭' };

const BEATS = {
  paper:    { rock: true },
  scissors: { paper: true },
  rock:     { scissors: true }
};

// ──────────────────────────────────────────
// 遊戲狀態
// ──────────────────────────────────────────
let state = {};

function resetState() {
  state = {
    scene:             'title',
    round:             1,
    myHP:              MAX_HP,
    yourHP:            MAX_HP,
    myBuild:           0,
    yourBuild:         0,
    lastMyChoice:      null,
    lastCpuChoice:     null,
    lastResult:        null,
    waitingForAction:  false,
    gameOver:          false
  };
}

// ──────────────────────────────────────────
// Web Audio 合成音效
// ──────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function tone(freq, dur, type = 'square', vol = 0.18) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}
function sfxClick()   { tone(440, 0.07, 'square', 0.12); }
function sfxWin()     { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.2),i*80)); }
function sfxLose()    { [392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,.22,'sawtooth',.15),i*90)); }
function sfxDraw()    { tone(330,.15,'sine',.12); setTimeout(()=>tone(330,.15,'sine',.12),160); }
function sfxBuild()   { tone(660,.1,'triangle',.18); setTimeout(()=>tone(880,.12,'triangle',.18),100); }
function sfxAttack()  { tone(200,.05,'sawtooth',.25); setTimeout(()=>tone(150,.15,'sawtooth',.2),50); }
function sfxVictory() { [523,659,784,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.22,'triangle',.22),i*120)); }
function sfxDefeat()  { [392,349,330,262].forEach((f,i)=>setTimeout(()=>tone(f,.28,'sawtooth',.18),i*130)); }
function sfxStart()   { [262,330,392,523].forEach((f,i)=>setTimeout(()=>tone(f,.15,'triangle',.2),i*70)); }

// ──────────────────────────────────────────
// Canvas 手勢繪圖
// ──────────────────────────────────────────
function drawHand(canvas, type, s) {
  s = s || 1;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  if (type === 'paper')    _drawPaper(ctx, cx, cy, s);
  else if (type === 'scissors') _drawScissors(ctx, cx, cy, s);
  else                     _drawRock(ctx, cx, cy, s);
}

function _handBase(ctx, s) {
  ctx.fillStyle   = '#f5c87a';
  ctx.strokeStyle = '#8b5e2a';
  ctx.lineWidth   = 1.5 * s;
}

function _drawPaper(ctx, cx, cy, s) {
  _handBase(ctx, s);
  // 手掌
  ctx.beginPath();
  ctx.roundRect(cx-18*s, cy-5*s, 36*s, 30*s, 6*s);
  ctx.fill(); ctx.stroke();
  // 四指
  [-14,-5,4,13].forEach(ox => {
    ctx.beginPath();
    ctx.roundRect(cx+ox*s-4*s, cy-32*s, 8*s, 30*s, 4*s);
    ctx.fill(); ctx.stroke();
  });
  // 拇指
  ctx.beginPath();
  ctx.roundRect(cx-30*s, cy+2*s, 14*s, 8*s, 4*s);
  ctx.fill(); ctx.stroke();
  // 指節線
  ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 0.8*s;
  [-14,-5,4,13].forEach(ox => {
    [cy-18*s, cy-10*s].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(cx+ox*s-3*s, y); ctx.lineTo(cx+ox*s+3*s, y);
      ctx.stroke();
    });
  });
}

function _drawScissors(ctx, cx, cy, s) {
  _handBase(ctx, s);
  ctx.beginPath();
  ctx.roundRect(cx-18*s, cy-5*s, 36*s, 30*s, 6*s);
  ctx.fill(); ctx.stroke();
  // 食指（張開左斜）
  ctx.save(); ctx.translate(cx-6*s, cy-5*s); ctx.rotate(-0.2);
  ctx.beginPath(); ctx.roundRect(-4*s,-28*s,8*s,28*s,4*s);
  ctx.fill(); ctx.stroke(); ctx.restore();
  // 中指（張開右斜）
  ctx.save(); ctx.translate(cx+6*s, cy-5*s); ctx.rotate(0.2);
  ctx.beginPath(); ctx.roundRect(-4*s,-28*s,8*s,28*s,4*s);
  ctx.fill(); ctx.stroke(); ctx.restore();
  // 無名指（彎曲）
  ctx.beginPath(); ctx.roundRect(cx+9*s,cy-16*s,7*s,16*s,3*s);
  ctx.fill(); ctx.stroke();
  // 小指（彎曲）
  ctx.beginPath(); ctx.roundRect(cx+14*s,cy-12*s,6*s,12*s,3*s);
  ctx.fill(); ctx.stroke();
  // 拇指
  ctx.beginPath(); ctx.roundRect(cx-30*s,cy+2*s,14*s,8*s,4*s);
  ctx.fill(); ctx.stroke();
}

function _drawRock(ctx, cx, cy, s) {
  _handBase(ctx, s);
  ctx.beginPath();
  ctx.roundRect(cx-18*s, cy-12*s, 36*s, 32*s, 10*s);
  ctx.fill(); ctx.stroke();
  // 指節突起
  [-13,-5,3,11].forEach(ox => {
    ctx.beginPath();
    ctx.arc(cx+ox*s, cy-12*s, 6*s, Math.PI, 0);
    ctx.fill(); ctx.stroke();
  });
  // 拇指
  ctx.beginPath(); ctx.roundRect(cx-30*s,cy+2*s,14*s,8*s,4*s);
  ctx.fill(); ctx.stroke();
  // 指節線
  ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 0.8*s;
  [-13,-5,3,11].forEach(ox => {
    ctx.beginPath();
    ctx.moveTo(cx+ox*s-4*s, cy-2*s); ctx.lineTo(cx+ox*s+4*s, cy-2*s);
    ctx.stroke();
  });
}

// ──────────────────────────────────────────
// DOM 快取
// ──────────────────────────────────────────
let D = {};

function cacheDom() {
  const $ = id => document.getElementById(id);
  D = {
    sceneTitle:  $('scene-title'),
    sceneJanken: $('scene-janken'),
    sceneBattle: $('scene-battle'),
    sceneEnd:    $('scene-end'),

    btnStart: $('btn-start'),
    btnRetry: $('btn-retry'),

    jankenRound:   $('janken-round-label'),
    jankenBtns:    document.querySelectorAll('.janken-btn'),

    redTerritory:  $('red-territory'),
    blueTerritory: $('blue-territory'),

    myHPFill:   $('my-hp-fill'),
    yourHPFill: $('your-hp-fill'),
    myHPNum:    $('my-hp-num'),
    yourHPNum:  $('your-hp-num'),

    myBuildVal:   $('my-build-val'),
    yourBuildVal: $('your-build-val'),
    myHPVal:      $('my-hp-val'),
    yourHPVal:    $('your-hp-val'),

    btnBuild:  $('btn-build'),
    btnAttack: $('btn-attack'),

    resultOverlay: $('result-overlay'),
    resultTitle:   $('result-title'),
    resultDetail:  $('result-detail'),

    cpuChoiceWrap:   $('cpu-choice-display'),
    cpuChoiceCanvas: $('cpu-choice-canvas'),

    cantMsg: $('cant-attack-msg'),

    endMessage: $('end-message'),
    endSub:     $('end-sub'),
  };
}

// ──────────────────────────────────────────
// 場景切換
// ──────────────────────────────────────────
function showScene(name) {
  D.sceneTitle.style.display  = 'none';
  D.sceneJanken.style.display = 'none';
  D.sceneBattle.style.display = 'none';
  D.sceneEnd.style.display    = 'none';

  const map = { title: D.sceneTitle, janken: D.sceneJanken,
                battle: D.sceneBattle, end: D.sceneEnd };
  map[name].style.display = 'flex';
  state.scene = name;
}

// ──────────────────────────────────────────
// 渲染
// ──────────────────────────────────────────
function renderTerritories() {
  function fill(container, count, activeClass, inactiveClass) {
    container.innerHTML = '';
    for (let i = 0; i < MAX_BUILD; i++) {
      const c = document.createElement('div');
      c.className = 'territory-cell ' + (i < count ? activeClass : inactiveClass);
      container.appendChild(c);
    }
  }
  fill(D.redTerritory,  state.yourBuild, 'red-active',  'red-inactive');
  fill(D.blueTerritory, state.myBuild,   'blue-active', 'blue-inactive');
}

function renderHPBars() {
  const myPct  = Math.max(0, (state.myHP  / MAX_HP) * 100);
  const youPct = Math.max(0, (state.yourHP / MAX_HP) * 100);
  D.myHPFill.style.width   = myPct  + '%';
  D.yourHPFill.style.width = youPct + '%';
  D.myHPNum.textContent    = state.myHP;
  D.yourHPNum.textContent  = state.yourHP;
}

function renderScoreboard() {
  D.myBuildVal.textContent   = state.myBuild;
  D.yourBuildVal.textContent = state.yourBuild;
  D.myHPVal.textContent      = state.myHP;
  D.yourHPVal.textContent    = state.yourHP;
}

function updateActionBtns() {
  const waiting = state.waitingForAction && !state.gameOver;
  D.btnBuild.disabled  = !waiting;
  D.btnAttack.disabled = !waiting || state.myBuild < ATTACK_COST;
}

function flashCell(container, idx) {
  const cells = container.querySelectorAll('.territory-cell');
  if (!cells[idx]) return;
  cells[idx].style.transform  = 'scale(1.5)';
  cells[idx].style.transition = 'transform 0.18s';
  setTimeout(() => { cells[idx].style.transform = ''; }, 250);
}

// ──────────────────────────────────────────
// 猜拳邏輯
// ──────────────────────────────────────────
function judge(mine, cpu) {
  if (mine === cpu) return 'draw';
  return (BEATS[mine] && BEATS[mine][cpu]) ? 'win' : 'lose';
}
function cpuPick() { return CHOICES[Math.floor(Math.random() * 3)]; }

// ──────────────────────────────────────────
// 事件：START
// ──────────────────────────────────────────
function onStart() {
  sfxStart();
  resetState();
  showScene('janken');
  refreshJanken();
}

function refreshJanken() {
  D.jankenRound.textContent = '第 ' + state.round + ' 回合';
  D.resultOverlay.style.display  = 'none';
  D.cpuChoiceWrap.style.display  = 'none';
  // 重繪手勢圖示
  D.jankenBtns.forEach(btn => {
    const cv = btn.querySelector('canvas');
    cv.width = 80; cv.height = 80;
    drawHand(cv, btn.dataset.choice, 1.0);
  });
}

// ──────────────────────────────────────────
// 事件：猜拳選擇
// ──────────────────────────────────────────
function onJanken(myChoice) {
  if (state.gameOver) return;
  sfxClick();

  const cpu    = cpuPick();
  const result = judge(myChoice, cpu);
  state.lastMyChoice  = myChoice;
  state.lastCpuChoice = cpu;
  state.lastResult    = result;

  // 顯示電腦出拳
  D.cpuChoiceCanvas.width = 64; D.cpuChoiceCanvas.height = 64;
  drawHand(D.cpuChoiceCanvas, cpu, 0.8);
  D.cpuChoiceWrap.style.display = 'flex';

  // 顯示結果浮層
  const labels = { win: '你贏了！', lose: '你輸了！', draw: '平手！' };
  D.resultTitle.textContent = labels[result];
  D.resultTitle.className   = result;
  D.resultDetail.textContent =
    '你出：' + CHOICE_LABEL[myChoice] + '　電腦出：' + CHOICE_LABEL[cpu];
  D.resultOverlay.style.display = 'flex';

  if (result === 'win') {
    sfxWin();
    state.waitingForAction = true;
    setTimeout(() => {
      D.resultOverlay.style.display = 'none';
      D.cpuChoiceWrap.style.display = 'none';
      showScene('battle');
      renderTerritories();
      renderHPBars();
      renderScoreboard();
      updateActionBtns();
      D.cantMsg.style.display = 'none';
    }, 1300);
  } else if (result === 'lose') {
    sfxLose();
    setTimeout(() => {
      D.resultOverlay.style.display = 'none';
      D.cpuChoiceWrap.style.display = 'none';
      showScene('battle');
      renderTerritories();
      renderHPBars();
      renderScoreboard();
      updateActionBtns();
      D.cantMsg.style.display = 'none';
      // 電腦自動行動
      setTimeout(cpuAutoAction, 600);
    }, 1300);
  } else {
    // 平手
    sfxDraw();
    setTimeout(() => {
      D.resultOverlay.style.display = 'none';
      D.cpuChoiceWrap.style.display = 'none';
    }, 1000);
  }
}

// ──────────────────────────────────────────
// 電腦 AI
// ──────────────────────────────────────────
function cpuAutoAction() {
  if (state.gameOver) return;
  const canAtk = state.yourBuild >= ATTACK_COST;
  // 策略：若可攻擊且隨機 60% 機率攻擊，否則建設
  if (canAtk && Math.random() < 0.6) cpuDoAttack();
  else cpuDoBuild();
}

function cpuDoBuild() {
  if (state.yourBuild < MAX_BUILD) {
    state.yourBuild++;
    sfxBuild();
    renderTerritories();
    renderScoreboard();
    flashCell(D.redTerritory, state.yourBuild - 1);
  }
  afterAction();
}

function cpuDoAttack() {
  if (state.yourBuild < ATTACK_COST) { cpuDoBuild(); return; }
  state.yourBuild -= ATTACK_COST;
  state.myHP = Math.max(0, state.myHP - 1);
  sfxAttack();
  renderTerritories();
  renderHPBars();
  renderScoreboard();
  // 震動效果
  D.sceneBattle.style.animation = 'none';
  void D.sceneBattle.offsetWidth;
  D.sceneBattle.style.animation = 'shakeX 0.4s ease-in-out';
  afterAction();
}

// ──────────────────────────────────────────
// 玩家行動
// ──────────────────────────────────────────
function onBuild() {
  if (!state.waitingForAction || state.gameOver) return;
  state.waitingForAction = false;
  updateActionBtns();

  if (state.myBuild < MAX_BUILD) {
    state.myBuild++;
    sfxBuild();
    renderTerritories();
    renderScoreboard();
    flashCell(D.blueTerritory, state.myBuild - 1);
  }
  afterAction();
}

function onAttack() {
  if (!state.waitingForAction || state.gameOver) return;
  if (state.myBuild < ATTACK_COST) {
    // 顯示提示
    D.cantMsg.style.display = 'block';
    D.cantMsg.style.animation = 'none';
    void D.cantMsg.offsetWidth;
    D.cantMsg.style.animation = 'fadeIn 0.3s ease-out';
    setTimeout(() => { D.cantMsg.style.display = 'none'; }, 1600);
    return;
  }
  state.waitingForAction = false;
  updateActionBtns();

  state.myBuild -= ATTACK_COST;
  state.yourHP  = Math.max(0, state.yourHP - 1);
  sfxAttack();
  renderTerritories();
  renderHPBars();
  renderScoreboard();
  afterAction();
}

// ──────────────────────────────────────────
// 行動後處理
// ──────────────────────────────────────────
function afterAction() {
  if (state.myHP <= 0 || state.yourHP <= 0) {
    setTimeout(endGame, 500);
    return;
  }
  state.round++;
  setTimeout(() => {
    showScene('janken');
    refreshJanken();
  }, 700);
}

// ──────────────────────────────────────────
// 遊戲結束
// ──────────────────────────────────────────
function endGame() {
  state.gameOver = true;
  showScene('end');

  let outcome;
  if (state.myHP <= 0 && state.yourHP <= 0) outcome = 'draw';
  else if (state.yourHP <= 0) outcome = 'victory';
  else outcome = 'defeat';

  if (outcome === 'victory') {
    D.endMessage.textContent = '天下太平！';
    D.endMessage.className   = 'victory';
    D.endSub.textContent     = '你守護了和平！（共 ' + state.round + ' 回合）';
    sfxVictory();
  } else if (outcome === 'defeat') {
    D.endMessage.textContent = '戰敗了…';
    D.endMessage.className   = 'defeat';
    D.endSub.textContent     = '你的城池被攻陷了。（共 ' + state.round + ' 回合）';
    sfxDefeat();
  } else {
    D.endMessage.textContent = '兩敗俱傷';
    D.endMessage.className   = 'defeat';
    D.endSub.textContent     = '雙方同時倒下。（共 ' + state.round + ' 回合）';
    sfxDefeat();
  }
}

// ──────────────────────────────────────────
// 初始化
// ──────────────────────────────────────────
function init() {
  cacheDom();
  resetState();

  // 預繪猜拳圖示
  D.jankenBtns.forEach(btn => {
    const cv = btn.querySelector('canvas');
    cv.width = 80; cv.height = 80;
    drawHand(cv, btn.dataset.choice, 1.0);
  });

  // 事件綁定
  D.btnStart.addEventListener('click', onStart);
  D.btnRetry.addEventListener('click', () => { sfxClick(); resetState(); showScene('title'); });
  D.jankenBtns.forEach(btn => btn.addEventListener('click', () => onJanken(btn.dataset.choice)));
  D.btnBuild.addEventListener('click',  onBuild);
  D.btnAttack.addEventListener('click', onAttack);

  showScene('title');
}

document.addEventListener('DOMContentLoaded', init);
