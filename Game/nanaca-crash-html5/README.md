# Nanaca Crash — 原生 HTML5 重製版

> **非官方致敬重製。**本專案將使用者提供的 `nanacacrash.swf` 逆向分析後，以一份不依賴框架、套件或建置工具的 HTML 檔重寫為可在現代瀏覽器中運作的 2D 拋射遊戲。原始角色、場景及音訊僅作為重製驗證與相容性素材；相關著作權、角色權利與商標均仍屬原權利人。

## 快速開始

GitHub 交付的 [`index.html`](./index.html) 與 [`assets/`](./assets/) 目錄構成可讀、可維護的完整版本；所有圖像與音效均在該儲存庫中。若需要一個沒有旁掛資產目錄的檔案，請使用 [`nanaca-crash-standalone.html`](./nanaca-crash-standalone.html)：它將 CSS、JavaScript、圖片與一段原始音訊均以 data URI 內嵌，因此可下載後直接以現代瀏覽器開啟；兩種版本都不需要網路、伺服器、Node.js、npm 或任何第三方函式庫。

| 項目 | 說明 |
| --- | --- |
| 啟動 | 保持 `index.html` 與 `assets/` 的相對位置後，以 Chromium、Firefox、Safari 或 Edge 直接開啟 `index.html`；或直接開啟 `nanaca-crash-standalone.html`。瀏覽器若限制 `file://` 下的音訊自動播放，請先按頁面右上角的音符按鈕。 |
| 初始流程 | 按「開始飛行」或在舞台上點一下，進入力量量表；第二次點擊或按 `Space` 發射。 |
| 遊戲目標 | 利用初始發射、地面反彈、路上角色遭遇與空中特技，累積最遠水平距離。 |
| 儲存 | 歷史最佳距離保存在瀏覽器的 `localStorage`；不會傳送任何資料至網路。 |

## 操作

| 輸入 | 遊戲狀態 | 行為 |
| --- | --- | --- |
| `Space` 或舞台點擊 | 準備／瞄準 | 依序開始瞄準、鎖定力量並發射。 |
| `S` | 飛行中 | 消耗 1 格特技，立即加入向前、向上的空中推進。每次撞擊角色會回補 1 格，最多 3 格。 |
| `P` | 瞄準／飛行中 | 暫停或繼續。 |
| `R` | 任意狀態 | 開始下一次瞄準。 |
| 音符按鈕 | 任意狀態 | 開啟或關閉背景音樂與短促音效。 |

## 重製範圍與可驗證性

此作品不是逐像素模擬器，而是以原 SWF 的核心物理與遊戲節奏重寫的**功能性現代化版本**。我以 JPEXS Free Flash Decompiler 的命令列匯出功能檢視 ActionScript 2、精靈、畫格與聲音；該工具明確支援匯出腳本、影像、精靈與音訊等 SWF 資源。[1] [2]

| 原 SWF 的實測結果 | HTML5 重製對應 |
| --- | --- |
| 壓縮 Flash 7；主舞台為 446×400 px；主邏輯使用 ActionScript 2。 | 以 960×540 的 16:9 Canvas 顯示，CSS 讓舞台在窄螢幕等比縮放。 |
| `GameControll` 持有 `px`、`py`、`vx`、`vy`，設定重力 `g = -9.8`、反彈衰減 `ex = ey = 0.8` 與約 1/30 秒基準步長。 | 以同名概念的四個數值欄位與時間差 `dt` 重現拋物線、落地反彈和停止條件。 |
| 發射速度為 `0.3 × power × cos(angle)` 及 `0.3 × power × sin(angle)`。 | 瞄準後以相同公式建立初始水平與垂直速度。 |
| 角色依距離插入候選陣列、以窄矩形命中窗判定，通過後回收重排。 | 依世界距離生成隨機化間隔的角色；接近地面時碰撞，將角色加速量和角度加入速度向量。 |
| 原作具不同 `cff` 狀態與空中相撞推進。 | 以可見的「空中特技」計量作為可理解且可操作的對應，保留其向前／向上推進與角色連鎖的核心節奏。 |

