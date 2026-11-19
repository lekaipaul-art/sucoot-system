const RFQ_TABLE = "rfq_requests";
const FALLBACK_EMAIL = "info.ws@sucoot.com";
const MAX_DRAWN = 40;
const SVG_NS = "http://www.w3.org/2000/svg";

const calc = window.ScaffoldCalc;
const i18n = window.I18n;
const t = i18n.t;
const client = createSupabaseClient();

const systemInputs = document.querySelectorAll("input[name='system']");
const facadeForm = document.getElementById("facade-form");
const shoringForm = document.getElementById("shoring-form");
const inputMessage = document.getElementById("input-message");
const statWeight = document.getElementById("stat-weight");
const statPieces = document.getElementById("stat-pieces");
const statContainers = document.getElementById("stat-containers");
const diagram = document.getElementById("diagram");
const diagramCaption = document.getElementById("diagram-caption");
const designNote = document.getElementById("design-note");
const bomBody = document.getElementById("bom-body");
const bomTotalQty = document.getElementById("bom-total-qty");
const bomTotalKg = document.getElementById("bom-total-kg");
const bomLegend = document.getElementById("bom-legend");
const baySplitText = document.getElementById("bay-split-text");
const remainderField = document.getElementById("remainder-field");
const remainderSelect = document.getElementById("facade-remainder-bay");
let remainderKey = "";
let currentPlans = [];
const downloadButton = document.getElementById("download-button");
const rfqForm = document.getElementById("rfq-form");
const rfqSubmit = document.getElementById("rfq-submit");
const rfqMessage = document.getElementById("rfq-message");

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

let currentInputs = null;
let currentResult = null;

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

function selectedSystem() {
  const checked = document.querySelector("input[name='system']:checked");
  return checked ? checked.value : "facade";
}

function readInputs(system) {
  if (system === "shoring") {
    return {
      areaLength: Number(shoringForm.areaLength.value),
      areaWidth: Number(shoringForm.areaWidth.value),
      height: Number(shoringForm.height.value),
      slabThickness: Number(shoringForm.slabThickness.value)
    };
  }
  const inputs = {
    length: Number(facadeForm.length.value),
    height: Number(facadeForm.height.value),
    bayLength: Number(facadeForm.bayLength.value),
    width: Number(facadeForm.width.value),
    workingLevels: Number(facadeForm.workingLevels.value),
    wallTies: facadeForm.wallTies.checked
  };
  const chosen = remainderField.hidden ? null : currentPlans[Number(remainderSelect.value)];
  if (chosen) {
    inputs.fullBays = chosen.fullBays;
    inputs.fillers = chosen.fillers.slice();
  }
  return inputs;
}

const meterFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function formatMeters(value) {
  return meterFormat.format(value) + " m";
}

function describePlan(plan, bay) {
  let text = plan.fullBays > 0 ? plan.fullBays + " × " + formatMeters(bay) : "";
  plan.fillers.forEach(function (len) {
    text += (text ? " + " : "") + formatMeters(len);
  });
  text += " = " + formatMeters(plan.covered);
  if (plan.overshoot < 0) {
    return text + t("plan.short", { d: formatMeters(-plan.overshoot) });
  }
  if (plan.overshoot === 0) {
    return text + t("plan.exact");
  }
  return text + t("plan.over", { d: formatMeters(plan.overshoot) });
}

