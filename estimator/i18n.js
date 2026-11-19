// 介面語言：英文（en）與繁體中文（zh-Hant）。
// 構件名稱沿用實固官網中文版用語：主架、橫桿、斜桿、調整座、腳踏板、腳趾板。
// HTML 用 data-i18n（文字）、data-i18n-html（含 <strong> 的文字）、
// data-i18n-placeholder、data-i18n-aria-label 標示要翻譯的位置。
(function (root) {
  "use strict";

  const STORAGE_KEY = "sucoot-estimator-lang";
  const LANGS = ["en", "zh-Hant"];

  const MESSAGES = {
    en: {
      "meta.title": "Scaffolding Estimator | SUCOOT",
      "meta.description": "Estimate a preliminary bill of materials for SUCOOT Ring Lock scaffolding and shoring towers, then send a quotation request.",
      "lang.toggle": "中文",
      "lang.toggleLabel": "切換為繁體中文",
      "brand.sub": "Ring Lock Systems",
      "header.title": "Scaffolding Estimator",
      "header.lead": "Enter your project dimensions to get a preliminary bill of materials, total weight and container estimate — then send it to our engineers for a quotation.",
      "install.button": "Install app",
      "install.ios": "Install on iPhone: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.",
      "banner.offline": "You are offline. Estimates still work; quotation requests will open an email draft instead.",
      "banner.placeholder": "Prototype: component sizes follow the SUCOOT 2026 catalogs. Weights marked “est.”, the leg load capacity and container loads are still estimates awaiting SUCOOT engineering data.",

      "step1.title": "Choose a system",
      "system.groupLabel": "Scaffolding system",
      "system.facade.name": "Access / Facade Scaffolding",
      "system.facade.desc": "Ø48.6 × t2.5 verticals · Ø42.7 horizontals · 2.0 m lifts",
      "system.shoring.name": "Shoring Towers (Heavy Duty)",
      "system.shoring.desc": "Ø60.2 × t3.2 verticals · Ø48.6 horizontals · 1.5 m lifts",

      "step2.title": "Project dimensions",
      "facade.length": "Wall length (m)",
      "facade.height": "Height (m)",
      "facade.bay": "Bay length (horizontal)",
      "facade.width": "Scaffold width (horizontal)",
      "facade.width09": "0.9 m (550 + 265 planks)",
      "facade.width12": "1.2 m (2 × 550 planks)",
      "facade.layout": "Bay layout (best fit first)",
      "facade.levels": "Decked working levels",
      "facade.ties": "Include wall ties",
      "shoring.length": "Area length (m)",
      "shoring.width": "Area width (m)",
      "shoring.height": "Floor to soffit (m)",
      "shoring.slab": "Slab thickness (m)",
      "shoring.hint": "The horizontal length (vertical spacing: 0.6 – 2.4 m) is selected automatically from the slab load.",

      "split.summary": "{length} ÷ {bay} = {n} bays",
      "split.summaryOne": "{length} ÷ {bay} = 1 bay",
      "split.noRemainder": ", no remainder",
      "split.remainder": ", remainder {r}",
      "plan.best": "★ Best fit: ",
      "plan.exact": " (exact)",
      "plan.over": " (+{d})",
      "plan.short": " (short {d}, no extra bay)",

      "results.title": "Estimated materials",
      "results.csv": "Download CSV",
      "stat.weight": "Total weight",
      "stat.pieces": "Components",
      "stat.containers": "Containers",
      "stat.piecesValue": "{n} pcs",
      "stat.containersAlt": "or {n} × 40′",
      "table.item": "Item",
      "table.spec": "Spec",
      "table.qty": "Qty",
      "table.weight": "Weight (kg)",
      "table.total": "Total",
      "badge.est": "est.",
      "badge.custom": "Custom size",
      "legend.est": "“est.” = unit weight not listed in the catalog; estimated from similar components.",
      "legend.custom": "“Custom size” = not a standard catalog size for this bay length; available on request.",
      "results.disclaimer": "This is a preliminary estimate for budgeting only. Final quantities depend on site conditions and SUCOOT's structural calculation.",

      "stack.line": "Each vertical line (bottom → top): {pieces} m verticals + {jacks}{ext} = {top}.",
      "stack.jackFacade": "Jack Base ",
      "stack.jackShoring": "Basic Socket 0.2 m + jacks ",
      "design.note": "Design load {load} kN/m² → {spacing} m horizontals, about {leg} kN per vertical ({util}% of the assumed {allow} kN capacity).",
      "caption.facade": "Elevation: {full} × {bay}{fillers}{shade} = {covered}, {lifts} lifts × {lift}, {levels} decked level(s){clip}.",
      "caption.shadeOne": " (filler bay shaded)",
      "caption.shadeMany": " (filler bays shaded)",
      "caption.clipFacade": " ({n} full bays drawn)",
      "caption.shoring": "Plan: {nx} × {ny} verticals at {spacing} spacing, {lifts} lifts{clip}.",
      "caption.clipShoring": " (partly shown)",

      "item.Jack Base": "Jack Base",
      "item.Vertical": "Vertical",
      "item.Horizontal (bay)": "Horizontal (bay)",
      "item.Horizontal (width)": "Horizontal (width)",
      "item.Horizontal": "Horizontal",
      "item.Diagonal": "Diagonal",
      "item.Plank": "Plank",
      "item.Side Plank": "Side Plank",
      "item.Toe Board": "Toe Board",
      "item.Wall Tie": "Wall Tie",
      "item.Basic Socket": "Basic Socket",
      "item.U-Head Jack": "U-Head Jack",
      "spec.Aluminum": "Aluminum",
      "spec.Site specific": "Site specific",

      "csv.code": "Code",
      "csv.item": "Item",
      "csv.spec": "Specification",
      "csv.qty": "Qty (pcs)",
      "csv.unit": "Unit weight (kg)",
      "csv.total": "Total weight (kg)",
      "csv.source": "Weight source",
      "csv.standard": "Standard size",
      "csv.estimated": "Estimated",
      "csv.catalog": "Catalog",
      "csv.custom": "Custom",
      "csv.standardValue": "Standard",
      "csv.sum": "Total",

      "field.wallLength": "Wall length",
      "field.height": "Height",
      "field.areaLength": "Area length",
      "field.areaWidth": "Area width",
      "field.shoringHeight": "Shoring height",
      "field.slabThickness": "Slab thickness",
      "error.range": "{field} must be between {min} and {max}.",
      "error.bayLength": "Bay length is not supported.",
      "error.width": "Scaffold width is not supported.",
      "error.layout": "The selected bay layout is not supported.",
      "error.load": "The design load ({load} kN/m²) is beyond this estimator. Please request a design evaluation from our engineers.",

      "step3.title": "Request a quotation",
      "rfq.hint": "Your dimensions and the estimated materials above are attached automatically.",
      "rfq.company": "Company name *",
      "rfq.country": "Country *",
      "rfq.contact": "Contact person *",
      "rfq.email": "Email *",
      "rfq.phone": "Phone / WhatsApp",
      "rfq.location": "Project location",
      "rfq.locationPlaceholder": "City / project name",
      "rfq.need": "What do you need?",
      "rfq.needQuote": "A quotation",
      "rfq.needDesign": "A design evaluation",
      "rfq.neededBy": "Needed on site by",
      "rfq.details": "Project details",
      "rfq.detailsPlaceholder": "Structure type, loads, delivery port, anything else we should know",
      "rfq.consent": "I agree that SUCOOT may use these details to respond to my request. *",
      "rfq.submit": "Send quotation request",
      "rfq.errRequired": "Please fill in all required fields marked with *.",
      "rfq.errEmail": "Please enter a valid email address.",
      "rfq.errConsent": "Please agree to the use of your details so we can respond.",
      "rfq.errDimensions": "Please correct the project dimensions first.",
      "rfq.errFormat": "Some details are not in the expected format. Please check the form and try again.",
      "rfq.errNetwork": "We could not reach the server. Please check your connection and try again.",
      "rfq.errGeneric": "Sorry, your request could not be sent. Please email us at {email}.",
      "rfq.thanks": "Thank you! Our team will contact you soon.",
      "rfq.sent": "Thank you! Your request has been sent. Our team will contact you soon.",
      "rfq.sending": "Sending…",
      "rfq.mailto": "{reason}, so we opened an email draft to {email} instead.",
      "rfq.reasonNotConfigured": "Online submission is not configured yet",
      "rfq.reasonOffline": "You are offline",

      "footer.company": "SUCOOT CO., LTD. · Taichung, Taiwan"
    },

    "zh-Hant": {
      "meta.title": "鷹架配置估算 | 實固 SUCOOT",
      "meta.description": "估算實固圓盤系統鷹架與重型支撐架的初步料表，並直接送出詢價。",
      "lang.toggle": "EN",
      "lang.toggleLabel": "Switch to English",
      "brand.sub": "圓盤系統",
      "header.title": "鷹架配置估算",
      "header.lead": "輸入工程尺寸，即可取得初步料表、總重與貨櫃數估算，並直接送給我們的工程師報價。",
      "install.button": "安裝 App",
      "install.ios": "安裝到 iPhone：點選<strong>分享</strong>，再選<strong>加入主畫面</strong>。",
      "banner.offline": "目前處於離線狀態。估算功能仍可使用；送出詢價時會改為開啟 email 草稿。",
      "banner.placeholder": "原型版本：構件尺寸依實固 2026 年型錄。標示「估」的重量、主架容許荷重與貨櫃載重仍為推估值，待實固工程部提供正式數據。",

      "step1.title": "選擇系統",
      "system.groupLabel": "鷹架系統",
      "system.facade.name": "外牆／施工通道鷹架（輕型架）",
      "system.facade.desc": "主架 Ø48.6 × t2.5 · 橫桿 Ø42.7 · 步高 2.0 m",
      "system.shoring.name": "重型支撐架",
      "system.shoring.desc": "主架 Ø60.2 × t3.2 · 橫桿 Ø48.6 · 步高 1.5 m",

      "step2.title": "工程尺寸",
      "facade.length": "牆長 (m)",
      "facade.height": "高度 (m)",
      "facade.bay": "跨距（橫桿長度）",
      "facade.width": "架寬（橫桿長度）",
      "facade.width09": "0.9 m（550 + 265 腳踏板）",
      "facade.width12": "1.2 m（2 片 550 腳踏板）",
      "facade.layout": "跨距組合（最佳組合排第一）",
      "facade.levels": "鋪板工作層數",
      "facade.ties": "包含壁連座",
      "shoring.length": "支撐區長度 (m)",
      "shoring.width": "支撐區寬度 (m)",
      "shoring.height": "地面至樓板底高度 (m)",
      "shoring.slab": "樓板厚度 (m)",
      "shoring.hint": "橫桿長度（主架間距 0.6–2.4 m）會依樓板荷重自動選擇。",

      "split.summary": "{length} ÷ {bay} ＝ {n} 跨",
      "split.summaryOne": "{length} ÷ {bay} ＝ 1 跨",
      "split.noRemainder": "，無餘數",
      "split.remainder": "，餘 {r}",
      "plan.best": "★ 最佳組合：",
      "plan.exact": "（剛好）",
      "plan.over": "（多 {d}）",
      "plan.short": "（短 {d}，不補跨）",

      "results.title": "估算料表",
      "results.csv": "下載 CSV",
      "stat.weight": "總重",
      "stat.pieces": "構件數",
      "stat.containers": "貨櫃",
      "stat.piecesValue": "{n} 件",
      "stat.containersAlt": "或 {n} × 40′",
      "table.item": "品名",
      "table.spec": "規格",
      "table.qty": "數量",
      "table.weight": "重量 (kg)",
      "table.total": "合計",
      "badge.est": "估",
      "badge.custom": "需訂製",
      "legend.est": "「估」＝型錄未列出單位重量，依相近構件推估。",
      "legend.custom": "「需訂製」＝此跨距長度沒有型錄標準品，可依需求訂製。",
      "results.disclaimer": "此為初步估算，僅供預算參考。實際數量依現場條件與實固的結構計算為準。",

      "stack.line": "每個主架位置（由下往上）：主架 {pieces} m ＋ {jacks}{ext} ＝ {top}。",
      "stack.jackFacade": "調整座 ",
      "stack.jackShoring": "基座套管 0.2 m ＋ 上下調整座 ",
      "design.note": "設計荷重 {load} kN/m² → 橫桿 {spacing} m，每支主架約承受 {leg} kN（為假設容許荷重 {allow} kN 的 {util}%）。",
      "caption.facade": "立面圖：{full} × {bay}{fillers}{shade} ＝ {covered}，{lifts} 步 × {lift}，{levels} 層鋪板{clip}。",
      "caption.shadeOne": "（補跨以底色標示）",
      "caption.shadeMany": "（補跨以底色標示）",
      "caption.clipFacade": "（僅繪出 {n} 個整跨）",
      "caption.shoring": "平面圖：主架 {nx} × {ny}，間距 {spacing}，{lifts} 步{clip}。",
      "caption.clipShoring": "（部分顯示）",

      "item.Jack Base": "調整座",
      "item.Vertical": "主架",
      "item.Horizontal (bay)": "橫桿（跨向）",
      "item.Horizontal (width)": "橫桿（寬向）",
      "item.Horizontal": "橫桿",
      "item.Diagonal": "斜桿",
      "item.Plank": "腳踏板",
      "item.Side Plank": "側腳踏板",
      "item.Toe Board": "腳趾板",
      "item.Wall Tie": "壁連座",
      "item.Basic Socket": "基座套管",
      "item.U-Head Jack": "U 型頂座",
      "spec.Aluminum": "鋁製",
      "spec.Site specific": "依現場設計",

      "csv.code": "料號",
      "csv.item": "品名",
      "csv.spec": "規格",
      "csv.qty": "數量（件）",
      "csv.unit": "單重 (kg)",
      "csv.total": "總重 (kg)",
      "csv.source": "重量來源",
      "csv.standard": "尺寸",
      "csv.estimated": "推估",
      "csv.catalog": "型錄",
      "csv.custom": "需訂製",
      "csv.standardValue": "標準品",
      "csv.sum": "合計",

      "field.wallLength": "牆長",
      "field.height": "高度",
      "field.areaLength": "支撐區長度",
      "field.areaWidth": "支撐區寬度",
      "field.shoringHeight": "支撐高度",
      "field.slabThickness": "樓板厚度",
      "error.range": "{field}必須介於 {min} 到 {max} 之間。",
      "error.bayLength": "不支援此跨距。",
      "error.width": "不支援此架寬。",
      "error.layout": "不支援所選的跨距組合。",
      "error.load": "設計荷重（{load} kN/m²）超出本估算範圍，請向我們的工程師申請設計評估。",

      "step3.title": "詢價",
      "rfq.hint": "上方的尺寸與估算料表會自動附在詢價中。",
      "rfq.company": "公司名稱 *",
      "rfq.country": "國家 *",
      "rfq.contact": "聯絡人 *",
      "rfq.email": "Email *",
      "rfq.phone": "電話／WhatsApp",
      "rfq.location": "工程地點",
      "rfq.locationPlaceholder": "城市／工程名稱",
      "rfq.need": "需求",
      "rfq.needQuote": "報價",
      "rfq.needDesign": "設計評估",
      "rfq.neededBy": "預計進場日期",
      "rfq.details": "工程說明",
      "rfq.detailsPlaceholder": "結構類型、荷重、交貨港口，或其他需要我們知道的事項",
      "rfq.consent": "我同意實固使用以上資料回覆我的詢價。 *",
      "rfq.submit": "送出詢價",
      "rfq.errRequired": "請填寫所有標示 * 的必填欄位。",
      "rfq.errEmail": "請輸入有效的 Email。",
      "rfq.errConsent": "請勾選同意，我們才能回覆您的詢價。",
      "rfq.errDimensions": "請先修正工程尺寸。",
      "rfq.errFormat": "部分資料格式不正確，請檢查後再試一次。",
      "rfq.errNetwork": "無法連線到伺服器，請檢查網路後再試一次。",
      "rfq.errGeneric": "抱歉，詢價未能送出，請直接寄信至 {email}。",
      "rfq.thanks": "謝謝！我們的團隊會盡快與您聯繫。",
      "rfq.sent": "謝謝！詢價已送出，我們的團隊會盡快與您聯繫。",
      "rfq.sending": "送出中…",
      "rfq.mailto": "{reason}，已改為開啟寄給 {email} 的 email 草稿。",
      "rfq.reasonNotConfigured": "線上送出功能尚未設定",
      "rfq.reasonOffline": "目前處於離線狀態",

      "footer.company": "實固股份有限公司 · 台灣台中"
    }
  };

  function readStoredLang() {
    try {
      const stored = root.localStorage.getItem(STORAGE_KEY);
      return LANGS.indexOf(stored) !== -1 ? stored : null;
    } catch (e) {
      return null;
    }
  }

  function detectLang() {
    const stored = readStoredLang();
    if (stored) {
      return stored;
    }
    const preferred = (root.navigator && (root.navigator.languages || [root.navigator.language])) || [];
    return preferred.some(function (code) { return /^zh/i.test(code || ""); }) ? "zh-Hant" : "en";
  }

  let lang = detectLang();
  const listeners = [];

  function t(key, params) {
    const table = MESSAGES[lang] || MESSAGES.en;
    let text = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : MESSAGES.en[key];
    if (text === undefined) {
      return key;
    }
    if (params) {
      text = text.replace(/\{(\w+)\}/g, function (match, name) {
        return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
      });
    }
    return text;
  }

  // 構件名稱或規格字詞：有翻譯就用翻譯，沒有就保留原文。
  function term(prefix, value) {
    const key = prefix + "." + value;
    const translated = t(key);
    return translated === key ? value : translated;
  }

  function apply(scope) {
    const rootEl = scope || root.document;
    rootEl.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    // 只用於本檔內含 <strong> 的固定字串。
    rootEl.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    rootEl.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    rootEl.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    root.document.documentElement.lang = lang;
    root.document.title = t("meta.title");
    const description = root.document.querySelector("meta[name='description']");
    if (description) {
      description.setAttribute("content", t("meta.description"));
    }
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) {
      return;
    }
    lang = next;
    try {
      root.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // 無法儲存時只影響下次開啟的預設語言。
    }
    apply();
    listeners.forEach(function (fn) { fn(lang); });
  }

  root.I18n = {
    t: t,
    term: term,
    apply: apply,
    setLang: setLang,
    toggle: function () { setLang(lang === "en" ? "zh-Hant" : "en"); },
    onChange: function (fn) { listeners.push(fn); },
    get lang() { return lang; }
  };
})(window);
