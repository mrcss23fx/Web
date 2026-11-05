/* Tickora · gráfico propio (KLineChart 10, Apache 2.0)
   Interfaz de trabajo al estilo de las plataformas profesionales: barra superior, herramientas de dibujo por grupos,
   barra flotante para el dibujo elegido, ventana de indicadores, ajustes de colores, captura y modo «volver atrás» con simuladas.
   Iconos y diseño propios de Tickora. */
(function () {
  "use strict";
  const KC = window.klinecharts;
  if (!KC) { window.TkChart = null; return; }

  const NUMF = "Inter, system-ui, -apple-system, sans-serif";
  const TFS = [["1m", "1 minuto", { type: "minute", span: 1 }], ["5m", "5 minutos", { type: "minute", span: 5 }], ["15m", "15 minutos", { type: "minute", span: 15 }],
    ["30m", "30 minutos", { type: "minute", span: 30 }], ["1h", "1 hora", { type: "hour", span: 1 }], ["4h", "4 horas", { type: "hour", span: 4 }],
    ["1d", "1 día", { type: "day", span: 1 }], ["1w", "1 semana", { type: "week", span: 1 }]];
  const TF_SHORT = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "1d": "1D", "1w": "1S" };
  const TF_MS = { "1m": 6e4, "5m": 3e5, "15m": 9e5, "30m": 18e5, "1h": 36e5, "4h": 144e5, "1d": 864e5, "1w": 6048e5 };
  const CRYPTO = /^(BTC|ETH|SOL|XRP|BNB|ADA|DOGE|LTC|AVAX|DOT|LINK|TRX|TON|MATIC|SHIB)/;
  const PALETTE = ["#2443c7", "#14213a", "#0e9aa7", "#2f8f67", "#e0a33a", "#d9822b", "#c2412f", "#d6336c", "#7b4fd6", "#8a93a8"];
  let CUR_TF = "5m", CUR_DIGITS = 5;

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (v, d) => Number(v).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtR = r => (r > 0 ? "+" : r < 0 ? "−" : "") + nf(Math.abs(r), 1) + " R";
  const binSym = s => { const c = String(s).toUpperCase().replace(/[^A-Z]/g, ""); const m = c.match(CRYPTO); return m ? m[1] + "USDT" : null; };
  const guessDigits = s => { const c = String(s).toUpperCase(); if (binSym(c)) return /^(XRP|ADA|DOGE|TRX|SHIB|MATIC)/.test(c) ? 4 : 2; if (/JPY/.test(c)) return 3; if (/XAU|GOLD/.test(c)) return 2; if (/XAG|SILVER|OIL|WTI|BRENT/.test(c)) return 3; if (/^[A-Z]{6}/.test(c) && !/(NAS|US|GER|UK|SPA|FRA|JPN|DE|SPX|DJ)\d/.test(c)) return 5; return 1; };
  const alpha = (hex, a) => { if (!hex || hex[0] !== "#") return hex; let h = hex.slice(1); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const dur = ms => { const m = Math.round(Math.abs(ms) / 6e4); if (m < 60) return m + " min"; const h = Math.floor(m / 60), r = m % 60; if (h < 48) return h + " h" + (r ? " " + r + " min" : ""); return Math.round(h / 24) + " días"; };

  KC.registerLocale("es-ES", { time: "Hora: ", open: "Ap: ", high: "Máx: ", low: "Mín: ", close: "Cierre: ", volume: "Vol: ", change: "Cambio: ", turnover: "Importe: ", second: "s", minute: "min", hour: "h", day: "D", week: "S", month: "M", year: "A" });

  /* ---------- colores ---------- */
  let DARK = false;
  const CFG_DEF = { up: null, down: null, bg: null, grid: true, type: "candle_solid" };
  let CFG = Object.assign({}, CFG_DEF, ls.get("tk-cfg", {}));
  function pal() {
    return DARK ? { tinta: "#e9edf6", suave: "#8f9ab3", linea: "#232f4a", borde: "#33405f", card: "#141d33", cob: "#7b93ff", cobA: "rgba(123,147,255,.16)", stopA: "rgba(233,237,246,.10)", rot: "#fbe27a" }
      : { tinta: "#14213a", suave: "#556079", linea: "#e9edf3", borde: "#c9d1de", card: "#ffffff", cob: "#2443c7", cobA: "rgba(36,67,199,.12)", stopA: "rgba(20,33,58,.10)", rot: "#fbe27a" };
  }
  const upC = () => CFG.up || pal().cob, downC = () => CFG.down || (DARK ? "#c6cee0" : "#14213a");
  function styles() {
    const p = pal(), up = upC(), down = downC();
    const axis = { axisLine: { color: p.borde }, tickLine: { color: p.borde }, tickText: { color: p.suave, family: NUMF, size: 11 } };
    const ctext = { color: DARK ? "#0e1526" : "#ffffff", backgroundColor: p.tinta, borderColor: p.tinta, family: NUMF, size: 11 };
    return {
      grid: { show: CFG.grid, horizontal: { color: p.linea }, vertical: { color: p.linea } },
      candle: {
        type: CFG.type,
        bar: { upColor: up, downColor: down, noChangeColor: p.suave, upBorderColor: up, downBorderColor: down, noChangeBorderColor: p.suave, upWickColor: up, downWickColor: down, noChangeWickColor: p.suave },
        area: { lineColor: p.cob, backgroundColor: [{ offset: 0, color: alpha(p.cob.length === 7 ? p.cob : "#2443c7", .02) }, { offset: 1, color: alpha(p.cob.length === 7 ? p.cob : "#2443c7", .22) }] },
        priceMark: { high: { color: p.suave, textFamily: NUMF }, low: { color: p.suave, textFamily: NUMF }, last: { upColor: up, downColor: down, noChangeColor: p.suave, text: { family: NUMF, size: 11, color: "#ffffff" } } },
        tooltip: { text: { color: p.suave, family: NUMF, size: 11 } }
      },
      indicator: { tooltip: { text: { color: p.suave, family: NUMF, size: 11 } }, lastValueMark: { text: { family: NUMF } }, lines: IND_COLORS().map(c => ({ color: c, size: 1.5, style: "solid", smooth: false, dashedValue: [2, 2] })) },
      xAxis: axis, yAxis: axis,
      separator: { color: p.linea, activeBackgroundColor: p.cobA },
      crosshair: { horizontal: { line: { color: p.suave }, text: ctext }, vertical: { line: { color: p.suave }, text: ctext } },
      overlay: {
        point: { color: p.cob, borderColor: p.cobA, activeColor: p.cob, activeBorderColor: p.cobA },
        line: { color: p.cob, size: 1.5 }, rect: { color: p.cobA, borderColor: p.cob }, polygon: { color: p.cobA, borderColor: p.cob },
        text: { color: p.tinta, family: "Inter, system-ui, sans-serif" },
        rectText: { color: "#ffffff", backgroundColor: p.cob, borderColor: p.cob, family: NUMF }
      }
    };
  }
  const IND_COLORS = () => DARK ? ["#7b93ff", "#e0a33a", "#c6cee0", "#4fbf8f", "#d6336c", "#0e9aa7"] : ["#2443c7", "#d9822b", "#14213a", "#2f8f67", "#d6336c", "#0e9aa7"];

  /* ---------- estilo de cada dibujo ---------- */
  const sty = o => { const ed = o.extendData || {}; return { color: ed.color || pal().cob, width: ed.width || 1.5, dash: ed.dash || "solid", text: ed.text || "", size: ed.size || 14, fill: ed.fill !== false }; };
  const lineSt = s => ({ color: s.color, size: s.width, style: s.dash === "solid" ? "solid" : "dashed", dashedValue: s.dash === "dotted" ? [2, 3] : [6, 4] });
  const textSt = (s, x) => Object.assign({ color: s.color, size: s.size, family: "Inter, system-ui, sans-serif", weight: 500, backgroundColor: "transparent", borderSize: 0, borderColor: "transparent", paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 4 }, x || {});
  const labelSt = (s, x) => textSt(s, Object.assign({ color: "#ffffff", backgroundColor: s.color, size: 12, family: NUMF, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }, x || {}));
  const fmtP = v => nf(v, CUR_DIGITS);
  function reg(name, totalStep, fig, extra) {
    KC.registerOverlay(Object.assign({ name, totalStep, needDefaultPointFigure: true, needDefaultXAxisFigure: true, needDefaultYAxisFigure: true, createPointFigures: p => fig(p) || [] }, extra || {}));
  }
  reg("tkRect", 3, ({ coordinates: c, overlay: o }) => {
    if (c.length < 2) return [];
    const s = sty(o), x = Math.min(c[0].x, c[1].x), y = Math.min(c[0].y, c[1].y), w = Math.abs(c[1].x - c[0].x), h = Math.abs(c[1].y - c[0].y);
    const f = [{ type: "rect", attrs: { x, y, width: w, height: h }, styles: { style: s.fill ? "stroke_fill" : "stroke", color: alpha(s.color, .14), borderColor: s.color, borderSize: s.width, borderStyle: s.dash === "solid" ? "solid" : "dashed", borderDashedValue: s.dash === "dotted" ? [2, 3] : [6, 4] } }];
    if (s.text) f.push({ type: "text", ignoreEvent: true, attrs: { x: x + w / 2, y: y + h / 2, text: s.text, align: "center", baseline: "middle" }, styles: textSt(s, { color: pal().tinta }) });
    return f;
  });
  reg("tkCircle", 3, ({ coordinates: c, overlay: o }) => {
    if (c.length < 2) return [];
    const s = sty(o), r = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y);
    const f = [{ type: "circle", attrs: { x: c[0].x, y: c[0].y, r }, styles: { style: s.fill ? "stroke_fill" : "stroke", color: alpha(s.color, .14), borderColor: s.color, borderSize: s.width } }];
    if (s.text) f.push({ type: "text", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, text: s.text, align: "center", baseline: "middle" }, styles: textSt(s, { color: pal().tinta }) });
    return f;
  });
  reg("tkTriangle", 4, ({ coordinates: c, overlay: o }) => {
    const s = sty(o);
    if (c.length < 3) return [{ type: "line", attrs: { coordinates: c }, styles: lineSt(s) }];
    return [{ type: "polygon", attrs: { coordinates: c }, styles: { style: s.fill ? "stroke_fill" : "stroke", color: alpha(s.color, .14), borderColor: s.color, borderSize: s.width } }];
  });
  reg("tkArrow", 3, ({ coordinates: c, overlay: o }) => {
    if (c.length < 2) return [];
    const s = sty(o), a = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x), L = 10 + s.width * 2;
    const h1 = { x: c[1].x - L * Math.cos(a - 0.45), y: c[1].y - L * Math.sin(a - 0.45) }, h2 = { x: c[1].x - L * Math.cos(a + 0.45), y: c[1].y - L * Math.sin(a + 0.45) };
    return [{ type: "line", attrs: { coordinates: [c[0], c[1]] }, styles: lineSt(s) }, { type: "polygon", attrs: { coordinates: [c[1], h1, h2] }, styles: { style: "fill", color: s.color } }];
  });
  reg("tkText", 2, ({ coordinates: c, overlay: o }) => {
    const s = sty(o);
    return [{ type: "text", attrs: { x: c[0].x, y: c[0].y, text: s.text || "Texto", align: "left", baseline: "middle" }, styles: textSt(s, { weight: 600, backgroundColor: (o.extendData || {}).bg ? alpha(s.color, .12) : "transparent" }) }];
  }, { needDefaultXAxisFigure: false });
  reg("tkCallout", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o), f = [];
    if (c.length > 1) f.push({ type: "line", attrs: { coordinates: [c[0], c[1]] }, styles: { color: s.color, size: 1.5 } });
    f.push({ type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: 3 }, styles: { style: "fill", color: s.color } });
    const at = c[1] || c[0];
    f.push({ type: "text", attrs: { x: at.x, y: at.y, text: s.text || "Nota", align: "left", baseline: "middle" }, styles: textSt(s, { color: "#ffffff", backgroundColor: s.color, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, size: Math.min(s.size, 16) }) });
    return f;
  });
  reg("tkPriceLabel", 2, ({ coordinates: c, overlay: o }) => {
    const s = sty(o), v = o.points[0] && o.points[0].value;
    return [{ type: "text", attrs: { x: c[0].x, y: c[0].y, text: s.text || (v != null ? fmtP(v) : ""), align: "left", baseline: "middle" }, styles: labelSt(s) }, { type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: 3 }, styles: { style: "fill", color: s.color } }];
  }, { needDefaultXAxisFigure: false });
  KC.registerOverlay({ name: "tkFog", totalStep: 2, lock: true, needDefaultPointFigure: false, needDefaultXAxisFigure: false, needDefaultYAxisFigure: false,
    createPointFigures: ({ coordinates: c, bounding: b }) => { if (!c.length) return []; const x = Math.max(0, c[0].x + 3), P = pal();
      return [{ type: "rect", ignoreEvent: true, attrs: { x, y: 0, width: Math.max(0, b.width - x), height: b.height }, styles: { style: "fill", color: alpha(P.card, .97) } },
        { type: "line", ignoreEvent: true, attrs: { coordinates: [{ x, y: 0 }, { x, y: b.height }] }, styles: { color: "#e9b949", size: 2 } },
        { type: "text", ignoreEvent: true, attrs: { x: x + Math.max(0, b.width - x) / 2, y: b.height / 2, text: "Futuro oculto", align: "center", baseline: "middle" }, styles: { color: P.suave, size: 13, family: NUMF, weight: 600, backgroundColor: "transparent" } }]; } });
  reg("tkCross", 2, ({ coordinates: c, overlay: o, bounding: b }) => {
    const s = sty(o);
    return [{ type: "line", attrs: { coordinates: [{ x: 0, y: c[0].y }, { x: b.width, y: c[0].y }] }, styles: lineSt(s) }, { type: "line", attrs: { coordinates: [{ x: c[0].x, y: 0 }, { x: c[0].x, y: b.height }] }, styles: lineSt(s) }];
  });
  /* ---------- más herramientas de dibujo ---------- */
  const LN = (pts, s, o) => ({ type: "line", attrs: { coordinates: pts }, styles: Object.assign(lineSt(s), o || {}) });
  const LNi = (pts, s, o) => Object.assign(LN(pts, s, o), { ignoreEvent: true });
  const DASH = { style: "dashed", dashedValue: [4, 4] };
  const TX = (x, y, text, s, o, align, base) => ({ type: "text", ignoreEvent: true, attrs: { x, y, text, align: align || "left", baseline: base || "middle" }, styles: textSt(s, Object.assign({ size: 11, family: NUMF }, o || {})) });
  const POLY = (pts, s, a) => ({ type: "polygon", ignoreEvent: true, attrs: { coordinates: pts }, styles: { style: "fill", color: alpha(s.color, a == null ? .1 : a) } });
  const extendTo = (a, b, bd) => { const dx = b.x - a.x, dy = b.y - a.y; if (!dx && !dy) return b; const k = Math.max(bd.width, bd.height) * 4 / Math.hypot(dx, dy); return { x: a.x + dx * k, y: a.y + dy * k }; };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const ratio = (a, b) => b ? nf(Math.abs(a / b), 3) : "—";
  // líneas
  reg("tkInfoLine", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const p = o.points, dp = p[1].value - p[0].value, pct = p[0].value ? dp / p[0].value * 100 : 0, bars = Math.round(Math.abs((p[1].timestamp || 0) - (p[0].timestamp || 0)) / (TF_MS[CUR_TF] || 3e5));
    const ang = Math.atan2(c[0].y - c[1].y, c[1].x - c[0].x) * 180 / Math.PI;
    return [LN([c[0], c[1]], s), TX(c[1].x + 8, c[1].y, `${dp >= 0 ? "+" : "−"}${nf(Math.abs(dp), CUR_DIGITS)} (${pct >= 0 ? "+" : "−"}${nf(Math.abs(pct), 2)} %) · ${bars} velas · ${nf(ang, 1)}°`, s, { color: "#fff", backgroundColor: s.color, paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3, borderRadius: 4 })];
  });
  reg("tkAngle", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const ang = Math.atan2(c[0].y - c[1].y, c[1].x - c[0].x), r = 30, f = [LN([c[0], c[1]], s), LNi([c[0], { x: c[0].x + 60, y: c[0].y }], s, DASH)];
    f.push({ type: "arc", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r, startAngle: Math.min(0, -ang), endAngle: Math.max(0, -ang) }, styles: { color: s.color, size: 1 } });
    f.push(TX(c[0].x + r + 6, c[0].y - (ang > 0 ? 10 : -10), nf(ang * 180 / Math.PI, 1) + "°", s, { weight: 700 }));
    return f;
  });
  // canales
  reg("tkRegression", 3, ({ coordinates: c, overlay: o, chart, xAxis, yAxis }) => {
    const s = sty(o); if (c.length < 2 || !chart || !xAxis || !yAxis) return c.length > 1 ? [LN([c[0], c[1]], s)] : [];
    const L = chart.getDataList(), t0 = Math.min(o.points[0].timestamp, o.points[1].timestamp), t1 = Math.max(o.points[0].timestamp, o.points[1].timestamp);
    const seg = L.filter(k => k.timestamp >= t0 && k.timestamp <= t1); if (seg.length < 2) return [LN([c[0], c[1]], s)];
    const n = seg.length; let sx = 0, sy = 0, sxy = 0, sxx = 0; seg.forEach((k, i) => { sx += i; sy += k.close; sxy += i * k.close; sxx += i * i; });
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1), q = (sy - m * sx) / n; let dev = 0; seg.forEach((k, i) => { dev = Math.max(dev, Math.abs(k.close - (m * i + q))); });
    const X0 = xAxis.convertTimestampToPixel(seg[0].timestamp), X1 = xAxis.convertTimestampToPixel(seg[n - 1].timestamp), Y = v => yAxis.convertToPixel(v);
    const a = { x: X0, y: Y(q) }, b = { x: X1, y: Y(m * (n - 1) + q) }, au = { x: X0, y: Y(q + dev) }, bu = { x: X1, y: Y(m * (n - 1) + q + dev) }, ad = { x: X0, y: Y(q - dev) }, bd = { x: X1, y: Y(m * (n - 1) + q - dev) };
    return [POLY([au, bu, bd, ad], s, .08), LN([a, b], s), LNi([au, bu], s), LNi([ad, bd], s)];
  });
  reg("tkFlatTB", 4, ({ coordinates: c, overlay: o }) => {
    const s = sty(o), f = []; if (c.length > 1) f.push(LN([c[0], c[1]], s));
    if (c.length > 2) { const a = { x: c[0].x, y: c[2].y }, b = { x: c[1].x, y: c[2].y }; f.unshift(POLY([c[0], c[1], b, a], s)); f.push(LN([a, b], s)); }
    return f;
  });
  reg("tkDisjoint", 4, ({ coordinates: c, overlay: o }) => {
    const s = sty(o), f = []; if (c.length > 1) f.push(LN([c[0], c[1]], s));
    if (c.length > 2) { const d = { x: c[2].x + (c[1].x - c[0].x), y: c[2].y - (c[1].y - c[0].y) }; f.unshift(POLY([c[0], c[1], d, c[2]], s)); f.push(LN([c[2], d], s)); }
    return f;
  });
  function forkFig(kind) {
    return ({ coordinates: c, overlay: o, bounding: bd }) => {
      const s = sty(o); if (c.length < 2) return [];
      const f = [LN([c[0], c[1]], s, DASH)]; if (c.length < 3) return f;
      let origin = c[0];
      if (kind === "schiff") origin = { x: c[0].x, y: (c[0].y + c[1].y) / 2 };
      if (kind === "mschiff") origin = mid(c[0], c[1]);
      const m = mid(c[1], c[2]), dir = { x: m.x - origin.x, y: m.y - origin.y };
      const ray = p => [p, extendTo(p, { x: p.x + dir.x, y: p.y + dir.y }, bd)];
      const r1 = ray(c[1]), r2 = ray(c[2]);
      f.push(POLY([r1[0], r1[1], r2[1], r2[0]], s, .07));
      f.push(LN([c[1], c[2]], s), LN(ray(m).map((p, i) => i ? p : origin), s), LNi(r1, s), LNi(r2, s));
      if (kind === "inside") { f.push(LNi(ray(mid(c[1], m)), s, DASH), LNi(ray(mid(c[2], m)), s, DASH)); }
      return f;
    };
  }
  reg("tkPitchfork", 4, forkFig("std")); reg("tkSchiff", 4, forkFig("schiff")); reg("tkSchiffMod", 4, forkFig("mschiff")); reg("tkInsidePf", 4, forkFig("inside"));
  // Fibonacci y Gann
  reg("tkFibChannel", 4, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const f = [LN([c[0], c[1]], s)]; if (c.length < 3) return f;
    const dx = c[1].x - c[0].x, dy = c[1].y - c[0].y, off = c[2].y - (c[0].y + (dx ? dy * (c[2].x - c[0].x) / dx : 0));
    [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618].forEach(k => { const a = { x: c[0].x, y: c[0].y + off * k }, b = extendTo(a, { x: a.x + dx, y: a.y + dy }, bd); f.push(LNi([a, b], s, { color: alpha(s.color, k === 0 || k === 1 ? 1 : .55) }), TX(a.x - 4, a.y, nf(k, 3), s, {}, "right")); });
    return f;
  });
  reg("tkFibTime", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const dx = c[1].x - c[0].x, f = [LN([c[0], c[1]], s, DASH)]; if (Math.abs(dx) < 2) return f;
    [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89].forEach(n => { const x = c[0].x + dx * n; if (x < -5 || x > bd.width + 5) return; f.push(LNi([{ x, y: 0 }, { x, y: bd.height }], s, { color: alpha(s.color, .7) }), TX(x + 3, 12, String(n), s)); });
    return f;
  });
  reg("tkFibTrendTime", 4, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const f = [LN(c.slice(0, 3), s, DASH)]; if (c.length < 3) return f;
    const dx = c[1].x - c[0].x;
    [0, 0.382, 0.5, 0.618, 1, 1.382, 1.618, 2, 2.618].forEach(k => { const x = c[2].x + dx * k; f.push(LNi([{ x, y: 0 }, { x, y: bd.height }], s, { color: alpha(s.color, .7) }), TX(x + 3, 12, nf(k, 3), s)); });
    return f;
  });
  reg("tkFibFan", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const dx = c[1].x - c[0].x, dy = c[1].y - c[0].y, f = [LNi([c[0], { x: c[1].x, y: c[0].y }], s, DASH), LNi([{ x: c[1].x, y: c[0].y }, c[1]], s, DASH)];
    [0.25, 0.382, 0.5, 0.618, 0.75, 1].forEach(k => {
      const p1 = { x: c[1].x, y: c[0].y + dy * k }, p2 = { x: c[0].x + dx * k, y: c[1].y };
      f.push(LN([c[0], extendTo(c[0], p1, bd)], s, { color: alpha(s.color, k === 1 ? 1 : .6) }), TX(p1.x + 4, p1.y, nf(k, 3), s));
      if (k !== 1) f.push(LNi([c[0], extendTo(c[0], p2, bd)], s, { color: alpha(s.color, .4) }));
    });
    return f;
  });
  reg("tkFibCircles", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const r = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y), f = [LN([c[0], c[1]], s, DASH)];
    [0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618].forEach(k => f.push({ type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: r * k }, styles: { style: "stroke", borderColor: alpha(s.color, k === 1 ? 1 : .6), borderSize: 1 } }));
    return f;
  });
  reg("tkFibArcs", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const r = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y), up = c[0].y < c[1].y, f = [LN([c[0], c[1]], s, DASH)];
    [0.236, 0.382, 0.5, 0.618, 0.786, 1].forEach(k => { f.push({ type: "arc", ignoreEvent: true, attrs: { x: c[1].x, y: c[1].y, r: r * k, startAngle: up ? Math.PI : 0, endAngle: up ? 2 * Math.PI : Math.PI }, styles: { color: alpha(s.color, k === 1 ? 1 : .6), size: 1 } }); f.push(TX(c[1].x + 3, c[1].y + (up ? -r * k : r * k), nf(k, 3), s)); });
    return f;
  });
  reg("tkFibWedge", 4, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const f = [LN([c[0], c[1]], s)]; if (c.length < 3) return f;
    f.push(LN([c[0], c[2]], s));
    const r = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y), a1 = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x), a2 = Math.atan2(c[2].y - c[0].y, c[2].x - c[0].x);
    [0.236, 0.382, 0.5, 0.618, 0.786, 1].forEach(k => f.push({ type: "arc", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: r * k, startAngle: Math.min(a1, a2), endAngle: Math.max(a1, a2) }, styles: { color: alpha(s.color, .7), size: 1 } }));
    return f;
  });
  reg("tkPitchfan", 4, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const f = [LN([c[0], c[1]], s, DASH)]; if (c.length < 3) return f;
    f.push(LN([c[1], c[2]], s, DASH));
    [0, 0.382, 0.5, 0.618, 1].forEach(k => { const p = { x: c[1].x + (c[2].x - c[1].x) * k, y: c[1].y + (c[2].y - c[1].y) * k }; f.push(LNi([c[0], extendTo(c[0], p, bd)], s, { color: alpha(s.color, k === 0.5 ? 1 : .6) })); });
    return f;
  });
  reg("tkGannBox", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const x = Math.min(c[0].x, c[1].x), y = Math.min(c[0].y, c[1].y), w = Math.abs(c[1].x - c[0].x), h = Math.abs(c[1].y - c[0].y);
    const f = [{ type: "rect", attrs: { x, y, width: w, height: h }, styles: { style: "stroke_fill", color: alpha(s.color, .06), borderColor: s.color, borderSize: 1 } }];
    [0.25, 0.382, 0.5, 0.618, 0.75].forEach(k => { f.push(LNi([{ x: x + w * k, y }, { x: x + w * k, y: y + h }], s, { color: alpha(s.color, .5) }), LNi([{ x, y: y + h * k }, { x: x + w, y: y + h * k }], s, { color: alpha(s.color, .5) })); f.push(TX(x + w * k, y - 8, nf(k, 3), s, {}, "center")); });
    f.push(LNi([{ x, y }, { x: x + w, y: y + h }], s, DASH), LNi([{ x, y: y + h }, { x: x + w, y }], s, DASH));
    return f;
  });
  reg("tkGannSq", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const d = Math.max(Math.abs(c[1].x - c[0].x), Math.abs(c[1].y - c[0].y)), sx = Math.sign(c[1].x - c[0].x) || 1, sy = Math.sign(c[1].y - c[0].y) || 1;
    const x = sx > 0 ? c[0].x : c[0].x - d, y = sy > 0 ? c[0].y : c[0].y - d, f = [{ type: "rect", attrs: { x, y, width: d, height: d }, styles: { style: "stroke", borderColor: s.color, borderSize: 1 } }];
    [1 / 3, 2 / 3].forEach(k => f.push(LNi([{ x: x + d * k, y }, { x: x + d * k, y: y + d }], s, { color: alpha(s.color, .5) }), LNi([{ x, y: y + d * k }, { x: x + d, y: y + d * k }], s, { color: alpha(s.color, .5) })));
    f.push(LNi([{ x, y }, { x: x + d, y: y + d }], s), LNi([{ x, y: y + d }, { x: x + d, y }], s), { type: "circle", ignoreEvent: true, attrs: { x: x + d / 2, y: y + d / 2, r: d / 2 }, styles: { style: "stroke", borderColor: alpha(s.color, .5), borderSize: 1 } });
    return f;
  });
  reg("tkGannFan", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const dx = c[1].x - c[0].x, dy = c[1].y - c[0].y, f = [];
    [[1, 8], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [8, 1]].forEach(([a, b]) => { const p = { x: c[0].x + dx * (b >= a ? 1 : a / b) / (b >= a ? 1 : 1), y: c[0].y + dy * (a / b) }; const q = b > a ? { x: c[0].x + dx, y: c[0].y + dy * a / b } : { x: c[0].x + dx * b / a, y: c[0].y + dy }; const e = extendTo(c[0], a === b ? c[1] : q, bd); f.push(LN([c[0], e], s, { color: alpha(s.color, a === b ? 1 : .55) }), TX((a === b ? c[1] : q).x + 4, (a === b ? c[1] : q).y, a + "x" + b, s)); });
    return f;
  });
  // patrones
  function pathFig(labels, opt) {
    opt = opt || {};
    return ({ coordinates: c, overlay: o }) => {
      const s = sty(o), f = []; if (c.length < 2) return [];
      if (opt.fill) opt.fill.forEach(t => { if (t.every(i => c[i])) f.push(POLY(t.map(i => c[i]), s, .12)); });
      f.push(LN(c, s));
      if (opt.dash) opt.dash.forEach(([a, b, num]) => { if (c[a] && c[b]) { f.push(LNi([c[a], c[b]], s, DASH)); if (num) { const v = num(o.points); if (v) f.push(TX((c[a].x + c[b].x) / 2, (c[a].y + c[b].y) / 2, v, s, { color: "#fff", backgroundColor: alpha(s.color, .85), paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 3 }, "center")); } } });
      c.forEach((p, i) => { if (!labels[i]) return; const up = i > 0 ? p.y <= c[i - 1].y : (c[1] ? p.y <= c[1].y : true); f.push(TX(p.x, p.y + (up ? -12 : 12), labels[i], s, { weight: 700, size: 12, color: s.color }, "center")); });
      if (opt.neck && c[opt.neck[0]] && c[opt.neck[1]]) f.push(LNi([c[opt.neck[0]], c[opt.neck[1]]], s, { size: 2 }));
      return f;
    };
  }
  const rv = (p, a, b, c2, d) => { const x = Math.abs(p[b].value - p[a].value), y = Math.abs(p[d].value - p[c2].value); return x ? nf(y / x, 3) : null; };
  reg("tkXABCD", 6, pathFig(["X", "A", "B", "C", "D"], { fill: [[0, 1, 2], [2, 3, 4]], dash: [[0, 2, p => rv(p, 0, 1, 1, 2)], [1, 3, p => p[3] && rv(p, 1, 2, 2, 3)], [2, 4, p => p[4] && rv(p, 2, 3, 3, 4)], [0, 4, p => p[4] && rv(p, 0, 1, 1, 4)]] }));
  reg("tkCypher", 6, pathFig(["X", "A", "B", "C", "D"], { fill: [[0, 1, 2], [2, 3, 4]], dash: [[0, 2, p => rv(p, 0, 1, 1, 2)], [1, 3, p => p[3] && rv(p, 0, 1, 2, 3)], [0, 4, p => p[4] && rv(p, 0, 3, 3, 4)]] }));
  reg("tkABCD", 5, pathFig(["A", "B", "C", "D"], { dash: [[0, 2, p => rv(p, 0, 1, 1, 2)], [1, 3, p => p[3] && rv(p, 1, 2, 2, 3)]] }));
  reg("tkHS", 8, pathFig(["", "Hombro izq.", "", "Cabeza", "", "Hombro der.", ""], { fill: [[1, 2, 4, 5]], neck: [2, 4] }));
  reg("tkTriPat", 5, pathFig(["A", "B", "C", "D"], { fill: [[0, 1, 3, 2]], dash: [[0, 2], [1, 3]] }));
  reg("tkThreeDrives", 8, pathFig(["", "1", "", "2", "", "3", ""], {}));
  reg("tkEw5", 7, pathFig(["(0)", "(1)", "(2)", "(3)", "(4)", "(5)"]));
  reg("tkEwABC", 5, pathFig(["", "(A)", "(B)", "(C)"]));
  reg("tkEwTri", 7, pathFig(["", "(A)", "(B)", "(C)", "(D)", "(E)"]));
  reg("tkEwWXY", 5, pathFig(["", "(W)", "(X)", "(Y)"]));
  reg("tkEwWXYXZ", 7, pathFig(["", "(W)", "(X)", "(Y)", "(X)", "(Z)"]));
  reg("tkCyclic", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const dx = Math.abs(c[1].x - c[0].x), f = [LN([c[0], c[1]], s, DASH)]; if (dx < 3) return f;
    for (let x = c[0].x % dx; x < bd.width; x += dx) f.push(LNi([{ x, y: 0 }, { x, y: bd.height }], s, { color: alpha(s.color, .6) }));
    return f;
  });
  reg("tkTimeCycles", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const d = Math.abs(c[1].x - c[0].x), f = []; if (d < 3) return [LN([c[0], c[1]], s)];
    for (let x = Math.min(c[0].x, c[1].x) - d * Math.floor(Math.min(c[0].x, c[1].x) / d); x < bd.width + d; x += d) f.push({ type: "arc", attrs: { x: x + d / 2, y: c[0].y, r: d / 2, startAngle: Math.PI, endAngle: 2 * Math.PI }, styles: { color: s.color, size: s.width } });
    return f;
  });
  reg("tkSine", 3, ({ coordinates: c, overlay: o, bounding: bd }) => {
    const s = sty(o); if (c.length < 2) return [];
    const half = Math.abs(c[1].x - c[0].x) || 1, amp = (c[1].y - c[0].y) / 2, y0 = (c[0].y + c[1].y) / 2, pts = [];
    for (let x = 0; x <= bd.width; x += 3) pts.push({ x, y: y0 - amp * Math.cos(Math.PI * (x - c[0].x) / half) });
    return [LN(pts, s)];
  });
  // previsión y medición
  reg("tkForecast", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const p = o.points, dp = p[1].value - p[0].value, pct = p[0].value ? dp / p[0].value * 100 : 0, bars = Math.round(Math.abs((p[1].timestamp || 0) - (p[0].timestamp || 0)) / (TF_MS[CUR_TF] || 3e5));
    return [LN([c[0], c[1]], s, DASH), { type: "circle", ignoreEvent: true, attrs: { x: c[1].x, y: c[1].y, r: 4 }, styles: { style: "fill", color: s.color } },
      TX(c[1].x + 8, c[1].y, `Previsión ${pct >= 0 ? "+" : "−"}${nf(Math.abs(pct), 2)} % · ${fmtP(p[1].value)} · ${bars} velas`, s, { color: "#fff", backgroundColor: s.color, paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3, borderRadius: 4 })];
  });
  reg("tkAvwap", 2, ({ coordinates: c, overlay: o, chart, xAxis, yAxis }) => {
    const s = sty(o); if (!c.length || !chart || !xAxis || !yAxis) return [];
    const L = chart.getDataList(), i0 = L.findIndex(k => k.timestamp >= o.points[0].timestamp); if (i0 < 0) return [];
    let pv = 0, vv = 0; const pts = [];
    for (let i = i0; i < L.length; i++) { const k = L[i], v = k.volume || 1, tp = (k.high + k.low + k.close) / 3; pv += tp * v; vv += v; pts.push({ x: xAxis.convertTimestampToPixel(k.timestamp), y: yAxis.convertToPixel(pv / vv) }); }
    const last = pts[pts.length - 1];
    return [LN(pts, s, { size: Math.max(1.5, s.width) }), { type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: 3.5 }, styles: { style: "fill", color: s.color } }, TX(last.x + 6, last.y, "VWAP anclado", s, { color: s.color, weight: 600 })];
  }, { needDefaultXAxisFigure: true });
  // formas
  reg("tkArrowMarker", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const a = Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x), L = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y), hw = Math.min(14, L / 3), sw = hw / 2.4, head = Math.min(L * .45, hw * 1.8);
    const P = (d, w) => ({ x: c[0].x + Math.cos(a) * d - Math.sin(a) * w, y: c[0].y + Math.sin(a) * d + Math.cos(a) * w });
    return [{ type: "polygon", attrs: { coordinates: [P(0, -sw), P(L - head, -sw), P(L - head, -hw), P(L, 0), P(L - head, hw), P(L - head, sw), P(0, sw)] }, styles: { style: "fill", color: s.color } }];
  });
  function markFig(up) {
    return ({ coordinates: c, overlay: o }) => {
      const s = sty(o), x = c[0].x, y = c[0].y, d = up ? 1 : -1, w = 9, h = 22;
      const f = [{ type: "polygon", attrs: { coordinates: [{ x, y }, { x: x + w, y: y + d * 10 }, { x: x + 4, y: y + d * 10 }, { x: x + 4, y: y + d * h }, { x: x - 4, y: y + d * h }, { x: x - 4, y: y + d * 10 }, { x: x - w, y: y + d * 10 }] }, styles: { style: "fill", color: s.color } }];
      if (s.text) f.push(TX(x, y + d * (h + 10), s.text, s, { color: s.color, size: s.size || 12, weight: 600, family: "Inter, sans-serif" }, "center"));
      return f;
    };
  }
  reg("tkArrowUp", 2, markFig(true), { needDefaultXAxisFigure: false }); reg("tkArrowDown", 2, markFig(false), { needDefaultXAxisFigure: false });
  reg("tkRotRect", 4, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    if (c.length < 3) return [LN([c[0], c[1]], s)];
    const dx = c[1].x - c[0].x, dy = c[1].y - c[0].y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = (c[2].x - c[0].x) * nx + (c[2].y - c[0].y) * ny;
    const pts = [c[0], c[1], { x: c[1].x + nx * w, y: c[1].y + ny * w }, { x: c[0].x + nx * w, y: c[0].y + ny * w }];
    return [{ type: "polygon", attrs: { coordinates: pts }, styles: { style: s.fill ? "stroke_fill" : "stroke", color: alpha(s.color, .14), borderColor: s.color, borderSize: s.width } }];
  });
  reg("tkEllipse", 3, ({ coordinates: c, overlay: o }) => {
    const s = sty(o); if (c.length < 2) return [];
    const rx = Math.abs(c[1].x - c[0].x), ry = Math.abs(c[1].y - c[0].y), pts = [];
    for (let i = 0; i <= 64; i++) { const t = i / 64 * 2 * Math.PI; pts.push({ x: c[0].x + rx * Math.cos(t), y: c[0].y + ry * Math.sin(t) }); }
    return [{ type: "polygon", attrs: { coordinates: pts }, styles: { style: s.fill ? "stroke_fill" : "stroke", color: alpha(s.color, .14), borderColor: s.color, borderSize: s.width } }];
  });
  const bez = (p0, p1, p2, p3) => { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, u = 1 - t; pts.push(p3 ? { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y } : { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y }); } return pts; };
  reg("tkArc", 4, ({ coordinates: c, overlay: o }) => { const s = sty(o); if (c.length < 3) return c.length > 1 ? [LN(c, s)] : []; const m2 = mid(c[0], c[1]), ctl = { x: 2 * c[2].x - m2.x, y: 2 * c[2].y - m2.y }; return [LN(bez(c[0], ctl, c[1]), s)]; });
  reg("tkCurve", 4, ({ coordinates: c, overlay: o }) => { const s = sty(o); if (c.length < 3) return c.length > 1 ? [LN(c, s)] : []; return [LN(bez(c[0], c[2], c[1]), s), LNi([c[0], c[2], c[1]], s, Object.assign({ color: alpha(s.color, .3) }, DASH))]; });
  reg("tkDoubleCurve", 5, ({ coordinates: c, overlay: o }) => { const s = sty(o); if (c.length < 4) return c.length > 1 ? [LN(c, s)] : []; return [LN(bez(c[0], c[2], c[3], c[1]), s)]; });
  // trazos libres (pincel, rotulador, trayecto, polilínea): los puntos van en extendData.pts, relativos al primero
  function freeFig(kind) {
    return ({ overlay: o, chart }) => {
      const s = sty(o), ed = o.extendData || {}, p0 = o.points[0]; if (!chart || !p0 || !ed.pts) return [];
      let px = []; try { px = chart.convertToPixel(ed.pts.map(q => ({ timestamp: p0.timestamp + q[0], value: p0.value + q[1] })), { paneId: "candle_pane" }); } catch (e) { return []; }
      px = px.filter(q => q && isFinite(q.x) && isFinite(q.y)); if (px.length < 2) return [];
      const f = [];
      if (kind === "hl") f.push({ type: "line", attrs: { coordinates: px }, styles: { color: alpha(s.color, .35), size: Math.max(10, s.width * 6), style: "solid" } });
      else f.push({ type: "line", attrs: { coordinates: ed.closed ? px.concat([px[0]]) : px }, styles: lineSt(s) });
      if (kind === "path") { const a = px[px.length - 2], b = px[px.length - 1], ang = Math.atan2(b.y - a.y, b.x - a.x), L = 10 + s.width * 2; f.push({ type: "polygon", ignoreEvent: true, attrs: { coordinates: [b, { x: b.x - L * Math.cos(ang - .45), y: b.y - L * Math.sin(ang - .45) }, { x: b.x - L * Math.cos(ang + .45), y: b.y - L * Math.sin(ang + .45) }] }, styles: { style: "fill", color: s.color } }); }
      if (kind === "poly" && ed.closed && s.fill) f.unshift(POLY(px, s, .14));
      return f;
    };
  }
  [["tkBrush", "brush"], ["tkHighlighter", "hl"], ["tkPath", "path"], ["tkPolyline", "poly"]].forEach(([n, k]) => KC.registerOverlay({ name: n, totalStep: 2, needDefaultPointFigure: false, needDefaultXAxisFigure: false, needDefaultYAxisFigure: false, createPointFigures: freeFig(k) }));
  // anotaciones
  const boxSt = (s, o) => textSt(s, Object.assign({ color: pal().tinta, backgroundColor: pal().card, borderColor: s.color, borderSize: 1, borderRadius: 6, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, size: s.size || 13 }, o || {}));
  reg("tkNote", 2, ({ coordinates: c, overlay: o }) => { const s = sty(o); return [{ type: "circle", attrs: { x: c[0].x, y: c[0].y, r: 5 }, styles: { style: "fill", color: s.color } }, LNi([c[0], { x: c[0].x, y: c[0].y - 18 }], s), { type: "text", attrs: { x: c[0].x, y: c[0].y - 20, text: s.text || "Nota", align: "center", baseline: "bottom" }, styles: boxSt(s) }]; }, { needDefaultXAxisFigure: false });
  reg("tkPriceNote", 3, ({ coordinates: c, overlay: o }) => { const s = sty(o), v = o.points[0] && o.points[0].value, at = c[1] || c[0]; return [{ type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: 3.5 }, styles: { style: "fill", color: s.color } }, LN([c[0], at], s), { type: "text", attrs: { x: at.x, y: at.y, text: (s.text ? s.text + "  " : "") + (v != null ? fmtP(v) : ""), align: "left", baseline: "middle" }, styles: labelSt(s) }]; });
  reg("tkSignpost", 2, ({ coordinates: c, overlay: o }) => { const s = sty(o); return [LN([c[0], { x: c[0].x, y: c[0].y - 34 }], s, { size: 2 }), { type: "circle", ignoreEvent: true, attrs: { x: c[0].x, y: c[0].y, r: 3 }, styles: { style: "fill", color: s.color } }, { type: "text", attrs: { x: c[0].x, y: c[0].y - 36, text: s.text || "Señal", align: "center", baseline: "bottom" }, styles: textSt(s, { color: "#fff", backgroundColor: s.color, borderRadius: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 5, size: s.size || 12, weight: 600 }) }]; }, { needDefaultXAxisFigure: false });
  reg("tkComment", 2, ({ coordinates: c, overlay: o }) => { const s = sty(o); return [{ type: "polygon", ignoreEvent: true, attrs: { coordinates: [c[0], { x: c[0].x + 8, y: c[0].y - 12 }, { x: c[0].x + 18, y: c[0].y - 12 }] }, styles: { style: "fill", color: s.color } }, { type: "text", attrs: { x: c[0].x, y: c[0].y - 12, text: s.text || "Comentario", align: "left", baseline: "bottom" }, styles: textSt(s, { color: "#fff", backgroundColor: s.color, borderRadius: 10, paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6, size: s.size || 13 }) }]; }, { needDefaultXAxisFigure: false });
  reg("tkFlag", 2, ({ coordinates: c, overlay: o }) => { const s = sty(o), x = c[0].x, y = c[0].y; const f = [LN([{ x, y }, { x, y: y - 26 }], s, { size: 2 }), { type: "polygon", attrs: { coordinates: [{ x, y: y - 26 }, { x: x + 16, y: y - 21 }, { x, y: y - 15 }] }, styles: { style: "fill", color: s.color } }]; if (s.text) f.push(TX(x + 20, y - 21, s.text, s, { color: s.color, size: s.size || 12, weight: 600 })); return f; }, { needDefaultXAxisFigure: false });
  reg("tkEmoji", 2, ({ coordinates: c, overlay: o }) => { const s = sty(o); return [{ type: "text", attrs: { x: c[0].x, y: c[0].y, text: s.text || "🙂", align: "center", baseline: "middle" }, styles: { color: "#000", size: s.size || 28, family: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif", weight: 400, backgroundColor: "transparent", borderSize: 0, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } }]; }, { needDefaultXAxisFigure: false, needDefaultYAxisFigure: false });
  function rangeFig(kind) {
    return ({ coordinates: c, overlay: o }) => {
      if (c.length < 2) return [];
      const s = sty(o), p = o.points, x = Math.min(c[0].x, c[1].x), y = Math.min(c[0].y, c[1].y), w = Math.abs(c[1].x - c[0].x), h = Math.abs(c[1].y - c[0].y);
      const dp = p[1].value - p[0].value, pct = p[0].value ? dp / p[0].value * 100 : 0, dt = (p[1].timestamp || 0) - (p[0].timestamp || 0), bars = Math.round(Math.abs(dt) / (TF_MS[CUR_TF] || 3e5));
      const col = kind === "date" ? s.color : dp >= 0 ? s.color : (DARK ? "#c6cee0" : "#14213a");
      const f = [{ type: "rect", ignoreEvent: true, attrs: { x, y, width: w, height: h }, styles: { style: "fill", color: alpha(col, .12) } }];
      const midX = x + w / 2, midY = y + h / 2;
      if (kind !== "date") f.push({ type: "line", ignoreEvent: true, attrs: { coordinates: [{ x: midX, y: c[0].y }, { x: midX, y: c[1].y }] }, styles: { color: col, size: 1.5 } });
      if (kind !== "price") f.push({ type: "line", ignoreEvent: true, attrs: { coordinates: [{ x: c[0].x, y: midY }, { x: c[1].x, y: midY }] }, styles: { color: col, size: 1.5 } });
      const parts = [];
      if (kind !== "date") parts.push((dp >= 0 ? "+" : "−") + nf(Math.abs(dp), CUR_DIGITS) + " (" + (pct >= 0 ? "+" : "−") + nf(Math.abs(pct), 2) + " %)");
      if (kind !== "price") parts.push(bars + " velas · " + dur(dt));
      f.push({ type: "text", ignoreEvent: true, attrs: { x: midX, y: y + h + 6, text: parts.join("  ·  "), align: "center", baseline: "top" }, styles: labelSt({ color: col, size: 12, width: 1, dash: "solid", text: "", fill: true }) });
      return f;
    };
  }
  reg("tkPriceRange", 3, rangeFig("price"));
  reg("tkDateRange", 3, rangeFig("date"));
  reg("tkMeasure", 3, rangeFig("both"));
  reg("tkFibExt", 4, ({ coordinates: c, overlay: o, bounding: b, yAxis }) => {
    const s = sty(o), f = [{ type: "line", attrs: { coordinates: c.slice(0, 3) }, styles: { color: s.color, size: 1, style: "dashed", dashedValue: [4, 4] } }];
    if (c.length < 3 || !yAxis) return f;
    const p = o.points, d = p[1].value - p[0].value;
    [0, 0.618, 1, 1.272, 1.618, 2, 2.618].forEach(k => {
      const v = p[2].value + d * k, yy = yAxis.convertToPixel(v);
      f.push({ type: "line", ignoreEvent: true, attrs: { coordinates: [{ x: c[2].x, y: yy }, { x: b.width, y: yy }] }, styles: { color: alpha(s.color, k === 1 || k === 1.618 ? 1 : .6), size: 1 } });
      f.push({ type: "text", ignoreEvent: true, attrs: { x: c[2].x + 4, y: yy - 2, text: nf(k, 3) + "  (" + fmtP(v) + ")", baseline: "bottom" }, styles: textSt(s, { size: 11, family: NUMF }) });
    });
    return f;
  });
  KC.registerOverlay({
    name: "tkPos", totalStep: 4, needDefaultPointFigure: true, needDefaultXAxisFigure: false, needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates: c, overlay: o }) => {
      if (c.length < 2) return [];
      const p = pal(), ex = o.extendData || {}, pts = o.points;
      const x0 = c[0].x, x1 = Math.max(c[1].x, x0 + 36), w = x1 - x0;
      const e = pts[0].value, s = pts[1].value, t = pts[2] && pts[2].value != null ? pts[2].value : null;
      const figs = [{ type: "rect", attrs: { x: x0, y: Math.min(c[0].y, c[1].y), width: w, height: Math.abs(c[1].y - c[0].y) }, styles: { style: "fill", color: p.stopA } }];
      const txt = { color: p.tinta, size: 11, family: NUMF, backgroundColor: "transparent", borderSize: 0, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 };
      const label = ex.side === "sell" ? "VENTA" : "COMPRA";
      figs.push({ type: "text", ignoreEvent: true, attrs: { x: x0 + 4, y: c[1].y + (c[1].y > c[0].y ? 2 : -2), text: "Stop −1 R · " + fmtP(s), baseline: c[1].y > c[0].y ? "top" : "bottom" }, styles: txt });
      if (t != null && c[2]) {
        const rr = Math.abs(t - e) / Math.abs(e - s);
        figs.push({ type: "rect", attrs: { x: x0, y: Math.min(c[0].y, c[2].y), width: w, height: Math.abs(c[2].y - c[0].y) }, styles: { style: "fill", color: p.cobA } });
        figs.push({ type: "text", ignoreEvent: true, attrs: { x: x0 + 4, y: c[2].y + (c[2].y > c[0].y ? 2 : -2), text: "Objetivo +" + nf(rr, 1) + " R · " + fmtP(t), baseline: c[2].y > c[0].y ? "top" : "bottom" }, styles: Object.assign({}, txt, { color: p.cob }) });
      }
      figs.push({ type: "line", ignoreEvent: true, attrs: { coordinates: [{ x: x0, y: c[0].y }, { x: x1, y: c[0].y }] }, styles: { color: p.tinta, size: 1.5 } });
      const head = ex.result != null ? label + " · " + fmtR(ex.result) : label + (ex.sim ? " · SIMULADA" : "") + " · " + fmtP(e);
      figs.push({ type: "text", ignoreEvent: true, attrs: { x: x1 - 4, y: c[0].y - 3, text: head, align: "right", baseline: "bottom" }, styles: Object.assign({}, txt, ex.result != null ? { color: "#14213a", backgroundColor: p.rot } : {}) });
      return figs;
    }
  });

  /* ---------- indicadores propios ---------- */
  const wilder = (list, n) => { let a = null; return list.map((k, i) => { const pc = i ? list[i - 1].close : k.close; const tr = Math.max(k.high - k.low, Math.abs(k.high - pc), Math.abs(k.low - pc)); a = a == null ? tr : (a * (n - 1) + tr) / n; return a; }); };
  const emaArr = (vals, n) => { const k = 2 / (n + 1); let e = null; return vals.map(v => (e = e == null ? v : v * k + e * (1 - k))); };
  const hh = (l, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) m = Math.max(m, l[j].high); return m; };
  const ll = (l, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) m = Math.min(m, l[j].low); return m; };
  const smaArr = (vals, n) => vals.map((v, i) => { if (i < n - 1 || v == null) return null; let s = 0; for (let j = 0; j < n; j++) { if (vals[i - j] == null) return null; s += vals[i - j]; } return s / n; });
  KC.registerIndicator({ name: "ATR", shortName: "ATR", calcParams: [14], figures: [{ key: "atr", title: "ATR: ", type: "line" }], calc: (l, ind) => { const n = ind.calcParams[0] || 14, a = wilder(l, n); return a.map((v, i) => i >= n - 1 ? { atr: v } : {}); } });
  KC.registerIndicator({ name: "WMA", shortName: "WMA", calcParams: [20], figures: [{ key: "wma", title: "WMA: ", type: "line" }], calc: (l, ind) => { const n = ind.calcParams[0] || 20; return l.map((k, i) => { if (i < n - 1) return {}; let s = 0, w = 0; for (let j = 0; j < n; j++) { s += l[i - j].close * (n - j); w += n - j; } return { wma: s / w }; }); } });
  KC.registerIndicator({ name: "VWAP", shortName: "VWAP", calcParams: [], figures: [{ key: "vwap", title: "VWAP: ", type: "line" }], calc: l => { let day = "", pv = 0, vv = 0; return l.map(k => { const d = new Date(k.timestamp).toDateString(); if (d !== day) { day = d; pv = 0; vv = 0; } const v = k.volume > 0 ? k.volume : 1; pv += (k.high + k.low + k.close) / 3 * v; vv += v; return { vwap: pv / vv }; }); } });
  KC.registerIndicator({
    name: "ICHIMOKU", shortName: "Ichimoku", calcParams: [9, 26, 52],
    figures: [{ key: "ten", title: "Tenkan: ", type: "line" }, { key: "kij", title: "Kijun: ", type: "line" }, { key: "sa", title: "Senkou A: ", type: "line" }, { key: "sb", title: "Senkou B: ", type: "line" }, { key: "chi", title: "Chikou: ", type: "line" }],
    calc: (l, ind) => { const [a, b, c] = ind.calcParams; const ten = l.map((k, i) => i >= a - 1 ? (hh(l, i, a) + ll(l, i, a)) / 2 : null), kij = l.map((k, i) => i >= b - 1 ? (hh(l, i, b) + ll(l, i, b)) / 2 : null);
      return l.map((k, i) => { const o = {}; if (ten[i] != null) o.ten = ten[i]; if (kij[i] != null) o.kij = kij[i]; const j = i - b; if (j >= 0 && ten[j] != null && kij[j] != null) o.sa = (ten[j] + kij[j]) / 2; if (j >= c - 1) o.sb = (hh(l, j, c) + ll(l, j, c)) / 2; if (i + b < l.length) o.chi = l[i + b].close; return o; }); }
  });
  KC.registerIndicator({
    name: "SUPERTREND", shortName: "Supertrend", calcParams: [10, 3], figures: [{ key: "up", title: "Alcista: ", type: "line" }, { key: "dn", title: "Bajista: ", type: "line" }],
    calc: (l, ind) => { const [n, m] = ind.calcParams, a = wilder(l, n); let fu = null, fl = null, tr = 1;
      return l.map((k, i) => { const hl = (k.high + k.low) / 2, bu = hl + m * a[i], bl = hl - m * a[i], pc = i ? l[i - 1].close : k.close;
        fu = fu == null || bu < fu || pc > fu ? bu : fu; fl = fl == null || bl > fl || pc < fl ? bl : fl;
        if (tr === 1 && k.close < fl) tr = -1; else if (tr === -1 && k.close > fu) tr = 1;
        return i < n ? {} : tr === 1 ? { up: fl } : { dn: fu }; }); }
  });
  KC.registerIndicator({ name: "KELTNER", shortName: "Keltner", calcParams: [20, 2], figures: [{ key: "up", title: "Sup: ", type: "line" }, { key: "mid", title: "Media: ", type: "line" }, { key: "dn", title: "Inf: ", type: "line" }],
    calc: (l, ind) => { const [n, m] = ind.calcParams, e = emaArr(l.map(k => k.close), n), a = wilder(l, n); return l.map((k, i) => i < n - 1 ? {} : { up: e[i] + m * a[i], mid: e[i], dn: e[i] - m * a[i] }); } });
  KC.registerIndicator({ name: "DONCHIAN", shortName: "Donchian", calcParams: [20], figures: [{ key: "up", title: "Sup: ", type: "line" }, { key: "mid", title: "Media: ", type: "line" }, { key: "dn", title: "Inf: ", type: "line" }],
    calc: (l, ind) => { const n = ind.calcParams[0]; return l.map((k, i) => { if (i < n - 1) return {}; const u = hh(l, i, n), d = ll(l, i, n); return { up: u, mid: (u + d) / 2, dn: d }; }); } });
  KC.registerIndicator({ name: "STOCHRSI", shortName: "Stoch RSI", calcParams: [14, 14, 3, 3], minValue: 0, maxValue: 100, figures: [{ key: "k", title: "K: ", type: "line" }, { key: "d", title: "D: ", type: "line" }],
    calc: (l, ind) => { const [rn, sn, kn, dn] = ind.calcParams; let ag = 0, al = 0; const rsi = l.map((k, i) => { if (!i) return null; const ch = k.close - l[i - 1].close, g = Math.max(ch, 0), lo = Math.max(-ch, 0); if (i <= rn) { ag += g / rn; al += lo / rn; if (i < rn) return null; } else { ag = (ag * (rn - 1) + g) / rn; al = (al * (rn - 1) + lo) / rn; } return al === 0 ? 100 : 100 - 100 / (1 + ag / al); });
      const st = rsi.map((v, i) => { if (v == null || i < sn) return null; let mn = Infinity, mx = -Infinity; for (let j = i - sn + 1; j <= i; j++) { if (rsi[j] == null) return null; mn = Math.min(mn, rsi[j]); mx = Math.max(mx, rsi[j]); } return mx === mn ? 0 : (v - mn) / (mx - mn) * 100; });
      const K = smaArr(st, kn), D = smaArr(K, dn); return l.map((x, i) => { const o = {}; if (K[i] != null) o.k = K[i]; if (D[i] != null) o.d = D[i]; return o; }); } });

  /* catálogo: [nombre interno, símbolo, nombre, categoría, en el precio, parámetros, qué es] */
  const CATS = ["Tendencia", "Osciladores", "Volatilidad", "Volumen"];
  const IND = [
    ["MA", "MA", "Media móvil simple", "Tendencia", true, [20], "La media de los últimos cierres."],
    ["EMA", "EMA", "Media móvil exponencial", "Tendencia", true, [20, 50, 200], "Da más peso a los cierres recientes."],
    ["WMA", "WMA", "Media móvil ponderada", "Tendencia", true, [20], "Media que pesa más lo reciente, de forma lineal."],
    ["VWAP", "VWAP", "Precio medio ponderado por volumen", "Tendencia", true, [], "Precio medio del día; sin volumen real, pondera igual cada vela."],
    ["ICHIMOKU", "一目", "Nube de Ichimoku", "Tendencia", true, [9, 26, 52], "Tendencia, soportes y resistencias en un vistazo."],
    ["SUPERTREND", "ST", "Supertrend", "Tendencia", true, [10, 3], "Línea que sigue la tendencia con la volatilidad."],
    ["SAR", "SAR", "SAR parabólico", "Tendencia", true, [2, 2, 20], "Puntos que marcan posibles giros."],
    ["BBI", "BBI", "Índice alcista/bajista", "Tendencia", true, [3, 6, 12, 24], "Media de cuatro medias."],
    ["DMI", "ADX", "ADX / DMI", "Tendencia", false, [14, 6], "Fuerza de la tendencia y su dirección."],
    ["BOLL", "BB", "Bandas de Bollinger", "Volatilidad", true, [20, 2], "Media con bandas a dos desviaciones."],
    ["KELTNER", "KC", "Canal de Keltner", "Volatilidad", true, [20, 2], "Media exponencial con bandas de ATR."],
    ["DONCHIAN", "DC", "Canal de Donchian", "Volatilidad", true, [20], "Máximo y mínimo de los últimos periodos."],
    ["ATR", "ATR", "Rango verdadero medio (ATR)", "Volatilidad", false, [14], "Cuánto se mueve el precio de media."],
    ["RSI", "RSI", "Índice de fuerza relativa (RSI)", "Osciladores", false, [14], "Sobrecompra y sobreventa de 0 a 100."],
    ["MACD", "MACD", "MACD", "Osciladores", false, [12, 26, 9], "Cruce de medias y su histograma."],
    ["KDJ", "STO", "Estocástico (KDJ)", "Osciladores", false, [9, 3, 3], "Dónde cierra el precio dentro de su rango."],
    ["STOCHRSI", "SRSI", "RSI estocástico", "Osciladores", false, [14, 14, 3, 3], "Estocástico aplicado al RSI."],
    ["CCI", "CCI", "Índice de canal de materias primas (CCI)", "Osciladores", false, [20], "Distancia del precio a su media."],
    ["WR", "%R", "Williams %R", "Osciladores", false, [14], "Sobrecompra y sobreventa de 0 a −100."],
    ["AO", "AO", "Oscilador asombroso", "Osciladores", false, [5, 34], "Diferencia entre dos medias del precio medio."],
    ["MTM", "MOM", "Momento", "Osciladores", false, [12, 6], "Velocidad del cambio de precio."],
    ["ROC", "ROC", "Tasa de cambio (ROC)", "Osciladores", false, [12, 6], "Cambio porcentual frente a hace n velas."],
    ["TRIX", "TRIX", "TRIX", "Osciladores", false, [12, 9], "Triple media exponencial suavizada."],
    ["BIAS", "BIAS", "Desviación de la media (BIAS)", "Osciladores", false, [6, 12, 24], "Cuánto se separa el precio de sus medias."],
    ["PSY", "PSY", "Línea psicológica", "Osciladores", false, [12, 6], "Porcentaje de velas alcistas recientes."],
    ["BRAR", "BRAR", "Sentimiento (BRAR)", "Osciladores", false, [26], "Fuerza de compradores y vendedores."],
    ["CR", "CR", "Energía (CR)", "Osciladores", false, [26, 10, 20, 40, 60], "Impulso respecto al precio medio anterior."],
    ["VOL", "VOL", "Volumen", "Volumen", false, [5, 10, 20], "Volumen de cada vela (en divisas, el de tu bróker o ticks)."],
    ["OBV", "OBV", "Volumen en balance (OBV)", "Volumen", false, [30], "Suma el volumen de las velas alcistas y resta el de las bajistas."],
    ["PVT", "PVT", "Tendencia precio-volumen", "Volumen", false, [], "Volumen ponderado por el cambio de precio."],
    ["VR", "VR", "Ratio de volumen", "Volumen", false, [26, 6], "Volumen de subida frente al de bajada."],
    ["EMV", "EMV", "Facilidad de movimiento", "Volumen", false, [14, 9], "Lo que le cuesta al precio moverse."]
  ];
  const IND_BY = Object.fromEntries(IND.map(x => [x[0], x]));

  /* ---------- iconos propios ---------- */
  const IC = {
    cursor: '<path d="M5.5 2.8v12.6l3.1-2.9 2.2 4.8 2.1-1-2.2-4.7h4.3z"/>',
    segment: '<path d="M5 15L15 5"/><circle cx="4" cy="16" r="1.7" fill="var(--card,#fff)"/><circle cx="16" cy="4" r="1.7" fill="var(--card,#fff)"/>',
    rayLine: '<path d="M5.2 14.8L18.5 1.5"/><circle cx="4" cy="16" r="1.7" fill="var(--card,#fff)"/><circle cx="10" cy="10" r="1.7" fill="var(--card,#fff)"/>',
    straightLine: '<path d="M1.5 18.5l17-17"/><circle cx="7" cy="13" r="1.7" fill="var(--card,#fff)"/><circle cx="13" cy="7" r="1.7" fill="var(--card,#fff)"/>',
    horizontalStraightLine: '<path d="M1.5 10h17"/><circle cx="10" cy="10" r="1.7" fill="var(--card,#fff)"/>', horizontalRayLine: '<path d="M7.7 10h10.8M16 7.5l2.5 2.5-2.5 2.5"/><circle cx="6" cy="10" r="1.7" fill="var(--card,#fff)"/>',
    verticalStraightLine: '<path d="M10 1.5v17"/><circle cx="10" cy="10" r="1.7" fill="var(--card,#fff)"/>', tkCross: '<path d="M1.5 10h6.8M11.7 10h6.8M10 1.5v6.8M10 11.7v6.8"/><circle cx="10" cy="10" r="1.7" fill="var(--card,#fff)"/>',
    priceLine: '<path d="M1.5 10h9"/><path d="M11 7.2h5.6l2 2.8-2 2.8H11z"/>',
    parallelStraightLine: '<path d="M2 12.5L12.5 2M7.5 18L18 7.5"/><path d="M4.8 15.2L15.2 4.8" stroke-dasharray="1.6 2"/><circle cx="2.6" cy="11.9" r="1.7" fill="var(--card,#fff)"/><circle cx="17.4" cy="8.1" r="1.7" fill="var(--card,#fff)"/>', priceChannelLine: '<path d="M2 11l9-6.5h7M2 17l9-6.5h7"/><path d="M2 14l9-6.5h7" stroke-dasharray="1.6 2"/>',
    fibonacciLine: '<path d="M5 3.5h13M5 7.8h13M5 12.2h13M5 16.5h13"/><path d="M2 3.5h1.2M2 7.8h1.2M2 12.2h1.2M2 16.5h1.2" stroke-width="2"/><path d="M6 16.5L17 3.5" stroke-dasharray="1.6 2"/>',
    tkFibExt: '<path d="M2 16l4-9 4 6"/><path d="M12 3.5h6.5M12 8h6.5M12 12.5h6.5" stroke-dasharray="1.6 1.8"/><circle cx="2" cy="16" r="1.7" fill="var(--card,#fff)"/><circle cx="6" cy="7" r="1.7" fill="var(--card,#fff)"/><circle cx="10" cy="13" r="1.7" fill="var(--card,#fff)"/>',
    tkRect: '<rect x="3.5" y="5.5" width="13" height="9" rx=".5"/><circle cx="3.5" cy="5.5" r="1.7" fill="var(--card,#fff)"/><circle cx="16.5" cy="14.5" r="1.7" fill="var(--card,#fff)"/>', tkCircle: '<circle cx="10" cy="10" r="7.2"/><path d="M10 10l5.1-5.1" stroke-dasharray="1.6 1.8"/><circle cx="10" cy="10" r="1.7" fill="var(--card,#fff)"/>', tkTriangle: '<path d="M10 3.5l6.8 12H3.2z"/><circle cx="10" cy="3.5" r="1.7" fill="var(--card,#fff)"/><circle cx="16.8" cy="15.5" r="1.7" fill="var(--card,#fff)"/><circle cx="3.2" cy="15.5" r="1.7" fill="var(--card,#fff)"/>',
    tkArrow: '<path d="M4 16L15.5 4.5"/><path d="M9.5 4h6.5v6.5"/>',
    tkText: '<path d="M4.5 5.5V4h11v1.5M10 4v12.5M7.5 16.5h5"/>', tkCallout: '<path d="M3 3.5h14v9.5H9.5L5.5 16.5V13H3z"/><path d="M6 7h8M6 10h5"/>', tkPriceLabel: '<path d="M2.5 10l4-5h11v10h-11z"/><path d="M9 10h6"/>',
    tkLong: '<path d="M3 3h14v7H3z" fill="currentColor" fill-opacity=".2"/><path d="M3 10h14v7H3z"/><path d="M10 13.5V5.5M7.5 8l2.5-2.5L12.5 8"/>', tkShort: '<path d="M3 3h14v7H3z"/><path d="M3 10h14v7H3z" fill="currentColor" fill-opacity=".2"/><path d="M10 6.5v8M7.5 12l2.5 2.5 2.5-2.5"/>',
    tkPriceRange: '<path d="M4 2.5h12M4 17.5h12M10 5v10M7.5 7.5L10 5l2.5 2.5M7.5 12.5L10 15l2.5-2.5"/>', tkDateRange: '<path d="M2.5 4v12M17.5 4v12M5 10h10M7.5 7.5L5 10l2.5 2.5M12.5 7.5L15 10l-2.5 2.5"/>', tkMeasure: '<path d="M2.5 14.5l12-12 3 3-12 12z"/><path d="M6 11l1.6 1.6M8.5 8.5l1.6 1.6M11 6l1.6 1.6"/>',
    magnet: '<path d="M4.5 3h3.5v7a2 2 0 004 0V3h3.5v7a5.5 5.5 0 01-11 0z"/><path d="M4.5 6.5H8M12 6.5h3.5"/>', lock: '<rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>',
    eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/>', trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>',
    undo: '<path d="M7 5L3 9l4 4"/><path d="M3 9h9a5 5 0 010 10H9"/>', redo: '<path d="M13 5l4 4-4 4"/><path d="M17 9H8a5 5 0 000 10h3"/>',
    gear: '<circle cx="10" cy="10" r="3"/><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M4 16l1.8-1.8M14.2 5.8L16 4"/>',
    camera: '<path d="M3 6h3l1.5-2h5L14 6h3v10H3z"/><circle cx="10" cy="11" r="3"/>', full: '<path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"/>',
    cut: '<circle cx="5.5" cy="15" r="2.5"/><circle cx="14.5" cy="15" r="2.5"/><path d="M7 13L15 2M13 13L5 2"/>',
    replay: '<path d="M4 10a6 6 0 106-6H6M6 1L3 4l3 3"/>', fx: '<path d="M8 4c-2 0-2 2-2.5 5S4 16 2 16M3 8h6"/><path d="M11 9l6 7M17 9l-6 7"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13 13l4.5 4.5"/>', chev: '<path d="M6 8l4 4 4-4"/>',
    candles: '<path d="M6 3v14M14 5v12"/><rect x="4" y="6" width="4" height="7" fill="currentColor"/><rect x="12" y="8" width="4" height="6"/>',
    candlesH: '<path d="M6 3v14M14 5v12"/><rect x="4" y="6" width="4" height="7"/><rect x="12" y="8" width="4" height="6"/>',
    bars: '<path d="M6 3v14M3 6h3M6 13h3M14 5v12M11 8h3M14 14h3"/>', area: '<path d="M2 15l5-6 4 3 7-8v14H2z" fill="currentColor" fill-opacity=".18"/><path d="M2 15l5-6 4 3 7-8"/>',
    x: '<path d="M5 5l10 10M15 5L5 15"/>', dup: '<rect x="6" y="6" width="11" height="11" rx="2"/><path d="M3 13V3h10"/>',
    cursorDot: '<circle cx="10" cy="10" r="2.6" fill="currentColor"/>',
    cursorArrow: '<path d="M5.5 2.8v12.6l3.1-2.9 2.2 4.8 2.1-1-2.2-4.7h4.3z"/>',
    cursorCross: '<path d="M10 2v16M2 10h16"/>',
    eraser: '<path d="M3 13.5l7.5-7.5 5 5L10 16.5H6z"/><path d="M8 8.5l5 5M10 16.5h7"/>',
    tkInfoLine: '<path d="M3.5 15.5l9-9"/><circle cx="3" cy="16" r="1.7" fill="var(--card,#fff)"/><circle cx="13" cy="6" r="1.7" fill="var(--card,#fff)"/><path d="M13 13h5v4h-5z"/>',
    tkAngle: '<path d="M3 16L15 5M3 16h14"/><path d="M8.5 16a5.5 5.5 0 00-1.3-3.6"/><circle cx="3" cy="16" r="1.7" fill="var(--card,#fff)"/>',
    tkRegression: '<path d="M2 14L18 6"/><path d="M2 10.5L18 2.5M2 17.5L18 9.5" stroke-dasharray="1.6 1.8"/>',
    tkFlatTB: '<path d="M2 15l16-8M2 4h16"/><path d="M2 15V4" stroke-dasharray="1.6 1.8"/>',
    tkDisjoint: '<path d="M2 15L18 9M2 5l16 4"/>',
    tkPitchfork: '<path d="M2 10h16M6 4.5h12M6 15.5h12M6 4.5v11"/><circle cx="2" cy="10" r="1.7" fill="var(--card,#fff)"/>',
    tkSchiff: '<path d="M2 12l16-3M7 5l11-1.5M7 15.5L18 14M7 5v10.5"/><circle cx="2" cy="12" r="1.7" fill="var(--card,#fff)"/>',
    tkSchiffMod: '<path d="M3 13l15-4M8 5l10-1.5M8 15.5L18 14M8 5v10.5"/><circle cx="3" cy="13" r="1.7" fill="var(--card,#fff)"/>',
    tkInsidePf: '<path d="M2 10h16M6 4.5h12M6 15.5h12M6 4.5v11"/><path d="M8 7.2h10M8 12.8h10" stroke-dasharray="1.6 1.8"/>',
    tkFibChannel: '<path d="M2 15L14 3M5 18L17 6"/><path d="M3.5 16.5L15.5 4.5" stroke-dasharray="1.6 1.8"/>',
    tkFibTime: '<path d="M3 3v14M6 3v14M9 3v14M13 3v14M18 3v14"/>',
    tkFibTrendTime: '<path d="M2 15l4-8 3 5"/><path d="M11 3v14M14 3v14M18 3v14" stroke-dasharray="1.6 1.8"/>',
    tkFibFan: '<path d="M3 17L18 3M3 17L18 8M3 17L18 12.5M3 17h15"/><circle cx="3" cy="17" r="1.7" fill="var(--card,#fff)"/>',
    tkFibCircles: '<circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r="5.5"/><circle cx="10" cy="10" r="8"/>',
    tkFibArcs: '<path d="M3 16a13 13 0 0113-13M7 16a9 9 0 019-9M11 16a5 5 0 015-5"/><circle cx="16" cy="16" r="1.7" fill="var(--card,#fff)"/>',
    tkFibWedge: '<path d="M3 17L17 4M3 17h15"/><path d="M9 17a6 6 0 00-1.8-4.3M14 17a11 11 0 00-3.3-7.8"/>',
    tkPitchfan: '<path d="M3 17L17 3M3 17L18 8M3 17L18 13M17 3l1 10"/><circle cx="3" cy="17" r="1.7" fill="var(--card,#fff)"/>',
    tkGannBox: '<rect x="3" y="3" width="14" height="14"/><path d="M8 3v14M12 3v14M3 8h14M3 12h14"/>',
    tkGannSq: '<rect x="3" y="3" width="14" height="14"/><path d="M3 3l14 14M17 3L3 17"/>',
    tkGannFan: '<path d="M3 17l15-15M3 17L18 9M3 17L10 2M3 17h15M3 17V2"/><circle cx="3" cy="17" r="1.7" fill="var(--card,#fff)"/>',
    tkXABCD: '<path d="M2 15L6 4l4 7 4-5 4 10"/><path d="M2 15l8-4" stroke-dasharray="1.6 1.8"/>',
    tkCypher: '<path d="M2 14L6 5l4 6 4-8 4 12"/>',
    tkHS: '<path d="M1 15l3-6 3 3 3-9 3 9 3-3 3 6"/><path d="M4 12h12" stroke-dasharray="1.6 1.8"/>',
    tkABCD: '<path d="M3 15l5-10 4 6 5-8"/>',
    tkTriPat: '<path d="M2 4l4 12 4-9 4 6 4-3"/><path d="M2 4l16 5M6 16l12-7" stroke-dasharray="1.6 1.8"/>',
    tkThreeDrives: '<path d="M1 16l3-5 2 2 4-6 2 2 4-6 3 2"/>',
    tkEw5: '<path d="M2 16l3-6 2 3 4-9 2 4 5-6"/>',
    tkEwABC: '<path d="M3 4l5 10 4-5 5 8"/>',
    tkEwTri: '<path d="M2 3l3 12 3-9 3 7 3-5 3 4"/>',
    tkEwWXY: '<path d="M3 4l5 8 4-4 5 9"/>',
    tkEwWXYXZ: '<path d="M1 4l3 7 3-3 3 6 3-3 3 4 3-2"/>',
    tkCyclic: '<path d="M3 3v14M8 3v14M13 3v14M18 3v14"/>',
    tkTimeCycles: '<path d="M2 15a4 4 0 018 0 4 4 0 018 0"/>',
    tkSine: '<path d="M1 10c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
    tkForecast: '<path d="M3 15l4-4" /><path d="M7 11l9-6" stroke-dasharray="1.6 1.8"/><circle cx="16" cy="5" r="2" fill="currentColor"/>',
    tkAvwap: '<path d="M2 14c3 0 4-6 7-6s4 4 9 2"/><circle cx="2" cy="14" r="1.7" fill="var(--card,#fff)"/><path d="M6 4v3M14 5v3"/>',
    tkBrush: '<path d="M3 15c3-1 2-5 5-6s3 3 5 2 3-5 4-7"/>',
    tkHighlighter: '<path d="M3 15c3-1 2-5 5-6s3 3 5 2 3-5 4-7" stroke-width="4" stroke-opacity=".35"/>',
    tkArrowMarker: '<path d="M3 13l8-8V8h6v4h-6v3z" transform="rotate(0)" fill="currentColor" fill-opacity=".2"/>',
    tkArrowUp: '<path d="M10 3l6 6h-3.5v8h-5V9H4z"/>',
    tkArrowDown: '<path d="M10 17l6-6h-3.5V3h-5v8H4z"/>',
    tkRotRect: '<path d="M5 3l12 5-4 9L1 12z"/>',
    tkPath: '<path d="M3 16l4-8 5 4 5-8"/><path d="M14 4h3v3"/>',
    tkEllipse: '<ellipse cx="10" cy="10" rx="8" ry="5"/>',
    tkPolyline: '<path d="M3 15L6 5l6 4 5-5-1 12z"/><circle cx="3" cy="15" r="1.7" fill="var(--card,#fff)"/><circle cx="6" cy="5" r="1.7" fill="var(--card,#fff)"/><circle cx="12" cy="9" r="1.7" fill="var(--card,#fff)"/>',
    tkArc: '<path d="M2 16C5 4 15 4 18 16"/>',
    tkCurve: '<path d="M2 16C4 6 9 4 18 4"/><circle cx="2" cy="16" r="1.7" fill="var(--card,#fff)"/><circle cx="18" cy="4" r="1.7" fill="var(--card,#fff)"/>',
    tkDoubleCurve: '<path d="M2 14c3-10 6-10 8-4s5 6 8-4"/>',
    tkNote: '<path d="M4 3h12v10l-4 4H4z"/><path d="M12 17v-4h4M7 7h6M7 10h4"/>',
    tkPriceNote: '<path d="M2 15l6-6"/><path d="M8 5h10v7H8z"/><circle cx="2" cy="15" r="1.7" fill="var(--card,#fff)"/>',
    tkSignpost: '<path d="M10 18V7"/><path d="M4 2h11l2 2.5L15 7H4z"/>',
    tkComment: '<path d="M3 4h14v9h-7l-4 4v-4H3z"/>',
    tkFlag: '<path d="M5 18V2"/><path d="M5 3h11l-3 4 3 4H5"/>',
    tkEmoji: '<circle cx="10" cy="10" r="7.5"/><path d="M6.8 12a4 4 0 006.4 0"/><circle cx="7.5" cy="8" r=".9" fill="currentColor"/><circle cx="12.5" cy="8" r=".9" fill="currentColor"/>',
    zoom: '<circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.5 12.5L18 18M8.5 6v5M6 8.5h5"/>',
    stay: '<path d="M4 16l1-4 8-8 3 3-8 8z"/><path d="M14 13v4M12 15h4"/>',
    tree: '<path d="M4 4h5M4 10h5M4 16h5"/><rect x="11" y="2.5" width="6" height="3" rx="1"/><rect x="11" y="8.5" width="6" height="3" rx="1"/><rect x="11" y="14.5" width="6" height="3" rx="1"/>',
    star: '<path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z"/>',
    starOn: '<path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z" fill="currentColor"/>',
    chevL: '<path d="M12 5l-5 5 5 5"/>',
    chevR: '<path d="M8 5l5 5-5 5"/>',
    grip: '<circle cx="7" cy="5" r="1.1" fill="currentColor"/><circle cx="13" cy="5" r="1.1" fill="currentColor"/><circle cx="7" cy="10" r="1.1" fill="currentColor"/><circle cx="13" cy="10" r="1.1" fill="currentColor"/><circle cx="7" cy="15" r="1.1" fill="currentColor"/><circle cx="13" cy="15" r="1.1" fill="currentColor"/>',
    eyeOff: '<path d="M2 10s3-6 8-6c2 0 3.6.9 4.9 2M18 10s-3 6-8 6c-2 0-3.6-.9-4.9-2M3 17L17 3"/>'
  };
  const icon = (n, s) => `<svg width="${s || 20}" height="${s || 20}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;
  const GROUPS = [
    ["cursor", "Cursores", [["cursor", "Cruz"], ["cursorDot", "Punto"], ["cursorArrow", "Flecha"], ["eraser", "Borrador"]]],
    ["lines", "Líneas de tendencia", [["#", "Líneas"], ["segment", "Línea de tendencia"], ["rayLine", "Rayo"], ["tkInfoLine", "Línea de información"], ["straightLine", "Línea extendida"], ["tkAngle", "Ángulo de tendencia"], ["horizontalStraightLine", "Línea horizontal"], ["horizontalRayLine", "Rayo horizontal"], ["verticalStraightLine", "Línea vertical"], ["tkCross", "Línea cruzada"], ["priceLine", "Línea de precio"],
      ["#", "Canales"], ["parallelStraightLine", "Canal paralelo"], ["tkRegression", "Tendencia de regresión"], ["tkFlatTB", "Techo o suelo plano"], ["tkDisjoint", "Canal disjunto"], ["priceChannelLine", "Canal de precio"],
      ["#", "Horquillas"], ["tkPitchfork", "Horquilla"], ["tkSchiff", "Horquilla de Schiff"], ["tkSchiffMod", "Horquilla de Schiff modificada"], ["tkInsidePf", "Horquilla interior"]]],
    ["fib", "Fibonacci y Gann", [["#", "Fibonacci"], ["fibonacciLine", "Retroceso de Fibonacci"], ["tkFibExt", "Extensión de Fibonacci basada en tendencia"], ["tkFibChannel", "Canal de Fibonacci"], ["tkFibTime", "Zonas de tiempo de Fibonacci"], ["tkFibFan", "Abanico de velocidad y resistencia"], ["tkFibTrendTime", "Tiempo de Fibonacci basado en tendencia"], ["tkFibCircles", "Círculos de Fibonacci"], ["tkFibArcs", "Arcos de velocidad y resistencia"], ["tkFibWedge", "Cuña de Fibonacci"], ["tkPitchfan", "Abanico de horquilla"],
      ["#", "Gann"], ["tkGannBox", "Caja de Gann"], ["tkGannSq", "Cuadrado de Gann fijo"], ["tkGannFan", "Abanico de Gann"]]],
    ["patterns", "Patrones", [["#", "Patrones"], ["tkXABCD", "Patrón XABCD"], ["tkCypher", "Patrón Cypher"], ["tkHS", "Hombro-cabeza-hombro"], ["tkABCD", "Patrón ABCD"], ["tkTriPat", "Patrón de triángulo"], ["tkThreeDrives", "Patrón de tres impulsos"],
      ["#", "Ondas de Elliott"], ["tkEw5", "Onda de impulso (12345)"], ["tkEwABC", "Onda de corrección (ABC)"], ["tkEwTri", "Triángulo (ABCDE)"], ["tkEwWXY", "Combinación doble (WXY)"], ["tkEwWXYXZ", "Combinación triple (WXYXZ)"],
      ["#", "Ciclos"], ["tkCyclic", "Líneas cíclicas"], ["tkTimeCycles", "Ciclos de tiempo"], ["tkSine", "Línea sinusoidal"]]],
    ["measure", "Previsión y medición", [["#", "Previsión"], ["tkLong", "Posición larga"], ["tkShort", "Posición corta"], ["tkForecast", "Previsión"], ["#", "Volumen"], ["tkAvwap", "VWAP anclado"], ["#", "Medición"], ["tkPriceRange", "Rango de precios"], ["tkDateRange", "Rango de fechas"], ["tkMeasure", "Rango de fecha y precio"]]],
    ["shapes", "Formas geométricas", [["#", "Pinceles"], ["tkBrush", "Pincel"], ["tkHighlighter", "Rotulador"], ["#", "Flechas"], ["tkArrowMarker", "Marcador de flecha"], ["tkArrow", "Flecha"], ["tkArrowUp", "Flecha hacia arriba"], ["tkArrowDown", "Flecha hacia abajo"],
      ["#", "Formas"], ["tkRect", "Rectángulo"], ["tkRotRect", "Rectángulo girado"], ["tkPath", "Trayecto"], ["tkCircle", "Círculo"], ["tkEllipse", "Elipse"], ["tkPolyline", "Polilínea"], ["tkTriangle", "Triángulo"], ["tkArc", "Arco"], ["tkCurve", "Curva"], ["tkDoubleCurve", "Curva doble"]]],
    ["text", "Anotaciones", [["tkText", "Texto"], ["tkNote", "Nota"], ["tkPriceNote", "Nota de precio"], ["tkSignpost", "Señal"], ["tkCallout", "Globo con flecha"], ["tkComment", "Comentario"], ["tkPriceLabel", "Etiqueta de precio"], ["tkFlag", "Bandera"]]],
    ["emoji", "Emojis", [["tkEmoji", "Emojis y pegatinas"]]]
  ];
  const TOOL_NAME = Object.fromEntries(GROUPS.flatMap(g => g[2]).filter(x => x[0] !== "#"));
  const CURSORS = ["cursor", "cursorDot", "cursorArrow", "eraser"], FREE = ["tkBrush", "tkHighlighter", "tkPath", "tkPolyline"];
  const EMOJIS = "😀 😂 😍 🤔 😎 😴 😡 😱 🥳 🤑 👍 👎 👀 🙏 💪 🔥 🚀 💰 💸 📈 📉 ⚠️ ✅ ❌ ⭐ 🎯 ⏰ 🧠 💡 🔔 🏁 🛑 ⬆️ ⬇️ ➡️ ⬅️ 🐂 🐻 💎 🌙".split(" ");
  const TEXTABLE = ["tkRect", "tkCircle", "tkText", "tkCallout", "tkPriceLabel", "tkNote", "tkPriceNote", "tkSignpost", "tkComment", "tkFlag", "tkArrowUp", "tkArrowDown", "tkEmoji"];
  const FILLABLE = ["tkRect", "tkCircle", "tkTriangle", "tkRotRect", "tkEllipse", "tkPolyline"];
  const BUILTIN = ["segment", "rayLine", "straightLine", "horizontalStraightLine", "horizontalRayLine", "verticalStraightLine", "priceLine", "parallelStraightLine", "priceChannelLine", "fibonacciLine"];

  /* ---------- fuentes de precios ---------- */
  function binance() {
    const iv = tf => tf === "1w" ? "1w" : tf;
    return {
      id: "binance", label: "Binance · en vivo",
      async bars(sym, tf, to) {
        const b = binSym(sym), lim = 1000;
        const r = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${b}&interval=${iv(tf)}&limit=${lim}${to ? "&endTime=" + (to - 1) : ""}`);
        if (!r.ok) throw new Error("Binance " + r.status);
        const d = await r.json();
        return { bars: d.map(k => ({ timestamp: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] })), more: d.length === lim };
      },
      subscribe(sym, tf, cb) {
        let ws = null, alive = true;
        const open = () => {
          if (!alive) return;
          ws = new WebSocket(`wss://data-stream.binance.vision/ws/${binSym(sym).toLowerCase()}@kline_${iv(tf)}`);
          ws.onmessage = ev => { try { const k = JSON.parse(ev.data).k; if (k) cb({ timestamp: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v }); } catch (e) { /* mensaje raro */ } };
          ws.onclose = () => { if (alive) setTimeout(open, 3000); };
        };
        open();
        return () => { alive = false; try { ws && ws.close(); } catch (e) { /* ya cerrado */ } };
      }
    };
  }
  function publico(invoke, digits) {
    let delayed = false;
    const round = v => +(+v).toFixed(digits);
    const p = {
      id: "publico", get label() { return delayed ? "Precio público · con retraso" : "Precio público"; },
      async bars(sym, tf, to) {
        const { data, error } = await invoke("velas", { sym, tf, to: to ? Math.floor(to / 1000) - 1 : undefined });
        if (error || !data || data.error) throw new Error((data && data.error) || (error && error.message) || "sin datos");
        delayed = !!data.delayed;
        return { bars: data.bars.map(b => ({ timestamp: b[0], open: round(b[1]), high: round(b[2]), low: round(b[3]), close: round(b[4]), volume: b[5] || 0 })), more: !!data.more };
      },
      subscribe(sym, tf, cb) {
        let alive = true, t = null;
        const tick = async () => { if (!alive) return; try { const r = await p.bars(sym, tf, null); r.bars.slice(-2).forEach(cb); } catch (e) { /* lo intenta otra vez */ } if (alive) t = setTimeout(tick, 15000); };
        t = setTimeout(tick, 15000);
        return () => { alive = false; clearTimeout(t); };
      }
    };
    return p;
  }

  /* ---------- el gráfico ---------- */
  let inst = null;
  const ALL = new Set(), MODES = {};
  function mount(el, opts) {
    for (const x of Array.from(ALL)) if (x.el === el || !document.body.contains(x.el)) destroyOne(x);
    const KEY = opts.key || "main", TFK = KEY === "main" ? "tk-tf" : "tk-tf-" + KEY;
    let MODE = MODES[KEY] || "live";
    let me = null;
    DARK = !!opts.dark;
    const st = { sym: opts.sym, tf: ls.get(TFK, opts.tf || "5m"), tool: "cursor", magnet: ls.get("tk-magnet", false), stay: ls.get("tk-stay", false), favShow: ls.get("tk-favshow", true), fav: ls.get("tk-fav", ["segment", "horizontalStraightLine", "fibonacciLine", "tkRect", "tkLong", "tkShort", "tkText"]), baseCur: ls.get("tk-cur", "cursor"), emoji: "🚀", hidden: false, locked: false, sel: null, prov: null, unsub: null, quiet: false, price: null,
      color: ls.get("tk-color", null), last: ls.get("tk-lasttool", {}), hist: [], fut: [] };
    if (!TF_MS[st.tf]) st.tf = "5m";
    CUR_TF = st.tf;
    const magMode = () => st.magnet === "strong" ? "strong_magnet" : st.magnet ? "weak_magnet" : "normal";
    const magTitle = () => st.magnet === "strong" ? "Imán fuerte: pega los puntos al precio exacto de la vela" : st.magnet ? "Imán débil: pega los puntos cuando estás cerca de la vela" : "Imán apagado";
    const R = { on: false, all: [], idx: 0, timer: null, speed: ls.get("tk-speed", 2), cb: null, pos: null, trades: [], picking: false };
    const groupBtn = g => { const cur = st.last[g[0]] && TOOL_NAME[st.last[g[0]]] ? st.last[g[0]] : g[2].find(x => x[0] !== "#")[0]; return `<div class="gx-grp" data-grp="${g[0]}"><button type="button" class="gx-tool" data-tool="${cur}" aria-pressed="${cur === "cursor"}" aria-label="${esc(TOOL_NAME[cur])}" title="${esc(TOOL_NAME[cur])}">${icon(cur)}</button>${g[2].length > 1 ? `<button type="button" class="gx-more" data-more="${g[0]}" aria-label="Más herramientas: ${esc(g[1])}" title="${esc(g[1])}"><svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true"><path d="M0 6L6 6 6 0z" fill="currentColor"/></svg></button>` : ""}</div>`; };
    el.innerHTML = `<div class="gx">
      <div class="gx-top" role="toolbar" aria-label="Barra del gráfico">
        <div class="gx-mode" role="group" aria-label="Modo del gráfico"><button type="button" data-mode="live" aria-pressed="true" title="Gráfico en vivo para analizar">${icon("candles", 16)}<span>Analizar</span></button><button type="button" data-mode="bt" aria-pressed="false" title="Vuelve atrás en el tiempo y practica vela a vela">${icon("replay", 15)}<span>Backtesting</span></button></div>
        <span class="gx-vs"></span>
        <button type="button" class="gx-tb gx-sym" data-act="symbol" title="Buscar mercado">${icon("search", 16)}<b class="gx-symname">${esc(st.sym)}</b></button>
        <span class="gx-vs"></span>
        <div class="gx-tfq" role="group" aria-label="Marcos de tiempo favoritos"></div>
        <button type="button" class="gx-tb gx-tfdd" data-menu="tf" title="Todos los marcos (o escribe 5, 15, 1h, 4h, D…)"><b class="gx-tfname">${TF_SHORT[st.tf]}</b>${icon("chev", 14)}</button>
        <span class="gx-vs"></span>
        <button type="button" class="gx-tb" data-menu="type" title="Tipo de gráfico"><span class="gx-typeic">${icon(typeIcon(CFG.type), 18)}</span>${icon("chev", 14)}</button>
        <span class="gx-vs"></span>
        <button type="button" class="gx-tb" data-act="ind" title="Indicadores">${icon("fx", 18)}<span>Indicadores</span></button>
        <span class="gx-vs"></span>
        <button type="button" class="gx-tb gx-ic" data-act="undo" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">${icon("undo", 18)}</button>
        <button type="button" class="gx-tb gx-ic" data-act="redo" title="Rehacer" aria-label="Rehacer">${icon("redo", 18)}</button>
        <span class="gx-sp"></span>
        <span class="gx-src" aria-live="polite"></span>
        <button type="button" class="gx-tb gx-ic" data-act="settings" title="Ajustes del gráfico" aria-label="Ajustes del gráfico">${icon("gear", 18)}</button>
        <button type="button" class="gx-tb gx-ic" data-act="shot" title="Guardar imagen del gráfico" aria-label="Guardar imagen del gráfico">${icon("camera", 18)}</button>
        <button type="button" class="gx-tb gx-ic" data-act="full" title="Pantalla completa" aria-label="Pantalla completa">${icon("full", 18)}</button>
      </div>
      <div class="gx-body">
        <div class="gx-tools" role="toolbar" aria-label="Herramientas de dibujo">
          ${GROUPS.map(groupBtn).join("")}
          <span class="gx-tsep"></span>
          <button type="button" class="gx-tool" data-act="zoom" aria-label="Acercar" title="Acercar (Mayús + clic para alejar)">${icon("zoom")}</button>
          <button type="button" class="gx-tool gx-mag" data-act="magnet" aria-pressed="${!!st.magnet}" data-strong="${st.magnet === "strong"}" aria-label="Imán" title="${magTitle()}">${icon("magnet")}</button>
          <button type="button" class="gx-tool" data-act="stay" aria-pressed="${st.stay}" aria-label="Seguir dibujando" title="Seguir en modo dibujo: la herramienta no se suelta al terminar">${icon("stay")}</button>
          <button type="button" class="gx-tool" data-act="lockall" aria-pressed="false" aria-label="Bloquear todos los dibujos" title="Bloquear todos los dibujos">${icon("lock")}</button>
          <button type="button" class="gx-tool" data-act="hide" aria-pressed="false" aria-label="Ocultar todos los dibujos" title="Ocultar todos los dibujos">${icon("eye")}</button>
          <button type="button" class="gx-tool" data-act="clear" aria-label="Borrar todos los dibujos de este mercado" title="Borrar todos los dibujos de este mercado">${icon("trash")}</button>
          <span class="gx-tsep"></span>
          <button type="button" class="gx-tool" data-act="tree" aria-label="Lista de dibujos" title="Lista de dibujos">${icon("tree")}</button>
          <button type="button" class="gx-tool gx-hidet" data-act="hidetools" aria-label="Guardar la barra de herramientas" title="Guardar la barra de herramientas">${icon("chevL")}</button>
          <button type="button" class="gx-tool" data-act="favbar" aria-pressed="${st.favShow}" aria-label="Barra de favoritos" title="Barra de favoritos (marca herramientas con la estrella)">${icon(st.favShow ? "starOn" : "star")}</button>
        </div>
        <div class="gx-canvas"><div class="gx-tfbox" hidden role="status"><span>Marco</span><b></b><small>Intro para cambiar</small></div><button type="button" class="gx-showtools" data-act="showtools" aria-label="Mostrar la barra de herramientas" title="Mostrar la barra de herramientas">${icon("chevR", 14)}</button><div class="gx-chart"></div><svg class="gx-free" hidden aria-hidden="true"></svg><div class="gx-favbar" hidden role="toolbar" aria-label="Herramientas favoritas"><span class="gx-fgrip" title="Arrastra para mover">${icon("grip", 16)}</span><div class="gx-favs"></div></div><div class="gx-btbadge" hidden>Backtesting · <span></span></div><div class="gx-msg" hidden></div><div class="gx-hint" hidden></div>
          <div class="gx-float" hidden role="toolbar" aria-label="Dibujo elegido">
            <div class="gx-sw">${PALETTE.map(c => `<button type="button" class="gx-c" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join("")}<label class="gx-cc" title="Otro color"><input type="color" data-f="color" aria-label="Otro color"></label></div>
            <span class="gx-vs"></span>
            <label class="gx-fl"><span class="sr">Grosor</span><select data-f="width">${[1, 1.5, 2, 3, 4].map(w => `<option value="${w}">${String(w).replace(".", ",")} px</option>`).join("")}</select></label>
            <label class="gx-fl"><span class="sr">Estilo de línea</span><select data-f="dash"><option value="solid">Continua</option><option value="dashed">Discontinua</option><option value="dotted">Punteada</option></select></label>
            <span class="gx-ftext"><span class="gx-vs"></span><input type="text" data-f="text" placeholder="Escribe un texto…" aria-label="Texto del dibujo" maxlength="120">
              <label class="gx-fl"><span class="sr">Tamaño del texto</span><select data-f="size">${[11, 12, 14, 16, 20, 24, 32].map(s => `<option value="${s}">${s}</option>`).join("")}</select></label></span>
            <label class="gx-fill"><input type="checkbox" data-f="fill"> Relleno</label>
            <span class="gx-vs"></span>
            <button type="button" class="gx-tb gx-ic" data-fa="lock" aria-pressed="false" title="Bloquear" aria-label="Bloquear dibujo">${icon("lock", 17)}</button>
            <button type="button" class="gx-tb gx-ic" data-fa="dup" title="Duplicar" aria-label="Duplicar dibujo">${icon("dup", 17)}</button>
            <button type="button" class="gx-tb gx-ic" data-fa="del" title="Borrar (Supr)" aria-label="Borrar dibujo">${icon("trash", 17)}</button>
          </div>
        </div>
      </div>
      <div class="gx-pop" hidden></div>
      <div class="gx-modal" hidden><div class="gx-dlg" role="dialog" aria-modal="true"></div></div>
      <div class="gx-replay" hidden>
        <div class="gx-rrow gx-start">
          <b class="gx-rtitle">¿Desde cuándo quieres practicar?</b>
          <button type="button" class="gx-btn" data-back="1">Hace 1 día</button><button type="button" class="gx-btn" data-back="7">1 semana</button><button type="button" class="gx-btn" data-back="30">1 mes</button><button type="button" class="gx-btn" data-back="90">3 meses</button>
          <label class="gx-date"><span class="sr">Fecha y hora</span><input type="datetime-local" class="gx-in"></label><button type="button" class="gx-btn" data-act="godate">Ir</button>
          <span class="gx-rhelp">o toca una vela del gráfico</span>
        </div>
        <div class="gx-play" hidden>
          <div class="gx-rrow">
            <button type="button" class="gx-pb gx-w" data-act="back10" aria-label="Retroceder 10 velas" title="Retroceder 10 velas (Mayús + ←)">−10</button>
            <button type="button" class="gx-pb" data-act="prev" aria-label="Retroceder una vela" title="Retroceder una vela (←)">◀︎</button>
            <button type="button" class="gx-pb gx-main" data-act="play" aria-label="Reproducir" title="Reproducir / pausa (espacio)">▶︎</button>
            <button type="button" class="gx-pb" data-act="next" aria-label="Avanzar una vela" title="Avanzar una vela (→)">▶︎▏</button>
            <button type="button" class="gx-pb gx-w" data-act="fwd10" aria-label="Avanzar 10 velas" title="Avanzar 10 velas (Mayús + →)">+10</button>
            <button type="button" class="gx-pb gx-w gx-cutb" data-act="cut" aria-pressed="false" title="Elegir punto: toca cualquier vela, atrás o adelante, y sigue desde ahí (C)">${icon("cut", 16)}<span>Elegir punto</span></button>
            <label class="gx-spd"><span class="sr">Velocidad</span><select class="gx-in" data-act="speed">${[1, 2, 5, 10, 20].map(v => `<option value="${v}" ${v === R.speed ? "selected" : ""}>${v} velas/s</option>`).join("")}</select></label>
            <span class="gx-when"></span>
            <span class="gx-sp"></span>
            <button type="button" class="gx-sb gx-sell" data-sim="sell">Vender</button><button type="button" class="gx-sb gx-buy" data-sim="buy">Comprar</button>
            <button type="button" class="gx-btn" data-act="closesim" hidden>Cerrar ahora</button>
            <button type="button" class="gx-btn" data-act="restart">Otra fecha</button>
          </div>
          <div class="gx-rrow gx-scrub"><span class="gx-s0"></span><input type="range" class="gx-range" min="1" max="2" value="1" step="1" aria-label="Arrastra para ir a cualquier punto"><span class="gx-s1">Ahora</span></div>
        </div>
        <div class="gx-rrow gx-stats"></div>
      </div>
    </div>`;
    const $ = s => el.querySelector(s), $$ = s => Array.from(el.querySelectorAll(s));
    const box = $(".gx-chart");
    const ch = KC.init(box, { locale: "es-ES", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid", styles: styles(), decimalFold: { threshold: 99 } });
    const paintBg = () => { box.style.background = CFG.bg || ""; };
    paintBg();
    let lastCross = null;
    ch.subscribeAction("onCrosshairChange", d => { lastCross = d; });
    function crossBar() {
      if (!lastCross) return null;
      if (lastCross.kLineData) return lastCross.kLineData;
      if (lastCross.x == null) return null;
      try {
        let r = ch.convertFromPixel([{ x: lastCross.x, y: lastCross.y }], { paneId: lastCross.paneId || "candle_pane" }); r = Array.isArray(r) ? r[0] : r;
        const list = ch.getDataList(); if (!r || !list.length) return null;
        if (r.dataIndex != null) return list[Math.max(0, Math.min(list.length - 1, r.dataIndex))] || null;
        if (r.timestamp != null) { let best = null; for (const b of list) { if (b.timestamp <= r.timestamp) best = b; else break; } return best; }
      } catch (e) { /* fuera del gráfico */ }
      return null;
    }

    const msg = t => { const m = $(".gx-msg"); m.hidden = !t; m.textContent = t || ""; };
    const hint = t => { const m = $(".gx-hint"); m.hidden = !t; m.textContent = t || ""; };
    const setSrc = () => { $(".gx-src").textContent = R.on ? "Práctica · " + (st.prov ? st.prov.label.split(" · ")[0] : "") : (st.prov ? st.prov.label : ""); };
    const digits = () => (opts.digits && opts.digits(st.sym)) || guessDigits(st.sym);
    const curColor = () => st.color || pal().cob;
    function pickProv() {
      if (opts.mt5 && opts.mt5.has(st.sym)) return opts.mt5.provider(st.sym);
      if (binSym(st.sym)) return binance();
      return publico(opts.invoke, digits());
    }

    /* datos en vivo (en KLineChart 10, «forward» = velas más antiguas y «backward» = más nuevas) */
    const live = {
      getBars: async ({ type, timestamp, callback }) => {
        if (type === "backward") { callback([], { backward: false }); return; }
        const prov = st.prov;
        try {
          if (type === "init") msg("Cargando precios…");
          const r = await prov.bars(st.sym, st.tf, type === "forward" ? timestamp : null);
          if (prov !== st.prov) return;
          if (type === "init" && st.anchor && r.bars.length) {
            const need = st.anchor - (TF_MS[st.tf] || 3e5) * 60; let guard = 0;
            while (r.more && r.bars.length && r.bars[0].timestamp > need && guard++ < 8) {
              const o = await prov.bars(st.sym, st.tf, r.bars[0].timestamp); if (prov !== st.prov) return;
              const older = o.bars.filter(b => b.timestamp < r.bars[0].timestamp); if (!older.length) { r.more = false; break; }
              r.bars = older.concat(r.bars); r.more = o.more;
            }
            st.anchor = null;
          }
          msg(type === "init" && !r.bars.length ? "No hay velas para este mercado en este marco." : "");
          callback(r.bars, { forward: r.more && r.bars.length > 0, backward: false });
          if (type === "init" && r.bars.length) { st.price = r.bars[r.bars.length - 1].close; opts.onPrice && opts.onPrice(st.price, st.sym); }
          setSrc();
        } catch (e) {
          if (type === "init") msg("No se pudieron cargar los precios de " + st.sym + ". " + (/no disponible/i.test(e.message) ? "Este mercado o marco aún no tiene precios públicos." : "Prueba otra vez en un momento."));
          callback([], false);
        }
      },
      subscribeBar: ({ callback }) => {
        if (st.unsub) st.unsub();
        st.unsub = st.prov.subscribe(st.sym, st.tf, bar => { callback(bar); st.price = bar.close; opts.onPrice && opts.onPrice(bar.close, st.sym); });
      },
      unsubscribeBar: () => { if (st.unsub) { st.unsub(); st.unsub = null; } }
    };
    const replayLoader = {
      getBars: ({ type, callback }) => { if (type === "init") callback(R.all.slice(0, R.idx + 1), { backward: false, forward: false }); else callback([], false); },
      subscribeBar: ({ callback }) => { R.cb = callback; },
      unsubscribeBar: () => { R.cb = null; }
    };
    function load() {
      st.prov = pickProv(); setSrc(); CUR_DIGITS = digits(); CUR_TF = st.tf;
      ch.setSymbol({ ticker: st.sym, pricePrecision: digits(), volumePrecision: 0 });
      ch.setPeriod(TFS.find(t => t[0] === st.tf)[2]);
      $(".gx-symname").textContent = st.sym;
    }
    ch.setDataLoader(live);

    /* ---------- indicadores ---------- */
    function activeInd() {
      let a = ls.get("tk-ind2", null);
      if (!a) a = (ls.get("tk-ind", []) || []).filter(n => IND_BY[n]).map(n => ({ n, p: IND_BY[n][5].slice(), c: null }));
      return a.filter(x => IND_BY[x.n]);
    }
    function applyInd() {
      ch.removeIndicator();
      const def = IND_COLORS();
      activeInd().forEach(x => {
        const meta = IND_BY[x.n], v = { name: x.n, calcParams: x.p && x.p.length ? x.p : meta[5] };
        if (["RSI", "MACD", "KDJ", "STOCHRSI", "CCI", "WR", "DMI", "PSY", "BIAS", "VR", "BRAR", "CR", "TRIX", "ROC"].includes(x.n)) v.precision = 2;
        if (["ATR", "MA", "EMA", "WMA", "VWAP", "BOLL", "SAR", "BBI", "ICHIMOKU", "SUPERTREND", "KELTNER", "DONCHIAN"].includes(x.n)) v.precision = digits();
        if (x.c) { const cols = [x.c].concat(def.filter(c => c !== x.c)); v.styles = { lines: cols.map(c => ({ color: c, size: 1.5, style: "solid", smooth: false, dashedValue: [2, 2] })) }; }
        if (meta[4]) { v.paneId = "candle_pane"; ch.createIndicator(v, true); } else ch.createIndicator(v, false);
      });
    }
    function saveInd(a) { ls.set("tk-ind2", a); applyInd(); }

    /* ---------- dibujos ---------- */
    const evs = () => ({
      onDrawEnd: e => { const k = st.tool; afterDraw(e.overlay); save(); doneTool(k); if (!st.stay) showFloat(e.overlay.id, TEXTABLE.includes(e.overlay.name) && e.overlay.name !== "tkEmoji"); },
      onPressedMoveEnd: e => { afterDraw(e.overlay); save(); },
      onRemoved: () => { if (!st.quiet) queueSave(); },
      onRightClick: e => { removeSel(e.overlay.id); return true; },
      onSelected: e => { if (st.tool === "eraser") { removeSel(e.overlay.id); return; } showFloat(e.overlay.id, false); },
      onDeselected: () => hideFloat()
    });
    function afterDraw(o) {
      if (o.name === "tkPos" && !(o.extendData && o.extendData.sim) && o.points.length >= 3 && opts.onPosition) {
        opts.onPosition({ side: o.extendData.side, entry: o.points[0].value, stop: o.points[1].value, tp: o.points[2].value, digits: digits() });
      }
    }
    const getOv = id => ch.getOverlays({ id })[0];
    function serial() { return ch.getOverlays({ groupId: "draw" }).map(o => ({ name: o.name, points: o.points.map(p => ({ timestamp: p.timestamp, value: p.value })), extendData: o.extendData, styles: o.styles, lock: o.lock })); }
    let saveT = null;
    let pend = null, qT = null;
    function flushRemote() { clearTimeout(saveT); if (!pend) return; const p = pend; pend = null; try { opts.saveDrawings && opts.saveDrawings(p.sym, p.list, p.t); } catch (e) { /* lo reintenta la copia local */ } }
    function persist(list) { const sym = st.sym, t = Date.now(); ls.set("tk-draw-" + sym, { t, list }); pend = { sym, list, t }; clearTimeout(saveT); saveT = setTimeout(flushRemote, 500); }
    const queueSave = () => { clearTimeout(qT); qT = setTimeout(() => { if (!st.quiet) save(); }, 0); };
    const onHide = () => { if (document.visibilityState === "hidden") flushRemote(); };
    document.addEventListener("visibilitychange", onHide); window.addEventListener("pagehide", flushRemote);
    function save() {
      const list = serial(), j = JSON.stringify(list);
      if (st.hist[st.hist.length - 1] !== j) { st.hist.push(j); if (st.hist.length > 60) st.hist.shift(); st.fut = []; }
      persist(list);
    }
    function build(list) {
      st.quiet = true; ch.removeOverlay({ groupId: "draw" }); st.quiet = false;
      (list || []).forEach(d => { if (d && d.name && d.points) ch.createOverlay(Object.assign({ name: d.name, groupId: "draw", points: d.points, extendData: d.extendData, styles: d.styles, lock: !!d.lock || st.locked, visible: !st.hidden, mode: magMode() }, evs())); });
    }
    async function restore() {
      const loc = ls.get("tk-draw-" + st.sym, null), lt = loc && !Array.isArray(loc) ? loc.t || 0 : 0;
      let list = loc ? (Array.isArray(loc) ? loc : loc.list) : null;
      if (opts.loadDrawings) {
        try {
          const rem = await opts.loadDrawings(st.sym);
          if (rem) { const rl = Array.isArray(rem) ? rem : rem.list, rt = Array.isArray(rem) ? 0 : rem.t || 0; if (!loc || rt > lt || (!lt && !rt && rl)) list = rl; else if (lt > rt && loc) { pend = { sym: st.sym, list, t: lt }; flushRemote(); } }
        } catch (e) { /* uso la copia local */ }
      }
      build(list); st.hist = [JSON.stringify(serial())]; st.fut = [];
    }
    function undo() { if (st.hist.length < 2) return; st.fut.push(st.hist.pop()); const l = JSON.parse(st.hist[st.hist.length - 1]); build(l); persist(l); hideFloat(); }
    function redo() { if (!st.fut.length) return; const j = st.fut.pop(); st.hist.push(j); const l = JSON.parse(j); build(l); persist(l); hideFloat(); }
    function newStyle(name) {
      const ed = { color: curColor(), width: 1.5, dash: "solid" };
      if (name === "tkText") { ed.text = "Texto"; ed.size = 16; }
      if (name === "tkCallout") { ed.text = "Nota"; ed.size = 13; }
      if (name === "tkNote") { ed.text = "Nota"; ed.size = 13; }
      if (name === "tkSignpost") { ed.text = "Señal"; ed.size = 12; }
      if (name === "tkComment") { ed.text = "Comentario"; ed.size = 13; }
      if (name === "tkPriceNote" || name === "tkFlag" || name === "tkArrowUp" || name === "tkArrowDown") { ed.text = ""; ed.size = 12; }
      if (name === "tkEmoji") { ed.text = st.emoji || "🙂"; ed.size = 28; }
      return ed;
    }
    function applyCursor() {
      const c = st.baseCur, g = el.querySelector(".gx"); g.dataset.cur = c === "cursorDot" ? "dot" : c === "cursorArrow" ? "arrow" : c === "eraser" ? "eraser" : "";
      try { const show = c === "cursor" || c === "eraser"; ch.setStyles({ crosshair: { horizontal: { line: { show } }, vertical: { line: { show } } } }); } catch (e) { /* estilo no disponible */ }
    }
    function setTool(k) {
      if (FR && FR.k !== k) endFree(false);
      if (k === "cursor") k = st.baseCur || "cursor";
      st.tool = k;
      $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === k)));
      if (CURSORS.includes(k)) { st.baseCur = k; ls.set("tk-cur", k); applyCursor(); if (k === "eraser") hint("Borrador: toca un dibujo para borrarlo."), setTimeout(() => hint(""), 2500); return; }
      hideFloat();
      if (FREE.includes(k)) { startFree(k); return; }
      const name = k === "tkLong" || k === "tkShort" ? "tkPos" : k;
      const ed = k === "tkLong" ? { side: "buy" } : k === "tkShort" ? { side: "sell" } : newStyle(name);
      const o = { name, groupId: "draw", extendData: ed, mode: magMode() };
      if (BUILTIN.includes(name)) o.styles = { line: lineSt(sty({ extendData: ed })), text: { color: ed.color } };
      ch.createOverlay(Object.assign(o, evs()));
    }
    const doneTool = k => setTool(st.stay && k && !CURSORS.includes(k) ? k : "cursor");
    /* favoritos */
    function toggleFav(k) { const i = st.fav.indexOf(k); if (i >= 0) st.fav.splice(i, 1); else st.fav.push(k); ls.set("tk-fav", st.fav); renderFav(); return i < 0; }
    function renderFav() {
      const bar = $(".gx-favbar"), box2 = $(".gx-favs");
      box2.innerHTML = st.fav.filter(k => TOOL_NAME[k]).map(k => `<button type="button" class="gx-tool" data-tool="${k}" aria-pressed="${st.tool === k}" aria-label="${esc(TOOL_NAME[k])}" title="${esc(TOOL_NAME[k])}">${icon(k)}</button>`).join("");
      bar.hidden = !st.favShow || !st.fav.length;
      const p = ls.get("tk-favpos", null); if (p) { bar.style.left = p.x + "px"; bar.style.top = p.y + "px"; bar.style.transform = "none"; }
      const fb = $('[data-act="favbar"]'); if (fb) { fb.setAttribute("aria-pressed", String(st.favShow)); fb.innerHTML = icon(st.favShow ? "starOn" : "star"); }
    }
    (() => {
      const grip = $(".gx-fgrip"), bar = $(".gx-favbar"); let d = null;
      grip.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(), pr = bar.parentNode.getBoundingClientRect(); d = { dx: e.clientX - r.left, dy: e.clientY - r.top, pr }; grip.setPointerCapture(e.pointerId); });
      grip.addEventListener("pointermove", e => { if (!d) return; const x = Math.max(0, Math.min(d.pr.width - bar.offsetWidth, e.clientX - d.pr.left - d.dx)), y = Math.max(0, Math.min(d.pr.height - bar.offsetHeight, e.clientY - d.pr.top - d.dy)); bar.style.left = x + "px"; bar.style.top = y + "px"; bar.style.transform = "none"; });
      grip.addEventListener("pointerup", () => { if (!d) return; d = null; ls.set("tk-favpos", { x: parseFloat(bar.style.left) || 0, y: parseFloat(bar.style.top) || 0 }); });
    })();
    function menuEmoji(btn) {
      openPop(btn, `<div class="gx-mh">Emojis</div><div class="gx-emojis">${EMOJIS.map(e => `<button type="button" class="gx-emo" data-pick="${e}" aria-label="${e}">${e}</button>`).join("")}</div>
        <div class="gx-mrow"><span class="gx-muted" style="padding:6px 8px">Elige uno y toca el gráfico</span><button type="button" class="gx-star" data-fav="tkEmoji" aria-pressed="${st.fav.includes("tkEmoji")}" aria-label="Favoritos" title="Favoritos">${icon(st.fav.includes("tkEmoji") ? "starOn" : "star", 15)}</button></div>`, k => { st.emoji = k; setTool("tkEmoji"); });
    }
    /* trazos libres */
    const SVGF = $(".gx-free"); let FR = null;
    function startFree(k) { FR = { k, px: [], down: false, hover: null }; SVGF.hidden = false; SVGF.innerHTML = ""; el.querySelector(".gx").classList.add("free"); hint(k === "tkBrush" || k === "tkHighlighter" ? "Arrastra sobre el gráfico para dibujar." : "Haz clic para añadir puntos. Doble clic o Intro para terminar" + (k === "tkPolyline" ? ", o toca el primer punto para cerrarla" : "") + ". Esc cancela."); }
    function drawFree() {
      if (!FR) return; const pts = FR.px.concat(FR.down || !FR.hover ? [] : [FR.hover]), col = curColor();
      SVGF.innerHTML = pts.length ? `<polyline points="${pts.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ")}" fill="none" stroke="${col}" stroke-opacity="${FR.k === "tkHighlighter" ? .35 : 1}" stroke-width="${FR.k === "tkHighlighter" ? 10 : 2}" stroke-linecap="round" stroke-linejoin="round"/>` + (FR.k === "tkPath" || FR.k === "tkPolyline" ? FR.px.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${col}"/>`).join("") : "") : "";
    }
    function pxToPts(px) {
      let r = ch.convertFromPixel(px.map(p => ({ x: p.x, y: p.y })), { paneId: "candle_pane" }); r = Array.isArray(r) ? r : [r];
      const L = ch.getDataList(), last = L[L.length - 1];
      return r.map(q => { let ts = q.timestamp; if (ts == null && q.dataIndex != null) ts = L[q.dataIndex] ? L[q.dataIndex].timestamp : last.timestamp + (q.dataIndex - (L.length - 1)) * TF_MS[st.tf]; return { timestamp: ts, value: q.value }; }).filter(q => q.timestamp != null && q.value != null);
    }
    function endFree(commit) {
      if (!FR) return; const f = FR; FR = null; SVGF.hidden = true; SVGF.innerHTML = ""; el.querySelector(".gx").classList.remove("free"); hint("");
      if (commit && f.px.length >= 2) {
        try {
          const pts = pxToPts(f.px); if (pts.length >= 2) {
            const p0 = pts[0], ed = Object.assign(newStyle(f.k), { pts: pts.map(q => [q.timestamp - p0.timestamp, q.value - p0.value]), closed: !!f.closed });
            if (f.k === "tkHighlighter") ed.color = st.color || "#e9b949";
            ch.createOverlay(Object.assign({ name: f.k, groupId: "draw", points: [p0, pts[pts.length - 1]], extendData: ed }, evs())); save();
          }
        } catch (e) { hint("No se pudo dibujar ahí."); setTimeout(() => hint(""), 2000); }
      }
      if (commit) doneTool(f.k); else setTool("cursor");
    }
    (() => {
      const pos = e => { const r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const block = e => { if (!FR) return; e.stopPropagation(); if (e.cancelable) e.preventDefault(); };
      ["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "click"].forEach(t => box.addEventListener(t, block, { capture: true, passive: false }));
      box.addEventListener("pointerdown", e => {
        if (!FR) return; e.stopPropagation(); e.preventDefault(); const p = pos(e);
        if (FR.k === "tkBrush" || FR.k === "tkHighlighter") { FR.down = true; FR.px = [p]; try { box.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ } }
        else { if (FR.k === "tkPolyline" && FR.px.length > 2 && Math.hypot(p.x - FR.px[0].x, p.y - FR.px[0].y) < 9) { FR.closed = true; endFree(true); return; } FR.px.push(p); }
        drawFree();
      }, true);
      box.addEventListener("pointermove", e => { if (!FR) return; e.stopPropagation(); const p = pos(e); if (FR.down) { const l = FR.px[FR.px.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 2.5) FR.px.push(p); } else FR.hover = p; drawFree(); }, true);
      box.addEventListener("pointerup", e => { if (!FR) return; e.stopPropagation(); if (FR.down) { FR.down = false; endFree(true); } }, true);
      box.addEventListener("dblclick", e => { if (!FR) return; e.stopPropagation(); e.preventDefault(); if (!FR.down) { const a = FR.px[FR.px.length - 1], b = FR.px[FR.px.length - 2]; if (a && b && Math.hypot(a.x - b.x, a.y - b.y) < 4) FR.px.pop(); endFree(true); } }, true);
    })();
    /* lista de dibujos */
    function modalTree() {
      const nameOf = o => o.name === "tkPos" ? ((o.extendData || {}).side === "sell" ? "Posición corta" : "Posición larga") : TOOL_NAME[o.name] || ({ segment: "Línea de tendencia" })[o.name] || o.name;
      const paint = () => {
        const list = ch.getOverlays({ groupId: "draw" });
        DLG.querySelector(".gx-tree").innerHTML = list.length ? list.map(o => `<div class="gx-trow"><span class="gx-tic">${icon(o.name === "tkPos" ? ((o.extendData || {}).side === "sell" ? "tkShort" : "tkLong") : o.name, 18)}</span><span class="gx-tname">${esc(nameOf(o))}${(o.extendData || {}).text ? " · " + esc(String(o.extendData.text).slice(0, 24)) : ""}</span>
          <button type="button" class="gx-tb gx-ic" data-tv="${o.id}" aria-label="${o.visible === false ? "Mostrar" : "Ocultar"}" title="${o.visible === false ? "Mostrar" : "Ocultar"}">${icon(o.visible === false ? "eyeOff" : "eye", 16)}</button>
          <button type="button" class="gx-tb gx-ic" data-tl="${o.id}" aria-pressed="${!!o.lock}" aria-label="Bloquear" title="Bloquear">${icon("lock", 16)}</button>
          <button type="button" class="gx-tb gx-ic" data-td="${o.id}" aria-label="Borrar" title="Borrar">${icon("trash", 16)}</button></div>`).join("") : `<div class="gx-muted" style="padding:16px">Aún no hay dibujos en ${esc(st.sym)}.</div>`;
      };
      openModal(`<div class="gx-dh"><h3>Dibujos de ${esc(st.sym)}</h3><button type="button" class="gx-tb gx-ic" data-close aria-label="Cerrar">${icon("x", 18)}</button></div><div class="gx-tree"></div>`, () => {
        paint();
        DLG.onclick = e => {
          const b = e.target.closest("button"); if (!b) return;
          if (b.hasAttribute("data-close")) { closeModal(); return; }
          if (b.dataset.tv) { const o = getOv(b.dataset.tv); ch.overrideOverlay({ id: o.id, visible: o.visible === false }); }
          if (b.dataset.tl) { const o = getOv(b.dataset.tl); ch.overrideOverlay({ id: o.id, lock: !o.lock }); }
          if (b.dataset.td) { st.quiet = true; ch.removeOverlay({ id: b.dataset.td }); st.quiet = false; hideFloat(); }
          save(); paint();
        };
      });
    }
    /* barra flotante del dibujo elegido */
    const F = $(".gx-float");
    function showFloat(id, focusText) {
      const o = getOv(id); if (!o || o.groupId !== "draw") return;
      st.sel = id; const s = sty(o);
      F.hidden = false;
      F.querySelector('[data-f="color"]').value = /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : "#2443c7";
      $$(".gx-c").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.color.toLowerCase() === String(s.color).toLowerCase())));
      F.querySelector('[data-f="width"]').value = String(s.width);
      F.querySelector('[data-f="dash"]').value = s.dash;
      const tx = TEXTABLE.includes(o.name), fl = FILLABLE.includes(o.name), noLine = ["tkText", "tkPriceLabel", "tkPos"].includes(o.name);
      F.querySelector(".gx-ftext").hidden = !tx;
      F.querySelector('[data-f="text"]').value = s.text;
      F.querySelector('[data-f="size"]').value = String(s.size);
      F.querySelector(".gx-fill").hidden = !fl; F.querySelector('[data-f="fill"]').checked = s.fill;
      F.querySelector('[data-f="width"]').parentNode.hidden = noLine; F.querySelector('[data-f="dash"]').parentNode.hidden = noLine;
      F.querySelector(".gx-sw").hidden = o.name === "tkPos";
      F.querySelector('[data-fa="lock"]').setAttribute("aria-pressed", String(!!o.lock));
      if (focusText && tx) setTimeout(() => { const i = F.querySelector('[data-f="text"]'); i.focus(); i.select(); }, 30);
    }
    function hideFloat() { if (F.contains(document.activeElement)) document.activeElement.blur(); F.hidden = true; st.sel = null; }
    function patchSel(patch) {
      const o = st.sel && getOv(st.sel); if (!o) return;
      const ed = Object.assign({}, o.extendData || {}, patch), upd = { id: o.id, extendData: ed };
      if (BUILTIN.includes(o.name)) upd.styles = { line: lineSt(sty({ extendData: ed })), text: { color: ed.color || pal().cob } };
      ch.overrideOverlay(upd);
      if (patch.color) { st.color = patch.color; ls.set("tk-color", patch.color); $$(".gx-c").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.color === patch.color))); }
      save();
    }
    function removeSel(id) { const i = id || st.sel; if (!i) return; ch.removeOverlay({ id: i }); F.hidden = true; st.sel = null; queueSave(); }
    function dupSel() {
      const o = st.sel && getOv(st.sel); if (!o) return;
      const dt = (TF_MS[st.tf] || 3e5) * 5;
      ch.createOverlay(Object.assign({ name: o.name, groupId: "draw", points: o.points.map(p => ({ timestamp: p.timestamp + dt, value: p.value })), extendData: Object.assign({}, o.extendData), styles: o.styles, mode: magMode() }, evs()));
      save();
    }

    /* ---------- menús y ventanas ---------- */
    const POP = $(".gx-pop"), MOD = $(".gx-modal"), DLG = $(".gx-dlg");
    function openPop(anchor, html, onPick) {
      POP.innerHTML = html; POP.hidden = false;
      const a = anchor.getBoundingClientRect(), r = el.getBoundingClientRect();
      const left = Math.min(a.left - r.left, r.width - 260), top = a.bottom - r.top + 4;
      if (anchor.closest(".gx-tools") && window.innerWidth >= 1024) { POP.style.left = (a.right - r.left + 4) + "px"; POP.style.top = (a.top - r.top) + "px"; }
      else { POP.style.left = Math.max(4, left) + "px"; POP.style.top = top + "px"; }
      POP.onclick = e => { const fv = e.target.closest("[data-fav]"); if (fv) { const on = toggleFav(fv.dataset.fav); fv.setAttribute("aria-pressed", String(on)); fv.innerHTML = icon(on ? "starOn" : "star", 15); return; } const b = e.target.closest("[data-pick]"); if (b) { onPick(b.dataset.pick); closePop(); } };
    }
    function closePop() { POP.hidden = true; POP.innerHTML = ""; }
    function openModal(html, bind) { DLG.onclick = null; DLG.onchange = null; DLG.innerHTML = html; MOD.hidden = false; bind && bind(); const f = DLG.querySelector("input,button"); f && f.focus(); }
    function closeModal() { MOD.hidden = true; DLG.innerHTML = ""; }
    function typeIcon(t) { return t === "candle_stroke" ? "candlesH" : t === "ohlc" ? "bars" : t === "area" ? "area" : "candles"; }
    st.tfFav = ls.get("tk-tffav", ["1m", "5m", "15m", "1h", "4h", "1d"]);
    function renderTfq() {
      const q = $(".gx-tfq"); if (!q) return;
      q.innerHTML = TFS.filter(([k]) => st.tfFav.includes(k)).map(([k, l]) => `<button type="button" class="gx-tfb" data-tfq="${k}" aria-pressed="${k === st.tf}" title="${l}">${TF_SHORT[k]}</button>`).join("");
      $(".gx-tfdd").classList.toggle("on", !st.tfFav.includes(st.tf));
    }
    function menuTf(btn) {
      openPop(btn, `<div class="gx-mh">Marco de tiempo</div>` + TFS.map(([k, l]) => `<div class="gx-mrow"><button type="button" class="gx-mi" data-pick="${k}" aria-pressed="${k === st.tf}"><b style="min-width:30px">${TF_SHORT[k]}</b><span>${l}</span></button><button type="button" class="gx-star" data-tfstar="${k}" aria-pressed="${st.tfFav.includes(k)}" aria-label="Mostrar ${l} en la barra" title="Mostrar en la barra">${icon(st.tfFav.includes(k) ? "starOn" : "star", 15)}</button></div>`).join("") + `<div class="gx-muted" style="padding:8px 10px 4px;font-size:12px">Atajo: escribe el marco en el gráfico (5, 15, 1h, 4h, D…) y pulsa Intro.</div>`, k => setTf(k));
      POP.addEventListener("click", e => { const b = e.target.closest("[data-tfstar]"); if (!b) return; e.stopPropagation(); const k = b.dataset.tfstar, i = st.tfFav.indexOf(k); if (i >= 0) st.tfFav.splice(i, 1); else st.tfFav.push(k); ls.set("tk-tffav", st.tfFav); b.setAttribute("aria-pressed", String(i < 0)); b.innerHTML = icon(i < 0 ? "starOn" : "star", 15); renderTfq(); }, { capture: true, once: false });
    }
    /* escribir el marco con el teclado: 5, 15, 1h, 240, D, W… */
    let tfBuf = "", tfT = null;
    function tfBox(show) { const b = $(".gx-tfbox"); if (!b) return; b.hidden = !show; if (show) b.querySelector("b").textContent = tfBuf; }
    function parseTf(v) {
      v = v.trim().toLowerCase(); if (!v) return null;
      if (v === "d" || v === "1d") return "1d"; if (v === "w" || v === "s" || v === "1w" || v === "1s") return "1w";
      const m = v.match(/^(\d+)\s*([mhdws]?)$/); if (!m) return null; let n = +m[1], u = m[2] || "m";
      if (u === "m" && n % 60 === 0 && n >= 60) { u = "h"; n = n / 60; }
      if (u === "h" && n === 24) { u = "d"; n = 1; }
      const k = n + (u === "s" ? "w" : u); return TFS.some(x => x[0] === k) ? k : null;
    }
    function tfKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      const k = e.key;
      if (!tfBuf && !/^[0-9dDwW]$/.test(k)) return false;
      if (tfBuf && k === "Escape") { tfBuf = ""; tfBox(false); return true; }
      if (tfBuf && k === "Enter") { const t = parseTf(tfBuf); tfBuf = ""; tfBox(false); if (t) setTf(t); else { hint("Ese marco no está disponible. Prueba 1, 5, 15, 30, 1h, 4h, D o W."); setTimeout(() => hint(""), 2600); } return true; }
      if (tfBuf && k === "Backspace") { tfBuf = tfBuf.slice(0, -1); tfBox(!!tfBuf); return true; }
      if (/^[0-9a-zA-Z]$/.test(k) && tfBuf.length < 5) { tfBuf += k.toUpperCase(); tfBox(true); clearTimeout(tfT); tfT = setTimeout(() => { tfBuf = ""; tfBox(false); }, 4000); return true; }
      return false;
    }
    function menuType(btn) {
      const t = [["candle_solid", "Velas", "candles"], ["candle_stroke", "Velas huecas", "candlesH"], ["ohlc", "Barras", "bars"], ["area", "Área", "area"]];
      openPop(btn, `<div class="gx-mh">Tipo de gráfico</div>` + t.map(([k, l, i]) => `<button type="button" class="gx-mi" data-pick="${k}" aria-pressed="${k === CFG.type}">${icon(i, 18)}<span>${l}</span></button>`).join(""), k => { CFG.type = k; ls.set("tk-cfg", CFG); ch.setStyles(styles()); $(".gx-typeic").innerHTML = icon(typeIcon(k), 18); });
    }
    function menuGroup(btn, gid) {
      const g = GROUPS.find(x => x[0] === gid);
      openPop(btn, `<div class="gx-mh">${esc(g[1])}</div>` + g[2].map(([k, l]) => k === "#" ? `<div class="gx-msub">${esc(l)}</div>` : `<div class="gx-mrow"><button type="button" class="gx-mi" data-pick="${k}" aria-pressed="${k === st.tool}">${icon(k, 18)}<span>${esc(l)}</span></button>${CURSORS.includes(k) ? "" : `<button type="button" class="gx-star" data-fav="${k}" aria-pressed="${st.fav.includes(k)}" aria-label="${st.fav.includes(k) ? "Quitar de" : "Añadir a"} favoritos: ${esc(l)}" title="Favoritos">${icon(st.fav.includes(k) ? "starOn" : "star", 15)}</button>`}</div>`).join(""), k => {
        st.last[gid] = k; ls.set("tk-lasttool", st.last);
        const main = el.querySelector(`[data-grp="${gid}"] .gx-tool`); main.dataset.tool = k; main.innerHTML = icon(k); main.title = TOOL_NAME[k]; main.setAttribute("aria-label", TOOL_NAME[k]);
        setTool(k);
      });
    }
    function viewAnchor() {
      try {
        const L = ch.getDataList(), v = ch.getVisibleRange(); if (!L.length || !v) return null;
        if (st.anchorKeep && st.anchorKeep.tf === st.tf && st.anchorKeep.vr === JSON.stringify(v)) return { ts: st.anchorKeep.ts }; // no se ha movido desde el último cambio
        st.anchorKeep = null;
        const last = Math.min(L.length - 1, Math.max(0, (v.realTo != null ? v.realTo : v.to) - 1)), first = Math.max(0, v.realFrom != null ? v.realFrom : v.from);
        if (last >= L.length - 2) return null; // estaba viendo lo último: sigue en vivo
        return { ts: L[Math.floor((first + last) / 2)].timestamp, right: L[last].timestamp };
      } catch (e) { return null; }
    }
    function goAnchor(a) {
      if (!a) return;
      const L = ch.getDataList(); if (!L.length) return;
      let i = L.findIndex(b => b.timestamp > a.ts) - 1; if (i < -1) i = L.length - 1; if (i < 0) { i = 0; hint("No hay velas tan antiguas en este marco: te dejo en la más antigua."); setTimeout(() => hint(""), 2800); }
      const v = ch.getVisibleRange(), half = v ? Math.max(5, Math.floor(((v.realTo || v.to) - (v.realFrom || v.from)) / 2)) : 40;
      try { ch.scrollToDataIndex(Math.min(L.length - 1, i + half), 0); } catch (e) { /* sin desplazar */ }
      setTimeout(() => { try { st.anchorKeep = { ts: a.ts, tf: st.tf, vr: JSON.stringify(ch.getVisibleRange()) }; } catch (e) { /* nada */ } }, 60);
    }
    function setTf(k) {
      if (k === st.tf) return;
      const was = R.on, keep = R.on && !R.picking && bar() ? bar().timestamp : null, hadPos = !!R.pos;
      const anchor = R.on ? null : viewAnchor();
      if (R.on) exitReplay();
      st.anchor = anchor ? anchor.ts : null;
      st.tf = k; CUR_TF = k; ls.set(TFK, k); opts.onTf && opts.onTf(k); $(".gx-tfname").textContent = TF_SHORT[k]; renderTfq();
      st.prov = pickProv(); setSrc(); ch.setPeriod(TFS.find(x => x[0] === k)[2]);
      if (anchor) whenLoaded(() => setTimeout(() => goAnchor(anchor), 30));
      if (was) { enterReplay(); if (keep) whenLoaded(() => { startAt(keep); if (hadPos) { hint("La simulada abierta se ha cerrado al cambiar de marco."); setTimeout(() => hint(""), 3000); } }); }
    }
    function modalSymbol() {
      const groups = (opts.symbols && opts.symbols()) || [];
      const list = q => groups.map(([g, l]) => [g, l.filter(s => !q || s.toLowerCase().includes(q))]).filter(g => g[1].length)
        .map(([g, l]) => `<div class="gx-mh">${esc(g)}</div>` + l.map(s => `<button type="button" class="gx-row" data-sym="${esc(s)}"><b>${esc(s)}</b><span>${esc(g)}${binSym(s) ? " · en vivo" : ""}</span></button>`).join("")).join("") || `<div class="gx-empty">No hay mercados con ese nombre.</div>`;
      openModal(`<div class="gx-dh"><h3>Buscar mercado</h3><button type="button" class="gx-tb gx-ic" data-close aria-label="Cerrar">${icon("x", 18)}</button></div>
        <label class="gx-search">${icon("search", 16)}<input type="search" placeholder="EURUSD, oro, Nasdaq…" aria-label="Buscar mercado" autocomplete="off"></label>
        <div class="gx-list">${list("")}</div>`, () => {
        const i = DLG.querySelector("input"), L = DLG.querySelector(".gx-list");
        i.oninput = () => { L.innerHTML = list(i.value.trim().toLowerCase().replace("oro", "xau").replace("nasdaq", "nas")); };
        i.onkeydown = e => { if (e.key === "Enter") { const b = L.querySelector("[data-sym]"); if (b) b.click(); } };
      });
    }
    function modalInd(tab) {
      tab = tab || "Todos";
      const act = activeInd(), on = new Set(act.map(x => x.n));
      const row = m => `<div class="gx-row gx-irow"><span class="gx-badge">${esc(m[1])}</span><span class="gx-in2"><b>${esc(m[2])}</b><span>${esc(m[6])}</span></span>${on.has(m[0]) ? `<button type="button" class="gx-btn" data-del="${m[0]}">Quitar</button>` : `<button type="button" class="gx-btn gx-add" data-add="${m[0]}">Añadir</button>`}</div>`;
      const mine = () => act.length ? act.map((x, i) => { const m = IND_BY[x.n]; return `<div class="gx-row gx-irow"><span class="gx-badge">${esc(m[1])}</span><span class="gx-in2"><b>${esc(m[2])}</b>
          <span class="gx-pr">${m[5].length ? `<label>Valores <input class="gx-in" data-par="${i}" value="${esc((x.p && x.p.length ? x.p : m[5]).join(", "))}" inputmode="decimal"></label>` : ""}<label>Color <input type="color" data-col="${i}" value="${x.c || IND_COLORS()[0]}"></label></span></span>
          <button type="button" class="gx-btn" data-del="${x.n}">Quitar</button></div>`; }).join("") : `<div class="gx-empty">Aún no tienes indicadores. Añádelos desde las otras pestañas.</div>`;
      const body = q => tab === "En el gráfico" ? mine() : IND.filter(m => (tab === "Todos" || m[3] === tab) && (!q || (m[1] + " " + m[2] + " " + m[0]).toLowerCase().includes(q))).map(row).join("") || `<div class="gx-empty">Ningún indicador con ese nombre.</div>`;
      openModal(`<div class="gx-dh"><h3>Indicadores</h3><button type="button" class="gx-tb gx-ic" data-close aria-label="Cerrar">${icon("x", 18)}</button></div>
        <label class="gx-search">${icon("search", 16)}<input type="search" placeholder="Buscar: RSI, medias, Fibonacci…" aria-label="Buscar indicador" autocomplete="off"></label>
        <div class="gx-tabs" role="tablist">${["Todos"].concat(CATS, ["En el gráfico"]).map(t => `<button type="button" role="tab" data-tab="${t}" aria-selected="${t === tab}">${t}${t === "En el gráfico" && act.length ? " (" + act.length + ")" : ""}</button>`).join("")}</div>
        <div class="gx-list">${body("")}</div>`, () => {
        const i = DLG.querySelector('input[type="search"]'), L = DLG.querySelector(".gx-list");
        i.oninput = () => { L.innerHTML = body(i.value.trim().toLowerCase()); };
        DLG.onclick = e => {
          const t = e.target.closest("[data-tab],[data-add],[data-del],[data-close]"); if (!t) return;
          if (t.dataset.tab) return modalInd(t.dataset.tab);
          if (t.dataset.add) { const a = activeInd(); a.push({ n: t.dataset.add, p: IND_BY[t.dataset.add][5].slice(), c: null }); saveInd(a); return modalInd(tab); }
          if (t.dataset.del) { saveInd(activeInd().filter(x => x.n !== t.dataset.del)); return modalInd(tab); }
          if (t.hasAttribute("data-close")) closeModal();
        };
        DLG.onchange = e => {
          const t = e.target, a = activeInd();
          if (t.dataset.par != null) { const v = t.value.split(/[;,\s]+/).map(Number).filter(x => isFinite(x) && x > 0); if (v.length) { a[+t.dataset.par].p = v; saveInd(a); } }
          if (t.dataset.col != null) { a[+t.dataset.col].c = t.value; saveInd(a); }
        };
      });
    }
    function modalSettings() {
      const p = pal();
      openModal(`<div class="gx-dh"><h3>Ajustes del gráfico</h3><button type="button" class="gx-tb gx-ic" data-close aria-label="Cerrar">${icon("x", 18)}</button></div>
        <div class="gx-set">
          <label>Vela alcista <input type="color" data-cfg="up" value="${CFG.up || (/^#/.test(p.cob) ? p.cob : "#2443c7")}"></label>
          <label>Vela bajista <input type="color" data-cfg="down" value="${CFG.down || (DARK ? "#c6cee0" : "#14213a")}"></label>
          <label>Fondo <input type="color" data-cfg="bg" value="${CFG.bg || p.card}"></label>
          <label class="gx-chk"><input type="checkbox" data-cfg="grid" ${CFG.grid ? "checked" : ""}> Cuadrícula</label>
          <div class="gx-mh">Combinaciones rápidas</div>
          <div class="gx-quick"><button type="button" class="gx-btn" data-q="tickora">Tickora</button><button type="button" class="gx-btn" data-q="clasica">Verde y rojo</button><button type="button" class="gx-btn" data-q="mono">Blanco y negro</button></div>
          <button type="button" class="gx-btn" data-q="reset">Restablecer todo</button>
        </div>`, () => {
        DLG.onchange = e => { const k = e.target.dataset.cfg; if (!k) return; CFG[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; ls.set("tk-cfg", CFG); ch.setStyles(styles()); paintBg(); };
        DLG.onclick = e => {
          const t = e.target.closest("[data-q],[data-close]"); if (!t) return;
          if (t.hasAttribute("data-close")) return closeModal();
          const q = t.dataset.q;
          if (q === "tickora") Object.assign(CFG, { up: null, down: null });
          if (q === "clasica") Object.assign(CFG, { up: "#26a69a", down: "#ef5350" });
          if (q === "mono") Object.assign(CFG, { up: DARK ? "#e9edf6" : "#ffffff", down: DARK ? "#5e6a85" : "#14213a", type: q === "mono" ? "candle_stroke" : CFG.type });
          if (q === "reset") CFG = Object.assign({}, CFG_DEF);
          ls.set("tk-cfg", CFG); ch.setStyles(styles()); paintBg(); $(".gx-typeic").innerHTML = icon(typeIcon(CFG.type), 18); modalSettings();
        };
      });
    }
    function shot() {
      try {
        const url = ch.getConvertPictureUrl(true, "png", CFG.bg || pal().card);
        const a = document.createElement("a"); a.href = url; a.download = `tickora-${st.sym}-${TF_SHORT[st.tf]}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.png`;
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { hint("No se pudo guardar la imagen."); setTimeout(() => hint(""), 2500); }
    }

    /* ---------- volver atrás y simuladas ---------- */
    const bar = () => R.all[R.idx];
    const fmtWhen = ts => new Date(ts).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    function stats() {
      const n = R.trades.length, tot = R.trades.reduce((a, t) => a + t.r, 0), win = R.trades.filter(t => t.r > 0).length;
      $(".gx-stats").innerHTML = n ? `<span>Práctica de hoy: <b>${n}</b> simulada${n > 1 ? "s" : ""}</span><span>Resultado <b class="gx-hl">${fmtR(tot)}</b></span><span>Acierto <b>${Math.round(win / n * 100)} %</b></span><span class="gx-muted">Se guardan aparte: nunca cuentan como operaciones reales.</span>`
        : `<span class="gx-muted">Pulsa Comprar o Vender para abrir una simulada. Mueve el stop y el objetivo arrastrando sus puntos. Se guardan aparte de tus operaciones reales.</span>`;
      $('[data-act="closesim"]').hidden = !R.pos;
      $$("[data-sim]").forEach(b => { b.disabled = !!R.pos; });
      if (R.on && bar()) { const w = fmtWhen(bar().timestamp); $(".gx-when").textContent = w; $(".gx-btbadge span").textContent = w; }
      const rg = $(".gx-range");
      if (rg && R.all.length) { rg.max = R.all.length - 1; rg.value = R.idx; $(".gx-s0").textContent = fmtWhen(R.all[0].timestamp); rg.style.setProperty("--p", ((R.idx - 1) / Math.max(1, R.all.length - 2) * 100).toFixed(1) + "%"); }
    }
    function syncMode() {
      MODE = R.on ? "bt" : "live"; MODES[KEY] = MODE;
      $$("[data-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === MODE)));
      el.querySelector(".gx").classList.toggle("bt", R.on);
      $(".gx-btbadge").hidden = !R.on || R.picking;
      opts.onMode && opts.onMode(MODE);
    }
    function enterReplay() {
      if (R.on) return;
      R.on = true; R.picking = true; R.trades = R.trades || [];
      $(".gx-replay").hidden = false; $(".gx-start").hidden = false; $(".gx-play").hidden = true; $(".gx-stats").innerHTML = "";
      syncMode();
      hint("Toca la vela desde la que quieres practicar, o elige una fecha abajo.");
      setSrc(); setTimeout(() => ch.resize(), 0);
    }
    async function startAt(ts) {
      let list = ch.getDataList().slice();
      if (!list.length) return;
      if (ts < list[0].timestamp && st.prov) {
        msg("Cargando velas antiguas…");
        for (let i = 0; i < 15 && ts < list[0].timestamp; i++) {
          try { const r = await st.prov.bars(st.sym, st.tf, list[0].timestamp); if (!r.bars.length) break; list = r.bars.filter(b => b.timestamp < list[0].timestamp).concat(list); if (!r.more) break; } catch (e) { break; }
        }
        msg("");
        if (ts < list[0].timestamp) hint("No hay velas tan antiguas en este marco: empiezo en la más antigua que hay. Prueba un marco mayor para ir más atrás.");
      }
      let idx = list.findIndex(b => b.timestamp > ts) - 1;
      if (idx < 0) idx = ts < list[0].timestamp ? Math.min(60, list.length - 2) : list.length - 1;
      else if (idx < 120 && st.prov) { // un poco de contexto antes del punto de inicio
        try { const r = await st.prov.bars(st.sym, st.tf, list[0].timestamp); const add = r.bars.filter(b => b.timestamp < list[0].timestamp); list = add.concat(list); idx += add.length; } catch (e) { /* seguimos con lo que hay */ }
      }
      begin(list, idx);
    }
    function begin(list, idx) {
      R.all = list; R.idx = Math.max(1, Math.min(idx, list.length - 2)); R.picking = false;
      if (!/No hay velas tan antiguas/.test($(".gx-hint").textContent)) hint("");
      $(".gx-start").hidden = true; $(".gx-play").hidden = false;
      ch.setDataLoader(replayLoader); ch.resetData(); syncMode();
      stats(); setTimeout(() => hint(""), 4000);
    }
    function step() {
      if (R.cut) cutMode(false);
      if (R.idx >= R.all.length - 1) { pause(); hint("Has llegado al presente."); setTimeout(() => hint(""), 2500); return false; }
      R.idx++; const b = bar(); R.cb && R.cb(b); checkSim(b); stats(); return true;
    }
    function back() {
      if (R.cut) cutMode(false);
      if (R.idx <= 1) return; pause(); R.idx--;
      if (R.pos && R.idx < R.pos.entryIdx) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; hint("Simulada anulada: has vuelto a antes de la entrada."); setTimeout(() => hint(""), 2500); }
      ch.resetData(); stats();
    }
    function play() { if (R.timer) { pause(); return; } $('[data-act="play"]').textContent = "❚❚"; $('[data-act="play"]').setAttribute("aria-label", "Pausa"); R.timer = setInterval(() => { if (!step()) pause(); }, 1000 / R.speed); }
    function pause() { if (R.timer) clearInterval(R.timer); R.timer = null; const b = $('[data-act="play"]'); if (b) { b.textContent = "▶︎"; b.setAttribute("aria-label", "Reproducir"); } }
    function exitReplay() {
      pause(); if (R.cut) { R.cut = false; ch.removeOverlay({ id: "tkfog" }); el.querySelector(".gx").classList.remove("cut"); $('[data-act="cut"]').setAttribute("aria-pressed", "false"); } if (R.pos) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; }
      ch.removeOverlay({ groupId: "sim" });
      R.on = false; R.picking = false; hint("");
      $(".gx-replay").hidden = true; syncMode();
      ch.setDataLoader(live); ch.resetData(); setSrc(); setTimeout(() => ch.resize(), 0);
    }
    const fullLoader = { getBars: ({ type, callback }) => { if (type === "init") callback(R.all.slice(), { backward: false, forward: false }); else callback([], false); }, subscribeBar: () => {}, unsubscribeBar: () => {} };
    function cutMode(on) {
      if (!R.on || R.picking || !R.all.length) return;
      pause(); R.cut = on;
      $('[data-act="cut"]').setAttribute("aria-pressed", String(on)); el.querySelector(".gx").classList.toggle("cut", on);
      ch.removeOverlay({ id: "tkfog" });
      if (on) {
        ch.setDataLoader(fullLoader); ch.resetData();
        setTimeout(() => {
          try { const bs = ch.getBarSpace(), sp = (bs && (bs.bar || bs)) || 8, w = box.clientWidth || 800, ahead = Math.max(5, Math.floor(w / sp * 0.35)); ch.scrollToDataIndex(Math.min(R.all.length - 1, R.idx + ahead), 0); } catch (e) { /* sin desplazar */ }
          try { ch.createOverlay({ id: "tkfog", name: "tkFog", groupId: "fog", lock: true, points: [{ timestamp: bar().timestamp, value: bar().close }] }); } catch (e) { /* sin niebla */ }
        }, 60);
        hint("Toca la vela desde la que quieres seguir: a la izquierda vuelves atrás, en la zona oculta avanzas. Esc para cancelar.");
      } else { ch.setDataLoader(replayLoader); ch.resetData(); hint(""); stats(); }
    }
    function cutAt(ts) {
      const i = R.all.findIndex(b => b.timestamp === ts); if (i < 1) return;
      ch.removeOverlay({ id: "tkfog" }); R.cut = false; $('[data-act="cut"]').setAttribute("aria-pressed", "false"); el.querySelector(".gx").classList.remove("cut");
      ch.setDataLoader(replayLoader);
      const old = R.idx; R.idx = old; jumpTo(i); if (i === old) { ch.resetData(); stats(); }
      hint(""); 
    }
    function jumpTo(i) {
      if (!R.all.length) return;
      if (R.cut) { R.cut = false; ch.removeOverlay({ id: "tkfog" }); el.querySelector(".gx").classList.remove("cut"); $('[data-act="cut"]').setAttribute("aria-pressed", "false"); ch.setDataLoader(replayLoader); }
      i = Math.max(1, Math.min(i, R.all.length - 1)); if (i === R.idx) return; pause();
      if (i > R.idx) { for (let k = R.idx + 1; k <= i; k++) { R.idx = k; checkSim(R.all[k]); } }
      else { R.idx = i; if (R.pos && R.idx < R.pos.entryIdx) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; hint("Simulada anulada: has vuelto a antes de la entrada."); setTimeout(() => hint(""), 2500); } }
      ch.resetData(); stats();
    }
    function tfReady() { const l = ch.getDataList(); if (l.length < 3) return false; let m = Infinity; for (let i = Math.max(1, l.length - 20); i < l.length; i++) m = Math.min(m, l[i].timestamp - l[i - 1].timestamp); return m === TF_MS[st.tf]; }
    async function whenLoaded(fn) { await new Promise(r => setTimeout(r, 200)); for (let i = 0; i < 50; i++) { if (tfReady()) return fn(); await new Promise(r => setTimeout(r, 150)); } if (ch.getDataList().length) fn(); }
    function atr(i) { const n = 14; let a = null; for (let k = Math.max(1, i - 100); k <= i; k++) { const c = R.all[k], pc = R.all[k - 1].close; const tr = Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc)); a = a == null ? tr : (a * (n - 1) + tr) / n; } return a; }
    function openSim(side) {
      if (R.pos || !bar()) return;
      const b = bar(), dg = digits(), rd = v => +v.toFixed(dg), e = rd(b.close), d = (atr(R.idx) || e * 0.002) * 1.5;
      const s = rd(side === "buy" ? e - d : e + d), t = rd(side === "buy" ? e + 2 * d : e - 2 * d), tw = TF_MS[st.tf] * 24;
      const id = ch.createOverlay({
        name: "tkPos", groupId: "sim", extendData: { side, sim: true }, points: [{ timestamp: b.timestamp, value: e }, { timestamp: b.timestamp + tw, value: s }, { timestamp: b.timestamp + tw, value: t }],
        onPressedMoveEnd: ev => {
          const p = R.pos; if (!p || ev.overlay.id !== p.id) return;
          const pts = ev.overlay.points, ns = pts[1].value, nt = pts[2] ? pts[2].value : null;
          const okS = side === "buy" ? ns < bar().close : ns > bar().close, okT = nt == null || (side === "buy" ? nt > p.entry : nt < p.entry);
          if (okS) p.stop = rd(ns); if (okT && nt != null) p.tp = rd(nt);
          ch.overrideOverlay({ id: p.id, points: [{ timestamp: p.entryTime, value: p.entry }, { timestamp: pts[1].timestamp, value: p.stop }, { timestamp: pts[1].timestamp, value: p.tp }] });
        }
      });
      R.pos = { id, side, entry: e, stop: s, tp: t, risk: Math.abs(e - s), entryIdx: R.idx, entryTime: b.timestamp };
      stats();
    }
    function checkSim(b) {
      const p = R.pos; if (!p) return;
      const hitS = p.side === "buy" ? b.low <= p.stop : b.high >= p.stop;
      const hitT = p.tp != null && (p.side === "buy" ? b.high >= p.tp : b.low <= p.tp);
      if (hitS) closeSim(p.stop, b); else if (hitT) closeSim(p.tp, b);
    }
    function closeSim(price, b) {
      const p = R.pos; if (!p) return;
      const r = Math.round(((price - p.entry) / p.risk * (p.side === "buy" ? 1 : -1)) * 100) / 100;
      ch.overrideOverlay({ id: p.id, extendData: { side: p.side, sim: true, result: r }, lock: true, points: [{ timestamp: p.entryTime, value: p.entry }, { timestamp: b.timestamp, value: p.stop }, { timestamp: b.timestamp, value: p.tp }] });
      const rec = { id: "sim:" + p.entryTime + ":" + Math.random().toString(36).slice(2, 8), symbol: st.sym, tf: st.tf, side: p.side, entry_time: new Date(p.entryTime).toISOString(), entry: p.entry, stop: p.stop, tp: p.tp, exit_time: new Date(b.timestamp).toISOString(), exit: price, r };
      R.trades.push(rec); R.pos = null;
      opts.saveSim && opts.saveSim(rec);
      hint("Simulada cerrada: " + fmtR(r)); setTimeout(() => hint(""), 2500);
      stats();
    }

    /* ---------- eventos ---------- */
    el.addEventListener("click", e => {
      if (!POP.hidden && !e.target.closest(".gx-pop,[data-menu],[data-more]")) closePop();
      if (e.target === MOD) { closeModal(); return; }
      const t = e.target.closest("button,input,select,label");
      if (!t) {
        const kb = (R.on && (R.cut || R.picking) && e.target.closest(".gx-chart")) ? crossBar() : null;
        if (kb && R.cut) { cutAt(kb.timestamp); return; }
        if (kb && R.picking) { const list = ch.getDataList(); const i = list.findIndex(b => b.timestamp === kb.timestamp); if (i > 0) begin(list.slice(), i); }
        return;
      }
      if (t.closest(".gx-dlg") || t.closest(".gx-pop")) { if (t.dataset.sym) { closeModal(); opts.onSymbol ? opts.onSymbol(t.dataset.sym) : inst.setSymbol(t.dataset.sym); } else if (t.hasAttribute("data-close")) closeModal(); return; }
      if (t.dataset.menu === "tf") { POP.hidden ? menuTf(t) : closePop(); return; }
      if (t.dataset.tfq) { setTf(t.dataset.tfq); return; }
      if (t.dataset.menu === "type") { POP.hidden ? menuType(t) : closePop(); return; }
      if (t.dataset.more) { menuGroup(t, t.dataset.more); return; }
      if (t.dataset.tool === "tkEmoji") { menuEmoji(t); return; }
      if (t.dataset.tool) { const g = t.closest("[data-grp]"); if (g && st.tool === t.dataset.tool && t.dataset.tool !== "cursor" && el.querySelector(`[data-more="${g.dataset.grp}"]`)) { menuGroup(t, g.dataset.grp); return; } setTool(t.dataset.tool); return; }
      if (t.dataset.color) { patchSel({ color: t.dataset.color }); return; }
      if (t.dataset.fa === "del") { removeSel(); return; }
      if (t.dataset.fa === "dup") { dupSel(); return; }
      if (t.dataset.fa === "lock") { const o = st.sel && getOv(st.sel); if (o) { ch.overrideOverlay({ id: o.id, lock: !o.lock }); t.setAttribute("aria-pressed", String(!o.lock)); save(); } return; }
      if (t.dataset.back) { startAt(Date.now() - (+t.dataset.back) * 864e5); return; }
      if (t.dataset.sim) { openSim(t.dataset.sim); return; }
      const a = t.dataset.act;
      if (a === "symbol") { modalSymbol(); return; }
      if (a === "ind") { modalInd(); return; }
      if (a === "settings") { modalSettings(); return; }
      if (a === "shot") { shot(); return; }
      if (a === "undo") { undo(); return; }
      if (a === "redo") { redo(); return; }
      if (t.dataset.mode) { if (t.dataset.mode === "bt") enterReplay(); else if (R.on) exitReplay(); return; }
      if (a === "full") { const card = el.closest(".tvcard") || el; const on = !card.classList.contains("full"); card.classList.toggle("full", on); document.body.style.overflow = on ? "hidden" : ""; t.title = on ? "Salir de pantalla completa" : "Pantalla completa"; setTimeout(() => ch.resize(), 30); return; }
      if (a === "magnet") { st.magnet = !st.magnet ? "weak" : st.magnet === "weak" || st.magnet === true ? "strong" : false; ls.set("tk-magnet", st.magnet); t.setAttribute("aria-pressed", String(!!st.magnet)); t.dataset.strong = String(st.magnet === "strong"); t.title = magTitle(); hint(magTitle()); setTimeout(() => hint(""), 1800); ch.getOverlays({ groupId: "draw" }).forEach(o => ch.overrideOverlay({ id: o.id, mode: magMode() })); return; }
      if (a === "stay") { st.stay = !st.stay; ls.set("tk-stay", st.stay); t.setAttribute("aria-pressed", String(st.stay)); hint(st.stay ? "Seguir dibujando: activado" : "Seguir dibujando: desactivado"); setTimeout(() => hint(""), 1500); return; }
      if (a === "zoom") { try { ch.zoomAtCoordinate(e.shiftKey ? 0.75 : 1.35, undefined, 160); } catch (x) { /* sin zoom */ } return; }
      if (a === "tree") { modalTree(); return; }
      if (a === "hidetools" || a === "showtools") { const h = a === "hidetools"; ls.set("tk-notools", h); el.querySelector(".gx").classList.toggle("notools", h); setTimeout(() => ch.resize(), 30); return; }
      if (a === "favbar") { st.favShow = !st.favShow; ls.set("tk-favshow", st.favShow); renderFav(); if (st.favShow && !st.fav.length) { hint("Marca herramientas con la estrella en sus menús para verlas aquí."); setTimeout(() => hint(""), 3000); } return; }
      if (a === "lockall") { st.locked = !st.locked; t.setAttribute("aria-pressed", String(st.locked)); ch.getOverlays({ groupId: "draw" }).forEach(o => ch.overrideOverlay({ id: o.id, lock: st.locked })); return; }
      if (a === "hide") { st.hidden = !st.hidden; t.setAttribute("aria-pressed", String(st.hidden)); ch.getOverlays({ groupId: "draw" }).forEach(o => ch.overrideOverlay({ id: o.id, visible: !st.hidden })); return; }
      if (a === "clear") { if (ch.getOverlays({ groupId: "draw" }).length && window.confirm("¿Borrar todos los dibujos de " + st.sym + "? Puedes deshacerlo con la flecha de deshacer.")) { ch.removeOverlay({ groupId: "draw" }); F.hidden = true; queueSave(); } return; }
      if (a === "exit") { exitReplay(); return; }
      if (a === "restart") { pause(); if (R.pos) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; } R.picking = true; $(".gx-start").hidden = false; $(".gx-play").hidden = true; ch.setDataLoader(live); ch.resetData(); hint("Toca otra vela o elige una fecha."); return; }
      if (a === "play") { play(); return; }
      if (a === "next") { pause(); step(); return; }
      if (a === "prev") { back(); return; }
      if (a === "cut") { cutMode(!R.cut); return; }
      if (a === "back10") { if (R.cut) cutMode(false); jumpTo(R.idx - 10); return; }
      if (a === "fwd10") { jumpTo(R.idx + 10); return; }
      if (a === "closesim") { if (R.pos) closeSim(bar().close, bar()); return; }
      if (a === "godate") { const v = $(".gx-date input").value; if (v) startAt(new Date(v).getTime()); return; }
    });
    el.addEventListener("input", e => { const f = e.target.dataset.f; if (f === "text") patchSel({ text: e.target.value }); if (e.target.classList.contains("gx-range")) jumpTo(+e.target.value); });
    el.addEventListener("change", e => {
      const t = e.target, f = t.dataset.f;
      if (f === "color") patchSel({ color: t.value });
      if (f === "width") patchSel({ width: +t.value });
      if (f === "dash") patchSel({ dash: t.value });
      if (f === "size") patchSel({ size: +t.value });
      if (f === "fill") patchSel({ fill: t.checked });
      if (t.dataset.act === "speed") { R.speed = +t.value; ls.set("tk-speed", R.speed); if (R.timer) { pause(); play(); } }
    });
    const onKey = e => {
      if (!document.body.contains(el) || (me && inst !== me)) return;
      const typing = e.target.matches && e.target.matches("input,textarea,select");
      if (!(R.on && !R.picking && (e.key === " " || e.key === "c" || e.key === "C")) && tfKey(e)) { e.preventDefault(); return; }
      if (FR && (e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); endFree(e.key === "Enter"); return; }
      if (e.key === "Escape") { if (!MOD.hidden) closeModal(); else if (!POP.hidden) closePop(); else if (R.cut) cutMode(false); return; }
      if (typing) return;
      if (R.on && !R.picking && MOD.hidden) {
        if (e.key === "ArrowRight") { e.preventDefault(); e.shiftKey ? jumpTo(R.idx + 10) : (pause(), step()); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); e.shiftKey ? jumpTo(R.idx - 10) : back(); return; }
        if (e.key === " " && !(e.target.closest && e.target.closest("button"))) { e.preventDefault(); play(); return; }
        if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey) { e.preventDefault(); cutMode(!R.cut); return; }
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && st.sel) { e.preventDefault(); removeSel(); }
    };
    document.addEventListener("keydown", onKey);
    if (MODE === "bt") whenLoaded(() => enterReplay()); else if (opts.onMode) opts.onMode("live");
    const ro = new ResizeObserver(() => ch.resize()); ro.observe(box);

    const activate = () => { if (inst === me) return; inst = me; CUR_TF = st.tf; CUR_DIGITS = digits(); ALL.forEach(x => x.el.classList.toggle("tk-act", x === me)); opts.onActive && opts.onActive(me); };
    el.addEventListener("pointerdown", activate, true);
    me = inst = {
      el, ch, ro, onKey, key: KEY, activate, flush: () => { flushRemote(); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flushRemote); },
      get sym() { return st.sym; }, get tf() { return st.tf; },
      setSymbol(sym) { if (sym === st.sym) return; flushRemote(); const was = R.on; if (R.on) exitReplay(); st.sym = sym; F.hidden = true; load(); restore(); if (was) enterReplay(); },
      setTheme(dark) { DARK = !!dark; ch.setStyles(styles()); applyInd(); paintBg(); applyCursor(); },
      price: () => st.price,
      stop() { pause(); if (st.unsub) { st.unsub(); st.unsub = null; } }
    };
    ALL.add(me); ALL.forEach(x => x.el.classList.toggle("tk-act", x === me));
    load(); applyInd(); restore(); renderFav(); applyCursor(); renderTfq();
    if (ls.get("tk-notools", false)) el.querySelector(".gx").classList.add("notools");
    if (st.baseCur !== "cursor") $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === st.baseCur)));
    return me;
  }
  function destroyOne(x) {
    try { x.flush && x.flush(); } catch (e) { /* nada pendiente */ }
    try { x.stop(); x.ro.disconnect(); document.removeEventListener("keydown", x.onKey); KC.dispose(x.el.querySelector(".gx-chart")); } catch (e) { /* ya no existe */ }
    ALL.delete(x); if (inst === x) inst = Array.from(ALL)[0] || null;
  }
  function destroy(x) { if (x) { destroyOne(x); return; } Array.from(ALL).forEach(destroyOne); inst = null; }
  /* precio y cambio del día para la lista de seguimiento */
  async function quote(sym, o) {
    o = o || {};
    const prov = binSym(sym) ? binance() : publico(o.invoke, o.digits != null ? o.digits : guessDigits(sym));
    const r = await prov.bars(sym, "1d", null), b = r.bars;
    if (!b.length) return null;
    const last = b[b.length - 1], prev = b.length > 1 ? b[b.length - 2].close : last.open;
    return { last: last.close, chg: prev ? (last.close - prev) / prev * 100 : null };
  }
  window.TkChart = { mount, destroy, quote, sources: { binance, publico }, get current() { return inst; }, get all() { return Array.from(ALL); } };
})();