// Wall length ÷ Bay length：顯示整跨數與餘數；有餘數時列出最佳跨距組合（第一個為最佳解）。
// 牆長或跨距改變時，重新計算並選回最佳組合。
function updateBaySplit() {
  const length = Number(facadeForm.length.value);
  const bay = Number(facadeForm.bayLength.value);
  if (!Number.isFinite(length) || length <= 0) {
    baySplitText.textContent = "–";
    remainderField.hidden = true;
    remainderKey = "";
    currentPlans = [];
    return;
  }

  const plan = calc.planBays(length, bay);
  const summary = t(plan.fullBays === 1 ? "split.summaryOne" : "split.summary",
    { length: formatMeters(length), bay: formatMeters(bay), n: plan.fullBays });
  if (plan.remainder === 0) {
    baySplitText.textContent = summary + t("split.noRemainder");
    remainderField.hidden = true;
    remainderKey = "";
    currentPlans = [];
    return;
  }

  baySplitText.textContent = summary + t("split.remainder", { r: formatMeters(plan.remainder) });
  const key = length + "|" + bay;
  if (key !== remainderKey) {
    currentPlans = plan.plans;
    const options = currentPlans.map(function (item, index) {
      const option = document.createElement("option");
      option.value = String(index);
      return option;
    });
    remainderSelect.replaceChildren.apply(remainderSelect, options);
    remainderSelect.value = "0";
    remainderKey = key;
  }
  // 每次更新都重寫選項文字（切換語言時保留原本的選擇）。
  Array.prototype.forEach.call(remainderSelect.options, function (option, index) {
    option.textContent = (index === 0 ? t("plan.best") : "") + describePlan(currentPlans[index], bay);
  });
  remainderField.hidden = false;
}

function update() {
  const system = selectedSystem();
  facadeForm.hidden = system !== "facade";
  shoringForm.hidden = system !== "shoring";

  if (system === "facade") {
    updateBaySplit();
  }
  const inputs = readInputs(system);
  const result = system === "shoring" ? calc.estimateShoring(inputs) : calc.estimateFacade(inputs);

  if (!result.ok) {
    currentInputs = null;
    currentResult = null;
    showMessage(inputMessage, result.errors.map(describeCalcError).join(" "), "error");
    renderEmpty();
    return;
  }

  hideMessage(inputMessage);
  currentInputs = Object.assign({ system: system }, inputs);
  currentResult = result;
  renderResult(result);
}

function describeCalcError(error) {
  const params = Object.assign({}, error.params);
  if (params.field) {
    params.field = t("field." + params.field);
  }
  return t("error." + error.code, params);
}

function renderEmpty() {
  statWeight.textContent = "–";
  statPieces.textContent = "–";
  statContainers.textContent = "–";
  bomBody.replaceChildren();
  bomTotalQty.textContent = "–";
  bomTotalKg.textContent = "–";
  diagram.replaceChildren();
  diagramCaption.textContent = "–";
  designNote.hidden = true;
  bomLegend.hidden = true;
  downloadButton.disabled = true;
}

function renderResult(result) {
  statWeight.textContent = numberFormat.format(result.totalKg / 1000) + " t";
  statPieces.textContent = t("stat.piecesValue", { n: result.totalPieces.toLocaleString("en-US") });
  const alt = document.createElement("span");
  alt.className = "stat-sub";
  alt.textContent = t("stat.containersAlt", { n: result.containers40 });
  statContainers.replaceChildren(result.containers20 + " × 20′", alt);
  downloadButton.disabled = false;

  const rows = result.items.map(function (item) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("span");
    name.textContent = itemName(item);
    nameCell.append(name);
    if (item.code) {
      const code = document.createElement("span");
      code.className = "code";
      code.textContent = item.code;
      nameCell.append(code);
    }
    const specCell = cell(itemSpec(item));
    if (item.custom) {
      specCell.append(badge("custom", t("badge.custom")));
    }
    const weightCell = cell(numberFormat.format(item.totalKg), "num");
    if (item.weightSource === "estimate") {
      weightCell.append(badge("est", t("badge.est")));
    }
    row.append(nameCell, specCell, cell(item.qty.toLocaleString("en-US"), "num"), weightCell);
    return row;
  });
  bomBody.replaceChildren.apply(bomBody, rows);
  bomTotalQty.textContent = result.totalPieces.toLocaleString("en-US");
  bomTotalKg.textContent = numberFormat.format(result.totalKg);

  const legend = [];
  if (result.hasEstimates) {
    legend.push(t("legend.est"));
  }
  if (result.hasCustom) {
    legend.push(t("legend.custom"));
  }
  bomLegend.textContent = legend.join(" ");
  bomLegend.hidden = legend.length === 0;

  const stackText = describeVerticalStack(result.verticalStack, result.system);
  if (result.system === "shoring") {
    drawShoring(result.geometry);
    const design = result.design;
    designNote.textContent = stackText + " " + t("design.note", {
      load: design.loadKNm2,
      spacing: result.geometry.spacing.toFixed(1),
      leg: design.legLoadKN,
      util: design.utilization,
      allow: design.allowableLegKN
    });
  } else {
    drawFacade(result.geometry);
    designNote.textContent = stackText;
  }
  designNote.hidden = false;
}

