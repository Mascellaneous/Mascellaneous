# ASTR // 79：Asteroids Modern Remake

這是一個以使用者提供的 `asteroids.swf` 為逆向分析對象的現代瀏覽器重製版。作品刻意保留經典 Asteroids 的核心語彙：**旋轉、慣性推進、跨邊界漂移、射擊、小行星分裂、飛碟、超空間跳躍、生命與波次**；但以單一 HTML 檔、Canvas 2D 與現代瀏覽器 API 實作。最終交付不需要安裝套件、不載入 CDN、不呼叫後端，開啟 `asteroids-modern.html` 即可遊玩。

> 本專案是依據 SWF 的靜態結構、符號名稱與嵌入音效進行機制重建，**不執行、不轉譯、也不內嵌原始 ActionScript**。因此它是行為與美術語意的現代重製，而不是逐行反編譯的原碼移植。

| 項目 | 內容 |
|---|---|
| 最終遊戲檔 | `asteroids-modern.html` |
| 執行環境 | 現代桌面瀏覽器；Chrome、Edge、Firefox、Safari 的近期版本皆適用 |
| 執行方式 | 直接以瀏覽器開啟 HTML，或以本機靜態伺服器提供 |
| 第三方相依 | **無**；沒有套件管理器、外部字型、框架或 CDN |
| 原始資產重用 | 已內嵌原始 SWF 的 `thrust`、`saucerSmall`、`saucerBig`、`beat1`、`beat2` MP3 |
| 儲存方式 | 最高分使用瀏覽器 `localStorage`；沒有任何網路傳輸 |

## 快速開始

將 `asteroids-modern.html` 下載至任意資料夾後，用瀏覽器開啟即可。為確保最高分保存行為在不同瀏覽器間一致，建議以靜態伺服器提供檔案，例如使用任何既有的本機開發伺服器；直接以 `file:` 協定開啟時，各瀏覽器對 `localStorage` 的保存範圍並沒有一致保證。[5]

遊戲首次進入時顯示待命畫面。按下 **ENTER** 或點擊「部署攔截艇」即可開始。音效會在第一次使用者手勢後才啟用，這是為了順應瀏覽器對有聲媒體自動播放的限制。[4]

| 操作 | 按鍵 | 行為 |
|---|---|---|
| 左轉／右轉 | `←` `→` 或 `A` `D` | 改變飛船朝向；飛船不會立即改變既有速度方向 |
| 推進 | `↑` 或 `W` | 沿船首方向加速，並播放原始 `thrust` 音效 |
| 射擊 | `SPACE` | 發射有生命週期與同時數量上限的子彈 |
| 超空間跳躍 | `H` | 轉移至隨機位置；有短暫冷卻與可控風險 |
| 暫停／恢復 | `P` 或 `ESC` | 凍結或恢復飛行模擬 |
| 開始／重新開始 | `ENTER` | 在待命或遊戲結束畫面部署新飛船 |
| 控制參考 | `?` | 顯示畫面內控制說明 |

## 原始 SWF 的靜態分析結果

分析工具先以 zlib 解壓縮 CWS 容器，再只讀地逐一掃描 SWF 標籤；沒有啟動 Flash Player，也沒有評估 ActionScript。原始檔為 SWF v6、舞台大小 500 × 375 px、時間基準 30 fps，並含 11 個 `DefineShape`、12 個 `DefineSprite`、10 個 `DefineSound`、13 個 `DoAction` 以及 5 個時間軸 `StartSound` 標籤。[1]

