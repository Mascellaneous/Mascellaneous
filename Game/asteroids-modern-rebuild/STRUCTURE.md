# 架構參考：Asteroids Modern Remake

最終檔案是單檔交付，程式碼仍以明確的責任分區撰寫，避免把狀態、物理與 Canvas 呼叫交織在同一段更新流程。

```text
asteroids-modern.html
├── HTML：Canvas、可存取的開始面板與控制說明
├── CSS：CRT 框架、HUD、面板、減少動態效果支援
└── JavaScript
    ├── Config：世界尺寸、速度、分數與色彩常數
    ├── InputManager：語意化鍵盤狀態與一次性按鍵事件
    ├── AudioBank：原始 MP3 Base64、手勢解鎖與重疊播放池
    ├── Entity helpers：向量、環面距離、跨邊界、隨機與粒子
    ├── Factories：飛船、小行星、飛碟、子彈與爆炸粒子
    ├── Game：模式機、波次、生成、碰撞、分數、生命與主迴圈
    └── Renderer：背景、向量物件、粒子、HUD 與覆蓋層繪製
```

## 狀態流

```text
title ──開始──> playing ──飛船被擊中──> respawning ──安全期結束──> playing
                      │                         │
                      │                         └──生命歸零──> gameover
                      │
                      ├──P / ESC──> paused ──恢復──> playing
                      └──清除波次──> playing（下一波）
```

## 物件模型

| 物件 | 關鍵狀態 | 更新責任 | 繪製方式 |
|---|---|---|---|
| `ship` | `x`、`y`、`vx`、`vy`、`angle`、`invulnerable` | 輸入、慣性、冷卻與重生 | 三角向量輪廓與推進火焰 |
| `asteroid` | `size`、`radius`、`vertices`、`spin` | 漂移、旋轉、命中後分裂 | 不規則封閉多邊形 |
| `bullet` | `owner`、`life`、`vx`、`vy` | 生命週期、跨邊界、碰撞 | 短亮線與殘影 |
| `saucer` | `kind`、`fireCooldown`、`travelTime` | 橫向漂移、隨機微調、射擊 | 扁平弧形向量輪廓 |
| `particle` | `life`、`maxLife`、`color` | 速度衰減與透明度 | 單一短線或亮點 |

## Asset Hints

Canvas 適合原作的向量幾何，不必將 Flash `DefineShape` 硬轉成點陣圖片。原始 SWF 沒有 `DefineBits` / JPEG / PNG 圖元標籤，僅含 11 個 `DefineShape`；因此飛船與小行星以當代 Canvas 向量指令重畫，並重用已確認連結名稱的原始音效。
