(() => {
"use strict";

const { CircleObstacle, Particle, PhysicsWorld, clamp } = window.KRPhysics;
const { loadOriginalAssets, Renderer } = window.KRRenderer;

const canvas = document.querySelector("#gameCanvas");
const loadingMessage = document.querySelector("#loadingMessage");
const statusText = document.querySelector("#statusText");
const speedText = document.querySelector("#speedText");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");
const skeletonToggle = document.querySelector("#skeletonToggle");
const speedButtons = [...document.querySelectorAll("[data-speed]")];

const renderer = new Renderer(canvas);
const world = new PhysicsWorld();
const rig = {};
const camera = { x: 0, y: 0, vx: 0, vy: 0 };
const dragTarget = { x: 0, y: 0 };
const fixedStep = 1 / 120;
const maxAccumulator = 0.08;
const random = mulberry32(0x4b522d37);

let assetsReady = false;
let paused = false;
let speed = 1;
let accumulator = 0;
let previousTime = performance.now();
let activePointerId = null;

function mulberry32(seed) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function addParticle(name, x, y, mass, radius) {
  const particle = world.addParticle(new Particle(name, x, y, mass, radius));
  rig[name] = particle;
  return particle;
}

function buildRagdoll() {
  world.particles.length = 0;
  world.distanceConstraints.length = 0;
  world.angleConstraints.length = 0;
  world.release();
  for (const key of Object.keys(rig)) delete rig[key];

  addParticle("head", 0, -164, 1.45, 19);
  addParticle("neck", 0, -92, 0.92, 14);
  addParticle("stomach", 0, 0, 1.25, 17);
  addParticle("pants", 0, 90, 1.2, 17);
  addParticle("arm1", -72, -64, 0.78, 13);
  addParticle("hand1", -118, 7, 0.55, 11);
  addParticle("arm2", 72, -64, 0.78, 13);
  addParticle("hand2", 118, 7, 0.55, 11);
  addParticle("knee1", -47, 184, 1.02, 14);
  addParticle("foot1", -72, 278, 0.78, 15);
  addParticle("knee2", 47, 184, 1.02, 14);
  addParticle("foot2", 72, 278, 0.78, 15);

  const bone = (a, b, stiffness = 0.95) => world.addDistance(rig[a], rig[b], undefined, stiffness);
  bone("head", "neck");
  bone("neck", "stomach");
  bone("stomach", "pants");
  bone("neck", "arm1");
  bone("arm1", "hand1");
  bone("neck", "arm2");
  bone("arm2", "hand2");
  bone("pants", "knee1");
  bone("knee1", "foot1");
  bone("pants", "knee2");
  bone("knee2", "foot2");

  const hinge = (a, pivot, b, min, max) => world.addAngle(rig[a], rig[pivot], rig[b], min, max);
  hinge("head", "neck", "stomach", -0.68, 0.68);
  hinge("arm1", "neck", "stomach", -2.65, 0.58);
  hinge("hand1", "arm1", "neck", -2.75, 0.22);
  hinge("arm2", "neck", "stomach", -0.58, 2.65);
  hinge("hand2", "arm2", "neck", -0.22, 2.75);
  hinge("stomach", "pants", "knee1", -2.2, 0.38);
  hinge("foot1", "knee1", "pants", -2.42, 0.2);
  hinge("stomach", "pants", "knee2", -0.38, 2.2);
  hinge("foot2", "knee2", "pants", -0.2, 2.42);

  camera.x = rig.head.x;
  camera.y = rig.head.y - 95;
  camera.vx = 0;
  camera.vy = 0;
}

function seedObstacles() {
  world.obstacles.length = 0;
  for (let index = 0; index < 30; index += 1) {
    const x = (random() - 0.5) * 720;
    const y = 260 + index * 108 + random() * 140;
    const radius = 44 + random() * 98;
    world.obstacles.push(new CircleObstacle(x, y, radius, index * 1.71));
  }
}

function recycleObstacles() {
  const head = rig.head;
  let lowest = Math.max(...world.obstacles.map((obstacle) => obstacle.y));
  for (const obstacle of world.obstacles) {
    if (obstacle.y < head.y - 380) {
      lowest += 108 + random() * 170;
      obstacle.x = (random() - 0.5) * 760;
      obstacle.y = lowest;
      obstacle.radius = 44 + random() * 104;
      obstacle.seed = random() * Math.PI;
    }
  }
}

function stepSimulation() {
  world.step(fixedStep);
  recycleObstacles();
  if (!world.dragged.length) {
    const targetX = rig.head.x;
    const targetY = rig.head.y - 92;
    camera.vx += (targetX - camera.x) * 0.021;
    camera.vy += (targetY - camera.y) * 0.021;
    camera.vx *= 0.82;
    camera.vy *= 0.82;
    camera.x += camera.vx;
    camera.y += camera.vy;
  }
}

function frame(time) {
  const elapsed = Math.min((time - previousTime) / 1000, maxAccumulator);
  previousTime = time;
  if (assetsReady && !paused) {
    accumulator = Math.min(accumulator + elapsed * speed, maxAccumulator);
    while (accumulator >= fixedStep) {
      stepSimulation();
      accumulator -= fixedStep;
    }
  }

  renderer.setCamera(camera.x, camera.y);
  renderer.render(world, rig, {
    showSkeleton: skeletonToggle.checked,
    dragTarget: world.dragged.length ? dragTarget : null,
  });
  requestAnimationFrame(frame);
}

function getPointerWorldPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return renderer.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
}

function updateDragTarget(event) {
  const target = getPointerWorldPosition(event);
  dragTarget.x = target.x;
  dragTarget.y = target.y;
  world.setDragTarget(target.x, target.y);
}

function setPaused(nextPaused) {
  paused = nextPaused;
  pauseButton.textContent = paused ? "繼續" : "暫停";
  pauseButton.setAttribute("aria-pressed", String(paused));
  statusText.textContent = paused ? "已暫停" : "執行中";
  if (!paused) previousTime = performance.now();
}

function setSpeed(nextSpeed) {
  speed = clamp(nextSpeed, 0.25, 3);
  speedText.textContent = `${speed.toFixed(speed === 1 ? 0 : 2)}×`;
  for (const button of speedButtons) {
    const isActive = Number(button.dataset.speed) === speed;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function resetScene() {
  buildRagdoll();
  seedObstacles();
  accumulator = 0;
  activePointerId = null;
  statusText.textContent = paused ? "已暫停" : "執行中";
}

canvas.addEventListener("pointerdown", (event) => {
  if (!assetsReady) return;
  canvas.setPointerCapture(event.pointerId);
  activePointerId = event.pointerId;
  updateDragTarget(event);
  const grabbed = world.selectNear(dragTarget.x, dragTarget.y);
  statusText.textContent = grabbed ? `抓住 ${grabbed} 個關節` : "沒有抓到關節";
  event.preventDefault();
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) return;
  updateDragTarget(event);
  event.preventDefault();
});

function releasePointer(event) {
  if (event.pointerId !== activePointerId) return;
  world.release();
  activePointerId = null;
  if (!paused) statusText.textContent = "執行中";
}

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("lostpointercapture", releasePointer);

pauseButton.addEventListener("click", () => setPaused(!paused));
resetButton.addEventListener("click", resetScene);
speedButtons.forEach((button) => {
  button.addEventListener("click", () => setSpeed(Number(button.dataset.speed)));
});

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    setPaused(!paused);
  } else if (event.key === "r" || event.key === "R") {
    resetScene();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    setSpeed(clamp(speed + 0.1, 0.25, 3));
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    setSpeed(clamp(speed - 0.1, 0.25, 3));
  }
});

async function initialize() {
  buildRagdoll();
  seedObstacles();
  try {
    renderer.setAssets(await loadOriginalAssets());
    assetsReady = true;
    loadingMessage.hidden = true;
    setPaused(false);
  } catch (error) {
    loadingMessage.textContent = "原始美術素材無法載入；請使用本機 HTTP 伺服器開啟。";
    statusText.textContent = "素材載入失敗";
    console.error(error);
  }
}

initialize();
requestAnimationFrame(frame);

})();
