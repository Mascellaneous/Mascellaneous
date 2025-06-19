# TicTacToeVariants README

## 概述

`TicTacToeVariants` 資料夾包含兩款井字遊戲（Tic-Tac-Toe）的變體實現：

1. **經典井字遊戲**：固定 3x3 棋盤，玩家可選擇與另一玩家對戰或與 AI 對戰。
2. **m,n,k 遊戲**：可自訂棋盤大小（m 行 x n 列）及獲勝所需的連線數 k，支援與玩家或 AI 對戰。

本文件詳細說明資料夾中的檔案、JavaScript 函數功能、程式在模式/棋盤大小/難度變更時的行為，以及不同 AI 難度的運作方式。

---

## 1. 資料夾中的檔案

以下是 `TicTacToeVariants` 資料夾中的檔案及其用途：

- **`tic-tac-toe.html`**：
  - **描述**：經典 3x3 井字遊戲的完整實現，包含內聯 CSS 樣式（無需外部 CSS 檔案）。
  - **功能**：
    - 提供固定 3x3 棋盤。
    - 支援「雙人模式」（兩名玩家）或「對戰 AI 模式」。
    - 可選擇 AI 難度（簡單、中等、困難）。
    - 支援深色模式切換。
    - 當模式或 AI 難度在中途變更時，顯示警告訊息並重置遊戲。
  - **結構**：
    - HTML：定義遊戲介面（棋盤、模式選擇、難度選擇、狀態顯示等）。
    - CSS：內聯樣式，控制視覺效果（棋盤格子、按鈕、深色模式等），並確保無佈局偏移。
    - JavaScript：實現遊戲邏輯、AI 移動、模式切換及警告訊息。

- **`mnk-game.html`**：
  - **描述**：m,n,k 遊戲的 HTML 檔案，需搭配 `mnk-game.css` 使用。
  - **功能**：
    - 允許自訂棋盤大小（m 行、n 列，範圍 1-15）及獲勝連線數 k（最小值 2，除非棋盤為 1x1）。
    - 支援「雙人模式」或「對戰 AI 模式」。
    - 可選擇 AI 難度（簡單、中等、困難）及 AI 思考時間（最低 5 秒）。
    - 支援深色模式。
    - 提供輸入驗證（例如，k 必須在 2 至 min(m,n) 之間）及警告訊息。
    - 模式、棋盤大小或難度變更時，重置遊戲並顯示警告。
  - **結構**：
    - HTML：定義介面（輸入框、棋盤、狀態顯示等）。
    - JavaScript：處理遊戲邏輯、AI 移動、輸入驗證、動態棋盤生成及警告。

- **`mnk-game.css`**：
  - **描述**：m,n,k 遊戲的外部 CSS 檔案，為 `mnk-game.html` 提供樣式。
  - **功能**：
    - 定義視覺樣式（棋盤、輸入框、按鈕、警告訊息等）。
    - 確保無佈局偏移（使用固定 `height` 和 `visibility` 切換警告訊息）。
    - 支援深色模式及響應式設計（小螢幕調整）。
    - 棋格大小根據棋盤尺寸動態調整（n ≥ 10 時為 40px，否則為 60px）。

---

## 2. JavaScript 函數功能

以下是 `tic-tac-toe.html` 和 `mnk-game.html` 中主要 JavaScript 函數的功能說明，分別按檔案列出。部分函數在兩檔案中功能相似，但 m,n,k 遊戲因支援動態棋盤而更複雜。

### `tic-tac-toe.html` 中的主要函數

- **`showWarning(message)`**：
  - 顯示警告訊息（例如「遊戲因模式變更而重置」）於 `#warning` 元素，持續 3 秒後消失。
  - 使用 CSS `.show` 類別切換 `visibility`，避免佈局偏移。

- **`toggleDifficulty()`**：
  - 根據 `#mode` 選擇（「雙人」或「對戰 AI」）顯示或隱藏 `#difficulty-group`。
  - 若遊戲進行中且模式變更，重置遊戲、更新 `isAIMode` 並顯示警告。
  - 使用 `classList.toggle('show')` 控制 `#difficulty-group` 可視性。

