-- =====================================================================
-- 報修登記系統：Supabase 建表 SQL
-- 用途：建立新資料庫時，在 Supabase SQL Editor 執行一次。
-- 安全設計分三層：
--   1. GRANT：決定 anon 角色能碰哪些資料表與欄位。
--   2. RLS：決定 anon 能讀寫哪些資料列。
--   3. CHECK：不論誰寫入，欄位值與長度都必須合法。
-- 前端使用 Publishable key（anon 角色），這把金鑰會公開在網頁上，
-- 所以以下限制是唯一的防線，不可省略。
-- =====================================================================


-- ---------------------------------------------------------------------
-- 資料表與 CHECK 限制（第 3 層）
-- 所有欄位都不可為空；文字欄位先去掉前後空白再計算長度，
-- 避免只填空白字元就送出。
-- ---------------------------------------------------------------------
create table public.repair_requests (
  -- 主鍵：由資料庫自動產生 uuid，前端不能指定。
  id uuid primary key default gen_random_uuid(),

  -- 建立時間：由資料庫自動記錄，前端不能指定。
  created_at timestamptz not null default now(),

  -- 報修人姓名：1 到 50 字。
  reporter_name text not null
    constraint repair_requests_reporter_name_length
    check (char_length(btrim(reporter_name)) between 1 and 50),

  -- 地點或部門：1 到 100 字。
  location text not null
    constraint repair_requests_location_length
    check (char_length(btrim(location)) between 1 and 100),

  -- 類別：只能是 設備、網路、環境、其他。
  category text not null
    constraint repair_requests_category_values
    check (category in ('設備', '網路', '環境', '其他')),

  -- 問題說明：1 到 1000 字。
  description text not null
    constraint repair_requests_description_length
    check (char_length(btrim(description)) between 1 and 1000),

  -- 緊急程度：只能是 低、中、高，預設 中。
  urgency text not null default '中'
    constraint repair_requests_urgency_values
    check (urgency in ('低', '中', '高')),

  -- 處理狀態：只能是 待處理、處理中、已完成，預設 待處理。
  status text not null default '待處理'
    constraint repair_requests_status_values
    check (status in ('待處理', '處理中', '已完成'))
);

comment on table public.repair_requests is '報修登記：同事送出的報修資料。';

-- 清單依建立時間由新到舊顯示最近 20 筆，加索引加快排序。
create index repair_requests_created_at_idx
  on public.repair_requests (created_at desc);


-- ---------------------------------------------------------------------
-- GRANT 權限（第 1 層）
-- 這個專案不會自動開放新資料表給 API 角色，因此要明確授權。
-- 先收回 anon 與 authenticated 的所有權限，確保從零開始。
-- ---------------------------------------------------------------------
revoke all on table public.repair_requests from anon, authenticated;

-- anon 需要能使用 public schema，才能透過 API 存取其中的資料表。
grant usage on schema public to anon;

-- anon 可以讀取清單。
grant select on table public.repair_requests to anon;

-- anon 只能新增表單需要的欄位。
-- 不開放 id、created_at、status：這三欄一律使用預設值，
-- 所以新報修的狀態一定從「待處理」開始。
grant insert (reporter_name, location, category, description, urgency)
  on table public.repair_requests to anon;

-- 不授予 update 與 delete：anon 無法修改或刪除任何報修。


-- ---------------------------------------------------------------------
-- 資料列安全性 RLS（第 2 層）
-- 啟用後，沒有政策允許的操作一律拒絕。
-- 本檔只建立讀取與新增政策，沒有修改與刪除政策，
-- 即使日後誤授 update 或 delete 權限，RLS 仍會擋下。
-- ---------------------------------------------------------------------
alter table public.repair_requests enable row level security;

-- 任何人（anon）都可以讀取全部報修清單。
create policy "任何人可以讀取報修清單"
  on public.repair_requests
  for select
  to anon
  using (true);

-- 任何人（anon）都可以新增報修，但狀態只能是「待處理」。
-- 這是 GRANT 之外的第二道保險：就算日後開放 status 欄位，
-- 也無法直接新增「處理中」或「已完成」的資料。
create policy "任何人可以新增待處理的報修"
  on public.repair_requests
  for insert
  to anon
  with check (status = '待處理');
