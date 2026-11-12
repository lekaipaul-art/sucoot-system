const TABLE_NAME = "repair_requests";
const LIST_LIMIT = 20;

const form = document.getElementById("repair-form");
const submitButton = document.getElementById("submit-button");
const formMessage = document.getElementById("form-message");
const refreshButton = document.getElementById("refresh-button");
const listMessage = document.getElementById("list-message");
const requestList = document.getElementById("request-list");

const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const client = createSupabaseClient();

function createSupabaseClient() {
  const config = window.SUPABASE_CONFIG;
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    return null;
  }
  if (!config || !config.url || !config.publishableKey) {
    return null;
  }
  return window.supabase.createClient(config.url, config.publishableKey);
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
  element.hidden = false;
}

function hideMessage(element) {
  element.hidden = true;
  element.textContent = "";
}

function describeError(error) {
  if (!error) {
    return "發生未知錯誤，請稍後再試。";
  }
  const code = error.code || "";
  const text = String(error.message || "");
  if (code === "42501") {
    return "沒有權限執行這個動作，請聯絡管理員確認資料庫權限設定。";
  }
  if (code === "23514" || code === "23502") {
    return "資料格式不符合規定，請檢查每個欄位是否填寫正確。";
  }
  if (code === "42P01" || code === "PGRST205") {
    return "找不到報修資料表，請聯絡管理員確認資料庫設定。";
  }
  if (/fetch|network/i.test(text)) {
    return "無法連線到伺服器，請確認網路後再試一次。";
  }
  return "發生錯誤：" + text;
}

function formatTime(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return "時間不明";
  }
  return timeFormatter.format(date);
}

function textOrDash(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }
  return String(value);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function renderRequests(rows) {
  requestList.replaceChildren();
  if (rows.length === 0) {
    showMessage(listMessage, "目前還沒有報修紀錄。", "info");
    return;
  }
  hideMessage(listMessage);

  rows.forEach((row) => {
    const item = createElement("li", "request-item");

    const top = createElement("div", "request-top");
    top.append(
      createElement("span", "tag category", textOrDash(row.category)),
      createElement("span", "tag urgency urgency-" + textOrDash(row.urgency), "緊急程度：" + textOrDash(row.urgency)),
      createElement("span", "tag status", textOrDash(row.status))
    );

    const description = createElement("p", "request-description", textOrDash(row.description));

    const meta = createElement("p", "request-meta");
    meta.append(
      createElement("span", "", textOrDash(row.reporter_name)),
      createElement("span", "", textOrDash(row.location)),
      createElement("time", "", formatTime(row.created_at))
    );
    if (row.created_at) {
      meta.lastChild.dateTime = row.created_at;
    }

    item.append(top, description, meta);
    requestList.append(item);
  });
}

async function loadRequests() {
  if (!client) {
    showMessage(listMessage, "無法載入 Supabase 或缺少連線設定，請重新整理頁面。", "error");
    return;
  }
  refreshButton.disabled = true;
  showMessage(listMessage, "載入中……", "info");

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("id, created_at, reporter_name, location, category, description, urgency, status")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  refreshButton.disabled = false;
  if (error) {
    requestList.replaceChildren();
    showMessage(listMessage, "清單載入失敗。" + describeError(error), "error");
    return;
  }
  renderRequests(data || []);
}

function readForm() {
  const formData = new FormData(form);
  return {
    reporter_name: String(formData.get("reporter_name") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    category: String(formData.get("category") || ""),
    description: String(formData.get("description") || "").trim(),
    urgency: String(formData.get("urgency") || "中")
  };
}

function findMissingField(values) {
  const labels = {
    reporter_name: "報修人",
    location: "地點或部門",
    category: "類別",
    description: "問題說明"
  };
  const missing = Object.keys(labels).find((key) => values[key] === "");
  return missing ? { key: missing, label: labels[missing] } : null;
}

async function handleSubmit(event) {
  event.preventDefault();
  hideMessage(formMessage);

  if (!client) {
    showMessage(formMessage, "無法載入 Supabase 或缺少連線設定，請重新整理頁面。", "error");
    return;
  }

  const values = readForm();
  const missing = findMissingField(values);
  if (missing) {
    showMessage(formMessage, "請填寫「" + missing.label + "」。", "error");
    form.elements[missing.key].focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "送出中……";

  // 不送 status、id、created_at，由資料庫套用預設值。
  const { error } = await client.from(TABLE_NAME).insert(values);

  submitButton.disabled = false;
  submitButton.textContent = "送出報修";

  if (error) {
    showMessage(formMessage, "送出失敗。" + describeError(error), "error");
    return;
  }

  form.reset();
  showMessage(formMessage, "已送出報修，感謝你的回報！", "success");
  await loadRequests();
}

form.addEventListener("submit", handleSubmit);
refreshButton.addEventListener("click", loadRequests);
loadRequests();