- **`highlightLastMove(cell, player)`**：
  - 高亮最近一次移動的棋格（X 或 O），持續 2 秒。
  - 為棋格添加 `highlight-x` 或 `highlight-o` 類，移除舊高亮。

- **`startGame()`**：
  - 初始化遊戲，設置 `isAIMode` 和 `aiDifficulty`。
  - 重置棋盤、玩家順序（隨機決定 AI 是否先手）、狀態顯示。
  - 若為「對戰 AI」且 AI 先手，觸發 AI 移動。

- **`handleCellClick(e)`**：
  - 處理玩家點擊棋格：
    - 檢查是否允許點擊（遊戲有效、當前玩家非 AI、格子為空）。
    - 更新棋盤、顯示 X/O、高亮移動。
    - 檢查勝負或平局，更新狀態。
    - 若為「對戰 AI」，觸發 AI 移動。

- **`makeAIMove()`**：
  - 根據 `aiDifficulty`（簡單、中等、困難）選擇 AI 移動。
  - 更新棋盤、顯示 O、高亮移動，檢查勝負或平局。

- **`checkWinForPlayer(player)`**：
  - 檢查指定玩家是否獲勝，遍歷 `winCombinations` 確認連線。

- **`getWinOrBlockMove()`**：
  - 尋找 AI 獲勝或阻擋玩家的移動（用於簡單和中等等級 AI）。
  - 優先檢查 AI 是否可勝出，再檢查是否需阻擋玩家。

- **`getRandomMove()`**：
  - 從空棋格中隨機選擇一個移動。

- **`getEasyMove()`**：
  - 簡單 AI：優先獲勝或阻擋，否則隨機移動。

- **`getMediumMove()`**：
  - 中等 AI：優先獲勝或阻擋，否則使用 minimax 算法選擇最佳移動。

- **`getHardMove()`**：
  - 困難 AI：優先獲勝或阻擋，使用帶 alpha-beta 剪枝的 minimax 算法。

- **`minimax(board, isMaximizing, alpha, beta)`**：
  - 實現 minimax 算法，評估棋盤狀態分數（O 勝 -1，X 勝 -1，平局 0）。
  - 在 `getHardMove` 中使用 alpha-beta 剪枝優化效率。

- **`checkWin()`**：
  - 檢查當前玩家是否獲勝，呼叫 `checkWinForPlayer`。

- **`checkDraw()`**：
  - 檢查是否平局（棋盤無空格）。

- **`resetGame()`**：
  - 重置遊戲狀態，清除棋盤、隨機決定先手、更新顯示。
  - 若為「對戰 AI」且 AI 先手，觸發 AI 移動。

- **`toggleDarkMode()`**：
  - 切換深色模式，更新 `#dark-mode-toggle` 按鈕圖標（☾/☀）。

### `mnk-game.html` 中的主要函數

- **`showWarning(message)`**：
  - 同 `tic-tac-toe.html`，顯示警告訊息於 `#warning`。

- **`toggleDifficulty()`**：
  - 同 `tic-tac-toe.html`，控制 `#difficulty-group` 和 `#ai-time-group` 可視性。
  - 模式變更時重置遊戲並顯示警告。

- **`highlightLastMove(cell, player)`**：
  - 同 `tic-tac-toe.html`，高亮最近移動。

- **`initializeBoard()`**：
  - 根據 `m`（行）、`n`（列）動態生成棋盤。
  - 設置棋格大小（n ≥ 10 時為 40px，否則 60px）。
  - 為每個棋格添加點擊事件監聽器。

- **`startGame(userMovesFirst = false)`**：
  - 驗證輸入（m, n ∈ [1, 15]，k ∈ [2, min(m,n)] 或 1 若 min(m,n)=1，AI 時間 ≥ 5 秒）。
  - 初始化遊戲，設置 `isAIMode`、`aiDifficulty`、棋盤、玩家順序。
  - 顯示錯誤訊息（例如 `#rowsError`）若輸入無效。
  - 若為「對戰 AI」且 AI 先手，觸發 AI 移動。

