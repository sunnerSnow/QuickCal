# QuickCal

快速新增 Google 日曆事件的網頁工具（Next.js 16 + Auth.js + Google Calendar API）。

## 開發

```bash
npm install
cp .env.example .env.local   # 填入 Google OAuth 設定
npm run dev                  # http://localhost:3100
```

## Google Cloud 設定

1. 啟用 **Google Calendar API**
2. Google Auth Platform → 目標對象：外部；測試階段需把登入帳號加入 **Test users**
3. 建立「網頁應用程式」OAuth 用戶端：
   - 已授權的 JavaScript 來源：`http://localhost:3100`
   - 已授權的重新導向 URI：`http://localhost:3100/api/auth/callback/google`
4. 將 Client ID / Secret 填入 `.env.local`

申請的權限：`calendar.events`（新增事件）、`calendar.calendarlist.readonly`（列出可寫入的日曆）。

> 同意畫面維持「測試中」時，Google 發出的 refresh token 7 天後失效，屆時需重新登入。

## 結構

- `src/auth.ts` — Auth.js 設定，含 access token 自動更新
- `src/lib/google-calendar.ts` — Calendar API 呼叫
- `src/lib/event-form.ts` — 表單內容轉換成 Calendar 事件
- `src/app/actions.ts` — Server Actions（登入、登出、新增事件）
- `src/components/quick-add-form.tsx` — 快速新增表單