| 靜態線索 | 推定機制／資產 | 重製版處理 |
|---|---|---|
| `wrapPos`、`xMax`、`yMax` | 場域兩端相接的環繞座標 | 對每個移動物件採模數包覆位置 |
| `spaceship`、`thrust`、`fireKey`、`hyperspace` | 玩家飛船、推進、射擊、超空間跳躍 | 實作為語意化輸入與飛船狀態 |
| `asteroidMover`、`bangLarge`、`bangMedium`、`bangSmall` | 小行星漂移及大型至小型的分裂序列 | 大、中型各拆成兩個下一尺度的小行星 |
| `saucerBig`、`saucerSmall`、`saucerMover` | 大／小飛碟及其移動邏輯 | 波次中途隨機進場；小飛碟瞄準精度較高 |
| `lives`、`score`、`scoreMod`、`newSpaceship`、`safeArea_mc` | 生命、分數、重生與安全時間 | 三條生命、1 萬分額外生命、短暫無敵重生 |
| `paused`、`gameOver_mc` | 暫停與結束狀態 | 明確模式機：`title`、`playing`、`paused`、`gameover` |
| `LoadVars`、`sendAndLoad`、舊高分端點 | 舊版遠端高分榜 | 移除遠端呼叫；改用純本機最高分，避免帶入已失效服務與隱私風險 |

原始檔只有向量角色與時間軸精靈，沒有 `DefineBits`、JPEG 或 PNG 點陣標籤。因此，小行星、飛船與爆裂效果不以截圖點陣化處理，而是以 Canvas 線段與不規則多邊形重建。這種方式保留了原作在不同螢幕尺度下的清晰輪廓，也更符合它本來的向量街機語言。

## 原始資產保留策略

五段具有匯出連結名稱的短 MP3 已由 SWF 的 `DefineSound` 內容直接抽取並內嵌回最終 HTML；沒有重新錄製或以外部音檔替代。為維持單一檔案形式，它們會在建置時轉成 Base64 `data:audio/mpeg` URL。射擊、爆炸、超空間跳躍與額外生命則用 Web Audio API 合成非常短的輔助音，避免猜測未具明確連結名稱的原始時間軸音效用途。

| SWF 音效 ID | 原始連結名稱 | 規格 | 重製版事件 |
|---:|---|---|---|
| 1 | `thrust` | MP3、11,025 Hz、單聲道、約 0.52 秒 | 推進節流播放 |
| 2 | `saucerSmall` | MP3、11,025 Hz、單聲道、約 0.42 秒 | 已保存於單檔音效庫，供小飛碟語意擴充 |
| 3 | `saucerBig` | MP3、11,025 Hz、單聲道、約 0.42 秒 | 飛碟進場與射擊回饋 |
| 4 | `beat2` | MP3、11,025 Hz、單聲道、約 0.31 秒 | 波次節拍 B |
| 5 | `beat1` | MP3、11,025 Hz、單聲道、約 0.31 秒 | 波次節拍 A |

此外，遊戲使用兩張由本專案設計方向生成的圖像：近黑藍星空質地與無文字的飛船／軌道／小行星標誌。兩者皆先轉為壓縮 WebP 再內嵌，故不形成網路資產依賴。顯著可玩物件仍由程式繪製，而不是以圖片碰撞。

## 架構與技術細節

### Canvas 2D 作為向量舞台

Canvas API 可透過 JavaScript 與 `<canvas>` 繪製即時圖形，適合遊戲與動畫情境。[2] 本作在每次視窗調整時，以裝置像素比例重新設定 backing store，並以 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 讓 CSS 像素與繪製座標一致。這避免高 DPI 螢幕上出現不必要的模糊，同時將座標空間維持為容易理解的視窗寬高。

畫面渲染由 `Renderer` 職責概念內嵌在 `Game` 類別的 `render()` 及 `draw*()` 方法中。背景先填近黑藍，再以極低不透明度疊上星空質地；接著畫稀疏星點、小行星多邊形、粒子、子彈、飛碟、飛船與 HUD。飛船、小行星與生命圖示皆由 `moveTo()`、`lineTo()`、`ellipse()` 等 Canvas 路徑命令完成，因此沒有精靈圖集或貼圖座標管理成本。

