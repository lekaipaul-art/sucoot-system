const RFQ_TABLE = "rfq_requests";
const FALLBACK_EMAIL = "info.ws@sucoot.com";
const MAX_DRAWN = 40;
const SVG_NS = "http://www.w3.org/2000/svg";

const calc = window.ScaffoldCalc;
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
  return {
    length: Number(facadeForm.length.value),
    height: Number(facadeForm.height.value),
    bayLength: Number(facadeForm.bayLength.value),
    width: Number(facadeForm.width.value),
    workingLevels: Number(facadeForm.workingLevels.value),
    wallTies: facadeForm.wallTies.checked
  };
}

function update() {
  const system = selectedSystem();
  facadeForm.hidden = system !== "facade";
  shoringForm.hidden = system !== "shoring";

  const inputs = readInputs(system);
  const result = system === "shoring" ? calc.estimateShoring(inputs) : calc.estimateFacade(inputs);

  if (!result.ok) {
    currentInputs = null;
    currentResult = null;
    showMessage(inputMessage, result.errors.join(" "), "error");
    renderEmpty();
    return;
  }

  hideMessage(inputMessage);
  currentInputs = Object.assign({ system: system }, inputs);
  currentResult = result;
  renderResult(result);
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
  downloadButton.disabled = true;
}

function renderResult(result) {
  statWeight.textContent = numberFormat.format(result.totalKg / 1000) + " t";
  statPieces.textContent = result.totalPieces.toLocaleString("en-US") + " pcs";
  statContainers.textContent = result.containers20 + " × 20′ or " + result.containers40 + " × 40′";
  downloadButton.disabled = false;

  const rows = result.items.map(function (item) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("span");
    name.textContent = item.name;
    const code = document.createElement("span");
    code.className = "code";
    code.textContent = item.code;
    nameCell.append(name, code);
    row.append(nameCell, cell(item.spec), cell(item.qty.toLocaleString("en-US"), "num"), cell(numberFormat.format(item.totalKg), "num"));
    return row;
  });
  bomBody.replaceChildren.apply(bomBody, rows);
  bomTotalQty.textContent = result.totalPieces.toLocaleString("en-US");
  bomTotalKg.textContent = numberFormat.format(result.totalKg);

  if (result.system === "shoring") {
    drawShoring(result.geometry);
    const design = result.design;
    designNote.textContent = "Design load " + design.loadKNm2 + " kN/m² → tower spacing " + result.geometry.spacing +
      " m, about " + design.legLoadKN + " kN per leg (" + design.utilization + "% of the assumed " + design.allowableLegKN + " kN capacity).";
    designNote.hidden = false;
  } else {
    drawFacade(result.geometry);
    designNote.hidden = true;
  }
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
  const bays = Math.min(g.bays, MAX_DRAWN);
  const width = 360;
  const height = 190;
  const unitX = width / bays;
  const unitY = height / g.lifts;
  const left = 20;
  const top = 15;
  const parts = [];

  parts.push(svgEl("line", { x1: 0, y1: top + height + 2, x2: 400, y2: top + height + 2, class: "ground" }));
  for (let i = 0; i <= bays; i++) {
    const x = left + i * unitX;
    parts.push(svgEl("line", { x1: x, y1: top, x2: x, y2: top + height, class: "standard" }));
  }
  for (let j = 0; j <= g.lifts; j++) {
    const y = top + j * unitY;
    parts.push(svgEl("line", { x1: left, y1: y, x2: left + width, y2: y, class: "ledger" }));
  }
  for (let j = 0; j < g.lifts; j++) {
    for (let i = 0; i < bays; i += 3) {
      const x = left + i * unitX;
      const y = top + j * unitY;
      parts.push(svgEl("line", { x1: x, y1: y + unitY, x2: x + unitX, y2: y, class: "diagonal" }));
    }
  }
  for (let level = 0; level < g.levels; level++) {
    const y = top + level * unitY;
    parts.push(svgEl("rect", { x: left, y: y - 2, width: width, height: 4, class: "deck" }));
  }
  diagram.replaceChildren.apply(diagram, parts);

  const clipped = g.bays > MAX_DRAWN ? " (first " + MAX_DRAWN + " bays shown)" : "";
  diagramCaption.textContent = "Elevation: " + g.bays + " bays × " + g.bayLength + " m, " + g.lifts +
    " lifts × " + g.liftHeight + " m, " + g.levels + " decked level(s)" + clipped + ".";
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

  const clipped = g.nx > MAX_DRAWN || g.ny > MAX_DRAWN ? " (partly shown)" : "";
  diagramCaption.textContent = "Plan: " + g.nx + " × " + g.ny + " legs at " + g.spacing + " m spacing, " +
    g.lifts + " lifts" + clipped + ".";
}

function downloadCsv() {
  if (!currentResult) {
    return;
  }
  const blob = new Blob(["﻿" + calc.toCsv(currentResult)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sucoot-estimate-" + currentResult.system + ".csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
    return "Please fill in all required fields marked with *.";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rfq.email)) {
    return "Please enter a valid email address.";
  }
  if (!rfq.privacy_consent) {
    return "Please agree to the use of your details so we can respond.";
  }
  if (!currentResult) {
    return "Please correct the project dimensions first.";
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
    return "Some details are not in the expected format. Please check the form and try again.";
  }
  if (/fetch|network/i.test(text)) {
    return "We could not reach the server. Please check your connection and try again.";
  }
  return "Sorry, your request could not be sent. Please email us at " + FALLBACK_EMAIL + ".";
}

async function submitRfq(event) {
  event.preventDefault();
  const rfq = readRfq();

  // 隱藏欄位被填寫，多半是機器人；假裝成功但不送出。
  if (rfq.website) {
    showMessage(rfqMessage, "Thank you! Our team will contact you soon.", "success");
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
    const reason = navigator.onLine ? "Online submission is not configured yet" : "You are offline";
    showMessage(rfqMessage, reason + ", so we opened an email draft to " + FALLBACK_EMAIL + " instead.", "info");
    return;
  }

  rfqSubmit.disabled = true;
  showMessage(rfqMessage, "Sending…", "info");

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
  showMessage(rfqMessage, "Thank you! Your request has been sent. Our team will contact you soon.", "success");
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

document.getElementById("placeholder-banner").hidden = !calc.DATA.isPlaceholder;
updateOnlineStatus();
setupInstall();
update();
