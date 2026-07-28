# 將軍澳巴士到站時間

實時顯示將軍澳富寧花園及將軍澳醫院出發的九巴班次，資料來自[九巴 ETA Open API](https://data.etabus.gov.hk/)。

## 功能

- 顯示下一班及第二班到站時間（分鐘數）
- 每 60 秒自動更新，亦可手動按「更新」
- 純靜態 HTML/CSS/JS，無需後端，可直接用瀏覽器開啟

## 目前路線

| 路線 | 起始站 | 目的地 |
|------|--------|--------|
| 91M  | 富寧花園 | 鑽石山站 |
| 98A  | 坑口站 | 將軍澳醫院 |
| 98C  | 將軍澳醫院 | 美孚 |
| 98D  | 將軍澳醫院 | 尖沙咀東 |
| 290  | 將軍澳醫院 | 荃灣西站 |

## 如何新增或修改路線

只需編輯 **`config.js`**，在 `BUS_CONFIG` 陣列中加入或修改項目：

```js
{
  route: "路線號碼",        // 例如 "98E"
  serviceType: "1",         // 通常為 "1"，特殊班次可能為 "2"、"3" 等
  stopId: "車站代碼",       // 從九巴 API 查詢（見下方）
  stopName: "起始站顯示名", // 顯示在卡片上的起點名稱
  dest: "目的地顯示名",     // 顯示在卡片上的終點名稱
  color: "#顏色代碼",       // 卡片主題色（CSS 顏色值）
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
├── app.js       # 主邏輯（API 呼叫、DOM 渲染）
├── config.js    # 路線設定（新增/修改路線於此）
└── README.md    # 本說明文件
```
