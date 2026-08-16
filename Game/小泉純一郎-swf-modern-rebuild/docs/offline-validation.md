# 離線開啟驗證

## 問題重現

初版以 `<script type="module" src="js/game.js">` 載入 ES module。當以 `file://` 直接開啟 `index.html` 時，Chromium 會將本機文件置於 opaque origin，模組圖譜的 CORS 載入無法可靠完成。畫面會停留在「正在載入原始美術素材…」，遊戲初始化也不會開始。

## 修正內容

保留獨立的 HTML、CSS、JavaScript 與 PNG 檔案，但改為以一般 `<script>` 依序載入 `physics.js`、`renderer.js` 與 `game.js`。前兩者各自公開最小的唯讀全域 API：`window.KRPhysics` 與 `window.KRRenderer`；`game.js` 只讀取這兩個 API，沒有使用 `import` 或動態載入。

| 載入順序 | 檔案 | 公開內容 |
|---:|---|---|
| 1 | `js/physics.js` | `Particle`、`PhysicsWorld`、約束、碰撞與數學工具。 |
| 2 | `js/renderer.js` | `Renderer` 與原始 PNG 的 Promise 載入器。 |
| 3 | `js/game.js` | 場景、輸入、控制列與 `requestAnimationFrame` 迴圈。 |

## 成功驗證

修正後，以 `file:///…/kr-swf-modern-rebuild/index.html` 直接開啟。Chromium 顯示「執行中」狀態、原始頭部與服裝肢體、圓形障礙物及 Canvas 畫面，載入提示已消失。主控台無錯誤輸出。這表示 9 個還原 PNG、三個 JavaScript 檔案和 CSS 均可從本機相對路徑離線載入。

HTTP 靜態伺服器仍然可以使用，但已不再是遊玩的前提條件。