// 每個立柱位置使用的規格品立柱組合，例如 3.0 + 3.0 + 1.5 m + Jack Base 0.5 m = 8 m。
function describeVerticalStack(stack, system) {
  const pieces = stack.sequence.map(function (len) { return len.toFixed(1); }).join(" + ");
  return t("stack.line", {
    pieces: pieces,
    jacks: t(system === "shoring" ? "stack.jackShoring" : "stack.jackFacade"),
    ext: formatMeters(stack.extension),
    top: formatMeters(stack.topHeight)
  });
}

// 構件名稱與規格中的字詞依目前語言顯示（例如 Vertical → 主架）。
function itemName(item) {
  return i18n.term("item", item.name);
}

function itemSpec(item) {
  return item.spec.replace(/Aluminum|Site specific/g, function (word) {
    return i18n.term("spec", word);
  });
}

function badge(className, text) {
  const span = document.createElement("span");
  span.className = "badge " + className;
  span.textContent = text;
  return span;
}

function cell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) {
    td.className = className;
  }
  return td;
}

function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach(function (key) {
    el.setAttribute(key, attrs[key]);
  });
  return el;
}

// 外牆架立面圖：跨距 × 步數，最上方的工作層畫踏板，部分跨距畫斜撐。
function drawFacade(g) {
  // 依實際長度畫每一跨；補跨畫在最右側並加底色標示。
  const fillerCount = g.fillers.length;
  const drawnFull = Math.min(g.fullBays, MAX_DRAWN - fillerCount);
  const bayWidths = g.bayWidths.slice(g.fullBays - drawnFull);
  const drawnLength = bayWidths.reduce(function (sum, w) { return sum + w; }, 0);
  const width = 360;
  const height = 190;
  const scale = width / drawnLength;
  const unitY = height / g.lifts;
  const left = 20;
  const top = 15;
  const parts = [];
  const xs = [left];
  bayWidths.forEach(function (w) {
    xs.push(xs[xs.length - 1] + w * scale);
  });

  for (let i = drawnFull; i < bayWidths.length; i++) {
    parts.push(svgEl("rect", { x: xs[i], y: top, width: xs[i + 1] - xs[i], height: height, class: "remainder-bay" }));
  }
  parts.push(svgEl("line", { x1: 0, y1: top + height + 2, x2: 400, y2: top + height + 2, class: "ground" }));
  xs.forEach(function (x) {
    parts.push(svgEl("line", { x1: x, y1: top, x2: x, y2: top + height, class: "standard" }));
  });
  for (let j = 0; j <= g.lifts; j++) {
    const y = top + j * unitY;
    parts.push(svgEl("line", { x1: left, y1: y, x2: left + width, y2: y, class: "ledger" }));
  }
  const bracedBays = drawnFull > 0 ? drawnFull : bayWidths.length;
  for (let j = 0; j < g.lifts; j++) {
    for (let i = 0; i < bracedBays; i += 3) {
      const y = top + j * unitY;
      parts.push(svgEl("line", { x1: xs[i], y1: y + unitY, x2: xs[i + 1], y2: y, class: "diagonal" }));
    }
  }
  for (let level = 0; level < g.levels; level++) {
    const y = top + level * unitY;
    parts.push(svgEl("rect", { x: left, y: y - 2, width: width, height: 4, class: "deck" }));
  }
  diagram.replaceChildren.apply(diagram, parts);

  diagramCaption.textContent = t("caption.facade", {
    full: g.fullBays,
    bay: formatMeters(g.bayLength),
    fillers: g.fillers.map(function (len) { return " + " + formatMeters(len); }).join(""),
    shade: fillerCount ? t(fillerCount > 1 ? "caption.shadeMany" : "caption.shadeOne") : "",
    covered: formatMeters(g.coveredLength),
    lifts: g.lifts,
    lift: formatMeters(g.liftHeight),
    levels: g.levels,
    clip: g.fullBays > drawnFull ? t("caption.clipFacade", { n: drawnFull }) : ""
  });
}

