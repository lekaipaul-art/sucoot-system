// Supabase 連線設定。
// 這裡只能放 Publishable key（公開金鑰），它本來就會出現在網頁上；
// 資料安全靠資料庫的 GRANT、RLS 與 CHECK 限制。
// 絕對不要放 secret key 或 service_role key。
window.SUPABASE_CONFIG = {
  url: "https://mgnaljusrefxvpjlonkp.supabase.co",
  publishableKey: "sb_publishable_xMDYDRRqNM-kSx-mRjYliQ_PTU8O72p"
};
