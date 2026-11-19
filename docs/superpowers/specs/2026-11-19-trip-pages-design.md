# 登山行程頁 · Trip pages — design

Date: 2026-11-19

## Intent

每次登山計劃都有一組可直接分享的靜態頁：行程頁（docx 內容）與氣象預報互動圖（HTML）。網址固定格式。
另有一個只給自己用的列表頁，站內 UI 完全不放入口，只能直接輸入網址。

## Goals

- 固定網址規格：`/trips/<YYYY-MM-DD>-<slug>/itinerary`、`/trips/<YYYY-MM-DD>-<slug>/weather`、`/trip-list`
- 新增行程只需在 `static/trips/` 加一個資料夾，不改程式
- 本機 `vite dev` 與 Vercel 行為一致，無副檔名

## Non-goals / anti-goals

- 不做結構化行程資料、不做搜尋、不做密碼保護
- 不改動現有 `/` 燒烏龜流程
- 不在 robots.txt 列出路徑（反而洩漏）

## Constraints

- SvelteKit 2 + adapter-vercel，無後端
- HTML 內容由使用者提供（天氣頁）或由 docx 轉出（行程頁）

## Approaches considered

1. 結構化 JSON，由 Claude 每次轉檔並以 Svelte 元件渲染。樣式最統一，但每次新行程都要改程式。
2. 行程用 Markdown 手寫、天氣用 JSON。使用者可自行修改，排版彈性低。
3. **HTML 直接放 static，由路由提供無副檔名網址。**（使用者選擇）最省事，每份頁面各自獨立。

## Decisions

- 檔案放 `static/trips/<slug>/`：`itinerary.html`、`weather.html`、`profile.png`（剖面圖）、`trip.json`（title、subtitle、dates.start、dates.end、pages[]）
- 路由 `src/routes/trips/[slug]/[page]/+server.ts`：建置時 `import.meta.glob('/static/trips/*/*.html', { query: '?raw', import: 'default', eager: true })`，依 slug/page 回傳 HTML，`Content-Type: text/html`（必須完全等於此值、不可帶 charset：SvelteKit 預渲染時只有 `text/html` 會被當成頁面寫成 `.html`，adapter-vercel 才會把 `x.html` 對應到 `/x`；charset 由檔內 `<meta charset>` 提供）、`X-Robots-Tag: noindex`，找不到回 404。`prerender = true`，entries 由同一份 glob 產生。
- 列表頁 `src/routes/trip-list/+page.svelte`：glob 掃 `trip.json`，日期新在前；沿用站內 navy 樣式；`<meta name="robots" content="noindex">`
- 兩份 HTML 都加 `<meta name="robots" content="noindex">`；首頁不放任何連結
- 行程 HTML 由 docx 轉出，排版沿用天氣頁的米白／深色 token
- 本次行程 slug：`2026-11-20-dabajian`

## Left to the builder

- 行程 HTML 的章節排版細節（00–06 節、表格、裝備打勾清單）
- 列表卡片的確切欄位呈現
