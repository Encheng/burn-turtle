# 燒烏龜（Burn Turtle）— 設計規格

**日期**：2026-04-30
**狀態**：Spec
**作者**：Peter Lu (with Claude)

---

## 1. 產品定位

「燒烏龜」是一個純前端、行動裝置優先的網頁，把台灣婚紗 / 戶外活動圈流傳的「燒烏龜祈晴」儀式數位化。「燒烏龜」取「烏雲歸去」的諧音，傳統做法是在紙上畫太陽與一群朝太陽爬的笑臉烏龜，寫下祈求晴天的日期/地點，然後燒掉。

**主要使用情境**：登山團出發前祈求晴天，由團長或團員執行儀式後分享至 LINE 群組。

**核心定位**：迷因 / 分享工具，不追求 retention，追求三件事——畫面美、燒的瞬間爽、產出的分享圖讓人想轉發。

**反向定義（不做什麼）**：

- 不做後端（無帳號、無共享狀態、無多人協作儀式）
- 不做歷史紀錄（v1 一次性使用）
- 不做天氣預報整合 / 結果驗證
- 不做 PWA / 離線
- 不做 i18n（先繁體中文）

---

## 2. 視覺設計

整體採「道教符咒」風格，呼應「畫符 → 燒掉」的儀式本質：

- **底紙**：黃色紙張質感（`#f4dc7a` 漸層至 `#e8c850`），帶細微紋理
- **印墨**：暗紅色 `#9a1c1c`，所有筆畫、烏龜、勅令字皆以此色為主
- **裝飾**：
  - 勅令篆字置頂
  - 雙層紅線邊框
  - 中央太陽（紅色實心圓 + 黃色「日」字 + 紅色光芒）
  - 右下方紅印「晴」字（白底紅字方印）
  - 底部農曆日期 + 地點，襯線字、字距較寬
- **烏龜**：紅墨筆觸風格，圓潤胖身、頭朝太陽

「自己畫」與「華麗版」共用同一張底紙與裝飾框架，差別只在中段烏龜陣是手繪還是預設。

---

## 3. 使用流程

四階段單頁流程（無 router，狀態切換 view）：

```
[1 設定] → [2 儀式] → [3 燒] → [4 分享]
```

### 階段 1 — 設定（Setup）

- 輸入：日期（必填）、時間（可選）、地點（必填，自由文字）
- 模式選擇：
  - **自己畫** — 手繪烏龜，較有儀式感
  - **華麗版** — 系統自動排版，懶人模式
- 「進入儀式」按鈕：日期 + 地點皆有值才 enabled
- 時間欄位若有值，會顯示在符咒底部「農曆日期 · 時間 · 地點」；若無值則省略

### 符咒底部文字格式

- 無時間：`丙午年五月十五 · 玉山主峰`
- 有時間：`丙午年五月十五 09:00 · 玉山主峰`
- 農曆換算用 `lunar-javascript`，地點原文照寫

### 階段 2 — 儀式（Ritual）

兩個模式共用 `TalismanFrame` 底圖（黃紙 + 勅令 + 太陽 + 紅印 + 農曆日期 + 地點）。

- **自己畫**：底圖上方覆蓋透明 Canvas，工具列：毛筆、印章、橡皮擦、Undo。日期/地點在底圖文字位置不可被遮蓋。
- **華麗版**：底圖上方直接渲染預設烏龜陣（SVG 烏龜 12-20 隻，金字塔狀朝太陽，每次重新進入有微抖動）。

返回階段 1 修改設定不會丟失自己畫的內容（畫筆 operations 持久化於 localStorage）。

點「燒」按鈕進入階段 3。

### 階段 3 — 燒（Burn）

約 4 秒動畫，工具列消失，使用者無法操作。完成後自動進入階段 4。

途中按返回鍵會詢問「確定放棄祈晴嗎？」

### 階段 4 — 分享（Share）

- 顯示燒成灰燼的符咒（縮放後的全圖）
- 兩個按鈕：
  - **分享到 LINE / IG**：觸發 `navigator.share({ files: [pngBlob], title, text })`，不支援時 fallback 為下載
  - **再做一張**：清除 `ritual` store + localStorage，回到階段 1

---

## 4. 技術架構

