# Assets

**Art direction:** 近黑藍太空底、稀疏星點、細緻 CRT 掃描質地與克制磷光。玩家物件與關鍵讀數採磷光綠 `#A5FFD6`，推進採琥珀 `#FFC857`，危險或爆裂訊號採珊瑚紅 `#FF5D73`。遊戲主要可視物件以可讀的幾何向量繪製，不以點陣精靈取代。

## 生成的視覺資產

| 名稱 | 描述 | 尺寸 | URL | 遊戲用途 |
|---|---|---:|---|---|
| 視覺目標 | 已列出飛船、小行星、子彈、HUD 的 16:9 遊戲畫面 | 16:9，僅作品質基準 | `webdev-static-assets/asteroids-visual-target.png` | 開發與視覺驗證 |
| 星空質地 | 近黑藍背景、稀疏星點與極淡掃描線 | 16:9，滿畫布背景 | `webdev-static-assets/asteroids-starfield-texture.png` | 已壓縮為 WebP Data URL 並內嵌為遊戲背景層 |
| 軌道標誌 | 無文字的飛船、弧線與小行星圖形標誌 | 1:1，56px 顯示 | `webdev-static-assets/asteroids-orbit-mark.png` | 已壓縮為 WebP Data URL 並內嵌於標題面板 |

## 原始 SWF 音效

下表的 MP3 由 `tools/analyze_swf.py` 從使用者提供的 `original/asteroids.swf` 靜態抽取；檔案沒有重新合成或替換。最終 HTML 會將已選用的短音效編碼為 `data:audio/mpeg;base64,...`，因此仍符合單檔與離線可玩要求。

| 原始 ID | 匯出連結名稱 | 檔案 | 規格 | 預計事件 |
|---:|---|---|---|---|
| 1 | `thrust` | `original/audio/sound_1.mp3` | MP3、11025 Hz、單聲道、約 0.52 秒 | 按住推進時的節流播放 |
| 2 | `saucerSmall` | `original/audio/sound_2.mp3` | MP3、11025 Hz、單聲道、約 0.42 秒 | 小飛碟出現或射擊 |
| 3 | `saucerBig` | `original/audio/sound_3.mp3` | MP3、11025 Hz、單聲道、約 0.42 秒 | 大飛碟出現或射擊 |
| 4 | `beat2` | `original/audio/sound_4.mp3` | MP3、11025 Hz、單聲道、約 0.31 秒 | 波次節拍 B |
| 5 | `beat1` | `original/audio/sound_5.mp3` | MP3、11025 Hz、單聲道、約 0.31 秒 | 波次節拍 A |

## 原始向量資產處理方式

靜態報告顯示原始 SWF 有 `DefineShape`、`DefineSprite` 與 `ExportAssets`，但沒有可直接擷取的點陣圖片標籤。`asteroid`、`explosion` 與 `spaceship` 是 Flash 向量角色連結名稱，因此本重製版選擇以 Canvas 多邊形、短線與粒子重建其同類視覺語意，而非輸出低品質的截圖點陣圖。
