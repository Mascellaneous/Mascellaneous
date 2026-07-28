/**
 * config.js — 巴士路線設定
 *
 * ── 位置設定 ──────────────────────────────────────────────────────────────
 * HOME_LOCATION  家的 GPS 座標（緯度、經度）
 * HOME_RADIUS_M  判定「在家附近」的半徑（米）
 *                在此範圍內 → 預設顯示「出街」Tab
 *                超出範圍   → 預設顯示「返家」Tab
 *
 * ── 路線欄位說明 ──────────────────────────────────────────────────────────
 *   route       - 路線號碼（字串）
 *   serviceType - 服務類型，通常為 "1"
 *   stopId      - 車站唯一代碼（可從九巴 API 查詢）
 *   stopName    - 顯示用的起始站名稱
 *   dest        - 顯示用的目的地名稱
 *   color       - 卡片主題色（CSS 顏色值）
 *
 * 九巴 ETA API：
 *   https://data.etabus.gov.hk/v1/transport/kmb/eta/{stop_id}/{route}/{service_type}
 */

// ── 位置設定 ──────────────────────────────────────────────────────────────

const HOME_LOCATION = {
  lat: 22.3186,
  lng: 114.2678,
};

const HOME_RADIUS_M = 400;

// ── 出街路線（由屋企出發）────────────────────────────────────────────────

const OUT_ROUTES = [
  {
    route: "91M",
    serviceType: "1",
    stopId: "87CD68EAD90352E9",
    stopName: "富寧花園",
    dest: "往鑽石山",
    color: "#1a6b5a",
  },
  {
    route: "98A",
    serviceType: "1",
    stopId: "7E5A9F7D64C12E4C",
    stopName: "坑口站",
    dest: "往將軍澳醫院",
    color: "#c0392b",
  },
  {
    route: "98C",
    serviceType: "1",
    stopId: "8E246EE4AB82C670",
    stopName: "將軍澳醫院",
    dest: "往美孚",
    color: "#d35400",
  },
  {
    route: "98D",
    serviceType: "1",
    stopId: "75E1777F474658CA",
    stopName: "將軍澳醫院",
    dest: "往尖沙咀東",
    color: "#8e44ad",
  },
  {
    route: "290",
    serviceType: "1",
    stopId: "D9AAA33F19B8E45A",
    stopName: "將軍澳醫院",
    dest: "往荃灣西站",
    color: "#1a3a6b",
  },
];

// ── 返家路線（返回屋企）──────────────────────────────────────────────────
// 在此加入回程路線，例如：

const HOME_ROUTES = [
   {
   route: "91M",
   serviceType: "1",
   stopId: "2EFDB1EADF5955E6",
   stopName: "牛池灣轉車站-牛池灣村",
   dest: "往寶林",
   color: "#1a6b5a",
 },
  {
  route: "297",
  serviceType: "1",
  stopId: "20A7DAD5A8294964",
  stopName: "九龍城轉車站-富豪東方酒店",
  dest: "往寶林",
  color: "#d4ac0d",
 }, 
];
