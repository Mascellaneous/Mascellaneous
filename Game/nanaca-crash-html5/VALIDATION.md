# 單檔 HTML 驗證紀錄

## 環境

| 項目 | 結果 |
| --- | --- |
| 測試日期 | 2026-08-16（GMT+8） |
| 測試瀏覽器 | Chromium（沙箱瀏覽器） |
| 測試路徑 | `file:///home/ubuntu/nanaca-crash-html5/dist/nanaca-crash-html5/index.html` |
| 網頁伺服器 | 未使用；以本機 `file://` 直接開啟。 |

## 已確認項目

最終封裝檔可直接載入標題、原始 Nanaka 與 Taichi 角色精靈、原始道路／樹叢背景、Canvas 舞台、控制說明與 HUD。初始狀態顯示「PRESS START TO CRASH」；點擊「開始飛行」後，按鈕文字改為「鎖定力量」，舞台顯示「SPACE / CLICK TO LAUNCH」力量量表，並且輔助狀態文字同步更新為瞄準提示。

這次驗證證實 data URI 內嵌的影像和程式不需要預覽伺服器即可被瀏覽器讀取。瀏覽器的可聽音訊政策要求使用者互動後播放，因此背景音樂仍採用右上角音符按鈕的明確啟動流程。

## GitHub 資產自足化補充驗證

| 輸出檔 | 本機測試路徑 | 結果 |
| --- | --- | --- |
| 相對路徑版 | `file:///home/ubuntu/github-useful-tools/nanaca-crash-html5/index.html` | 原始角色、背景、介面輔助視覺和 Canvas 舞台均成功載入；所有資產由同目錄 `assets/` 提供。 |
| 單檔版 | `file:///home/ubuntu/github-useful-tools/nanaca-crash-html5/nanaca-crash-standalone.html` | 視覺與舞台成功載入；圖片與音訊均內嵌為 data URI，不需要 `assets/` 資料夾。 |

上述兩個版本均以 `file://` 直接開啟。GitHub 準備目錄中的 HTML 程式碼與 Markdown 文件將在提交前再以遞迴文字搜尋檢查特定託管平台名稱及託管路徑。
