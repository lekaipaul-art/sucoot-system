# 鷹架配置估算器（原型）

給海外客戶使用的英文網頁。客戶輸入專案尺寸後，網頁即時算出初步料表、總重和貨櫃數，再把料表連同聯絡資料送出詢價。

- **Access / Facade Scaffolding（Ø48.6）**：輸入牆長、高度、跨距、架寬、鋪板層數。
- **Shoring Towers（Ø60.2）**：輸入面積、高度、樓板厚度，依荷重自動選立柱間距。
- 詢價資料存進 Supabase `rfq_requests` 資料表；尚未設定 Supabase 時，改為開啟寄給 info.ws@sucoot.com 的 email 草稿。
- 可下載 CSV 料表。

## 規格來源與尚待確認的數值

構件規格依 sucoot.com 產品頁與官方型錄（Ring System Access Scaffolding 2026、Ring System Scaffold 2026）整理，全部集中在 `calc.js` 最上方的 `DATA` 物件。Bay length 就是 Horizontal（橫桿）長度。

| 系統 | 立柱 | 橫桿（Bay length） | 斜桿 | 步高 |
| --- | --- | --- | --- | --- |
| Access／Facade | Ø48.6 × t2.5，1.0／1.5／2.0／3.0 m | Ø42.7 × t2.3，0.9／1.2／1.5／1.8／2.4 m | 1.2／1.5／1.8 × 2.0 m | 2.0 m |
| Shoring | Ø60.2 × t3.2，1.0／1.5／2.0／3.0 m | Ø48.6 × t2.3，0.6／0.9／1.2／1.5／1.8／2.4 m | 0.6～2.4 × 1.5 m | 1.5 m |

每個構件都標示重量來源：

- `catalog`：型錄上的單位重量，例如 Access 立柱 2.0 m 為 8.11 kg、橫桿 1.8 m 為 4.78 kg、調整座為 3.55 kg。
- `estimate`：型錄沒有列出重量，依同系列已知重量或鋼管尺寸推估。網頁上會標示 “est.”。Shoring 系統的重量全部是推估值。
- `custom: true`：這個 Bay length 在型錄沒有標準尺寸，需訂製。例如 Access 系統 0.9、2.4 m 的斜桿和踏板。網頁上會標示 “Custom size”。

**仍需工程部提供或確認：**

1. 標示 `estimate` 的單位重量。
2. Shoring 單支立柱容許荷重：目前假設 45 kN，官網只寫四柱塔測試可承載 72 噸。
3. 斜桿配置（每 3 跨一組）、壁連座間距、支撐架內部斜桿配置。
4. 貨櫃載重：20 呎 18 t、40 呎 24 t 為假設值。

全部確認後，把 `isPlaceholder` 改成 `false`，頁面上方的黃色提示就會消失。

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

## 安裝成 App（PWA）

估算器是可安裝的網頁 App（PWA），不需要上架 App Store 或 Google Play：

- **Android（Chrome）／電腦版 Chrome、Edge**：開啟網頁後按頁首的「Install app」，或從瀏覽器選單選「安裝應用程式」。
- **iPhone／iPad（Safari）**：點「分享」→「加入主畫面」。頁首會顯示這段英文說明。

安裝後有獨立圖示、全螢幕開啟。沒有網路時仍可開啟和計算；送出詢價會改為開啟 email 草稿。

相關檔案：`manifest.webmanifest`（App 名稱、圖示、顏色）、`sw.js`（離線快取）、`icons/`（`icon.svg` 為原始檔）。

⚠️ 每次修改網站檔案後，請把 `sw.js` 裡的 `CACHE_VERSION` 加一（例如 `v1` → `v2`），已安裝的使用者才會拿到新版。
