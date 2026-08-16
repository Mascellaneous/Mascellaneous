# 原始 `kr.swf` 的 ActionScript 2 物理邏輯與公式

本文件依據使用者提供的 SWF 靜態解壓、標籤解析、`ExportAssets` 資源表，以及 AS2 反編譯結果撰寫。分析不會執行原始 Flash 程式，而是把時間軸上的 `DoAction`、角色 Sprite 的 `onClipEvent(load)` 與矩陣位置資料還原成可驗證的資料模型。

> **結論先行。** 原作是一個以位置為狀態、以前一位置隱含速度的 **Verlet 布偶模擬**。人物含 12 個粒子與 20 條 `AngledConstraint`；每幀先做積分與拖曳，再依序做兩輪「角度／骨段解算 → 圓形障礙物碰撞」。一般 `Constraint`、`Muscle` 與 `forces()` 都存在於程式庫內，但這個人物實際只建立 `AngledConstraint`，且 `forces()` 為空實作。

## 1. 反編譯證據範圍

| 證據位置 | 可確定內容 |
|---|---|
| 主時間軸，第 1 幀 | `Particle2D`、`Constraint`、`AngledConstraint`、`PEngine2D`、`Track`、`Extractor`、`Skin` 的定義。 |
| 主時間軸，第 2 幀 | 人物轉為粒子、建立 30 個障礙物、每幀更新、滑鼠／鍵盤事件。 |
| `DefineSprite_32_guy` | 12 個粒子 instance 的名稱與位置；20 個約束 instance 的幾何與角度範圍。 |
| SWF 矩陣與 AS2 `Extractor` | 約束端點由 `findParticle` 以「最近粒子」匹配，而 `restLength` 取匹配後兩粒子的初始距離。 |

原始舞台為 550 × 400 px，時間軸設定為 50 FPS，並在開場將 `_root._xscale` 與 `_root._yscale` 設為 80。這些數字是畫面轉換，而不是物理解算的縮放常數。

## 2. 運行順序與狀態

原作每個 `onEnterFrame` 依下列順序執行：

```text
PEng.update()
  1. timeFactor = min(本幀時間差毫秒, 40) × speed
  2. verlet()                 // 12 個粒子的自由積分
  3. hold()                   // 若正在拖曳，以滑鼠位置拉近選中粒子
  4. 重複兩次：
       constrain()            // 20 條 AngledConstraint
       collision()            // 粒子對 30 顆圓形障礙物
track.update()                // 回收上方障礙物，於人物下方重生
skin.draw()                   // 依關節中點與夾角放置原始肢體美術
更新 root 相機（僅未拖曳時）
處理左右方向鍵速度
```

`forces()` 雖然已定義，但函式本體的迴圈沒有施力程式；`useMuscle()` 與 `hackContraint()` 也沒有在主遊戲迴圈中呼叫。因此，主角的可見運動來源只有重力、上一幀的位移、拖曳位置修正、關節投影與障礙物投影。

## 3. 粒子資料與 Verlet 積分

每個 `Particle2D` 具有目前座標 `(x, y)`、前一座標 `(oldx, oldy)`、半徑 `rad` 與質量 `mass`。初始化時 `oldx = x`、`oldy = y`，故起始速度為零。引擎常數如下。

| 參數 | 原始值 | 說明 |
|---|---:|---|
| `gravity` | `0.0011` | 以毫秒平方為尺度的向下加速度。 |
| `fric` | `0.9993` | 每毫秒阻尼基底。 |
| `MAXPARTICLES` | `256` | 粒子上限；人物遠低於此值。 |
| `speed` | `1`（範圍 0–3） | 與時間係數相乘的全域模擬倍率。 |
| 時間差上限 | `40 ms` | 避免分頁或掉幀造成極大單幀位移。 |
| 約束迭代數 | `2` | 每幀依固定順序解算兩輪。 |

令真實幀間時間為 `Δt_ms`，全域速度為 `s`，則原始程式計算：