### 與刷新率無關的遊戲迴圈

主迴圈使用 `requestAnimationFrame()`。該 API 會要求瀏覽器在下一次重繪前執行回呼，且回呼頻率通常對應顯示器更新率；標準文件特別提醒，若不使用時間戳計算進度，高刷新率螢幕會令動畫加速。[3] 因此，遊戲以 `dt = min((now - lastTime) / 1000, 0.05)` 取得秒為單位的時間差，並在單一幀被暫停或背景節流後限制最大更新間隔。

速度、角速度、推進加速度、射擊冷卻、無敵時間與粒子壽命都以秒為單位。位置更新的核心形式如下；其中 `dt` 已吸收刷新率差異。

```text
velocity += acceleration × dt
position += velocity × dt
velocity *= damping^(dt × 60)
```

### 環繞座標與邊界碰撞

世界不是具有牆壁的矩形，而是環面。對 `x` 與 `y` 分別使用 `wrap(n, max) = ((n % max) + max) % max`，讓物件越過右側後由左側回到畫面。碰撞不能只用表面座標距離，否則靠近左右或上下邊界的相鄰物件會被誤判為距離很遠。

本作的 `delta(a, b, max)` 會將差值折回 `[-max/2, max/2]` 範圍；`distance()` 再將兩個折回後的差值做平方和開根號。小行星、飛船、飛碟與子彈以半徑近似碰撞範圍，因此能在邊界兩側正確命中。這是比逐邊線段相交更穩健、也更適合快速街機遊戲的取捨。

### 小行星、子彈與粒子系統

每顆小行星持有 `size`、`radius`、速度、角速度與一組種子化角點比例。渲染時，依角點等分圓周，再乘上各自的隨機半徑比率，便可生成穩定但不規則的輪廓。大型小行星命中後增加 20 分並產生兩個中型小行星；中型增加 50 分並產生兩個小型；小型增加 100 分並完全移除。分裂子體沿與母體原速度相關的相反斜角離開，避免出現靜止重疊。

玩家與飛碟子彈都帶有 `life` 計時器。玩家子彈最多維持 1.15 秒、飛碟子彈維持 1.8 秒，並限制同時存在數量。爆炸粒子同樣是短生命週期物件；其速度隨時間略為衰減，而線段的不透明度按照 `life / maxLife` 下降。這使畫面具有向量街機所需的爆裂感，但不會累積大量長存物件。

### 狀態機與輸入映射

程式將可見流程收斂為 `title`、`playing`、`paused` 與 `gameover` 四個模式。`InputManager` 不讓遊戲邏輯直接散落檢查原始按鍵，而是提供 `held()` 處理連續動作、`take()` 處理一次性動作。這使射擊、超空間跳躍、暫停與重新開始的重複觸發行為可獨立管理。

| 模式 | 允許的主要行為 | 進入條件 | 離開條件 |
|---|---|---|---|
| `title` | 顯示待命畫面與吸引模式 | 初始載入 | ENTER 或點擊開始 |
| `playing` | 完整物理、碰撞、波次與音效 | 新遊戲或從暫停恢復 | P／ESC、生命耗盡 |
| `paused` | 保留畫面、停止模擬 | P／ESC 或視窗失焦 | P／ESC 或恢復按鈕 |
| `gameover` | 顯示分數、保存最高分 | 最後一條生命失去 | ENTER 或開始按鈕 |

### 音效與自動播放限制

包含聲音的 `HTMLAudioElement.play()` 與 Web Audio 啟動，若不在使用者輸入情境中觸發，可能被瀏覽器的 autoplay 政策拒絕。[4] 因此，`AudioBank.unlock()` 只在 ENTER、指標按下或其他使用者鍵盤事件後建立／恢復 AudioContext；原始 MP3 也只在該手勢之後建立播放副本。每種高頻音效有最小間隔，避免推進或連續命中造成過量重疊與失真。