- **`handleCellClick(e)`**：
  - 同 `tic-tac-toe.html`，但支援動態棋盤索引。
  - 若遊戲未開始，自動呼叫 `startGame(true)`。

- **`makeAIMoveWithTimeout()`**：
  - 根據 `aiDifficulty` 和 `aiMaxTime`（用戶設定的 AI 思考時間）執行 AI 移動。
  - 確保 AI 移動有效，更新棋盤、檢查勝負。

- **`getRandomMove()`**：
  - 同 `tic-tac-toe.html`，隨機選擇空棋格。

- **`getEasyMove()`**：
  - 簡單 AI：優先獲勝或阻擋，否則隨機移動。

- **`getMediumMove(startTime)`**：
  - 中等 AI：優先獲勝或阻擋，否則使用 minimax 算法（深度限制為 4 或根據棋盤大小調整）。
  - 若為第一步，嘗試選擇玩家移動的鄰近格子。

- **`getHardMove(startTime)`**：
  - 困難 AI：優先獲勝或阻擋，使用帶 alpha-beta 剪枝的 minimax 算法，深度最多為 8。
  - 使用 `evaluateBoard` 評估非終局棋盤，優先中心格子和連線機會。
  - 若為第一步，選擇玩家移動的鄰近格子。

- **`evaluateBoard()`**：
  - 評估棋盤分數，考慮 O 和 X 的連線數及中心格子控制。
  - 用於 `getHardMove` 的 minimax 終止條件。

- **`getSortedMoves()`**：
  - 為 `getHardMove` 排序移動，優先選擇有鄰居的格子及靠近中心的格子。

- **`minimax(board, depth, isMaximizing, alpha, beta, startTime, maxDepth)`**：
  - 實現 minimax 算法，支援 alpha-beta 剪枝及時間限制（`aiMaxTime`）。
  - 用於 `getMediumMove` 和 `getHardMove`。

- **`checkWin()`**：
  - 檢查當前玩家是否獲勝，遍歷行、列、對角線，確認 k 個連續相同符號。

- **`checkSequence(start, step, length)`**：
  - 檢查指定方向（行、列、對角線）是否形成 k 連線。

- **`checkDraw()`**：
  - 檢查是否平局（棋盤無空格）。

- **`resetGame()`**：
  - 重置遊戲，保留當前棋盤大小和模式，隨機決定先手。

- **`getAdjacentIndices(index)`**：
  - 返回指定格子的空鄰居格子索引，用於 AI 移動（例如第一步選擇鄰近格子）。

- **`toggleDarkMode()`**：
  - 同 `tic-tac-toe.html`，切換深色模式。

- **`updateHints()`**：
  - 動態更新輸入提示（例如 `#kHint` 顯示 k 的範圍）。
  - 驗證輸入，若無效則顯示錯誤（例如 `#kError`）。
  - 若棋盤大小或 k 變更，重置遊戲並顯示警告。

---

## 3. 程式行為（模式、棋盤大小、難度變更）

以下說明程式在模式、棋盤大小及 AI 難度變更時的行為，分別針對兩個遊戲檔案。

### `tic-tac-toe.html`（經典井字遊戲）

- **模式變更**（`#mode`：雙人 ↔ 對戰 AI）：
  - **未開始遊戲**：切換模式僅影響 `#difficulty-group` 的可視性（顯示/隱藏 AI 難度選擇）。
  - **遊戲進行中**：
    - 切換模式（例如從「雙人」到「對戰 AI」）會重置遊戲：
      - 棋盤清空，隨機決定先手（若為「對戰 AI」，AI 有 50% 機率先手）。
      - 顯示警告訊息「遊戲因模式變更而重置」。
      - 若新模式為「對戰 AI」且 AI 先手，AI 在 500ms 後移動。
    - `#difficulty-group` 根據模式顯示或隱藏，無佈局偏移（因 `height: 40px` 和 `visibility`）。

- **棋盤大小**：
  - 固定為 3x3，無用戶輸入，無相關行為變化。

- **AI 難度變更**（`#difficulty`：簡單、中等、困難）：
  - **未開始遊戲**：選擇難度僅影響後續遊戲的 AI 行為。
  - **遊戲進行中**：
    - 變更難度不會重置遊戲，但會立即影響 AI 的下一次移動。
    - 顯示警告訊息（例如「AI 難度變更為中等」）。
  - 不同難度的 AI 行為見下方「AI 運作方式」。

