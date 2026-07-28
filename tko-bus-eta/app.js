/**
 * app.js — 將軍澳巴士到站時間
 *
 * 雙 Tab 設計：「出街」與「返家」
 * - 開啟時自動偵測 GPS，決定預設 Tab
 * - 用家可手動點擊 Tab 切換
 * - 路線設定請修改 config.js
 */

const KMB_ETA_BASE = "https://data.etabus.gov.hk/v1/transport/kmb/eta";

/* ════════════════════════════════════════════════════════
   工具函式
   ════════════════════════════════════════════════════════ */

function minutesFromNow(isoTime) {
  return Math.round((new Date(isoTime) - Date.now()) / 60000);
}

function formatTime(isoTime) {
  const d = new Date(isoTime);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/** Haversine 距離（米） */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ════════════════════════════════════════════════════════
   GPS 位置偵測
   ════════════════════════════════════════════════════════ */

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * 偵測目前位置，返回建議 Tab
 * @returns {Promise<{tab: "out"|"home", gpsState: "ok"|"far"|"error"}>}
 */
async function detectTab() {
  try {
    const pos = await getCurrentPosition();
    const dist = haversineMeters(pos.lat, pos.lng, HOME_LOCATION.lat, HOME_LOCATION.lng);
    if (dist <= HOME_RADIUS_M) {
      return { tab: "out", gpsState: "ok" };
    } else {
      return { tab: "home", gpsState: "far" };
    }
  } catch {
    return { tab: "out", gpsState: "error" };   // 無法取得位置時預設出街
  }
}

/* ════════════════════════════════════════════════════════
   GPS 狀態圓點
   ════════════════════════════════════════════════════════ */

const GPS_TITLES = {
  loading: "正在取得位置…",
  ok:      "在家附近（自動切換至出街）",
  far:     "在外面（自動切換至返家）",
  error:   "無法取得位置，顯示預設 Tab",
};

function setGpsStatus(state) {
  const dot = document.getElementById("gps-status");
  if (!dot) return;
  dot.className = `tab-gps-status gps-${state}`;
  dot.title = GPS_TITLES[state] || "";
}

/* ════════════════════════════════════════════════════════
   Tab 切換
   ════════════════════════════════════════════════════════ */

let activeTab = "out";

function switchTab(tab) {
  activeTab = tab;

  // 更新按鈕狀態
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  // 顯示對應面板
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tab}`);
  });
}

/* ════════════════════════════════════════════════════════
   卡片 DOM 建立
   ════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════
   ETA 獲取與渲染
   ════════════════════════════════════════════════════════ */

async function fetchAndRenderEta(card) {
  const { stopId, route, serviceType } = card.dataset;
  const etaArea = card.querySelector(".card-eta-area");

  etaArea.innerHTML = `
    <div class="card-loading"><div class="spinner"></div>正在查看</div>
  `;

  try {
    const resp = await fetch(`${KMB_ETA_BASE}/${stopId}/${route}/${serviceType}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // Accept any direction — OUT_ROUTES stops return dir="O", HOME_ROUTES
    // (inbound/return-journey) stops return dir="I". The API already scopes
    // results to the correct direction for the given stop+route combination,
    // so filtering by dir would incorrectly discard HOME_ROUTES data.
    const etas = (json.data || [])
      .filter((e) => e.eta)
      .sort((a, b) => new Date(a.eta) - new Date(b.eta));

    if (etas.length === 0) {
      etaArea.innerHTML = `<div class="card-no-service">暫無班次資料</div>`;
      return;
    }

    const mins = minutesFromNow(etas[0].eta);
    const primaryHtml = mins <= 0
      ? `<div class="card-eta-primary">
           <span class="card-eta-prefix">仲有</span>
           <span class="card-eta-arriving">到站</span>
         </div>`
      : `<div class="card-eta-primary">
           <span class="card-eta-prefix">仲有</span>
           <span class="card-eta-minutes">${mins}</span>
           <span class="card-eta-unit">分</span>
         </div>`;

    let nextHtml = "";
    if (etas.length >= 2) {
      const mins2 = minutesFromNow(etas[1].eta);
      if (mins2 > 0) {
        nextHtml = `<div class="card-eta-next">之後 ${mins2} 分 &nbsp;(${formatTime(etas[1].eta)})</div>`;
      }
    }

    etaArea.innerHTML = primaryHtml + nextHtml;
  } catch (err) {
    etaArea.innerHTML = `<div class="card-error">無法取得資料</div>`;
    console.error(`[${route}] ETA fetch error:`, err);
  }
}

/* ════════════════════════════════════════════════════════
   更新目前 Tab 的所有卡片
   ════════════════════════════════════════════════════════ */

async function refreshCurrentTab() {
  const btn = document.getElementById("btn-refresh");
  btn.classList.add("loading");
  btn.disabled = true;

  const grid = document.getElementById(`grid-${activeTab}`);
  const cards = grid ? [...grid.querySelectorAll(".bus-card")] : [];
  await Promise.all(cards.map(fetchAndRenderEta));

  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  const el = document.getElementById("update-time");
  if (el) el.textContent = `最後更新：${ts}`;

  btn.classList.remove("loading");
  btn.disabled = false;
}

/* ════════════════════════════════════════════════════════
   初始化
   ════════════════════════════════════════════════════════ */

function buildGrid(routes, gridId, emptyId) {
  const grid = document.getElementById(gridId);
  const emptyMsg = document.getElementById(emptyId);
  if (!grid) return;

  if (!routes || routes.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  routes.forEach((cfg) => grid.appendChild(createCard(cfg)));
}

async function init() {
  // 建立兩個 Tab 的卡片
  buildGrid(OUT_ROUTES,  "grid-out",  "empty-out");
  buildGrid(HOME_ROUTES, "grid-home", "empty-home");

  // Tab 按鈕點擊事件
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
      refreshCurrentTab();
    });
  });

  // 更新按鈕
  document.getElementById("btn-refresh").addEventListener("click", refreshCurrentTab);

  // GPS 偵測 → 決定預設 Tab（受 GPS_ENABLED 控制）
  const gpsDot = document.getElementById("gps-status");
  if (GPS_ENABLED) {
    setGpsStatus("loading");
    const { tab, gpsState } = await detectTab();
    setGpsStatus(gpsState);
    switchTab(tab);
  } else {
    // GPS 停用：隱藏狀態圓點，預設顯示「出街」Tab
    if (gpsDot) gpsDot.hidden = true;
    switchTab("out");
  }

  // 首次載入 ETA
  await refreshCurrentTab();

  // 每 60 秒自動更新
  setInterval(refreshCurrentTab, 60000);
}

document.addEventListener("DOMContentLoaded", init);