- **框架**：SvelteKit + Vite + TypeScript
- **部署**：GitHub → Vercel（auto-deploy）
- **Adapter**：`@sveltejs/adapter-vercel`（也可改成 `adapter-static`，無 SSR 需求）
- **核心相依套件**：
  - `lunar-javascript` (npm) — 農曆換算（提供 `Solar.fromDate(...).getLunar()` API）
  - `html-to-image` (npm) — 將 DOM 轉 PNG 用於分享
- **無後端**：所有資料只存於瀏覽器 localStorage / in-memory
- **單頁 SPA**：唯一路由 `/`，階段切換用 Svelte `{#if}` 條件渲染

---

## 5. 檔案結構

```
src/
├── app.html
├── app.css
├── routes/
│   └── +page.svelte                  # 根入口，控制階段切換
├── lib/
│   ├── stores/
│   │   ├── ritual.ts                 # 儀式內容（日期/地點/模式/operations）
│   │   └── stage.ts                  # 目前階段
│   ├── components/
│   │   ├── stages/
│   │   │   ├── Setup.svelte
│   │   │   ├── Ritual.svelte         # 容器，依模式渲染 Draw 或 AutoGenerate
│   │   │   ├── Burn.svelte
│   │   │   └── Share.svelte
│   │   ├── talisman/
│   │   │   ├── TalismanFrame.svelte  # 共用 SVG 底圖
│   │   │   ├── DrawCanvas.svelte
│   │   │   ├── AutoTurtles.svelte
│   │   │   └── BurnEffect.svelte
│   │   └── ui/
│   │       ├── Button.svelte
│   │       └── ToolBar.svelte
│   └── utils/
│       ├── lunar.ts                  # 包 lunar-javascript
│       ├── share.ts                  # Web Share API + html-to-image
│       └── canvas.ts                 # 畫筆軌跡、stamping、undo stack 純函式
├── static/
│   ├── stamps/
│   │   ├── turtle-1.svg
│   │   ├── turtle-2.svg
│   │   └── turtle-3.svg
│   └── favicon.png
└── ...
```

**疊層概念（z-index 由低到高）**：

```
TalismanFrame   ← SVG，黃紙、勅令、太陽、邊框、紅印、底部日期/地點文字
DrawCanvas / AutoTurtles
BurnEffect      ← 燒紙時才顯示
ToolBar + 主要 Action Bar  ← 儀式階段才顯示
```

**TalismanFrame 內的文字渲染**：底部「農曆日期 + 時間（若有）+ 地點」是 SVG `<text>` 元素，內容綁定 `ritual` store reactively 更新——使用者在階段 1 改日期/地點，階段 2 即時反映。

---

## 6. 自己畫模式（DrawCanvas）

### 操作堆疊

所有筆畫以 operation 形式記錄，方便 undo 與序列化：

```ts
type Op =
  | { type: 'stroke'; points: { x: number; y: number }[]; size: number }
  | { type: 'stamp';  x: number; y: number; variant: 0 | 1 | 2 }
  | { type: 'erase';  points: { x: number; y: number }[]; size: number };
```

- 座標系：相對於 Canvas 左上角的像素值（與底圖等寬等高）
- `operations: Op[]` 即整個畫面狀態，可從零重繪

### 畫筆

- 顏色：固定紅色 `#9a1c1c`（不開放選擇，維持風格一致）
- 粗細：固定 3px（不開放調整）
- 用 Pointer Events（同時支援 touch / mouse / stylus，避免分別處理）
- 連續移動點用二次貝茲曲線平滑化

### 印章工具

- 點工具列「印章」按鈕 → 提示文字「點擊符咒任一處放置烏龜」
- 點符咒 → 在該點放上烏龜印章，從 3 個 variant 隨機選一個（避免印章太一致）
- 印章 SVG 設計：紅墨單色（`#9a1c1c`）烏龜剪影，3 個 variant 為輕微姿態差異（頭轉左/正面/頭轉右），尺寸統一約 60×40px
- 印章 SVG 載入後在記憶體中保留為 `<image>` element，避免每次重繪都重新讀檔

### 橡皮擦

- 用 `globalCompositeOperation = 'destination-out'` 在重繪時模擬擦除
- 印章與筆畫於邏輯上都被擦除（皆走相同重繪管線）

### Undo

- 工具列按鈕 + 鍵盤 `Cmd/Ctrl+Z`
- 從 `operations[]` pop 最後一個 → Canvas 清空 → 依序重繪剩餘 operations
- 預期 operations 數量 < 100，重繪成本可忽略

### 進入燒紙的驗證