### `mnk-game.html`（m,n,k 遊戲）

- **模式變更**（`#mode`：雙人 ↔ 對戰 AI）：
  - **未開始遊戲**：切換模式顯示或隱藏 `#difficulty-group` 和 `#ai-time-group`。
  - **遊戲進行中**：
    - 同 `tic-tac-toe.html`，重置遊戲並顯示「遊戲因模式變更而重置」。
    - 若新模式為「對戰 AI」且 AI 先手，AI 根據設定的思考時間移動。
    - `#difficulty-group` 和 `#ai-time-group` 使用 `visibility` 切換，無佈局偏移。

- **棋盤大小及 k 變更**（`#rows`, `#cols`, `#k`）：
  - **未開始遊戲**：
    - 輸入 m（行）、n（列）、k（連線數）會動態更新提示（例如 `#kHint` 顯示「範圍：2 至 3」）。
    - 若輸入無效（例如 m > 15 或 k < 2 於非 1x1 棋盤），顯示錯誤訊息（例如 `#kError`）並阻止遊戲開始。
  - **遊戲進行中**：
    - 更改 m, n 或 k 會觸發 `updateHints`：
      - 驗證輸入，若無效則顯示錯誤（例如 `#rowsError`）並將值修正（例如 k 設為 2）。
      - 若輸入有效且與當前棋盤不同，重置遊戲並顯示「遊戲因棋盤大小或 k 變更而重置」。
    - 棋盤動態重建，格子大小根據 n 調整（n ≥ 10 為 40px，否則 60px）。
  - **輸入驗證**：
    - m, n：1 至 15。
    - k：2 至 min(m,n)，除非 min(m,n)=1 則 k=1。
    - AI 思考時間：≥ 5 秒（>60 秒表示無限制）。
    - 錯誤訊息（例如 `#kError`）使用 `height: 20px` 和 `visibility`，無佈局偏移。

- **AI 難度變更**（`#difficulty`：簡單、中等、困難）：
  - **未開始遊戲**：影響後續 AI 行為。
  - **遊戲進行中**：
    - 同 `tic-tac-toe.html`，不重置遊戲，但影響下一次 AI 移動。
    - 顯示警告（例如「AI 難度變更為困難」）。

---

## 4. 不同 AI 的運作方式

兩款遊戲的 AI 實現相似，但 m,n,k 遊戲因動態棋盤更複雜。以下詳細說明簡單、中等、困難 AI 的運作方式。

### 共同 AI 邏輯

- **AI 移動時機**：
  - 在「對戰 AI」模式下，當 `currentPlayer = 'O'` 時，AI 執行移動。
  - `tic-tac-toe.html`：固定 500ms 延遲。
  - `mnk-game.html`：根據 `#ai-time`（最低 5 秒，>60 秒無限制）控制思考時間。

- **優先策略**：
  - 所有難度均優先檢查：
    1. **獲勝移動**：若 AI 可放置 O 形成 k 連線（或 3 連線於 `tic-tac-toe.html`），則選擇該格。
    2. **阻擋移動**：若玩家可放置 X 形成連線，AI 選擇阻擋該格。

### 簡單 AI（`getEasyMove`）

- **行為**：
  - 檢查獲勝或阻擋移動（`getWinOrBlockMove`）。
  - 若無獲勝或阻擋機會，隨機選擇空格（`getRandomMove`）。
- **特點**：
  - 計算量低，適合快速遊戲。
  - 易被玩家擊敗，因隨機移動缺乏策略。
- **適用場景**：
  - 初學者或休閒玩家。
- **差異**：
  - `tic-tac-toe.html`：檢查固定 8 種連線組合。
  - `mnk-game.html`：檢查動態行、列、對角線，確認 k 連線。

### 中等 AI（`getMediumMove`）