```text
T = min(Δt_ms, 40) × s
D = 0.9993^T
v_x = x - oldx
v_y = y - oldy
oldx ← x
oldy ← y
x ← x + v_x × D
y ← y + v_y × D + 0.0011 × T²
```

這正是帶阻尼與常數加速度的 Verlet 位置積分。典型 50 FPS 下 `Δt_ms ≈ 20` 且 `s = 1`，每次積分的重力項是 **0.44 px**，阻尼約為 **0.986092710140**。如果幀間隔大於 40 ms，時間項會被截斷，但 `oldTime` 仍會更新，所以不會累積未模擬時間。

## 4. 一般距離約束 `satisfyConstraint`

雖然角色沒有建立一般 `Constraint`，程式庫仍提供此函式。給定兩粒子 $p_1$、$p_2$、目標長度 $L$、質量 $m_1$、$m_2$，原碼先計算：

```text
Δ = p1 - p2
r = |Δ|
M = m1 + m2
w1 = m1 / M
w2 = m2 / M
k = (r - L) / (2r)
```

接著採用如下位置修正：

```text
p1 ← p1 - Δ × k × w2
p2 ← p2 + Δ × k × w1
```

原碼中 `rl2 = r + (L - r) × 1`，因此 `rl2` 恰等於 `L`；換言之，這條約束的剛度是 100%，不做柔軟插值。兩端修正量依對方的質量比例分配，較重的一端位移較小。

## 5. 角色實際使用的 `AngledConstraint`

### 5.1 結構

每條 `AngledConstraint` 保存 `(p1, p2, p3, L, minang, maxang, inversed)`。注意它同時承擔兩項工作：`p1` 與 `p2` 維持距離 `L`，而 `p3` 只用來量測夾角範圍。原作在 `constrain()` 中先迭代所有角度約束，沒有額外把它們送進 `satisfyConstraint()`。

定義：

```text
α = atan2(p2.y - p1.y, p2.x - p1.x)
β = atan2(p3.y - p2.y, p3.x - p2.x)
a = wrapToPi(α - β)
```

其中 `wrapToPi` 以加減 $2π$ 把角度帶回 $[-π, π]$。`a` 是以 `p1 → p2` 和 `p2 → p3` 為方向的相對角。

### 5.2 一般範圍模式

非反向模式先定義：

```text
half = (maxang - minang) / 2
mid  = (maxang + minang) / 2
d    = wrapToPi(mid - a)
```

然後得到角度修正量 $c$：

```text
if d > half:       c = d - half
else if d < -half: c = d + half
else:              c = 0
```

亦即 $a$ 落在允許弧段內就不校正；超界時，`c` 是回到最近邊界所需的角位移。

### 5.3 `inversed = true` 的反向模式

反向模式把 `[minang, maxang]` 視為**禁止帶**而非允許帶。若角度已落進禁止帶，就把它推向較近端點：

```text
mid = (maxang + minang) / 2
if minang < a < mid:  c = minang - a
if mid < a < maxang:  c = maxang - a
```

因此 `inversed` 用於肩部／軀幹的單側限制：關節可以在大部分外側空間運動，但不能折進角色身體的一段角域。

### 5.4 距離與角度的合成投影

程式只校正 `p1` 和 `p2`，但以 `p3` 決定它們應轉向何處。令 $φ = α + 0.3c$，其中 `0.3` 是每次約束迭代只套用 30% 角度校正的鬆弛係數。再令：

```text
w1 = m1 / (m1 + m2)
w2 = m2 / (m1 + m2)
q  = p1 + (p2 - p1) × w2
```

原作的新位置為：

```text
p1 ← q + L × w2 × (cos(φ + π), sin(φ + π))
p2 ← q + L × w1 × (cos(φ),     sin(φ))
```

這個投影同時保留質量加權中心 $q$、將兩點距離設回 $L$，並往角度可行域移動。`p3` 在該條約束中不直接移動，然而它會在其他約束中成為 `p1` 或 `p2`，所以整個骨架仍會耦合。

