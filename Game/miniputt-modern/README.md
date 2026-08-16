# Mini Putt Modern

> **以原始 Flash 行為為參考、以現代瀏覽器技術重新實作的無相依迷你高爾夫遊戲。**

這個專案是針對使用者提供的 `miniputt_new.swf` 所做的**乾淨室重建（clean-room reconstruction）**。原始 SWF 並未被嵌入、轉譯後執行或以 Flash 外掛載入；相反地，專案先分析其時間軸、ActionScript 2、向量圖形及聲音資源，接著以原生 HTML、CSS 與 JavaScript 重新實作可驗證的遊戲規則與操作感。

| 項目 | 本專案的實作 |
| --- | --- |
| 入口頁 | `index.html` |
| 執行期相依 | **無**；不使用 npm 套件、CDN 函式庫、框架或 WebAssembly |
| 畫面與物理 | 原生 `<canvas>` 與 `requestAnimationFrame()` |
| 關卡 | 18 洞單人經典球道 |
| 操作 | 滑鼠／觸控拖曳拉桿、鍵盤 `R` 重置球位、`M` 開關聲音 |
| 原始媒體 | 1 張草皮材質、3 段經驗證的 SWF 音效 |

## 快速開始

此 GitHub 子目錄本身就是可靜態部署的遊戲包；一般靜態伺服器均可直接提供此目錄。以 `index.html` 為入口，不需要建置步驟或套件安裝。

```text
miniputt-modern/
├── index.html              # DOM 結構、對話框、可及性標籤與遊戲入口
├── styles.css              # Cabinet Greenhouse 視覺系統與響應式版面
├── game.js                 # 關卡資料、Canvas 繪圖、輸入、物理、音效與計分
└── assets/                 # 原始 SWF 媒體與本次重建所需的介面圖像
```

> 從 GitHub 取得後，保留 `assets/` 與三個程式檔案的相對位置，使用任意靜態 HTTP 伺服器開啟 `index.html` 即可。基於瀏覽器的音效自動播放政策，第一次擊發或開始遊戲的使用者操作會解鎖音效播放。

## 操作方式

| 動作 | 桌面裝置 | 觸控裝置 | 結果 |
| --- | --- | --- | --- |
| 瞄準 | 從球的位置按下，向擊球反方向拖曳 | 觸碰球，向反方向拖曳 | 顯示虛線預覽與力量計 |
| 擊球 | 放開滑鼠 | 放開手指 | 依拉桿距離與方向設定速度 |
| 重置球位 | 按 `R` 或「Re-spot ball」 | 點選「Re-spot ball」 | 回到開球點，並記 1 桿 |
| 聲音 | 按 `M` 或「Sound」 | 點選「Sound」 | 切換原始 SWF 音效 |
| 前進 | 球進洞／十桿結束後按「Next hole」 | 同左 | 進入下一洞 |

每洞最多 **10 桿**。球以低速進入洞杯時會被吸入；若高速掠過洞口，則僅受輕微速度損失。這刻意保留了原作「速度太高不會進洞」的技巧門檻。

## SWF 逆向工程摘要

原始檔是 **Flash 6 壓縮 SWF（CWS）**，舞台大小為 **550 × 400 px**。使用 JPEXS Free Flash Decompiler 匯出 ActionScript 2、時間軸畫面、SVG 向量圖、位圖及音訊，再以原始 ActionScript 作為行為規格。完整的可追溯筆記另見 [`reverse_engineering.md`](./reverse_engineering.md)。

| 已驗證的原作資訊 | 證據與重建對應 |
| --- | --- |
| 課程名稱 | `Classic Mini Putt`；現代版保留為「Classic Course」18 洞流程。 |
| 洞數與記分 | 原始計分字串逐洞列出 `hole 1` 至 `hole 18`；現代版有固定 18 格計分卡。 |
| 力度上限 | 原始 AS2 將瞄準向量除以 4，並將向量長度限制為 60；現代版依同一「拉得越遠越快、存在上限」模型實作。 |
| 摩擦 | 原始每更新週期執行 `xspd *= 0.94` 與 `yspd *= 0.94`；現代版把它轉成時間步長無關的指數衰減。 |
| 停球 | 原始速度低於 1.5 且持續 25 個更新後停止；現代版採用同等的低速穩定判斷。 |
| 進洞 | 原始僅在速度低於 10 且碰到 `hole` tile 時吸入；現代版保留「低速洞杯捕捉」。 |
| 桿數上限 | 原始在第 10 桿後結束球的回合；現代版每洞封頂 10 桿。 |
| 物件類型 | 原始控制器含 `box`、`column`、`convex`、`concave`、`angle`、`tube`、`warp`、`hole` 等案例；現代版以長條木牆、圓柱碰撞、坡面與雙向管道組合成 18 洞。 |

### 原始畫面與範圍

原作的開場帶有城堡、恐龍與飛碟的卡通場景，並有 1–4 人及球碰撞的選單。這個版本有意聚焦於**單人、立即可玩的核心球桿循環**，沒有實作多人回合、玩家名字持久化或線上成績上傳。這些功能牽涉多人同步與後端資料處理，並不是無相依靜態 HTML 交付的必要部分。

## 技術架構

### 1. 顯示層：Canvas 優先、DOM 輔助

球道由固定邏輯座標系 `960 × 600` 的 Canvas 描繪。CSS 僅負責使畫布以正確長寬比縮放，因此輸入事件會將螢幕座標反算回世界座標，而不會因螢幕大小改變而改變物理參數。DOM 承擔其較擅長的工作：分數卡、按鈕、鍵盤焦點、表單與 ARIA live 區域。

```text
pointer client position
        │
        ▼
CSS canvas box ──比例換算──► 960 × 600 world coordinates
        │
        ▼
aim vector → capped velocity → sub-stepped collision simulation → canvas renderer
```

