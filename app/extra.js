/* Tickora · secciones nuevas: historial, emociones, diario, backtesting, noticias y asistente.
   Usa las utilidades de la página principal (S, sb, esc, fmtR, evaluate, tradeStats…). */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS = {};
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const I = (p, sz, w) => SVG(p, sz || 18, w || 1.8);
  const IC = {
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13.2 13.2L17 17"/>',
    plus: '<path d="M10 4v12M4 10h12"/>',
    x: '<path d="M5 5l10 10M15 5L5 15"/>',
    down: '<path d="M10 3v10M6 9l4 4 4-4M4 17h12"/>',
    chev: '<path d="M6 8l4 4 4-4"/>',
    left: '<path d="M12 5l-5 5 5 5"/>', right: '<path d="M8 5l5 5-5 5"/>',
    sort: '<path d="M7 4v12M4 7l3-3 3 3M13 16V4M10 13l3 3 3-3"/>',
    play: '<path d="M6 4l10 6-10 6z" fill="currentColor"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>',
    dots: '<circle cx="5" cy="10" r="1.3" fill="currentColor"/><circle cx="10" cy="10" r="1.3" fill="currentColor"/><circle cx="15" cy="10" r="1.3" fill="currentColor"/>',
    send: '<path d="M3 10l14-6-6 14-2-6z"/>',
    clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/>',
    check: '<path d="M4.5 10.5l3.5 3.5 7.5-8"/>',
    cal: '<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/>',
    trophy: '<path d="M6 3h8v4a4 4 0 01-8 0zM6 5H3a3 3 0 003 3M14 5h3a3 3 0 01-3 3M10 11v3M7 17h6"/>'
  };
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const closed = l => l.filter(t => t.status === "closed" && t.r != null);
  const fmtDT = d => new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtD = d => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const dur = (a, b) => { if (!a || !b) return "—"; const m = Math.round((new Date(b) - new Date(a)) / 6e4); return m < 60 ? m + " min" : m < 1440 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : Math.floor(m / 1440) + " d " + Math.floor(m % 1440 / 60) + " h"; };
  const px = v => v == null ? "—" : Number(v).toLocaleString("es-ES", { maximumFractionDigits: 5 });
  const ring = (v, size) => { size = size || 46; const r = size / 2 - 5, C = 2 * Math.PI * r, a = Math.max(0, Math.min(100, v || 0)) / 100; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--linea)" stroke-width="5"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--cobalto)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(C * a).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`; };
  const statCard = (label, val, sub, vis, tip) => `<div class="xk"><div class="xk-l">${label}${tip ? `<span class="xk-i" title="${esc(tip)}">${I('<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5M10 6.5v.01"/>', 13)}</span>` : ""}</div><div class="xk-m"><div><div class="xk-v">${val}</div>${sub ? `<div class="xk-s">${sub}</div>` : ""}</div>${vis || ""}</div></div>`;
  const empty = (title, text, act) => `<div class="xempty">${I('<path d="M4 15l3-4 3 2 4-6 2 3"/><rect x="2.5" y="3" width="15" height="14" rx="2"/>', 30, 1.4)}<b>${title}</b><span>${text}</span>${act || ""}</div>`;
  const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  const acctLabel = num => { if (!num) return "—"; const a = (S.accts || []).find(x => String(x.number || "") === String(num)); return a ? acctName(a) : "#" + num; };
  const healthOk = () => S.consents && S.consents.health === true;

  /* ======================= HISTORIAL ======================= */
  const HGROUPS = [["Información", ["open_time", "symbol", "account", "side", "status"]], ["Rendimiento", ["r", "risk_pct", "plan", "feel"]], ["Precios", ["open_price", "close_price", "sl", "tp"]], ["Fechas", ["close_time", "dur"]]];
  const HLABEL = { open_time: "Fecha de entrada", symbol: "Símbolo", account: "Cuenta", side: "Dirección", status: "Estado", r: "Resultado", risk_pct: "Riesgo", plan: "Plan", feel: "Emoción", open_price: "Entrada", close_price: "Salida", sl: "Stop", tp: "Objetivo", close_time: "Fecha de salida", dur: "Duración" };
  function histState() { return S.hist || (S.hist = { q: "", from: "", to: "", side: "", st: "", plan: "", sort: "open_time", dir: -1, page: 0, per: lsGet("tk-hist-per", 25), sel: new Set(), hide: lsGet("tk-hcols-off", []) }); }
  function histRows() {
    const h = histState(), q = norm(h.q);
    let L = S.trades.filter(t => t.open_time);
    if (q) L = L.filter(t => norm([t.symbol, t.account, acctLabel(t.account), t.broker, (t.review || {}).why, (t.review || {}).feel].join(" ")).includes(q));
    if (h.from) L = L.filter(t => dayKey(t.open_time) >= h.from);
    if (h.to) L = L.filter(t => dayKey(t.open_time) <= h.to);
    if (h.side) L = L.filter(t => t.side === h.side);
    if (h.st) L = L.filter(t => (t.status === "closed" ? "closed" : "open") === h.st);
    if (h.plan) L = L.filter(t => t.status === "closed" && (evaluate(t).good ? "in" : "out") === h.plan);
    const key = t => h.sort === "dur" ? (t.close_time ? new Date(t.close_time) - new Date(t.open_time) : -1) : h.sort === "plan" ? (t.status === "closed" ? (evaluate(t).good ? 1 : 0) : -1) : h.sort === "feel" ? ((t.review || {}).feel || "") : h.sort === "open_time" || h.sort === "close_time" ? (t[h.sort] ? new Date(t[h.sort]).getTime() : null) : t[h.sort];
    L.sort((a, b) => { const x = key(a), y = key(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * h.dir; });
    return L;
  }
  function histCards(L) {
    const st = tradeStats(L), pf = st.pf == null ? "—" : st.pf === Infinity ? "∞" : num(st.pf, 2), wl = st.avgW != null && st.avgL ? num(Math.abs(st.avgW / st.avgL), 2) : "—";
    return `<div class="xkgrid">${statCard("Resultado", st.n ? fmtV(st.tot, st.mt) : fmtV(0, 0), st.n + " operaciones cerradas", spark(st.curve, 96, 40), "Suma de todas las operaciones filtradas, en R")}
      ${statCard("Factor de beneficio", pf, "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)), "Por encima de 1 ganas más de lo que pierdes")}
      ${statCard("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", st.n ? closed(L).filter(t => t.r > 0).length + " de " + st.n : "", ring(st.win))}
      ${statCard("Ganancia / pérdida media", wl, st.avgW != null ? fmtV(st.avgW, st.mW) + " / " + (st.avgL != null ? fmtV(st.avgL, st.mL) : "—") : "", "", "Cuánto ganas de media en las ganadoras frente a lo que pierdes en las perdedoras")}</div>`;
  }
  const visCols = () => { const h = histState(), health = healthOk(); return HGROUPS.map(([g, ks]) => [g, ks.filter(k => !h.hide.includes(k) && (k !== "feel" || health))]).filter(g => g[1].length); };
  function histTable(L) {
    const h = histState(), pages = Math.max(1, Math.ceil(L.length / h.per)); if (h.page >= pages) h.page = pages - 1;
    const rows = L.slice(h.page * h.per, (h.page + 1) * h.per), G = visCols(), cols = G.flatMap(g => g[1]);
    const allSel = rows.length && rows.every(t => h.sel.has(t.id));
    const cell = (t, k) => {
      const ev = t.status === "closed" ? evaluate(t) : null;
      switch (k) {
        case "open_time": return `<td class="mono">${fmtDT(t.open_time)}</td>`;
        case "close_time": return `<td class="mono">${t.close_time ? fmtDT(t.close_time) : "—"}</td>`;
        case "symbol": return `<td><b>${esc(t.symbol)}</b>${t.source === "manual" ? ` <span class="xtag" title="Añadida a mano">a mano</span>` : ""}</td>`;
        case "account": return `<td class="muted">${esc(acctLabel(t.account))}</td>`;
        case "side": return `<td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td>`;
        case "status": return `<td>${t.status === "closed" ? "Cerrada" : `<span class="xtag">Abierta</span>`}</td>`;
        case "r": return `<td class="mono"><b>${t.status === "closed" ? fmtV(t.r, mOf(t)) : "—"}</b></td>`;
        case "risk_pct": return `<td class="mono">${t.risk_pct != null ? fmtPct(t.risk_pct) : "—"}</td>`;
        case "open_price": case "close_price": case "sl": case "tp": return `<td class="mono">${px(t[k])}</td>`;
        case "dur": return `<td class="mono">${dur(t.open_time, t.close_time)}</td>`;
        case "plan": return `<td>${ev ? (ev.good ? `<span class="xok">${I(IC.check, 14, 2.4)} Dentro</span>` : `<span class="xbad">${ev.fail.length} norma${ev.fail.length > 1 ? "s" : ""}</span>`) : "—"}</td>`;
        case "feel": return `<td>${(t.review || {}).feel ? esc(t.review.feel) : `<span class="muted">—</span>`}</td>`;
      }
      return "<td></td>";
    };
    return `<div class="xtablewrap"><table class="xtable htable"><thead>
      <tr class="xgrp"><th></th>${G.map(([g, ks]) => `<th colspan="${ks.length}"><span>${g}</span></th>`).join("")}</tr>
      <tr><th class="xcb"><input type="checkbox" data-hselall ${allSel ? "checked" : ""} aria-label="Seleccionar las de esta página"></th>${cols.map(k => `<th><button type="button" data-hsort="${k}" class="${h.sort === k ? "on" : ""}">${HLABEL[k]}${h.sort === k ? (h.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead>
      <tbody>${rows.length ? rows.map(t => `<tr data-hop="${esc(t.id)}" tabindex="0" class="${h.sel.has(t.id) ? "sel" : ""}"><td class="xcb"><input type="checkbox" data-hsel="${esc(t.id)}" ${h.sel.has(t.id) ? "checked" : ""} aria-label="Seleccionar"></td>${cols.map(k => cell(t, k)).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length + 1}">${empty(S.trades.length ? "Ninguna operación con estos filtros" : "Aún no hay operaciones", S.trades.length ? "Prueba a quitar algún filtro." : "Conecta MetaTrader 5 en Mi plan o añade una operación a mano.", S.trades.length ? "" : `<div class="row" style="gap:8px;justify-content:center"><a class="btn" href="#plan" style="height:38px">Conectar MT5</a><button type="button" class="btn2" data-hadd style="height:38px">Añadir operación</button></div>`)}</td></tr>`}</tbody></table></div>
      <div class="xfoot"><span class="muted small">Mostrando ${L.length ? h.page * h.per + 1 : 0}–${Math.min(L.length, (h.page + 1) * h.per)} de ${L.length} operaciones</span>
        <div class="xpager"><button type="button" class="xpb" data-hpage="-1" ${h.page ? "" : "disabled"} aria-label="Página anterior">${I(IC.left, 16, 2)}</button><span class="xpn">${h.page + 1} / ${pages}</span><button type="button" class="xpb" data-hpage="1" ${h.page < pages - 1 ? "" : "disabled"} aria-label="Página siguiente">${I(IC.right, 16, 2)}</button></div>
        <label class="small muted">Filas <select class="xsel" id="hPer">${[10, 25, 50, 100].map(n => `<option ${n === h.per ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>`;
  }
  function selBar() {
    const h = histState(), n = h.sel.size; if (!n) return "";
    const man = S.allTrades.filter(t => h.sel.has(t.id) && t.source === "manual").length;
    return `<div class="xselbar"><b>${n} seleccionada${n > 1 ? "s" : ""}</b><button type="button" class="btn2" data-hselcsv style="height:32px">${I(IC.down, 15)} Exportar</button>${man ? `<button type="button" class="btn2" data-hseldel style="height:32px">${I(IC.trash, 15)} Borrar ${man} añadida${man > 1 ? "s" : ""} a mano</button>` : ""}<button type="button" class="link small" data-hselclear>Quitar selección</button></div>`;
  }
  const csvOf = L => {
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const head = ["Fecha entrada", "Fecha salida", "Símbolo", "Cuenta", "Dirección", "Estado", "R", "Riesgo %", "Entrada", "Salida", "Stop", "Objetivo", "Dentro del plan"].concat(healthOk() ? ["Emoción", "Intensidad"] : []);
    const rows = L.map(t => [t.open_time, t.close_time, t.symbol, acctLabel(t.account), t.side === "buy" ? "Compra" : "Venta", t.status === "closed" ? "Cerrada" : "Abierta", t.r, t.risk_pct, t.open_price, t.close_price, t.sl, t.tp, t.status === "closed" ? (evaluate(t).good ? "Sí" : "No") : ""].concat(healthOk() ? [(t.review || {}).feel, (t.review || {}).int] : []));
    return "﻿" + [head].concat(rows).map(r => r.map(q).join(";")).join("\n");
  };
  const nOr = v => { if (v == null) return null; const x = parseFloat(String(v).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(x) ? x : null; };
  const calcR = (side, e, sl, x) => { if (e == null || sl == null || x == null || e === sl) return null; const risk = Math.abs(e - sl), mv = side === "buy" ? x - e : e - x; return Math.round(mv / risk * 100) / 100; };
  async function insertManual(rows) {
    const recs = rows.map(r => Object.assign({ user_id: S.user.id, id: "man:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), source: "manual", review: {} }, r));
    for (let i = 0; i < recs.length; i += 200) { const { error } = await sb.from("trades").insert(recs.slice(i, i + 200)); if (error) return { error }; }
    S.allTrades = recs.concat(S.allTrades); window.TKAPP.applyAcct(); return { n: recs.length };
  }
  /* ventana «Añadir operación» */
  function addTradeModal() {
    const accts = (S.accts || []).filter(a => a.number), now = new Date(); now.setSeconds(0, 0);
    const loc = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    const box = document.createElement("div"); box.className = "xmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Añadir operación");
    box.innerHTML = `<form class="xmodal-card" style="max-width:620px" id="mtF">
      <div class="xmodal-h"><b>Añadir operación</b><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xmodal-b stack" style="gap:12px">
        <div class="xseg" role="group" aria-label="Dirección"><button type="button" data-side="buy" aria-pressed="true">Compra</button><button type="button" data-side="sell" aria-pressed="false">Venta</button></div>
        <div class="fgrid"><label class="field"><span>Símbolo</span><input class="input" name="symbol" required maxlength="32" placeholder="EURUSD" list="mtSyms" autocomplete="off"></label>
          <label class="field"><span>Cuenta</span><select class="input" name="account"><option value="">Sin cuenta</option>${accts.map(a => `<option value="${esc(a.number)}" ${selAcct() && selAcct().a.number === a.number ? "selected" : ""}>${esc(acctName(a))}</option>`).join("")}</select></label>
          <label class="field"><span>Riesgo (%)</span><input class="input" name="risk_pct" inputmode="decimal" value="${S.plan && S.plan.riskPct != null ? String(S.plan.riskPct).replace(".", ",") : ""}"></label></div>
        <datalist id="mtSyms">${symbolsInfo().map(x => `<option value="${esc(x.s)}">`).join("")}${MARKETS.flatMap(g => g[1]).map(s => `<option value="${esc(s)}">`).join("")}</datalist>
        <div class="fgrid"><label class="field"><span>Entrada (fecha y hora)</span><input class="input" type="datetime-local" name="open_time" required value="${loc(now)}"></label><label class="field"><span>Salida (vacía si sigue abierta)</span><input class="input" type="datetime-local" name="close_time"></label></div>
        <div class="fgrid f4"><label class="field"><span>Precio de entrada</span><input class="input" name="open_price" inputmode="decimal"></label><label class="field"><span>Stop</span><input class="input" name="sl" inputmode="decimal"></label><label class="field"><span>Objetivo</span><input class="input" name="tp" inputmode="decimal"></label><label class="field"><span>Precio de salida</span><input class="input" name="close_price" inputmode="decimal"></label></div>
        <div class="fgrid"><label class="field"><span>Resultado en R</span><input class="input" name="r" inputmode="decimal" placeholder="Se calcula con los precios"></label><label class="field" style="grid-column:span 2"><span>Por qué entraste</span><input class="input" name="why" maxlength="300"></label></div>
        <div class="small muted" id="mtHint">Pon entrada, stop y salida y calculo el resultado en R.</div>
      </div>
      <div class="xmodal-f"><button type="button" class="btn2" data-x style="height:40px">Cancelar</button><button type="submit" class="btn" style="height:40px">Guardar operación</button></div></form>`;
    let side = "buy";
    const f = box.querySelector("form"), close = () => { box.remove(); document.removeEventListener("keydown", ek); }, ek = e => { if (e.key === "Escape") close(); };
    const v = n => f.elements[n].value.trim();
    const upd = () => { const r = calcR(side, nOr(v("open_price")), nOr(v("sl")), nOr(v("close_price"))); if (r != null) { f.elements.r.placeholder = String(r).replace(".", ",") + " R (calculado)"; } else f.elements.r.placeholder = "Se calcula con los precios"; };
    f.addEventListener("input", upd);
    box.addEventListener("click", e => { if (e.target === box || e.target.closest("[data-x]")) return close(); const b = e.target.closest("[data-side]"); if (b) { side = b.dataset.side; box.querySelectorAll("[data-side]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); upd(); } });
    f.onsubmit = async e => {
      e.preventDefault();
      const ot = v("open_time"), ct = v("close_time"), closedT = !!ct;
      if (ct && new Date(ct) < new Date(ot)) { toast("La salida tiene que ser después de la entrada"); return; }
      let r = nOr(v("r")); if (r == null) r = calcR(side, nOr(v("open_price")), nOr(v("sl")), nOr(v("close_price")));
      if (closedT && r == null) { toast("Pon el resultado en R o los precios de entrada, stop y salida"); return; }
      const rec = { symbol: v("symbol").toUpperCase(), side, account: v("account") || null, open_time: new Date(ot).toISOString(), close_time: closedT ? new Date(ct).toISOString() : null, open_price: nOr(v("open_price")), close_price: nOr(v("close_price")), sl: nOr(v("sl")), tp: nOr(v("tp")), risk_pct: nOr(v("risk_pct")), r: closedT ? r : null, status: closedT ? "closed" : "open", review: v("why") ? { why: v("why") } : {} };
      const btn = f.querySelector("[type=submit]"); btn.disabled = true;
      const res = await insertManual([rec]); btn.disabled = false;
      if (res.error) { toast("No se pudo guardar: " + res.error.message); return; }
      close(); toast("Operación añadida"); S.lastView = null; render();
    };
    document.addEventListener("keydown", ek); document.body.appendChild(box); setTimeout(() => f.elements.symbol.focus(), 30);
  }
  /* importar CSV (el de Tickora o uno genérico con columnas parecidas) */
  function parseCsv(text) {
    text = text.replace(/^﻿/, ""); const first = text.split(/\r?\n/)[0] || "", sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c; }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim()));
  }
  function importCsv() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".csv,text/csv";
    inp.onchange = async () => {
      const fl = inp.files[0]; if (!fl) return; const rows = parseCsv(await fl.text()); if (rows.length < 2) { toast("El archivo está vacío"); return; }
      const H = rows[0].map(h => norm(h).replace(/[^a-z0-9%]/g, ""));
      const col = (...names) => H.findIndex(h => names.some(n => h === n || h.startsWith(n)));
      const ix = { ot: col("fechaentrada", "opentime", "fecha", "date", "entrytime"), ct: col("fechasalida", "closetime", "exittime"), sym: col("simbolo", "symbol", "instrumento", "mercado"), side: col("direccion", "side", "tipo", "type"), r: col("r", "resultador", "rmultiple"), risk: col("riesgo", "risk"), e: col("entrada", "openprice", "entry", "precioentrada"), x: col("salida", "closeprice", "exit", "preciosalida"), sl: col("stop", "sl", "stoploss"), tp: col("objetivo", "tp", "takeprofit") };
      if (ix.ot < 0 || ix.sym < 0 || ix.side < 0) { toast("No encuentro las columnas de fecha, símbolo y dirección"); return; }
      const out = [];
      rows.slice(1).forEach(c => {
        const g = i => i >= 0 ? (c[i] || "").trim() : "", d = new Date(g(ix.ot)); if (isNaN(d)) return;
        const sd = /^(c|b|long|compra)/i.test(g(ix.side)) ? "buy" : /^(v|s|short|venta)/i.test(g(ix.side)) ? "sell" : null; if (!sd || !g(ix.sym)) return;
        const ct = g(ix.ct) ? new Date(g(ix.ct)) : null, e = nOr(g(ix.e)), sl = nOr(g(ix.sl)), x = nOr(g(ix.x)); let r = nOr(g(ix.r)); if (r == null) r = calcR(sd, e, sl, x);
        const cl = r != null && (ct ? !isNaN(ct) : true);
        out.push({ symbol: g(ix.sym).toUpperCase().slice(0, 32), side: sd, open_time: d.toISOString(), close_time: cl ? (ct && !isNaN(ct) ? ct : d).toISOString() : null, open_price: e, close_price: x, sl, tp: nOr(g(ix.tp)), risk_pct: nOr(String(g(ix.risk)).replace("%", "")), r: cl ? r : null, status: cl ? "closed" : "open", account: selAcct() && selAcct().a.number || null });
      });
      if (!out.length) { toast("No he encontrado operaciones válidas en el archivo"); return; }
      if (!confirm(`He encontrado ${out.length} operaciones. Se añadirán como «a mano»${selAcct() ? " a " + acctName(selAcct().a) : ""}. ¿Seguir?`)) return;
      const res = await insertManual(out); if (res.error) { toast("No se pudo importar: " + res.error.message); return; }
      toast(res.n + " operaciones importadas"); S.lastView = null; render();
    };
    inp.click();
  }
  V.historial = {
    view() {
      const h = histState(), L = histRows();
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Operaciones</h1><div class="small muted">Todas tus operaciones${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""}, en una tabla que puedes filtrar y ordenar</div></div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn2" id="hImp" style="height:38px">${I('<path d="M10 17V7M6 11l4-4 4 4M4 3h12"/>', 16)} Importar CSV</button><button type="button" class="btn2" id="hCsv" style="height:38px">${I(IC.down, 16)} Exportar CSV</button><button type="button" class="btn" data-hadd style="height:38px">${I(IC.plus, 16, 2)} Operación</button></div></div>
        <div id="hCards">${histCards(L)}</div>
        <div class="card xcard">
          <div class="xtools">
            <label class="xsearch">${I(IC.search, 16)}<input id="hQ" placeholder="Buscar símbolo, cuenta, nota…" value="${esc(h.q)}" aria-label="Buscar operaciones"></label>
            <div class="xfil">
              <label class="xdate"><span>Desde</span><input type="date" id="hFrom" value="${esc(h.from)}"></label>
              <label class="xdate"><span>Hasta</span><input type="date" id="hTo" value="${esc(h.to)}"></label>
              <select class="xsel" id="hSide" aria-label="Dirección"><option value="">Compras y ventas</option><option value="buy" ${h.side === "buy" ? "selected" : ""}>Solo compras</option><option value="sell" ${h.side === "sell" ? "selected" : ""}>Solo ventas</option></select>
              <select class="xsel" id="hSt" aria-label="Estado"><option value="">Todas</option><option value="closed" ${h.st === "closed" ? "selected" : ""}>Cerradas</option><option value="open" ${h.st === "open" ? "selected" : ""}>Abiertas</option></select>
              <select class="xsel" id="hPlan" aria-label="Plan"><option value="">Con y sin plan</option><option value="in" ${h.plan === "in" ? "selected" : ""}>Dentro del plan</option><option value="out" ${h.plan === "out" ? "selected" : ""}>Fuera del plan</option></select>
              <div class="xpop"><button type="button" class="xib" id="hColsB" aria-haspopup="true" aria-expanded="false" title="Columnas" aria-label="Elegir columnas">${I('<rect x="3" y="4" width="14" height="12" rx="2"/><path d="M8 4v12M12.5 4v12"/>', 18)}</button>
                <div class="xpopm" id="hCols" hidden>${HGROUPS.map(([g, ks]) => `<div class="xpoph">${g}</div>${ks.filter(k => k !== "feel" || healthOk()).map(k => `<label class="xpopi"><input type="checkbox" data-hcol="${k}" ${h.hide.includes(k) ? "" : "checked"}> ${HLABEL[k]}</label>`).join("")}`).join("")}</div></div>
              <button type="button" class="link small" id="hReset">Quitar filtros</button>
            </div>
          </div>
          <div id="hSel">${selBar()}</div>
          <div id="hTable">${histTable(L)}</div>
        </div></div>`;
    },
    bind() {
      const h = histState();
      const paint = () => { const L = histRows(); $("#hCards").innerHTML = histCards(L); $("#hTable").innerHTML = histTable(L); $("#hSel").innerHTML = selBar(); bindTable(); };
      const bindTable = () => {
        $$("[data-hsort]").forEach(b => b.onclick = () => { const k = b.dataset.hsort; if (h.sort === k) h.dir = -h.dir; else { h.sort = k; h.dir = k === "symbol" || k === "account" ? 1 : -1; } paint(); });
        $$("[data-hpage]").forEach(b => b.onclick = () => { h.page += +b.dataset.hpage; paint(); });
        $$("[data-hop]").forEach(tr => { tr.onclick = e => { if (e.target.closest(".xcb")) return; location.hash = "#op/" + encodeURIComponent(tr.dataset.hop); }; tr.onkeydown = e => { if (e.key === "Enter") tr.click(); }; });
        $$("[data-hsel]").forEach(c => c.onchange = () => { c.checked ? h.sel.add(c.dataset.hsel) : h.sel.delete(c.dataset.hsel); paint(); });
        const all = $("[data-hselall]"); if (all) all.onchange = () => { const L = histRows().slice(h.page * h.per, (h.page + 1) * h.per); L.forEach(t => all.checked ? h.sel.add(t.id) : h.sel.delete(t.id)); paint(); };
        const per = $("#hPer"); if (per) per.onchange = () => { h.per = +per.value; h.page = 0; lsSet("tk-hist-per", h.per); paint(); };
        $$("[data-hadd]").forEach(b => b.onclick = addTradeModal);
        const sc = $("[data-hselcsv]"); if (sc) sc.onclick = () => download("tickora-operaciones-" + todayKey() + ".csv", csvOf(S.trades.filter(t => h.sel.has(t.id))));
        const sx = $("[data-hselclear]"); if (sx) sx.onclick = () => { h.sel.clear(); paint(); };
        const sd = $("[data-hseldel]"); if (sd) sd.onclick = async () => {
          const ids = S.allTrades.filter(t => h.sel.has(t.id) && t.source === "manual").map(t => t.id);
          if (!confirm(`¿Borrar ${ids.length} operación${ids.length > 1 ? "es" : ""} añadida${ids.length > 1 ? "s" : ""} a mano? No se puede deshacer.`)) return;
          const { error } = await sb.from("trades").delete().in("id", ids).eq("source", "manual"); if (error) { toast("No se pudieron borrar"); return; }
          S.allTrades = S.allTrades.filter(t => !ids.includes(t.id)); ids.forEach(i => h.sel.delete(i)); window.TKAPP.applyAcct(); toast("Borradas"); paint();
        };
      };
      const on = (id, k) => { const x = $(id); x.oninput = x.onchange = () => { h[k] = x.value; h.page = 0; paint(); }; };
      on("#hQ", "q"); on("#hFrom", "from"); on("#hTo", "to"); on("#hSide", "side"); on("#hSt", "st"); on("#hPlan", "plan");
      $("#hReset").onclick = () => { Object.assign(h, { q: "", from: "", to: "", side: "", st: "", plan: "", page: 0 }); S.lastView = null; render(); };
      $("#hCsv").onclick = () => download("tickora-operaciones-" + todayKey() + ".csv", csvOf(histRows()));
      $("#hImp").onclick = importCsv;
      const cb = $("#hColsB"), cm = $("#hCols");
      cb.onclick = e => { e.stopPropagation(); cm.hidden = !cm.hidden; cb.setAttribute("aria-expanded", String(!cm.hidden)); };
      cm.onclick = e => e.stopPropagation();
      document.addEventListener("click", function off() { if (!document.body.contains(cm)) return document.removeEventListener("click", off); cm.hidden = true; cb.setAttribute("aria-expanded", "false"); });
      $$("[data-hcol]").forEach(c => c.onchange = () => { const k = c.dataset.hcol; h.hide = c.checked ? h.hide.filter(x => x !== k) : h.hide.concat([k]); if (visCols().flatMap(g => g[1]).length === 0) { h.hide = h.hide.filter(x => x !== k); c.checked = true; return; } lsSet("tk-hcols-off", h.hide); paint(); });
      bindTable();
    }
  };
  window.tkAddTrade = addTradeModal;
  /* ======================= EMOCIONES ======================= */
  function emoStats(L) {
    const by = {};
    closed(L).forEach(t => { const f = (t.review || {}).feel; if (!f) return; const o = by[f] || (by[f] = { f, n: 0, sum: 0, win: 0, int: 0, ni: 0, good: 0 }); o.n++; o.sum += t.r; if (t.r > 0) o.win++; if ((t.review || {}).int) { o.int += t.review.int; o.ni++; } if (evaluate(t).good) o.good++; });
    return Object.values(by).map(o => Object.assign(o, { avg: o.sum / o.n, wr: o.win / o.n * 100, ai: o.ni ? o.int / o.ni : null, gp: o.good / o.n * 100 }));
  }
  function emoBars(E) {
    if (!E.length) return empty("Aún no hay emociones anotadas", "Anota cómo te sentías en cada operación (abajo tienes las últimas) y aquí verás cuáles te ayudan y cuáles te cuestan.");
    const mx = Math.max(0.5, ...E.map(e => Math.abs(e.avg))), sorted = E.slice().sort((a, b) => b.avg - a.avg);
    return `<div class="xbars" role="img" aria-label="Resultado medio por emoción">${sorted.map(e => { const w = Math.abs(e.avg) / mx * 50; return `<div class="xbar"><span class="xbar-l">${esc(e.f)}</span><div class="xbar-t"><span class="xbar-z"></span><i class="${e.avg < 0 ? "neg" : ""}" style="${e.avg < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}"></i></div><span class="xbar-v mono">${fmtV(e.avg)}</span><span class="xbar-n muted">${e.n} op.</span></div>`; }).join("")}</div>`;
  }
  /* registro de emociones sin operación (chequeos), guardado en docs «emo» */
  const MOMENTS = [["antes", "Antes de operar"], ["durante", "Durante la sesión"], ["despues", "Después de operar"], ["fuera", "Fuera del mercado"]];
  async function loadEmo() { if (S.emoLoaded) return; const { data, error } = await sb.from("docs").select("id,data").eq("col", "emo"); if (!error) { S.emoLog = (data || []).map(d => Object.assign({ id: d.id }, d.data)); S.emoLoaded = true; } }
  function emoModal(preset) {
    if (!healthOk()) { location.hash = "#emociones"; return; }
    const d = { feel: preset || "", int: 3, when: "antes", note: "" };
    const box = document.createElement("div"); box.className = "xmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Registrar emoción");
    const paint = () => { box.innerHTML = `<div class="xmodal-card" style="max-width:560px">
      <div class="xmodal-h"><b>Registrar emoción</b><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xmodal-b stack" style="gap:14px">
        <div class="field"><span>¿Cómo te sientes ahora?</span><div class="row" style="gap:6px;flex-wrap:wrap">${FEELS.map(f => `<button type="button" class="chip" data-ef="${esc(f)}" aria-pressed="${d.feel === f}">${esc(f)}</button>`).join("")}</div></div>
        <div class="field"><span>Intensidad</span><div class="row" style="gap:6px">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="chipb" data-ei="${n}" aria-pressed="${d.int === n}" style="min-width:42px">${n}</button>`).join("")}<span class="small muted" style="margin-left:6px">${["", "muy suave", "suave", "media", "fuerte", "muy fuerte"][d.int]}</span></div></div>
        <div class="field"><span>Momento</span><div class="xseg" role="group">${MOMENTS.map(([k, l]) => `<button type="button" data-ew="${k}" aria-pressed="${d.when === k}">${l}</button>`).join("")}</div></div>
        <label class="field"><span>Nota (opcional)</span><textarea class="input" data-en rows="2" maxlength="400" placeholder="Qué lo ha provocado, qué vas a hacer…">${esc(d.note)}</textarea></label>
      </div>
      <div class="xmodal-f"><button type="button" class="btn2" data-x style="height:40px">Cancelar</button><button type="button" class="btn" data-esave style="height:40px" ${d.feel ? "" : "disabled"}>Guardar</button></div></div>`; };
    const close = () => { box.remove(); document.removeEventListener("keydown", ek); }, ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("input", e => { if (e.target.matches("[data-en]")) d.note = e.target.value; });
    box.addEventListener("click", async e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ef) { d.feel = b.dataset.ef; paint(); } else if (b.dataset.ei) { d.int = +b.dataset.ei; paint(); } else if (b.dataset.ew) { d.when = b.dataset.ew; paint(); }
      else if (b.hasAttribute("data-esave")) {
        const x = { id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), feel: d.feel, int: d.int, when: d.when, note: d.note.trim(), ts: Date.now() };
        const { id, ...data } = x; b.disabled = true;
        const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "emo", id, data, updated_at: new Date().toISOString() });
        if (error) { b.disabled = false; toast("No se pudo guardar"); return; }
        (S.emoLog = S.emoLog || []).push(x); close(); toast("Emoción registrada"); if (location.hash.startsWith("#emociones")) { S.lastView = null; render(); }
      }
    });
    document.addEventListener("keydown", ek); paint(); document.body.appendChild(box);
  }
  window.tkEmoModal = emoModal;
  const ESORT = [["n", "Más registros"], ["best", "Mejor R por operación"], ["worst", "Peor R por operación"], ["int", "Más intensidad"]];
  V.emociones = {
    view() {
      if (!healthOk()) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Emociones</h1><div class="small muted">Qué emociones te ayudan y cuáles te cuestan</div></div></div>
        <div class="card stack" style="gap:10px;max-width:640px"><b>Necesitamos tu permiso para guardar cómo te sientes</b><span class="small muted">Las emociones son datos sensibles. Solo se guardan si lo activas, solo los ves tú y puedes retirarlo cuando quieras.</span><a class="btn" href="#plan" style="align-self:flex-start;height:40px">Activar en Ajustes → Permisos</a></div></div>`;
      if (!S.emoLoaded) loadEmo().then(() => { if (location.hash.startsWith("#emociones")) { S.lastView = null; render(); } });
      const per = S.emoPer || "all", from = per === "all" ? null : Date.now() - (+per) * 864e5;
      const L = S.trades.filter(t => !from || new Date(t.open_time) >= from), E = emoStats(L), C = closed(L);
      const ok = E.filter(e => e.n >= 2), best = ok.slice().sort((a, b) => b.avg - a.avg)[0], worst = ok.slice().sort((a, b) => a.sum - b.sum)[0], freq = E.slice().sort((a, b) => b.n - a.n)[0];
      const tagged = C.filter(t => (t.review || {}).feel).length, untag = S.trades.filter(t => t.status === "closed" && !(t.review || {}).feel).sort((a, b) => new Date(b.open_time) - new Date(a.open_time)).slice(0, 5);
      const insight = worst && worst.avg < 0 ? `Cuando operas <b>${esc(worst.f.toLowerCase())}</b>, cumples el plan el ${num(worst.gp, 0)} % de las veces y pierdes ${fmtV(worst.avg)} de media. La próxima vez que lo notes, para cinco minutos antes de entrar.` : best ? `Tu mejor estado es <b>${esc(best.f.toLowerCase())}</b>: ${fmtV(best.avg)} de media y ${num(best.gp, 0)} % dentro del plan. Fíjate en qué haces esos días.` : "";
      const so = S.emoSort || "n", sorter = { n: (a, b) => b.n - a.n, best: (a, b) => b.avg - a.avg, worst: (a, b) => a.avg - b.avg, int: (a, b) => (b.ai || 0) - (a.ai || 0) }[so];
      const log = (S.emoLog || []).filter(x => !from || x.ts >= from).sort((a, b) => b.ts - a.ts);
      const logCount = {}; log.forEach(x => logCount[x.feel] = (logCount[x.feel] || 0) + 1);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Emociones</h1><div class="small muted">Qué emociones te ayudan y cuáles te cuestan · ${tagged} de ${C.length} operaciones anotadas</div></div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="eNew" style="height:38px">${I('<circle cx="10" cy="10" r="7.5"/><path d="M7 12a4 4 0 006 0M7.5 8h.01M12.5 8h.01"/>', 16)} Registrar emoción</button>
          <select class="xsel" id="ePer" aria-label="Periodo">${[["30", "Últimos 30 días"], ["90", "Últimos 90 días"], ["all", "Todo el tiempo"]].map(([k, l]) => `<option value="${k}" ${per === k ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        <div class="xkgrid x3">${statCard("La emoción más rentable", best ? esc(best.f) : "—", best ? fmtV(best.avg) + " por operación · " + best.n + " op." : "Necesita 2 operaciones o más")}
          ${statCard("La emoción que más te cuesta", worst && worst.sum < 0 ? esc(worst.f) : "—", worst && worst.sum < 0 ? fmtV(worst.sum, worst.msum) + " en total · " + worst.n + " op." : "Nada en negativo")}
          ${statCard("La más frecuente", freq ? esc(freq.f) : "—", freq ? freq.n + " de " + tagged + " operaciones anotadas" : "")}</div>
        ${insight ? `<div class="card xinsight">${I('<path d="M10 2.5a5.5 5.5 0 00-3.2 10l.2 2.5h6l.2-2.5A5.5 5.5 0 0010 2.5zM7.5 17.5h5"/>', 20)}<div>${insight}</div></div>` : ""}
        <div class="card stack" style="gap:12px"><div class="between"><h2 class="h2b">Métricas emocionales</h2><span class="small muted">resultado medio por operación</span></div>${emoBars(E)}</div>
        <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Desglose de las emociones</h2><select class="xsel" id="eSort" aria-label="Ordenar">${ESORT.map(([k, l]) => `<option value="${k}" ${so === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div class="xtablewrap"><table class="xtable"><thead><tr><th>Emoción</th><th>Registros</th><th>Intensidad media</th><th>Acierto</th><th>Dentro del plan</th><th>Total</th><th>Por operación</th><th>Chequeos</th></tr></thead><tbody>
          ${E.length ? E.sort(sorter).map(e => `<tr><td><b>${esc(e.f)}</b></td><td class="mono">${e.n}</td><td class="mono">${e.ai == null ? "—" : num(e.ai, 1) + " / 5"}</td><td class="mono">${num(e.wr, 0)} %</td><td class="mono">${num(e.gp, 0)} %</td><td class="mono"><b>${fmtV(e.sum, e.msum)}</b></td><td class="mono">${fmtV(e.avg)}</td><td class="mono">${logCount[e.f] || 0}</td></tr>`).join("") : `<tr><td colspan="8" class="muted" style="padding:16px">Sin datos todavía.</td></tr>`}
          </tbody></table></div></div>
        <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Registro de emociones</h2><span class="small muted">${log.length} chequeo${log.length === 1 ? "" : "s"}</span></div>
          ${log.length ? `<div class="elog">${log.slice(0, 12).map(x => `<div class="elogi"><span class="elogd">${new Date(x.ts).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><b>${esc(x.feel)}</b><span class="xtag">${x.int}/5</span><span class="small muted">${(MOMENTS.find(m => m[0] === x.when) || ["", ""])[1]}</span>${x.note ? `<span class="small elogn">${esc(x.note)}</span>` : ""}<button type="button" class="xib" data-edel="${esc(x.id)}" aria-label="Borrar" title="Borrar">${I(IC.trash, 15)}</button></div>`).join("")}</div>` : `<div class="small muted">Registra cómo te sientes antes, durante o después de operar, aunque no abras ninguna operación. Con el tiempo verás qué estados se repiten.</div>`}</div>
        ${untag.length ? `<div class="card stack" style="gap:12px"><div class="between"><h2 class="h2b">Sin anotar</h2><span class="small muted">toca cómo te sentías al entrar</span></div>
          ${untag.map(t => `<div class="xtagrow" data-tid="${esc(t.id)}"><div class="xtagrow-h"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"} · ${fmtDT(t.open_time)} · <span class="mono">${fmtV(t.r, mOf(t))}</span></div><div class="row" style="gap:6px;flex-wrap:wrap">${FEELS.map(f => `<button type="button" class="chip" data-qfeel="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>`).join("")}</div>` : ""}
      </div>`;
    },
    bind() {
      if (!healthOk()) return;
      const re = () => { S.lastView = null; render(); };
      $("#ePer").onchange = e => { S.emoPer = e.target.value; re(); };
      $("#eSort").onchange = e => { S.emoSort = e.target.value; re(); };
      $("#eNew").onclick = () => emoModal();
      $$("[data-edel]").forEach(b => b.onclick = async () => { if (!confirm("¿Borrar este registro?")) return; const { error } = await sb.from("docs").delete().eq("col", "emo").eq("id", b.dataset.edel); if (error) { toast("No se pudo borrar"); return; } S.emoLog = S.emoLog.filter(x => x.id !== b.dataset.edel); re(); });
      $$("[data-qfeel]").forEach(b => b.onclick = async () => {
        const row = b.closest("[data-tid]"), t = S.allTrades.find(x => x.id === row.dataset.tid); if (!t) return;
        t.review = Object.assign({}, t.review || {}, { feel: b.dataset.qfeel });
        const { error } = await sb.from("trades").update({ review: t.review }).eq("id", t.id);
        if (error) { toast("No se pudo guardar"); return; }
        toast("Anotado: " + b.dataset.qfeel); re();
      });
    }
  };
  window.TK_X = { $, $$, I, IC, norm, closed, fmtDT, fmtD, statCard, empty, ring, download, healthOk, px, dur, acctLabel, nOr, calcR, loadEmo };
})();

/* ======================= DIARIO ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS, { $, $$, I, IC, norm, fmtD, empty } = window.TK_X;
  const COVERS = {
    cobalto: "linear-gradient(120deg,#1d3fd6 0%,#3b6bff 45%,#7fa0ff 100%)",
    noche: "linear-gradient(135deg,#0b1430 0%,#1f3a8a 55%,#3a63e8 100%)",
    amanecer: "linear-gradient(120deg,#f59e0b 0%,#f97316 45%,#e2557a 100%)",
    mar: "linear-gradient(120deg,#0e7490 0%,#2563eb 60%,#60a5fa 100%)",
    violeta: "linear-gradient(120deg,#4c1d95 0%,#6d28d9 50%,#a78bfa 100%)",
    oro: "linear-gradient(120deg,#78350f 0%,#b45309 45%,#fbbf24 100%)",
    grafito: "linear-gradient(135deg,#111827 0%,#334155 60%,#64748b 100%)"
  };
  const CATS = [["todo", "Todo"], ["plan", "Planificación"], ["rev", "Revisión"], ["mente", "Mentalidad"], ["anal", "Análisis"], ["reto", "Fondeo"]];
  const todo = items => `<ul class="todo">${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const ul = items => `<ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const TPL = () => {
    const p = S.plan || {}, hoy = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    return [
      { id: "pre", cat: "plan", cover: "cobalto", title: "Plan antes de abrir", desc: "Contexto, niveles, escenarios y reglas del día antes de mirar una sola entrada.",
        html: `<p><b>${hoy}</b></p><h2>1. Contexto del mercado</h2>${ul(["Tendencia en diario: ", "Tendencia en 4 h: ", "Noticias de hoy (mira Noticias): "])}<h2>2. Niveles clave</h2>${ul(["Máximo y mínimo de ayer: ", "Zona de interés arriba: ", "Zona de interés abajo: "])}<h2>3. Escenarios</h2>${ul(["Si el precio … entonces …", "Si el precio … entonces …", "Si no pasa nada de esto, no opero."])}<h2>4. Mis reglas de hoy</h2>${todo([`Riesgo por operación: ${p.riskPct != null ? String(p.riskPct).replace(".", ",") + " %" : "…"}`, `Máximo ${p.maxTrades || "…"} operaciones`, `Horario: ${p.start || "…"} – ${p.end || "…"}`, "Stop puesto antes de entrar"])}<h2>5. Cómo llego hoy</h2><p>Energía (1-5): · Sueño: · Algo que me preocupa:</p>` },
      { id: "mente", cat: "mente", cover: "amanecer", title: "Chequeo mental", desc: "Tres minutos para saber si hoy estás para operar.",
        html: `<h2>Antes de abrir</h2>${todo(["He dormido lo suficiente", "No arrastro una pérdida de ayer", "Tengo claro mi plan de hoy", "Acepto perder 1 R si el mercado me lo quita"])}<h2>Cómo me siento</h2><p>Del 1 al 5, mi calma es: </p><p>Lo que me puede sacar del plan hoy: </p><h2>Mi frase de hoy</h2><blockquote>Opero mi plan, no mis emociones.</blockquote><h2>Si algo sale mal</h2>${ul(["Tras una pérdida: me levanto cinco minutos.", "Tras dos pérdidas: cierro la plataforma.", "No subo el riesgo para recuperar."])}` },
      { id: "sesion", cat: "rev", cover: "noche", title: "Revisión de la sesión", desc: "Cierre del día: qué hiciste bien, una cosa a mejorar y cómo te sentiste.",
        html: `<p><b>${hoy}</b></p><h2>Resumen</h2><p>Operaciones: · Resultado en R: · Dentro del plan: </p><h2>Lo que hice bien (máximo 3)</h2><ol><li></li><li></li><li></li></ol><h2>Una cosa a mejorar</h2><p></p><h2>Emoción dominante</h2><p></p><h2>¿Respeté mi horario y mi riesgo?</h2>${todo(["Horario", "Riesgo", "Número de operaciones", "Stop sin mover"])}<h2>Nota para mañana</h2><p></p>` },
      { id: "trade", cat: "anal", cover: "mar", title: "Desglose de una operación", desc: "Analiza una operación de principio a fin: por qué entraste y qué aprendiste.",
        html: `<h2>Datos</h2>${ul(["Mercado y marco: ", "Dirección: ", "Entrada / Stop / Objetivo: ", "Resultado en R: "])}<h2>Por qué entré</h2><p></p><h2>Captura</h2><p>Pega aquí la imagen del gráfico (Ctrl/⌘ + V).</p><h2>Gestión</h2><p></p><h2>¿Cumplí el plan?</h2>${todo(["Setup del plan", "Riesgo correcto", "Dentro del horario", "Sin mover el stop"])}<h2>Lección</h2><blockquote></blockquote>` },
      { id: "semana", cat: "rev", cover: "violeta", title: "Revisión semanal", desc: "Números de la semana, patrón que se repite y objetivo para la siguiente.",
        html: `<h2>La semana en números</h2>${ul(["Resultado en R: ", "Operaciones: ", "Acierto: ", "Días dentro del plan: "])}<h2>Mejor y peor día</h2><p></p><h2>El patrón que se repite</h2><p></p><h2>Un objetivo de proceso para la semana que viene</h2><blockquote></blockquote>` },
      { id: "plan", cat: "plan", cover: "grafito", title: "Mi plan de trading", desc: "Tu manual: mercados, horario, setups y reglas si-entonces.",
        html: `<h2>Mercados</h2><p></p><h2>Horario</h2><p>${p.start || "…"} – ${p.end || "…"}</p><h2>Setups</h2>${ul(["Setup A: ", "Setup B: "])}<h2>Gestión del riesgo</h2>${ul([`Riesgo por operación: ${p.riskPct != null ? String(p.riskPct).replace(".", ",") + " %" : "…"}`, `Límite del día: ${p.dayLimitR != null ? String(p.dayLimitR).replace(".", ",") + " R" : "…"}`, `Máximo de operaciones: ${p.maxTrades || "…"}`])}<h2>Si pasa esto → hago esto</h2>${ul((p.rules || []).map(r => `Si ${r.si} → ${r.entonces}`).concat(p.rules && p.rules.length ? [] : ["Si … → …"]))}` },
      { id: "perdida", cat: "mente", cover: "oro", title: "Después de una pérdida", desc: "Protocolo para no entrar en venganza.",
        html: `<h2>Para</h2>${todo(["Me he levantado de la silla", "He respirado diez veces despacio", "He mirado si la pérdida respetó el plan"])}<h2>¿Fue una pérdida buena?</h2><p>Si cumplí el plan, es una pérdida buena. El mercado me ha quitado 1 R, nada más.</p><h2>¿Sigo?</h2>${ul(["Si es la primera pérdida y estoy tranquilo: sigo con el plan.", "Si siento ganas de recuperar: cierro por hoy."])}` },
      { id: "reto", cat: "reto", cover: "oro", title: "Reto de fondeo", desc: "Reglas del reto, cuánto puedes perder hoy y cómo vas a pasarlo sin prisas.",
        html: `<h2>El reto</h2>${ul(["Empresa y tamaño: ", "Objetivo: ", "Pérdida diaria máxima: ", "Pérdida total máxima: ", "Días mínimos / plazo: "])}<h2>En R, con mi riesgo</h2>${ul([`Riesgo por operación: ${p.riskPct != null ? String(p.riskPct).replace(".", ",") + " %" : "…"}`, "Objetivo en R: ", "Límite diario en R: ", "Límite total en R: "])}<h2>Mi forma de pasarlo</h2>${todo(["No subo el riesgo para acabar antes", "Paro el día al llegar a la mitad del límite diario", "Solo mis setups A", "Reviso cada viernes cómo voy"])}<h2>Antes de cada operación</h2>${todo(["¿Me deja dentro del límite diario si pierdo?", "¿Está en mi horario?", "¿Hay noticias fuertes cerca?"])}` },
      { id: "bt", cat: "anal", cover: "mar", title: "Diario de backtesting", desc: "Hipótesis, condiciones y conclusiones de una sesión de práctica.",
        html: `<h2>Hipótesis</h2><p></p><h2>Condiciones</h2>${ul(["Mercado y marco: ", "Periodo: ", "Reglas de entrada: ", "Reglas de salida: "])}<h2>Resultados</h2>${ul(["Operaciones: ", "Acierto: ", "Resultado en R: ", "Peor racha: "])}<h2>Conclusión</h2><blockquote></blockquote>` }
    ];
  };
  /* limpieza del HTML guardado: solo etiquetas de texto */
  const OKTAG = new Set(["P", "H1", "H2", "H3", "UL", "OL", "LI", "BLOCKQUOTE", "HR", "B", "STRONG", "I", "EM", "U", "S", "A", "IMG", "BR", "DIV", "SPAN", "CODE"]);
  function clean(html) {
    const d = document.createElement("div"); d.innerHTML = html || "";
    const walk = n => {
      Array.from(n.childNodes).forEach(c => {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1 || !OKTAG.has(c.tagName)) { if (c.nodeType === 1 && !["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(c.tagName)) { walk(c); while (c.firstChild) n.insertBefore(c.firstChild, c); } c.remove(); return; }
        Array.from(c.attributes).forEach(a => {
          const k = a.name.toLowerCase(), v = a.value;
          const keep = (c.tagName === "A" && k === "href" && /^(https?:|#)/i.test(v)) || (c.tagName === "IMG" && (k === "src" && /^(data:image\/(png|jpe?g|webp|gif);base64,|https:)/i.test(v) || k === "alt")) || (k === "class" && (/^(todo|done)$/.test(v) || (c.tagName === "IMG" && /^isz-[smlf]( ial-c)?$/.test(v)))) || (k === "data-done" && c.tagName === "LI");
          if (!keep) c.removeAttribute(a.name);
        });
        if (c.tagName === "A") { c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener noreferrer"); }
        walk(c);
      });
    };
    walk(d); return d.innerHTML;
  }
  const pages = () => (S.pages || []).slice().sort((a, b) => (b.updated || 0) - (a.updated || 0));
  async function loadPages() {
    if (S.pagesLoaded) return;
    const { data, error } = await sb.from("docs").select("id,data,updated_at").eq("col", "page");
    if (!error) { S.pages = (data || []).map(d => Object.assign({ id: d.id }, d.data)); S.pagesLoaded = true; }
  }
  async function savePage(p) {
    p.updated = Date.now();
    const { id, ...data } = p;
    const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "page", id, data, updated_at: new Date().toISOString() });
    return !error;
  }
  function newPage(tpl) {
    const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const p = { id, title: tpl ? tpl.title : "", cover: tpl ? tpl.cover : "cobalto", html: tpl ? tpl.html : "", tpl: tpl ? tpl.id : null, created: Date.now(), updated: Date.now() };
    S.pages = (S.pages || []).concat([p]); return p;
  }
  const txt = h => { const d = document.createElement("div"); d.innerHTML = h || ""; return d.textContent || ""; };
  function pageCard(p) {
    return `<a class="pgcard" href="#diario/${encodeURIComponent(p.id)}"><span class="pgcover" style="background:${COVERS[p.cover] || COVERS.cobalto}"></span><span class="pgbody"><b>${esc(p.title || "Sin título")}</b><small>${esc(txt(p.html).slice(0, 90)) || "Página vacía"}</small><span class="pgdate">${p.isTpl ? "Plantilla · " : p.day ? "Diario del " + new Date(p.day + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " · " : ""}Editada ${new Date(p.updated).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></span></a>`;
  }
  /* -------- lista -------- */
  function listView() {
    const q = norm(S.pgQ || ""), A = pages().filter(p => !q || norm(p.title + " " + txt(p.html)).includes(q)), L = A.filter(p => !p.isTpl && !p.bt && p.tpl !== "bt"), TP = A.filter(p => p.isTpl);
    return `<div class="stack" style="gap:20px">
      <div class="pghero"><div class="pghero-in"><h1>${greet()}, ${esc((S.name || "").split(" ")[0])}</h1><label class="pgsearch">${I(IC.search, 17)}<input id="pgQ" placeholder="Buscar en tu diario" value="${esc(S.pgQ || "")}" aria-label="Buscar en tu diario"></label></div></div>
      <div class="between"><h2 class="h2b">Mis páginas</h2><span class="small muted">${(S.pages || []).length} página${(S.pages || []).length === 1 ? "" : "s"}</span></div>
      <div class="pggrid"><button type="button" class="pgcard pgnew" id="pgNew"><span class="pgplus">${I(IC.plus, 22, 2)}</span><span class="pgbody"><b>Nueva página</b><small>En blanco o desde una plantilla</small></span></button>${L.map(pageCard).join("")}</div>
      ${TP.length ? `<div class="between"><h2 class="h2b">Mis plantillas</h2><span class="small muted">${TP.length}</span></div><div class="pggrid">${TP.map(pageCard).join("")}</div>` : ""}
      ${!S.pagesLoaded ? `<div class="small muted">Cargando tus páginas…</div>` : !L.length && q ? `<div class="small muted">Nada coincide con «${esc(S.pgQ)}».</div>` : ""}
    </div>`;
  }
  /* -------- plantillas -------- */
  const userTpls = () => pages().filter(p => p.isTpl).map(p => ({ id: "u:" + p.id, pid: p.id, cat: "tuya", cover: p.cover || "cobalto", title: p.title || "Plantilla sin título", desc: txt(p.html).slice(0, 120) || "Plantilla tuya", html: p.html }));
  function tplModal(onUse, ctx) {
    ctx = ctx || {};
    const T = TPL().concat(userTpls()); let tab = "todo", cat = "todo", sel = T[0].id, q = "", det = false;
    let pins = lsGet("tk-tplpin", []);
    const box = document.createElement("div"); box.className = "xmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Plantillas");
    const paint = () => {
      const base = tab === "fij" ? T.filter(x => pins.includes(x.id)) : tab === "tuya" ? T.filter(x => x.cat === "tuya") : T.filter(x => x.cat !== "tuya");
      const L = base.filter(x => (cat === "todo" || x.cat === cat) && (!q || norm(x.title + " " + x.desc).includes(norm(q))));
      if (!T.find(x => x.id === sel)) sel = T[0].id;
      const t = T.find(x => x.id === sel), catsHere = tab === "todo" ? CATS : [];
      box.innerHTML = `<div class="xmodal-card tplm">
        <div class="xmodal-h"><b>Plantillas</b><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
        <div class="tplm-top"><b>Seleccionar plantilla</b><div class="pseg" role="group" aria-label="Plantillas">${[["todo", "Todas"], ["fij", "Fijadas"], ["tuya", "Tuyas"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div></div>
        <div class="tplm-b">
          <div class="tplm-prev"><div class="tplm-mini"><span class="pgcover" style="background:${COVERS[t.cover] || COVERS.cobalto}"></span><div class="tplm-mini-t"><b>${esc(t.title)}</b><div class="tplm-mini-c">${clean(t.html)}</div></div></div>
            <div class="between" style="margin-top:10px;gap:8px"><b style="font-size:14px">${esc(t.title)}</b><button type="button" class="link small" data-det>${det ? "Ocultar" : "Detalles"}</button></div>
            ${det ? `<p class="small muted" style="margin:6px 0 0">${esc(t.desc)}</p><div class="small muted" style="margin-top:4px">Categoría: ${t.cat === "tuya" ? "tuya" : (CATS.find(c => c[0] === t.cat) || ["", ""])[1]}</div>` : ""}
            <div class="tplm-acts">
              <button type="button" class="tplm-blank" data-blank>${I(IC.plus, 16, 2)} Página en blanco</button>
              ${ctx.page ? `<button type="button" class="tplm-blank" data-saveas>${I('<path d="M5 3h8l3 3v11H5z"/><path d="M8 3v4h5M8 12h5"/>', 16)} Guardar esta página como plantilla</button>` : `<button type="button" class="tplm-blank" data-create>${I('<path d="M4 4h12v12H4z"/><path d="M10 7v6M7 10h6"/>', 16)} Crear plantilla</button>`}
              ${t.cat === "tuya" ? `<button type="button" class="tplm-blank" data-edittpl>${I('<path d="M4 16l1-4 8-8 3 3-8 8z"/>', 16)} Editar esta plantilla</button>` : ""}
            </div></div>
          <div class="tplm-list"><label class="xsearch">${I(IC.search, 16)}<input data-q placeholder="Buscar plantillas" value="${esc(q)}" aria-label="Buscar plantillas"></label>
            ${catsHere.length ? `<div class="pills" role="group" aria-label="Categoría">${catsHere.map(([k, l]) => `<button type="button" data-cat="${k}" aria-pressed="${cat === k}">${l} <span class="muted">${k === "todo" ? base.length : base.filter(x => x.cat === k).length}</span></button>`).join("")}</div>` : ""}
            <div class="tplgrid">${L.map(x => `<div class="tplc" data-t="${x.id}" role="button" tabindex="0" aria-pressed="${x.id === sel}"><button type="button" class="tplpin" data-pin="${x.id}" aria-pressed="${pins.includes(x.id)}" aria-label="${pins.includes(x.id) ? "Quitar de fijadas" : "Fijar"}" title="${pins.includes(x.id) ? "Quitar de fijadas" : "Fijar"}">${I('<path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z"/>', 15)}</button><span class="pgcover" style="background:${COVERS[x.cover] || COVERS.cobalto}"></span><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></div>`).join("") || `<div class="small muted">${tab === "fij" ? "Aún no has fijado plantillas: pulsa la estrella de una plantilla." : tab === "tuya" ? "Aún no tienes plantillas propias. Crea una o guarda una página como plantilla." : "Ninguna plantilla coincide."}</div>`}</div></div>
        </div>
        <div class="xmodal-f"><button type="button" class="btn2" data-x style="height:40px">Cancelar</button><button type="button" class="btn" data-use style="height:40px">Usar plantilla</button></div></div>`;
      const qi = box.querySelector("[data-q]");
      qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; paint(); const n = box.querySelector("[data-q]"); n.focus(); n.setSelectionRange(pos, pos); };
    };
    const close = () => { box.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = e => { if (e.key === "Escape") close(); if (e.key === "Enter" && e.target.closest && e.target.closest("[data-t]")) { sel = e.target.closest("[data-t]").dataset.t; paint(); } };
    box.addEventListener("click", async e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const pn = e.target.closest("[data-pin]"); if (pn) { const id = pn.dataset.pin; pins = pins.includes(id) ? pins.filter(x => x !== id) : pins.concat([id]); lsSet("tk-tplpin", pins); paint(); return; }
      const tb = e.target.closest("[data-tab]"); if (tb) { tab = tb.dataset.tab; cat = "todo"; paint(); return; }
      const c = e.target.closest("[data-cat]"); if (c) { cat = c.dataset.cat; paint(); return; }
      const t = e.target.closest("[data-t]"); if (t) { sel = t.dataset.t; paint(); return; }
      if (e.target.closest("[data-det]")) { det = !det; paint(); return; }
      if (e.target.closest("[data-blank]")) { close(); onUse(null); return; }
      if (e.target.closest("[data-create]")) { close(); const p = newPage(null); p.isTpl = true; p.title = "Nueva plantilla"; await savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); return; }
      if (e.target.closest("[data-edittpl]")) { const x = T.find(y => y.id === sel); close(); location.hash = "#diario/" + encodeURIComponent(x.pid); return; }
      if (e.target.closest("[data-saveas]")) { const src = ctx.page; close(); const p = newPage(null); Object.assign(p, { isTpl: true, title: (src.title || "Plantilla") + " (plantilla)", cover: src.cover, html: src.html }); await savePage(p); toast("Guardada en «Tuyas»"); return; }
      if (e.target.closest("[data-use]")) { close(); onUse(T.find(x => x.id === sel)); }
    });
    document.addEventListener("keydown", esc_);
    paint(); document.body.appendChild(box); setTimeout(() => { const b = box.querySelector("[data-use]"); b && b.focus(); }, 30);
  }
  /* -------- editor -------- */
  const SLASH = [["h1", "Título grande", "H1"], ["h2", "Título", "H2"], ["p", "Texto", "¶"], ["ul", "Lista", "•"], ["ol", "Lista numerada", "1."], ["todo", "Lista de tareas", "☐"], ["quote", "Cita", "❝"], ["hr", "Separador", "—"], ["img", "Imagen", "▣"]];
  function editorView(p) {
    const day = p.day || null;
    return `<div class="pged ${S.pgRead ? "reading" : ""}">
      <div class="pgbar"><a href="#diario" class="row" style="gap:6px;text-decoration:none;font-weight:600;font-size:14px">${I(IC.left, 16, 2)} Diario</a><span class="muted small">/</span><span class="small" style="max-width:30vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title || "Sin título")}</span>
        <span style="flex:1"></span><span class="small muted" id="pgSaved">${I(IC.check, 14, 2.2)} Guardado</span>
        ${p.isTpl ? "" : `<button type="button" class="chipb" id="pgDay" aria-pressed="${!!day}" title="Une esta página al informe de ese día">${I(IC.check, 13, 2.4)} ${day ? "Diario del " + new Date(day + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "Añadir al diario del día"}</button>`}
        <button type="button" class="btn2" id="pgRead" style="height:34px" aria-pressed="${!S.pgRead}">${S.pgRead ? I('<path d="M4 16l1-4 8-8 3 3-8 8z"/>', 15) + " Editar" : I('<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/>', 15) + " Leer"}</button>
        <button type="button" class="xib" id="pgDel" title="Borrar página" aria-label="Borrar página">${I(IC.trash, 17)}</button></div>
      ${p.isTpl ? `<div class="callout" style="margin-bottom:10px">${I('<path d="M4 4h12v12H4z"/><path d="M4 8h12"/>', 18)}<div><b>Estás editando una plantilla tuya.</b> Aparece en Plantillas → Tuyas y la puedes usar en cualquier página nueva.</div></div>` : ""}
      <div class="pgcoverbig" style="background:${COVERS[p.cover] || COVERS.cobalto}"><div class="pgcovers" role="group" aria-label="Portada">${Object.keys(COVERS).map(k => `<button type="button" data-cover="${k}" aria-pressed="${p.cover === k}" style="background:${COVERS[k]}" aria-label="Portada ${k}"></button>`).join("")}</div></div>
      <div class="pgwho"><span class="pgav">${esc(initials())}</span><div><b>${esc(S.name || "")}</b><div class="small muted">Creada el ${fmtD(p.created)}${p.isTpl ? " · plantilla" : ""}</div></div><span style="flex:1"></span>
        <div class="row pgtools" style="gap:6px"><button type="button" class="btn2" id="pgTpl" style="height:34px">${I('<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M3 8h14M8 8v9"/>', 15)} Plantilla</button><button type="button" class="btn2" id="pgBlocks" style="height:34px">${I('<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><path d="M14 11v6M11 14h6"/>', 15)} Bloques</button></div></div>
      <input class="pgtitle" id="pgTitle" placeholder="Sin título" value="${esc(p.title || "")}" aria-label="Título de la página" maxlength="120" ${S.pgRead ? "readonly" : ""}>
      <div class="pgdoc" id="pgDoc" contenteditable="${S.pgRead ? "false" : "true"}" data-ph="Escribe, o pulsa «/» para comandos" spellcheck="true">${clean(p.html)}</div>
      <div class="slash" id="pgSlash" hidden role="listbox" aria-label="Comandos"></div>
      <div class="imgbar" id="pgImgBar" hidden role="toolbar" aria-label="Imagen">
        ${[["s", "Pequeña", "S"], ["m", "Mediana", "M"], ["l", "Grande", "L"], ["f", "Ancho completo", '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4"/></svg>']].map(([k, l, t]) => `<button type="button" data-isz="${k}" title="${l}" aria-label="${l}">${t}</button>`).join("")}<span class="imgsep"></span>
        <button type="button" data-ial title="Centrar" aria-label="Centrar">${I('<path d="M4 5h12M6 10h8M4 15h12"/>', 15)}</button>
        <button type="button" data-icopy title="Copiar imagen" aria-label="Copiar imagen">${I('<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M13 7V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1h3"/>', 15)}</button>
        <button type="button" data-idown title="Descargar" aria-label="Descargar">${I(IC.down, 15)}</button>
        <button type="button" data-idel class="imgdel" title="Borrar imagen" aria-label="Borrar imagen">${I(IC.trash, 15)}</button></div>
      <input type="file" id="pgImg" accept="image/*" hidden>
    </div>`;
  }
  async function compress(file) {
    const url = URL.createObjectURL(file), img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL("image/jpeg", 0.82);
  }
  function bindEditor(p) {
    const doc = $("#pgDoc"), title = $("#pgTitle"), saved = $("#pgSaved"), slash = $("#pgSlash"), file = $("#pgImg");
    let t = null, dirty = false;
    const mark = () => { dirty = true; saved.innerHTML = "Guardando…"; clearTimeout(t); t = setTimeout(flush, 700); };
    const flush = async () => { if (!dirty) return; dirty = false; p.title = title.value.trim(); p.html = clean(doc.innerHTML).replace(/ imgsel"/g, '"'); const ok = await savePage(p); saved.innerHTML = ok ? `${I(IC.check, 14, 2.2)} Guardado` : "No se pudo guardar"; };
    S.pgFlush = flush;
    title.oninput = mark; title.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); doc.focus(); } };
    doc.addEventListener("input", () => { mark(); checkSlash(); });
    const exec = (c, v) => document.execCommand(c, false, v);
    function block(kind, fromMenu) {
      if (fromMenu) restoreRange();
      const sel = getSelection(); if (!sel.rangeCount) return;
      // borra la «/» escrita
      const r = sel.getRangeAt(0), n = r.startContainer; if (!fromMenu && n.nodeType === 3) { const i = n.textContent.lastIndexOf("/", r.startOffset); if (i >= 0) { n.textContent = n.textContent.slice(0, i) + n.textContent.slice(r.startOffset); const rr = document.createRange(); rr.setStart(n, i); rr.collapse(true); sel.removeAllRanges(); sel.addRange(rr); } }
      if (kind === "h1" || kind === "h2" || kind === "p") exec("formatBlock", kind === "p" ? "P" : kind.toUpperCase());
      else if (kind === "ul") exec("insertUnorderedList"); else if (kind === "ol") exec("insertOrderedList");
      else if (kind === "todo") {
        const at = () => sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode);
        const inUl = at() && at().closest("#pgDoc ul");
        if (inUl) inUl.className = inUl.className === "todo" ? "" : "todo";
        else { exec("insertUnorderedList"); const u = at() && at().closest("#pgDoc ul"); if (u) u.className = "todo"; }
      }
      else if (kind === "quote") exec("formatBlock", "BLOCKQUOTE");
      else if (kind === "hr") exec("insertHorizontalRule");
      else if (kind === "img") file.click();
      mark();
    }
    let sIdx = 0, sList = [];
    function checkSlash() {
      const sel = getSelection(); if (!sel.rangeCount) return hideSlash();
      const r = sel.getRangeAt(0), n = r.startContainer; if (n.nodeType !== 3) return hideSlash();
      const before = n.textContent.slice(0, r.startOffset), m = before.match(/(?:^|\s)\/([a-zñáéíóú]*)$/i); if (!m) return hideSlash();
      sList = SLASH.filter(x => norm(x[1]).includes(norm(m[1]))); if (!sList.length) return hideSlash(); sIdx = 0;
      const rect = r.getBoundingClientRect(), host = $(".pged").getBoundingClientRect();
      slash.style.left = Math.max(0, rect.left - host.left) + "px"; slash.style.top = (rect.bottom - host.top + 6) + "px";
      paintSlash(); slash.hidden = false;
    }
    const paintSlash = () => { slash.innerHTML = sList.map((x, i) => `<button type="button" role="option" data-cmd="${x[0]}" aria-selected="${i === sIdx}"><span class="slash-i">${x[2]}</span>${x[1]}</button>`).join(""); };
    const hideSlash = () => { slash.hidden = true; };
    let fromMenu = false, saved_ = null;
    const saveRange = () => { const sel = getSelection(); if (sel.rangeCount && doc.contains(sel.anchorNode)) saved_ = sel.getRangeAt(0).cloneRange(); };
    function restoreRange() { doc.focus(); const sel = getSelection(); sel.removeAllRanges(); if (saved_) sel.addRange(saved_); else { const r = document.createRange(); r.selectNodeContents(doc); r.collapse(false); sel.addRange(r); } }
    document.addEventListener("selectionchange", function sc() { if (!document.body.contains(doc)) return document.removeEventListener("selectionchange", sc); saveRange(); });
    slash.addEventListener("mousedown", e => { const b = e.target.closest("[data-cmd]"); if (b) { e.preventDefault(); hideSlash(); block(b.dataset.cmd, fromMenu); fromMenu = false; } });
    $("#pgBlocks").onclick = e => {
      if (S.pgRead) { toast("Pulsa «Editar» para cambiar la página"); return; }
      e.stopPropagation(); if (!slash.hidden && fromMenu) { hideSlash(); fromMenu = false; return; }
      fromMenu = true; sList = SLASH.slice(); sIdx = 0; paintSlash();
      const br = e.currentTarget.getBoundingClientRect(), host = $(".pged").getBoundingClientRect();
      slash.style.left = Math.max(0, br.right - host.left - 220) + "px"; slash.style.top = (br.bottom - host.top + 6) + "px"; slash.hidden = false;
    };
    document.addEventListener("click", function off(e) { if (!document.body.contains(slash)) return document.removeEventListener("click", off); if (fromMenu && !e.target.closest("#pgSlash,#pgBlocks")) { hideSlash(); fromMenu = false; } });
    doc.addEventListener("keydown", e => {
      if (!slash.hidden) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sIdx = (sIdx + (e.key === "ArrowDown" ? 1 : -1) + sList.length) % sList.length; paintSlash(); return; }
        if (e.key === "Enter") { e.preventDefault(); const c = sList[sIdx][0]; hideSlash(); block(c, fromMenu); fromMenu = false; return; }
        if (e.key === "Escape") { hideSlash(); return; }
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); exec("bold"); }
      if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); exec("italic"); }
      if (mod && e.key.toLowerCase() === "u") { e.preventDefault(); exec("underline"); }
    });
    doc.addEventListener("click", e => { const li = e.target.closest("ul.todo > li"); if (li && e.offsetX < 26) { li.classList.toggle("done"); mark(); } });
    doc.addEventListener("paste", async e => {
      const f = Array.from(e.clipboardData.items || []).find(i => i.type.startsWith("image/")); if (f) { e.preventDefault(); insertImg(f.getAsFile()); return; }
      const h = e.clipboardData.getData("text/html"); if (h) { e.preventDefault(); exec("insertHTML", clean(h)); }
    });
    async function insertImg(fl) { if (!fl) return; try { const src = await compress(fl); doc.focus(); exec("insertHTML", `<img src="${src}" alt="Imagen"><p><br></p>`); mark(); } catch (x) { toast("No se pudo añadir la imagen"); } }
    file.onchange = () => { insertImg(file.files[0]); file.value = ""; };
    $$("[data-cover]").forEach(b => b.onclick = () => { p.cover = b.dataset.cover; $(".pgcoverbig").style.background = COVERS[p.cover]; $$("[data-cover]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); dirty = true; flush(); });
    const rd = $("#pgRead"); rd.onclick = () => { flush(); S.pgRead = !S.pgRead; S.lastView = null; render(); };
    const dy = $("#pgDay"); if (dy) dy.onclick = () => { p.day = p.day ? null : dayKey(p.created || Date.now()); dirty = true; flush(); S.lastView = null; render(); };
    /* barra de la imagen */
    const bar = $("#pgImgBar"); let imgSel = null;
    const placeBar = () => { if (!imgSel || !doc.contains(imgSel)) { bar.hidden = true; imgSel = null; return; } const r = imgSel.getBoundingClientRect(), host = $(".pged").getBoundingClientRect(); bar.style.left = Math.max(0, r.left - host.left + r.width / 2 - 150) + "px"; bar.style.top = Math.max(0, r.top - host.top - 46) + "px"; bar.hidden = false; };
    const selImg = im => { doc.querySelectorAll("img.imgsel").forEach(x => x.classList.remove("imgsel")); imgSel = im; if (im) { im.classList.add("imgsel"); placeBar(); } else bar.hidden = true; };
    const setCls = (sz, al) => { const cur = (imgSel.getAttribute("class") || "").replace("imgsel", "").trim(); let z = (cur.match(/isz-([smlf])/) || [])[1] || "f", c = /ial-c/.test(cur); if (sz) z = sz; if (al != null) c = al; imgSel.setAttribute("class", "isz-" + z + (c ? " ial-c" : "") + " imgsel"); mark(); placeBar(); };
    doc.addEventListener("click", e => { const im = e.target.closest("img"); if (im && doc.contains(im)) { if (S.pgRead) return; selImg(im); } else selImg(null); });
    bar.addEventListener("mousedown", e => e.preventDefault());
    bar.addEventListener("click", async e => {
      const b = e.target.closest("button"); if (!b || !imgSel) return;
      if (b.dataset.isz) setCls(b.dataset.isz);
      else if (b.hasAttribute("data-ial")) setCls(null, !/ial-c/.test(imgSel.getAttribute("class") || ""));
      else if (b.hasAttribute("data-idown")) { const a = document.createElement("a"); a.href = imgSel.src; a.download = (title.value.trim() || "imagen").replace(/[^\wáéíóúñ -]/gi, "") + ".jpg"; document.body.appendChild(a); a.click(); a.remove(); }
      else if (b.hasAttribute("data-icopy")) { try { const bl = await (await fetch(imgSel.src)).blob(), png = bl.type === "image/png" ? bl : await new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); c.toBlob(res, "image/png"); }; im.src = imgSel.src; }); await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]); toast("Imagen copiada"); } catch (x) { toast("Tu navegador no deja copiar imágenes"); } }
      else if (b.hasAttribute("data-idel")) { const im = imgSel; selImg(null); im.remove(); mark(); }
    });
    window.addEventListener("resize", placeBar); $("#main") && $("#main").addEventListener("scroll", placeBar, { passive: true }); window.addEventListener("scroll", placeBar, { passive: true });
    doc.addEventListener("keydown", e => { if (imgSel && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); const im = imgSel; selImg(null); im.remove(); mark(); } });
    $("#pgTpl").onclick = () => tplModal(tpl => { if (!tpl) return; if (txt(doc.innerHTML).trim() && !confirm("La plantilla se añadirá al final de la página. ¿Seguir?")) return; doc.insertAdjacentHTML("beforeend", tpl.html); if (!title.value.trim()) title.value = tpl.title; mark(); }, { page: Object.assign({}, p, { title: title.value.trim(), html: clean(doc.innerHTML) }) });
    $("#pgDel").onclick = async () => {
      if (!confirm("¿Borrar esta página? No se puede deshacer.")) return;
      const { error } = await sb.from("docs").delete().eq("col", "page").eq("id", p.id); if (error) { toast("No se pudo borrar"); return; }
      S.pages = S.pages.filter(x => x.id !== p.id); S.pgFlush = null; location.hash = "#diario"; toast("Página borrada");
    };
    window.addEventListener("hashchange", function h() { window.removeEventListener("hashchange", h); flush(); });
    if (!p.title) title.focus(); else if (!txt(p.html).trim()) doc.focus();
  }
  window.TK_DIARIO = { newPage, savePage, loadPages, tplModal, pages, COVERS, txt, TPL };
  V.diario = {
    view(r) {
      if (!S.pagesLoaded) { loadPages().then(() => { if (location.hash.startsWith("#diario")) { S.lastView = null; render(); } }); }
      if (r.id) { const p = (S.pages || []).find(x => x.id === r.id); if (!p) return S.pagesLoaded ? `<div class="stack"><a href="#diario" class="link">← Diario</a><div class="card">No encuentro esta página.</div></div>` : `<div class="muted">Cargando…</div>`; return editorView(p); }
      return listView();
    },
    bind(r) {
      if (r.id) { const p = (S.pages || []).find(x => x.id === r.id); if (p) bindEditor(p); return; }
      S.pgRead = false;
      const q = $("#pgQ"); if (q) q.oninput = () => { S.pgQ = q.value; const pos = q.selectionStart; S.lastView = null; render(); const n = $("#pgQ"); n.focus(); n.setSelectionRange(pos, pos); };
      const nb = $("#pgNew"); if (nb) nb.onclick = () => tplModal(async tpl => { const p = newPage(tpl); await savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); });
    }
  };
})();

/* ======================= BACKTESTING: SESIONES ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS, { $, $$, I, IC, fmtD, statCard, empty, ring } = window.TK_X;
  const SIZES = [10000, 25000, 50000, 100000, 150000, 200000];
  const RANGES = [["1d", "1 día", 1], ["1w", "1 semana", 7], ["1m", "1 mes", 30], ["3m", "3 meses", 91], ["6m", "6 meses", 182], ["1y", "1 año", 365]];
  const k = n => n >= 1000 ? (n / 1000).toLocaleString("es-ES") + " mil" : String(n);
  const symList = () => { const mine = symbolsInfo().map(x => x.s); return Array.from(new Set(mine.concat(MARKETS.flatMap(g => g[1])))); };
  async function loadSessions() {
    const [a, b] = await Promise.all([sb.from("docs").select("id,data").eq("col", "bts"), sb.from("sim_trades").select("id,session_id,symbol,tf,side,entry_time,entry,stop,tp,exit_time,exit,r,created_at").order("created_at", { ascending: false }).limit(3000)]);
    if (!a.error) S.bts = (a.data || []).map(d => Object.assign({ id: d.id }, d.data));
    if (!b.error) S.btTrades = b.data || [];
    S.btLoaded = true;
  }
  async function saveSession(x) { const { id, ...data } = x; const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "bts", id, data, updated_at: new Date().toISOString() }); return !error; }
  const sessTrades = id => (S.btTrades || []).filter(t => t.session_id === id && t.r != null).map(t => ({ r: +t.r, status: "closed", open_time: t.exit_time }));
  const hms = s => { s = Math.round(s || 0); if (s < 60) return s ? s + " s" : "0 min"; const m = Math.round(s / 60); return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min"; };
  const CHALL = [[25000, 6, 5, 10], [50000, 6, 5, 10], [100000, 6, 5, 10], [150000, 6, 5, 10]];
  function rulesBars(x, st) {
    if (x.mode !== "fondeo") return "";
    const rp = x.risk || 0.5, tg = x.target / rp, dl = x.daily / rp, ml = x.max / rp;
    const byDay = {}; sessTrades(x.id).forEach(t => { const d = dayKey(t.open_time); byDay[d] = (byDay[d] || 0) + t.r; });
    const worstDay = Math.min(0, ...Object.values(byDay)), bars = [["Objetivo", st.tot / tg, `${fmtV(st.tot, st.mt)} de +${num(tg, 1)} R`], ["Peor día frente al límite diario", Math.abs(worstDay) / dl, `${fmtV(worstDay)} de −${num(dl, 1)} R`, true], ["Caída máxima frente al límite", Math.abs(st.dd) / ml, `${fmtV(st.dd, st.mdd)} de −${num(ml, 1)} R`, true]];
    const fail = Math.abs(worstDay) >= dl || Math.abs(st.dd) >= ml, pass = !fail && st.tot >= tg;
    return `<div class="stack" style="gap:9px">${bars.map(([l, f, v, risk]) => `<div class="pbar"><div class="between"><span>${l}</span><b>${v}</b></div><div class="pbt ${risk && f >= .7 ? "warn" : ""}"><i style="width:${Math.min(100, Math.max(0, f * 100)).toFixed(1)}%"></i></div></div>`).join("")}
      ${pass ? `<div class="xok">${I(IC.trophy, 15)} Reto superado en la práctica</div>` : fail ? `<div class="xbad">Reto perdido: has tocado un límite</div>` : ""}</div>`;
  }
  function sessCard(x) {
    const T = sessTrades(x.id), st = tradeStats(T), from = new Date(x.from + "T00:00").getTime(), to = new Date(x.to + "T23:59").getTime(), at = x.lastTs || from, prog = Math.max(0, Math.min(1, (at - from) / (to - from)));
    return `<article class="card stack bscard" style="gap:12px">
      <div class="between" style="align-items:flex-start;gap:10px"><div style="min-width:0"><b class="anum" style="font-size:16px">${esc(x.name || "Sesión")}</b><div class="abro">${esc((x.syms || []).join(" · "))} · ${fmtD(from)} – ${fmtD(to)}</div></div>
        <div class="row" style="gap:6px"><span class="tag">${x.mode === "fondeo" ? "Reto " + k(x.size) : "Clásico"}</span><button type="button" class="xib" data-bsdel="${esc(x.id)}" aria-label="Borrar sesión" title="Borrar sesión">${I(IC.trash, 16)}</button></div></div>
      <div class="pbar"><div class="between small"><span class="muted">Avance del periodo</span><span class="mono">${num(prog * 100, 0)} % · ${new Date(at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></div><div class="pbt"><i style="width:${(prog * 100).toFixed(1)}%"></i></div></div>
      <div class="anums"><div><span>Operaciones</span><b>${st.n}</b></div><div><span>Acierto</span><b>${st.win == null ? "—" : num(st.win, 0) + " %"}</b></div><div><span>Resultado</span><b>${st.n ? fmtV(st.tot, st.mt) : "—"}</b></div><div><span>Caída máx.</span><b>${st.n ? fmtV(st.dd, st.mdd) : "—"}</b></div></div>
      <div class="small muted row" style="gap:14px">${I(IC.clock, 14)} ${hms(x.secs)} de estudio · ${(x.bars || 0).toLocaleString("es-ES")} velas repasadas</div>
      ${rulesBars(x, st)}
      <div class="row" style="gap:8px"><button type="button" class="btn" data-bsgo="${esc(x.id)}" style="height:38px;font-size:13.5px">${I(IC.play, 13)} ${x.lastTs ? "Continuar" : "Empezar"}</button>${(x.syms || []).length > 1 ? `<select class="xsel" data-bssym="${esc(x.id)}" aria-label="Mercado">${x.syms.map(s => `<option>${esc(s)}</option>`).join("")}</select>` : ""}</div>
    </article>`;
  }
  function heroRing() {
    const st = [["Fase 1", "objetivo +8 %", 36, 112], ["Fase 2", "objetivo +5 %", 120, 78], ["Fondeada", "sin objetivo", 204, 40]];
    return `<svg viewBox="0 0 240 160" class="bsart" aria-hidden="true"><defs><linearGradient id="bsr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fbd38d"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
      <path d="M36 112 C78 112 84 78 120 78 S168 40 204 40" fill="none" stroke="#fde68a" stroke-opacity=".22" stroke-width="10" stroke-linecap="round"/>
      <path d="M36 112 C78 112 84 78 120 78 S168 40 204 40" fill="none" stroke="url(#bsr)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 6"/>
      ${st.map(([t, g, x, y], i) => `<g><circle cx="${x}" cy="${y}" r="${i === 2 ? 15 : 12}" fill="#2a1d06" stroke="#fbbf24" stroke-width="2"/>${i === 2 ? `<path d="M${x - 6} ${y}l4 4 8-8" fill="none" stroke="#fde68a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fde68a" font-family="Inter,sans-serif">${i + 1}</text>`}<text x="${x}" y="${y + (i === 2 ? 31 : 28)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Inter,sans-serif">${t}</text><text x="${x}" y="${y + (i === 2 ? 43 : 40)}" text-anchor="middle" font-size="9" fill="#fcd34d" fill-opacity=".85" font-family="Inter,sans-serif">${g}</text></g>`).join("")}</svg>`;
  }
  function heroArt() {
    const c = [[30, 70, 40, 92, 58], [52, 62, 34, 80, 44], [74, 48, 28, 70, 36], [96, 56, 40, 76, 46], [118, 40, 22, 60, 30], [140, 34, 16, 52, 24]];
    return `<svg viewBox="0 0 200 140" class="bsart" aria-hidden="true"><defs><linearGradient id="bsg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fa0ff"/><stop offset="1" stop-color="#2d62f2"/></linearGradient></defs>
      <circle cx="120" cy="70" r="62" fill="url(#bsg)" opacity=".16"/><circle cx="120" cy="70" r="42" fill="url(#bsg)" opacity=".18"/>
      ${c.map(([x, o, h, l, cl]) => `<line x1="${x}" x2="${x}" y1="${h}" y2="${l}" stroke="#a9bcff" stroke-width="1.5"/><rect x="${x - 6}" y="${Math.min(o, cl)}" width="12" height="${Math.max(3, Math.abs(o - cl))}" rx="2" fill="${o > cl ? "#7fa0ff" : "none"}" stroke="#7fa0ff" stroke-width="1.5"/>`).join("")}
      <line x1="150" x2="150" y1="10" y2="130" stroke="#fbe27a" stroke-width="2" stroke-dasharray="4 4"/><rect x="152" y="10" width="44" height="120" fill="#0c1323" opacity=".55"/>
      <path d="M163 70l-8-6v12z" fill="#fbe27a"/><path d="M176 64v12l8-6z" fill="#fbe27a"/></svg>`;
  }
  V.backtest = {
    view() {
      if (!S.btLoaded) loadSessions().then(() => { if (location.hash.startsWith("#backtest")) { S.lastView = null; render(); } });
      const f = S.bsF || "todas", L = (S.bts || []).filter(x => f === "todas" || x.mode === f).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
      const all = (S.bts || []).flatMap(x => sessTrades(x.id)), st = tradeStats(all);
      return `<div class="stack" style="gap:20px">
        ${(() => { const sl = S.bsSlide || 0, SL = [["clasico", "Modo clásico", "Repasa cualquier mercado.", "Avanza vela a vela por el precio real y opera tu estrategia como si fuera en directo, sin arriesgar nada."], ["fondeo", "Reto de fondeo", "Practica el reto antes de pagarlo.", "Opera con el objetivo y los límites de una empresa de fondeo y pasa el reto aquí primero."]];
          return `<div class="bshero bscar s${sl}" id="bsCar" aria-roledescription="carrusel">${SL.map(([m, lb, h, p], i) => `<div class="bsslide ${i === sl ? "on" : ""}" aria-hidden="${i !== sl}"><div class="bshero-t"><div class="lbl" style="color:#a9bcff">${lb}</div><h1>${h}</h1><p>${p}</p>
            <div class="row" style="gap:10px;flex-wrap:wrap"><button type="button" class="btn" data-bsnewm="${m}" ${i !== sl ? 'tabindex="-1"' : ""}>${I(IC.plus, 16, 2)} Nueva sesión</button><button type="button" class="btn2 bsghost" data-bsview ${i !== sl ? 'tabindex="-1"' : ""}>Ver sesiones</button>${i === 0 ? `<a class="btn2 bsghost" href="#analizar" id="bsFree" ${i !== sl ? 'tabindex="-1"' : ""}>Practicar sin sesión</a>` : ""}</div></div>${m === "fondeo" ? heroRing() : heroArt()}</div>`).join("")}
            <div class="bsdots" role="tablist" aria-label="Modos">${SL.map((x, i) => `<button type="button" role="tab" data-bsdot="${i}" aria-selected="${i === sl}" aria-label="${x[1]}"></button>`).join("")}</div></div>`; })()}
        ${all.length ? `<div class="xkgrid">${statCard("Sesiones", (S.bts || []).length, "", "")}${statCard("Operaciones simuladas", st.n, "", "")}${statCard("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", "", ring(st.win))}${statCard("Resultado", fmtV(st.tot, st.mt), "todas las sesiones", spark(st.curve, 96, 40))}</div>` : ""}
        <div class="row" style="gap:14px;flex-wrap:wrap"><h2 class="h2b">Sesiones</h2><span class="small muted">${(S.bts || []).length} en total</span><div class="pills" role="group" aria-label="Filtrar sesiones" style="margin-left:auto">${[["todas", "Todas"], ["clasico", "Clásico"], ["fondeo", "Reto de fondeo"]].map(([a, b]) => `<button type="button" data-bsf="${a}" aria-pressed="${f === a}">${b}</button>`).join("")}</div></div>
        ${!S.btLoaded ? `<div class="agrid" id="bsList" aria-busy="true">${[0, 1, 2].map(() => `<div class="card bsskel"><i style="width:60%"></i><i style="width:40%"></i><i style="height:8px"></i><i style="width:80%"></i><i style="width:50%;height:34px"></i></div>`).join("")}</div>` : L.length ? `<div class="agrid" id="bsList">${L.map(sessCard).join("")}</div>` : `<div class="card bsempty">${empty("Aún no hay sesiones", "Crea una sesión para practicar un mercado en unas fechas concretas, en modo clásico o como un reto de fondeo.", `<button type="button" class="btn" data-bsnew2 style="height:38px">Nueva sesión</button>`)}</div>`}
      </div>`;
    },
    bind() {
      $$("[data-bsf]").forEach(b => b.onclick = () => { S.bsF = b.dataset.bsf; S.lastView = null; render(); });
      $$("[data-bsnewm]").forEach(b => b.onclick = () => drawer(b.dataset.bsnewm));
      $$("[data-bsview]").forEach(b => b.onclick = () => { const l = $("#bsList") || $(".bsempty"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); });
      const car = $("#bsCar"), go = i => { S.bsSlide = i; car.className = "bshero bscar s" + i; $$(".bsslide").forEach((x, j) => { x.classList.toggle("on", j === i); x.setAttribute("aria-hidden", String(j !== i)); x.querySelectorAll("button,a").forEach(y => j === i ? y.removeAttribute("tabindex") : y.setAttribute("tabindex", "-1")); }); $$("[data-bsdot]").forEach((d, j) => d.setAttribute("aria-selected", String(j === i))); };
      $$("[data-bsdot]").forEach(d => d.onclick = () => go(+d.dataset.bsdot));
      clearInterval(S.bsTimer); let hover = false; car.onmouseenter = () => hover = true; car.onmouseleave = () => hover = false;
      S.bsTimer = setInterval(() => { if (!document.body.contains(car)) return clearInterval(S.bsTimer); if (!hover && !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches) go(((S.bsSlide || 0) + 1) % 2); }, 7000);
      $$("[data-bsnew2]").forEach(b => b.onclick = () => drawer());
      const fr = $("#bsFree"); if (fr) fr.onclick = () => { S.btRun = null; };
      $$("[data-bsgo]").forEach(b => b.onclick = () => { const x = S.bts.find(y => y.id === b.dataset.bsgo), sel = $(`[data-bssym="${x.id}"]`); run(x, sel ? sel.value : null); });
      $$("[data-bsdel]").forEach(b => b.onclick = async () => {
        if (!confirm("¿Borrar esta sesión? Sus operaciones simuladas dejarán de contar en ella.")) return;
        const id = b.dataset.bsdel, { error } = await sb.from("docs").delete().eq("col", "bts").eq("id", id); if (error) { toast("No se pudo borrar"); return; }
        S.bts = S.bts.filter(x => x.id !== id); S.lastView = null; render();
      });
    }
  };
  function run(x, sym) {
    const from = new Date(x.from + "T00:00").getTime(), to = new Date(x.to + "T23:59:59").getTime();
    S.btRun = { id: x.id, name: x.name, mode: x.mode, sym: sym || x.syms[0], start: x.lastTs && x.lastTs < to ? x.lastTs : from, end: Math.min(to, Date.now()) };
    location.hash = "#analizar";
  }
  /* -------- panel «Nueva sesión» -------- */
  function drawer(mode0) {
    const d = { tab: "crear", mode: mode0 === "fondeo" ? "fondeo" : "clasico", chal: "100000", note: "", name: "", syms: [symList()[0] || "EURUSD"], range: "1m", from: "", to: "", balance: 10000, size: 100000, target: 10, daily: 5, max: 10, risk: S.plan && S.plan.riskPct || 0.5 };
    const setRange = key => { const r = RANGES.find(x => x[0] === key); const end = new Date(); end.setDate(end.getDate() - 1); const st = new Date(end); st.setDate(st.getDate() - r[2] + 1); d.range = key; d.to = dayKey(end); d.from = dayKey(st); };
    setRange("1m"); if (d.mode === "fondeo") { d.size = 100000; d.target = 6; d.daily = 5; d.max = 10; }
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Nueva sesión de backtesting");
    const art = mode => mode === "fondeo"
      ? `<div class="bsban fondeo"><div class="bsring"><span class="bscore">${I(IC.trophy, 26)}</span></div><div class="bsphases"><span>Fase 1</span><i></i><span>Fase 2</span><i></i><span>Fondeada</span></div><b>Reto de fondeo</b><small>Objetivo, límite diario y límite total, como en una prueba real</small></div>`
      : `<div class="bsban"><div class="bsring"><span class="bscore">${I('<path d="M3 10a7 7 0 1 0 2.3-5.2"/><path d="M3 4v3.5h3.5"/><path d="M10 6.5V10l2.5 1.6"/>', 26)}</span></div><b>Modo clásico</b><small>Practica libremente con un saldo inicial</small></div>`;
    const paint = () => {
      const syms = symList();
      box.innerHTML = `<div class="xdrawer-p">
        <div class="xdr-h"><div class="xdr-tabs" role="tablist"><button type="button" role="tab" data-tab="desc" aria-selected="${d.tab === "desc"}">Cómo funciona</button><button type="button" role="tab" data-tab="crear" aria-selected="${d.tab === "crear"}">Crear sesión</button></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
        <div class="xdr-b">${d.tab === "desc" ? `<div class="stack" style="gap:14px;font-size:14px;line-height:1.6;color:var(--tinta2)">
            <p><b style="color:var(--tinta)">Una sesión</b> es una práctica con nombre, mercado y fechas. El gráfico se abre en backtesting en la fecha de inicio y no te deja ver más allá de la fecha final.</p>
            <p><b style="color:var(--tinta)">Modo clásico:</b> practicas con tu saldo y tu riesgo. <b style="color:var(--tinta)">Reto de fondeo:</b> además tienes un objetivo y dos límites (diario y total). Tickora los convierte en R con tu riesgo por operación y te avisa si los tocas.</p>
            <p>Cada sesión guarda dónde lo dejaste, sus operaciones simuladas y sus estadísticas. Nada de esto se mezcla con tus operaciones reales.</p>
            <button type="button" class="btn" data-tab="crear" style="align-self:flex-start;height:40px">Crear sesión</button></div>` : `
          <div class="xseg" role="group" aria-label="Modo"><button type="button" data-mode="clasico" aria-pressed="${d.mode === "clasico"}">Modo clásico</button><button type="button" data-mode="fondeo" aria-pressed="${d.mode === "fondeo"}">Reto de fondeo</button></div>
          ${art(d.mode)}
          <div class="xsec">Identidad de la sesión</div>
          <label class="field"><span>Nombre</span><input class="input" data-k="name" value="${esc(d.name)}" placeholder="p. ej. NAS100 · apertura de Nueva York" maxlength="60"></label>
          <label class="field"><span>Mercado</span><select class="input" data-k="sym0">${syms.map(s => `<option ${s === d.syms[0] ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
          <div class="field"><span>Más mercados <small class="muted">(hasta 3; cambias entre ellos al continuar)</small></span><div class="row" style="gap:6px;flex-wrap:wrap">${d.syms.slice(1).map(s => `<span class="xchip">${esc(s)}<button type="button" data-rmsym="${esc(s)}" aria-label="Quitar ${esc(s)}">${I(IC.x, 12, 2)}</button></span>`).join("")}${d.syms.length < 4 ? `<select class="xsel" data-addsym aria-label="Añadir mercado"><option value="">+ Añadir</option>${syms.filter(s => !d.syms.includes(s)).map(s => `<option>${esc(s)}</option>`).join("")}</select>` : ""}</div></div>
          <div class="xsec">Periodo</div>
          <div class="row" style="gap:10px"><label class="field" style="flex:1"><span>Fecha de inicio</span><input class="input" type="date" data-k="from" value="${d.from}" max="${dayKey(new Date())}"></label><label class="field" style="flex:1"><span>Fecha final</span><input class="input" type="date" data-k="to" value="${d.to}" max="${dayKey(new Date())}"></label></div>
          <div class="row" style="gap:6px;flex-wrap:wrap">${RANGES.map(([key, l]) => `<button type="button" class="chipb" data-range="${key}" aria-pressed="${d.range === key}">${l}</button>`).join("")}</div>
          <div class="xsec">${d.mode === "fondeo" ? "Reglas del reto" : "Cuenta"}</div>
          ${d.mode === "fondeo" ? `<div class="bschal" role="radiogroup" aria-label="Seleccionar desafío">${CHALL.map(([n, tg]) => `<button type="button" role="radio" data-chal="${n}" aria-checked="${d.chal === String(n)}"><span class="bschal-i">${I(IC.trophy, 16)}</span><span><b>Reto de ${n.toLocaleString("es-ES")}</b><small>Objetivo de ${(n * tg / 100).toLocaleString("es-ES")} · ${tg} %</small></span></button>`).join("")}
              <button type="button" role="radio" data-chal="custom" aria-checked="${d.chal === "custom"}" class="wide"><span class="bschal-i">${I(IC.plus, 16, 2)}</span><span><b>Crear reto personalizado</b><small>Tú pones el tamaño, el objetivo y los límites</small></span></button></div>
            ${d.chal === "custom" ? `<div class="row" style="gap:6px;flex-wrap:wrap">${SIZES.map(n => `<button type="button" class="chipb" data-size="${n}" aria-pressed="${d.size === n}">${k(n)}</button>`).join("")}</div>
            <div class="fgrid"><label class="field"><span>Objetivo (%)</span><input class="input" data-k="target" inputmode="decimal" value="${d.target}"></label><label class="field"><span>Pérdida diaria máx. (%)</span><input class="input" data-k="daily" inputmode="decimal" value="${d.daily}"></label><label class="field"><span>Pérdida total máx. (%)</span><input class="input" data-k="max" inputmode="decimal" value="${d.max}"></label></div>` : `<div class="small muted">Objetivo ${d.target} % · pérdida diaria máx. ${d.daily} % · pérdida total máx. ${d.max} %. Para cambiarlos, elige «personalizado».</div>`}`
          : `<label class="field"><span>Saldo inicial</span><input class="input" data-k="balance" inputmode="decimal" value="${d.balance}"></label>`}
          <label class="field"><span>Riesgo por operación (%)</span><input class="input" data-k="risk" inputmode="decimal" value="${d.risk}"></label>
          <div class="small muted">Con ${String(d.risk).replace(".", ",")} % por operación${d.mode === "fondeo" ? `, el objetivo son ${num(d.target / d.risk, 1)} R y el límite diario ${num(d.daily / d.risk, 1)} R` : ""}.</div>`}
        </div>
        <div class="xdr-f"><button type="button" class="btn2" data-x style="height:42px;flex:1">Cancelar</button><button type="button" class="btn" data-go style="height:42px;flex:1.4">${I(IC.play, 13)} Iniciar sesión</button></div></div>`;
    };
    const close = () => { box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", onk); };
    const onk = e => { if (e.key === "Escape") close(); };
    const nOr2 = v => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : null; };
    box.addEventListener("input", e => { const kk = e.target.dataset.k; if (!kk) return; if (kk === "sym0") d.syms[0] = e.target.value; else if (["balance", "target", "daily", "max", "risk"].includes(kk)) { const v = nOr2(e.target.value); if (v != null) d[kk] = v; } else { d[kk] = e.target.value; if (kk === "from" || kk === "to") d.range = ""; } });
    box.addEventListener("change", e => { if (e.target.matches("[data-addsym]") && e.target.value) { d.syms.push(e.target.value); paint(); } else if (e.target.dataset.k === "risk" || e.target.dataset.k === "target" || e.target.dataset.k === "daily") paint(); });
    box.addEventListener("click", async e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tab) { d.tab = b.dataset.tab; paint(); return; }
      if (b.dataset.mode) { d.mode = b.dataset.mode; if (d.mode === "fondeo" && d.chal !== "custom") { const c = CHALL.find(x => String(x[0]) === d.chal); d.size = c[0]; d.target = c[1]; d.daily = c[2]; d.max = c[3]; } paint(); return; }
      if (b.dataset.range) { setRange(b.dataset.range); paint(); return; }
      if (b.dataset.size) { d.size = +b.dataset.size; paint(); return; }
      if (b.dataset.chal) { d.chal = b.dataset.chal; if (d.chal !== "custom") { const c = CHALL.find(x => String(x[0]) === d.chal); d.size = c[0]; d.target = c[1]; d.daily = c[2]; d.max = c[3]; } paint(); return; }
      if (b.dataset.rmsym) { d.syms = d.syms.filter(s => s !== b.dataset.rmsym); paint(); return; }
      if (b.hasAttribute("data-go")) {
        if (!d.from || !d.to || d.from > d.to) { toast("Revisa las fechas: la de inicio tiene que ser anterior a la final"); return; }
        if (!(d.risk > 0 && d.risk <= 10)) { toast("El riesgo por operación tiene que estar entre 0,01 % y 10 %"); return; }
        const x = { id: "bs" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: d.name.trim() || d.syms[0] + " · " + new Date(d.from).toLocaleDateString("es-ES", { day: "numeric", month: "short" }), mode: d.mode, syms: d.syms, from: d.from, to: d.to, risk: d.risk, balance: d.mode === "fondeo" ? d.size : d.balance, size: d.size, target: d.target, daily: d.daily, max: d.max, created: Date.now(), updated: Date.now() };
        b.disabled = true; const ok = await saveSession(x); b.disabled = false;
        if (!ok) { toast("No se pudo crear la sesión"); return; }
        S.bts = (S.bts || []).concat([x]); close(); run(x);
      }
    });
    document.addEventListener("keydown", onk);
    paint(); document.body.appendChild(box); requestAnimationFrame(() => box.classList.add("in"));
  }
  /* -------- banda de la sesión bajo el gráfico -------- */
  window.tkSessionBand = function () {
    const r = S.btRun; if (!r) return "";
    const x = (S.bts || []).find(y => y.id === r.id), T = sessTrades(r.id), st = tradeStats(T);
    return `<div class="card bsband" id="bsBand"><div class="row" style="gap:12px;flex-wrap:wrap;align-items:center"><span class="tag">${r.mode === "fondeo" ? "Reto" : "Sesión"}</span><b>${esc(r.name || "Sesión")}</b><span class="small muted">${esc(r.sym)} · hasta ${new Date(r.end).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
      <span class="small mono" id="bsBandStats">${st.n} op. · ${st.n ? fmtV(st.tot, st.mt) : fmtV(0, 0)}</span><span style="flex:1"></span><a class="btn2" href="#backtest" style="height:34px">Ver sesiones</a><button type="button" class="btn2" id="bsEnd" style="height:34px">Terminar</button></div>
      ${x ? `<div style="margin-top:10px">${rulesBars(x, st)}</div>` : ""}</div>`;
  };
  window.tkSessionHooks = {
    saved(rec) { if (!S.btRun) { if (S.btTrades) S.btTrades.unshift(Object.assign({ session_id: null, created_at: new Date().toISOString() }, rec)); return; } (S.btTrades = S.btTrades || []).unshift(Object.assign({ session_id: S.btRun.id, created_at: new Date().toISOString() }, rec)); const b = document.getElementById("bsBand"); if (b) b.outerHTML = window.tkSessionBand(), bindBand(); },
    step(ts) {
      const r = S.btRun; if (!r) return; r.at = ts;
      const x = (S.bts || []).find(y => y.id === r.id); if (!x) return;
      const now = Date.now(); x.bars = (x.bars || 0) + 1; if (r.lastNow) x.secs = (x.secs || 0) + Math.min(120, (now - r.lastNow) / 1000); r.lastNow = now;
      const d = dayKey(now); x.study = x.study || {}; if (r.lastNow2) x.study[d] = (x.study[d] || 0) + Math.min(120, (now - r.lastNow2) / 1000); r.lastNow2 = now;
      clearTimeout(r.t); r.t = setTimeout(async () => { x.lastTs = r.at; x.updated = Date.now(); await saveSession(x); }, 1500);
    },
    bind: bindBand
  };
  async function flushRun() { const r = S.btRun; if (!r || !r.t) return; clearTimeout(r.t); r.t = null; const x = (S.bts || []).find(y => y.id === r.id); if (!x) return; if (r.at) x.lastTs = r.at; x.updated = Date.now(); await saveSession(x); }
  window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#analizar")) flushRun(); });
  window.addEventListener("pagehide", flushRun);
  function bindBand() { const e = document.getElementById("bsEnd"); if (e) e.onclick = () => { flushRun(); const m = window.TkChart && TkChart.all.find(c => c.key === "main"); if (m) m.stopBacktest(); S.btRun = null; const b = document.getElementById("bsBand"); if (b) b.remove(); toast("Sesión guardada. La retomas desde Backtesting."); }; }
  window.tkLoadSessions = loadSessions;
  window.TK_BT = { loadSessions, sessTrades, drawer, run, saveSession, hms, k };
})();

/* ======================= NOTICIAS (calendario económico) ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS, { $, $$, I, IC, norm, statCard, empty } = window.TK_X;
  const FLAG = { USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", AUD: "🇦🇺", CAD: "🇨🇦", CHF: "🇨🇭", NZD: "🇳🇿", CNY: "🇨🇳", ALL: "🌐" };
  const IMP = { High: ["Alto", 3], Medium: ["Medio", 2], Low: ["Bajo", 1], Holiday: ["Festivo", 0] };
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ""; } })();
  let loading = null;
  function loadNews(force) {
    if (!force && S.news && Date.now() - S.news.got < 20 * 60 * 1000) return Promise.resolve();
    if (loading) return loading;
    loading = sb.functions.invoke("noticias", { body: {} }).then(({ data, error }) => {
      loading = null;
      if (error || !data) { S.news = Object.assign(S.news || { events: [] }, { got: Date.now(), err: true }); return; }
      S.news = { events: (data.events || []).map(e => Object.assign(e, { ts: Date.parse(e.date) })).filter(e => isFinite(e.ts)), got: Date.now(), err: false };
    }).catch(() => { loading = null; S.news = Object.assign(S.news || { events: [] }, { got: Date.now(), err: true }); });
    return loading;
  }
  const TZS = [["", "Tu hora"], ["America/New_York", "Nueva York"], ["Europe/London", "Londres"], ["UTC", "UTC"], ["Asia/Tokyo", "Tokio"], ["Australia/Sydney", "Sídney"]];
  const tz = () => lsGet("tk-ntz", "") || undefined;
  const hm = ts => new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: tz() });
  const dK = ts => new Date(ts).toLocaleDateString("en-CA", { timeZone: tz() });
  const wkOf = k => { const d = new Date(k + "T12:00:00Z"), w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return d.toISOString().slice(0, 10); };
  const sessionOf = ts => { const h = new Date(ts).getUTCHours(); return h >= 21 ? "Sídney" : h < 7 ? "Tokio" : h < 12 ? "Londres" : h < 16 ? "Londres · NY" : "Nueva York"; };
  const numOf = v => { const m = String(v || "").trim().match(/^(-?[\d.,]+)\s*([%KMBT]?)$/i); if (!m) return null; return { n: parseFloat(m[1].replace(",", ".")), u: m[2] }; };
  const surprise = e => { const a = numOf(e.actual), f = numOf(e.forecast); if (!a || !f || a.u.toUpperCase() !== f.u.toUpperCase()) return "—"; const d = Math.round((a.n - f.n) * 1000) / 1000; return (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d).toLocaleString("es-ES", { maximumFractionDigits: 3 }) + a.u; };
  const inPlan = ts => { const p = S.plan || {}, m = minOfDate(ts), a = minOf(p.start), b = minOf(p.end); return a != null && b != null && m >= a - 15 && m <= b; };
  const until = ts => { const m = Math.round((ts - Date.now()) / 6e4); if (m < 0) return "ya ha salido"; if (m < 60) return "en " + m + " min"; const h = Math.floor(m / 60); return h < 24 ? `en ${h} h ${m % 60} min` : `en ${Math.floor(h / 24)} d ${h % 24} h`; };
  const impBadge = i => { const x = IMP[i] || ["—", 0]; return `<span class="nimp i${x[1]}" title="Impacto ${x[0].toLowerCase()}"><span class="nbars"><i></i><i></i><i></i></span>${x[0]}</span>`; };
  function nf() { return S.nf || (S.nf = { q: "", imp: { High: true, Medium: true, Low: true, Holiday: false }, cur: [], day: "week", mine: false, page: 0, per: lsGet("tk-nper", 25) }); }
  function filtered() {
    const f = nf(), E = (S.news && S.news.events) || [], q = norm(f.q), today = dK(Date.now()), tomorrow = dK(Date.now() + 864e5), wk = wkOf(today);
    const dayOk = e => { const k = dK(e.ts); return f.day === "all" ? true : f.day === "today" ? k === today : f.day === "tomorrow" ? k === tomorrow : f.day === "next" ? wkOf(k) > wk : wkOf(k) === wk; };
    return E.filter(e => f.imp[e.impact] !== false && (IMP[e.impact] ? f.imp[e.impact] : true) && (!f.cur.length || f.cur.includes(e.country)) && (!q || norm(e.title + " " + e.country).includes(q)) && dayOk(e) && (!f.mine || inPlan(e.ts)));
  }
  function tableHtml(L) {
    if (!L.length) return empty(S.news && S.news.err ? "No se pudo cargar el calendario" : "No hay noticias con estos filtros", S.news && S.news.err ? "Vuelve a intentarlo en un momento." : "Prueba a activar más niveles de impacto o divisas.");
    const f = nf(), now = Date.now(), next = L.find(e => e.ts > now), pages = Math.max(1, Math.ceil(L.length / f.per)); if (f.page >= pages) f.page = pages - 1; let lastDay = "";
    const P = L.slice(f.page * f.per, (f.page + 1) * f.per);
    return `<div class="xtablewrap"><table class="xtable ntable"><thead><tr class="xgrp"><th colspan="5"><span>Información del evento</span></th><th colspan="3"><span>Publicación</span></th><th colspan="1"><span>Comparación</span></th><th colspan="2"><span>Nota</span></th></tr><tr><th>Día</th><th>Hora</th><th>Divisa</th><th>Impacto</th><th>Evento</th><th>Real</th><th>Previsión</th><th>Anterior</th><th>Sorpresa</th><th>Sesión</th><th></th></tr></thead><tbody>
      ${P.map(e => { const d = dK(e.ts), first = d !== lastDay; lastDay = d; const past = e.ts < now - 30 * 6e4, isNext = next && e === next;
        return `<tr class="${past ? "past" : ""} ${isNext ? "next" : ""} ${first ? "dayfirst" : ""}"><td>${first ? `<b>${new Date(e.ts).toLocaleDateString("es-ES", { weekday: "short", timeZone: tz() })}</b><div class="small muted">${new Date(e.ts).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: tz() })}</div>` : ""}</td>
          <td class="mono">${/T00:00:00/.test(e.date) && e.impact === "Holiday" ? "Todo el día" : hm(e.ts)}</td><td><span class="nflag">${FLAG[e.country] || "🏳️"}</span> ${esc(e.country)}</td><td>${impBadge(e.impact)}</td>
          <td><b>${esc(e.title)}</b>${isNext ? ` <span class="xtag">Próxima · ${until(e.ts)}</span>` : ""}</td><td class="mono">${esc(e.actual || "—")}</td><td class="mono">${esc(e.forecast || "—")}</td><td class="mono">${esc(e.previous || "—")}</td><td class="mono">${esc(surprise(e))}</td><td class="small">${e.impact === "Holiday" ? "—" : sessionOf(e.ts)}</td>
          <td>${inPlan(e.ts) ? `<span class="nmine" title="Cae dentro de tu horario de operativa">${I(IC.clock, 14)} Tu horario</span>` : ""}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="xfoot"><span class="muted small">Mostrando ${L.length ? f.page * f.per + 1 : 0}–${Math.min(L.length, (f.page + 1) * f.per)} de ${L.length} eventos</span>
        <div class="xpager"><button type="button" class="xpb" data-npage="-1" ${f.page ? "" : "disabled"} aria-label="Página anterior">${I(IC.left, 16, 2)}</button><span class="xpn">${f.page + 1} / ${pages}</span><button type="button" class="xpb" data-npage="1" ${f.page < pages - 1 ? "" : "disabled"} aria-label="Página siguiente">${I(IC.right, 16, 2)}</button></div>
        <label class="small muted">Por página <select class="xsel" id="nPer">${[10, 25, 50, 100].map(n => `<option ${n === f.per ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>`;
  }
  V.noticias = {
    view() {
      if (!S.news || Date.now() - S.news.got > 20 * 60 * 1000) loadNews().then(() => { if (location.hash.startsWith("#noticias")) { S.lastView = null; render(); } });
      const f = nf(), E = (S.news && S.news.events) || [], today = dK(Date.now()), L = filtered();
      const todayE = E.filter(e => dK(e.ts) === today), hiToday = todayE.filter(e => e.impact === "High"), nextHi = E.find(e => e.impact === "High" && e.ts > Date.now());
      const curs = Array.from(new Set(E.map(e => e.country))).filter(Boolean).sort();
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Calendario económico</h1><div class="small muted">Noticias de esta semana y la siguiente · horas en ${esc(tz() ? TZS.find(x => x[0] === tz())[1] : (TZ.split("/").pop() || "tu zona").replace("_", " "))}</div></div>
          <div class="row" style="gap:8px"><label class="xtz">${I(IC.clock, 15)}<select class="xsel" id="nTz" aria-label="Zona horaria">${TZS.map(([k, l]) => `<option value="${k}" ${(tz() || "") === k ? "selected" : ""}>${k ? "Horas de " + l : "Tu hora (" + esc((TZ.split("/").pop() || "local").replace("_", " ")) + ")"}</option>`).join("")}</select></label><button type="button" class="btn2" id="nRef" style="height:38px">Actualizar</button></div></div>
        <div class="xkgrid">${statCard("Eventos esta semana", S.news ? E.length : "…", todayE.length + " hoy")}
          ${statCard("Alto impacto hoy", S.news ? hiToday.length : "…", hiToday.length ? hiToday.map(e => hm(e.ts) + " " + e.country).slice(0, 3).join(" · ") : "Día tranquilo")}
          ${statCard("Divisas", curs.length || "…", curs.slice(0, 6).join(" · "))}
          ${statCard("Próximo evento importante", nextHi ? hm(nextHi.ts) : "—", nextHi ? `${FLAG[nextHi.country] || ""} ${esc(nextHi.country)} · ${esc(nextHi.title)} · ${until(nextHi.ts)}` : "Nada de alto impacto pendiente")}</div>
        ${hiToday.some(e => inPlan(e.ts) && e.ts > Date.now() - 30 * 6e4) ? `<div class="callout">${I(IC.clock, 18)}<div><b>Hay noticias de alto impacto dentro de tu horario.</b> Evita entrar 15 minutos antes y después: el precio puede saltar tu stop sin respetar el análisis.</div></div>` : ""}
        <div class="card xcard"><div class="xtools">
          <label class="xsearch">${I(IC.search, 16)}<input id="nQ" placeholder="Buscar eventos…" value="${esc(f.q)}" aria-label="Buscar eventos"></label>
          <div class="xfil">
            <div class="pseg" role="group" aria-label="Día">${[["today", "Hoy"], ["tomorrow", "Mañana"], ["week", "Esta semana"], ["next", "Próxima"], ["all", "Todo"]].map(([k, l]) => `<button type="button" data-nday="${k}" aria-pressed="${f.day === k}">${l}</button>`).join("")}</div>
            <div class="pills" role="group" aria-label="Impacto">${Object.entries(IMP).map(([k, [l]]) => `<button type="button" data-nimp="${k}" aria-pressed="${!!f.imp[k]}">${l}</button>`).join("")}</div>
            <button type="button" class="chipb" data-nmine aria-pressed="${f.mine}">${I(IC.clock, 13)} Solo en mi horario</button>
          </div></div>
          <div class="pills ncurs" role="group" aria-label="Divisas">${curs.map(c => `<button type="button" data-ncur="${esc(c)}" aria-pressed="${f.cur.includes(c)}">${FLAG[c] || ""} ${esc(c)}</button>`).join("")}${f.cur.length ? `<button type="button" class="link small" data-ncur="">Todas</button>` : ""}</div>
          <div id="nTable">${S.news ? tableHtml(L) : `<div class="small muted" style="padding:16px">Cargando calendario…</div>`}</div>
          <div class="small muted" style="margin-top:10px">Fuente: calendario económico semanal público. Los datos «Real» aparecen cuando se publican.</div></div>
      </div>`;
    },
    bind() {
      const f = nf(), re = () => { S.lastView = null; render(); };
      const bindT = () => { $$("[data-npage]").forEach(b => b.onclick = () => { f.page += +b.dataset.npage; $("#nTable").innerHTML = tableHtml(filtered()); bindT(); }); const pp = $("#nPer"); if (pp) pp.onchange = () => { f.per = +pp.value; f.page = 0; lsSet("tk-nper", f.per); $("#nTable").innerHTML = tableHtml(filtered()); bindT(); }; };
      bindT();
      $("#nTz").onchange = e => { lsSet("tk-ntz", e.target.value); re(); };
      const q = $("#nQ"); q.oninput = () => { f.q = q.value; f.page = 0; $("#nTable").innerHTML = tableHtml(filtered()); bindT(); };
      $$("[data-nday]").forEach(b => b.onclick = () => { f.day = b.dataset.nday; f.page = 0; re(); });
      $$("[data-nimp]").forEach(b => b.onclick = () => { f.imp[b.dataset.nimp] = !f.imp[b.dataset.nimp]; re(); });
      $$("[data-ncur]").forEach(b => b.onclick = () => { const c = b.dataset.ncur; if (!c) f.cur = []; else f.cur = f.cur.includes(c) ? f.cur.filter(x => x !== c) : f.cur.concat([c]); re(); });
      const m = $("[data-nmine]"); m.onclick = () => { f.mine = !f.mine; re(); };
      $("#nRef").onclick = () => loadNews(true).then(re);
    }
  };
  /* aviso en Hoy */
  window.tkNewsToday = function () {
    if (!S.news) { loadNews().then(() => { if (!location.hash || location.hash === "#hoy") { S.lastView = null; render(); } }); return ""; }
    const today = todayKey(), L = (S.news.events || []).filter(e => dayKey(e.ts) === today && e.impact === "High" && e.ts > Date.now() - 30 * 6e4);
    if (!L.length) return `<a class="card newsmini" href="#noticias"><div class="row" style="gap:8px">${I(IC.clock, 17)}<b style="font-size:14px">Noticias fuertes hoy</b></div><div class="small muted">Hoy no hay noticias de alto impacto.</div></a>`;
    const mine = L.filter(e => inPlan(e.ts));
    return `<a class="card newsmini ${mine.length ? "warn" : ""}" href="#noticias"><div class="row" style="gap:8px">${I(IC.clock, 17)}<b style="font-size:14px">Noticias fuertes hoy</b></div>${L.slice(0, 3).map(e => `<div class="between small"><span>${FLAG[e.country] || ""} ${esc(e.country)} · ${esc(e.title)}</span><b class="mono">${hm(e.ts)}</b></div>`).join("")}${mine.length ? `<div class="small" style="color:var(--ambarT)">${mine.length === 1 ? "Una cae" : mine.length + " caen"} en tu horario: no entres 15 min antes ni después.</div>` : ""}</a>`;
  };
  window.tkLoadNews = loadNews;
})();

/* ======================= ASISTENTE ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS, { $, $$, I, IC, norm, closed } = window.TK_X;
  const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const SUG = ["¿Cómo voy esta semana?", "¿A qué hora opero mejor?", "¿Qué día de la semana me va peor?", "¿Cuál es mi mejor mercado?", "¿Qué norma rompo más?", "¿Qué hago después de una pérdida?", "¿Qué emoción me cuesta más?", "¿Opero demasiado?", "¿Compras o ventas?", "¿Cómo va mi backtesting?"];
  const groupBy = (L, f) => { const g = {}; L.forEach(t => { const k = f(t); (g[k] = g[k] || []).push(t); }); return Object.entries(g).map(([k, l]) => ({ k, l, st: tradeStats(l) })); };
  const pick = (G, min, cmp) => G.filter(x => x.st.n >= min).sort(cmp)[0];
  const li = s => `<li>${s}</li>`;
  function answer(raw) {
    const q = norm(raw), C = closed(S.trades);
    if (!C.length && !/backtest|simulad|practica/.test(q)) return `Aún no tienes operaciones cerradas${selAcct() ? " en esta cuenta" : ""}. Cuando conectes MetaTrader 5 y operes, podré responderte con tus números.`;
    const has = (...w) => w.some(x => q.includes(x));
    if (has("hora", "horario", "momento")) {
      const G = groupBy(C, t => new Date(t.open_time).getHours()), b = pick(G, 2, (a, c) => c.st.exp - a.st.exp), w = pick(G, 2, (a, c) => a.st.exp - c.st.exp);
      if (!b) return "Necesito al menos dos operaciones en una misma hora para compararlas.";
      return `Tu mejor hora es entre las <b>${b.k}:00 y las ${+b.k + 1}:00</b>: ${fmtV(b.st.exp, b.st.mexp)} por operación en ${b.st.n} operaciones (${num(b.st.win, 0)} % de acierto).${w && w.k !== b.k ? ` La que peor te va: <b>${w.k}:00</b>, con ${fmtV(w.st.exp, w.st.mexp)} por operación.` : ""}<ul>${li(`Tu horario del plan es ${esc(S.plan.start)}–${esc(S.plan.end)}.`)}${w && w.st.exp < 0 ? li(`Si esa hora está dentro de tu horario, plantéate quitarla desde mañana.`) : ""}</ul>`;
    }
    if (has("dia de la semana", "que dia", "lunes", "viernes", "dias")) {
      const G = groupBy(C, t => new Date(t.open_time).getDay()), b = pick(G, 2, (a, c) => c.st.exp - a.st.exp), w = pick(G, 2, (a, c) => a.st.exp - c.st.exp);
      if (!b) return "Todavía hay pocas operaciones por día de la semana para compararlos.";
      return `Te va mejor el <b>${DAYS[b.k]}</b> (${fmtV(b.st.exp, b.st.mexp)} por operación, ${b.st.n} op.) y peor el <b>${DAYS[w.k]}</b> (${fmtV(w.st.exp, w.st.mexp)} por operación, ${w.st.n} op.).`;
    }
    if (has("mercado", "simbolo", "par", "activo", "instrumento")) {
      const G = groupBy(C, t => t.symbol), b = pick(G, 2, (a, c) => c.st.tot - a.st.tot), w = pick(G, 2, (a, c) => a.st.tot - c.st.tot);
      if (!b) return "Necesito al menos dos operaciones por mercado para compararlos.";
      return `Tu mejor mercado es <b>${esc(b.k)}</b>: ${fmtV(b.st.tot, b.st.mt)} en ${b.st.n} operaciones.${w && w.k !== b.k ? ` El que más te cuesta es <b>${esc(w.k)}</b>: ${fmtV(w.st.tot, w.st.mt)} en ${w.st.n}.` : ""}`;
    }
    if (has("norma", "regla", "plan", "cumplo", "disciplina")) {
      const ev = C.map(evaluate), good = ev.filter(e => e.good).length, fails = {};
      ev.forEach(e => e.fail.forEach(f => fails[f.bad] = (fails[f.bad] || 0) + 1));
      const top = Object.entries(fails).sort((a, b) => b[1] - a[1])[0];
      return `Has cumplido tu plan en <b>${good} de ${C.length}</b> operaciones (${num(good / C.length * 100, 0)} %).${top ? ` La norma que más rompes: <b>${esc(top[0])}</b> (${top[1]} ${top[1] === 1 ? "vez" : "veces"}). Trabaja solo esa esta semana.` : " No rompes ninguna norma. Sigue así."}`;
    }
    if (has("perdida", "pierdo", "venganza", "recuperar", "despues")) {
      const S2 = C.slice().sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), after = [];
      for (let i = 1; i < S2.length; i++) if (S2[i - 1].r < 0 && dayKey(S2[i - 1].open_time) === dayKey(S2[i].open_time)) after.push(S2[i]);
      if (after.length < 2) return "Aún no hay suficientes operaciones justo después de una pérdida (el mismo día) para sacar conclusiones.";
      const st = tradeStats(after), all = tradeStats(C), gp = after.filter(t => evaluate(t).good).length / after.length * 100;
      return `Después de una pérdida, el mismo día, has hecho <b>${after.length}</b> operaciones: ${fmtV(st.exp, st.mexp)} por operación frente a ${fmtV(all.exp, all.mexp)} de tu media, y cumples el plan el ${num(gp, 0)} % de las veces.${st.exp < all.exp ? " <b>Te va peor tras perder.</b> Prueba la regla: tras una pérdida, cinco minutos fuera de la pantalla." : " Gestionas bien las pérdidas."}`;
    }
    if (has("emocion", "siento", "sentia", "miedo", "ansiedad", "fomo")) {
      if (!(S.consents && S.consents.health)) return `Para responder sobre emociones tienes que activar el permiso en <a href="#ajustes">Ajustes → Permisos</a> y anotar cómo te sentías en cada operación.`;
      const G = groupBy(C.filter(t => (t.review || {}).feel), t => t.review.feel), w = pick(G, 2, (a, c) => a.st.tot - c.st.tot), b = pick(G, 2, (a, c) => c.st.exp - a.st.exp);
      if (!w) return `Anota tu emoción en más operaciones (te lo pongo fácil en <a href="#emociones">Emociones</a>) y podré compararlas.`;
      return `La emoción que más te cuesta es <b>${esc(w.k.toLowerCase())}</b>: ${fmtV(w.st.tot, w.st.mt)} en ${w.st.n} operaciones.${b && b.k !== w.k ? ` La que mejor te va: <b>${esc(b.k.toLowerCase())}</b>, ${fmtV(b.st.exp, b.st.mexp)} por operación.` : ""}`;
    }
    if (has("demasiad", "sobreoper", "cuantas", "numero de operaciones")) {
      const G = groupBy(C, t => dayKey(t.open_time)), over = G.filter(g => g.l.length > S.plan.maxTrades), ok = G.filter(g => g.l.length <= S.plan.maxTrades);
      const so = tradeStats(over.flatMap(g => g.l)), sk = tradeStats(ok.flatMap(g => g.l));
      return over.length ? `Has pasado tu máximo de ${S.plan.maxTrades} operaciones en <b>${over.length} de ${G.length}</b> días. Esos días: ${fmtV(so.exp, so.mexp)} por operación; el resto: ${fmtV(sk.exp, sk.mexp)}.` : `No has pasado tu máximo de ${S.plan.maxTrades} operaciones ningún día. Bien.`;
    }
    if (has("compra", "venta", "largo", "corto", "direccion")) {
      const b = tradeStats(C.filter(t => t.side === "buy")), s = tradeStats(C.filter(t => t.side === "sell"));
      return `Compras: ${b.n} op., ${b.n ? fmtV(b.tot, b.mt) + " (" + num(b.win, 0) + " % de acierto)" : "—"}. Ventas: ${s.n} op., ${s.n ? fmtV(s.tot, s.mt) + " (" + num(s.win, 0) + " % de acierto)" : "—"}.`;
    }
    if (has("backtest", "simulad", "practica", "sesion")) {
      const L = (S.btTrades || []);
      if (!S.btLoaded) { if (window.tkLoadSessions) tkLoadSessions(); return "Estoy cargando tus sesiones de backtesting. Pregúntamelo otra vez en un momento."; }
      if (!L.length) return `Aún no tienes operaciones simuladas en sesiones. Crea una en <a href="#backtest">Backtesting</a>.`;
      const st = tradeStats(L.map(t => ({ r: +t.r, status: "closed", open_time: t.exit_time })));
      return `En tus sesiones de backtesting llevas <b>${st.n}</b> operaciones simuladas: ${fmtV(st.tot, st.mt)}, ${num(st.win, 0)} % de acierto y una caída máxima de ${fmtV(st.dd, st.mdd)}.`;
    }
    // resumen (semana por defecto, mes si se pide)
    const month = has("mes"), from = new Date(); from.setHours(0, 0, 0, 0); if (month) from.setDate(1); else from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    const L = C.filter(t => new Date(t.open_time) >= from), st = tradeStats(L), good = L.filter(t => evaluate(t).good).length;
    if (!has("semana", "mes", "resumen", "como voy", "como va")) {
      return `No he entendido la pregunta. Puedo responderte sobre esto:<ul>${SUG.map(s => li(`<button type="button" class="link" data-ask="${esc(s)}">${esc(s)}</button>`)).join("")}</ul>`;
    }
    if (!L.length) return `${month ? "Este mes" : "Esta semana"} aún no has cerrado operaciones.`;
    return `${month ? "Este mes" : "Esta semana"}: <b>${st.n}</b> operaciones, <b>${fmtV(st.tot, st.mt)}</b>, ${num(st.win, 0)} % de acierto y <b>${good} de ${st.n}</b> dentro del plan.${st.dd < 0 ? ` Peor caída: ${fmtV(st.dd, st.mdd)}.` : ""}`;
  }
  const CMDS = [["semana", "Cómo voy esta semana", "¿Cómo voy esta semana?"], ["mes", "Resumen del mes", "Resumen del mes"], ["hora", "Mi mejor hora", "¿A qué hora opero mejor?"], ["dia", "Mejor y peor día", "¿Qué día de la semana me va peor?"], ["mercado", "Mi mejor mercado", "¿Cuál es mi mejor mercado?"], ["normas", "Qué norma rompo más", "¿Qué norma rompo más?"], ["perdida", "Después de una pérdida", "¿Qué hago después de una pérdida?"], ["emocion", "La emoción que más me cuesta", "¿Qué emoción me cuesta más?"], ["sobreoperar", "¿Opero demasiado?", "¿Opero demasiado?"], ["direccion", "Compras o ventas", "¿Compras o ventas?"], ["backtesting", "Mi backtesting", "¿Cómo va mi backtesting?"]];
  const chats = () => lsGet("tk-chats", []), saveChats = L => lsSet("tk-chats", L.slice(0, 30));
  const curChat = () => { const L = chats(); return L.find(c => c.id === S.chatId) || null; };
  V.asistente = {
    view() {
      const c = curChat(), th = c ? c.msgs : [], L = chats();
      return `<div class="aslay">
        <aside class="asside"><button type="button" class="btn2" id="asNewC" style="height:38px;width:100%;justify-content:flex-start">${I(IC.plus, 16, 2)} Nuevo chat</button>
          <div class="lbl" style="margin:14px 4px 6px">Chats</div>
          ${L.length ? `<div class="aschats">${L.map(x => `<div class="aschat ${c && c.id === x.id ? "on" : ""}"><button type="button" data-chat="${esc(x.id)}">${esc(x.title)}</button><button type="button" class="xib" data-chatdel="${esc(x.id)}" aria-label="Borrar chat" title="Borrar chat">${I(IC.x, 13, 2)}</button></div>`).join("")}</div>` : `<div class="small muted" style="padding:0 4px">Aún no hay conversaciones.</div>`}
          <div class="small muted" style="margin-top:auto;padding:12px 4px 0">Los chats se guardan solo en este dispositivo.</div></aside>
        <div class="aswrap ${th.length ? "has" : ""}">
        ${th.length ? "" : `<div class="ashead"><span class="asorb">${SVG('<path d="M10 2.5l1.6 3.7 3.7 1.6-3.7 1.6L10 13.1 8.4 9.4 4.7 7.8l3.7-1.6z"/><path d="M15.5 12.5l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z"/>', 26)}</span>
          <h1><span class="muted" style="font-weight:600">Hola, ${esc((S.name || "").split(" ")[0])}.</span><br>¿En qué puedo ayudarte hoy?</h1><p class="muted">Respondo con tus operaciones${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""}, en R.</p></div>`}
        <div class="asthread" id="asT" aria-live="polite">${th.map(m => `<div class="asmsg ${m.me ? "me" : ""}">${m.me ? esc(m.t) : m.t}</div>`).join("")}</div>
        <form class="asbox" id="asF"><div class="ascmd" id="asCmd" hidden role="listbox" aria-label="Comandos"></div><textarea id="asQ" rows="1" placeholder="Pregunta sobre tus operaciones, o escribe / para comandos" aria-label="Pregunta"></textarea><button type="submit" class="btn" style="height:40px;width:40px;padding:0" aria-label="Enviar">${I(IC.send, 18)}</button></form>
        <div class="assug">${SUG.slice(0, 6).map(s => `<button type="button" class="chipb" data-ask="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="small muted" style="text-align:center">Las respuestas salen de tus datos guardados en Tickora; no es una IA externa y no da consejos de inversión.</div>
      </div></div>`;
    },
    bind() {
      const f = $("#asF"), q = $("#asQ"), T = $("#asT"), cm = $("#asCmd");
      const re = () => { S.lastView = null; render(); setTimeout(() => { const n = $("#asQ"); n && n.focus(); const t = $("#asT"); t && t.lastElementChild && t.lastElementChild.scrollIntoView({ block: "nearest" }); }, 0); };
      const ask = text => {
        text = String(text || "").trim(); if (!text) return;
        const L = chats(); let c = L.find(x => x.id === S.chatId);
        if (!c) { c = { id: "c" + Date.now().toString(36), title: text.slice(0, 48), msgs: [], ts: Date.now() }; L.unshift(c); S.chatId = c.id; }
        c.msgs.push({ me: true, t: text }, { me: false, t: answer(text) }); c.msgs = c.msgs.slice(-40); c.ts = Date.now();
        saveChats([c].concat(L.filter(x => x.id !== c.id))); re();
      };
      let ci = 0, CL = [];
      const paintCmd = () => { cm.innerHTML = CL.map((x, i) => `<button type="button" role="option" data-cmd="${x[0]}" aria-selected="${i === ci}"><span class="mono">/${x[0]}</span> ${esc(x[1])}</button>`).join(""); };
      const checkCmd = () => { const m = q.value.match(/^\/(\w*)$/); if (!m) { cm.hidden = true; return; } CL = CMDS.filter(x => x[0].startsWith(norm(m[1]))); if (!CL.length) { cm.hidden = true; return; } ci = 0; paintCmd(); cm.hidden = false; };
      const runCmd = k => { const c = CMDS.find(x => x[0] === k); cm.hidden = true; q.value = ""; if (c) ask(c[2]); };
      if (S.asPrefill) { const pf = S.asPrefill; S.asPrefill = null; S.chatId = null; setTimeout(() => ask(pf), 0); }
      cm.addEventListener("mousedown", e => { const b = e.target.closest("[data-cmd]"); if (b) { e.preventDefault(); runCmd(b.dataset.cmd); } });
      const bindAsk = () => $$("[data-ask]").forEach(b => b.onclick = () => ask(b.dataset.ask));
      f.onsubmit = e => { e.preventDefault(); const m = q.value.trim().match(/^\/(\w+)$/); if (m && CMDS.some(x => x[0] === norm(m[1]))) return runCmd(norm(m[1])); ask(q.value); };
      q.onkeydown = e => {
        if (!cm.hidden) { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); ci = (ci + (e.key === "ArrowDown" ? 1 : -1) + CL.length) % CL.length; paintCmd(); return; } if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); runCmd(CL[ci][0]); return; } if (e.key === "Escape") { cm.hidden = true; return; } }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); f.onsubmit(e); }
      };
      q.oninput = () => { q.style.height = "auto"; q.style.height = Math.min(160, q.scrollHeight) + "px"; checkCmd(); };
      $("#asNewC").onclick = () => { S.chatId = null; re(); };
      $$("[data-chat]").forEach(b => b.onclick = () => { S.chatId = b.dataset.chat; re(); });
      $$("[data-chatdel]").forEach(b => b.onclick = () => { saveChats(chats().filter(x => x.id !== b.dataset.chatdel)); if (S.chatId === b.dataset.chatdel) S.chatId = null; re(); });
      bindAsk();
      if (T.lastElementChild) T.lastElementChild.scrollIntoView({ block: "nearest" });
    }
  };
})();
