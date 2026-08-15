import { HEIGHT, WIDTH, clamp } from "./config.js";

export class Renderer {
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
