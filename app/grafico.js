/* Tickora · gráfico propio (KLineChart 10, Apache 2.0)
   Velas en vivo, herramientas de dibujo guardadas, indicadores y modo «volver atrás» con operaciones simuladas. */
(function () {
  "use strict";
  const KC = window.klinecharts;
  if (!KC) { window.TkChart = null; return; }

  const TFS = [["1m", "1m", { type: "minute", span: 1 }], ["5m", "5m", { type: "minute", span: 5 }], ["15m", "15m", { type: "minute", span: 15 }],
    ["1h", "1h", { type: "hour", span: 1 }], ["4h", "4h", { type: "hour", span: 4 }], ["1d", "1D", { type: "day", span: 1 }]];
  const TF_MS = { "1m": 6e4, "5m": 3e5, "15m": 9e5, "1h": 36e5, "4h": 144e5, "1d": 864e5 };
  const CRYPTO = /^(BTC|ETH|SOL|XRP|BNB|ADA|DOGE|LTC|AVAX|DOT|LINK|TRX|TON|MATIC|SHIB)/;
  const MAIN_IND = ["MA", "EMA", "BOLL", "SAR"];
  const IND = [["EMA", "Medias exponenciales (20, 50, 200)"], ["MA", "Medias simples"], ["BOLL", "Bandas de Bollinger"], ["SAR", "SAR parabólico"],
    ["VOL", "Volumen"], ["RSI", "RSI"], ["MACD", "MACD"], ["ATR", "ATR (volatilidad)"], ["KDJ", "Estocástico (KDJ)"]];
  const IND_PARAMS = { EMA: [20, 50, 200], MA: [20, 50], RSI: [14] };

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtR = r => (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " R";
  const binSym = s => { const c = String(s).toUpperCase().replace(/[^A-Z]/g, ""); const m = c.match(CRYPTO); return m ? m[1] + "USDT" : null; };
  const guessDigits = s => { const c = String(s).toUpperCase(); if (binSym(c)) return /^(XRP|ADA|DOGE|TRX|SHIB|MATIC)/.test(c) ? 4 : 2; if (/JPY/.test(c)) return 3; if (/XAU|GOLD/.test(c)) return 2; if (/XAG|SILVER|OIL|WTI|BRENT/.test(c)) return 3; if (/^[A-Z]{6}/.test(c) && !/(NAS|US|GER|UK|SPA|FRA|JPN|DE|SPX|DJ)\d/.test(c)) return 5; return 1; };

  /* ---------- textos en español ---------- */
  KC.registerLocale("es-ES", { time: "Hora: ", open: "Ap: ", high: "Máx: ", low: "Mín: ", close: "Cierre: ", volume: "Vol: ", change: "Cambio: ", turnover: "Importe: ", second: "s", minute: "min", hour: "h", day: "D", week: "S", month: "M", year: "A" });

  /* ---------- colores según el tema ---------- */
  let DARK = false, CLASSIC = ls.get("tk-velas", "tickora") === "clasicas";
  function pal() {
    return DARK ? { tinta: "#e9edf6", suave: "#8f9ab3", linea: "#232f4a", borde: "#33405f", card: "#141d33", cob: "#7b93ff", cobA: "rgba(123,147,255,.16)", stopA: "rgba(233,237,246,.10)", rot: "#fbe27a" }
      : { tinta: "#14213a", suave: "#556079", linea: "#e9edf3", borde: "#c9d1de", card: "#ffffff", cob: "#2443c7", cobA: "rgba(36,67,199,.12)", stopA: "rgba(20,33,58,.10)", rot: "#fbe27a" };
  }
  function styles() {
    const p = pal();
    const up = CLASSIC ? "#26a69a" : p.cob, down = CLASSIC ? "#ef5350" : (DARK ? "#c6cee0" : "#14213a");
    const axis = { axisLine: { color: p.borde }, tickLine: { color: p.borde }, tickText: { color: p.suave, family: "Red Hat Mono, monospace" } };
    const cross = { line: { color: p.suave }, text: { color: DARK ? "#0e1526" : "#ffffff", backgroundColor: p.tinta, borderColor: p.tinta, family: "Red Hat Mono, monospace" } };
    return {
      grid: { horizontal: { color: p.linea }, vertical: { color: p.linea } },
      candle: {
        bar: { upColor: up, downColor: down, noChangeColor: p.suave, upBorderColor: up, downBorderColor: down, noChangeBorderColor: p.suave, upWickColor: up, downWickColor: down, noChangeWickColor: p.suave },
        priceMark: { high: { color: p.suave }, low: { color: p.suave }, last: { upColor: up, downColor: down, noChangeColor: p.suave, text: { family: "Red Hat Mono, monospace", color: DARK && !CLASSIC ? "#0e1526" : "#ffffff" } } },
        tooltip: { text: { color: p.suave, family: "Red Hat Mono, monospace" } }
      },
      indicator: { tooltip: { text: { color: p.suave, family: "Red Hat Mono, monospace" } }, lines: [{ color: p.cob }, { color: "#b7791f" }, { color: DARK ? "#c6cee0" : "#14213a" }, { color: "#8a93a8" }, { color: "#2f8f67" }] },
      xAxis: axis, yAxis: axis,
      separator: { color: p.linea, activeBackgroundColor: p.cobA },
      crosshair: { horizontal: { line: { color: p.suave }, text: cross.text }, vertical: { line: { color: p.suave }, text: cross.text } },
      overlay: {
        point: { color: p.cob, borderColor: p.cobA, activeColor: p.cob, activeBorderColor: p.cobA },
        line: { color: p.cob, size: 1.5 }, rect: { color: p.cobA, borderColor: p.cob },
        polygon: { color: p.cobA, borderColor: p.cob },
        text: { color: p.tinta, family: "Sora, sans-serif" },
        rectText: { color: "#ffffff", backgroundColor: p.cob, borderColor: p.cob, family: "Red Hat Mono, monospace" }
      }
    };
  }

  /* ---------- piezas propias: zona, posición con riesgo/beneficio y ATR ---------- */
  KC.registerOverlay({
    name: "tkRect", totalStep: 3, needDefaultPointFigure: true, needDefaultXAxisFigure: true, needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates: c }) => {
      if (c.length < 2) return [];
      const p = pal();
      return [{ type: "rect", attrs: { x: Math.min(c[0].x, c[1].x), y: Math.min(c[0].y, c[1].y), width: Math.abs(c[1].x - c[0].x), height: Math.abs(c[1].y - c[0].y) }, styles: { style: "stroke_fill", color: p.cobA, borderColor: p.cob, borderSize: 1 } }];
    }
  });
  KC.registerOverlay({
    name: "tkPos", totalStep: 4, needDefaultPointFigure: true, needDefaultXAxisFigure: false, needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates: c, overlay: o }) => {
      if (c.length < 2) return [];
      const p = pal(), ex = o.extendData || {}, pts = o.points;
      const x0 = c[0].x, x1 = Math.max(c[1].x, x0 + 36), w = x1 - x0;
      const e = pts[0].value, s = pts[1].value, t = pts[2] && pts[2].value != null ? pts[2].value : null;
      const figs = [{ type: "rect", attrs: { x: x0, y: Math.min(c[0].y, c[1].y), width: w, height: Math.abs(c[1].y - c[0].y) }, styles: { style: "fill", color: p.stopA } }];
      const txt = { color: p.tinta, size: 11, family: "Red Hat Mono, monospace", backgroundColor: "transparent", borderSize: 0, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 };
      const label = ex.side === "sell" ? "VENTA" : "COMPRA";
      figs.push({ type: "text", ignoreEvent: true, attrs: { x: x0 + 4, y: c[1].y + (c[1].y > c[0].y ? 2 : -2), text: "Stop −1 R", baseline: c[1].y > c[0].y ? "top" : "bottom" }, styles: txt });
      if (t != null && c[2]) {
        const rr = Math.abs(t - e) / Math.abs(e - s);
        figs.push({ type: "rect", attrs: { x: x0, y: Math.min(c[0].y, c[2].y), width: w, height: Math.abs(c[2].y - c[0].y) }, styles: { style: "fill", color: p.cobA } });
        figs.push({ type: "text", ignoreEvent: true, attrs: { x: x0 + 4, y: c[2].y + (c[2].y > c[0].y ? 2 : -2), text: "Objetivo +" + rr.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " R", baseline: c[2].y > c[0].y ? "top" : "bottom" }, styles: Object.assign({}, txt, { color: p.cob }) });
      }
      figs.push({ type: "line", ignoreEvent: true, attrs: { coordinates: [{ x: x0, y: c[0].y }, { x: x1, y: c[0].y }] }, styles: { color: p.tinta, size: 1.5 } });
      const head = ex.result != null ? label + " · " + fmtR(ex.result) : label + (ex.sim ? " · SIMULADA" : "");
      figs.push({ type: "text", ignoreEvent: true, attrs: { x: x1 - 4, y: c[0].y - 3, text: head, align: "right", baseline: "bottom" }, styles: Object.assign({}, txt, ex.result != null ? { color: "#14213a", backgroundColor: p.rot } : {}) });
      return figs;
    }
  });
  KC.registerIndicator({
    name: "ATR", shortName: "ATR", calcParams: [14], precision: 5, figures: [{ key: "atr", title: "ATR: ", type: "line" }],
    calc: (list, ind) => { const n = ind.calcParams[0] || 14; let a = null; return list.map((k, i) => { const pc = i ? list[i - 1].close : k.close; const tr = Math.max(k.high - k.low, Math.abs(k.high - pc), Math.abs(k.low - pc)); a = a == null ? tr : (a * (n - 1) + tr) / n; return i >= n - 1 ? { atr: a } : {}; }); }
  });

  /* ---------- iconos ---------- */
  const IC = {
    cursor: '<path d="M5 3l12 6-5 1.5L10 16z"/>', segment: '<path d="M4 16L16 4"/><circle cx="4" cy="16" r="1.6"/><circle cx="16" cy="4" r="1.6"/>',
    rayLine: '<path d="M4 16L18 2"/><circle cx="4" cy="16" r="1.6"/>', horizontalStraightLine: '<path d="M2 10h16"/>', verticalStraightLine: '<path d="M10 2v16"/>',
    parallelStraightLine: '<path d="M2 13L14 3M6 17L18 7"/>', tkRect: '<rect x="3" y="5" width="14" height="10" rx="1"/>',
    fibonacciLine: '<path d="M2 4h16M2 8h16M2 12h16M2 16h16" stroke-dasharray="2 2"/>', tkLong: '<path d="M4 4h12v6H4z" fill="currentColor" fill-opacity=".25"/><path d="M4 10h12v5H4z"/>',
    tkShort: '<path d="M4 5h12v5H4z"/><path d="M4 10h12v6H4z" fill="currentColor" fill-opacity=".25"/>', simpleAnnotation: '<path d="M4 4h12v9H9l-4 3v-3H4z"/>',
    magnet: '<path d="M5 3v7a5 5 0 0010 0V3M5 6h3M12 6h3"/>', eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/>', del: '<path d="M5 5l10 10M15 5L5 15"/>'
  };
  const icon = (n, s) => `<svg width="${s || 18}" height="${s || 18}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
  const TOOLS = [["cursor", "Mover y elegir"], ["segment", "Línea"], ["rayLine", "Rayo"], ["horizontalStraightLine", "Línea horizontal"], ["verticalStraightLine", "Línea vertical"],
    ["parallelStraightLine", "Canal"], ["tkRect", "Zona"], ["fibonacciLine", "Fibonacci"], ["tkLong", "Compra: riesgo y beneficio"], ["tkShort", "Venta: riesgo y beneficio"], ["simpleAnnotation", "Nota"]];

  /* ---------- fuentes de precios ---------- */
  function binance() {
    return {
      id: "binance", label: "Binance · en vivo",
      async bars(sym, tf, to) {
        const b = binSym(sym), lim = 1000;
        const r = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${b}&interval=${tf}&limit=${lim}${to ? "&endTime=" + (to - 1) : ""}`);
        if (!r.ok) throw new Error("Binance " + r.status);
        const d = await r.json();
        return { bars: d.map(k => ({ timestamp: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] })), more: d.length === lim };
      },
      subscribe(sym, tf, cb) {
        let ws = null, alive = true;
        const open = () => {
          if (!alive) return;
          ws = new WebSocket(`wss://data-stream.binance.vision/ws/${binSym(sym).toLowerCase()}@kline_${tf}`);
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
        let alive = true;
        const tick = async () => { if (!alive) return; try { const r = await p.bars(sym, tf, null); r.bars.slice(-2).forEach(cb); } catch (e) { /* lo intenta otra vez */ } if (alive) t = setTimeout(tick, 15000); };
        let t = setTimeout(tick, 15000);
        return () => { alive = false; clearTimeout(t); };
      }
    };
    return p;
  }

  /* ---------- el gráfico ---------- */
  let inst = null;
  function mount(el, opts) {
    if (inst) destroy();
    DARK = !!opts.dark;
    const st = { sym: opts.sym, tf: ls.get("tk-tf", "5m"), tool: "cursor", magnet: ls.get("tk-magnet", false), hidden: false, sel: null, prov: null, unsub: null, loading: false, quiet: false, price: null };
    if (!TF_MS[st.tf]) st.tf = "5m";
    const R = { on: false, all: [], idx: 0, timer: null, speed: ls.get("tk-speed", 2), cb: null, pos: null, trades: [], picking: false };
    el.innerHTML = `<div class="gx">
      <div class="gx-top">
        <div class="gx-seg" role="group" aria-label="Marco de tiempo">${TFS.map(([k, l]) => `<button type="button" data-tf="${k}" aria-pressed="${k === st.tf}">${l}</button>`).join("")}</div>
        <div class="gx-dd"><button type="button" class="gx-btn" data-act="ind" aria-expanded="false">Indicadores</button>
          <div class="gx-menu" hidden><div class="gx-mt">Indicadores</div>${IND.map(([k, l]) => `<label class="gx-chk"><input type="checkbox" data-ind="${k}"> ${esc(l)}</label>`).join("")}
          <div class="gx-mt">Velas</div><label class="gx-chk"><input type="radio" name="gxv" value="tickora" ${CLASSIC ? "" : "checked"}> Tickora (azul y tinta)</label><label class="gx-chk"><input type="radio" name="gxv" value="clasicas" ${CLASSIC ? "checked" : ""}> Clásicas (verde y rojo)</label></div></div>
        <button type="button" class="gx-btn gx-rp" data-act="replay">${'<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 106-6H6M6 1L3 4l3 3"/></svg>'}<span>Volver atrás</span></button>
        <span class="gx-src" aria-live="polite"></span><span class="gx-sp"></span>
        <button type="button" class="gx-btn" data-act="full"><span class="gx-full-l">Pantalla completa</span></button>
      </div>
      <div class="gx-body">
        <div class="gx-tools" role="toolbar" aria-label="Herramientas de dibujo">
          ${TOOLS.map(([k, l]) => `<button type="button" class="gx-tool" data-tool="${k}" aria-pressed="${k === "cursor"}" aria-label="${esc(l)}" title="${esc(l)}">${icon(k)}</button>`).join("")}
          <span class="gx-tsep"></span>
          <button type="button" class="gx-tool" data-act="magnet" aria-pressed="${st.magnet}" aria-label="Imán: pega los puntos a las velas" title="Imán: pega los puntos a las velas">${icon("magnet")}</button>
          <button type="button" class="gx-tool" data-act="hide" aria-pressed="false" aria-label="Ocultar dibujos" title="Ocultar dibujos">${icon("eye")}</button>
          <button type="button" class="gx-tool" data-act="delsel" hidden aria-label="Borrar el dibujo elegido" title="Borrar el dibujo elegido">${icon("del")}</button>
          <button type="button" class="gx-tool" data-act="clear" aria-label="Borrar todos los dibujos de este mercado" title="Borrar todos los dibujos de este mercado">${icon("trash")}</button>
        </div>
        <div class="gx-canvas"><div class="gx-chart"></div><div class="gx-msg" hidden></div><div class="gx-hint" hidden></div></div>
      </div>
      <div class="gx-replay" hidden>
        <div class="gx-rrow gx-start">
          <span class="gx-rlbl">Empieza en</span>
          <button type="button" class="gx-btn" data-back="1">Hace 1 día</button><button type="button" class="gx-btn" data-back="7">1 semana</button><button type="button" class="gx-btn" data-back="30">1 mes</button>
          <label class="gx-date"><span class="sr">Fecha y hora</span><input type="datetime-local" class="gx-in"></label><button type="button" class="gx-btn" data-act="godate">Ir</button>
          <span class="gx-rhelp">o toca una vela del gráfico</span>
          <span class="gx-sp"></span><button type="button" class="gx-btn" data-act="exit">Salir</button>
        </div>
        <div class="gx-rrow gx-play" hidden>
          <button type="button" class="gx-pb" data-act="prev" aria-label="Retroceder una vela">◀︎</button>
          <button type="button" class="gx-pb gx-main" data-act="play" aria-label="Reproducir">▶︎</button>
          <button type="button" class="gx-pb" data-act="next" aria-label="Avanzar una vela">▶︎▏</button>
          <label class="gx-spd"><span class="sr">Velocidad</span><select class="gx-in" data-act="speed">${[1, 2, 5, 10, 20].map(v => `<option value="${v}" ${v === R.speed ? "selected" : ""}>${v} velas/s</option>`).join("")}</select></label>
          <span class="gx-when"></span>
          <span class="gx-sp"></span>
          <button type="button" class="gx-sb gx-sell" data-sim="sell">Vender</button><button type="button" class="gx-sb gx-buy" data-sim="buy">Comprar</button>
          <button type="button" class="gx-btn" data-act="closesim" hidden>Cerrar ahora</button>
          <button type="button" class="gx-btn" data-act="restart">Otra fecha</button>
          <button type="button" class="gx-btn" data-act="exit">Salir</button>
        </div>
        <div class="gx-rrow gx-stats"></div>
      </div>
    </div>`;
    const $ = s => el.querySelector(s), $$ = s => Array.from(el.querySelectorAll(s));
    const box = $(".gx-chart");
    const ch = KC.init(box, { locale: "es-ES", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid", styles: styles(), decimalFold: { threshold: 99 } });
    let lastCross = null;
    ch.subscribeAction("onCrosshairChange", d => { lastCross = d; });

    const msg = t => { const m = $(".gx-msg"); m.hidden = !t; m.textContent = t || ""; };
    const hint = t => { const m = $(".gx-hint"); m.hidden = !t; m.textContent = t || ""; };
    const setSrc = () => { $(".gx-src").textContent = R.on ? "Práctica · " + (st.prov ? st.prov.label.split(" · ")[0] : "") : (st.prov ? st.prov.label : ""); };
    const digits = () => (opts.digits && opts.digits(st.sym)) || guessDigits(st.sym);
    function pickProv() {
      if (opts.mt5 && opts.mt5.has(st.sym)) return opts.mt5.provider(st.sym);
      if (binSym(st.sym)) return binance();
      return publico(opts.invoke, digits());
    }

    /* datos en vivo */
    const live = {
      getBars: async ({ type, timestamp, callback }) => {
        if (type === "backward") { callback([], { backward: false }); return; } // en KLineChart 10 «backward» son velas más nuevas
        const prov = st.prov;
        try {
          if (type === "init") msg("Cargando precios…");
          const r = await prov.bars(st.sym, st.tf, type === "forward" ? timestamp : null); // «forward» = más antiguas
          if (prov !== st.prov) return;
          msg(type === "init" && !r.bars.length ? "No hay velas para este mercado en este marco." : "");
          callback(r.bars, { forward: r.more && r.bars.length > 0, backward: false });
          if (type === "init" && r.bars.length) { st.price = r.bars[r.bars.length - 1].close; opts.onPrice && opts.onPrice(st.price, st.sym); }
          setSrc();
        } catch (e) {
          if (type === "init") msg("No se pudieron cargar los precios de " + st.sym + ". " + (/no disponible/i.test(e.message) ? "Este mercado aún no tiene precios públicos." : "Prueba otra vez en un momento."));
          callback([], false);
        }
      },
      subscribeBar: ({ callback }) => {
        if (st.unsub) st.unsub();
        st.unsub = st.prov.subscribe(st.sym, st.tf, bar => { callback(bar); st.price = bar.close; opts.onPrice && opts.onPrice(bar.close, st.sym); });
      },
      unsubscribeBar: () => { if (st.unsub) { st.unsub(); st.unsub = null; } }
    };
    /* datos de la práctica */
    const replayLoader = {
      getBars: ({ type, callback }) => { if (type === "init") callback(R.all.slice(0, R.idx + 1), { backward: false, forward: false }); else callback([], false); },
      subscribeBar: ({ callback }) => { R.cb = callback; },
      unsubscribeBar: () => { R.cb = null; }
    };

    function load() {
      st.prov = pickProv(); setSrc();
      ch.setSymbol({ ticker: st.sym, pricePrecision: digits(), volumePrecision: 0 });
      ch.setPeriod(TFS.find(t => t[0] === st.tf)[2]);
    }
    ch.setDataLoader(live);

    /* indicadores */
    function applyInd() {
      const on = ls.get("tk-ind", []);
      ch.removeIndicator();
      on.forEach(n => {
        const v = { name: n }; if (IND_PARAMS[n]) v.calcParams = IND_PARAMS[n]; if (["RSI", "MACD", "KDJ"].includes(n)) v.precision = 2; if (n === "ATR") v.precision = digits();
        if (MAIN_IND.includes(n)) { v.paneId = "candle_pane"; ch.createIndicator(v, true); } else ch.createIndicator(v);
      });
      $$("[data-ind]").forEach(c => { c.checked = on.includes(c.dataset.ind); });
    }

    /* dibujos */
    const evs = () => ({
      onDrawEnd: e => { afterDraw(e.overlay); save(); setTool("cursor"); },
      onPressedMoveEnd: e => { afterDraw(e.overlay); save(); },
      onRemoved: () => { if (!st.quiet) save(); },
      onRightClick: e => { ch.removeOverlay({ id: e.overlay.id }); return true; },
      onSelected: e => { st.sel = e.overlay.id; $('[data-act="delsel"]').hidden = false; },
      onDeselected: () => { st.sel = null; $('[data-act="delsel"]').hidden = true; }
    });
    function afterDraw(o) {
      if (o.name === "tkPos" && !(o.extendData && o.extendData.sim) && o.points.length >= 3 && opts.onPosition) {
        opts.onPosition({ side: o.extendData.side, entry: o.points[0].value, stop: o.points[1].value, tp: o.points[2].value, digits: digits() });
      }
    }
    function serial() { return ch.getOverlays({ groupId: "draw" }).map(o => ({ name: o.name, points: o.points.map(p => ({ timestamp: p.timestamp, value: p.value })), extendData: o.extendData })); }
    let saveT = null;
    function save() { const sym = st.sym, list = serial(); ls.set("tk-draw-" + sym, list); clearTimeout(saveT); saveT = setTimeout(() => opts.saveDrawings && opts.saveDrawings(sym, list), 1200); }
    async function restore() {
      st.quiet = true; ch.removeOverlay({ groupId: "draw" }); st.quiet = false;
      let list = ls.get("tk-draw-" + st.sym, null);
      if (opts.loadDrawings) { try { const remote = await opts.loadDrawings(st.sym); if (remote) list = remote; } catch (e) { /* uso la copia local */ } }
      (list || []).forEach(d => { if (d && d.name && d.points) ch.createOverlay(Object.assign({ name: d.name, groupId: "draw", points: d.points, extendData: d.extendData, visible: !st.hidden, mode: st.magnet ? "weak_magnet" : "normal" }, evs())); });
    }
    function setTool(k) {
      st.tool = k; $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === k)));
      if (k === "cursor") return;
      const name = k === "tkLong" || k === "tkShort" ? "tkPos" : k;
      const extendData = k === "tkLong" ? { side: "buy" } : k === "tkShort" ? { side: "sell" } : k === "simpleAnnotation" ? (window.prompt("Texto de la nota") || "Nota") : undefined;
      ch.createOverlay(Object.assign({ name, groupId: "draw", extendData, mode: st.magnet ? "weak_magnet" : "normal" }, evs()));
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
      if (R.on && bar()) $(".gx-when").textContent = fmtWhen(bar().timestamp);
    }
    function enterReplay() {
      if (R.on) return;
      R.on = true; R.picking = true; R.trades = [];
      $(".gx-replay").hidden = false; $(".gx-start").hidden = false; $(".gx-play").hidden = true; $(".gx-stats").innerHTML = "";
      $('[data-act="replay"]').setAttribute("aria-pressed", "true");
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
      if (idx < 0) idx = ts < list[0].timestamp ? 0 : list.length - 1;
      begin(list, idx);
    }
    function begin(list, idx) {
      R.all = list; R.idx = Math.max(1, Math.min(idx, list.length - 2)); R.picking = false;
      if (!/No hay velas tan antiguas/.test($(".gx-hint").textContent)) hint("");
      $(".gx-start").hidden = true; $(".gx-play").hidden = false;
      ch.setDataLoader(replayLoader); ch.resetData();
      stats(); setTimeout(() => hint(""), 4000);
    }
    function step() {
      if (R.idx >= R.all.length - 1) { pause(); hint("Has llegado al presente."); setTimeout(() => hint(""), 2500); return false; }
      R.idx++; const b = bar(); R.cb && R.cb(b); checkSim(b); stats(); return true;
    }
    function back() {
      if (R.idx <= 1) return; pause(); R.idx--;
      if (R.pos && R.idx < R.pos.entryIdx) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; hint("Simulada anulada: has vuelto a antes de la entrada."); setTimeout(() => hint(""), 2500); }
      ch.resetData(); stats();
    }
    function play() { if (R.timer) { pause(); return; } $('[data-act="play"]').textContent = "❚❚"; $('[data-act="play"]').setAttribute("aria-label", "Pausa"); R.timer = setInterval(() => { if (!step()) pause(); }, 1000 / R.speed); }
    function pause() { if (R.timer) clearInterval(R.timer); R.timer = null; const b = $('[data-act="play"]'); if (b) { b.textContent = "▶︎"; b.setAttribute("aria-label", "Reproducir"); } }
    function exitReplay() {
      pause(); if (R.pos) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; }
      ch.removeOverlay({ groupId: "sim" });
      R.on = false; R.picking = false; hint("");
      $(".gx-replay").hidden = true; $('[data-act="replay"]').setAttribute("aria-pressed", "false");
      ch.setDataLoader(live); ch.resetData(); setSrc(); setTimeout(() => ch.resize(), 0);
    }
    function atr(i) { const n = 14; let a = null; for (let k = Math.max(1, i - 100); k <= i; k++) { const c = R.all[k], pc = R.all[k - 1].close; const tr = Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc)); a = a == null ? tr : (a * (n - 1) + tr) / n; } return a; }
    function openSim(side) {
      if (R.pos || !bar()) return;
      const b = bar(), dg = digits(), rd = v => +v.toFixed(dg), e = rd(b.close), d = (atr(R.idx) || e * 0.002) * 1.5;
      const s = rd(side === "buy" ? e - d : e + d), t = rd(side === "buy" ? e + 2 * d : e - 2 * d), tw = TF_MS[st.tf] * 24;
      const id = ch.createOverlay({
        name: "tkPos", groupId: "sim", extendData: { side, sim: true }, points: [{ timestamp: b.timestamp, value: e }, { timestamp: b.timestamp + tw, value: s }, { timestamp: b.timestamp + tw, value: t }],
        onPressedMoveEnd: ev => { // el stop y el objetivo se pueden mover; la entrada no
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
      const t = e.target.closest("button,input,select,label");
      if (!t) { // toque en el gráfico para elegir la vela de inicio
        if (R.on && R.picking && e.target.closest(".gx-canvas") && lastCross && lastCross.kLineData) { const list = ch.getDataList(); const i = list.findIndex(b => b.timestamp === lastCross.kLineData.timestamp); if (i > 0) begin(list.slice(), i); }
        return;
      }
      if (t.dataset.tf) { if (R.on) exitReplay(); st.tf = t.dataset.tf; ls.set("tk-tf", st.tf); $$("[data-tf]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tf === st.tf))); ch.setPeriod(TFS.find(x => x[0] === st.tf)[2]); return; }
      if (t.dataset.tool) { setTool(t.dataset.tool); return; }
      if (t.dataset.back) { startAt(Date.now() - (+t.dataset.back) * 864e5); return; }
      if (t.dataset.sim) { openSim(t.dataset.sim); return; }
      const a = t.dataset.act;
      if (a === "ind") { const m = $(".gx-menu"); m.hidden = !m.hidden; t.setAttribute("aria-expanded", String(!m.hidden)); return; }
      if (a === "replay") { R.on ? exitReplay() : enterReplay(); return; }
      if (a === "full") { const card = el.closest(".tvcard") || el; const on = !card.classList.contains("full"); card.classList.toggle("full", on); document.body.style.overflow = on ? "hidden" : ""; $(".gx-full-l").textContent = on ? "Salir de pantalla completa" : "Pantalla completa"; setTimeout(() => ch.resize(), 30); return; }
      if (a === "magnet") { st.magnet = !st.magnet; ls.set("tk-magnet", st.magnet); t.setAttribute("aria-pressed", String(st.magnet)); return; }
      if (a === "hide") { st.hidden = !st.hidden; t.setAttribute("aria-pressed", String(st.hidden)); ch.getOverlays({ groupId: "draw" }).forEach(o => ch.overrideOverlay({ id: o.id, visible: !st.hidden })); return; }
      if (a === "delsel") { if (st.sel) ch.removeOverlay({ id: st.sel }); st.sel = null; t.hidden = true; return; }
      if (a === "clear") { if (ch.getOverlays({ groupId: "draw" }).length && window.confirm("¿Borrar todos los dibujos de " + st.sym + "?")) ch.removeOverlay({ groupId: "draw" }); return; }
      if (a === "exit") { exitReplay(); return; }
      if (a === "restart") { pause(); if (R.pos) { ch.removeOverlay({ id: R.pos.id }); R.pos = null; } R.picking = true; $(".gx-start").hidden = false; $(".gx-play").hidden = true; ch.setDataLoader(live); ch.resetData(); hint("Toca otra vela o elige una fecha."); return; }
      if (a === "play") { play(); return; }
      if (a === "next") { pause(); step(); return; }
      if (a === "prev") { back(); return; }
      if (a === "closesim") { if (R.pos) closeSim(bar().close, bar()); return; }
      if (a === "godate") { const v = $(".gx-date input").value; if (v) startAt(new Date(v).getTime()); return; }
    });
    el.addEventListener("change", e => {
      const t = e.target;
      if (t.dataset.ind) { const on = new Set(ls.get("tk-ind", [])); t.checked ? on.add(t.dataset.ind) : on.delete(t.dataset.ind); ls.set("tk-ind", Array.from(on)); applyInd(); }
      if (t.name === "gxv") { CLASSIC = t.value === "clasicas"; ls.set("tk-velas", t.value); ch.setStyles(styles()); }
      if (t.dataset.act === "speed") { R.speed = +t.value; ls.set("tk-speed", R.speed); if (R.timer) { pause(); play(); } }
    });
    const onDoc = e => { const m = $(".gx-menu"); if (m && !m.hidden && !e.target.closest(".gx-dd")) { m.hidden = true; $('[data-act="ind"]').setAttribute("aria-expanded", "false"); } };
    document.addEventListener("click", onDoc);
    const ro = new ResizeObserver(() => ch.resize()); ro.observe(box);

    inst = {
      el, ch, ro, onDoc,
      setSymbol(sym) { if (sym === st.sym) return; if (R.on) exitReplay(); st.sym = sym; load(); restore(); },
      setTheme(dark) { DARK = !!dark; ch.setStyles(styles()); },
      price: () => st.price,
      stop() { pause(); if (st.unsub) { st.unsub(); st.unsub = null; } }
    };
    load(); applyInd(); restore();
    return inst;
  }
  function destroy() {
    if (!inst) return;
    try { inst.stop(); inst.ro.disconnect(); document.removeEventListener("click", inst.onDoc); KC.dispose(inst.el.querySelector(".gx-chart")); } catch (e) { /* ya no existe */ }
    inst = null;
  }
  window.TkChart = { mount, destroy, sources: { binance, publico }, get current() { return inst; } };
})();