## 6. 原始角色粒子與質量

下表是從 `DefineSprite_32_guy` 的 instance 名稱、位置與 `onClipEvent(load)` 直接抽取的初始資料。座標是角色局部的 Flash 場景單位。

| 粒子 | 初始 x | 初始 y | 質量 |
|---|---:|---:|---:|
| `head` | 60.25 | -129.90 | 1.0 |
| `neck` | 59.40 | -90.75 | 0.5 |
| `stomach` | 60.90 | -42.00 | 1.0 |
| `pants` | 58.40 | -2.05 | 1.1 |
| `arm1` | 16.00 | -94.50 | 0.5 |
| `hand1` | -46.30 | -93.75 | 0.5 |
| `arm2` | 113.45 | -94.50 | 0.5 |
| `hand2` | 176.40 | -96.50 | 0.5 |
| `knee1` | 35.40 | 54.75 | 0.9 |
| `foot1` | 21.40 | 109.95 | 0.8 |
| `knee2` | 85.40 | 53.50 | 0.9 |
| `foot2` | 108.45 | 106.95 | 0.8 |

## 7. 二十條原始角度約束

`L₀` 是 `Extractor.getDist()` 對兩個最近粒子的初始距離，而不是約束圖示本身的 `_xscale`。同一對粒子出現多次是刻意的：不同 `p3` 參考點與角度限制會一起塑造軀幹、肩部與髖部的活動範圍。

| 深度 | p1 → p2 | p3 | L₀ | 角度範圍（rad） | 反向 |
|---:|---|---|---:|---|---|
| 25 | stomach → neck | head | 48.77 | [-0.50, 1.00] | 否 |
| 27 | head → neck | stomach | 39.16 | [-1.00, 0.50] | 否 |
| 29 | hand1 → arm1 | neck | 62.30 | [-0.10, 2.60] | 否 |
| 31 | neck → arm1 | hand1 | 43.56 | [-2.60, 0.10] | 否 |
| 33 | neck → arm2 | hand2 | 54.18 | [-2.60, 0.10] | 否 |
| 35 | hand2 → arm2 | neck | 62.98 | [-0.10, 2.60] | 否 |
| 37 | neck → stomach | pants | 48.77 | [-0.40, 0.40] | 否 |
| 39 | pants → stomach | neck | 40.03 | [-0.40, 0.40] | 否 |
| 41 | pants → knee1 | foot1 | 61.28 | [-0.10, 2.30] | 否 |
| 43 | foot1 → knee1 | pants | 56.95 | [-2.30, 0.10] | 否 |
| 45 | pants → knee2 | foot2 | 61.76 | [-0.10, 2.30] | 否 |
| 47 | foot2 → knee2 | pants | 58.21 | [-2.30, 0.10] | 否 |
| 49 | knee2 → pants | stomach | 61.76 | [-0.30, 2.10] | 否 |
| 51 | stomach → pants | knee2 | 40.03 | [-2.10, 0.30] | 否 |
| 53 | knee1 → pants | stomach | 61.28 | [-0.30, 2.10] | 否 |
| 55 | stomach → pants | knee1 | 40.03 | [-2.10, 0.30] | 否 |
| 57 | arm2 → neck | stomach | 54.18 | [0.00, 1.57] | 是 |
| 59 | arm1 → neck | stomach | 43.56 | [0.00, 1.57] | 是 |
| 61 | stomach → neck | arm2 | 48.77 | [-1.57, 0.00] | 是 |
| 63 | stomach → neck | arm1 | 48.77 | [-1.57, 0.00] | 是 |

結構化抽取結果亦另存為 [`original-rig.json`](original-rig.json)，可作為重現或比較其他物理實作的機器可讀基準。

## 8. 拖曳、碰撞、障礙物與相機

### 拖曳

滑鼠按下時，對每個人物粒子計算：

```text
dx = mouseX - p.x
dy = mouseY - p.y
若 dx² + dy² < 1500，將 p 加入 onHold
```

