# `kr.swf` 靜態逆向工程紀錄

本文件記錄本重製專案如何從使用者提供的 `kr.swf` 推導出玩法、物理參數與可使用素材。分析採用**解壓、SWF 標籤檢查、資源提取與 AS2 反編譯**；過程中**沒有執行 SWF 的 ActionScript**。因此，下列內容描述的是可驗證的靜態程式結構，而非對原始可執行檔進行執行期攔截。

> 本重製是相容性研究與保存導向的重寫。原始素材的權利狀態與原作者資訊未能從提供檔案中確認；使用者若計畫公開散布或商用，應自行確認授權。

## 1. 檔案指紋與時間軸

| 項目 | 靜態結果 | 對重製的意義 |
|---|---:|---|
| SWF 簽章 | `CWS`（zlib 壓縮） | 必須先解壓才能讀取標籤資料。 |
| Flash 版本 | 7 | 邏輯為 ActionScript 1/2，而非 AS3 bytecode。 |
| 解壓後長度 | 53,582 bytes | 小型單場景玩具，未見外部載入資源標籤。 |
| Stage | 550 × 400 px | 現代 Canvas 以此比例作為視覺參考，但自適應容器大小。 |
| 幀率 | 50 FPS | 原作直接以幀間時間差調整 Verlet 計算。 |
| 主時間軸 | 2 幀 | 第 1 幀宣告類別與方法；第 2 幀建立場景與事件迴圈。 |
| 音訊 | 未發現 `DefineSound` | 成品沒有捏造或新增「原始音效」。 |

## 2. 原始素材的抽取與還原

原檔有 9 個 `DefineBitsJPEG3` 標籤。此格式在 JPEG 影像後附帶 zlib 壓縮的 Alpha 資料，因此直接另存 JPEG 會遺失透明邊緣。重製流程會依 JPEG 解碼後的寬高解壓 Alpha 位元組，將 RGB 與 L 通道合成 RGBA PNG。最終 PNG 檔位於 [`assets/original/`](../assets/original/)。

| 原始 Character ID | 還原檔案 | 視覺角色 |
|---:|---|---|
| 1 | `original_character_1.png` | 大腿／褲管 |
| 4 | `original_character_4.png` | 胸口／上身 |
| 7 | `original_character_7.png` | 腹部／腰部 |
| 8 | `original_character_8.png` | 手部結點美術 |
| 11 | `original_character_11.png` | 頭部 |
| 14 | `original_character_14.png` | 袖子／上臂 |
| 17 | `original_character_17.png` | 小腿與鞋 |
| 20 | `original_character_20.png` | 前臂與手部 |
| 23 | `original_character_23.png` | 圓形障礙物 |

原檔的匯出連結名稱為 `thigh`、`chest`、`stomach`、`head`、`arm`、`leg`、`hand`、`ball`、`line` 與 `guy`。這證實角色不是逐幀動畫，而是由可旋轉的肢體 MovieClip 和一組粒子關節組成。

## 3. 原始角色資料模型

AS2 的 `skinDescription` 將一張肢體美術掛在兩個關節之間，繪圖時會計算兩點中點與 `atan2` 角度。角色一共由 **12 個粒子**構成：`head`、`neck`、`stomach`、`pants`、`arm1`、`hand1`、`arm2`、`hand2`、`knee1`、`foot1`、`knee2` 與 `foot2`。肢體部位則由 11 條可見骨段構成。

| 肢體美術 | 起點 | 終點 | 原作意圖 |
|---|---|---|---|
| `chest` | `stomach` | `neck` | 上軀幹 |
| `stomach` | `stomach` | `pants` | 腰腹 |
| `head` | `neck` | `head` | 頭頸 |
| `arm`、`hand` | `neck`／`arm1` | `arm1`／`hand1` | 左手臂 |
| `arm`、`hand` | `neck`／`arm2` | `arm2`／`hand2` | 右手臂 |
| `thigh`、`leg` | `pants`／`knee1` | `knee1`／`foot1` | 左腿 |
| `thigh`、`leg` | `pants`／`knee2` | `knee2`／`foot2` | 右腿 |

## 4. 原作物理與互動證據

反編譯主時間軸可辨認出 `PEngine2D`、`Particle2D`、`Constraint`、`AngledConstraint` 與 `Track`。`PEngine2D` 將重力設為 `0.0011`、摩擦係數設為 `0.9993`；每個畫面先進行 Verlet 積分，再執行兩輪「角度約束、距離約束、球形障礙物碰撞」。程式以位置與前一位置差代表速度，核心等價於下式：

```text
v = (x - x_previous) × friction
x_next = x + v + gravity × timeFactor²
```

`Track.create()` 建立 30 顆半徑為 30–129 的圓形障礙物。`Track.update()` 會回收跑到角色頭部上方的障礙物，並在角色下方重新生成，形成無限下墜感。碰撞僅將人物粒子投影至障礙物表面，不對障礙物累積反作用力，這也說明原作是物理玩具而非完整剛體模擬。

原始輸入邏輯會在滑鼠按下時選取游標距離平方小於 1500 的所有粒子。持有期間，每個粒子向 `_xmouse`／`_ymouse` 前進 30%，所以一次可同時抓到數個關節；鬆開後移除持有清單並保留慣性。右方向鍵將引擎速度提高到最多 3，左方向鍵將速度降低到 0。

## 5. 現代化轉寫的原則

| 面向 | 原始 Flash 實作 | 本專案的轉寫 |
|---|---|---|
| 更新時基 | 50 FPS 時間差、最多 40 ms | 120 Hz 固定子步進，累計時間上限 80 ms。 |
| 積分 | Verlet 位置積分 | 保留 Verlet，但使用以秒計的重力與阻尼。 |
| 關節限制 | AS2 的三粒子角度校正 | 保留初始相對角，將限制套用為姿態偏移範圍，避免不同座標系下發散。 |
| 迭代 | 每幀 2 次 | 每一子步進 3 次，提高不同螢幕刷新率下的穩定度。 |
| 輸入 | `onMouseDown`／`onMouseUp` | Pointer Events，支援滑鼠、觸控與觸控筆。[1] |
| 畫面 | MovieClip、Flash Stage | 高 DPI Canvas 與響應式容器。 |
| 安全保護 | 零距離碰撞未顯式處理 | 零距離時使用決定性方向，避免除零與 `NaN`。 |

這些改動是為了穩定性和現代平台相容性；角色骨架、拖曳的阻尼感、無限障礙物軌道和可變速度仍依循原作結構。

## 參考資料

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events "MDN Web Docs — Pointer events"

本文件中的 SWF 尺寸、標籤、ActionScript 類別、常數與資源清單，均直接由使用者提供的 `kr.swf` 靜態解析取得。

## 6. 逐式物理分析

本文件提供結構與靜態證據總覽；`PEngine2D` 的可變時間步進 Verlet 公式、`satisfyConstraint` 的質量加權投影、`satisfyAngConstraint` 的一般／反向角度模式、12 個粒子與 20 條約束的完整參數，已整理於 [AS2 物理深度解析](as2-physics-analysis.md)。相同資料的機器可讀版本為 [original-rig.json](original-rig.json)。
