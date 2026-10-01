<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# QuickCal 規則與踩過的坑

## 規則
- commit 前先把 commit 訊息（繁體中文）給使用者確認，確認後才 commit / push。
- 做完一件事，在 `docs/worklog/<年-月>.md` 最下面記一筆：commit、改了什麼、設計決定、待辦。
- 小改動直接改，跑 `npm run lint` + `npm run build` 就好，不需要開 agent 或寫需求單。

## 樣式（Tailwind v4）
### ⚠️ 同一個元素不要放兩個同類 utility
`inputClass` 加 `text-lg` 之類的覆寫時，`text-base` 與 `text-lg` 誰贏取決於 CSS 產生順序，不是 class 順序。
要變化的東西從 `inputBaseClass`（`src/components/ui.tsx`，不含尺寸與邊框顏色）組起來。

### 🚨 zh-TW 的 `<input type="time">` 比你想的寬
中文系統會多出「上午／下午」與時鐘按鈕，窄欄會被截成「下午 05:0」。
桌面版日期／時間是 `5fr / 6fr`，時間欄刻意比較寬，不要改回等寬。

### ⚠️ `flex-1` 的 grid 要加 `content-start`
`main` 是 `flex-1` 的 grid 時，多餘高度會平均分給每一列，手機上會出現一大段空白。

### 黃色按鈕用深咖啡字
`#DEAE0B` 上的白字對比不足；文字用 `text-brown`，英文標題用 `text-gold-ink`（`#A87C00`）而不是 `gold`。

## 字型
- Huninn 只有 latin subset 選項，CJK 字靠 Google 的 unicode-range 按需載入，所以 `preload: false`。
- next/font 沒有 Huninn 的字體度量資料，`adjustFontFallback: false` 加上 `fallback`，否則 build 會出 warning。

## Google OAuth
- 同意畫面在 **Testing**：只有 Test users 能登入，refresh token 7 天失效（會顯示「登入已過期」，不是 bug）。
- 回呼網址只能加正式網域，Vercel 每個 branch 的預覽網址都不同，預覽網址上無法登入，不是 bug。
- 使用者可以在同意畫面取消勾選個別權限 → `session.error === "MissingScope"`，顯示重新登入提示。

## 截圖
- `docs/screenshots/` 的截圖會進 GitHub：信箱、日曆名稱等個資用實色色塊蓋掉，模糊不夠（放大還認得出來）。
- 快速新增畫面要登入才看得到，由使用者截圖。