- **行為**：
  - 優先檢查獲勝或阻擋。
  - 若無立即威脅，使用 minimax 算法評估最佳移動：
    - `tic-tac-toe.html`：遍歷所有可能棋局，計算分數（O 勝 +10，X 勝 -10，平局 0）。
    - `mnk-game.html`：限制搜索深度（最多 4 或根據棋盤大小調整），考慮思考時間限制。
  - 在 `mnk-game.html` 中，若為第一步，嘗試選擇玩家移動的鄰近格子（`getAdjacentIndices`）。
- **特點**：
  - 平衡策略性和計算效率。
  - 在小型棋盤（例如 3x3）表現接近困難 AI，但在大型棋盤因深度限制可能錯過最佳移動。
- **適用場景**：
  - 尋求挑戰但不希望 AI 太強的玩家。
- **差異**：
  - `mnk-game.html`：加入時間限制（`aiMaxTime`）和第一步鄰近策略。

### 困難 AI（`getHardMove`）

- **行為**：
  - 優先檢查獲勝或阻擋。
  - 使用帶 alpha-beta 剪枝的 minimax 算法：
    - `tic-tac-toe.html`：遍歷完整棋局樹，保證最佳移動。
    - `mnk-game.html`：搜索深度最多為 8，根據棋盤大小和 `aiMaxTime` 限制。
  - 在 `mnk-game.html` 中：
    - 使用 `evaluateBoard` 評估非終局棋盤，優先連線數多和中心格子。
    - 通過 `getSortedMoves` 優化移動順序，優先有鄰居和靠近中心的格子。
    - 第一步選擇玩家移動的鄰近格子。
- **特點**：
  - 在 3x3 棋盤上幾乎無敵（總是獲勝或平局）。
  - 在大型棋盤上因計算限制可能非最佳，但仍具強大策略性。
- **適用場景**：
  - 尋求高挑戰的玩家。
- **差異**：
  - `mnk-game.html`：更複雜的評估函數和移動排序，適應動態棋盤。

---

## 使用說明

1. **運行遊戲**：
   - **經典井字遊戲**：
     - 開啟 `tic-tac-toe.html` 於瀏覽器。
     - 選擇模式（雙人或對戰 AI），若為 AI 模式選擇難度，點擊「開始遊戲」。
   - **m,n,k 遊戲**：
     - 確保 `mnk-game.html` 和 `mnk-game.css` 在同一資料夾。
     - 開啟 `mnk-game.html`，輸入 m, n, k 和 AI 思考時間（若為對戰 AI），點擊「開始遊戲」。

2. **操作**：
   - 點擊棋格放置 X 或 O（AI 自動放置 O）。
   - 切換模式、難度或棋盤大小（m,n,k 遊戲）以觀察行為變化。
   - 使用右上角按鈕切換深色模式。

3. **測試建議**：
   - **模式切換**：遊戲中切換模式，確認重置和警告訊息。
   - **棋盤大小（m,n,k 遊戲）**：嘗試極端值（例如 1x1 或 15x15），檢查驗證和棋盤顯示。
   - **AI 難度**：與不同難度 AI 對戰，觀察策略差異。
   - **響應式設計**：在小螢幕（<480px）測試佈局和字體調整。

---

## 注意事項

- **相容性**：遊戲在現代瀏覽器（Chrome、Firefox、Edge）上運行良好。
- **佈局穩定性**：所有警告訊息和動態元素（例如 `#ai-thinking`）使用固定高度和 `visibility`，確保無佈局偏移。
- **AI 性能**：
  - 在 `mnk-game.html` 中，大型棋盤（例如 15x15）可能因計算量大而導致 AI 響應較慢，建議設置較長思考時間。
  - 困難 AI 在 3x3 棋盤上表現最佳。
- **可訪問性**：建議為 `#warning` 添加 `aria-live="polite"` 增強螢幕閱讀器支援（目前未實現）。

---

## 未來改進

- 新增 AI 移動動畫，提升視覺體驗。
- 在 m,n,k 遊戲中支援更多 AI 策略（例如啟發式搜索）。
- 實現多人線上對戰功能。
- 增強可訪問性（例如鍵盤操作、ARIA 屬性）。

---

## 聯繫

如有問題或建議，請聯繫開發者。
**最後更新**：2025年6月18日
