# 逆向分析紀錄

## 檔案事實

| 項目 | 發現 |
|---|---|
| 原始檔 | 使用者提供的 `asteroids.swf` |
| 雜湊 | `d1c1670c8e942c96316e06ff33d74e1c79ddfb49cda12ecc95c7fb82499748b5` |
| Flash 容器 | 壓縮 `CWS`，SWF v6；靜態解壓後 36,797 bytes |
| 舞台 | 500 × 375 px |
| 原始時間基準 | 30 fps |
| 向量資產 | 11 個 `DefineShape`、12 個 `DefineSprite`；未發現點陣圖片定義 |
| 音效 | 10 個 `DefineSound`；其中 5 個已具 `thrust`、飛碟與節拍匯出連結名稱 |

## 已辨識的原作機制線索

原始位元組中出現 `asteroidMover`、`missileMover`、`saucerMover`、`explodeMover`、`wrapPos`、`hitTest`、`friction`、`hyperspace`、`paused`、`lives`、`score`、`scoreMod`、`newSpaceship`、`safeArea_mc`、`bangLarge`、`bangMedium` 與 `bangSmall` 等符號。這些字串支持重製下列可觀察的經典玩法：慣性飛船、跨邊界漂移、子彈、小行星分裂、飛碟、超空間跳躍、生命、分數、暫停與安全重生區。

## 採用與不採用的範圍

高分榜流程含有舊的外部網址與 `LoadVars.sendAndLoad`、`POST`、`SharedObject` 等字串；為了避免將已停用的舊式服務與隱私風險帶入單檔作品，本次只保留本機最高分紀錄（`localStorage`），不會呼叫任何遠端端點。遊戲也不會執行或嵌入原始 ActionScript；僅從靜態標籤、可讀字串與原始聲音連結名稱推定可見機制。

