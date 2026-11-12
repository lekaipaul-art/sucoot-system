# 鷹架配置估算器（原型）

給海外客戶使用的英文網頁。客戶輸入專案尺寸後，網頁即時算出初步料表、總重和貨櫃數，再把料表連同聯絡資料送出詢價。

- **Access / Facade Scaffolding（Ø48.6）**：輸入牆長、高度、跨距、架寬、鋪板層數。
- **Shoring Towers（Ø60.2）**：輸入面積、高度、樓板厚度，依荷重自動選立柱間距。
- 詢價資料存進 Supabase `rfq_requests` 資料表；尚未設定 Supabase 時，改為開啟寄給 info.ws@sucoot.com 的 email 草稿。
- 可下載 CSV 料表。

## ⚠️ 上線前必須替換的假設值

`calc.js` 最上方的 `DATA` 物件集中放了所有數值：構件重量、單支立柱容許荷重（目前假設 45 kN）、斜撐配置規則、貨櫃載重等。**這些全部是假設值**，必須由工程部提供並審核正式數值。替換完成後，把 `isPlaceholder` 改成 `false`，頁面上方的黃色提示就會消失。

估算公式也要請工程部確認，例如斜撐每幾跨一組、壁連座間距、支撐架內部斜撐配置。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面結構 |
| `style.css` | 樣式，支援手機與深色模式 |
| `calc.js` | 純計算邏輯與假設數據，不碰畫面 |
| `app.js` | 畫面互動、示意圖、CSV 下載、送出詢價 |
| `supabase/rfq_schema.sql` | 詢價資料表建表 SQL |

## 建立資料表

在 Supabase SQL Editor 執行 `supabase/rfq_schema.sql`。可以和報修系統共用同一個專案，連線設定沿用上一層的 `config.js`。

詢價含有客戶個人資料，所以匿名角色（網頁上的 Publishable key）**只能新增，不能讀取、修改或刪除**。業務請在 Supabase 後台的 Table Editor 查看詢價，並把 `status` 改成 `quoted`、`won` 或 `lost`。

建表後請手動確認：

1. 網頁送出詢價成功，後台看得到新資料，`status` 為 `new`。
2. 用 Publishable key 讀取 `rfq_requests` 時拿不到任何資料。
3. 未勾選同意條款或 email 格式錯誤時無法送出。

## 本機預覽

在 repo 根目錄（不是 `estimator` 資料夾）啟動靜態伺服器，因為頁面會讀取上一層的 `config.js`：

```bash
python -m http.server 8000
```

然後開啟 `http://localhost:8000/estimator/`。
