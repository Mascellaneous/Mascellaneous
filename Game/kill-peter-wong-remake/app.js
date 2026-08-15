/*
 * Design reminder — Faithful Flash-to-Canvas Archive:
 * Implement the original click-to-hit rule directly in DOM state. No Flash
 * player, package manager, CDN, framework, network request, or game engine.
 */
(() => {
  const INTRO_ART = "assets/intro-stage.png";
  const PLAYFIELD_ART = "assets/playfield.png";
  const maxLife = 1000;
  const damagePerHit = 20;
  const positions = [
    { x: 9, y: 46 }, { x: 25, y: 15 }, { x: 43, y: 39 }, { x: 59, y: 17 },
    { x: 68, y: 42 }, { x: 50, y: 47 }, { x: 40, y: 20 }, { x: 55, y: 32 },
  ];

  const stage = document.querySelector("#game-stage");
  const stageArt = document.querySelector("#stage-art");
  const overlay = document.querySelector("#game-overlay");
  const beginHitbox = document.querySelector("#begin-hitbox");
  const target = document.querySelector("#egg-target");
  const lifeValue = document.querySelector("#life-value");
  const lifeCounter = document.querySelector("#life-counter");
  const lifeMeter = document.querySelector("#life-meter");
  const crosshair = document.querySelector("#crosshair");
  const endCard = document.querySelector("#end-card");
  const announcement = document.querySelector("#announcement");
  const mainAction = document.querySelector("#main-action");
  const endReset = document.querySelector("#end-reset");

  let started = false;
  let life = maxLife;
  let currentPosition = positions[0];

  const setPosition = (position) => {
    currentPosition = position;
    target.style.left = `${position.x}%`;
    target.style.top = `${position.y}%`;
  };

  const chooseNextPosition = () => {
    const candidates = positions.filter((position) => position.x !== currentPosition.x || position.y !== currentPosition.y);
    return candidates[Math.floor(Math.random() * candidates.length)] || positions[0];
  };

  const setCrosshair = (event) => {
    const box = stage.getBoundingClientRect();
    crosshair.style.left = `${((event.clientX - box.left) / box.width) * 100}%`;
    crosshair.style.top = `${((event.clientY - box.top) / box.height) * 100}%`;
    crosshair.hidden = false;
  };

  const updateLife = () => {
    lifeValue.textContent = String(life);
    lifeCounter.setAttribute("aria-label", `皮蛋除命 ${life}`);
    lifeMeter.style.width = `${Math.max(0, (life / maxLife) * 100)}%`;
    target.setAttribute("aria-label", `Egg target. ${life} HP remaining. Click to remove 20 HP.`);
  };

  const begin = () => {
    started = true;
    life = maxLife;
    stage.classList.remove("game-stage--briefing");
    stage.classList.add("game-stage--playing");
    stageArt.src = PLAYFIELD_ART;
    stage.setAttribute("aria-label", "Kill Peter Wong game. Click the egg target.");
    beginHitbox.hidden = true;
    overlay.hidden = false;
    endCard.hidden = true;
    crosshair.hidden = true;
    setPosition(positions[0]);
    updateLife();
    announcement.textContent = "Game started. Click the egg to remove 20 HP.";
    mainAction.textContent = "Restart briefing";
  };

  const reset = () => {
    started = false;
    life = maxLife;
    stage.classList.remove("game-stage--playing", "game-stage--hit");
    stage.classList.add("game-stage--briefing");
    stageArt.src = INTRO_ART;
    stage.setAttribute("aria-label", "Kill Peter Wong rules screen. Click the egg to begin.");
    beginHitbox.hidden = false;
    overlay.hidden = true;
    crosshair.hidden = true;
    announcement.textContent = "Returned to the original briefing.";
    mainAction.textContent = "Begin original game";
  };

  const hit = (event) => {
    if (!started || life <= 0) return;
    event.stopPropagation();
    setCrosshair(event);
    life = Math.max(0, life - damagePerHit);
    updateLife();
    stage.classList.add("game-stage--hit");
    window.setTimeout(() => stage.classList.remove("game-stage--hit"), 180);
    if (life === 0) {
      target.hidden = true;
      endCard.hidden = false;
      announcement.textContent = "皮蛋歸零。Original game complete.";
    } else {
      setPosition(chooseNextPosition());
      announcement.textContent = `Hit. 20 HP removed. ${life} HP remains.`;
    }
  };

  beginHitbox.addEventListener("click", begin);
  mainAction.addEventListener("click", () => (started ? reset() : begin()));
  endReset.addEventListener("click", reset);
  target.addEventListener("click", hit);
  stage.addEventListener("click", (event) => {
    if (!started || life <= 0 || event.target === target || target.contains(event.target)) return;
    setCrosshair(event);
    announcement.textContent = "Miss. The target has moved.";
  });
  stage.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !started) {
      event.preventDefault();
      begin();
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      reset();
    }
  });
})();