## 執行架構

最終 HTML 的結構刻意保持單純：語意化頁面元素負責標題、按鈕、操作說明和輔助狀態文字；`<canvas>` 專注繪製快速變動的遊戲舞台。Canvas API 正是為 JavaScript 圖形、動畫和遊戲畫面而設計，因此不需要額外遊戲引擎。[3]

```text
DOM 按鈕／鍵盤／點擊
        │
        ▼
  狀態機（ready → aim → flight → over）
        │                 │
        │                 ├─物理更新：位置、重力、反彈
        │                 ├─角色遭遇：命中、向量加速、補充特技
        │                 └─分數更新：本局最遠距離、localStorage 最佳紀錄
        ▼
 requestAnimationFrame 時間差迴圈
        │
        ▼
 Canvas：天空／原始地景／角色精靈／HUD／碰撞粒子
```

瀏覽器每次重繪前由 `requestAnimationFrame()` 呼叫遊戲迴圈；此 API 傳入時間戳，並建議以時間差而不是固定影格數推進動畫，避免在高更新率螢幕上速度變快。[4]本重製將 `dt` 限制在合理上限，並在高速時使用更小的物理步長，減少飛行者略過角色判定的機率。

### 物理模型

遊戲的世界座標採「向右為正、向上為正」。每個物理步長都使用：

```text
px += vx × dt
py += (vy + g × dt / 2) × dt
vy += g × dt
```

當 `py ≤ 0` 時，主角回到地面，並執行 `vy = |vy| × 0.8` 與 `vx = vx × 0.8`。當兩者都降低至停止門檻，該局結算。這保留原作「反彈逐次變短、最後滑停」的手感，而非以單一預先算好的拋物線播放動畫。

### 狀態機與輸入保護

| 狀態 | 可接受操作 | 離開條件 |
| --- | --- | --- |
| `ready` | 開始按鈕、點擊、`Space` | 進入 `aim`。 |
| `aim` | 點擊、`Space`、`P`、`R` | 再次點擊／按鍵時，以當前波動力量發射。 |
| `flight` | `S`、`P`、`R` | 速度衰減至停止門檻、到達時間上限或重開。 |
| `paused` | `P`、點擊、`R` | 恢復前一可運作狀態或重開。 |
| `over` | 開始按鈕、點擊、`R` | 重設世界與遭遇角色，回到 `aim`。 |

輸入事件會先檢查狀態，例如 `S` 只在 `flight` 有效且特技計量大於零時才可執行。這避免了準備畫面誤消耗計量、暫停時物理仍更新或同一個鍵同時觸發多種事件。

## 原始資產流程

我先從使用者提供的 SWF 匯出 `s_back`、`mc_nanaka`、`mc_taichi`、`mc_misato`、`mc_miki`、`mc_youko` 與 `116_OnAir.mp3`。精靈輸出保有 Flash 符號座標系的巨大透明留白，因此以 alpha 通道的最小非透明矩形做**無內容變更的裁切**；角色外觀與像素內容沒有重新繪製或以 AI 改造。

| 內嵌素材 | 原 SWF 符號／來源 | 在重製版中的用途 |
| --- | --- | --- |
| 背景道路與樹叢 | `s_back` 首幀 | 作為可平移、重複的遠景層。 |
| Nanaka 騎車精靈 | `mc_nanaka` 首幀 | 準備與發射場景的擊球者。 |
| Taichi 飛行精靈 | `mc_taichi` 首幀 | 發射後旋轉、反彈的主角。 |
| Misato、Miki、Youko 精靈 | 對應 `mc_*` 首幀 | 路上遭遇者與不同加速效果。 |
| `OnAir` 音訊 | 音效 ID 116 | 使用者點擊音符按鈕後才播放的循環背景聲。 |

音訊以 `new Audio()` 建立；這是瀏覽器提供的 `HTMLAudioElement` 建構方式。由於現代瀏覽器通常會阻擋頁面載入時自動播放可聽音訊，因此本作刻意只在使用者的按鈕互動後嘗試播放。[5]

