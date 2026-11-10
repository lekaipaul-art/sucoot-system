# Repository Guidelines

## 專案結構

- `備援/index.html`、`style.css` 和 `app.js` 分別負責報修表單、樣式與 Supabase 資料操作。清單顯示最近 20 筆報修。
- `備援/supabase/schema.sql` 用於新資料庫。既有資料庫依 `備援/README.md` 套用 `002_add_assignee_photo.sql`，並比對遷移前後的原有資料。
- 根目錄的需求筆記與範例試算表供對照欄位。`備援/壞版/app.js` 刻意保留資料表名稱錯字，供除錯練習使用。

## 本機開發

網頁可直接由靜態伺服器提供，無需建置。在 PowerShell 進入 `備援`，執行 `Copy-Item config.example.js config.js`，再填入測試用 Supabase 專案網址與 Publishable key。若已安裝 Python，可執行 `python -m http.server 8000`，然後在瀏覽器開啟 `http://localhost:8000`。

## 程式風格

沿用 JavaScript 的兩個空格縮排、雙引號與分號。函式與變數使用 `camelCase`，例如 `loadRequests`；HTML ID 使用小寫與連字號，例如 `repair-form`；資料庫欄位使用 `snake_case`，例如 `photo_url`。介面文字採台灣繁體中文。目前未見格式化或靜態檢查工具設定。

## 測試與資料安全

目前未見自動化測試、測試框架或覆蓋率門檻。使用測試專案和虛構資料，手動確認必填欄位、留空照片網址仍可送出、送出後清單會更新，以及舊紀錄缺少新增欄位時仍可顯示。確認匿名角色可讀取與新增報修，且修改與刪除會被拒絕。保留資料列安全性（RLS），並將 `config.js` 留在本機。

## 提交與合併請求

目前目錄沒有可查閱的 Git 紀錄，既有提交慣例待確認。建議每個提交聚焦一項變更。合併請求請說明變更原因、手動驗證結果與適用的 SQL 遷移步驟。有相關議題就附連結，介面變更請附截圖。