- `operations` 中必須存在至少 1 個 `type === 'stroke'` 或 `type === 'stamp'` 才能燒（純 `erase` 不算）
- 不滿足時主要 Action Bar 的「燒」按鈕 disabled，tap 提示「至少畫一隻烏龜」

### 「燒」按鈕的位置

「燒」是儀式階段的主要 action，獨立於 ToolBar，固定在畫面底部中央。兩個模式（draw / auto）皆顯示，文案皆為「燒」。ToolBar（毛筆/印章/橡皮擦/undo）只在自己畫模式顯示。

---

## 7. 華麗版模式（AutoTurtles）

- 純 SVG 渲染，無使用者操作
- 16 隻紅墨烏龜（固定數量），分 3 排呈金字塔狀朝太陽
- 每次進入此模式時做輕微隨機化：
  - 每隻烏龜 (x, y) 加入 ±3px 抖動
  - 大小 ±10% 抖動
  - 1-2 隻外圍可能「探頭」（位置在邊緣處）
- 隨機種子：對 `ritual.date + ritual.location` 字串做簡單 djb2 hash 當 seed，確保同一儀式內 reload 結果一致；不同儀式則不同排列
- 不需要 ToolBar，直接顯示「燒」按鈕

---

## 8. 燒紙動畫

### 視覺分鏡（總長 ~4 秒）

| 時間 | 事件 |
|------|------|
| 0.0s | 點「燒」按鈕，工具列消失 |
| 0.3s | 紙張邊緣開始焦黑（隨機從 4 角擇一開始） |
| 1.0s | 火焰沿邊緣擴散（橘紅漸層 + flicker） |
| 2.5s | 中心區域開始燃燒，畫面短暫閃白 |
| 3.0s | 煙霧上升（淡灰色） |
| 3.5s | 整張紙轉為灰燼（褪色 + 噪點 overlay） |
| 4.0s | 動畫結束，自動進入階段 4 |

### 實作策略

- **焦黑邊緣**：SVG `<filter>` 內 `feTurbulence` + `feDisplacementMap` 產生不規則焦邊形狀，逐步擴大遮罩半徑
- **火焰**：CSS gradient + `filter: blur()` + `transform: translate` 做 flicker，疊在邊緣 overlay 層
- **煙霧**：3-4 個 absolutely-positioned `<div>`，帶 CSS `@keyframes` 上升動畫
- **灰燼質感**：`filter: grayscale(1) brightness(0.6)` + 一張 PNG 噪點 overlay

### 觸覺回饋

- 點火瞬間：`navigator.vibrate(50)`
- 燒到一半：`navigator.vibrate([30, 100, 30])`
- iOS 不支援，自動忽略

### 音效

不做（使用者可能在公開場合）。

### 中斷

- 燒紙過程中按返回鍵 → 確認對話框「確定放棄祈晴嗎？」
- 確認 → 回到階段 2，operations 保留
- 取消 → 動畫繼續

---

## 9. 分享圖生成

### 生成時機

階段 3 動畫播完後，背景立刻把「灰燼狀態的符咒」用 `html-to-image` 抓成 PNG。使用者進入階段 4 時 PNG 已備好。

### 圖片規格

- **尺寸**：1080 × 1440（3:4 直式，符合 LINE / IG Story）
- **內容**：白底 + 中央灰燼符咒
- **Watermark**：v1 不放 watermark（網域未定）。後續若部署到固定網域再加。

### 分享流程

```ts
async function share() {
  const blob = await getShareImage();
  const file = new File([blob], 'burn-turtle.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: '已祈晴',
      text: `${formatDate(date)} · ${location} 祈求晴天 ☀️`,
    });
  } else {
    downloadFile(blob, 'burn-turtle.png');
  }
}
```

`formatDate` 將 ISO 日期 (`2026-05-15`) 轉為民眾較易讀的格式 (`2026/5/15`)；不放農曆，分享文案保持簡潔。

### 預期支援

- **iOS Safari** ✓ 完整支援
- **Android Chrome** ✓ 完整支援
- **Android LINE 內建瀏覽器** ⚠️ 不一定，必須真機測試。退而求其次走下載 fallback
- **桌面瀏覽器** 多半無 files 支援 → 走下載 fallback

---

## 10. 狀態管理 & Persistence

### Stores

