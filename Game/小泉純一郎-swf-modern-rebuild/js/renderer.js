(() => {
"use strict";

const imageSources = {
  thigh: "assets/original/original_character_1.png",
  chest: "assets/original/original_character_4.png",
  stomach: "assets/original/original_character_7.png",
  hand: "assets/original/original_character_8.png",
  head: "assets/original/original_character_11.png",
  sleeve: "assets/original/original_character_14.png",
  leg: "assets/original/original_character_17.png",
  arm: "assets/original/original_character_20.png",
  ball: "assets/original/original_character_23.png",
};

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`無法載入素材：${source}`));
    image.src = source;
  });
}

async function loadOriginalAssets() {
  const entries = await Promise.all(
    Object.entries(imageSources).map(async ([name, source]) => [name, await loadImage(source)]),
  );
  return Object.fromEntries(entries);
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.camera = { x: 0, y: 0 };
    this.assets = null;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  destroy() {
    this.resizeObserver.disconnect();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  setAssets(assets) {
    this.assets = assets;
  }

  setCamera(x, y) {
    this.camera.x = x;
    this.camera.y = y;
  }

  worldToScreen(x, y) {
    return {
      x: this.width * 0.5 + (x - this.camera.x),
      y: this.height * 0.44 + (y - this.camera.y),
    };
  }

  screenToWorld(x, y) {
    return {
      x: this.camera.x + (x - this.width * 0.5),
      y: this.camera.y + (y - this.height * 0.44),
    };
  }

  render(world, rig, options = {}) {
    const { ctx, width, height } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackdrop(ctx, width, height);
    if (!this.assets) return;
    this.drawWorldLabels(ctx);
    this.drawObstacles(ctx, world.obstacles);
    this.drawRagdoll(ctx, rig);
    if (options.showSkeleton) this.drawSkeleton(ctx, world, rig);
    if (world.dragged.length && options.dragTarget) this.drawDragBeam(ctx, world.dragged[0], options.dragTarget);
  }

  drawBackdrop(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#122436");
    gradient.addColorStop(0.58, "#08111c");
    gradient.addColorStop(1, "#040a11");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const parallaxY = ((this.camera.y * 0.08) % 84 + 84) % 84;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(165, 200, 222, 0.055)";
    for (let y = -parallaxY; y < height; y += 84) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    const parallaxX = ((this.camera.x * 0.06) % 84 + 84) % 84;
    for (let x = -parallaxX; x < width; x += 84) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(width * 0.55, height * 0.18, 0, width * 0.55, height * 0.18, width * 0.72);
    glow.addColorStop(0, "rgba(133, 189, 211, 0.13)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  drawWorldLabels(ctx) {
    const cameraDepth = Math.floor(this.camera.y / 100);
    ctx.save();
    ctx.fillStyle = "rgba(224, 238, 245, 0.38)";
    ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.letterSpacing = "0.08em";
    ctx.fillText(`FALL DEPTH ${Math.max(0, cameraDepth).toString().padStart(5, "0")} m`, 18, 26);
    ctx.restore();
  }

  drawObstacles(ctx, obstacles) {
    const image = this.assets.ball;
    for (const obstacle of obstacles) {
      const point = this.worldToScreen(obstacle.x, obstacle.y);
      const radius = obstacle.radius;
      if (point.x + radius < -16 || point.x - radius > this.width + 16 || point.y + radius < -16 || point.y - radius > this.height + 16) continue;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 7;
      ctx.drawImage(image, point.x - radius, point.y - radius, radius * 2, radius * 2);
      ctx.restore();
    }
  }

  drawRagdoll(ctx, rig) {
    const segment = (first, second, imageName, lengthScale = 1, alpha = 1) => {
      this.drawSegment(ctx, rig[first], rig[second], this.assets[imageName], lengthScale, alpha);
    };

    // 後方肢體先繪製，避免身體被遮住。
    segment("pants", "knee2", "thigh", 1.05, 0.93);
    segment("knee2", "foot2", "leg", 1.08, 0.95);
    segment("neck", "arm2", "sleeve", 1.05, 0.94);
    segment("arm2", "hand2", "arm", 0.95, 0.94);
    this.drawEndpoint(ctx, rig.hand2, this.assets.hand, 0.9);

    segment("stomach", "pants", "stomach", 1.06);
    segment("stomach", "neck", "chest", 1.14);
    this.drawHead(ctx, rig.head);

    segment("pants", "knee1", "thigh", 1.05);
    segment("knee1", "foot1", "leg", 1.08);
    segment("neck", "arm1", "sleeve", 1.05);
    segment("arm1", "hand1", "arm", 0.95);
    this.drawEndpoint(ctx, rig.hand1, this.assets.hand, 0.9);
  }

  drawSegment(ctx, a, b, image, lengthScale = 1, alpha = 1) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.max(1, Math.hypot(dx, dy) * lengthScale);
    const middle = this.worldToScreen((a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    const scale = length / image.naturalHeight;
    const drawWidth = image.naturalWidth * scale;
    ctx.save();
    ctx.translate(middle.x, middle.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(image, -drawWidth / 2, -length / 2, drawWidth, length);
    ctx.restore();
  }

  drawEndpoint(ctx, particle, image, scale = 1) {
    const point = this.worldToScreen(particle.x, particle.y);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.drawImage(image, point.x - width / 2, point.y - height / 2, width, height);
    ctx.restore();
  }

  drawHead(ctx, particle) {
    const image = this.assets.head;
    const point = this.worldToScreen(particle.x, particle.y);
    const width = 94;
    const height = width * (image.naturalHeight / image.naturalWidth);
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.44)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(image, point.x - width / 2, point.y - height * 0.56, width, height);
    ctx.restore();
  }

  drawSkeleton(ctx, world, rig) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 203, 112, 0.72)";
    ctx.setLineDash([4, 5]);
    for (const constraint of world.distanceConstraints) {
      const a = this.worldToScreen(constraint.a.x, constraint.a.y);
      const b = this.worldToScreen(constraint.b.x, constraint.b.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const particle of Object.values(rig)) {
      const p = this.worldToScreen(particle.x, particle.y);
      ctx.fillStyle = "#ffce79";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDragBeam(ctx, particle, dragTarget) {
    const p = this.worldToScreen(particle.x, particle.y);
    const target = this.worldToScreen(dragTarget.x, dragTarget.y);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 207, 124, 0.42)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.restore();
  }
}


window.KRRenderer = Object.freeze({
  loadOriginalAssets,
  Renderer,
});
})();
