# Simon SWF 現代重製版

本專案將使用者提供的 Flash 6 格式 `simon.swf` 以**靜態分析**方式拆解，並把核心記憶遊戲重寫成可直接雙擊開啟的 `simon.html`。成品不需要伺服器、套件管理器、外部字型、CDN、框架或網路連線；HTML、CSS 與 JavaScript 均封裝在一個檔案中，四段按鍵音則以原始 SWF 擷取出的本機 MP3 保存在同一份交付目錄。

> 這不是在瀏覽器內模擬 Flash，而是保留原作的遊戲迴圈、四色訊號、序列比對、高分概念、難度加速與可用音效後，以現代 Web 平台重新實作。

| 交付物 | 說明 |
|---|---|
| `simon.html` | 遊戲主檔。內含所有 CSS 與 JavaScript；需與 `assets/` 目錄置於同一層。 |
| `assets/sound-54.mp3` 至 `assets/sound-57.mp3` | 從原 SWF 擷取、未轉碼的四段按鍵聲；這是遊戲唯一的本機媒體資產。 |
| `README.md` | 本技術說明、使用方式、還原依據與驗證步驟。 |
| `analysis/swf-report.json` | 原始 SWF 的靜態標籤盤點，可追溯格式、時間軸、媒體與可讀字串。 |
| `analysis/reconstruction-notes.md` | 將原始 ActionScript 名稱與現代狀態機對應的工作筆記。 |
| `analysis/audio-spectrum.txt` | 擷取音效的時長與主要頻率量測。 |
| `original-assets/simon.swf` | 使用者提供的原始檔備份；SHA-256 為 `f32844bbd69beceb656f0eb9bafd9ac5ed96d046de866353e00f67eeeeeb94ef`。 |

## 如何執行

請完整保留 `simon.html` 與同層的 `assets/` 目錄，再以任意現代瀏覽器直接開啟 `simon.html`。所有資產均為本機檔案，因此沒有網路連線時也可以使用。瀏覽器通常會在第一次由按鈕、鍵盤等使用者操作觸發聲音時允許播放；這符合自動播放限制的通行做法。[2]

| 操作 | 指令或按鍵 | 說明 |
|---|---|---|
| 開始或重開 | 中心的「開始」按鈕 | 清空本局分數並播放新的第一組訊號。 |
| 綠色 | `1` 或 `↑` | 輸入綠色訊號。 |
| 紅色 | `2` 或 `→` | 輸入紅色訊號。 |
| 藍色 | `3` 或 `↓` | 輸入藍色訊號。 |
| 黃色 | `4` 或 `←` | 輸入黃色訊號。 |
| 最高分 | 自動保存 | 使用本機 `localStorage`；同一瀏覽器與來源下重新載入後仍會保留。[3] |

## 原始 SWF 的靜態還原結果

原始檔識別為壓縮的 `CWS`、Flash 版本 6，主時間軸是 21 FPS、64 個影格。標籤清單包含 8 個 `DefineSprite`、7 個 `DefineButton2`、6 個 `DefineSound` 與 10 個 `DoAction`；因此它是以向量形狀、巢狀時間軸及 ActionScript 2 風格事件組成，而非以一組點陣圖介面製作。[1] [4]

| 原 SWF 證據 | 觀察 | 重製處置 |
|---|---|---|
| `green_btn`、`yellow_btn`、`blue_btn`、`red_btn` | 四個具名按鍵和四個顏色通道。 | 四個原生 `<button>` 形成環狀色盤，保留名稱與顏色語意。 |
| `seq_array`、`tempSeq_array`、`shift`、`slice` | 一個序列陣列與一個可消耗的暫存副本。 | `sequence` 保存正解；`expected` 以展開運算子複製後逐筆 `shift()` 比對。 |
| `compTurn`、`enabled`、`checkLight` | 電腦回合與按鍵鎖定旗標。 | 五段明確狀態：`idle`、`computer`、`player`、`feedback`、`lost`。 |
| `score`、`highScore`、`SharedObject.getLocal('neaveSimon')` | 分數和本機高分紀錄。 | 目前分數與 `localStorage` 最高分。 |
| 分數 4、9、14、19 的時間軸跳轉 | 代表遊戲有分段加快的節奏安排。 | 每完成 5 回合縮短燈號與間距，並設定 190ms 下限。 |
| 六個內嵌 MP3 音效 | 四個短促單音可作為色塊回饋；另有較長提示音。 | 將四個短單音以原始 MP3 檔形式放入 `assets/`，由 HTML 以相對 URL 載入。 |

原始檔未含 `DefineBitsJPEG*` 或其他可直接擷取的介面點陣圖。盤面的實體感由 `DefineShape*`、`DefineSprite` 與顏色按鍵構成；重製版因而用 CSS 的 `conic-gradient`、圓角象限、內陰影與外框來重建同類型視覺語彙，而不是捏造「原始圖片資產」。這項決策保留風格來源，同時符合離線、可縮放與低維護需求。[1]

## 遊戲機制

每次開始後，程式新增一個 `0..3` 的隨機值至 `sequence`。電腦播放階段依序讓對應色塊發亮並播放其內嵌音效；播放完畢才將序列複製至 `expected`，切換為玩家階段。每一次玩家輸入均與 `expected[0]` 比對，正確便移除首項；佇列清空則代表此回合完成，分數加一並進到下一組；錯誤則立即進入 `lost`，取消後續非同步流程並鎖定四色按鍵。

