# 將軍澳巴士到站時間

實時顯示將軍澳富寧花園及將軍澳醫院出發的九巴班次，資料來自[九巴 ETA Open API](https://data.etabus.gov.hk/)。

## 功能

- **雙 Tab 設計**：「出街」（由屋企出發）與「返家」（返回屋企）
- **GPS 自動切換**：開啟時自動偵測位置，在家附近預設顯示「出街」，在外則顯示「返家」
- **手動切換**：可隨時點擊 Tab 手動切換
- 顯示下一班及第二班到站時間（分鐘數 + 實際時間）
- 每 60 秒自動更新，亦可手動按「更新」
- 純靜態 HTML/CSS/JS，無需後端

## 目前路線

### 出街（OUT_ROUTES）

| 路線 | 起始站 | 目的地 |
|------|--------|--------|
| 91M  | 富寧花園 | 往鑽石山 |
| 98A  | 坑口站 | 往將軍澳醫院 |
| 98C  | 將軍澳醫院 | 往美孚 |
| 98D  | 將軍澳醫院 | 往尖沙咀東 |
| 290  | 將軍澳醫院 | 往荃灣西站 |

### 返家（HOME_ROUTES）

尚未設定，請在 `config.js` 的 `HOME_ROUTES` 加入路線。

## 如何新增或修改路線

只需編輯 **`config.js`**：

- **出街路線**：在 `OUT_ROUTES` 陣列加入或修改
- **返家路線**：在 `HOME_ROUTES` 陣列加入或修改
- **家的座標**：修改 `HOME_LOCATION`（緯度、經度）
- **判定半徑**：修改 `HOME_RADIUS_M`（米，預設 400）

每條路線的欄位：

```js
{
  route: "路線號碼",        // 例如 "98E"
  serviceType: "1",         // 通常為 "1"
  stopId: "車站代碼",       // 從九巴 API 查詢（見下方）
  stopName: "起始站顯示名",
  dest: "目的地顯示名",
  color: "#顏色代碼",
}
```

### 查詢車站代碼

1. 搜尋所有車站：
   ```
   https://data.etabus.gov.hk/v1/transport/kmb/stop/
   ```
2. 搜尋路線資料：
   ```
   https://data.etabus.gov.hk/v1/transport/kmb/route/
   ```
3. 搜尋特定路線的所有停靠站：
   ```
   https://data.etabus.gov.hk/v1/transport/kmb/route-stop/{route}/{bound}/{service_type}
   ```
   - `bound`：`O` = 去程，`I` = 回程
4. 查詢特定車站的 ETA（驗證用）：
   ```
   https://data.etabus.gov.hk/v1/transport/kmb/eta/{stop_id}/{route}/{service_type}
   ```

## 檔案結構

```
tko-bus-eta/
├── index.html   # 主頁面（HTML 結構）
├── style.css    # 樣式
├── app.js       # 主邏輯（API 呼叫、GPS 偵測、Tab 切換）
├── config.js    # 路線設定及家的座標（新增/修改路線於此）
└── README.md    # 本說明文件
```
