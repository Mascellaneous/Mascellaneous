/**
 * 天下太平 - 網頁重製版
 * 背景繪製模組
 *
 * 原始 SWF 的 JPEG 資產（definebits_38）為太空俯瞰地球的照片背景，
 * 此處以 Canvas 繪製忠實還原的程序化版本。
 */

(function () {
  'use strict';

  /**
   * 繪製太空俯瞰地球背景（對戰場景）
   * 還原原作：深黑太空 + 地球弧線 + 藍色大氣層 + 陸地輪廓
   */
  function drawSpaceBg(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // 太空背景（深黑到深藍漸層）
    const spaceBg = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    spaceBg.addColorStop(0,   '#000005');
    spaceBg.addColorStop(0.6, '#050a1a');
    spaceBg.addColorStop(1,   '#0a1530');
    ctx.fillStyle = spaceBg;
    ctx.fillRect(0, 0, W, H * 0.45);

    // 星點
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const stars = [
      [12,8],[45,15],[78,5],[110,20],[140,8],[180,18],[220,6],
      [250,12],[290,4],[320,16],[360,9],[400,3],[430,14],[470,7],
      [500,19],[530,11],[25,30],[60,35],[95,28],[130,38],[165,25],
      [200,33],[235,22],[270,36],[305,29],[340,17],[375,32],[410,24],
      [445,38],[480,27],[515,34]
    ];
    stars.forEach(([x,y]) => {
      ctx.beginPath();
      ctx.arc(x * W/550, y * H/400, 0.8, 0, Math.PI*2);
      ctx.fill();
    });

    // 地球大弧（從畫面中段開始）
    const earthY = H * 0.28;
    const earthR = W * 1.1;

    // 大氣層光暈（藍色）
    const atmGrad = ctx.createRadialGradient(W/2, earthY + earthR, earthR * 0.9,
                                              W/2, earthY + earthR, earthR * 1.02);
    atmGrad.addColorStop(0,   'rgba(30,100,200,0)');
    atmGrad.addColorStop(0.5, 'rgba(50,150,255,0.25)');
    atmGrad.addColorStop(1,   'rgba(100,200,255,0.0)');
    ctx.fillStyle = atmGrad;
    ctx.beginPath();
    ctx.arc(W/2, earthY + earthR, earthR * 1.02, Math.PI, 0);
    ctx.fill();

    // 地球主體（海洋藍）
    const earthGrad = ctx.createLinearGradient(0, earthY, 0, H);
    earthGrad.addColorStop(0,   '#1a4a8a');
    earthGrad.addColorStop(0.3, '#1e5fa0');
    earthGrad.addColorStop(0.6, '#2070b8');
    earthGrad.addColorStop(1,   '#1560a0');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(W/2, earthY + earthR, earthR, Math.PI, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 大氣層上緣（白藍漸層）
    const atmTop = ctx.createLinearGradient(0, earthY - 8, 0, earthY + 20);
    atmTop.addColorStop(0,   'rgba(180,220,255,0)');
    atmTop.addColorStop(0.4, 'rgba(160,210,255,0.6)');
    atmTop.addColorStop(0.7, 'rgba(100,170,240,0.4)');
    atmTop.addColorStop(1,   'rgba(30,100,200,0)');
    ctx.fillStyle = atmTop;
    ctx.beginPath();
    ctx.arc(W/2, earthY + earthR, earthR + 12, Math.PI, 0);
    ctx.arc(W/2, earthY + earthR, earthR - 2,  0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // 陸地（棕綠色塊，模擬原作地形）
    ctx.fillStyle = 'rgba(80,120,60,0.75)';

    // 左側大陸
    ctx.save();
    ctx.beginPath();
    ctx.arc(W/2, earthY + earthR, earthR, Math.PI, 0);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.clip();

    // 陸塊 1（左下）
    ctx.beginPath();
    ctx.moveTo(W*0.02, H*0.55);
    ctx.bezierCurveTo(W*0.05, H*0.45, W*0.18, H*0.42, W*0.22, H*0.50);
    ctx.bezierCurveTo(W*0.28, H*0.60, W*0.20, H*0.72, W*0.10, H*0.75);
    ctx.bezierCurveTo(W*0.04, H*0.72, W*0.00, H*0.65, W*0.02, H*0.55);
    ctx.fill();

    // 陸塊 2（中央）
    ctx.beginPath();
    ctx.moveTo(W*0.30, H*0.38);
    ctx.bezierCurveTo(W*0.38, H*0.32, W*0.52, H*0.34, W*0.55, H*0.42);
    ctx.bezierCurveTo(W*0.58, H*0.52, W*0.50, H*0.62, W*0.40, H*0.60);
    ctx.bezierCurveTo(W*0.30, H*0.58, W*0.24, H*0.48, W*0.30, H*0.38);
    ctx.fill();

    // 陸塊 3（右側）
    ctx.beginPath();
    ctx.moveTo(W*0.65, H*0.45);
    ctx.bezierCurveTo(W*0.72, H*0.38, W*0.85, H*0.40, W*0.90, H*0.50);
    ctx.bezierCurveTo(W*0.95, H*0.62, W*0.88, H*0.75, W*0.78, H*0.72);
    ctx.bezierCurveTo(W*0.68, H*0.68, W*0.60, H*0.58, W*0.65, H*0.45);
    ctx.fill();

    // 雲層（白色半透明）
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    [[W*0.1, H*0.48, W*0.15, H*0.04],
     [W*0.35, H*0.36, W*0.12, H*0.03],
     [W*0.58, H*0.42, W*0.18, H*0.035],
     [W*0.75, H*0.55, W*0.14, H*0.03],
     [W*0.20, H*0.62, W*0.10, H*0.025]
    ].forEach(([x,y,rx,ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
      ctx.fill();
    });

    ctx.restore();

    // 海洋光澤
    const sheen = ctx.createLinearGradient(W*0.3, earthY, W*0.7, earthY + 30);
    sheen.addColorStop(0,   'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.arc(W/2, earthY + earthR, earthR, Math.PI, 0);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fill();
  }

  /**
   * 繪製結局背景（同款太空背景，略暗）
   */
  function drawEndBg(canvas) {
    drawSpaceBg(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * 將 Canvas 繪製結果套用為元素背景
   */
  function applyCanvasBg(elementId, drawFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width  = 550;
    canvas.height = 400;
    drawFn(canvas);
    el.style.backgroundImage    = 'url(' + canvas.toDataURL('image/jpeg', 0.92) + ')';
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  }

  function applyAllBgs() {
    applyCanvasBg('battle-bg', drawSpaceBg);
    applyCanvasBg('end-bg',    drawEndBg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllBgs);
  } else {
    applyAllBgs();
  }

  window.GAME_ASSETS = { drawSpaceBg, drawEndBg };
})();
