-- =====================================================================
-- 鷹架配置估算器：詢價資料表 Supabase 建表 SQL
-- 用途：在 Supabase SQL Editor 執行一次。可與報修系統共用同一個專案。
--
-- 與報修資料表最大的差別：詢價含有海外客戶的個人資料（姓名、email、電話），
-- 所以匿名角色（anon，網頁使用的 Publishable key）只能「新增」，
-- 不能讀取、修改或刪除。業務查看詢價請用 Supabase 後台或登入後的帳號。
--
-- 安全設計同樣分三層：GRANT、RLS、CHECK。
-- =====================================================================


-- ---------------------------------------------------------------------
-- 資料表與 CHECK 限制
-- ---------------------------------------------------------------------
create table public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- 公司名稱：1 到 120 字。
  company_name text not null
    constraint rfq_company_name_length
    check (char_length(btrim(company_name)) between 1 and 120),

  -- 國家：1 到 80 字。
  country text not null
    constraint rfq_country_length
    check (char_length(btrim(country)) between 1 and 80),

  -- 聯絡人：1 到 80 字。
  contact_name text not null
    constraint rfq_contact_name_length
    check (char_length(btrim(contact_name)) between 1 and 80),

  -- Email：最長 254 字，且需符合基本格式。
  email text not null
    constraint rfq_email_format
    check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  -- 電話：選填，最長 40 字。
  phone text not null default ''
    constraint rfq_phone_length
    check (char_length(phone) <= 40),

  -- 工地所在城市或專案名稱：選填，最長 120 字。
  project_location text not null default ''
    constraint rfq_project_location_length
    check (char_length(project_location) <= 120),

  -- 預計需要日期：選填。
  needed_by date,

  -- 需求類型：quotation（報價）或 design（設計評估）。
  request_type text not null default 'quotation'
    constraint rfq_request_type_values
    check (request_type in ('quotation', 'design')),

  -- 系統類型：facade（外牆／通道架）或 shoring（重型支撐架）。
  system_type text not null
    constraint rfq_system_type_values
    check (system_type in ('facade', 'shoring')),

  -- 客戶輸入的尺寸條件與估算料表，限制大小以防濫用。
  inputs jsonb not null
    constraint rfq_inputs_size
    check (jsonb_typeof(inputs) = 'object' and pg_column_size(inputs) <= 4000),

  bom jsonb not null
    constraint rfq_bom_size
    check (jsonb_typeof(bom) = 'array' and pg_column_size(bom) <= 20000),

  -- 估算總重（kg）。
  total_weight_kg numeric(12, 1) not null
    constraint rfq_total_weight_range
    check (total_weight_kg >= 0 and total_weight_kg <= 10000000),

  -- 補充說明：選填，最長 2000 字。
  notes text not null default ''
    constraint rfq_notes_length
    check (char_length(notes) <= 2000),

  -- 必須同意隱私權政策才能送出。
  privacy_consent boolean not null
    constraint rfq_privacy_consent_true
    check (privacy_consent = true),

  -- 業務處理狀態：new、quoted、won、lost，預設 new。
  status text not null default 'new'
    constraint rfq_status_values
    check (status in ('new', 'quoted', 'won', 'lost'))
);

comment on table public.rfq_requests is '海外客戶透過鷹架配置估算器送出的詢價。含個人資料，anon 不可讀取。';

create index rfq_requests_created_at_idx
  on public.rfq_requests (created_at desc);


-- ---------------------------------------------------------------------
-- GRANT 權限
-- ---------------------------------------------------------------------
revoke all on table public.rfq_requests from anon, authenticated;

grant usage on schema public to anon;

-- anon 只能新增表單需要的欄位；不授予 select、update、delete。
-- 不開放 id、created_at、status：一律使用預設值。
grant insert (
  company_name, country, contact_name, email, phone, project_location,
  needed_by, request_type, system_type, inputs, bom, total_weight_kg,
  notes, privacy_consent
) on table public.rfq_requests to anon;


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.rfq_requests enable row level security;

-- 只有新增政策，沒有讀取政策：anon 送出後也讀不回任何詢價。
create policy "任何人可以送出新的詢價"
  on public.rfq_requests
  for insert
  to anon
  with check (status = 'new' and privacy_consent = true);