```text
idle ──開始──> computer ──序列播完──> player
                                  │       │
                                  │       ├─ 正確、尚有項目 ──> player
                                  │       ├─ 正確、佇列清空 ──> feedback ──> computer
                                  │       └─ 錯誤 ──> lost ──開始──> computer
```

| 程式元素 | 技術細節 | 為何如此處理 |
|---|---|---|
| 回合取消令牌 | `gameId` 在重新開始與失敗時遞增；每個 `await` 後確認識別碼。 | 避免前一回合的延遲計時器在新遊戲中重新解鎖按鍵。 |
| 播放節奏 | `signal()` 以 `async`/`await` 先亮燈、播放音效、等待、滅燈。 | 以線性的控制流程取代 Flash 影格標籤，使回合時序可讀且容易調整。 |
| 聲音封裝 | `new Audio(dataUri)` 建立來源；每次觸發以 `cloneNode()` 產生獨立播放實例。 | 允許連續按鍵時重疊發聲，且不需要外部檔案。 |
| 數值顯示 | `String(value).padStart(2, '0')`。 | 保留早期電子遊戲的兩位數讀數感。 |
| 難度 | `Math.floor(score / 5)` 決定速度等級。 | 呼應原 SWF 在四個分數門檻切換時間軸的漸進加速。 |

## 原始音效資產的使用方式

原 SWF 可擷取出六段有效 MP3。分析結果顯示其中四段長度約為 0.418–0.522 秒，主頻率各約為 220、196、148、112 Hz，適合作為四色按鍵訊號；重製版正是使用這四段原始 MP3，而不是以 Web Audio API 合成近似音。[1] 每段音效以 `assets/sound-*.mp3` 的相對路徑載入，因此 `simon.html` 不會發出任何網路請求。

| HTML 色塊索引 | 資產來源 | 主頻率（約） | 結果 |
|---:|---|---:|---|
| 0（綠） | 原 SWF 的 `sound-54.mp3` | 220 Hz | 原始 MP3 相對載入。 |
| 1（紅） | 原 SWF 的 `sound-55.mp3` | 196 Hz | 原始 MP3 相對載入。 |
| 2（藍） | 原 SWF 的 `sound-56.mp3` | 148 Hz | 原始 MP3 相對載入。 |
| 3（黃） | 原 SWF 的 `sound-57.mp3` | 112 Hz | 原始 MP3 相對載入。 |

此配色到音高的表格是重製版為了維持四個獨立訊號所採用的明確映射。靜態 ActionScript 資料可證實四個按鍵與四段短音存在，但不應將上述索引順序宣稱為 Flash 時間軸內的唯一原始色—音對應；這是有意保留來源證據與實作選擇之間界線的做法。

## 可近用性與相容性

所有色塊均是原生按鈕，具備可讀名稱、可見焦點框與鍵盤輸入；觸控裝置可直接點按。畫面不只靠顏色傳達狀態：還會顯示「機器播放」、「你的回合」與錯誤訊息。使用者若啟用 `prefers-reduced-motion: reduce`，CSS 將大幅縮短非必要的過渡與震動，降低動態效果干擾。[5]

| 項目 | 實作 | 使用者效益 |
|---|---|---|
| 焦點可見性 | `:focus-visible` 白色外框。 | 鍵盤使用者知道目前焦點所在。 |
| 非色彩提示 | 狀態燈、文字狀態與數值讀數。 | 不會只依賴色覺辨識遊戲流程。 |
| 動態偏好 | `prefers-reduced-motion` 媒體查詢。 | 尊重作業系統的減少動態設定。 |
| 離線性 | 零外部 URL、無模組 `import`、無 `fetch`。 | `simon.html` 與同層 `assets/` 可由本機直接執行並可長期保存。 |

## 驗證方式

瀏覽器驗證已覆蓋初始載入、第一回合播放、正確輸入後的得分與最高分更新、兩步序列複製，以及錯誤輸入後的鎖定與重新開始狀態。詳細的測試紀錄可見 `analysis/browser-verification.md`。若要在自己的環境復查，請以瀏覽器打開 `simon.html`，按下開始、記住燈號、輸入正確序列後再故意輸入一個錯誤色塊，並確認以下結果。

| 測試情境 | 預期結果 |
|---|---|
| 初始載入 | 四色按鍵停用；狀態顯示「待命」；分數為 00。 |
| 按下開始 | 機器先播放序列；播放中按鍵停用；播放後切換為「你的回合」。 |
| 完成一回合 | 分數增加；高分視需要更新；新增一個訊號並重播整段序列。 |
| 輸入錯誤 | 顯示「失誤」與本局完成數；按鍵停用；中心按鈕可重新開始。 |
| 重新載入頁面 | 最高分保留；本局分數歸零。 |

## 開發與授權注意事項

此重製版為使用者要求的技術移植示範。原始 SWF 和內嵌音效可能仍受其原始作者或權利人的著作權與授權條款保護；在公開發布、商業使用或散布前，請確認你對原始資產具有相應權利。重製程式碼本身未載入任何第三方套件，也沒有使用或仿冒外站商標、外部連結或帳號資料。

## 參考資料

[1]: ./analysis/swf-report.json "由使用者提供之 simon.swf 的靜態標籤分析報告"
[2]: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay "MDN：Autoplay guide for media and Web Audio APIs"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage "MDN：Window.localStorage"
[4]: https://open-flash.github.io/mirrors/swf-spec-19.pdf "SWF File Format Specification, version 19"
[5]: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion "MDN：prefers-reduced-motion"
