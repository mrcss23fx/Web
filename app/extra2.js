/* Tickora · navegación por aplicaciones y páginas nuevas:
   Inicio (tus aplicaciones), ruta y pestañas, buscador (Ctrl/⌘ K), botón +, guía de configuración, estilos,
   Rendimiento, Calendario, Informe diario, Análisis / Operaciones / Calendario / Cuaderno de backtesting y Finanzas. */
(function () {
  "use strict";
  const A = window.TKAPP;
  const { S, sb, esc, SVG, fmtR, num, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, lsGet, lsSet, acctName, selAcct, FEELS, greet, money, inSession, MESES_L, NAV_APPS, appOf, ico, isDark } = A;
  const V = window.TK_VIEWS;
  const { $, $$, I, IC, norm, closed, fmtDT, fmtD, statCard, empty, ring, download, healthOk, px, dur, loadEmo } = window.TK_X;
  const BT = () => window.TK_BT, DI = () => window.TK_DIARIO;
  const re = () => { S.lastView = null; render(); };
  const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], DOWL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const fpf = v => v == null ? "—" : v === Infinity ? "∞" : num(v, 2);
  const dateOf = t => t.open_time || t.exit_time || t.entry_time;

  /* ---------- gráficos sencillos (SVG que se adapta al ancho) ---------- */
  function lineChart(vals, o) {
    o = o || {}; const h = o.h || 180, W = 600;
    if (!vals || vals.length < 2) return `<div class="xchart-empty">${o.emptyText || "Sin datos todavía"}</div>`;
    const mn = Math.min(0, ...vals), mx = Math.max(0, ...vals), rg = (mx - mn) || 1, X = i => i / (vals.length - 1) * W, Y = v => 8 + (mx - v) / rg * (h - 16);
    const pts = vals.map((v, i) => X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(" "), id = "lc" + Math.random().toString(36).slice(2, 7);
    const area = o.area !== false ? `<polygon points="0,${Y(0).toFixed(1)} ${pts} ${W},${Y(0).toFixed(1)}" fill="url(#${id})"/>` : "";
    return `<div class="xchart"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px" role="img" aria-label="${esc(o.label || "Gráfico")}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cobalto)" stop-opacity="${o.dd ? .05 : .28}"/><stop offset="1" stop-color="var(--cobalto)" stop-opacity="${o.dd ? .28 : .02}"/></linearGradient></defs>
      <line x1="0" x2="${W}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" stroke="var(--linea)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>${area}
      <polyline points="${pts}" fill="none" stroke="var(--cobalto)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
      <div class="xchart-ax"><span>${esc(o.from || "")}</span><span class="mono">${o.fmt ? o.fmt(vals[vals.length - 1]) : fmtR(vals[vals.length - 1])}</span><span>${esc(o.to || "")}</span></div></div>`;
  }
  function barsV(items, o) {
    o = o || {}; if (!items.length || items.every(x => !x.v)) return `<div class="xchart-empty">${o.emptyText || "Sin datos todavía"}</div>`;
    const mx = Math.max(...items.map(x => Math.abs(x.v))) || 1, hasNeg = items.some(x => x.v < 0);
    return `<div class="xvbars ${hasNeg ? "neg2" : ""}" role="img" aria-label="${esc(o.label || "Barras")}">${items.map(x => `<div class="xvb" title="${esc(x.l)}: ${o.fmt ? o.fmt(x.v) : fmtR(x.v)}${x.n != null ? " · " + x.n + " op." : ""}"><div class="xvb-t">${x.v ? `<i class="${x.v < 0 ? "neg" : ""}" style="height:${Math.max(3, Math.abs(x.v) / mx * (hasNeg ? 50 : 100)).toFixed(1)}%"></i>` : ""}</div><small>${esc(x.l)}</small></div>`).join("")}</div>`;
  }
  const kpi = (label, val, sub, vis, tip) => statCard(label, val, sub, vis, tip);
  const meter = (a, b, la, lb) => { const t = (a || 0) + (b || 0); const p = t ? a / t * 100 : 0; return `<div class="xmeter"><i style="width:${p.toFixed(1)}%"></i></div><div class="between small muted" style="margin-top:4px"><span>${la}</span><span>${lb}</span></div>`; };

  /* ======================= INICIO: PANEL DE CUADROS ======================= */
  const TFQ = ["1m", "3m", "5m", "15m", "30m", "45m", "1h", "2h", "4h", "1d", "1w"];
  const TFL = { "1m": "1 min", "3m": "3 min", "5m": "5 min", "15m": "15 min", "30m": "30 min", "45m": "45 min", "1h": "1 h", "2h": "2 h", "4h": "4 h", "1d": "1 día", "1w": "1 sem." };
  const HGRP = [["todo", "Todo"], ["operar", "Operar"], ["revisar", "Revisar"], ["cartera", "Cuentas y dinero"], ["ayuda", "Ayuda"]];
  const TILES = [
    ["hoy", "Hoy", "operar", [["hoy", "Hoy"], ["plan", "Mi plan"], ["informe", "Informe de hoy"], ["noticias", "Noticias de hoy"]]],
    ["analizar", "Analizar", "operar", [["analizar", "Gráfico"], ["backtest", "Backtesting"], ["noticias", "Calendario económico"]]],
    ["backtest", "Backtesting", "operar", [["backtest", "Sesiones"], ["btanalisis", "Análisis"], ["btops", "Operaciones"], ["btcal", "Calendario"], ["btnotas", "Cuaderno"]]],
    ["seguimiento", "Seguimiento", "revisar", [["rendimiento", "Rendimiento"], ["progreso", "Progreso"], ["emociones", "Emociones"], ["historial", "Operaciones"], ["calendario", "Calendario"], ["informe", "Informe diario"]]],
    ["diario", "Diario", "revisar", [["diario", "Páginas"], ["btnotas", "Cuaderno de backtesting"], ["informe", "Notas del día"]]],
    ["cartera", "Cartera", "cartera", [["cuentas", "Cuentas"], ["finanzas", "Finanzas"]]],
    ["asistente", "Inteligencia", "ayuda", [["asistente", "Asistente"]]],
    ["recursos", "Recursos", "ayuda", [["noticias", "Calendario económico"], ["aprender", "Aprender"]]],
    ["tu", "Tú", "cartera", [["plan", "Mi plan"], ["grupo", "Grupo"], ["cuentas", "Cuentas"]]]
  ];
  const ARW = '<path d="M7 13l6-6M8 7h5v5"/>';
  const hhmm = t => new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? "ahora" : m < 60 ? "hace " + m + " min" : m < 1440 ? "hace " + Math.round(m / 60) + " h" : "hace " + Math.round(m / 1440) + " d"; };
  function hData() {
    const today = S.trades.filter(t => t.open_time && dayKey(t.open_time) === todayKey()), st = tradeStats(today), p = S.plan;
    const C90 = closed(S.trades.filter(t => new Date(t.open_time) >= Date.now() - 90 * 864e5)), s90 = tradeStats(C90), good = C90.filter(t => evaluate(t).good).length;
    const ev = S.news && (S.news.events || []).filter(e => e.ts > Date.now() - 15 * 6e4).sort((a, b) => a.ts - b.ts);
    const nextHigh = ev && ev.find(e => e.impact === "High"), next = ev && ev[0];
    const sess = (S.bts || []).slice().sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
    const pages = (S.pages || []).filter(x => !x.isTpl).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const now = minOfNow(), a = minOfS(p.start), b = minOfS(p.end), phase = now < a ? "antes" : now < b ? "en" : "despues";
    return { today, st, p, s90, good, n90: C90.length, nextHigh, next, sess, pages, phase, a, b, now };
  }
  const minOfS = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
  const minOfNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const rbtn = (go, label) => `<a class="hb-go" href="#${go}" aria-label="Abrir ${esc(label)}" title="Abrir ${esc(label)}" data-stop>${I(ARW, 16, 2)}</a>`;
  const tFoot = (name, sub, go) => `<div class="hb-tf"><span><b>${esc(name)}</b><small>${sub}</small></span>${rbtn(go, name)}</div>`;
  function tileBody(k, D) {
    const p = D.p;
    switch (k) {
      case "hoy": {
        const used = D.today.length, mx = p.maxTrades || 3, f = Math.min(1, used / mx);
        const span = Math.max(1, D.b - D.a), tf = Math.max(0, Math.min(1, (D.now - D.a) / span));
        return `<div class="hb-w"><div class="hb-bar" role="img" aria-label="${used} de ${mx} operaciones"><i style="left:${(f * 100).toFixed(1)}%"></i></div>
          <div class="hb-sbar" role="img" aria-label="Horario ${esc(p.start)} a ${esc(p.end)}"><span>${esc(p.start)}</span><div><em style="width:${(tf * 100).toFixed(1)}%"></em></div><span>${esc(p.end)}</span></div></div>
          ${tFoot("Hoy", D.st.n ? fmtR(D.st.tot) + " · " + used + " de " + mx + " operaciones" : used + " de " + mx + " operaciones", "hoy")}`;
      }
      case "analizar": {
        const sym = (S.an && S.an.sym) || (S.trades[0] && S.trades[0].symbol) || "EURUSD", tf = lsGet("tk-tf", "5m");
        return `<div class="hb-w"><div class="hb-step"><button type="button" data-tfs="-1" aria-label="Temporalidad más corta" data-stop>−</button><b class="mono">${esc(TFL[tf] || tf)}</b><button type="button" data-tfs="1" aria-label="Temporalidad más larga" data-stop>+</button></div></div>
          ${tFoot("Analizar", esc(sym) + " · se abre en " + esc(TFL[tf] || tf), "analizar")}`;
      }
      case "backtest": {
        const i = Math.min(S.hbBt || 0, Math.max(0, D.sess.length - 1)), x = D.sess[i];
        if (!x) return `<div class="hb-media-c"><button type="button" class="hb-play" data-btnew aria-label="Crear sesión" data-stop>${I(IC.plus, 22, 2.2)}</button></div><div class="hb-media-t"><b>Crea tu primera sesión</b><small>Practica el mercado vela a vela</small></div>`;
        const from = new Date(x.from + "T00:00").getTime(), to = new Date(x.to + "T23:59").getTime(), pr = Math.max(0, Math.min(1, ((x.lastTs || from) - from) / (to - from)));
        return `<div class="hb-media-c"><button type="button" class="hb-mb" data-btcyc="-1" aria-label="Sesión anterior" ${D.sess.length > 1 ? "" : "disabled"} data-stop>${I('<path d="M14 5l-6 5 6 5zM6 5v10"/>', 16, 2)}</button><button type="button" class="hb-play" data-btplay="${esc(x.id)}" aria-label="${x.lastTs ? "Continuar" : "Empezar"} ${esc(x.name)}" data-stop>${I('<path d="M7 4.5v11l9-5.5z"/>', 22, 2)}</button><button type="button" class="hb-mb" data-btcyc="1" aria-label="Sesión siguiente" ${D.sess.length > 1 ? "" : "disabled"} data-stop>${I('<path d="M6 5l6 5-6 5zM14 5v10"/>', 16, 2)}</button></div>
          <div class="hb-media-t"><div class="hb-prog"><i style="width:${(pr * 100).toFixed(1)}%"></i></div><b>${esc(x.name)}</b><small>${esc((x.syms || []).join(" · "))} · ${x.mode === "fondeo" ? "reto de fondeo" : "clásico"} · ${Math.round(pr * 100)} %</small></div>`;
      }
      case "seguimiento": {
        const pc = D.n90 ? Math.round(D.good / D.n90 * 100) : null;
        return `<div class="hb-w"><div class="hb-ban">${pc == null ? "Aún sin operaciones" : pc >= 80 ? "Proceso sólido" : pc >= 60 ? "Buen camino" : "Revisa tus normas"}</div><div class="hb-big"><span class="hb-bl">Dentro del plan</span><b class="mono">${pc == null ? "—" : pc}</b><small>${pc == null ? "" : "%"}</small></div></div>
          ${tFoot("Seguimiento", D.s90.n ? fmtR(D.s90.tot) + " en 90 días" : "Rendimiento y emociones", "rendimiento")}`;
      }
      case "diario": {
        const pg = D.pages[0];
        return `<span class="hb-ic">${ico("diario", 20)}</span><div style="flex:1"></div>${tFoot("Diario", pg ? esc(pg.title || "Sin título") + " · " + ago(pg.updated) : S.pagesLoaded ? "Escribe tu primera página" : "Tus páginas", pg ? "diario/" + encodeURIComponent(pg.id) : "diario")}`;
      }
      case "cartera": {
        const A = S.accts || [], c = t => A.filter(a => a.type === t).length, sa = selAcct();
        return `<div class="hb-w"><div class="hb-ac"><span>${I('<path d="M4 14l4-4 3 3 5-6"/>', 13, 2.2)} Fondeo ${c("fondeo")}</span><span>${I('<circle cx="10" cy="10" r="5"/>', 13, 2.2)} Demo ${c("demo")} · Propia ${c("propia")}</span></div><div class="hb-pill">${A.length} ${A.length === 1 ? "cuenta" : "cuentas"}</div></div>
          ${tFoot("Cartera", sa ? esc(acctName(sa.a)) + " seleccionada" : "Todas las cuentas", "cuentas")}`;
      }
      case "asistente": {
        const q = ["¿A qué hora opero mejor?", "¿Qué norma rompo más?", "¿Cómo voy esta semana?", "¿Cuál es mi mejor mercado?"][new Date().getDate() % 4];
        return `<div class="hb-w"><a class="hb-q" href="#asistente" data-ask="${esc(q)}" data-stop>${esc(q)}<span>${I(IC.send, 14)}</span></a></div>${tFoot("Inteligencia", "Pregunta por tus números", "asistente")}`;
      }
      case "recursos": {
        const e = D.nextHigh || D.next;
        return `<div class="hb-w">${e ? `<div class="hb-ev"><b class="mono">${hhmm(e.ts)}</b><span>${esc(e.country)} · ${e.impact === "High" ? "alto impacto" : e.impact === "Medium" ? "impacto medio" : "impacto bajo"}</span><small>${esc(e.title)}</small></div>` : `<div class="hb-ev"><b>—</b><small>${S.news ? "Sin noticias pendientes" : "Cargando noticias…"}</small></div>`}</div>
          ${tFoot("Recursos", "Calendario económico", "noticias")}`;
      }
      case "tu": {
        return `<div class="hb-w"><div class="hb-chips"><span>Máx. ${p.maxTrades} op.</span><span>${esc(p.start)}–${esc(p.end)}</span>${p.riskPct != null ? `<span>Riesgo ${num(p.riskPct, 2).replace(/,?0+$/, "")} %</span>` : ""}</div></div>${tFoot("Tú", "Tu plan de hoy", "plan")}`;
      }
    }
    return "";
  }
  function pageInfo(k, D) {
    const T = (S.btTrades || []), sim = T.filter(t => t.r != null), sst = tradeStats(sim.map(t => ({ r: +t.r, status: "closed" })));
    const mth = closed(S.trades.filter(t => { const d = new Date(t.open_time), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })), mst = tradeStats(mth);
    const fe = {}; S.trades.forEach(t => { const f = (t.review || {}).feel; if (f) fe[f] = (fe[f] || 0) + 1; }); const topF = Object.entries(fe).sort((a, b) => b[1] - a[1])[0];
    const M = {
      hoy: [D.today.length + " de " + D.p.maxTrades + " operaciones", D.st.n ? fmtR(D.st.tot) : "—", D.today.length / (D.p.maxTrades || 3)],
      plan: ["Horario " + D.p.start + "–" + D.p.end, "Máx. " + D.p.maxTrades, null],
      informe: [new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }), D.st.n ? fmtR(D.st.tot) : "—", null],
      noticias: [D.nextHigh ? D.nextHigh.country + " · " + D.nextHigh.title : "Esta semana y la siguiente", D.nextHigh ? hhmm(D.nextHigh.ts) : "—", null],
      analizar: ["Gráfico con tus herramientas", (S.an && S.an.sym) || "EURUSD", null],
      backtest: [D.sess.length + (D.sess.length === 1 ? " sesión" : " sesiones"), D.sess[0] ? esc(D.sess[0].name) : "Nueva", null],
      btanalisis: ["Tiempo de estudio", BT() ? BT().hms(D.sess.reduce((a, x) => a + (x.secs || 0), 0)) : "—", null],
      btops: [sim.length + " simuladas", sst.n ? fmtR(sst.tot) : "—", sst.win != null ? sst.win / 100 : null],
      btcal: ["Resultado simulado por día", sst.n ? fmtR(sst.tot) : "—", null],
      btnotas: ["Notas de práctica", String((S.pages || []).filter(x => !x.isTpl && (x.bt || x.tpl === "bt")).length), null],
      rendimiento: ["Últimos 90 días", D.s90.n ? fmtR(D.s90.tot) : "—", D.s90.win != null ? D.s90.win / 100 : null],
      progreso: ["Tu evolución por semanas", D.n90 ? Math.round(D.good / D.n90 * 100) + " %" : "—", D.n90 ? D.good / D.n90 : null],
      emociones: [healthOk() ? (topF ? "La más frecuente" : "Sin emociones anotadas") : "Actívalo en Mi plan", healthOk() && topF ? esc(topF[0]) : "—", null],
      historial: [S.allTrades.length + " operaciones", D.s90.n ? num(D.s90.win, 0) + " %" : "—", null],
      calendario: ["Este mes", mst.n ? fmtR(mst.tot) : "—", null],
      diario: [D.pages.length + (D.pages.length === 1 ? " página" : " páginas"), D.pages[0] ? ago(D.pages[0].updated) : "—", null],
      cuentas: [(S.accts || []).length + " cuentas", selAcct() ? esc(acctName(selAcct().a)) : "Todas", null],
      finanzas: [inSession(D.p) ? "Disponible al terminar tu horario" : "Cobros y gastos", inSession(D.p) ? I('<rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>', 16) : "→", null],
      asistente: ["Responde con tus datos", "R", null],
      aprender: ["Lecciones del bootcamp", "Pronto", null],
      grupo: ["Disciplina compartida", "Pronto", null]
    };
    return M[k] || ["", "", null];
  }
  function hPanel(t, D) {
    const [k, name, , pages] = t;
    return `<div class="hb-ph"><h2>${esc(name)}</h2><span class="hb-time mono">${hhmm(Date.now())}</span></div>
      <div class="hb-pg">${pages.map(([pk, pl], i) => { const [s, v, f] = pageInfo(pk, D); return `<a class="hb-pc ${i === 0 && pages.length % 2 ? "wide" : ""}" href="#${pk}"><span class="hb-pci">${ico(pk, 22)}</span><b>${esc(pl)}</b><small>${s}</small>
        <span class="hb-pcv mono">${v}</span>${f != null ? `<span class="hb-pcb"><i style="width:${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)}%"></i></span>` : ""}<span class="hb-pco">Abrir ${I(ARW, 14, 2)}</span></a>`; }).join("")}</div>`;
  }
  V.inicio = {
    view() {
      if (!S.news && window.tkLoadNews) tkLoadNews().then(() => { if (location.hash === "#inicio" || location.hash === "") re(); });
      if (!S.btLoaded && BT()) BT().loadSessions().then(() => { if (location.hash === "#inicio" || location.hash === "") re(); });
      if (!S.pagesLoaded && DI()) DI().loadPages().then(() => { if (location.hash === "#inicio" || location.hash === "") re(); });
      const D = hData(), g = S.hbG || "todo", sel = lsGet("tk-homesel", "hoy"), T = TILES.filter(t => g === "todo" || t[2] === g), cur = TILES.find(t => t[0] === sel) || TILES[0];
      const first = esc((S.name || "").split(" ")[0] || "trader");
      const l2 = D.phase === "antes" ? `tu sesión empieza a las ${esc(D.p.start)}.` : D.phase === "en" ? "opera tu plan con calma." : D.today.length ? "buen trabajo hoy." : "que tengas un buen día.";
      return `<div class="hb">
        <section class="hb-l">
          <div class="hb-meta"><span>${I(IC.cal, 15)} ${cap(new Date().toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }))}</span><span>${I('<path d="M3 14l4-5 4 3 6-8"/>', 15)} ${D.st.n ? fmtR(D.st.tot) + " hoy" : "Sin operaciones hoy"}</span><span>${I(IC.clock, 15)} ${D.phase === "en" ? "En tu horario" : D.phase === "antes" ? "Antes de tu horario" : "Fuera de horario"}</span>
            <button type="button" class="hb-sb" data-pal aria-label="Buscar (Ctrl/⌘ K)" title="Buscar (Ctrl/⌘ K)">${I(IC.search, 16)}</button></div>
          <h1 class="hb-hi">Hola, ${first},<br>${l2}</h1>
          <div class="hb-chipsrow"><div class="xpop"><button type="button" class="hb-add" data-hadd aria-haspopup="true" aria-expanded="false" aria-label="Crear">${I(IC.plus, 18, 2.2)}</button><div class="xpopm" id="hAddM" hidden>${actions().slice(0, 6).map((a, i) => `<button type="button" class="xpopb" data-pa="${i}">${esc(a[0])}</button>`).join("")}</div></div>
            <div class="hb-g" role="group" aria-label="Filtrar aplicaciones">${HGRP.map(([k, l]) => `<button type="button" data-hg="${k}" aria-pressed="${g === k}">${l}</button>`).join("")}</div></div>
          <div class="hb-grid">${T.map(t => `<div class="hb-t t-${t[0]}" role="button" tabindex="0" data-ht="${t[0]}" aria-pressed="${cur[0] === t[0]}" aria-label="${esc(t[1])}: ver opciones">${tileBody(t[0], D)}</div>`).join("")}</div>
        </section>
        <aside class="hb-r" id="hbPanel" aria-live="polite">${hPanel(cur, D)}</aside>
      </div>`;
    },
    bind() {
      const D0 = () => hData();
      $$("[data-pal]").forEach(b => b.onclick = palette);
      $$("[data-hg]").forEach(b => b.onclick = () => { S.hbG = b.dataset.hg; re(); });
      const pick = k => { lsSet("tk-homesel", k); $$("[data-ht]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.ht === k))); const t = TILES.find(x => x[0] === k), P = $("#hbPanel"); P.innerHTML = hPanel(t, D0()); P.classList.remove("in"); void P.offsetWidth; P.classList.add("in"); if (innerWidth < 1024) P.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $$("[data-ht]").forEach(el => {
        el.addEventListener("click", e => { if (e.target.closest("[data-stop]")) return; pick(el.dataset.ht); });
        el.addEventListener("keydown", e => { if (e.target !== el) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(el.dataset.ht); } });
        el.addEventListener("dblclick", e => { if (e.target.closest("[data-stop]")) return; const t = TILES.find(x => x[0] === el.dataset.ht); location.hash = "#" + t[3][0][0]; });
      });
      $$("[data-tfs]").forEach(b => b.onclick = () => { const cur = lsGet("tk-tf", "5m"), i = Math.max(0, TFQ.indexOf(cur)), n = TFQ[Math.max(0, Math.min(TFQ.length - 1, i + +b.dataset.tfs))]; lsSet("tk-tf", n); re(); });
      $$("[data-btcyc]").forEach(b => b.onclick = () => { const n = (S.bts || []).length; S.hbBt = ((S.hbBt || 0) + +b.dataset.btcyc + n) % n; re(); });
      $$("[data-btplay]").forEach(b => b.onclick = () => { const x = (S.bts || []).find(y => y.id === b.dataset.btplay); if (x && BT()) BT().run(x); });
      $$("[data-btnew]").forEach(b => b.onclick = () => { location.hash = "#backtest"; setTimeout(() => BT() && BT().drawer(), 60); });
      $$("[data-ask]").forEach(a => a.onclick = () => { S.asPrefill = a.dataset.ask; });
      const ab = $("[data-hadd]"), am = $("#hAddM");
      if (ab) { ab.onclick = e => { e.stopPropagation(); am.hidden = !am.hidden; ab.setAttribute("aria-expanded", String(!am.hidden)); }; am.onclick = e => { const a = e.target.closest("[data-pa]"); if (a) { am.hidden = true; actions()[+a.dataset.pa][2](); } }; document.addEventListener("click", function off() { if (!document.body.contains(am)) return document.removeEventListener("click", off); am.hidden = true; ab.setAttribute("aria-expanded", "false"); }); }
    }
  };

  /* ---------- buscador (Inicio y Ctrl/⌘ K) ---------- */
  function actions() {
    return [
      ["Nueva sesión de backtesting", "Acción", () => { location.hash = "#backtest"; setTimeout(() => BT() && BT().drawer(), 60); }],
      ["Nueva página del diario", "Acción", async () => { const D = DI(); await D.loadPages(); const p = D.newPage(null); await D.savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); }],
      ["Añadir operación a mano", "Acción", () => { location.hash = "#historial"; setTimeout(() => window.tkAddTrade && tkAddTrade(), 60); }],
      ["Registrar emoción", "Acción", () => window.tkEmoModal && tkEmoModal()],
      ["Añadir movimiento de dinero", "Acción", () => { location.hash = "#finanzas"; setTimeout(finModal, 60); }],
      ["Cambiar estilo y colores", "Acción", stylePanel],
      ["Informe de hoy", "Acción", () => { S.repDay = todayKey(); location.hash = "#informe"; }]
    ];
  }
  function searchAll(q) {
    q = norm(q).trim(); if (!q) return [];
    const out = [];
    NAV_APPS.forEach(([ak, al, items]) => items.forEach(([k, l]) => { if (norm(al + " " + l).includes(q)) out.push({ t: l, s: al, go: () => location.hash = "#" + k, i: k }); }));
    actions().forEach(([t, s, fn]) => { if (norm(t).includes(q)) out.push({ t, s, go: fn, i: "mas" }); });
    (S.pages || []).forEach(p => { if (norm((p.title || "") + " " + DI().txt(p.html)).includes(q)) out.push({ t: p.title || "Sin título", s: p.isTpl ? "Plantilla" : "Página del diario", go: () => location.hash = "#diario/" + encodeURIComponent(p.id), i: "diario" }); });
    (S.bts || []).forEach(x => { if (norm(x.name + " " + (x.syms || []).join(" ")).includes(q)) out.push({ t: x.name, s: "Sesión de backtesting", go: () => location.hash = "#backtest", i: "backtest" }); });
    const tr = S.trades.filter(t => norm(t.symbol).includes(q)).slice(0, 6);
    tr.forEach(t => out.push({ t: `${t.symbol} · ${t.side === "buy" ? "Compra" : "Venta"} · ${fmtDT(t.open_time)}`, s: t.status === "closed" ? fmtR(t.r) : "Abierta", go: () => location.hash = "#op/" + encodeURIComponent(t.id), i: "historial" }));
    return out.slice(0, 12);
  }
  function bindSearch(inp, box, onGo) {
    if (!inp) return;
    if (!S.pagesLoaded && DI()) DI().loadPages();
    if (!S.btLoaded && BT()) BT().loadSessions();
    let R = [], ix = 0;
    const paint = () => { R = searchAll(inp.value); ix = 0; if (!inp.value.trim()) { box.hidden = true; return; } box.innerHTML = R.length ? R.map((r, i) => `<button type="button" role="option" data-ri="${i}" aria-selected="${i === ix}">${ico(r.i, 17)}<span><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span></button>`).join("") : `<div class="small muted" style="padding:12px">Nada con «${esc(inp.value)}».</div>`; box.hidden = false; };
    const go = i => { const r = R[i]; if (!r) return; box.hidden = true; inp.value = ""; onGo && onGo(); r.go(); };
    inp.addEventListener("input", paint);
    inp.addEventListener("keydown", e => { if (box.hidden) return; if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); ix = (ix + (e.key === "ArrowDown" ? 1 : -1) + R.length) % Math.max(1, R.length); box.querySelectorAll("[data-ri]").forEach((b, j) => b.setAttribute("aria-selected", String(j === ix))); } else if (e.key === "Enter") { e.preventDefault(); go(ix); } else if (e.key === "Escape") { box.hidden = true; } });
    box.addEventListener("mousedown", e => { const b = e.target.closest("[data-ri]"); if (b) { e.preventDefault(); go(+b.dataset.ri); } });
    inp.addEventListener("blur", () => setTimeout(() => { box.hidden = true; }, 120));
  }
  function palette() {
    if ($(".xpal")) return;
    const box = document.createElement("div"); box.className = "xmodal xpal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Buscar");
    box.innerHTML = `<div class="xmodal-card" style="max-width:620px;overflow:visible"><label class="hm-search pal">${I(IC.search, 18)}<input id="palQ" placeholder="Busca páginas, operaciones, sesiones o acciones…" autocomplete="off" aria-label="Buscar"><kbd>Esc</kbd></label><div class="hm-res pal" id="palRes" hidden role="listbox"></div>
      <div class="pal-sug">${actions().slice(0, 5).map((a, i) => `<button type="button" class="chipb" data-pa="${i}">${esc(a[0])}</button>`).join("")}</div></div>`;
    const close = () => { box.remove(); document.removeEventListener("keydown", ek); }, ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => { if (e.target === box) return close(); const a = e.target.closest("[data-pa]"); if (a) { close(); actions()[+a.dataset.pa][2](); } });
    document.addEventListener("keydown", ek); document.body.appendChild(box);
    const inp = box.querySelector("#palQ"), res = box.querySelector("#palRes"); bindSearch(inp, res, close);
    inp.addEventListener("blur", () => {}); setTimeout(() => inp.focus(), 20);
  }

  /* ======================= RUTA, PESTAÑAS Y BOTÓN + ======================= */
  window.tkCrumb = function (view) {
    const app = appOf(view); if (!app) return "";
    const page = app[2].find(x => x[0] === view), many = app[2].length > 1;
    return `<div class="xcrumb"><nav class="xcrumb-l" aria-label="Estás en"><a href="#${app[2][0][0]}">${esc(app[1])}</a>${many ? `<span aria-hidden="true">›</span><b>${esc(page[1])}</b>` : ""}</nav>
      <div class="xcrumb-r"><button type="button" class="xib" data-pal title="Buscar (Ctrl/⌘ K)" aria-label="Buscar">${I(IC.search, 17)}</button>
        <div class="xpop"><button type="button" class="xib xplus" data-plus aria-haspopup="true" aria-expanded="false" title="Crear" aria-label="Crear">${I(IC.plus, 17, 2.2)}</button><div class="xpopm right" id="plusM" hidden>${actions().slice(0, 5).map((a, i) => `<button type="button" class="xpopb" data-pa="${i}">${esc(a[0])}</button>`).join("")}</div></div></div></div>
      ${many ? `<nav class="xsubtabs" aria-label="${esc(app[1])}">${app[2].map(([k, l]) => `<a href="#${k}" ${k === view ? 'aria-current="page"' : ""}>${esc(l)}</a>`).join("")}</nav>` : ""}`;
  };
  window.tkShellBind = function (r) {
    const app = appOf(r.view); if (app && app[0] !== "inicio") lsSet("tk-lastapp", app[0]);
    $$("[data-pal]").forEach(b => b.onclick = palette);
    const pb = $("[data-plus]"), pm = $("#plusM");
    if (pb) { pb.onclick = e => { e.stopPropagation(); pm.hidden = !pm.hidden; pb.setAttribute("aria-expanded", String(!pm.hidden)); }; pm.onclick = e => { const a = e.target.closest("[data-pa]"); if (a) { pm.hidden = true; actions()[+a.dataset.pa][2](); } }; document.addEventListener("click", function off() { if (!document.body.contains(pm)) return document.removeEventListener("click", off); pm.hidden = true; pb.setAttribute("aria-expanded", "false"); }); }
    $$("[data-style-open]").forEach(b => b.onclick = stylePanel);
    const g = $("[data-guide]"); if (g) g.onclick = guidePop;
    const sc = $(".xsubtabs [aria-current]"); if (sc && sc.scrollIntoView) sc.parentNode.scrollLeft = sc.offsetLeft - 16;
  };
  if (!window.__tkKeys) {
    window.__tkKeys = true;
    document.addEventListener("keydown", e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && S.user && S.loaded) { e.preventDefault(); palette(); }
    });
  }

  /* ======================= GUÍA DE CONFIGURACIÓN ======================= */
  function guideSteps() {
    const done = lsGet("tk-guide-ok", {});
    const st = [
      ["acct", "Añade tu primera cuenta", "#cuentas", (S.accts || []).length > 0],
      ["mt5", "Conecta MetaTrader 5", "#plan", (S.bridges || []).length > 0],
      ["plan", "Completa tu plan", "#plan", !!(S.planDoc && S.planDoc.current)],
      ["emo", "Activa el registro de emociones", "#plan", healthOk()],
      ["bt", "Crea una sesión de backtesting", "#backtest", (S.bts || []).length > 0],
      ["page", "Escribe tu primera página", "#diario", (S.pages || []).some(p => !p.isTpl)]
    ];
    let ch = false; st.forEach(s => { if (s[3] && !done[s[0]]) { done[s[0]] = 1; ch = true; } s[3] = s[3] || !!done[s[0]]; }); if (ch) lsSet("tk-guide-ok", done);
    return st;
  }
  window.tkGuide = function () {
    if (lsGet("tk-guide-off", false)) return "";
    const st = guideSteps(), n = st.filter(s => s[3]).length; if (n === st.length) return "";
    return `<button type="button" class="guide" data-guide aria-haspopup="dialog" title="Guía de configuración"><span class="guide-r">${ring(n / st.length * 100, 26)}</span><span class="nl"><b>Guía de configuración</b><small>${n} de ${st.length} pasos</small></span></button>`;
  };
  function guidePop() {
    const st = guideSteps(), old = $(".guidepop"); if (old) { old.remove(); return; }
    const b = $("[data-guide]"), r = b.getBoundingClientRect(), box = document.createElement("div"); box.className = "guidepop"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Guía de configuración");
    box.innerHTML = `<div class="between"><b>Guía de configuración</b><button type="button" class="xib" data-gx aria-label="Cerrar">${I(IC.x, 15, 2)}</button></div><p class="small muted" style="margin:4px 0 10px">Deja Tickora listo en unos minutos.</p>
      ${st.map(([k, l, h, ok]) => `<a class="gstep ${ok ? "ok" : ""}" href="${h}"><span class="gck">${ok ? I(IC.check, 13, 2.6) : ""}</span>${l}</a>`).join("")}
      <button type="button" class="link small" data-goff style="margin-top:10px">No volver a mostrar</button>`;
    box.style.left = Math.min(r.left, innerWidth - 300) + "px"; box.style.bottom = (innerHeight - r.top + 8) + "px";
    document.body.appendChild(box);
    const close = () => { box.remove(); document.removeEventListener("click", off, true); };
    const off = e => { if (!box.contains(e.target) && !e.target.closest("[data-guide]")) close(); };
    setTimeout(() => document.addEventListener("click", off, true), 0);
    box.querySelector("[data-gx]").onclick = close; box.querySelectorAll(".gstep").forEach(a => a.addEventListener("click", close));
    box.querySelector("[data-goff]").onclick = () => { lsSet("tk-guide-off", true); close(); re(); };
  }

  /* ======================= ESTILOS ======================= */
  const PRESETS = [
    ["base", "Fundamental", [["cobalto", "Cobalto", "#2443c7", "#4f7dff"], ["clasico", "Clásico", "#1f2937", "#cbd5e1"]]],
    ["mas", "Adicional", [["indigo", "Índigo", "#4338ca", "#818cf8"], ["oceano", "Océano", "#0e7490", "#22b8cf"], ["violeta", "Violeta", "#6d28d9", "#a78bfa"], ["ambar", "Ámbar", "#b45309", "#f5a524"], ["fucsia", "Fucsia", "#be185d", "#f472b6"], ["pino", "Pino", "#166534", "#34d399"], ["cielo", "Cielo", "#0369a1", "#38bdf8"], ["grafito", "Grafito", "#334155", "#94a3b8"]]]
  ];
  const hex2rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
  function styleCss(lc, dc) {
    const L = `--cobalto:${lc};--cobalto2:${mix(lc, "#000000", .35)};--btn:${lc};--cobaltoC:${mix(lc, "#ffffff", .9)};--cobaltoA:${rgba(lc, .14)};`;
    const D = `--cobalto:${dc};--cobalto2:${mix(dc, "#ffffff", .3)};--btn:${mix(dc, "#000000", .12)};--cobaltoC:${mix(dc, "#0f1729", .78)};--cobaltoA:${rgba(dc, .2)};--glow:${rgba(dc, .2)};`;
    return `:root{${L}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${D}}}:root[data-theme="dark"]{${D}}`;
  }
  function applyStyle() {
    const st = lsGet("tk-style", null); let el = document.getElementById("tkStyle");
    if (!st || st.id === "cobalto") { if (el) el.remove(); return; }
    const p = st.id === "custom" ? ["custom", "", st.l, st.d] : PRESETS.flatMap(g => g[2]).find(x => x[0] === st.id); if (!p) return;
    if (!el) { el = document.createElement("style"); el.id = "tkStyle"; document.head.appendChild(el); }
    el.textContent = styleCss(p[2], p[3]);
  }
  applyStyle();
  function stylePanel() {
    const cur = lsGet("tk-style", { id: "cobalto" }); let tab = cur.id === "custom" ? "custom" : "pre", pick = cur.id, cl = cur.l || "#2443c7", cd = cur.d || "#4f7dff";
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Estilo y colores");
    const sw = (l, d) => `<span class="stsw"><i style="background:${l}"></i><i style="background:${d}"></i></span>`;
    const paint = () => {
      box.innerHTML = `<div class="xdrawer-p">
        <div class="xdr-h"><div class="xdr-tabs" role="tablist"><button type="button" role="tab" data-st="pre" aria-selected="${tab === "pre"}">Estilos predefinidos</button><button type="button" role="tab" data-st="custom" aria-selected="${tab === "custom"}">Estilo personalizado</button></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
        <div class="xdr-b">${tab === "pre" ? PRESETS.map(([g, gl, L]) => `<div class="xsec">${gl}</div><div class="stgrid">${L.map(([id, n, l, d]) => `<button type="button" class="stc" data-pick="${id}" aria-pressed="${pick === id}"><b>${n}</b><span class="stline" style="--a:${isDark() ? d : l}"></span>${sw(l, d)}</button>`).join("")}</div>`).join("")
          : `<div class="xsec">Color principal en modo claro</div><div class="stcp"><input type="color" data-cl value="${cl}" aria-label="Color en modo claro"><input class="input mono" data-clt value="${cl}" maxlength="7" aria-label="Código del color en modo claro"><span class="stprev" style="background:${cl}"></span></div>
             <div class="xsec">Color principal en modo oscuro</div><div class="stcp"><input type="color" data-cd value="${cd}" aria-label="Color en modo oscuro"><input class="input mono" data-cdt value="${cd}" maxlength="7" aria-label="Código del color en modo oscuro"><span class="stprev" style="background:${cd}"></span></div>
             <div class="small muted">Se usa en botones, enlaces, el menú y los gráficos.</div>`}
          <div class="callout" style="margin-top:6px">${I('<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5M10 6.5v.01"/>', 18)}<div class="small">Los resultados se siguen mostrando en R y sin rojo ni verde, como pusiste en tu plan: así juzgas el proceso y no el dinero.</div></div>
        </div>
        <div class="xdr-f"><span class="row" style="gap:6px">${sw(tab === "custom" ? cl : (PRESETS.flatMap(g => g[2]).find(x => x[0] === pick) || [, , "#2443c7"])[2], tab === "custom" ? cd : (PRESETS.flatMap(g => g[2]).find(x => x[0] === pick) || [, , , "#4f7dff"])[3])}</span><span style="flex:1"></span><button type="button" class="btn2" data-reset style="height:40px">Restablecer</button><button type="button" class="btn" data-save style="height:40px">Guardar estilo</button></div></div>`;
    };
    const preview = () => { const v = tab === "custom" ? { id: "custom", l: cl, d: cd } : { id: pick }; const prev = lsGet("tk-style", null); lsSet("tk-style", v); applyStyle(); lsSet("tk-style", prev); };
    const close = (keep) => { if (!keep) applyStyle(); box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", ek); };
    const ek = e => { if (e.key === "Escape") close(); };
    const okHex = v => /^#[0-9a-f]{6}$/i.test(v);
    box.addEventListener("input", e => {
      const t = e.target;
      if (t.matches("[data-cl]")) { cl = t.value; box.querySelector("[data-clt]").value = cl; box.querySelectorAll(".stprev")[0].style.background = cl; preview(); }
      if (t.matches("[data-cd]")) { cd = t.value; box.querySelector("[data-cdt]").value = cd; box.querySelectorAll(".stprev")[1].style.background = cd; preview(); }
      if (t.matches("[data-clt]") && okHex(t.value)) { cl = t.value; box.querySelector("[data-cl]").value = cl; preview(); }
      if (t.matches("[data-cdt]") && okHex(t.value)) { cd = t.value; box.querySelector("[data-cd]").value = cd; preview(); }
    });
    box.addEventListener("click", e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.st) { tab = b.dataset.st; paint(); preview(); }
      else if (b.dataset.pick) { pick = b.dataset.pick; paint(); preview(); }
      else if (b.hasAttribute("data-reset")) { lsSet("tk-style", { id: "cobalto" }); applyStyle(); close(true); toast("Estilo restablecido"); }
      else if (b.hasAttribute("data-save")) { lsSet("tk-style", tab === "custom" ? { id: "custom", l: cl, d: cd } : { id: pick }); applyStyle(); close(true); toast("Estilo guardado"); }
    });
    document.addEventListener("keydown", ek); paint(); document.body.appendChild(box); requestAnimationFrame(() => box.classList.add("in"));
  }

  /* ======================= SEGUIMIENTO: RENDIMIENTO ======================= */
  function score(L) {
    const st = tradeStats(L); if (st.n < 5) return null;
    const C = closed(L), plan = C.filter(t => evaluate(t).good).length / C.length;
    const w = Math.min(1, st.win / 60), pf = st.pf === Infinity ? 1 : Math.max(0, Math.min(1, (st.pf - .5) / 1.5)), rr = st.avgW != null && st.avgL ? Math.min(1, Math.abs(st.avgW / st.avgL) / 2) : (st.avgW != null ? 1 : 0), dd = 1 - Math.min(1, Math.abs(st.dd) / 10);
    return Math.round(100 * (.2 * w + .25 * pf + .15 * rr + .25 * plan + .15 * dd));
  }
  const PERS = [["30", "30 días"], ["90", "90 días"], ["365", "1 año"], ["all", "Todo"]];
  const perFilter = (L, per, key) => per === "all" ? L : L.filter(t => new Date(t[key || "open_time"]) >= Date.now() - (+per) * 864e5);
  V.rendimiento = {
    view() {
      const per = S.rendPer || "90", L = perFilter(S.trades, per), C = closed(L).sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), st = tradeStats(L), sc = score(L);
      const best = C.length ? C.reduce((a, b) => b.r > a.r ? b : a) : null, worst = C.length ? C.reduce((a, b) => b.r < a.r ? b : a) : null;
      const rr = st.avgW != null && st.avgL ? Math.abs(st.avgW / st.avgL) : null, wins = C.filter(t => t.r > 0).length, losses = C.filter(t => t.r < 0).length;
      let cum = 0, peak = 0; const curve = [0], ddc = [0]; C.forEach(t => { cum += t.r; peak = Math.max(peak, cum); curve.push(cum); ddc.push(cum - peak); });
      const f0 = C.length ? fmtD(C[0].open_time) : "", f1 = C.length ? fmtD(C[C.length - 1].open_time) : "";
      const byDow = DOW.map((l, i) => { const x = C.filter(t => (new Date(t.open_time).getDay() + 6) % 7 === i); return { l, v: x.reduce((a, t) => a + t.r, 0), n: x.length }; });
      const hrs = {}; C.forEach(t => { const h = new Date(t.open_time).getHours(); (hrs[h] = hrs[h] || []).push(t); });
      const byHr = Object.keys(hrs).map(Number).sort((a, b) => a - b).map(h => ({ l: h + "h", v: hrs[h].reduce((a, t) => a + t.r, 0), n: hrs[h].length }));
      const bySym = {}; C.forEach(t => (bySym[t.symbol] = bySym[t.symbol] || []).push(t));
      const accts = (S.accts || []).filter(a => a.number).map(a => { const T = closed(perFilter(S.allTrades.filter(t => String(t.account || "") === String(a.number)), per)); return { a, st: tradeStats(T) }; }).filter(x => x.st.n);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Rendimiento</h1><div class="small muted">${st.n} operaciones cerradas${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""} · todo en R</div></div>
          <div class="pseg" role="group" aria-label="Periodo">${PERS.map(([k, l]) => `<button type="button" data-rper="${k}" aria-pressed="${per === k}">${l}</button>`).join("")}</div></div>
        <div class="xkgrid">
          ${kpi("Resultado neto", st.n ? fmtR(st.tot) : "—", st.n + " operaciones", spark(curve, 96, 40), "Suma de todas las operaciones cerradas del periodo")}
          ${kpi("Factor de beneficio", fpf(st.pf), "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)), "Por encima de 1 ganas más de lo que pierdes")}
          ${kpi("Mejor frente a peor", best ? `<span style="font-size:.78em;white-space:nowrap">${fmtR(best.r)} / ${fmtR(worst.r)}</span>` : "—", best ? `${esc(best.symbol)} · ${esc(worst.symbol)}` : "", best ? meter(Math.max(0, best.r), Math.abs(Math.min(0, worst.r)), "mejor", "peor") : "", "Tu mejor y tu peor operación del periodo")}
          ${kpi("Ganancia media", st.avgW != null ? fmtR(st.avgW) : "—", wins + " ganadoras", "", "Lo que ganas de media en cada operación ganadora")}
          ${kpi("Relación ganancia / pérdida", rr != null ? num(rr, 2) : "—", st.avgL != null ? "pérdida media " + fmtR(st.avgL) : "", ring(rr == null ? 0 : Math.min(100, rr / 3 * 100)), "Ganancia media dividida entre la pérdida media")}
          ${kpi("Esperanza", st.exp != null ? fmtR(st.exp) : "—", "por operación", "", "Lo que ganas o pierdes de media por operación")}
          ${kpi("Puntuación Tickora", sc == null ? "—" : sc + " / 100", sc == null ? "Necesita 5 operaciones" : "acierto, beneficio, relación, plan y caída", ring(sc || 0), "Mezcla tu acierto (20 %), factor de beneficio (25 %), relación ganancia/pérdida (15 %), cumplimiento del plan (25 %) y caída máxima (15 %)")}
          ${kpi("Ganadoras frente a perdedoras", st.win == null ? "—" : num(st.win, 0) + " %", "", C.length ? meter(wins, losses, wins + " ganadoras", losses + " perdedoras") : "", "Porcentaje de operaciones ganadoras")}
        </div>
        <div class="xg3">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Curva de resultado</h2>${lineChart(curve, { from: f0, to: f1, label: "Resultado acumulado en R", emptyText: "Aún no hay datos. Conecta MT5 o añade operaciones." })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Caída desde el máximo</h2>${lineChart(ddc, { from: f0, to: f1, dd: true, label: "Caída desde el máximo en R", emptyText: "Aún no hay datos." })}<div class="small muted">Peor caída: <b class="mono">${fmtR(st.dd)}</b></div></div>
          <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Crecimiento de las cuentas</h2><a class="btn2" href="#cuentas" style="height:32px">${I(IC.plus, 14, 2)} Añadir cuenta</a></div>
            ${accts.length ? `<div class="stack" style="gap:10px">${accts.map(x => `<a class="racc" href="#cuentas"><div class="between"><b>${esc(acctName(x.a))}</b><span class="mono">${fmtR(x.st.tot)}</span></div>${spark(x.st.curve, 260, 34)}<span class="small muted">${x.st.n} op. · ${num(x.st.win, 0)} % acierto</span></a>`).join("")}</div>` : `<div class="xchart-empty">${(S.accts || []).length ? "Tus cuentas aún no tienen operaciones en este periodo." : "Aún no hay cuentas. Añade una para ver cómo crece cada una."}</div>`}</div>
        </div>
        <div class="xg2">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por día de la semana</h2>${barsV(byDow, { label: "Resultado por día" })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por hora de entrada</h2>${barsV(byHr, { label: "Resultado por hora" })}</div>
        </div>
        <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por mercado</h2>
          <div class="xtablewrap"><table class="xtable"><thead><tr><th>Mercado</th><th>Operaciones</th><th>Acierto</th><th>Factor de beneficio</th><th>Esperanza</th><th>Resultado</th></tr></thead><tbody>
          ${Object.entries(bySym).map(([k, l]) => [k, tradeStats(l)]).sort((a, b) => b[1].tot - a[1].tot).map(([k, s]) => `<tr><td><b>${esc(k)}</b></td><td class="mono">${s.n}</td><td class="mono">${num(s.win, 0)} %</td><td class="mono">${fpf(s.pf)}</td><td class="mono">${fmtR(s.exp)}</td><td class="mono"><b>${fmtR(s.tot)}</b></td></tr>`).join("") || `<tr><td colspan="6" class="muted" style="padding:16px">Sin operaciones en este periodo.</td></tr>`}</tbody></table></div></div>
      </div>`;
    },
    bind() { $$("[data-rper]").forEach(b => b.onclick = () => { S.rendPer = b.dataset.rper; re(); }); }
  };

  /* ======================= CALENDARIO (real y de backtesting) ======================= */
  function calendar(key, L, opts) {
    const st = S[key] || (S[key] = { y: new Date().getFullYear(), m: new Date().getMonth(), mode: "mes" });
    const byDay = {}; L.forEach(t => { const d = dayKey(dateOf(t)); (byDay[d] = byDay[d] || []).push(t); });
    const dayStats = l => tradeStats(l);
    if (st.mode === "anio") {
      const months = MESES_L.map((ml, m) => { const l = L.filter(t => { const d = new Date(dateOf(t)); return d.getFullYear() === st.y && d.getMonth() === m; }); return { m, ml, st: tradeStats(l) }; });
      const tot = months.reduce((a, x) => a + x.st.tot, 0), n = months.reduce((a, x) => a + x.st.n, 0);
      return `<div class="card stack" style="gap:14px"><div class="calh"><div><h2 class="h2b">${opts.title}</h2><div class="calbig mono">${n ? fmtR(tot) : "0,0 R"}</div><div class="small muted">${n} operaciones en ${st.y}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><div class="pseg" role="group"><button type="button" data-cmode="mes" aria-pressed="false">Mensual</button><button type="button" data-cmode="anio" aria-pressed="true">Anual</button></div>
        <div class="calnav"><button type="button" class="xpb" data-cnav="-1" aria-label="Año anterior">${I(IC.left, 16, 2)}</button><b>${st.y}</b><button type="button" class="xpb" data-cnav="1" aria-label="Año siguiente">${I(IC.right, 16, 2)}</button></div></div></div>
        <div class="calyear">${months.map(x => `<button type="button" class="calm ${x.st.n ? "has" : ""}" data-cmonth="${x.m}"><b>${cap(x.ml)}</b><span class="mono">${x.st.n ? fmtR(x.st.tot) : "—"}</span><small>${x.st.n ? x.st.n + " op. · " + num(x.st.win, 0) + " %" : "sin operaciones"}</small></button>`).join("")}</div></div>`;
    }
    const first = new Date(st.y, st.m, 1), off = (first.getDay() + 6) % 7, days = new Date(st.y, st.m + 1, 0).getDate(), weeks = Math.ceil((off + days) / 7);
    const monthL = L.filter(t => { const d = new Date(dateOf(t)); return d.getFullYear() === st.y && d.getMonth() === st.m; }), mst = tradeStats(monthL);
    const mxAbs = Math.max(0.5, ...Object.entries(byDay).filter(([k]) => k.startsWith(st.y + "-" + String(st.m + 1).padStart(2, "0"))).map(([, l]) => Math.abs(dayStats(l).tot)));
    let grid = DOW.map(d => `<div class="calwd">${d}</div>`).join("") + `<div class="calwd">Semana</div>`;
    const W = [];
    for (let w = 0; w < weeks; w++) {
      const wl = [];
      for (let c = 0; c < 7; c++) {
        const dn = w * 7 + c - off + 1, dt = new Date(st.y, st.m, dn), k = dayKey(dt), inM = dn >= 1 && dn <= days, l = byDay[k] || [], s = dayStats(l);
        if (inM) wl.push(...l);
        const a = s.n ? Math.min(1, Math.abs(s.tot) / mxAbs) : 0;
        grid += `<${s.n && opts.click ? "button type=\"button\"" : "div"} class="calc ${inM ? "" : "out"} ${s.n ? "has" : ""} ${s.tot < 0 ? "neg" : ""} ${k === todayKey() ? "today" : ""}" ${s.n && opts.click ? `data-cday="${k}"` : ""} style="${s.n && s.tot >= 0 ? `--a:${(.12 + a * .5).toFixed(2)}` : ""}"><span class="cald">${dt.getDate()}</span>${s.n ? `<b class="mono">${fmtR(s.tot)}</b><small>${s.n} op.${s.n ? " · " + num(s.win, 0) + " %" : ""}</small>` : ""}</${s.n && opts.click ? "button" : "div"}>`;
      }
      const ws = tradeStats(wl); W.push({ w: w + 1, l: wl, st: ws });
      grid += `<div class="calc calw"><span class="cald">Semana ${w + 1}</span>${ws.n ? `<b class="mono">${fmtR(ws.tot)}</b><small>${ws.n} op.</small>` : `<small>—</small>`}</div>`;
    }
    const wkRows = W.map(x => { const dd = {}; x.l.forEach(t => { const k = dayKey(dateOf(t)); dd[k] = (dd[k] || 0) + t.r; }); const vals = Object.entries(dd), b = vals.sort((a, c) => c[1] - a[1])[0], wv = vals.sort((a, c) => a[1] - c[1])[0];
      const fd = k => k ? new Date(k + "T12:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }) : "";
      return `<tr><td><b>Semana ${x.w}</b></td><td class="mono">${x.st.n || "—"}</td><td class="mono">${x.st.win == null ? "—" : num(x.st.win, 0) + " %"}</td><td class="mono">${x.st.avgW != null ? fmtR(x.st.avgW) : "—"}</td><td class="mono">${x.st.avgL != null ? fmtR(x.st.avgL) : "—"}</td><td class="mono">${b ? fmtR(b[1]) + ` <span class="muted small">${fd(b[0])}</span>` : "—"}</td><td class="mono">${wv ? fmtR(wv[1]) + ` <span class="muted small">${fd(wv[0])}</span>` : "—"}</td><td class="mono"><b>${x.st.n ? fmtR(x.st.tot) : "—"}</b></td></tr>`; }).join("");
    return `<div class="card stack" style="gap:14px"><div class="calh"><div><h2 class="h2b">${opts.title}</h2><div class="calbig mono">${mst.n ? fmtR(mst.tot) : "0,0 R"}</div><div class="small muted">${mst.n} operaciones · ${mst.win == null ? "—" : num(mst.win, 0) + " % de acierto"}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><div class="pseg" role="group"><button type="button" data-cmode="mes" aria-pressed="true">Mensual</button><button type="button" data-cmode="anio" aria-pressed="false">Anual</button></div>
        <div class="calnav"><button type="button" class="xpb" data-cnav="-1" aria-label="Mes anterior">${I(IC.left, 16, 2)}</button><b>${cap(MESES_L[st.m])} de ${st.y}</b><button type="button" class="xpb" data-cnav="1" aria-label="Mes siguiente">${I(IC.right, 16, 2)}</button></div>
        <button type="button" class="btn2" data-ctoday style="height:34px">Hoy</button></div></div>
      <div class="calwrap"><div class="calgrid">${grid}</div></div></div>
      <div class="card stack" style="gap:10px"><h2 class="h2b">Información mensual</h2><div class="xtablewrap"><table class="xtable"><thead><tr><th>Semana</th><th>Operaciones</th><th>% de acierto</th><th>Ganancia media</th><th>Pérdida media</th><th>Mejor día</th><th>Peor día</th><th>Resultado</th></tr></thead><tbody>${wkRows}</tbody></table></div></div>`;
  }
  function bindCal(key, onDay) {
    const st = S[key];
    $$("[data-cmode]").forEach(b => b.onclick = () => { st.mode = b.dataset.cmode; re(); });
    $$("[data-cnav]").forEach(b => b.onclick = () => { const d = +b.dataset.cnav; if (st.mode === "anio") st.y += d; else { st.m += d; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } } re(); });
    const t = $("[data-ctoday]"); if (t) t.onclick = () => { const n = new Date(); st.y = n.getFullYear(); st.m = n.getMonth(); re(); };
    $$("[data-cmonth]").forEach(b => b.onclick = () => { st.m = +b.dataset.cmonth; st.mode = "mes"; re(); });
    $$("[data-cday]").forEach(b => b.onclick = () => onDay && onDay(b.dataset.cday));
  }
  V.calendario = {
    view() { return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Calendario</h1><div class="small muted">Tu resultado de cada día y cada semana, en R. Toca un día para ver su informe.</div></div></div>${calendar("calS", closed(S.trades), { title: "Calendario mensual de resultados", click: true })}</div>`; },
    bind() { bindCal("calS", k => { S.repDay = k; location.hash = "#informe"; }); }
  };

  /* ======================= INFORME DIARIO ======================= */
  V.informe = {
    view() {
      const k = S.repDay || todayKey(), D = S.trades.filter(t => t.open_time && dayKey(t.open_time) === k).sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), C = closed(D), st = tradeStats(D);
      const good = C.filter(t => evaluate(t).good).length, dt = new Date(k + "T12:00");
      let cum = 0; const curve = [0].concat(C.map(t => cum += t.r));
      const bySym = {}; C.forEach(t => bySym[t.symbol] = (bySym[t.symbol] || 0) + t.r);
      if (healthOk() && !S.emoLoaded) loadEmo().then(() => { if (location.hash.startsWith("#informe")) re(); });
      if (!S.pagesLoaded && DI()) DI().loadPages().then(() => { if (location.hash.startsWith("#informe")) re(); });
      const emo = healthOk() ? (S.emoLog || []).filter(x => dayKey(x.ts) === k).sort((a, b) => a.ts - b.ts) : [], notes = (S.pages || []).filter(p => !p.isTpl && p.day === k);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Informe diario</h1><div class="small muted">${cap(dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</div></div>
          <div class="calnav"><button type="button" class="xpb" data-rday="-1" aria-label="Día anterior">${I(IC.left, 16, 2)}</button><label class="xdate"><input type="date" id="repD" value="${k}" max="${todayKey()}" aria-label="Día"></label><button type="button" class="xpb" data-rday="1" aria-label="Día siguiente" ${k >= todayKey() ? "disabled" : ""}>${I(IC.right, 16, 2)}</button><button type="button" class="btn2" data-rtoday style="height:34px">Hoy</button></div></div>
        <div class="xg-rep">
          <div class="stack" style="gap:12px">
            ${kpi("Resultado del día", st.n ? fmtR(st.tot) : "—", st.n + " de " + S.plan.maxTrades + " operaciones", "")}
            ${kpi("Caída máxima", st.n ? fmtR(st.dd) : "—", "desde el máximo del día", "")}
            ${kpi("Esperanza", st.exp != null ? fmtR(st.exp) : "—", st.win == null ? "" : num(st.win, 0) + " % de acierto", "")}
            ${kpi("Dentro del plan", C.length ? good + " de " + C.length : "—", C.length ? (good === C.length ? "Día limpio" : (C.length - good) + " evitable" + (C.length - good > 1 ? "s" : "")) : "", "")}
          </div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Métricas del día</h2>${lineChart(curve, { label: "Resultado acumulado del día", from: C.length ? new Date(C[0].open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "", to: C.length ? new Date(C[C.length - 1].close_time || C[C.length - 1].open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "", h: 220, emptyText: "Aún no hay datos este día." })}</div>
        </div>
        <div class="xg2 wide">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resumen de operaciones</h2>
            ${D.length ? `<div class="xtablewrap"><table class="xtable"><thead><tr><th>Hora</th><th>Símbolo</th><th>Dirección</th><th>Resultado</th><th>Duración</th><th>Plan</th>${healthOk() ? "<th>Emoción</th>" : ""}</tr></thead><tbody>${D.map(t => { const ev = t.status === "closed" ? evaluate(t) : null; return `<tr data-op="${esc(t.id)}" tabindex="0"><td class="mono">${new Date(t.open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</td><td><b>${esc(t.symbol)}</b></td><td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td><td class="mono"><b>${t.status === "closed" ? fmtR(t.r) : "Abierta"}</b></td><td class="mono">${dur(t.open_time, t.close_time)}</td><td>${ev ? (ev.good ? `<span class="xok">${I(IC.check, 14, 2.4)} Dentro</span>` : `<span class="xbad">${esc(ev.fail[0].bad)}</span>`) : "—"}</td>${healthOk() ? `<td>${esc((t.review || {}).feel || "—")}</td>` : ""}</tr>`; }).join("")}</tbody></table></div>` : `<div class="xchart-empty">No operaste este día.</div>`}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por símbolo</h2>${barsV(Object.entries(bySym).map(([l, v]) => ({ l, v })), { emptyText: "Aún no hay símbolos este día." })}</div>
        </div>
        <div class="xg2">
          ${healthOk() ? `<div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Emociones del día</h2>${k === todayKey() ? `<button type="button" class="btn2" data-remo style="height:32px">Registrar</button>` : ""}</div>${emo.length || C.some(t => (t.review || {}).feel) ? `<div class="elog">${emo.map(x => `<div class="elogi"><span class="elogd">${new Date(x.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span><b>${esc(x.feel)}</b><span class="xtag">${x.int}/5</span>${x.note ? `<span class="small elogn">${esc(x.note)}</span>` : ""}</div>`).join("")}${C.filter(t => (t.review || {}).feel).map(t => `<div class="elogi"><span class="elogd">${new Date(t.open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span><b>${esc(t.review.feel)}</b><span class="small muted">al entrar en ${esc(t.symbol)}</span></div>`).join("")}</div>` : `<div class="small muted">Nada registrado este día.</div>`}</div>` : ""}
          <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Notas del día</h2><button type="button" class="btn2" data-rnote style="height:32px">${I(IC.plus, 14, 2)} Escribir revisión</button></div>
            ${notes.length ? notes.map(p => `<a class="rnote" href="#diario/${encodeURIComponent(p.id)}"><b>${esc(p.title || "Sin título")}</b><span class="small muted">${esc(DI().txt(p.html).slice(0, 140))}</span></a>`).join("") : `<div class="small muted">Las páginas del diario que unas a este día aparecen aquí.</div>`}</div>
        </div></div>`;
    },
    bind() {
      const k = S.repDay || todayKey(), set = d => { S.repDay = d; re(); };
      $$("[data-rday]").forEach(b => b.onclick = () => { const d = new Date(k + "T12:00"); d.setDate(d.getDate() + +b.dataset.rday); set(dayKey(d)); });
      $("[data-rtoday]").onclick = () => set(todayKey());
      $("#repD").onchange = e => e.target.value && set(e.target.value);
      $$("[data-op]").forEach(tr => { tr.onclick = () => location.hash = "#op/" + encodeURIComponent(tr.dataset.op); tr.onkeydown = e => { if (e.key === "Enter") tr.click(); }; });
      const em = $("[data-remo]"); if (em) em.onclick = () => window.tkEmoModal && tkEmoModal();
      $("[data-rnote]").onclick = async () => { const D = DI(); await D.loadPages(); const tpl = D.TPL().find(x => x.id === "sesion"); const p = D.newPage(tpl); p.day = k; p.title = "Revisión del " + new Date(k + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" }); await D.savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); };
    }
  };

  /* ======================= BACKTESTING: ANÁLISIS, OPERACIONES, CALENDARIO, CUADERNO ======================= */
  const simAll = () => (S.btTrades || []).filter(t => t.r != null).map(t => Object.assign({}, t, { r: +t.r, status: "closed", open_time: t.exit_time || t.entry_time }));
  const sessName = id => { if (!id) return "Sin sesión"; const x = (S.bts || []).find(y => y.id === id); return x ? x.name : "Sesión borrada"; };
  const needBt = view => { if (!S.btLoaded && BT()) { BT().loadSessions().then(() => { if (location.hash.startsWith("#" + view)) re(); }); return true; } return false; };
  const sessSel = (cur, id) => `<select class="xsel" id="${id}" aria-label="Sesión"><option value="">Todas las sesiones</option><option value="__none" ${cur === "__none" ? "selected" : ""}>Práctica sin sesión</option>${(S.bts || []).map(x => `<option value="${esc(x.id)}" ${cur === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`;
  const bySess = (L, f) => !f ? L : f === "__none" ? L.filter(t => !t.session_id) : L.filter(t => t.session_id === f);
  const loading = () => `<div class="stack" style="gap:14px"><div class="xkgrid">${[0, 1, 2, 3].map(() => `<div class="xk bsskel"><i style="width:50%"></i><i style="width:30%;height:22px"></i></div>`).join("")}</div><div class="card bsskel" style="height:220px"></div></div>`;
  V.btanalisis = {
    view() {
      if (needBt("btanalisis")) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Análisis</h1></div></div>${loading()}</div>`;
      const f = S.btaF || "", L = bySess(simAll(), f).sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), st = tradeStats(L), sess = f && f !== "__none" ? (S.bts || []).filter(x => x.id === f) : (S.bts || []);
      const secs = sess.reduce((a, x) => a + (x.secs || 0), 0), bars = sess.reduce((a, x) => a + (x.bars || 0), 0), study = {}; sess.forEach(x => Object.entries(x.study || {}).forEach(([d, s]) => study[d] = (study[d] || 0) + s));
      const last14 = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); last14.push({ l: d.toLocaleDateString("es-ES", { day: "numeric" }), v: Math.round((study[k] || 0) / 60) }); }
      let cum = 0, peak = 0; const curve = [0], ddc = [0]; L.forEach(t => { cum += t.r; peak = Math.max(peak, cum); curve.push(cum); ddc.push(cum - peak); });
      const rr = st.avgW != null && st.avgL ? Math.abs(st.avgW / st.avgL) : null;
      const perS = (S.bts || []).map(x => { const s = tradeStats(simAll().filter(t => t.session_id === x.id)); return { l: x.name.length > 14 ? x.name.slice(0, 13) + "…" : x.name, v: s.tot, n: s.n }; }).filter(x => x.n);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Análisis</h1><div class="small muted">Tus estadísticas de práctica: operaciones simuladas, tiempo de estudio y velas repasadas</div></div>${sessSel(f, "btaF")}</div>
        <div class="xkgrid">
          ${kpi("Resultado neto", st.n ? fmtR(st.tot) : "—", st.n + " operaciones simuladas", spark(curve, 96, 40))}
          ${kpi("Factor de beneficio", fpf(st.pf), "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)))}
          ${kpi("Ganancia media frente a pérdida", rr != null ? num(rr, 2) : "—", st.avgW != null ? fmtR(st.avgW) + " / " + (st.avgL != null ? fmtR(st.avgL) : "—") : "", rr != null ? meter(st.avgW, Math.abs(st.avgL || 0), "ganancia", "pérdida") : "")}
          ${kpi("Tiempo invertido", BT().hms(secs), "practicando en sesiones", "")}
          ${kpi("Velas repasadas", bars.toLocaleString("es-ES"), "avanzando en backtesting", "")}
          ${kpi("Operaciones", st.n, "simuladas", "")}
          ${kpi("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", st.n ? L.filter(t => t.r > 0).length + " de " + st.n : "", ring(st.win))}
          ${kpi("Caída máxima", st.n ? fmtR(st.dd) : "—", "desde el máximo", "")}
        </div>
        <div class="xg2">
          <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Tiempo de estudio</h2><span class="small muted">minutos · últimos 14 días</span></div>${barsV(last14, { fmt: v => v + " min", label: "Minutos de estudio por día", emptyText: "Todavía no hay tiempo de estudio. Empieza una sesión y avanza velas." })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Curva de resultado</h2>${lineChart(curve, { label: "Resultado acumulado simulado", emptyText: "Aún no hay operaciones cerradas en backtesting." })}</div>
        </div>
        <div class="xg2">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Caída</h2>${lineChart(ddc, { dd: true, label: "Caída desde el máximo", emptyText: "Aún no hay operaciones cerradas." })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por sesión</h2>${barsV(perS, { label: "Resultado por sesión", emptyText: "Aún no hay operaciones en sesiones." })}</div>
        </div></div>`;
    },
    bind() { const s = $("#btaF"); if (s) s.onchange = () => { S.btaF = s.value; re(); }; }
  };
  V.btops = {
    view() {
      if (needBt("btops")) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Operaciones simuladas</h1></div></div>${loading()}</div>`;
      const o = S.bto || (S.bto = { f: "", q: "", side: "", page: 0, per: 25 });
      let L = bySess((S.btTrades || []).slice(), o.f); const q = norm(o.q);
      if (q) L = L.filter(t => norm(t.symbol + " " + sessName(t.session_id)).includes(q)); if (o.side) L = L.filter(t => t.side === o.side);
      L.sort((a, b) => new Date(b.exit_time || b.entry_time) - new Date(a.exit_time || a.entry_time));
      const st = tradeStats(L.filter(t => t.r != null).map(t => ({ r: +t.r, status: "closed", open_time: t.exit_time }))), pages = Math.max(1, Math.ceil(L.length / o.per)); if (o.page >= pages) o.page = pages - 1;
      const P = L.slice(o.page * o.per, (o.page + 1) * o.per);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Operaciones simuladas</h1><div class="small muted">Todo lo que has operado en backtesting, separado de tus operaciones reales</div></div><button type="button" class="btn2" id="btoCsv" style="height:38px">${I(IC.down, 16)} Exportar CSV</button></div>
        <div class="xkgrid">${kpi("Resultado neto", st.n ? fmtR(st.tot) : "—", st.n + " operaciones", spark(st.curve, 96, 40))}${kpi("Factor de beneficio", fpf(st.pf), "", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)))}${kpi("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", "", ring(st.win))}${kpi("Relación ganancia / pérdida", st.avgW != null && st.avgL ? num(Math.abs(st.avgW / st.avgL), 2) : "—", "", "")}</div>
        <div class="card xcard"><div class="xtools"><label class="xsearch">${I(IC.search, 16)}<input id="btoQ" placeholder="Buscar operaciones…" value="${esc(o.q)}" aria-label="Buscar"></label>
          <div class="xfil">${sessSel(o.f, "btoF")}<select class="xsel" id="btoS" aria-label="Dirección"><option value="">Compras y ventas</option><option value="buy" ${o.side === "buy" ? "selected" : ""}>Solo compras</option><option value="sell" ${o.side === "sell" ? "selected" : ""}>Solo ventas</option></select></div></div>
          <div class="xtablewrap"><table class="xtable"><thead><tr class="xgrp"><th colspan="4"><span>Información</span></th><th colspan="2"><span>Rendimiento</span></th><th colspan="4"><span>Precios</span></th><th colspan="2"><span>Fechas</span></th></tr>
            <tr><th>Símbolo</th><th>Sesión</th><th>Dirección</th><th>Marco</th><th>Resultado</th><th>Duración</th><th>Entrada</th><th>Stop</th><th>Objetivo</th><th>Salida</th><th>Fecha de entrada</th><th>Fecha de salida</th></tr></thead>
            <tbody>${P.length ? P.map(t => `<tr><td><b>${esc(t.symbol)}</b></td><td class="muted">${esc(sessName(t.session_id))}</td><td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td><td class="mono">${esc(t.tf || "—")}</td><td class="mono"><b>${t.r != null ? fmtR(+t.r) : "Abierta"}</b></td><td class="mono">${dur(t.entry_time, t.exit_time)}</td><td class="mono">${px(t.entry)}</td><td class="mono">${px(t.stop)}</td><td class="mono">${px(t.tp)}</td><td class="mono">${px(t.exit)}</td><td class="mono">${t.entry_time ? fmtDT(t.entry_time) : "—"}</td><td class="mono">${t.exit_time ? fmtDT(t.exit_time) : "—"}</td></tr>`).join("") : `<tr><td colspan="12">${empty("Aún no hay operaciones simuladas", "Crea una sesión en Backtesting, avanza velas y opera desde el gráfico.", `<a class="btn" href="#backtest" style="height:38px">Ir a sesiones</a>`)}</td></tr>`}</tbody></table></div>
          <div class="xfoot"><span class="muted small">Mostrando ${L.length ? o.page * o.per + 1 : 0}–${Math.min(L.length, (o.page + 1) * o.per)} de ${L.length} operaciones</span><div class="xpager"><button type="button" class="xpb" data-bpg="-1" ${o.page ? "" : "disabled"} aria-label="Página anterior">${I(IC.left, 16, 2)}</button><span class="xpn">${o.page + 1} / ${pages}</span><button type="button" class="xpb" data-bpg="1" ${o.page < pages - 1 ? "" : "disabled"} aria-label="Página siguiente">${I(IC.right, 16, 2)}</button></div>
          <label class="small muted">Filas <select class="xsel" id="btoP">${[10, 25, 50, 100].map(n => `<option ${n === o.per ? "selected" : ""}>${n}</option>`).join("")}</select></label></div></div></div>`;
    },
    bind() {
      const o = S.bto; if (!o) return;
      const f = $("#btoF"); if (!f) return;
      f.onchange = () => { o.f = f.value; o.page = 0; re(); }; $("#btoS").onchange = e => { o.side = e.target.value; o.page = 0; re(); };
      const q = $("#btoQ"); q.oninput = () => { o.q = q.value; o.page = 0; const pos = q.selectionStart; re(); const n = $("#btoQ"); n.focus(); n.setSelectionRange(pos, pos); };
      $$("[data-bpg]").forEach(b => b.onclick = () => { o.page += +b.dataset.bpg; re(); });
      $("#btoP").onchange = e => { o.per = +e.target.value; o.page = 0; re(); };
      $("#btoCsv").onclick = () => { const qq = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`; const L = bySess(S.btTrades || [], o.f); download("tickora-backtesting-" + todayKey() + ".csv", "﻿" + [["Símbolo", "Sesión", "Dirección", "Marco", "R", "Entrada", "Stop", "Objetivo", "Salida", "Fecha entrada", "Fecha salida"]].concat(L.map(t => [t.symbol, sessName(t.session_id), t.side === "buy" ? "Compra" : "Venta", t.tf, t.r, t.entry, t.stop, t.tp, t.exit, t.entry_time, t.exit_time])).map(r => r.map(qq).join(";")).join("\n")); };
    }
  };
  V.btcal = {
    view() {
      if (needBt("btcal")) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Calendario de backtesting</h1></div></div>${loading()}</div>`;
      const f = S.btcF || "";
      return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Calendario de backtesting</h1><div class="small muted">Resultado simulado por día de cierre, en R</div></div>${sessSel(f, "btcF")}</div>${calendar("calB", bySess(simAll(), f), { title: "Calendario mensual de resultados simulados" })}</div>`;
    },
    bind() { const s = $("#btcF"); if (s) s.onchange = () => { S.btcF = s.value; re(); }; if (S.calB) bindCal("calB"); }
  };
  V.btnotas = {
    view() {
      const D = DI(); if (!S.pagesLoaded) D.loadPages().then(() => { if (location.hash.startsWith("#btnotas")) re(); }); needBt("btnotas");
      const L = (S.pages || []).filter(p => !p.isTpl && (p.bt || p.tpl === "bt")).sort((a, b) => (b.updated || 0) - (a.updated || 0));
      return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Cuaderno</h1><div class="small muted">Tus notas de backtesting: hipótesis, capturas y conclusiones de cada sesión</div></div>
        <div class="row" style="gap:8px">${(S.bts || []).length ? `<select class="xsel" id="bnS" aria-label="Sesión"><option value="">Sin sesión concreta</option>${S.bts.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select>` : ""}<button type="button" class="btn" id="bnNew" style="height:38px">${I(IC.plus, 16, 2)} Nueva nota</button></div></div>
        ${!S.pagesLoaded ? `<div class="small muted">Cargando…</div>` : L.length ? `<div class="pggrid">${L.map(p => `<a class="pgcard" href="#diario/${encodeURIComponent(p.id)}"><span class="pgcover" style="background:${D.COVERS[p.cover] || D.COVERS.mar}"></span><span class="pgbody"><b>${esc(p.title || "Sin título")}</b><small>${esc(D.txt(p.html).slice(0, 90)) || "Página vacía"}</small><span class="pgdate">${p.bt ? esc(sessName(p.bt)) + " · " : ""}Editada ${new Date(p.updated).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></span></a>`).join("")}</div>`
          : `<div class="card">${empty("Tu cuaderno está vacío", "Apunta qué estás probando antes de cada sesión y qué has aprendido al terminarla. Pega capturas del gráfico con Ctrl/⌘ + V.", "")}</div>`}</div>`;
    },
    bind() {
      $("#bnNew").onclick = async () => { const D = DI(), s = $("#bnS"), sid = s ? s.value : ""; await D.loadPages(); const tpl = D.TPL().find(x => x.id === "bt"); const p = D.newPage(tpl); p.bt = sid || null; p.title = "Notas · " + (sid ? sessName(sid) : new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" })); await D.savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); };
    }
  };

  /* ======================= CARTERA: FINANZAS ======================= */
  const FT = { payout: ["Cobro de fondeo", 1], retiro: ["Retirada de cuenta propia", 1], reembolso: ["Reembolso de reto", 1], reto: ["Pago de reto", -1], reinicio: ["Reinicio de reto", -1], deposito: ["Depósito en cuenta propia", -1], herramienta: ["Suscripción o herramienta", -1], formacion: ["Formación", -1], otro: ["Otro gasto", -1] };
  async function loadFin() { if (S.finLoaded) return; const { data, error } = await sb.from("docs").select("id,data").eq("col", "fin"); if (!error) { S.fin = (data || []).map(d => Object.assign({ id: d.id }, d.data)); S.finLoaded = true; } }
  const finCur = () => lsGet("tk-fincur", "EUR");
  function finModal() {
    if (S.plan && inSession(S.plan)) { toast("Durante tu horario no se maneja dinero. Hazlo al terminar."); return; }
    const accts = S.accts || [], now = dayKey(new Date());
    const box = document.createElement("div"); box.className = "xmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Añadir movimiento");
    box.innerHTML = `<form class="xmodal-card" style="max-width:540px"><div class="xmodal-h"><b>Añadir movimiento</b><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xmodal-b stack" style="gap:12px">
        <label class="field"><span>Tipo</span><select class="input" name="type"><optgroup label="Entra dinero">${Object.entries(FT).filter(x => x[1][1] > 0).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("")}</optgroup><optgroup label="Sale dinero">${Object.entries(FT).filter(x => x[1][1] < 0).map(([k, [l]]) => `<option value="${k}" ${k === "reto" ? "selected" : ""}>${l}</option>`).join("")}</optgroup></select></label>
        <div class="fgrid"><label class="field"><span>Importe</span><input class="input" name="amount" inputmode="decimal" required placeholder="0,00"></label><label class="field"><span>Moneda</span><select class="input" name="cur">${["EUR", "USD", "GBP"].map(c => `<option ${c === finCur() ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="field"><span>Fecha</span><input class="input" type="date" name="date" value="${now}" max="${now}" required></label></div>
        <label class="field"><span>Cuenta</span><select class="input" name="acct"><option value="">Ninguna en concreto</option>${accts.map(a => `<option value="${esc(a.id)}">${esc(acctName(a))}</option>`).join("")}</select></label>
        <label class="field"><span>Nota</span><input class="input" name="note" maxlength="140" placeholder="p. ej. reto 100k fase 1"></label>
      </div><div class="xmodal-f"><button type="button" class="btn2" data-x style="height:40px">Cancelar</button><button type="submit" class="btn" style="height:40px">Guardar</button></div></form>`;
    const f = box.querySelector("form"), close = () => { box.remove(); document.removeEventListener("keydown", ek); }, ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => { if (e.target === box || e.target.closest("[data-x]")) close(); });
    f.onsubmit = async e => {
      e.preventDefault(); const v = n => f.elements[n].value.trim(), amt = parseFloat(v("amount").replace(/\./g, "").replace(",", "."));
      if (!(amt > 0)) { toast("Pon un importe mayor que cero"); return; }
      const x = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: v("type"), amount: Math.round(amt * 100) / 100, cur: v("cur"), date: v("date"), acct: v("acct") || null, note: v("note"), created: Date.now() };
      const { id, ...data } = x; const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "fin", id, data, updated_at: new Date().toISOString() });
      if (error) { toast("No se pudo guardar"); return; }
      lsSet("tk-fincur", x.cur); (S.fin = S.fin || []).push(x); close(); toast("Movimiento guardado"); if (location.hash.startsWith("#finanzas")) re();
    };
    document.addEventListener("keydown", ek); document.body.appendChild(box); setTimeout(() => f.elements.amount.focus(), 30);
  }
  V.finanzas = {
    view() {
      if (S.plan && inSession(S.plan)) return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Finanzas</h1><div class="small muted">Lo que gastas y cobras con el trading</div></div></div>
        <div class="card stack" style="gap:10px;max-width:620px;align-items:flex-start">${I('<rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>', 26)}<b>Ahora estás en tu horario de operativa (${esc(S.plan.start)}–${esc(S.plan.end)}).</b><span class="small muted">Mientras operas, Tickora no te enseña dinero para que pienses en R y en tu proceso. Vuelve aquí cuando termines.</span><a class="btn2" href="#hoy" style="height:38px">Volver a Hoy</a></div></div>`;
      if (!S.finLoaded) loadFin().then(() => { if (location.hash.startsWith("#finanzas")) re(); });
      const per = S.finPer || "all", cur = finCur(), all = (S.fin || []).filter(x => x.cur === cur), from = per === "mes" ? dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) : per === "anio" ? new Date().getFullYear() + "-01-01" : "";
      const L = all.filter(x => !from || x.date >= from).sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
      const inc = L.filter(x => FT[x.type][1] > 0).reduce((a, x) => a + x.amount, 0), out = L.filter(x => FT[x.type][1] < 0).reduce((a, x) => a + x.amount, 0), net = inc - out;
      let c = 0; const curve = [0].concat(all.slice().sort((a, b) => a.date.localeCompare(b.date)).map(x => c += FT[x.type][1] * x.amount));
      const byA = {}; L.forEach(x => { const k = x.acct || ""; const o = byA[k] || (byA[k] = { inc: 0, out: 0 }); FT[x.type][1] > 0 ? o.inc += x.amount : o.out += x.amount; });
      const curs = Array.from(new Set((S.fin || []).map(x => x.cur).concat([cur])));
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Finanzas</h1><div class="small muted">Lo que gastas y cobras con el trading. Solo lo ves fuera de tu horario de operativa.</div></div>
          <div class="row" style="gap:8px;flex-wrap:wrap">${curs.length > 1 ? `<select class="xsel" id="finC" aria-label="Moneda">${curs.map(x => `<option ${x === cur ? "selected" : ""}>${x}</option>`).join("")}</select>` : ""}<div class="pseg" role="group" aria-label="Periodo">${[["mes", "Este mes"], ["anio", "Este año"], ["all", "Todo"]].map(([k, l]) => `<button type="button" data-fper="${k}" aria-pressed="${per === k}">${l}</button>`).join("")}</div><button type="button" class="btn" id="finNew" style="height:38px">${I(IC.plus, 16, 2)} Movimiento</button></div></div>
        <div class="card finhero"><div class="lbl">Saldo de la cartera</div><div class="finbig mono">${money(net, cur)}</div><div class="small muted">${per === "all" ? "desde tu primer movimiento" : per === "mes" ? "este mes" : "este año"} · cobrado menos gastado</div>${all.length > 1 ? lineChart(curve, { h: 120, fmt: v => money(v, cur), label: "Saldo acumulado" }) : ""}</div>
        <div class="xg2">
          <div class="card stack" style="gap:12px"><h2 class="h2b">Flujo de efectivo</h2>
            <div class="finflow"><div><span class="lbl">Entra</span><b class="mono">${money(inc, cur)}</b><small class="muted">cobros, retiradas y reembolsos</small></div><div><span class="lbl">Sale</span><b class="mono">${money(out, cur)}</b><small class="muted">retos, depósitos y gastos</small></div></div>
            ${meter(inc, out, "entra", "sale")}${out ? `<div class="small muted">Por cada ${money(1, cur)} gastado has recuperado ${money(inc / out, cur)}.</div>` : ""}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Por cuenta</h2>${Object.keys(byA).length ? `<div class="xtablewrap"><table class="xtable"><thead><tr><th>Cuenta</th><th>Entra</th><th>Sale</th><th>Neto</th></tr></thead><tbody>${Object.entries(byA).map(([k, o]) => { const a = (S.accts || []).find(x => x.id === k); return `<tr><td>${k ? esc(a ? acctName(a) : "Cuenta borrada") : `<span class="muted">Sin cuenta</span>`}</td><td class="mono">${money(o.inc, cur)}</td><td class="mono">${money(o.out, cur)}</td><td class="mono"><b>${money(o.inc - o.out, cur)}</b></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="xchart-empty">Aún no hay movimientos.</div>`}</div>
        </div>
        <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Movimientos</h2><span class="small muted">${L.length}</span></div>
          ${L.length ? `<div class="xtablewrap"><table class="xtable"><thead><tr><th>Fecha</th><th>Tipo</th><th>Cuenta</th><th>Nota</th><th>Importe</th><th></th></tr></thead><tbody>${L.map(x => { const a = (S.accts || []).find(y => y.id === x.acct); return `<tr><td class="mono">${new Date(x.date + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</td><td>${FT[x.type][0]}</td><td class="muted">${a ? esc(acctName(a)) : "—"}</td><td class="muted">${esc(x.note || "")}</td><td class="mono"><b>${FT[x.type][1] > 0 ? "+" : "−"}${money(x.amount, x.cur)}</b></td><td><button type="button" class="xib" data-fdel="${esc(x.id)}" aria-label="Borrar" title="Borrar">${I(IC.trash, 15)}</button></td></tr>`; }).join("")}</tbody></table></div>`
            : empty("Aún no hay movimientos", "Apunta lo que pagas por cada reto y lo que cobras. Así sabrás si el fondeo te sale a cuenta.", `<button type="button" class="btn" data-fnew2 style="height:38px">Añadir movimiento</button>`)}</div>
      </div>`;
    },
    bind() {
      const n = $("#finNew"); if (!n) return; n.onclick = finModal; $$("[data-fnew2]").forEach(b => b.onclick = finModal);
      $$("[data-fper]").forEach(b => b.onclick = () => { S.finPer = b.dataset.fper; re(); });
      const c = $("#finC"); if (c) c.onchange = () => { lsSet("tk-fincur", c.value); re(); };
      $$("[data-fdel]").forEach(b => b.onclick = async () => { if (!confirm("¿Borrar este movimiento?")) return; const { error } = await sb.from("docs").delete().eq("col", "fin").eq("id", b.dataset.fdel); if (error) { toast("No se pudo borrar"); return; } S.fin = S.fin.filter(x => x.id !== b.dataset.fdel); re(); });
    }
  };
})();

/* si la página ya se pintó antes de cargar estos archivos, la repinto */
(function () { const A = window.TKAPP; if (A && A.S && A.S.loaded) { A.S.lastView = null; A.render(); } })();
