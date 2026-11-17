// 鷹架配置估算：純計算邏輯，不碰畫面，瀏覽器與 Node 都能載入。
//
// 規格來源（2026-11 查閱）：
//   - sucoot.com 產品頁：Facade (Light Duty) Scaffolding、Ø60.2 Shoring (Heavy Duty) Scaffolding
//   - 官方型錄：Ring System Access Scaffolding (2026)、Ring System Scaffold (2026)
// 每個構件標示重量來源：
//   src: "catalog"  → 型錄上的單位重量
//   src: "estimate" → 型錄未列重量，依同系列已知重量或鋼管尺寸推估，需工程部確認
//   custom: true    → 型錄沒有這個標準尺寸，需訂製
// 單支立柱容許荷重與貨櫃載重仍是假設值，型錄與官網都沒有公開。
(function (root) {
  "use strict";

  function part(kg, src, extra) {
    return Object.assign({ kg: kg, src: src }, extra || {});
  }
  const C = "catalog";
  const E = "estimate";

  const DATA = {
    isPlaceholder: true,
    facade: {
      liftHeight: 2.0,          // 斜桿標準高度 2.0 m
      jackRange: [0.08, 0.5],   // Jack Base 可調範圍 80–500 mm（型錄 5.1）
      bracePerBays: 3,          // 每幾個跨距設一組斜桿（假設）
      tieSpacingH: 6.0,         // 壁連座水平間距（假設）
      tieSpacingV: 4.0,         // 壁連座垂直間距（假設）
      bayLengths: [0.9, 1.2, 1.5, 1.8, 2.4],
      widths: [0.9, 1.2],
      // 立柱 Ø48.6 × t2.5 mm，STK500，環距 500 mm；sucoot.com 規格品長度 1.0／1.5／2.0／3.0 m
      verticals: {
        3.0: part(11.79, E),
        2.0: part(8.11, C),
        1.5: part(6.31, C),
        1.0: part(4.43, C)
      },
      // 橫桿 Ø42.7 × t2.3 mm，STK500
      horizontals: {
        0.9: part(2.62, E),
        1.2: part(3.34, C),
        1.5: part(4.06, E),
        1.8: part(4.78, C),
        2.4: part(6.22, E)
      },
      // 斜桿 Ø42.7 × t2.3 mm，跨距 × 2.0 m；型錄只有 1.2、1.5、1.8
      diagonals: {
        0.9: part(6.34, E, { custom: true }),
        1.2: part(6.60, C),
        1.5: part(6.91, E),
        1.8: part(7.26, C),
        2.4: part(8.06, E, { custom: true })
      },
      // 踏板寬 550 mm、側踏板寬 265 mm；型錄長度 1.2、1.5、1.8 m
      planks: {
        0.9: part(10.1, E, { custom: true }),
        1.2: part(13.5, E),
        1.5: part(16.8, E),
        1.8: part(20.2, E),
        2.4: part(26.9, E, { custom: true })
      },
      sidePlanks: {
        0.9: part(4.9, E, { custom: true }),
        1.2: part(6.50, C),
        1.5: part(8.1, E),
        1.8: part(9.7, E),
        2.4: part(13.0, E, { custom: true })
      },
      // 鋁製擋腳板；型錄長度 1.2、1.8 m
      toeBoards: {
        0.9: part(0.71, E, { custom: true }),
        1.2: part(0.92, C),
        1.5: part(1.13, E, { custom: true }),
        1.8: part(1.34, C),
        2.4: part(1.76, E, { custom: true })
      },
      // 架寬（橫向橫桿長度）對應的踏板組合
      deckLayout: {
        0.9: { planks: 1, sidePlanks: 1 },
        1.2: { planks: 2, sidePlanks: 0 }
      },
      jackBase: part(3.55, C),  // Ø38.5 × t4.0 × 600 mm
      wallTie: part(3.0, E)
    },
    shoring: {
      liftHeight: 1.5,          // 斜桿標準高度 1.5 m
      jackRange: [0.16, 0.9],   // Jack Base + U-Head Jack 合計可調範圍（各 80–450 mm）
      socketLength: 0.2,        // Basic Socket V62020
      allowableLegKN: 45,       // 單支立柱容許荷重（kN）—假設值，需工程部提供
      concreteKNm3: 25,
      formworkKNm2: 1.0,
      liveKNm2: 2.5,
      spacings: [2.4, 1.8, 1.5, 1.2, 0.9, 0.6],
      // 立柱 Ø60.2 × t3.2 mm（附接頭），環距 500 mm；sucoot.com 規格品長度 1.0／1.5／2.0／3.0 m
      verticals: {
        3.0: part(18.3, E, { code: "V61300" }),
        2.0: part(12.6, E, { code: "V61200" }),
        1.5: part(9.8, E, { code: "V61150" }),
        1.0: part(6.9, E, { code: "V61100" })
      },
      // 橫桿 Ø48.6 × t2.3 mm
      horizontals: {
        0.6: part(2.1, E, { code: "H66060" }),
        0.9: part(2.9, E, { code: "H66090" }),
        1.2: part(3.8, E, { code: "H66120" }),
        1.5: part(4.6, E, { code: "H66150" }),
        1.8: part(5.4, E, { code: "H66180" }),
        2.4: part(7.0, E, { code: "H66240" })
      },
      // 斜桿 Ø48.6 × t2.3 mm，跨距 × 1.5 m
      diagonals: {
        0.6: part(5.6, E, { code: "D60615" }),
        0.9: part(5.9, E, { code: "D60915" }),
        1.2: part(6.4, E, { code: "D61215" }),
        1.5: part(6.9, E, { code: "D61515" }),
        1.8: part(7.5, E, { code: "D61815" }),
        2.4: part(8.7, E, { code: "D62415" })
      },
      basicSocket: part(2.1, E, { code: "V62020" }),
      jackBase: part(5.1, E, { code: "J48601" }),   // Ø48.2 × t5.0 × 600 mm
      uHead: part(5.8, E, { code: "U48601" })       // Ø48.2 × t5.0 × 600 mm
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

  function lengthLabel(value) {
    return value.toFixed(1) + " m";
  }

  // 用規格品立柱組出每一支立柱位置的高度：
  //   1. 立柱總長取 0.5 m 的倍數（所有規格品長度都是 0.5 m 的倍數），
  //      讓剩下的高度落在調整座可調範圍內；
  //   2. 在相同總長下，使用最少支數，支數相同時優先用長的立柱。
  // height：要達到的高度；fixed：立柱以外的固定高度（例如 Basic Socket）；range：調整座可調範圍。
  function planVerticalStack(height, table, fixed, range) {
    const unit = 0.5;
    const lengths = Object.keys(table).map(Number).sort(function (a, b) { return b - a; });
    const available = height - fixed;
    let units = Math.floor((available - range[0]) / unit + 1e-9);
    if (available - units * unit > range[1] + 1e-9) {
      units += 1;
    }
    units = Math.max(units, Math.round(lengths[lengths.length - 1] / unit));
    const stackLength = roundTo(units * unit, 2);
    const extension = roundTo(Math.min(Math.max(available - stackLength, range[0]), range[1]), 2);

    // 動態規劃：best[u] = 組出 u 個單位長度的最佳組合（支數最少，再比長立柱數量）。
    const pieceUnits = lengths.map(function (len) { return Math.round(len / unit); });
    const best = [[]];
    for (let u = 1; u <= units; u++) {
      let choice = null;
      pieceUnits.forEach(function (pu, index) {
        if (pu > u || !best[u - pu]) {
          return;
        }
        const candidate = best[u - pu].concat(index).sort(function (x, y) { return x - y; });
        if (!choice || candidate.length < choice.length ||
            (candidate.length === choice.length && candidate.join() < choice.join())) {
          choice = candidate;
        }
      });
      best[u] = choice;
    }
    const pieces = {};
    (best[units] || []).forEach(function (index) {
      const len = lengths[index];
      pieces[len] = (pieces[len] || 0) + 1;
    });
    return {
      pieces: pieces,
      sequence: (best[units] || []).map(function (index) { return lengths[index]; }),
      stackLength: stackLength,
      extension: extension,
      topHeight: roundTo(fixed + stackLength + extension, 2)
    };
  }

  function addItem(items, name, spec, qty, component) {
    if (qty <= 0) {
      return;
    }
    const existing = items.find(function (item) { return item.name === name && item.spec === spec; });
    if (existing) {
      existing.qty += qty;
      existing.totalKg = roundTo(existing.qty * existing.unitKg, 1);
      return;
    }
    items.push({
      code: component.code || "",
      name: name,
      spec: spec,
      qty: qty,
      unitKg: component.kg,
      totalKg: roundTo(qty * component.kg, 1),
      weightSource: component.src,
      custom: Boolean(component.custom)
    });
  }

  function summarize(items, extra) {
    const totalKg = roundTo(items.reduce(function (sum, item) { return sum + item.totalKg; }, 0), 1);
    const totalPieces = items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    return Object.assign({
      items: items,
      totalKg: totalKg,
      totalPieces: totalPieces,
      hasEstimates: items.some(function (item) { return item.weightSource === E; }),
      hasCustom: items.some(function (item) { return item.custom; }),
      containers20: Math.max(1, Math.ceil(totalKg / DATA.containers.ft20)),
      containers40: Math.max(1, Math.ceil(totalKg / DATA.containers.ft40))
    }, extra);
  }

  function validateRange(errors, value, label, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push(label + " must be between " + min + " and " + max + ".");
    }
  }

  function addVerticals(items, stack, table, legs, tube) {
    Object.keys(stack.pieces).map(Number).sort(function (a, b) { return b - a; }).forEach(function (len) {
      addItem(items, "Vertical", tube + " × " + lengthLabel(len), stack.pieces[len] * legs, table[len]);
    });
  }

  // Wall length ÷ Bay length：整跨數與餘數。
  function splitBays(length, bayLength) {
    const fullBays = Math.floor(length / bayLength + 1e-9);
    const remainder = roundTo(length - fullBays * bayLength, 2);
    return { fullBays: fullBays, remainder: remainder <= 0.005 ? 0 : remainder };
  }

  // 找出最佳跨距組合：主跨數量可往下調整，最後一段用 1～2 支標準 Horizontal 補足，
  // 讓總長剛好蓋滿牆長、超出最少。排序：超出長度 → 非標準尺寸數 → 補跨支數 → 主跨數多者優先。
  const MAX_FILLERS = 2;
  const PLAN_LIMIT = 5;

  function fillerCombos(lengths) {
    const combos = [[]];
    lengths.forEach(function (a, i) {
      combos.push([a]);
      if (MAX_FILLERS >= 2) {
        lengths.slice(i).forEach(function (b) {
          combos.push([b, a]);
        });
      }
    });
    return combos;
  }

  function planBays(length, bayLength) {
    const d = DATA.facade;
    const split = splitBays(length, bayLength);
    const combos = fillerCombos(d.bayLengths);
    const longest = d.bayLengths[d.bayLengths.length - 1];
    const minFull = Math.max(0, split.fullBays - Math.ceil((MAX_FILLERS * longest) / bayLength));
    const plans = [];

    for (let n = split.fullBays; n >= minFull; n--) {
      const base = n * bayLength;
      combos.forEach(function (fillers) {
        if (n === 0 && fillers.length === 0) {
          return;
        }
        const covered = roundTo(base + fillers.reduce(function (sum, len) { return sum + len; }, 0), 2);
        const overshoot = roundTo(covered - length, 2);
        if (overshoot < -0.005) {
          return;
        }
        // 補跨長度與主跨相同時，視為多一個整跨，避免重複的組合。
        const extraFull = fillers.filter(function (len) { return len === bayLength; }).length;
        const ownFillers = fillers.filter(function (len) { return len !== bayLength; });
        plans.push({
          fullBays: n + extraFull,
          fillers: ownFillers,
          covered: covered,
          overshoot: Math.max(0, overshoot),
          customCount: ownFillers.filter(function (len) { return d.diagonals[len].custom || d.planks[len].custom; }).length
        });
      });
    }

    plans.sort(comparePlans);
    const seen = {};
    const ranked = plans.filter(function (plan) {
      const key = plan.fullBays + "|" + plan.fillers.join(",");
      if (seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    }).slice(0, PLAN_LIMIT);
    // 另外提供「不補跨」：只用整跨，可能略短於牆長。
    if (split.remainder > 0 && split.fullBays > 0) {
      ranked.push({
        fullBays: split.fullBays,
        fillers: [],
        covered: roundTo(split.fullBays * bayLength, 2),
        overshoot: -split.remainder,
        customCount: 0
      });
    }
    return { fullBays: split.fullBays, remainder: split.remainder, plans: ranked, best: ranked[0] };
  }

  function comparePlans(a, b) {
    return (a.overshoot - b.overshoot) ||
      (a.customCount - b.customCount) ||
      (a.fillers.length - b.fillers.length) ||
      (b.fullBays - a.fullBays);
  }

  // 外牆／施工通道鷹架（Access / Facade, Ø48.6）。
  // input.fullBays 與 input.fillers：指定跨距組合；未指定時自動採用最佳組合。
  function estimateFacade(input) {
    const d = DATA.facade;
    const errors = [];
    validateRange(errors, input.length, "Wall length", 1, 1000);
    validateRange(errors, input.height, "Height", 2, 100);
    if (!d.horizontals[input.bayLength]) {
      errors.push("Bay length is not supported.");
    }
    if (!d.deckLayout[input.width]) {
      errors.push("Scaffold width is not supported.");
    }
    if (errors.length) {
      return { ok: false, errors: errors };
    }

    const bay = input.bayLength;
    const plan = planBays(input.length, bay);
    let fullBays = plan.best ? plan.best.fullBays : 0;
    let fillers = plan.best ? plan.best.fillers : [];
    if (Array.isArray(input.fillers) && Number.isInteger(input.fullBays)) {
      fullBays = input.fullBays;
      fillers = input.fillers.map(Number);
      const invalid = fillers.some(function (len) { return d.bayLengths.indexOf(len) === -1; });
      if (invalid || fullBays < 0 || fillers.length > MAX_FILLERS || fullBays + fillers.length === 0) {
        return { ok: false, errors: ["The selected bay layout is not supported."] };
      }
    }

    const bayGroups = [];
    if (fullBays > 0) {
      bayGroups.push({ length: bay, count: fullBays });
    }
    fillers.forEach(function (len) {
      const group = bayGroups.find(function (g) { return g.length === len; });
      if (group) {
        group.count += 1;
      } else {
        bayGroups.push({ length: len, count: 1 });
      }
    });
    const bayWidths = [];
    for (let i = 0; i < fullBays; i++) {
      bayWidths.push(bay);
    }
    fillers.forEach(function (len) { bayWidths.push(len); });
    const coveredLength = roundTo(bayWidths.reduce(function (sum, w) { return sum + w; }, 0), 2);

    const bays = bayWidths.length;
    const lifts = Math.ceil(input.height / d.liftHeight - 1e-9);
    const levels = Math.min(Math.max(1, Math.round(input.workingLevels || 1)), lifts);
    const frames = bays + 1;
    const legs = frames * 2;
    const stack = planVerticalStack(input.height, d.verticals, 0, d.jackRange);
    const braceBay = bayGroups[0].length;
    const braceSets = Math.max(1, Math.ceil(bayGroups[0].count / d.bracePerBays));
    const layout = d.deckLayout[input.width];
    const tube = "Ø48.6 × t2.5";
    const rail = "Ø42.7 × t2.3";

    const items = [];
    addItem(items, "Jack Base", "Ø38.5 × t4.0 × 600 mm", legs, d.jackBase);
    addVerticals(items, stack, d.verticals, legs, tube);
    bayGroups.forEach(function (group) {
      addItem(items, "Horizontal (bay)", rail + " × " + lengthLabel(group.length),
        2 * group.count * (lifts + 1) + group.count * levels, d.horizontals[group.length]);
    });
    addItem(items, "Horizontal (width)", rail + " × " + lengthLabel(input.width),
      frames * (lifts + 1), d.horizontals[input.width]);
    addItem(items, "Diagonal", rail + ", " + braceBay.toFixed(1) + " × " + d.liftHeight.toFixed(1) + " m",
      braceSets * lifts, d.diagonals[braceBay]);
    bayGroups.forEach(function (group) {
      addItem(items, "Plank", "550 × " + Math.round(group.length * 1000) + " mm",
        layout.planks * group.count * levels, d.planks[group.length]);
    });
    bayGroups.forEach(function (group) {
      addItem(items, "Side Plank", "265 × " + Math.round(group.length * 1000) + " mm",
        layout.sidePlanks * group.count * levels, d.sidePlanks[group.length]);
    });
    bayGroups.forEach(function (group) {
      addItem(items, "Toe Board", "Aluminum, " + lengthLabel(group.length), group.count * levels, d.toeBoards[group.length]);
    });
    if (input.wallTies) {
      addItem(items, "Wall Tie", "Site specific",
        (Math.ceil(input.length / d.tieSpacingH) + 1) * Math.ceil(input.height / d.tieSpacingV), d.wallTie);
    }

    return Object.assign({ ok: true, errors: [] }, summarize(items, {
      system: "facade",
      verticalStack: stack,
      split: { fullBays: plan.fullBays, remainder: plan.remainder },
      layout: { fullBays: fullBays, fillers: fillers, covered: coveredLength, difference: roundTo(coveredLength - input.length, 2) },
      geometry: {
        bays: bays,
        fullBays: fullBays,
        fillers: fillers,
        bayWidths: bayWidths,
        lifts: lifts,
        levels: levels,
        bayLength: bay,
        coveredLength: coveredLength,
        liftHeight: d.liftHeight,
        height: input.height
      }
    }));
  }

  // 重型支撐架（Shoring, Ø60.2），依樓板荷重自動選擇橫桿長度（立柱間距）。
  function estimateShoring(input) {
    const d = DATA.shoring;
    const errors = [];
    validateRange(errors, input.areaLength, "Area length", 1, 500);
    validateRange(errors, input.areaWidth, "Area width", 1, 500);
    validateRange(errors, input.height, "Shoring height", 1.5, 40);
    validateRange(errors, input.slabThickness, "Slab thickness", 0.1, 3);
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
    const stack = planVerticalStack(input.height, d.verticals, d.socketLength, d.jackRange);
    const lifts = Math.ceil(stack.stackLength / d.liftHeight - 1e-9);
    const horizontalCount = ((nx - 1) * ny + (ny - 1) * nx) * (lifts + 1);
    const perimeterBays = 2 * (nx - 1) + 2 * (ny - 1);
    const innerLines = Math.floor((ny - 2) / 3);
    const diagonalCount = (Math.ceil(perimeterBays / 2) + innerLines * Math.ceil((nx - 1) / 2)) * lifts;
    const tube = "Ø60.2 × t3.2";
    const rail = "Ø48.6 × t2.3";

    const items = [];
    addItem(items, "Jack Base", "Ø48.2 × t5.0 × 600 mm", legs, d.jackBase);
    addItem(items, "Basic Socket", tube + " × 0.2 m", legs, d.basicSocket);
    addVerticals(items, stack, d.verticals, legs, tube);
    addItem(items, "Horizontal", rail + " × " + lengthLabel(spacing), horizontalCount, d.horizontals[spacing]);
    addItem(items, "Diagonal", rail + ", " + spacing.toFixed(1) + " × " + d.liftHeight.toFixed(1) + " m", diagonalCount, d.diagonals[spacing]);
    addItem(items, "U-Head Jack", "Ø48.2 × t5.0 × 600 mm", legs, d.uHead);

    return Object.assign({ ok: true, errors: [] }, summarize(items, {
      system: "shoring",
      verticalStack: stack,
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
    const rows = [["Code", "Item", "Specification", "Qty (pcs)", "Unit weight (kg)", "Total weight (kg)", "Weight source", "Standard size"]];
    result.items.forEach(function (item) {
      rows.push([item.code, item.name, item.spec, item.qty, item.unitKg, item.totalKg,
        item.weightSource === E ? "Estimated" : "Catalog", item.custom ? "Custom" : "Standard"]);
    });
    rows.push(["", "Total", "", result.totalPieces, "", result.totalKg, "", ""]);
    return rows.map(function (row) {
      return row.map(function (cell) {
        const text = String(cell);
        return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
      }).join(",");
    }).join("\r\n");
  }

  const api = { DATA: DATA, splitBays: splitBays, planBays: planBays, planVerticalStack: planVerticalStack, estimateFacade: estimateFacade, estimateShoring: estimateShoring, toCsv: toCsv };
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ScaffoldCalc = api;
  }
})(typeof window !== "undefined" ? window : this);