// 支撐架平面圖：立柱格點與兩向橫桿。
function drawShoring(g) {
  const nx = Math.min(g.nx, MAX_DRAWN);
  const ny = Math.min(g.ny, MAX_DRAWN);
  const unit = Math.min(360 / Math.max(nx - 1, 1), 190 / Math.max(ny - 1, 1));
  const left = (400 - unit * (nx - 1)) / 2;
  const top = (220 - unit * (ny - 1)) / 2;
  const radius = Math.max(1.5, Math.min(4, unit / 5));
  const parts = [];

  for (let j = 0; j < ny; j++) {
    const y = top + j * unit;
    parts.push(svgEl("line", { x1: left, y1: y, x2: left + unit * (nx - 1), y2: y, class: "ledger" }));
  }
  for (let i = 0; i < nx; i++) {
    const x = left + i * unit;
    parts.push(svgEl("line", { x1: x, y1: top, x2: x, y2: top + unit * (ny - 1), class: "ledger" }));
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      parts.push(svgEl("circle", { cx: left + i * unit, cy: top + j * unit, r: radius, class: "leg" }));
    }
  }
  diagram.replaceChildren.apply(diagram, parts);

  diagramCaption.textContent = t("caption.shoring", {
    nx: g.nx,
    ny: g.ny,
    spacing: formatMeters(g.spacing),
    lifts: g.lifts,
    clip: g.nx > MAX_DRAWN || g.ny > MAX_DRAWN ? t("caption.clipShoring") : ""
  });
}

