/* Tickora · secciones nuevas: historial, emociones, diario, backtesting, noticias y asistente.
   Usa las utilidades de la página principal (S, sb, esc, fmtR, evaluate, tradeStats…). */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
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
  const HCOLS = [
    ["open_time", "Fecha"], ["symbol", "Símbolo"], ["account", "Cuenta"], ["side", "Dirección"], ["status", "Estado"], ["r", "Resultado"],
    ["risk_pct", "Riesgo"], ["open_price", "Entrada"], ["close_price", "Salida"], ["sl", "Stop"], ["tp", "Objetivo"], ["dur", "Duración"], ["plan", "Plan"], ["feel", "Emoción"]
  ];
  function histState() { return S.hist || (S.hist = { q: "", from: "", to: "", side: "", st: "", plan: "", sort: "open_time", dir: -1, page: 0, per: lsGet("tk-hist-per", 25) }); }
  function histRows() {
    const h = histState(), q = norm(h.q);
    let L = S.trades.filter(t => t.open_time);
    if (q) L = L.filter(t => norm([t.symbol, t.account, acctLabel(t.account), t.broker, (t.review || {}).why, (t.review || {}).feel].join(" ")).includes(q));
    if (h.from) L = L.filter(t => dayKey(t.open_time) >= h.from);
    if (h.to) L = L.filter(t => dayKey(t.open_time) <= h.to);
    if (h.side) L = L.filter(t => t.side === h.side);
    if (h.st) L = L.filter(t => (t.status === "closed" ? "closed" : "open") === h.st);
    if (h.plan) L = L.filter(t => t.status === "closed" && (evaluate(t).good ? "in" : "out") === h.plan);
    const key = t => h.sort === "dur" ? (t.close_time ? new Date(t.close_time) - new Date(t.open_time) : -1) : h.sort === "plan" ? (t.status === "closed" ? (evaluate(t).good ? 1 : 0) : -1) : h.sort === "feel" ? ((t.review || {}).feel || "") : h.sort === "open_time" ? new Date(t.open_time).getTime() : t[h.sort];
    L.sort((a, b) => { const x = key(a), y = key(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * h.dir; });
    return L;
  }
  function histCards(L) {
    const st = tradeStats(L), pf = st.pf == null ? "—" : st.pf === Infinity ? "∞" : num(st.pf, 2), wl = st.avgW != null && st.avgL ? num(Math.abs(st.avgW / st.avgL), 2) : "—";
    return `<div class="xkgrid">${statCard("Resultado", st.n ? fmtR(st.tot) : "0,0 R", st.n + " operaciones cerradas", spark(st.curve, 96, 40), "Suma de todas las operaciones filtradas, en R")}
      ${statCard("Factor de beneficio", pf, "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)), "Por encima de 1 ganas más de lo que pierdes")}
      ${statCard("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", st.n ? closed(L).filter(t => t.r > 0).length + " de " + st.n : "", ring(st.win))}
      ${statCard("Ganancia / pérdida media", wl, st.avgW != null ? fmtR(st.avgW) + " / " + (st.avgL != null ? fmtR(st.avgL) : "—") : "", "", "Cuánto ganas de media en las ganadoras frente a lo que pierdes en las perdedoras")}</div>`;
  }
  function histTable(L) {
    const h = histState(), pages = Math.max(1, Math.ceil(L.length / h.per)); if (h.page >= pages) h.page = pages - 1;
    const rows = L.slice(h.page * h.per, (h.page + 1) * h.per), health = healthOk();
    const cols = HCOLS.filter(c => c[0] !== "feel" || health);
    const cell = (t, k) => {
      const ev = t.status === "closed" ? evaluate(t) : null;
      switch (k) {
        case "open_time": return `<td class="mono">${fmtDT(t.open_time)}</td>`;
        case "symbol": return `<td><b>${esc(t.symbol)}</b></td>`;
        case "account": return `<td class="muted">${esc(acctLabel(t.account))}</td>`;
        case "side": return `<td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td>`;
        case "status": return `<td>${t.status === "closed" ? "Cerrada" : `<span class="xtag">Abierta</span>`}</td>`;
        case "r": return `<td class="mono"><b>${t.status === "closed" ? fmtR(t.r) : "—"}</b></td>`;
        case "risk_pct": return `<td class="mono">${t.risk_pct != null ? fmtPct(t.risk_pct) : "—"}</td>`;
        case "open_price": case "close_price": case "sl": case "tp": return `<td class="mono">${px(t[k])}</td>`;
        case "dur": return `<td class="mono">${dur(t.open_time, t.close_time)}</td>`;
        case "plan": return `<td>${ev ? (ev.good ? `<span class="xok">${I(IC.check, 14, 2.4)} Dentro</span>` : `<span class="xbad">${ev.fail.length} norma${ev.fail.length > 1 ? "s" : ""}</span>`) : "—"}</td>`;
        case "feel": return `<td>${(t.review || {}).feel ? esc(t.review.feel) : `<span class="muted">—</span>`}</td>`;
      }
      return "<td></td>";
    };
    return `<div class="xtablewrap"><table class="xtable"><thead><tr>${cols.map(([k, l]) => `<th><button type="button" data-hsort="${k}" class="${h.sort === k ? "on" : ""}">${l}${h.sort === k ? (h.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead>
      <tbody>${rows.length ? rows.map(t => `<tr data-hop="${esc(t.id)}" tabindex="0">${cols.map(([k]) => cell(t, k)).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}">${empty(S.trades.length ? "Ninguna operación con estos filtros" : "Aún no hay operaciones", S.trades.length ? "Prueba a quitar algún filtro." : "Conecta MetaTrader 5 en Mi plan y aparecerán solas.", S.trades.length ? "" : `<a class="btn" href="#plan" style="height:38px">Conectar MT5</a>`)}</td></tr>`}</tbody></table></div>
      <div class="xfoot"><span class="muted small">Mostrando ${L.length ? h.page * h.per + 1 : 0}–${Math.min(L.length, (h.page + 1) * h.per)} de ${L.length} operaciones</span>
        <div class="xpager"><button type="button" class="xpb" data-hpage="-1" ${h.page ? "" : "disabled"} aria-label="Página anterior">${I(IC.left, 16, 2)}</button><span class="xpn">${h.page + 1} / ${pages}</span><button type="button" class="xpb" data-hpage="1" ${h.page < pages - 1 ? "" : "disabled"} aria-label="Página siguiente">${I(IC.right, 16, 2)}</button></div>
        <label class="small muted">Filas <select class="xsel" id="hPer">${[10, 25, 50, 100].map(n => `<option ${n === h.per ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>`;
  }
  V.historial = {
    view() {
      const h = histState(), L = histRows();
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Historial</h1><div class="small muted">Todas tus operaciones${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""}, en una tabla que puedes filtrar y ordenar</div></div><button type="button" class="btn2" id="hCsv" style="height:38px">${I(IC.down, 16)} Exportar CSV</button></div>
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
              <button type="button" class="link small" id="hReset">Quitar filtros</button>
            </div>
          </div>
          <div id="hTable">${histTable(L)}</div>
        </div></div>`;
    },
    bind() {
      const h = histState();
      const paint = () => { const L = histRows(); $("#hCards").innerHTML = histCards(L); $("#hTable").innerHTML = histTable(L); bindTable(); };
      const bindTable = () => {
        $$("[data-hsort]").forEach(b => b.onclick = () => { const k = b.dataset.hsort; if (h.sort === k) h.dir = -h.dir; else { h.sort = k; h.dir = k === "symbol" || k === "account" ? 1 : -1; } paint(); });
        $$("[data-hpage]").forEach(b => b.onclick = () => { h.page += +b.dataset.hpage; paint(); });
        $$("[data-hop]").forEach(tr => { tr.onclick = () => location.hash = "#op/" + encodeURIComponent(tr.dataset.hop); tr.onkeydown = e => { if (e.key === "Enter") tr.click(); }; });
        const per = $("#hPer"); if (per) per.onchange = () => { h.per = +per.value; h.page = 0; lsSet("tk-hist-per", h.per); paint(); };
      };
      const on = (id, k) => { const x = $(id); x.oninput = x.onchange = () => { h[k] = x.value; h.page = 0; paint(); }; };
      on("#hQ", "q"); on("#hFrom", "from"); on("#hTo", "to"); on("#hSide", "side"); on("#hSt", "st"); on("#hPlan", "plan");
      $("#hReset").onclick = () => { Object.assign(h, { q: "", from: "", to: "", side: "", st: "", plan: "", page: 0 }); S.lastView = null; render(); };
      $("#hCsv").onclick = () => {
        const L = histRows(), q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
        const head = ["Fecha entrada", "Fecha salida", "Símbolo", "Cuenta", "Dirección", "Estado", "R", "Riesgo %", "Entrada", "Salida", "Stop", "Objetivo", "Dentro del plan"].concat(healthOk() ? ["Emoción", "Intensidad"] : []);
        const rows = L.map(t => [t.open_time, t.close_time, t.symbol, acctLabel(t.account), t.side === "buy" ? "Compra" : "Venta", t.status === "closed" ? "Cerrada" : "Abierta", t.r, t.risk_pct, t.open_price, t.close_price, t.sl, t.tp, t.status === "closed" ? (evaluate(t).good ? "Sí" : "No") : ""].concat(healthOk() ? [(t.review || {}).feel, (t.review || {}).int] : []));
        download("tickora-historial-" + todayKey() + ".csv", "﻿" + [head].concat(rows).map(r => r.map(q).join(";")).join("\n"));
      };
      bindTable();
    }
  };

  /* ======================= EMOCIONES ======================= */
  function emoStats(L) {
    const by = {};
    closed(L).forEach(t => { const f = (t.review || {}).feel; if (!f) return; const o = by[f] || (by[f] = { f, n: 0, sum: 0, win: 0, int: 0, ni: 0, good: 0 }); o.n++; o.sum += t.r; if (t.r > 0) o.win++; if ((t.review || {}).int) { o.int += t.review.int; o.ni++; } if (evaluate(t).good) o.good++; });
    return Object.values(by).map(o => Object.assign(o, { avg: o.sum / o.n, wr: o.win / o.n * 100, ai: o.ni ? o.int / o.ni : null, gp: o.good / o.n * 100 }));
  }
  function emoBars(E) {
    if (!E.length) return empty("Aún no hay emociones anotadas", "Anota cómo te sentías en cada operación (abajo tienes las últimas) y aquí verás cuáles te ayudan y cuáles te cuestan.");
    const mx = Math.max(0.5, ...E.map(e => Math.abs(e.avg))), sorted = E.slice().sort((a, b) => b.avg - a.avg);
    return `<div class="xbars" role="img" aria-label="Resultado medio por emoción">${sorted.map(e => { const w = Math.abs(e.avg) / mx * 50; return `<div class="xbar"><span class="xbar-l">${esc(e.f)}</span><div class="xbar-t"><span class="xbar-z"></span><i class="${e.avg < 0 ? "neg" : ""}" style="${e.avg < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}"></i></div><span class="xbar-v mono">${fmtR(e.avg)}</span><span class="xbar-n muted">${e.n} op.</span></div>`; }).join("")}</div>`;
  }
  V.emociones = {
    view() {
      if (!healthOk()) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Emociones</h1><div class="small muted">Qué emociones te ayudan y cuáles te cuestan</div></div></div>
        <div class="card stack" style="gap:10px;max-width:640px"><b>Necesitamos tu permiso para guardar cómo te sientes</b><span class="small muted">Las emociones son datos sensibles. Solo se guardan si lo activas, solo los ves tú y puedes retirarlo cuando quieras.</span><a class="btn" href="#plan" style="align-self:flex-start;height:40px">Activar en Mi plan → Permisos</a></div></div>`;
      const per = S.emoPer || "all", from = per === "all" ? null : Date.now() - (+per) * 864e5;
      const L = S.trades.filter(t => !from || new Date(t.open_time) >= from), E = emoStats(L), C = closed(L);
      const ok = E.filter(e => e.n >= 2), best = ok.slice().sort((a, b) => b.avg - a.avg)[0], worst = ok.slice().sort((a, b) => a.sum - b.sum)[0], freq = E.slice().sort((a, b) => b.n - a.n)[0];
      const tagged = C.filter(t => (t.review || {}).feel).length, untag = S.trades.filter(t => t.status === "closed" && !(t.review || {}).feel).sort((a, b) => new Date(b.open_time) - new Date(a.open_time)).slice(0, 5);
      const insight = worst && worst.avg < 0 ? `Cuando operas <b>${esc(worst.f.toLowerCase())}</b>, cumples el plan el ${num(worst.gp, 0)} % de las veces y pierdes ${fmtR(worst.avg)} de media. La próxima vez que lo notes, para cinco minutos antes de entrar.` : best ? `Tu mejor estado es <b>${esc(best.f.toLowerCase())}</b>: ${fmtR(best.avg)} de media y ${num(best.gp, 0)} % dentro del plan. Fíjate en qué haces esos días.` : "";
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Emociones</h1><div class="small muted">Qué emociones te ayudan y cuáles te cuestan · ${tagged} de ${C.length} operaciones anotadas</div></div>
          <div class="pseg" role="group" aria-label="Periodo">${[["30", "30 días"], ["90", "90 días"], ["all", "Todo"]].map(([k, l]) => `<button type="button" data-eper="${k}" aria-pressed="${per === k}">${l}</button>`).join("")}</div></div>
        <div class="xkgrid x3">${statCard("La emoción más rentable", best ? esc(best.f) : "—", best ? fmtR(best.avg) + " por operación · " + best.n + " op." : "Necesita 2 operaciones o más")}
          ${statCard("La emoción que más te cuesta", worst && worst.sum < 0 ? esc(worst.f) : "—", worst && worst.sum < 0 ? fmtR(worst.sum) + " en total · " + worst.n + " op." : "Nada en negativo")}
          ${statCard("La más frecuente", freq ? esc(freq.f) : "—", freq ? freq.n + " de " + tagged + " operaciones anotadas" : "")}</div>
        ${insight ? `<div class="card xinsight">${I('<path d="M10 2.5a5.5 5.5 0 00-3.2 10l.2 2.5h6l.2-2.5A5.5 5.5 0 0010 2.5zM7.5 17.5h5"/>', 20)}<div>${insight}</div></div>` : ""}
        <div class="card stack" style="gap:12px"><div class="between"><h2 class="h2b">Resultado medio por emoción</h2><span class="small muted">en R por operación</span></div>${emoBars(E)}</div>
        <div class="card stack" style="gap:10px"><h2 class="h2b">Desglose</h2>
          <div class="xtablewrap"><table class="xtable"><thead><tr><th>Emoción</th><th>Registros</th><th>Intensidad media</th><th>Acierto</th><th>Dentro del plan</th><th>R total</th><th>R por operación</th></tr></thead><tbody>
          ${E.length ? E.sort((a, b) => b.n - a.n).map(e => `<tr><td><b>${esc(e.f)}</b></td><td class="mono">${e.n}</td><td class="mono">${e.ai == null ? "—" : num(e.ai, 1) + " / 5"}</td><td class="mono">${num(e.wr, 0)} %</td><td class="mono">${num(e.gp, 0)} %</td><td class="mono"><b>${fmtR(e.sum)}</b></td><td class="mono">${fmtR(e.avg)}</td></tr>`).join("") : `<tr><td colspan="7" class="muted" style="padding:16px">Sin datos todavía.</td></tr>`}
          </tbody></table></div></div>
        ${untag.length ? `<div class="card stack" style="gap:12px"><div class="between"><h2 class="h2b">Sin anotar</h2><span class="small muted">toca cómo te sentías al entrar</span></div>
          ${untag.map(t => `<div class="xtagrow" data-tid="${esc(t.id)}"><div class="xtagrow-h"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"} · ${fmtDT(t.open_time)} · <span class="mono">${fmtR(t.r)}</span></div><div class="row" style="gap:6px;flex-wrap:wrap">${FEELS.map(f => `<button type="button" class="chip" data-qfeel="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>`).join("")}</div>` : ""}
      </div>`;
    },
    bind() {
      $$("[data-eper]").forEach(b => b.onclick = () => { S.emoPer = b.dataset.eper; S.lastView = null; render(); });
      $$("[data-qfeel]").forEach(b => b.onclick = async () => {
        const row = b.closest("[data-tid]"), t = S.allTrades.find(x => x.id === row.dataset.tid); if (!t) return;
        t.review = Object.assign({}, t.review || {}, { feel: b.dataset.qfeel });
        const { error } = await sb.from("trades").update({ review: t.review }).eq("id", t.id);
        if (error) { toast("No se pudo guardar"); return; }
        toast("Anotado: " + b.dataset.qfeel); S.lastView = null; render();
      });
    }
  };

  window.TK_X = { $, $$, I, IC, norm, closed, fmtDT, fmtD, statCard, empty, ring, download, healthOk };
})();

/* ======================= DIARIO ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
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
  const CATS = [["todo", "Todo"], ["plan", "Planificación"], ["rev", "Revisión"], ["mente", "Mentalidad"], ["anal", "Análisis"]];
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
          const keep = (c.tagName === "A" && k === "href" && /^(https?:|#)/i.test(v)) || (c.tagName === "IMG" && (k === "src" && /^(data:image\/(png|jpe?g|webp|gif);base64,|https:)/i.test(v) || k === "alt")) || (k === "class" && /^(todo|done)$/.test(v)) || (k === "data-done" && c.tagName === "LI");
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
    return `<a class="pgcard" href="#diario/${encodeURIComponent(p.id)}"><span class="pgcover" style="background:${COVERS[p.cover] || COVERS.cobalto}"></span><span class="pgbody"><b>${esc(p.title || "Sin título")}</b><small>${esc(txt(p.html).slice(0, 90)) || "Página vacía"}</small><span class="pgdate">Editada ${new Date(p.updated).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></span></a>`;
  }
  /* -------- lista -------- */
  function listView() {
    const q = norm(S.pgQ || ""), L = pages().filter(p => !q || norm(p.title + " " + txt(p.html)).includes(q));
    return `<div class="stack" style="gap:20px">
      <div class="pghero"><div class="pghero-in"><h1>${greet()}, ${esc((S.name || "").split(" ")[0])}</h1><label class="pgsearch">${I(IC.search, 17)}<input id="pgQ" placeholder="Buscar en tu diario" value="${esc(S.pgQ || "")}" aria-label="Buscar en tu diario"></label></div></div>
      <div class="between"><h2 class="h2b">Mis páginas</h2><span class="small muted">${(S.pages || []).length} página${(S.pages || []).length === 1 ? "" : "s"}</span></div>
      <div class="pggrid"><button type="button" class="pgcard pgnew" id="pgNew"><span class="pgplus">${I(IC.plus, 22, 2)}</span><span class="pgbody"><b>Nueva página</b><small>En blanco o desde una plantilla</small></span></button>${L.map(pageCard).join("")}</div>
      ${!S.pagesLoaded ? `<div class="small muted">Cargando tus páginas…</div>` : !L.length && q ? `<div class="small muted">Nada coincide con «${esc(S.pgQ)}».</div>` : ""}
    </div>`;
  }
  /* -------- plantillas -------- */
  function tplModal(onUse) {
    const T = TPL(); let cat = "todo", sel = T[0].id, q = "";
    const box = document.createElement("div"); box.className = "xmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Plantillas");
    const paint = () => {
      const t = T.find(x => x.id === sel), L = T.filter(x => (cat === "todo" || x.cat === cat) && (!q || norm(x.title + " " + x.desc).includes(norm(q))));
      box.innerHTML = `<div class="xmodal-card tplm">
        <div class="xmodal-h"><b>Plantillas</b><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
        <div class="tplm-b">
          <div class="tplm-prev"><div class="tplm-mini"><span class="pgcover" style="background:${COVERS[t.cover]}"></span><div class="tplm-mini-t"><b>${esc(t.title)}</b><div class="tplm-mini-c">${t.html}</div></div></div>
            <div class="between" style="margin-top:10px"><b style="font-size:14px">${esc(t.title)}</b><span class="xtag">${CATS.find(c => c[0] === t.cat)[1]}</span></div><p class="small muted" style="margin:6px 0 0">${esc(t.desc)}</p>
            <button type="button" class="tplm-blank" data-blank>${I(IC.plus, 16, 2)} Página en blanco</button></div>
          <div class="tplm-list"><label class="xsearch">${I(IC.search, 16)}<input data-q placeholder="Buscar plantillas" value="${esc(q)}" aria-label="Buscar plantillas"></label>
            <div class="pills" role="group" aria-label="Categoría">${CATS.map(([k, l]) => `<button type="button" data-cat="${k}" aria-pressed="${cat === k}">${l} <span class="muted">${k === "todo" ? T.length : T.filter(x => x.cat === k).length}</span></button>`).join("")}</div>
            <div class="tplgrid">${L.map(x => `<button type="button" class="tplc" data-t="${x.id}" aria-pressed="${x.id === sel}"><span class="pgcover" style="background:${COVERS[x.cover]}"></span><b>${esc(x.title)}</b><small>${esc(x.desc)}</small></button>`).join("") || `<div class="small muted">Ninguna plantilla coincide.</div>`}</div></div>
        </div>
        <div class="xmodal-f"><button type="button" class="btn2" data-x style="height:40px">Cancelar</button><button type="button" class="btn" data-use style="height:40px">Usar plantilla</button></div></div>`;
      const qi = box.querySelector("[data-q]"); if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.q !== undefined) { }
      qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; paint(); const n = box.querySelector("[data-q]"); n.focus(); n.setSelectionRange(pos, pos); };
    };
    const close = () => { box.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const c = e.target.closest("[data-cat]"); if (c) { cat = c.dataset.cat; paint(); return; }
      const t = e.target.closest("[data-t]"); if (t) { sel = t.dataset.t; paint(); return; }
      if (e.target.closest("[data-blank]")) { close(); onUse(null); return; }
      if (e.target.closest("[data-use]")) { close(); onUse(T.find(x => x.id === sel)); }
    });
    document.addEventListener("keydown", esc_);
    paint(); document.body.appendChild(box); setTimeout(() => { const b = box.querySelector("[data-use]"); b && b.focus(); }, 30);
  }
  /* -------- editor -------- */
  const SLASH = [["h1", "Título grande", "H1"], ["h2", "Título", "H2"], ["p", "Texto", "¶"], ["ul", "Lista", "•"], ["ol", "Lista numerada", "1."], ["todo", "Lista de tareas", "☐"], ["quote", "Cita", "❝"], ["hr", "Separador", "—"], ["img", "Imagen", "▣"]];
  function editorView(p) {
    return `<div class="pged">
      <div class="pgbar"><a href="#diario" class="row" style="gap:6px;text-decoration:none;font-weight:600;font-size:14px">${I(IC.left, 16, 2)} Diario</a><span class="muted small">/</span><span class="small" style="max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title || "Sin título")}</span>
        <span style="flex:1"></span><span class="small muted" id="pgSaved">${I(IC.check, 14, 2.2)} Guardado</span>
        <button type="button" class="btn2" id="pgTpl" style="height:34px">Plantilla</button><button type="button" class="xib" id="pgDel" title="Borrar página" aria-label="Borrar página">${I(IC.trash, 17)}</button></div>
      <div class="pgcoverbig" style="background:${COVERS[p.cover] || COVERS.cobalto}"><div class="pgcovers" role="group" aria-label="Portada">${Object.keys(COVERS).map(k => `<button type="button" data-cover="${k}" aria-pressed="${p.cover === k}" style="background:${COVERS[k]}" aria-label="Portada ${k}"></button>`).join("")}</div></div>
      <div class="pgwho"><span class="pgav">${esc(initials())}</span><div><b>${esc(S.name || "")}</b><div class="small muted">Creada el ${fmtD(p.created)}</div></div></div>
      <input class="pgtitle" id="pgTitle" placeholder="Sin título" value="${esc(p.title || "")}" aria-label="Título de la página" maxlength="120">
      <div class="pgdoc" id="pgDoc" contenteditable="true" data-ph="Escribe, o pulsa «/» para comandos" spellcheck="true">${clean(p.html)}</div>
      <div class="slash" id="pgSlash" hidden role="listbox" aria-label="Comandos"></div>
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
    const flush = async () => { if (!dirty) return; dirty = false; p.title = title.value.trim(); p.html = clean(doc.innerHTML); const ok = await savePage(p); saved.innerHTML = ok ? `${I(IC.check, 14, 2.2)} Guardado` : "No se pudo guardar"; };
    S.pgFlush = flush;
    title.oninput = mark; title.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); doc.focus(); } };
    doc.addEventListener("input", () => { mark(); checkSlash(); });
    const exec = (c, v) => document.execCommand(c, false, v);
    function block(kind) {
      const sel = getSelection(); if (!sel.rangeCount) return;
      // borra la «/» escrita
      const r = sel.getRangeAt(0), n = r.startContainer; if (n.nodeType === 3) { const i = n.textContent.lastIndexOf("/", r.startOffset); if (i >= 0) { n.textContent = n.textContent.slice(0, i) + n.textContent.slice(r.startOffset); const rr = document.createRange(); rr.setStart(n, i); rr.collapse(true); sel.removeAllRanges(); sel.addRange(rr); } }
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
    slash.addEventListener("mousedown", e => { const b = e.target.closest("[data-cmd]"); if (b) { e.preventDefault(); hideSlash(); block(b.dataset.cmd); } });
    doc.addEventListener("keydown", e => {
      if (!slash.hidden) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sIdx = (sIdx + (e.key === "ArrowDown" ? 1 : -1) + sList.length) % sList.length; paintSlash(); return; }
        if (e.key === "Enter") { e.preventDefault(); const c = sList[sIdx][0]; hideSlash(); block(c); return; }
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
    $("#pgTpl").onclick = () => tplModal(tpl => { if (!tpl) return; if (txt(doc.innerHTML).trim() && !confirm("La plantilla se añadirá al final de la página. ¿Seguir?")) return; doc.insertAdjacentHTML("beforeend", tpl.html); if (!title.value.trim()) title.value = tpl.title; mark(); });
    $("#pgDel").onclick = async () => {
      if (!confirm("¿Borrar esta página? No se puede deshacer.")) return;
      const { error } = await sb.from("docs").delete().eq("col", "page").eq("id", p.id); if (error) { toast("No se pudo borrar"); return; }
      S.pages = S.pages.filter(x => x.id !== p.id); S.pgFlush = null; location.hash = "#diario"; toast("Página borrada");
    };
    window.addEventListener("hashchange", function h() { window.removeEventListener("hashchange", h); flush(); });
    if (!p.title) title.focus(); else if (!txt(p.html).trim()) doc.focus();
  }
  V.diario = {
    view(r) {
      if (!S.pagesLoaded) { loadPages().then(() => { if (location.hash.startsWith("#diario")) { S.lastView = null; render(); } }); }
      if (r.id) { const p = (S.pages || []).find(x => x.id === r.id); if (!p) return S.pagesLoaded ? `<div class="stack"><a href="#diario" class="link">← Diario</a><div class="card">No encuentro esta página.</div></div>` : `<div class="muted">Cargando…</div>`; return editorView(p); }
      return listView();
    },
    bind(r) {
      if (r.id) { const p = (S.pages || []).find(x => x.id === r.id); if (p) bindEditor(p); return; }
      const q = $("#pgQ"); if (q) q.oninput = () => { S.pgQ = q.value; const pos = q.selectionStart; S.lastView = null; render(); const n = $("#pgQ"); n.focus(); n.setSelectionRange(pos, pos); };
      const nb = $("#pgNew"); if (nb) nb.onclick = () => tplModal(async tpl => { const p = newPage(tpl); await savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); });
    }
  };
})();

/* ======================= BACKTESTING: SESIONES ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
  const V = window.TK_VIEWS, { $, $$, I, IC, fmtD, statCard, empty, ring } = window.TK_X;
  const SIZES = [10000, 25000, 50000, 100000, 150000, 200000];
  const RANGES = [["1d", "1 día", 1], ["1w", "1 semana", 7], ["1m", "1 mes", 30], ["3m", "3 meses", 91], ["6m", "6 meses", 182], ["1y", "1 año", 365]];
  const k = n => n >= 1000 ? (n / 1000).toLocaleString("es-ES") + " mil" : String(n);
  const symList = () => { const mine = symbolsInfo().map(x => x.s); return Array.from(new Set(mine.concat(MARKETS.flatMap(g => g[1])))); };
  async function loadSessions() {
    const [a, b] = await Promise.all([sb.from("docs").select("id,data").eq("col", "bts"), sb.from("sim_trades").select("session_id,r,exit_time,symbol").not("session_id", "is", null)]);
    if (!a.error) S.bts = (a.data || []).map(d => Object.assign({ id: d.id }, d.data));
    if (!b.error) S.btTrades = b.data || [];
    S.btLoaded = true;
  }
  async function saveSession(x) { const { id, ...data } = x; const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "bts", id, data, updated_at: new Date().toISOString() }); return !error; }
  const sessTrades = id => (S.btTrades || []).filter(t => t.session_id === id && t.r != null).map(t => ({ r: +t.r, status: "closed", open_time: t.exit_time }));
  function rulesBars(x, st) {
    if (x.mode !== "fondeo") return "";
    const rp = x.risk || 0.5, tg = x.target / rp, dl = x.daily / rp, ml = x.max / rp;
    const byDay = {}; sessTrades(x.id).forEach(t => { const d = dayKey(t.open_time); byDay[d] = (byDay[d] || 0) + t.r; });
    const worstDay = Math.min(0, ...Object.values(byDay)), bars = [["Objetivo", st.tot / tg, `${fmtR(st.tot)} de +${num(tg, 1)} R`], ["Peor día frente al límite diario", Math.abs(worstDay) / dl, `${fmtR(worstDay)} de −${num(dl, 1)} R`, true], ["Caída máxima frente al límite", Math.abs(st.dd) / ml, `${fmtR(st.dd)} de −${num(ml, 1)} R`, true]];
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
      <div class="anums"><div><span>Operaciones</span><b>${st.n}</b></div><div><span>Acierto</span><b>${st.win == null ? "—" : num(st.win, 0) + " %"}</b></div><div><span>Resultado</span><b>${st.n ? fmtR(st.tot) : "—"}</b></div><div><span>Caída máx.</span><b>${st.n ? fmtR(st.dd) : "—"}</b></div></div>
      ${rulesBars(x, st)}
      <div class="row" style="gap:8px"><button type="button" class="btn" data-bsgo="${esc(x.id)}" style="height:38px;font-size:13.5px">${I(IC.play, 13)} ${x.lastTs ? "Continuar" : "Empezar"}</button>${(x.syms || []).length > 1 ? `<select class="xsel" data-bssym="${esc(x.id)}" aria-label="Mercado">${x.syms.map(s => `<option>${esc(s)}</option>`).join("")}</select>` : ""}</div>
    </article>`;
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
        <div class="bshero"><div class="bshero-t"><div class="lbl" style="color:#a9bcff">Backtesting</div><h1>Practica en el pasado.</h1><p>Elige un mercado y unas fechas, avanza vela a vela y opera como si fuera en vivo. Prueba también un reto de fondeo con sus límites, sin arriesgar nada.</p>
          <div class="row" style="gap:10px;flex-wrap:wrap"><button type="button" class="btn" id="bsNew">${I(IC.plus, 16, 2)} Nueva sesión</button><a class="btn2 bsghost" href="#analizar" id="bsFree">Practicar sin sesión</a></div></div>${heroArt()}</div>
        ${all.length ? `<div class="xkgrid">${statCard("Sesiones", (S.bts || []).length, "", "")}${statCard("Operaciones simuladas", st.n, "", "")}${statCard("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", "", ring(st.win))}${statCard("Resultado", fmtR(st.tot), "todas las sesiones", spark(st.curve, 96, 40))}</div>` : ""}
        <div class="row" style="gap:14px;flex-wrap:wrap"><h2 class="h2b">Sesiones</h2><span class="small muted">${(S.bts || []).length} en total</span><div class="pills" role="group" aria-label="Filtrar sesiones" style="margin-left:auto">${[["todas", "Todas"], ["clasico", "Clásico"], ["fondeo", "Reto de fondeo"]].map(([a, b]) => `<button type="button" data-bsf="${a}" aria-pressed="${f === a}">${b}</button>`).join("")}</div></div>
        ${!S.btLoaded ? `<div class="small muted">Cargando…</div>` : L.length ? `<div class="agrid">${L.map(sessCard).join("")}</div>` : `<div class="card">${empty("Aún no hay sesiones", "Crea una sesión para practicar un mercado en unas fechas concretas, en modo clásico o como un reto de fondeo.", `<button type="button" class="btn" data-bsnew2 style="height:38px">Nueva sesión</button>`)}</div>`}
      </div>`;
    },
    bind() {
      $$("[data-bsf]").forEach(b => b.onclick = () => { S.bsF = b.dataset.bsf; S.lastView = null; render(); });
      const nb = $("#bsNew"); if (nb) nb.onclick = () => drawer();
      $$("[data-bsnew2]").forEach(b => b.onclick = () => drawer());
      $("#bsFree").onclick = () => { S.btRun = null; };
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
  function drawer() {
    const d = { tab: "crear", mode: "clasico", name: "", syms: [symList()[0] || "EURUSD"], range: "1m", from: "", to: "", balance: 10000, size: 100000, target: 10, daily: 5, max: 10, risk: S.plan && S.plan.riskPct || 0.5 };
    const setRange = key => { const r = RANGES.find(x => x[0] === key); const end = new Date(); end.setDate(end.getDate() - 1); const st = new Date(end); st.setDate(st.getDate() - r[2] + 1); d.range = key; d.to = dayKey(end); d.from = dayKey(st); };
    setRange("1m");
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Nueva sesión de backtesting");
    const art = mode => mode === "fondeo"
      ? `<div class="bsban fondeo"><div class="bsring">${SIZES.slice(1, 5).map((n, i) => `<span class="bsnode n${i}">${n >= 1e5 ? n / 1000 + "k" : n / 1000 + "k"}</span>`).join("")}<span class="bscore">${I(IC.trophy, 26)}</span></div><b>Reto de fondeo</b><small>Objetivo, límite diario y límite total, como en una prueba real</small></div>`
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
          ${d.mode === "fondeo" ? `<div class="row" style="gap:6px;flex-wrap:wrap">${SIZES.map(n => `<button type="button" class="chipb" data-size="${n}" aria-pressed="${d.size === n}">${k(n)}</button>`).join("")}</div>
            <div class="fgrid"><label class="field"><span>Objetivo (%)</span><input class="input" data-k="target" inputmode="decimal" value="${d.target}"></label><label class="field"><span>Pérdida diaria máx. (%)</span><input class="input" data-k="daily" inputmode="decimal" value="${d.daily}"></label><label class="field"><span>Pérdida total máx. (%)</span><input class="input" data-k="max" inputmode="decimal" value="${d.max}"></label></div>`
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
      if (b.dataset.mode) { d.mode = b.dataset.mode; paint(); return; }
      if (b.dataset.range) { setRange(b.dataset.range); paint(); return; }
      if (b.dataset.size) { d.size = +b.dataset.size; paint(); return; }
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
      <span class="small mono" id="bsBandStats">${st.n} op. · ${st.n ? fmtR(st.tot) : "0,0 R"}</span><span style="flex:1"></span><a class="btn2" href="#backtest" style="height:34px">Ver sesiones</a><button type="button" class="btn2" id="bsEnd" style="height:34px">Terminar</button></div>
      ${x ? `<div style="margin-top:10px">${rulesBars(x, st)}</div>` : ""}</div>`;
  };
  window.tkSessionHooks = {
    saved(rec) { if (!S.btRun) return; (S.btTrades = S.btTrades || []).push({ session_id: S.btRun.id, r: rec.r, exit_time: rec.exit_time, symbol: rec.symbol }); const b = document.getElementById("bsBand"); if (b) b.outerHTML = window.tkSessionBand(), bindBand(); },
    step(ts) { const r = S.btRun; if (!r) return; r.at = ts; clearTimeout(r.t); r.t = setTimeout(async () => { const x = (S.bts || []).find(y => y.id === r.id); if (!x) return; x.lastTs = r.at; x.updated = Date.now(); await saveSession(x); }, 1500); },
    bind: bindBand
  };
  function bindBand() { const e = document.getElementById("bsEnd"); if (e) e.onclick = () => { const m = window.TkChart && TkChart.all.find(c => c.key === "main"); if (m) m.stopBacktest(); S.btRun = null; const b = document.getElementById("bsBand"); if (b) b.remove(); toast("Sesión guardada. La retomas desde Backtesting."); }; }
  window.tkLoadSessions = loadSessions;
})();

/* ======================= NOTICIAS (calendario económico) ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
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
  const hm = ts => new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const inPlan = ts => { const p = S.plan || {}, m = minOfDate(ts), a = minOf(p.start), b = minOf(p.end); return a != null && b != null && m >= a - 15 && m <= b; };
  const until = ts => { const m = Math.round((ts - Date.now()) / 6e4); if (m < 0) return "ya ha salido"; if (m < 60) return "en " + m + " min"; const h = Math.floor(m / 60); return h < 24 ? `en ${h} h ${m % 60} min` : `en ${Math.floor(h / 24)} d ${h % 24} h`; };
  const impBadge = i => { const x = IMP[i] || ["—", 0]; return `<span class="nimp i${x[1]}" title="Impacto ${x[0].toLowerCase()}"><span class="nbars"><i></i><i></i><i></i></span>${x[0]}</span>`; };
  function nf() { return S.nf || (S.nf = { q: "", imp: { High: true, Medium: true, Low: true, Holiday: false }, cur: [], day: "week", mine: false }); }
  function filtered() {
    const f = nf(), E = (S.news && S.news.events) || [], q = norm(f.q), today = todayKey(), tm = new Date(); tm.setDate(tm.getDate() + 1); const tomorrow = dayKey(tm);
    return E.filter(e => f.imp[e.impact] !== false && (IMP[e.impact] ? f.imp[e.impact] : true) && (!f.cur.length || f.cur.includes(e.country)) && (!q || norm(e.title + " " + e.country).includes(q)) && (f.day === "week" || dayKey(e.ts) === (f.day === "today" ? today : tomorrow)) && (!f.mine || inPlan(e.ts)));
  }
  function tableHtml(L) {
    if (!L.length) return empty(S.news && S.news.err ? "No se pudo cargar el calendario" : "No hay noticias con estos filtros", S.news && S.news.err ? "Vuelve a intentarlo en un momento." : "Prueba a activar más niveles de impacto o divisas.");
    const now = Date.now(), next = L.find(e => e.ts > now); let lastDay = "";
    return `<div class="xtablewrap"><table class="xtable ntable"><thead><tr><th>Día</th><th>Hora</th><th>Divisa</th><th>Impacto</th><th>Evento</th><th>Real</th><th>Previsión</th><th>Anterior</th><th></th></tr></thead><tbody>
      ${L.map(e => { const d = dayKey(e.ts), first = d !== lastDay; lastDay = d; const past = e.ts < now - 30 * 6e4, isNext = next && e === next;
        return `<tr class="${past ? "past" : ""} ${isNext ? "next" : ""} ${first ? "dayfirst" : ""}"><td>${first ? `<b>${new Date(e.ts).toLocaleDateString("es-ES", { weekday: "short" })}</b><div class="small muted">${new Date(e.ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</div>` : ""}</td>
          <td class="mono">${/T00:00:00/.test(e.date) && e.impact === "Holiday" ? "Todo el día" : hm(e.ts)}</td><td><span class="nflag">${FLAG[e.country] || "🏳️"}</span> ${esc(e.country)}</td><td>${impBadge(e.impact)}</td>
          <td><b>${esc(e.title)}</b>${isNext ? ` <span class="xtag">Próxima · ${until(e.ts)}</span>` : ""}</td><td class="mono">${esc(e.actual || "—")}</td><td class="mono">${esc(e.forecast || "—")}</td><td class="mono">${esc(e.previous || "—")}</td>
          <td>${inPlan(e.ts) ? `<span class="nmine" title="Cae dentro de tu horario de operativa">${I(IC.clock, 14)} Tu horario</span>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  V.noticias = {
    view() {
      if (!S.news || Date.now() - S.news.got > 20 * 60 * 1000) loadNews().then(() => { if (location.hash.startsWith("#noticias")) { S.lastView = null; render(); } });
      const f = nf(), E = (S.news && S.news.events) || [], today = todayKey(), L = filtered();
      const todayE = E.filter(e => dayKey(e.ts) === today), hiToday = todayE.filter(e => e.impact === "High"), nextHi = E.find(e => e.impact === "High" && e.ts > Date.now());
      const curs = Array.from(new Set(E.map(e => e.country))).filter(Boolean).sort();
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Noticias</h1><div class="small muted">Calendario económico de esta semana y la siguiente · horas en ${esc(TZ.replace("_", " ") || "tu zona")}</div></div><button type="button" class="btn2" id="nRef" style="height:38px">Actualizar</button></div>
        <div class="xkgrid">${statCard("Eventos esta semana", S.news ? E.length : "…", todayE.length + " hoy")}
          ${statCard("Alto impacto hoy", S.news ? hiToday.length : "…", hiToday.length ? hiToday.map(e => hm(e.ts) + " " + e.country).slice(0, 3).join(" · ") : "Día tranquilo")}
          ${statCard("Divisas", curs.length || "…", curs.slice(0, 6).join(" · "))}
          ${statCard("Próximo evento importante", nextHi ? hm(nextHi.ts) : "—", nextHi ? `${FLAG[nextHi.country] || ""} ${esc(nextHi.country)} · ${esc(nextHi.title)} · ${until(nextHi.ts)}` : "Nada de alto impacto pendiente")}</div>
        ${hiToday.some(e => inPlan(e.ts) && e.ts > Date.now() - 30 * 6e4) ? `<div class="callout">${I(IC.clock, 18)}<div><b>Hay noticias de alto impacto dentro de tu horario.</b> Evita entrar 15 minutos antes y después: el precio puede saltar tu stop sin respetar el análisis.</div></div>` : ""}
        <div class="card xcard"><div class="xtools">
          <label class="xsearch">${I(IC.search, 16)}<input id="nQ" placeholder="Buscar eventos…" value="${esc(f.q)}" aria-label="Buscar eventos"></label>
          <div class="xfil">
            <div class="pseg" role="group" aria-label="Día">${[["today", "Hoy"], ["tomorrow", "Mañana"], ["week", "Todo"]].map(([k, l]) => `<button type="button" data-nday="${k}" aria-pressed="${f.day === k}">${l}</button>`).join("")}</div>
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
      const q = $("#nQ"); q.oninput = () => { f.q = q.value; $("#nTable").innerHTML = tableHtml(filtered()); };
      $$("[data-nday]").forEach(b => b.onclick = () => { f.day = b.dataset.nday; re(); });
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
    if (!L.length) return "";
    const mine = L.filter(e => inPlan(e.ts));
    return `<a class="card newsmini ${mine.length ? "warn" : ""}" href="#noticias"><div class="row" style="gap:8px">${I(IC.clock, 17)}<b style="font-size:14px">Noticias fuertes hoy</b></div>${L.slice(0, 3).map(e => `<div class="between small"><span>${FLAG[e.country] || ""} ${esc(e.country)} · ${esc(e.title)}</span><b class="mono">${hm(e.ts)}</b></div>`).join("")}${mine.length ? `<div class="small" style="color:var(--ambarT)">${mine.length === 1 ? "Una cae" : mine.length + " caen"} en tu horario: no entres 15 min antes ni después.</div>` : ""}</a>`;
  };
  window.tkLoadNews = loadNews;
})();

/* ======================= ASISTENTE ======================= */
(function () {
  "use strict";
  const { S, sb, esc, SVG, fmtR, num, fmtPct, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, MARKETS, symbolsInfo, lsGet, lsSet, acctName, selAcct, FEELS, greet, initials, minOf, minOfDate } = window.TKAPP;
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
      return `Tu mejor hora es entre las <b>${b.k}:00 y las ${+b.k + 1}:00</b>: ${fmtR(b.st.exp)} por operación en ${b.st.n} operaciones (${num(b.st.win, 0)} % de acierto).${w && w.k !== b.k ? ` La que peor te va: <b>${w.k}:00</b>, con ${fmtR(w.st.exp)} por operación.` : ""}<ul>${li(`Tu horario del plan es ${esc(S.plan.start)}–${esc(S.plan.end)}.`)}${w && w.st.exp < 0 ? li(`Si esa hora está dentro de tu horario, plantéate quitarla desde mañana.`) : ""}</ul>`;
    }
    if (has("dia de la semana", "que dia", "lunes", "viernes", "dias")) {
      const G = groupBy(C, t => new Date(t.open_time).getDay()), b = pick(G, 2, (a, c) => c.st.exp - a.st.exp), w = pick(G, 2, (a, c) => a.st.exp - c.st.exp);
      if (!b) return "Todavía hay pocas operaciones por día de la semana para compararlos.";
      return `Te va mejor el <b>${DAYS[b.k]}</b> (${fmtR(b.st.exp)} por operación, ${b.st.n} op.) y peor el <b>${DAYS[w.k]}</b> (${fmtR(w.st.exp)} por operación, ${w.st.n} op.).`;
    }
    if (has("mercado", "simbolo", "par", "activo", "instrumento")) {
      const G = groupBy(C, t => t.symbol), b = pick(G, 2, (a, c) => c.st.tot - a.st.tot), w = pick(G, 2, (a, c) => a.st.tot - c.st.tot);
      if (!b) return "Necesito al menos dos operaciones por mercado para compararlos.";
      return `Tu mejor mercado es <b>${esc(b.k)}</b>: ${fmtR(b.st.tot)} en ${b.st.n} operaciones.${w && w.k !== b.k ? ` El que más te cuesta es <b>${esc(w.k)}</b>: ${fmtR(w.st.tot)} en ${w.st.n}.` : ""}`;
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
      return `Después de una pérdida, el mismo día, has hecho <b>${after.length}</b> operaciones: ${fmtR(st.exp)} por operación frente a ${fmtR(all.exp)} de tu media, y cumples el plan el ${num(gp, 0)} % de las veces.${st.exp < all.exp ? " <b>Te va peor tras perder.</b> Prueba la regla: tras una pérdida, cinco minutos fuera de la pantalla." : " Gestionas bien las pérdidas."}`;
    }
    if (has("emocion", "siento", "sentia", "miedo", "ansiedad", "fomo")) {
      if (!(S.consents && S.consents.health)) return `Para responder sobre emociones tienes que activar el permiso en <a href="#plan">Mi plan → Permisos</a> y anotar cómo te sentías en cada operación.`;
      const G = groupBy(C.filter(t => (t.review || {}).feel), t => t.review.feel), w = pick(G, 2, (a, c) => a.st.tot - c.st.tot), b = pick(G, 2, (a, c) => c.st.exp - a.st.exp);
      if (!w) return `Anota tu emoción en más operaciones (te lo pongo fácil en <a href="#emociones">Emociones</a>) y podré compararlas.`;
      return `La emoción que más te cuesta es <b>${esc(w.k.toLowerCase())}</b>: ${fmtR(w.st.tot)} en ${w.st.n} operaciones.${b && b.k !== w.k ? ` La que mejor te va: <b>${esc(b.k.toLowerCase())}</b>, ${fmtR(b.st.exp)} por operación.` : ""}`;
    }
    if (has("demasiad", "sobreoper", "cuantas", "numero de operaciones")) {
      const G = groupBy(C, t => dayKey(t.open_time)), over = G.filter(g => g.l.length > S.plan.maxTrades), ok = G.filter(g => g.l.length <= S.plan.maxTrades);
      const so = tradeStats(over.flatMap(g => g.l)), sk = tradeStats(ok.flatMap(g => g.l));
      return over.length ? `Has pasado tu máximo de ${S.plan.maxTrades} operaciones en <b>${over.length} de ${G.length}</b> días. Esos días: ${fmtR(so.exp)} por operación; el resto: ${fmtR(sk.exp)}.` : `No has pasado tu máximo de ${S.plan.maxTrades} operaciones ningún día. Bien.`;
    }
    if (has("compra", "venta", "largo", "corto", "direccion")) {
      const b = tradeStats(C.filter(t => t.side === "buy")), s = tradeStats(C.filter(t => t.side === "sell"));
      return `Compras: ${b.n} op., ${b.n ? fmtR(b.tot) + " (" + num(b.win, 0) + " % de acierto)" : "—"}. Ventas: ${s.n} op., ${s.n ? fmtR(s.tot) + " (" + num(s.win, 0) + " % de acierto)" : "—"}.`;
    }
    if (has("backtest", "simulad", "practica", "sesion")) {
      const L = (S.btTrades || []);
      if (!S.btLoaded) { if (window.tkLoadSessions) tkLoadSessions(); return "Estoy cargando tus sesiones de backtesting. Pregúntamelo otra vez en un momento."; }
      if (!L.length) return `Aún no tienes operaciones simuladas en sesiones. Crea una en <a href="#backtest">Backtesting</a>.`;
      const st = tradeStats(L.map(t => ({ r: +t.r, status: "closed", open_time: t.exit_time })));
      return `En tus sesiones de backtesting llevas <b>${st.n}</b> operaciones simuladas: ${fmtR(st.tot)}, ${num(st.win, 0)} % de acierto y una caída máxima de ${fmtR(st.dd)}.`;
    }
    // resumen (semana por defecto, mes si se pide)
    const month = has("mes"), from = new Date(); from.setHours(0, 0, 0, 0); if (month) from.setDate(1); else from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    const L = C.filter(t => new Date(t.open_time) >= from), st = tradeStats(L), good = L.filter(t => evaluate(t).good).length;
    if (!has("semana", "mes", "resumen", "como voy", "como va")) {
      return `No he entendido la pregunta. Puedo responderte sobre esto:<ul>${SUG.map(s => li(`<button type="button" class="link" data-ask="${esc(s)}">${esc(s)}</button>`)).join("")}</ul>`;
    }
    if (!L.length) return `${month ? "Este mes" : "Esta semana"} aún no has cerrado operaciones.`;
    return `${month ? "Este mes" : "Esta semana"}: <b>${st.n}</b> operaciones, <b>${fmtR(st.tot)}</b>, ${num(st.win, 0)} % de acierto y <b>${good} de ${st.n}</b> dentro del plan.${st.dd < 0 ? ` Peor caída: ${fmtR(st.dd)}.` : ""}`;
  }
  V.asistente = {
    view() {
      const th = S.chat || [];
      return `<div class="aswrap">
        <div class="ashead"><span class="asorb">${SVG('<path d="M10 2.5l1.6 3.7 3.7 1.6-3.7 1.6L10 13.1 8.4 9.4 4.7 7.8l3.7-1.6z"/><path d="M15.5 12.5l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z"/>', 26)}</span>
          <h1>Hola, ${esc((S.name || "").split(" ")[0])}.</h1><p class="muted">¿Qué quieres saber de tu trading? Respondo con tus operaciones${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""}, en R.</p></div>
        <div class="asthread" id="asT" aria-live="polite">${th.map(m => `<div class="asmsg ${m.me ? "me" : ""}">${m.me ? esc(m.t) : m.t}</div>`).join("")}</div>
        <form class="asbox" id="asF"><textarea id="asQ" rows="1" placeholder="Pregunta sobre tus operaciones…" aria-label="Pregunta"></textarea><button type="submit" class="btn" style="height:40px;width:40px;padding:0" aria-label="Enviar">${I(IC.send, 18)}</button></form>
        <div class="assug">${SUG.slice(0, 6).map(s => `<button type="button" class="chipb" data-ask="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="small muted" style="text-align:center">Las respuestas salen de tus datos guardados en Tickora; no es una IA externa y no da consejos de inversión.</div>
      </div>`;
    },
    bind() {
      const f = $("#asF"), q = $("#asQ"), T = $("#asT");
      const ask = text => {
        text = String(text || "").trim(); if (!text) return;
        (S.chat = S.chat || []).push({ me: true, t: text }, { me: false, t: answer(text) }); if (S.chat.length > 40) S.chat = S.chat.slice(-40);
        T.innerHTML = S.chat.map(m => `<div class="asmsg ${m.me ? "me" : ""}">${m.me ? esc(m.t) : m.t}</div>`).join(""); bindAsk(); T.lastElementChild && T.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" }); q.value = ""; q.style.height = "";
      };
      const bindAsk = () => $$("[data-ask]").forEach(b => b.onclick = () => ask(b.dataset.ask));
      f.onsubmit = e => { e.preventDefault(); ask(q.value); };
      q.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(q.value); } };
      q.oninput = () => { q.style.height = "auto"; q.style.height = Math.min(160, q.scrollHeight) + "px"; };
      bindAsk();
    }
  };
})();

/* si la página ya se pintó antes de cargar este archivo, la repinto con las secciones nuevas */
(function () { const A = window.TKAPP; if (A && A.S && A.S.loaded && window.TK_VIEWS[(location.hash.replace(/^#/, "").split("/")[0])]) { A.S.lastView = null; A.render(); } })();