## 單檔封裝與開發檔

| 路徑 | 角色 | 是否為遊戲執行所必需 |
| --- | --- | --- |
| `index.html` | 可讀性較高的遊戲來源；只使用同儲存庫 `assets/` 目錄的相對路徑。 | **是** |
| `assets/` | 完整圖像與音效檔，包含原始 SWF 裁切資產與本作介面輔助資產。 | **是（相對路徑版）** |
| `nanaca-crash-standalone.html` | 最終可攜遊戲；完整資產已轉為 data URI。 | **是（單檔版）** |
| `tools/build_github_release.py` | 將開發來源、原始裁切資產與介面輔助資產複製至 GitHub 目錄並封裝單檔版的再現腳本。僅供維護者使用。 | 否 |
| `ideas.md` | 使用者要求的設計方向、色彩與互動原則紀錄。 | 否 |

封裝腳本只使用 Python 標準函式庫，將 PNG、JPG 與 MP3 位元組轉為 `data:<mime>;base64,...` 字串，再替換本機資產路徑。**最終檔案在執行時不會執行 Python，也不需要安裝 Python。**

## 相容性、可近用性與已知差異

Canvas 畫面有替代性的 `aria-label`，而操作、狀態和規則以 Canvas 外的真正 HTML 文字提供；這可補足 Canvas 本身不會將繪圖物件以語意方式暴露給輔助技術的限制。[3]按鈕有可見焦點樣式，舞台可以 Tab 聚焦並以鍵盤完成所有核心操作；`prefers-reduced-motion` 會壓低粒子與非必要動態。

| 已保留 | 有意差異 |
| --- | --- |
| 橫向拋射、重力、反彈衰減、角色碰撞、加速與最佳紀錄。 | 未逐格移植每個原始角色的長動畫、所有劇情對話、所有隱藏角色或全部 `cff` 分支。 |
| 原始背景、主角、發射者、遭遇角色和音訊。 | 顯示比例改為具響應式的 16:9，並加入完整繁體中文操作與狀態提示。 |
| 原作一鍵節奏與荒誕的「撞人再飛」核心。 | 特技以統一、可見、可測試的計量呈現，代替難以從單一操作看懂的原始多重特技組合。 |

## 驗證清單

| 測試項目 | 結果 |
| --- | --- |
| 初始舞台、原始角色、原始地景與 HUD 可在 Chromium 預覽中繪出。 | 通過 |
| 開始 → 瞄準 → 發射 → 飛行 → 反彈 → 結算流程。 | 已依狀態機與物理程式實作；可直接以 `Space` 手動驗證。 |
| `S` 特技、角色遭遇、`P` 暫停、`R` 重開。 | 已實作，且受狀態與計量檢查保護。 |
| 輸出是否不含外部 JavaScript／CSS 函式庫。 | 通過；最終檔案只有 HTML、內嵌 CSS、原生 JavaScript 與 data URI。 |
| 斷網或無伺服器時是否能開啟最終檔。 | 設計上通過；所有所需資產已內嵌於最終 `index.html`。 |

## 資產與權利聲明

本專案不主張原始遊戲之程式、角色、圖像、音效或名稱的所有權。附帶的重製檔案只應用於個人研究、相容性示範及使用者明確要求的重製工作；如要公開散布、商業使用或移除權利標示，請先取得原權利人的授權。第三方工具 JPEXS Free Flash Decompiler 使用 GPL-3.0 授權；它是分析工具，不會被包含或連結到最終的 HTML5 遊戲中。[1]

## References

[1] [JPEXS Free Flash Decompiler — GitHub 專案與功能說明](https://github.com/jindrapetrik/jpexs-decompiler)

[2] [JPEXS Free Flash Decompiler — Command-line arguments，`-export` 匯出資源說明](https://github.com/jindrapetrik/jpexs-decompiler/wiki/Commandline-arguments)

[3] [MDN Web Docs — Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

[4] [MDN Web Docs — Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

[5] [MDN Web Docs — HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
