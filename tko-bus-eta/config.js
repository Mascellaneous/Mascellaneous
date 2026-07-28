/**
 * 巴士路線設定
 *
 * 如需新增或修改路線，只需編輯此檔案。
 *
 * 每條路線的欄位說明：
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

const BUS_CONFIG = [
  {
    route: "91M",
    serviceType: "1",
    stopId: "87CD68EAD90352E9",
    stopName: "富寧花園",
    dest: "往鑽石山",
    color: "#1a6b5a",   // 深綠
  },
  {
    route: "98A",
    serviceType: "1",
    stopId: "7E5A9F7D64C12E4C",
    stopName: "坑口站",
    dest: "往將軍澳醫院",
    color: "#c0392b",   // 紅
  },
  {
    route: "98C",
    serviceType: "1",
    stopId: "8E246EE4AB82C670",
    stopName: "將軍澳醫院",
    dest: "往美孚",
    color: "#d35400",   // 橙
  },
  {
    route: "98D",
    serviceType: "1",
    stopId: "75E1777F474658CA",
    stopName: "將軍澳醫院",
    dest: "往尖沙咀東",
    color: "#8e44ad",   // 紫
  },
  {
    route: "290",
    serviceType: "1",
    stopId: "D9AAA33F19B8E45A",
    stopName: "將軍澳醫院",
    dest: "往荃灣西站",
    color: "#1a3a6b",   // 深藍
  },
];
