/**
 * app.js — 將軍澳巴士到站時間
 *
 * 從九巴 ETA API 取得資料並動態渲染卡片。
 * 路線設定請修改 config.js。
 */

const KMB_ETA_BASE = "https://data.etabus.gov.hk/v1/transport/kmb/eta";

/* ── 工具函式 ── */

/**
 * 計算距離現在的分鐘數（四捨五入）
 * @param {string} isoTime  ISO 8601 時間字串
 * @returns {number}
 */
function minutesFromNow(isoTime) {
  const diff = (new Date(isoTime) - Date.now()) / 60000;
  return Math.round(diff);
}

/**
 * 格式化時間為 HH:MM
 */
function formatTime(isoTime) {
  const d = new Date(isoTime);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ── 卡片 DOM 建立 ── */

/**
 * 建立一張巴士卡片的 DOM 元素
 * @param {object} cfg  BUS_CONFIG 中的單一路線設定
 * @returns {HTMLElement}
 */
function createCard(cfg) {
  const card = document.createElement("div");
  card.className = "bus-card";
  card.style.setProperty("--card-color", cfg.color);
  card.dataset.stopId = cfg.stopId;
  card.dataset.route = cfg.route;
  card.dataset.serviceType = cfg.serviceType;

  card.innerHTML = `
    <div class="card-route-badge">${cfg.route}</div>
    <div class="card-route-line">
      <span class="card-dot"></span>
      <span class="card-origin">${cfg.stopName}</span>
      <span class="card-arrow">➔</span>
      <span class="card-dest">${cfg.dest}</span>
    </div>
    <div class="card-label">
      <span class="card-label-bar"></span>
      下一班到站
    </div>
    <div class="card-eta-area">
      <div class="card-loading">
        <div class="spinner"></div>
        正在查看
      </div>
    </div>
  `;

  return card;
}

/* ── ETA 資料獲取與渲染 ── */

/**
 * 從 API 取得 ETA 並更新卡片顯示
 * @param {HTMLElement} card
 */
async function fetchAndRenderEta(card) {
  const { stopId, route, serviceType } = card.dataset;
  const etaArea = card.querySelector(".card-eta-area");

  // 顯示載入中
  etaArea.innerHTML = `
    <div class="card-loading">
      <div class="spinner"></div>
      正在查看
    </div>
  `;

  try {
    const url = `${KMB_ETA_BASE}/${stopId}/${route}/${serviceType}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // 只取 outbound (dir=O) 且有 eta 時間的班次，按時間排序
    const etas = (json.data || [])
      .filter((e) => e.dir === "O" && e.eta)
      .sort((a, b) => new Date(a.eta) - new Date(b.eta));

    if (etas.length === 0) {
      etaArea.innerHTML = `<div class="card-no-service">暫無班次資料</div>`;
      return;
    }

    const first = etas[0];
    const mins = minutesFromNow(first.eta);
    const timeStr = formatTime(first.eta);

    let primaryHtml;
    if (mins <= 0) {
      primaryHtml = `
        <div class="card-eta-primary">
          <span class="card-eta-prefix">仲有</span>
          <span class="card-eta-arriving">到站</span>
        </div>
      `;
    } else {
      primaryHtml = `
        <div class="card-eta-primary">
          <span class="card-eta-prefix">仲有</span>
          <span class="card-eta-minutes">${mins}</span>
          <span class="card-eta-unit">分</span>
        </div>
      `;
    }

    // 第二班
    let nextHtml = "";
    if (etas.length >= 2) {
      const second = etas[1];
      const mins2 = minutesFromNow(second.eta);
      const time2 = formatTime(second.eta);
      if (mins2 > 0) {
        nextHtml = `<div class="card-eta-next">之後 ${mins2} 分 &nbsp;(${time2})</div>`;
      }
    }

    etaArea.innerHTML = primaryHtml + nextHtml;
  } catch (err) {
    etaArea.innerHTML = `<div class="card-error">無法取得資料</div>`;
    console.error(`[${route}] ETA fetch error:`, err);
  }
}

/* ── 全部更新 ── */

async function refreshAll() {
  const btn = document.getElementById("btn-refresh");
  btn.classList.add("loading");
  btn.disabled = true;

  const cards = document.querySelectorAll(".bus-card");
  await Promise.all([...cards].map(fetchAndRenderEta));

  // 更新時間戳
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  const el = document.getElementById("update-time");
  if (el) el.textContent = `最後更新：${ts}`;

  btn.classList.remove("loading");
  btn.disabled = false;
}

/* ── 初始化 ── */

function init() {
  const grid = document.getElementById("cards-grid");

  // 依設定建立卡片
  BUS_CONFIG.forEach((cfg) => {
    const card = createCard(cfg);
    grid.appendChild(card);
  });

  // 首次載入
  refreshAll();

  // 每 60 秒自動更新
  setInterval(refreshAll, 60000);

  // 更新按鈕
  document.getElementById("btn-refresh").addEventListener("click", refreshAll);
}

document.addEventListener("DOMContentLoaded", init);