function downloadCsv() {
  if (!currentResult) {
    return;
  }
  const blob = new Blob(["﻿" + buildCsv(currentResult)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sucoot-estimate-" + currentResult.system + ".csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// 料表 CSV：表頭、品名與規格字詞依目前語言輸出。
function buildCsv(result) {
  const rows = [[t("csv.code"), t("csv.item"), t("csv.spec"), t("csv.qty"), t("csv.unit"), t("csv.total"),
    t("csv.source"), t("csv.standard")]];
  result.items.forEach(function (item) {
    rows.push([item.code, itemName(item), itemSpec(item), item.qty, item.unitKg, item.totalKg,
      t(item.weightSource === "estimate" ? "csv.estimated" : "csv.catalog"),
      t(item.custom ? "csv.custom" : "csv.standardValue")]);
  });
  rows.push(["", t("csv.sum"), "", result.totalPieces, "", result.totalKg, "", ""]);
  return rows.map(function (row) {
    return row.map(function (value) {
      const text = String(value);
      return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
    }).join(",");
  }).join("\r\n");
}

function readRfq() {
  const data = new FormData(rfqForm);
  const text = function (name) { return String(data.get(name) || "").trim(); };
  return {
    company_name: text("company_name"),
    country: text("country"),
    contact_name: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    project_location: text("project_location"),
    needed_by: text("needed_by") || null,
    request_type: text("request_type") === "design" ? "design" : "quotation",
    notes: text("notes"),
    privacy_consent: data.get("privacy_consent") === "on",
    website: text("website")
  };
}

function validateRfq(rfq) {
  if (!rfq.company_name || !rfq.country || !rfq.contact_name || !rfq.email) {
    return t("rfq.errRequired");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rfq.email)) {
    return t("rfq.errEmail");
  }
  if (!rfq.privacy_consent) {
    return t("rfq.errConsent");
  }
  if (!currentResult) {
    return t("rfq.errDimensions");
  }
  return "";
}

function buildMailto(rfq) {
  const lines = [
    "Company: " + rfq.company_name,
    "Country: " + rfq.country,
    "Contact: " + rfq.contact_name + " <" + rfq.email + ">",
    "Phone: " + rfq.phone,
    "Project location: " + rfq.project_location,
    "Needed by: " + (rfq.needed_by || "-"),
    "Request: " + rfq.request_type,
    "",
    "Inputs: " + JSON.stringify(currentInputs),
    "Estimated weight: " + currentResult.totalKg + " kg",
    "",
    currentResult.items.map(function (item) { return item.code + "  " + item.qty + " pcs"; }).join("\n"),
    "",
    rfq.notes
  ];
  return "mailto:" + FALLBACK_EMAIL + "?subject=" + encodeURIComponent("Quotation request - " + rfq.company_name) +
    "&body=" + encodeURIComponent(lines.join("\n"));
}

function describeError(error) {
  const code = (error && error.code) || "";
  const text = String((error && error.message) || "");
  if (code === "23514" || code === "23502" || code === "22P02") {
    return t("rfq.errFormat");
  }
  if (/fetch|network/i.test(text)) {
    return t("rfq.errNetwork");
  }
  return t("rfq.errGeneric", { email: FALLBACK_EMAIL });
}

async function submitRfq(event) {
  event.preventDefault();
  const rfq = readRfq();

  // 隱藏欄位被填寫，多半是機器人；假裝成功但不送出。
  if (rfq.website) {
    showMessage(rfqMessage, t("rfq.thanks"), "success");
    rfqForm.reset();
    return;
  }

  const problem = validateRfq(rfq);
  if (problem) {
    showMessage(rfqMessage, problem, "error");
    return;
  }

  if (!client || !navigator.onLine) {
    window.location.href = buildMailto(rfq);
    const reason = t(navigator.onLine ? "rfq.reasonNotConfigured" : "rfq.reasonOffline");
    showMessage(rfqMessage, t("rfq.mailto", { reason: reason, email: FALLBACK_EMAIL }), "info");
    return;
  }

  rfqSubmit.disabled = true;
  showMessage(rfqMessage, t("rfq.sending"), "info");

  const row = {
    company_name: rfq.company_name,
    country: rfq.country,
    contact_name: rfq.contact_name,
    email: rfq.email,
    phone: rfq.phone,
    project_location: rfq.project_location,
    needed_by: rfq.needed_by,
    request_type: rfq.request_type,
    system_type: currentResult.system,
    inputs: currentInputs,
    bom: currentResult.items.map(function (item) {
      return { code: item.code, qty: item.qty, total_kg: item.totalKg };
    }),
    total_weight_kg: currentResult.totalKg,
    notes: rfq.notes,
    privacy_consent: true
  };

  // 不加 .select()：anon 沒有讀取權限，送出後不讀回資料。
  const response = await client.from(RFQ_TABLE).insert(row);
  rfqSubmit.disabled = false;

  if (response.error) {
    showMessage(rfqMessage, describeError(response.error), "error");
    return;
  }
  showMessage(rfqMessage, t("rfq.sent"), "success");
  rfqForm.reset();
}

systemInputs.forEach(function (input) {
  input.addEventListener("change", update);
});
facadeForm.addEventListener("input", update);
shoringForm.addEventListener("input", update);
facadeForm.addEventListener("submit", function (event) { event.preventDefault(); });
shoringForm.addEventListener("submit", function (event) { event.preventDefault(); });
downloadButton.addEventListener("click", downloadCsv);
rfqForm.addEventListener("submit", submitRfq);

// ---- 可安裝成 App（PWA） ----
const installButton = document.getElementById("install-button");
const iosInstallHint = document.getElementById("ios-install-hint");
const offlineBanner = document.getElementById("offline-banner");
let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function setupInstall() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // 註冊失敗只影響離線功能，網頁本身照常運作。
    });
  }
  if (isStandalone()) {
    return;
  }

  // Android／桌面版 Chrome、Edge：攔下安裝提示，改由按鈕觸發。
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async function () {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", function () {
    installButton.hidden = true;
  });

  // iPhone／iPad 的 Safari 沒有安裝提示，改顯示操作說明。
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  iosInstallHint.hidden = !isIos;
}

function updateOnlineStatus() {
  offlineBanner.hidden = navigator.onLine;
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ---- 語言切換 ----
document.getElementById("lang-toggle").addEventListener("click", function () {
  i18n.toggle();
});
i18n.onChange(function () {
  // 重新產生所有動態文字；詢價表單上的提示訊息改語言後清除，避免中英混雜。
  hideMessage(rfqMessage);
  update();
});
i18n.apply();

document.getElementById("placeholder-banner").hidden = !calc.DATA.isPlaceholder;
updateOnlineStatus();
setupInstall();
update();
