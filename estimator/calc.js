// 鷹架配置估算：純計算邏輯，不碰畫面，瀏覽器與 Node 都能載入。
//
// ⚠️ 以下 DATA 內的重量、容許荷重、貨櫃載重全部是「假設值」，
// 只為了讓原型能運作。正式上線前，必須由 SUCOOT 工程部提供並審核正式數值。
(function (root) {
  "use strict";

  const DATA = {
    isPlaceholder: true,
    facade: {
      liftHeight: 2.0,          // 每步高度（m）
      jackAllowance: 0.4,       // 底座千斤頂占用高度（m）
      deckWidth: 0.32,          // 單片踏板寬度（m）
      bracePerBays: 3,          // 每幾個跨距設一組斜撐
      tieSpacingH: 6.0,         // 壁連座水平間距（m）
      tieSpacingV: 4.0,         // 壁連座垂直間距（m）
      standards: { 3.0: 13.5, 2.0: 9.2, 1.0: 4.9 },
      ledgers: { 0.73: 3.2, 1.09: 4.4, 1.57: 6.0, 2.07: 7.8, 2.57: 9.5, 3.07: 11.2 },
      diagonals: { 1.57: 7.5, 2.07: 8.4, 2.57: 9.5, 3.07: 10.8 },
      decks: { 1.57: 11.5, 2.07: 14.8, 2.57: 18.0, 3.07: 21.3 },
      baseJack: 4.6,
      baseCollar: 1.6,
      wallTie: 3.0
    },
    shoring: {
      liftHeight: 1.5,
      jackAllowance: 0.6,       // 底座千斤頂 + U 型頂座占用高度（m）
      allowableLegKN: 45,       // 單支立柱容許荷重（kN）—假設值
      concreteKNm3: 25,         // 鋼筋混凝土單位重（kN/m³）
      formworkKNm2: 1.0,        // 模板自重（kN/m²）
      liveKNm2: 2.5,            // 施工活載重（kN/m²）
      spacings: [1.8, 1.5, 1.2, 0.9],
      standards: { 3.0: 17.8, 1.5: 9.4, 1.0: 6.5 },
      ledgers: { 0.9: 4.2, 1.2: 5.3, 1.5: 6.4, 1.8: 7.5 },
      diagonals: { 0.9: 6.5, 1.2: 7.2, 1.5: 8.0, 1.8: 8.9 },
      baseJack: 7.5,
      uHead: 8.0,
      baseCollar: 2.1
    },
    containers: {
      ft20: 18000,              // 20 呎貨櫃估算載重（kg）—假設值
      ft40: 24000               // 40 呎貨櫃估算載重（kg）—假設值
    }
  };

  function roundTo(value, digits) {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  // 依立柱需要的淨高，組合出最少支數的立柱長度。
  function splitStandards(height, table) {
    const lengths = Object.keys(table).map(Number).sort(function (a, b) { return b - a; });
    const longest = lengths[0];
    const shortOnes = lengths.slice(1).sort(function (a, b) { return a - b; });
    const pieces = {};
    let full = Math.floor(height / longest + 1e-9);
    let remainder = roundTo(height - full * longest, 3);
    if (remainder > 0) {
      const fit = shortOnes.find(function (len) { return len >= remainder - 1e-9; });
      if (fit) {
        pieces[fit] = 1;
      } else {
        full += 1;
      }
    }
    if (full > 0) {
      pieces[longest] = full;
    }
    return pieces;
  }

  function addItem(items, code, name, spec, qty, unitKg) {
    if (qty <= 0) {
      return;
    }
    items.push({
      code: code,
      name: name,
      spec: spec,
      qty: qty,
      unitKg: unitKg,
      totalKg: roundTo(qty * unitKg, 1)
    });
  }

  function summarize(items, extra) {
    const totalKg = roundTo(items.reduce(function (sum, item) { return sum + item.totalKg; }, 0), 1);
    const totalPieces = items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    return Object.assign({
      items: items,
      totalKg: totalKg,
      totalPieces: totalPieces,
      containers20: Math.max(1, Math.ceil(totalKg / DATA.containers.ft20)),
      containers40: Math.max(1, Math.ceil(totalKg / DATA.containers.ft40))
    }, extra);
  }

  function validatePositive(errors, value, label, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push(label + " must be between " + min + " and " + max + ".");
    }
  }

  // 外牆／施工通道鷹架（Ø48.6）。
  function estimateFacade(input) {
    const d = DATA.facade;
    const errors = [];
    validatePositive(errors, input.length, "Wall length", 1, 1000);
    validatePositive(errors, input.height, "Height", 2, 100);
    if (!d.decks[input.bayLength]) {
      errors.push("Bay length is not supported.");
    }
    if (!d.ledgers[input.width]) {
      errors.push("Scaffold width is not supported.");
    }
    if (errors.length) {
      return { ok: false, errors: errors };
    }

    const lifts = Math.ceil(input.height / d.liftHeight - 1e-9);
    const levels = Math.min(Math.max(1, Math.round(input.workingLevels || 1)), lifts);
    const bays = Math.ceil(input.length / input.bayLength - 1e-9);
    const frames = bays + 1;
    const legs = frames * 2;
    const columnHeight = Math.max(1, input.height - d.jackAllowance);
    const standardSplit = splitStandards(columnHeight, d.standards);
    const decksPerBay = Math.floor(input.width / d.deckWidth + 1e-9);
    const braceSets = Math.max(1, Math.ceil(bays / d.bracePerBays));

    const items = [];
    addItem(items, "BJ-48", "Base jack", "600 mm", legs, d.baseJack);
    addItem(items, "BC-48", "Base collar", "Ø48.6", legs, d.baseCollar);
    Object.keys(standardSplit).map(Number).sort(function (a, b) { return b - a; }).forEach(function (len) {
      addItem(items, "STD-48-" + len.toFixed(1), "Standard (vertical)", "Ø48.6 × " + len.toFixed(1) + " m",
        standardSplit[len] * legs, d.standards[len]);
    });
    addItem(items, "LED-48-" + input.bayLength, "Ledger (longitudinal)", input.bayLength + " m",
      2 * bays * (lifts + 1) + bays * levels, d.ledgers[input.bayLength]);
    addItem(items, "LED-48-" + input.width, "Ledger (transom)", input.width + " m",
      frames * (lifts + 1), d.ledgers[input.width]);
    addItem(items, "DIA-48-" + input.bayLength, "Vertical diagonal", input.bayLength + " × " + d.liftHeight + " m",
      braceSets * lifts, d.diagonals[input.bayLength]);
    addItem(items, "DK-" + input.bayLength, "Steel deck", "320 mm × " + input.bayLength + " m",
      decksPerBay * bays * levels, d.decks[input.bayLength]);
    if (input.wallTies) {
      addItem(items, "WT-48", "Wall tie", "Adjustable",
        (Math.ceil(input.length / d.tieSpacingH) + 1) * Math.ceil(input.height / d.tieSpacingV), d.wallTie);
    }

    return Object.assign({ ok: true, errors: [] }, summarize(items, {
      system: "facade",
      geometry: { bays: bays, lifts: lifts, levels: levels, bayLength: input.bayLength, liftHeight: d.liftHeight, height: input.height }
    }));
  }

  // 重型支撐架（Ø60.2），依樓板厚度自動選擇立柱間距。
  function estimateShoring(input) {
    const d = DATA.shoring;
    const errors = [];
    validatePositive(errors, input.areaLength, "Area length", 1, 500);
    validatePositive(errors, input.areaWidth, "Area width", 1, 500);
    validatePositive(errors, input.height, "Shoring height", 1.5, 40);
    validatePositive(errors, input.slabThickness, "Slab thickness", 0.1, 3);
    if (errors.length) {
      return { ok: false, errors: errors };
    }

    const loadKNm2 = roundTo(d.concreteKNm3 * input.slabThickness + d.formworkKNm2 + d.liveKNm2, 2);
    const spacing = d.spacings.find(function (s) { return loadKNm2 * s * s <= d.allowableLegKN; });
    if (!spacing) {
      return {
        ok: false,
        errors: ["The design load (" + loadKNm2 + " kN/m²) is beyond this estimator. Please request a design evaluation from our engineers."]
      };
    }

    const legLoadKN = roundTo(loadKNm2 * spacing * spacing, 1);
    const nx = Math.ceil(input.areaLength / spacing - 1e-9) + 1;
    const ny = Math.ceil(input.areaWidth / spacing - 1e-9) + 1;
    const legs = nx * ny;
    const columnHeight = Math.max(1, input.height - d.jackAllowance);
    const lifts = Math.ceil(columnHeight / d.liftHeight - 1e-9);
    const standardSplit = splitStandards(columnHeight, d.standards);
    const ledgerCount = ((nx - 1) * ny + (ny - 1) * nx) * (lifts + 1);
    const perimeterBays = 2 * (nx - 1) + 2 * (ny - 1);
    const innerLines = Math.floor((ny - 2) / 3);
    const diagonalCount = (Math.ceil(perimeterBays / 2) + innerLines * Math.ceil((nx - 1) / 2)) * lifts;

    const items = [];
    addItem(items, "BJ-60", "Base jack", "Ø60.2 × 600 mm", legs, d.baseJack);
    addItem(items, "BC-60", "Base collar", "Ø60.2", legs, d.baseCollar);
    Object.keys(standardSplit).map(Number).sort(function (a, b) { return b - a; }).forEach(function (len) {
      addItem(items, "STD-60-" + len.toFixed(1), "Standard (vertical)", "Ø60.2 × " + len.toFixed(1) + " m",
        standardSplit[len] * legs, d.standards[len]);
    });
    addItem(items, "LED-60-" + spacing, "Ledger", spacing + " m", ledgerCount, d.ledgers[spacing]);
    addItem(items, "DIA-60-" + spacing, "Vertical diagonal", spacing + " × " + d.liftHeight + " m", diagonalCount, d.diagonals[spacing]);
    addItem(items, "UH-60", "U-head jack", "Ø60.2 × 600 mm", legs, d.uHead);

    return Object.assign({ ok: true, errors: [] }, summarize(items, {
      system: "shoring",
      geometry: { nx: nx, ny: ny, spacing: spacing, lifts: lifts, height: input.height },
      design: {
        loadKNm2: loadKNm2,
        legLoadKN: legLoadKN,
        allowableLegKN: d.allowableLegKN,
        utilization: Math.round(legLoadKN / d.allowableLegKN * 100)
      }
    }));
  }

  function toCsv(result) {
    const rows = [["Code", "Item", "Specification", "Qty (pcs)", "Unit weight (kg)", "Total weight (kg)"]];
    result.items.forEach(function (item) {
      rows.push([item.code, item.name, item.spec, item.qty, item.unitKg, item.totalKg]);
    });
    rows.push(["", "Total", "", result.totalPieces, "", result.totalKg]);
    return rows.map(function (row) {
      return row.map(function (cell) {
        const text = String(cell);
        return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
      }).join(",");
    }).join("\r\n");
  }

  const api = { DATA: DATA, estimateFacade: estimateFacade, estimateShoring: estimateShoring, toCsv: toCsv };
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ScaffoldCalc = api;
  }
})(typeof window !== "undefined" ? window : this);