```ts
// stores/stage.ts
type Stage = 'setup' | 'ritual' | 'burn' | 'share';
export const stage = writable<Stage>('setup');

// stores/ritual.ts
type Ritual = {
  date: string;          // ISO 'YYYY-MM-DD'
  time?: string;         // 'HH:mm', 可選
  location: string;
  mode: 'draw' | 'auto';
  operations: Op[];      // 自己畫模式的 operation stack
  shareImage?: Blob;     // 階段 3 結束後生成
};
export const ritual = writable<Ritual>({...defaults});
```

### localStorage

- Key：`burn-turtle:ritual`
- 序列化：`JSON.stringify(ritual)`，`Blob` 不存（每次重新生成即可）
- 寫入：`ritual` store 變動 debounce 500ms 寫入
- 讀取：App 啟動時嘗試還原
- 清除：階段 4 確認分享/下載成功，或使用者點「再做一張」
- 失敗：靜默失敗（無痕模式 / 配額滿），App 仍可運作

預估儲存大小：< 50KB，遠低於 5MB 限制。

---

## 11. 錯誤處理 & 邊界情境

| 情境 | 處理 |
|---|---|
| Web Share API 不支援 files | 自動 fallback 下載 PNG |
| `navigator.share` 完全不存在 | 階段 4 顯示「下載圖片」按鈕替代「分享」 |
| Canvas 不支援（極舊裝置） | 顯示降級訊息「請用較新版瀏覽器」，封鎖儀式入口 |
| 自己畫但無 stroke / stamp | 「燒」按鈕 disabled，tap 提示「至少畫一隻烏龜」 |
| 日期 / 地點空白 | 階段 1 「進入儀式」按鈕 disabled |
| 日期填過去日期 | 仍允許，顯示提醒「該日期已過，仍要祈晴嗎？」 |
| `html-to-image` 生成失敗 | 重試一次，再失敗顯示錯誤訊息但不封鎖 |
| 分享動作被使用者取消（`AbortError`） | 不視為錯誤，靜默處理 |
| localStorage 寫入失敗 | 靜默失敗，App 仍可運作 |
| 燒紙動畫途中 tab 被切離 → visibility 變回時 | 動畫直接跳到結尾，避免使用者看到不一致狀態 |

---

## 12. 測試策略

### 單元測試（Vitest）

- `utils/lunar.ts`：固定日期 fixture 驗證農曆換算
- `utils/canvas.ts`：operation stack 新增/移除/重繪邏輯
- `utils/share.ts`：mock Web Share API，驗證 fallback 路徑

### 元件測試（@testing-library/svelte）

- `Setup.svelte`：日期 / 地點空白時按鈕 disabled
- `DrawCanvas.svelte`：
  - 初始狀態 `operations = []`，`canBurn` 為 false
  - 模擬 stamp 後 `canBurn` 為 true
  - undo 後 `operations` 縮短一個

不測 Canvas 視覺輸出（成本高、收益低）。

### 手動測試（必做）

- iOS Safari（iPhone 真機 + LINE 內建瀏覽器）
- Android Chrome（真機 + LINE 內建瀏覽器）
- 桌面 Chrome / Safari（驗證 fallback 下載）
- 燒紙動畫效能：低階 Android 機型不能掉幀

不導入 Playwright / 視覺回歸（v1 範圍太重），改用 README 截圖當參考。

---

## 13. 瀏覽器最低支援

- iOS Safari 15+ (2021)
- Android Chrome 90+ (2021)
- 桌面 Chrome / Safari / Firefox 最新 2 個版本

理由：Pointer Events、Web Share API、Canvas 2D 在這個範圍以上才穩定。

---

## 14. 不在 v1 範圍

明確排除以避免 scope creep：

- 後端 / 資料庫 / 帳號
- 多人協作儀式（同團員共畫一張）
- 進度計數器（「N 個團員已祈晴」）
- 歷史紀錄 / 過往儀式列表
- 天氣預報整合
- 結果驗證（「你那天真的晴了嗎？」）
- PWA / 離線使用
- 推播通知
- 多語系
- 自訂筆刷顏色 / 大小
- 多種底紙樣式
- 烏龜印章自訂

---

## 15. 後續可能性（不在 v1 內）

純粹記錄，不影響 v1 設計：

- 加上 Cloudflare KV 做計數器，實現「整團一起祈晴」社群感
- 連動天氣 API，顯示祈晴日當天的實際天氣
- 多語系（簡體 / 港式繁體 / 英文）
- 多風格底紙（萌系卡通版、水墨版、極簡版）
- 「儀式回顧」歷史頁面