此分層可避免將 UI 排版與碰撞幾何混在同一套座標中，也讓 Canvas 在手機與桌面保持一致的操控感。

### 2. 擊球、摩擦與停球

瞄準向量使用「球座標減去指標座標」，所以使用者必須向擊球的**反方向**拉動。其長度先被限制，再映射為初速度；放開時才增加桿數。這比單純點擊目標更貼近原作的拉桿手感。

```js
// 簡化後的核心概念；實作位於 game.js
const dx = ball.x - pointer.x;
const dy = ball.y - pointer.y;
const ratio = Math.min(Math.hypot(dx, dy) / maxPull, 1);
ball.vx = (dx / length) * ratio * maxVelocity;
ball.vy = (dy / length) * ratio * maxVelocity;
```

原始程式把每個向量分量乘上 `0.94`。現代版不假設固定螢幕更新率，而是套用：

```text
surfaceFriction = 0.94 ^ (deltaSeconds × 12)
velocity *= surfaceFriction
```

因此在畫面暫時掉幀時，球不會因為少算摩擦而不合理地滑得更遠。當速度低於門檻一段時間，系統會把速度歸零並重新開放瞄準。

### 3. 碰撞：子步進與法線反射

高速球若每影格只檢查一次，可能穿過薄牆。`game.js` 會依本影格的移動距離把時間切成最多 12 個子步進；每一步都會檢查：

1. 場地外框。
2. 軸對齊的木質擋板（圓對矩形最近點測試）。
3. 圓柱／緩衝器（圓對圓）。
4. 坡面加速度區。
5. 低速管道傳送。
6. 洞杯的低速捕捉。

碰撞後，速度向量會對碰撞法線鏡射，並保留一部分能量，以避免「絕對彈性」造成永不停止的運動。這是刻意取捨：目標是重現原作的彈跳感與停球節奏，而非建立具精確質量、角動量的高爾夫模擬器。

### 4. 關卡資料模型

每一洞都是一個純資料物件，包含起點、洞杯、標準桿數，以及碰撞物件陣列。資料與渲染／物理函式分離，新增洞位不必重寫碰撞迴圈。

```js
{
  name: "Twin Tunnels",
  par: 3,
  start: [130, 300],
  cup: [830, 300],
  walls: [rect(300, 102, 36, 240)],
  bumpers: [bumper(480, 300, 35)],
  slopes: [],
  tubes: [tube([220, 478], [738, 120])]
}
```

### 5. 可及性與輸入

Canvas 本身不能自然提供完整語意，因此遊戲畫布有可聚焦的 `tabindex` 與清楚的 ARIA 標籤；狀態訊息使用 `role="status"` 與 `aria-live="polite"`。重要功能另有可點按的 DOM 按鈕，並提供 `R`／`M` 快捷鍵。所有按鈕保留可見的 focus ring，動態 UI 動畫也尊重 `prefers-reduced-motion`。

## 原始資產與歸屬

原始 SWF 是使用者提供的輸入。其可辨識畫面中顯示 **© 2005 Psycho Goldfish Creative Media**；本專案不主張取得或轉移該等原作素材的著作權。保留素材只用於使用者要求的相容性／保存導向重建，且在 README 與程式中明確標示來源。

| 資產 | 來源 | 驗證方式 | 用途 |
| --- | --- | --- | --- |
| 草皮材質 | `images/49.png`，84 × 42 px | JPEXS 位圖匯出 | Canvas 與 UI 的球場紙感紋理。 |
| `putt` | `DefineSound` character 250 | SWF `FrameLabel("putt")` → `StartSound(250)` | 擊球時播放。 |
| `sink` | `DefineSound` character 251 | SWF `FrameLabel("sink")` → `StartSound(251)` | 進洞時播放。 |
| `tube` | `DefineSound` character 252 | SWF `FrameLabel("tube")` → `StartSound(252)` | 管道傳送時播放。 |
| 現代介面插圖與標誌 | 本次重建專案產生 | 非從 SWF 擷取 | 僅用於新的 Cabinet Greenhouse 外框，不冒充原作畫面。 |

若要公開散布、商業使用或向外部受眾重新發布含原始媒體的版本，請先向原權利人確認授權範圍。若無法確認，可移除 `assets/original-*` 的四個檔案；遊戲仍可執行，只會失去草皮材質與音效。

## 驗證紀錄

| 檢查 | 結果 |
| --- | --- |
| SWF 結構與 ActionScript 匯出 | 成功匯出 652 個 AS2 檔、75 個 SVG、5 個時間軸畫面、3 段 MP3 與 1 段 WAV。 |
| JavaScript 語法 | `node --check game.js` 通過。 |
| 專案開發環境檢查 | 原始開發專案的 `pnpm check` 與 `pnpm build` 均通過。 |
| 靜態路徑 | HTML、CSS、JS 與三段原始 MP3 的相對路徑已檢查，沒有遺留受管儲存服務 URL。 |
| 視覺檢查 | 已以桌面 1280 × 900 預覽檢查：根路徑正確進入遊戲起始對話框與 Cabinet Greenhouse 球場介面。 |

## 已知取捨與後續方向

現代版保留的是經反編譯確認的**規則與互動模型**，而不是逐畫素重建原作所有 18 張 Flash 場景。這能在不執行舊式外掛、沒有第三方相依的條件下，提供更一致的高 DPI、觸控與無障礙體驗。

未來若需要更高的史料保真度，可將原 SWF 中每一洞的 Display List 座標轉寫成對應關卡資料，並補上原作的多人球碰撞與玩家輪替。此工作應維持「原始資料分析 → 獨立瀏覽器實作」的流程，而不是把 SWF 作為執行期依賴。