選取半徑是 $\sqrt{1500} ≈ 38.73$ 個角色座標單位。每個更新步驟對選中粒子套用：

```text
p.x ← p.x + 0.3 × (mouseX - p.x)
p.y ← p.y + 0.3 × (mouseY - p.y)
```

由於不同步重設 `oldx`／`oldy`，放開後「被拉動的位移」會轉換為 Verlet 慣性，這就是甩動效果的來源。

### 圓形碰撞

每個障礙物包含中心 `(bx, by)` 與半徑 `br`；人物粒子半徑為 `pr`。令 $d = \|p-b\|$。若 $d < br + pr$，原作直接投影：

```text
n = (p - b) / d
p = b + n × (br + pr)
```

沒有反彈係數、切向摩擦或障礙物反作用力；也沒有把 `oldx`／`oldy` 一起投影。因此碰撞後的一幀會把位置修正轉換為下一幀的隱含速度，呈現彈跳或擦滑感。

### 無限障礙物軌道

`Track.create()` 建立 30 顆 `ball`，半徑是 `random(100) + 30`，亦即 30–129。每顆只要高於頭部粒子 500 單位，就重設到頭部下方：

```text
ball.y = head.y + 500 + random(700)
ball.x = head.x + random(1000) - random(1000)
ball.radius = random(100) + 30
```

水平項是兩個均勻亂數之差，因而是以零為中心的三角分布，而非單一均勻分布；這使圓形障礙物較常落在角色下方正中央。

### 相機與速度控制

未拖曳時，`_root` 的位置用二階平滑追蹤第一個粒子。以 `S=0.8`（根節點縮放）表示，x 軸形式為：

```text
xv ← 0.8 × [xv + 0.05 × (Stage.width/2 - head.x × S - root.x)]
root.x ← root.x + xv
```

y 軸相同，但目標另外上移 100 px。右方向鍵每幀令 `speed += 0.01`、最多 3；左方向鍵每幀令 `speed -= 0.01`，並以布林乘法避免低於 0。

## 9. 視覺皮膚與物理解耦

`Skin.draw()` 對每個可見肢體只用兩粒子座標：

```text
mid = ((p1.x + p2.x)/2, (p1.y + p2.y)/2)
rotation_degrees = atan2(p1.y - p2.y, p1.x - p2.x) × 180/π
```

接著將對應 MovieClip 放到 `mid` 並套用該旋轉。這種「skin 不參與物理、只讀取骨架」的分層，正是本重製以 Canvas 畫圖時可以保留原始美術、又把物理核心獨立為 `physics.js` 的原因。

## 10. 與現代重製的對照

現代版保留 Verlet、質量加權投影、拖曳慣性、圓形投影碰撞與無限軌道，但刻意採用固定子步進並以初始姿態的相對角作為穩定參考。原作的 AS2 演算法可在不同 Flash runtime／幀率下形成略有差異的過度約束姿勢；現代版的目標是重現其手感與結構，同時避免重新整理率、視窗休眠或零距離碰撞導致不穩定。

| 面向 | 原始 SWF | 現代重製 |
|---|---|---|
| 時間 | `min(Δms, 40) × speed` 的可變步進 | 120 Hz 固定子步進，累計時間設上限。 |
| 關節角度 | 絕對世界角與 p3 參考點 | 初始相對姿態的偏移範圍。 |
| 迭代 | 每幀 2 輪 | 每子步進 3 輪。 |
| 碰撞零距離 | 會除以 `distance` | 使用決定性法線避免 `NaN`。 |
| 載入 | Flash MovieClip／Library | 還原 PNG 與 Canvas。 |

## 參考資料

[1]: reverse-engineering-notes.md "`kr.swf` 靜態逆向工程紀錄"

本文件所有 AS2 常數、控制流程、粒子命名、質量、約束數量、初始座標與角度範圍，都來自使用者提供的 `kr.swf` 之靜態解析結果。