### 最高分與隱私

最高分只以鍵名 `astr79-high-score` 寫入當前來源的 `localStorage`。`localStorage` 的資料可跨瀏覽器工作階段保留，但與來源綁定；本專案不收集玩家名稱、不傳輸分數、不追蹤行為。[5] 這也刻意取代了原 SWF 中可見的舊式遠端高分榜線索。

## 視覺與可近用性決策

視覺方向是「陰極射線星圖」：近黑藍 `#060B12` 支撐畫面空域，磷光綠 `#A5FFD6` 保留給可操作或應讀取的物件，琥珀色 `#FFC857` 僅表示推進與動能，珊瑚紅 `#FF5D73` 只表示危險與爆裂。這使狀態顏色具有功能，而不是以大量霓虹取代層級。

Canvas 本身不會把畫面內容以語意節點暴露給輔助技術，因此本檔案為畫布提供 `aria-label`、明確的開始按鈕、可讀的控制說明對話框與鍵盤焦點，並保留非畫布的狀態文字與操作入口。Canvas API 的可近用性限制與提供替代內容的必要性可參考 MDN 的說明。[2]

## 驗證紀錄

本次完成了下列檢查。自動示範模式 `?demo=1` 用於驗證在未手動輸入時，畫面仍能顯示移動中的飛船、小行星、HUD 與跨邊界物件；實際音效因遵循瀏覽器手勢規則，需由玩家手動開始遊戲後聆聽。

| 檢查項目 | 結果 | 說明 |
|---|---|---|
| 單檔結構 | 通過 | 僅一個 HTML；CSS 與 JavaScript 均為內嵌 |
| 外部程式／資產 URL | 通過 | 沒有 CDN、HTTP URL 或 `/manus-storage/` 路徑；圖像與原始 MP3 均為 Data URL |
| 自動示範畫面 | 通過 | Canvas 可繪製飛船、小行星、星空、HUD 與 CRT 框架 |
| 瀏覽器主控台 | 通過 | 截圖驗證後未發現錯誤、例外或語法錯誤紀錄 |
| 響應式配置 | 通過 | 桌面 1280 × 720 與窄版樣式都由 CSS `aspect-ratio`／`svh` 處理 |
| 原始聲音封裝 | 通過 | 五段具名 MP3 已以 Base64 放入 `ORIGINAL_AUDIO` 常數 |

## 專案檔案說明

| 路徑 | 用途 |
|---|---|
| `asteroids-modern.html` | 使用者要的最終單檔交付；可直接遊玩 |
| `README.md` | 本繁體中文說明文件 |
| `analysis/analysis.json` | 靜態 SWF 分析產物，含舞台、標籤、連結名稱與音效資料 |
| `tools/analyze_swf.py` | 不執行 ActionScript 的 CWS/SWF 標籤分析與 `DefineSound` 擷取器 |
| `tools/inline_game_assets.py` | 將生成的視覺素材壓縮、嵌入 Data URL 的可重現工具 |
| `tools/inject_original_audio.py` | 將已抽取、具連結名稱的原始 MP3 注入 HTML 的可重現工具 |
| `PLAN.md`、`STRUCTURE.md`、`ASSETS.md`、`MEMORY.md` | 開發決策、架構、資產來源與逆向發現紀錄 |

## 授權與使用提醒

原始 SWF 由使用者提供，原始音效與識別性玩法的權利狀態需由使用者自行確認。本專案不宣稱擁有原作的著作權或商標，也不包含原始 SWF 檔於版本庫中。若要公開發布、商業化或向第三方散布，建議先取得相關權利人的授權，或將原始音效替換為已取得授權的素材。

## References

[1] [本專案靜態 SWF 分析報告](analysis/analysis.json)

[2] [MDN Web Docs：Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

[3] [MDN Web Docs：Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

[4] [MDN Web Docs：Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

[5] [MDN Web Docs：Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
