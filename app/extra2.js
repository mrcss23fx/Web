/* Tickora · navegación por aplicaciones y páginas nuevas:
   Inicio (tus aplicaciones), ruta y pestañas, buscador (Ctrl/⌘ K), botón +, guía de configuración, estilos,
   Rendimiento, Calendario, Informe diario, Análisis / Operaciones / Calendario / Cuaderno de backtesting y Finanzas. */
(function () {
  "use strict";
  const A = window.TKAPP;
  const { S, sb, esc, SVG, fmtR, fmtV, fmtVt, fmtMoney, mOf, sumM, oneR, dispCur, moneyOn, prefU, CURS, fmtVabs, fmtLim, fmtMs, num, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, lsGet, lsSet, acctName, selAcct, FEELS, greet, money, inSession, MESES_L, NAV_APPS, appOf, ico, isDark } = A;
  const V = window.TK_VIEWS;
  if (!(NAV_APPS || []).some(a => a[0] === "calendario")) {
    let tried = false; try { tried = sessionStorage.getItem("tk-fresh") === "1"; sessionStorage.setItem("tk-fresh", "1"); } catch (e) {}
    if (!tried) { location.replace(location.pathname + "?r=" + Date.now() + location.hash); return; }
  } else { try { sessionStorage.removeItem("tk-fresh"); } catch (e) {} }
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

  /* ======================= INICIO: PORTADA DE CUADROS ======================= */
  const TFQ = ["1m", "3m", "5m", "15m", "30m", "45m", "1h", "2h", "4h", "1d", "1w"];
  const TFL = { "1m": "1 min", "3m": "3 min", "5m": "5 min", "15m": "15 min", "30m": "30 min", "45m": "45 min", "1h": "1 hora", "2h": "2 horas", "4h": "4 horas", "1d": "1 día", "1w": "1 semana" };
  const ARW = '<path d="M7 13l6-6M8 7h5v5"/>';
  const hhmm = t => new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? "ahora mismo" : m < 60 ? "hace " + m + " min" : m < 1440 ? "hace " + Math.round(m / 60) + " h" : "hace " + Math.round(m / 1440) + (Math.round(m / 1440) === 1 ? " día" : " días"); };
  const minOfS = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
  const minOfNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const durTxt = m => m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "");
  function hData() {
    const today = S.trades.filter(t => t.open_time && dayKey(t.open_time) === todayKey()), st = tradeStats(today), p = S.plan;
    const C90 = closed(S.trades.filter(t => new Date(t.open_time) >= Date.now() - 90 * 864e5)).sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), s90 = tradeStats(C90), good = C90.filter(t => evaluate(t).good).length;
    const ev = S.news && (S.news.events || []).filter(e => e.ts > Date.now() - 15 * 6e4).sort((a, b) => a.ts - b.ts);
    const todayEv = S.news ? (S.news.events || []).filter(e => dayKey(e.ts) === todayKey()) : [];
    const sess = (S.bts || []).slice().sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
    const pages = (S.pages || []).filter(x => !x.isTpl).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const now = minOfNow(), a = minOfS(p.start), b = minOfS(p.end), phase = now < a ? "antes" : now < b ? "en" : "despues";
    return { today, st, p, C90, s90, good, nextHigh: ev && ev.find(e => e.impact === "High"), todayEv, sess, pages, phase, a, b, now };
  }
  /* portada: 8 aplicaciones en cuadros vivos; al entrar en una ves sus categorías */
  const HAPPS = ["hoy", "analizar", "backtest", "resultados", "diario", "cartera", "plan", "asistente", "calendario"];
  const appDef = k => NAV_APPS.find(a => a[0] === k);
  const APPDESC = {
    hoy: "Tu sesión de hoy: lo que llevas, tus límites, tu horario y las noticias.",
    analizar: "El gráfico en directo con todas tus herramientas.",
    backtest: "Practica con el mercado real, vela a vela, en sesiones o retos de fondeo.",
    resultados: "Cómo te va por dentro: tus números, tu disciplina y tus emociones.",
    calendario: "Tus días en verde y rojo, el informe de cada día y todas tus operaciones.",
    diario: "Tu cuaderno para apuntarlo todo.",
    cartera: "Tus cuentas de demo, fondeo y capital propio, y lo que gastas y cobras.",
    plan: "Tus normas, tus límites y tu horario.",
    asistente: "Pregunta por tus números y te respondo con tus datos.",
    ajustes: "Tu cuenta, MetaTrader, permisos y apariencia."
  };
  const CATDESC = {
    hoy: "Lo que llevas hoy, tus límites y tu horario", noticias: "Noticias que mueven el mercado esta semana", plan: "Tus normas, tus límites y tu horario",
    analizar: "Gráfico en directo", backtest: "Crea y continúa tus sesiones", btanalisis: "Tus estadísticas de práctica", btops: "Todo lo que has operado practicando", btnotas: "Tus notas de cada sesión",
    rendimiento: "Todos tus números, en dinero y en R", progreso: "Cuánto cumples tu plan y qué normas rompes", emociones: "Qué emociones te ayudan y cuáles te cuestan", historial: "Todas tus operaciones en una tabla", calendario: "Tu resultado de cada día; toca uno para ver su informe",
    diario: "Tus páginas", cuentas: "Demo, fondeo y capital propio", finanzas: "Lo que pagas y cobras", asistente: "Pregunta por tus números"
  };
  const MAINV = { calendario: "calendario" };
  const appHref = k => "#" + (MAINV[k] || appDef(k)[2][0][0]);
  const rbtn = (href, label) => `<a class="hb-go" href="${href}" aria-label="Entrar en ${esc(label)}" title="Entrar en ${esc(label)}" data-stop>${I(ARW, 16, 2)}</a>`;
  const tFoot = (name, sub, href) => `<div class="hb-tf"><span><b>${esc(name)}</b><small>${sub}</small></span>${rbtn(href, name)}</div>`;
  function appTile(k, D) {
    const p = D.p, name = appDef(k)[1], href = appHref(k), n = appDef(k)[2].length;
    const cats = n > 1 ? `<span class="hb-cats-n">${n} apartados</span>` : "";
    switch (k) {
      case "hoy": return hoyTile(D, name, href);
      case "analizar": {
        const sym = chartSym(), tf = lsGet("tk-tf", "5m"), c = (S.hbBars || {})[sym + "|" + tf], b = c && c.b || [];
        const last = b.length ? b[b.length - 1].close : null, f = b.length ? b[0].open : null, chg = last != null && f ? (last - f) / f * 100 : null, dg = c && c.d != null ? c.d : 2;
        const body = b.length ? miniCandles(b) : `<div class="hb-chart-ph">${c && c.err ? "El gráfico no responde ahora" : "Cargando gráfico…"}</div>`;
        return `<div class="hb-ch-top"><span class="hb-sym">${esc(sym)}</span>${last != null ? `<b class="mono">${last.toFixed(dg).replace(".", ",")}</b><em class="mono ${chg >= 0 ? "up" : "dn"}">${chg >= 0 ? "+" : "−"}${num(Math.abs(chg), 2)} %</em>` : ""}<span style="flex:1"></span>${rbtn(href, name)}</div>
          <div class="hb-chart" data-sym="${esc(sym)}" data-tf="${esc(tf)}" role="img" aria-label="${esc(sym)}, últimas ${b.length || 48} velas de ${esc(TFL[tf] || tf)}">${body}</div>
          <div class="hb-ch-bot"><b class="hb-ch-n">${esc(name)}</b><div class="hb-step sm"><button type="button" data-tfs="-1" aria-label="Temporalidad más corta" data-stop>−</button><b class="mono">${esc(TFL[tf] || tf)}</b><button type="button" data-tfs="1" aria-label="Temporalidad más larga" data-stop>+</button></div></div>`;
      }
      case "backtest": return btTile(D, name, href);
      case "resultados": return psyTile(D, name, href);
      case "diario": return diarioTile(D, name, href);
      case "cartera": return cuentasTile(D, name, href);
      case "asistente": return asisTile(D, name, href);
      case "calendario": {
        const nw = new Date(), y = nw.getFullYear(), m = nw.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate(), by = {};
        closed(S.trades).forEach(t => { const d = new Date(dateOf(t)); if (d.getFullYear() === y && d.getMonth() === m) (by[d.getDate()] = by[d.getDate()] || []).push(t); });
        const st = {}; Object.keys(by).forEach(d => { st[d] = tradeStats(by[d]); });
        const vals = Object.values(st), tot = vals.reduce((a, s) => a + s.tot, 0), mtot = vals.reduce((a, s) => a + (s.mt || 0), 0), pd = vals.filter(s => s.tot > 0).length, nd = vals.filter(s => s.tot < 0).length, mx = Math.max(.5, ...vals.map(s => Math.abs(s.tot)));
        let cells = ["L", "M", "X", "J", "V", "S", "D"].map(d => `<span class="mc-wd">${d}</span>`).join("");
        for (let i = 0; i < off; i++) cells += '<span class="mc-d bl"></span>';
        for (let d = 1; d <= dim; d++) {
          const s = st[d], k = dayKey(new Date(y, m, d)), td = d === nw.getDate() ? " hoy" : "", we = (off + d - 1) % 7 >= 5 ? " we" : "";
          cells += s ? `<button type="button" class="mc-d ${s.tot > 0 ? "p" : s.tot < 0 ? "n" : "z"}${td}" style="--a:${(.3 + Math.min(1, Math.abs(s.tot) / mx) * .6).toFixed(2)}" data-repday="${k}" data-stop aria-label="${d}: ${fmtVt(s.tot, s.mt)}. Ver informe del día" title="${fmtVt(s.tot, s.mt)} · ${s.n} op.">${d}</button>`
            : `<span class="mc-d${d > nw.getDate() ? " f" : ""}${we}${td}">${d}</span>`;
        }
        return `<div class="hb-mc-h"><b>${cap(nw.toLocaleDateString("es-ES", { month: "long", year: "numeric" }))}</b>${vals.length ? `<span class="mono ${tot > 0 ? "cpos" : tot < 0 ? "cneg" : ""}">${fmtV(tot, mtot)}</span>` : ""}</div>
          <div class="hb-mc">${cells}</div>
          ${tFoot(name, vals.length ? pd + (pd === 1 ? " día" : " días") + " en verde · " + nd + " en rojo" : "Aún sin días operados este mes", href)}`;
      }
      case "plan": return planTile(D, name, href);
    }
    return "";
  }
  /* dato de cada categoría para la página de la aplicación */
  function catInfo(k, D) {
    const sim = (S.btTrades || []).filter(t => t.r != null), sst = tradeStats(sim.map(t => ({ r: +t.r, status: "closed" })));
    const fe = {}; S.trades.forEach(t => { const f = (t.review || {}).feel; if (f) fe[f] = (fe[f] || 0) + 1; }); const topF = Object.entries(fe).sort((a, b) => b[1] - a[1])[0];
    const w = tradeStats(closed(S.trades.filter(t => new Date(t.open_time) >= Date.now() - 7 * 864e5))), mx = D.p.maxTrades || 3;
    const M = {
      hoy: [D.st.n ? fmtV(D.st.tot, D.st.mt) : "—", D.today.length + " de " + mx + " operaciones", D.today.length / mx],
      plan: [esc(D.p.start) + "–" + esc(D.p.end), "máximo " + mx + " operaciones", null],
      grupo: ["Pronto", "llega en el último paso", null],
      analizar: [esc((S.an && S.an.sym) || "EURUSD"), "se abre en " + (TFL[lsGet("tk-tf", "5m")] || ""), null],
      backtest: [String(D.sess.length), D.sess.length === 1 ? "sesión" : "sesiones", null],
      btanalisis: [BT() ? BT().hms(D.sess.reduce((a, x) => a + (x.secs || 0), 0)) : "—", "de estudio", null],
      btops: [String(sim.length), sst.n ? fmtV(sst.tot, sst.mt) + " simulado" : "simuladas", null],
      btcal: [sst.n ? fmtV(sst.tot, sst.mt) : "—", "resultado simulado", null],
      btnotas: [String((S.pages || []).filter(x => !x.isTpl && (x.bt || x.tpl === "bt")).length), "notas", null],
      rendimiento: [D.s90.n ? fmtV(D.s90.tot, D.s90.mt) : "—", "en 90 días", D.s90.win != null ? D.s90.win / 100 : null],
      progreso: [D.C90.length ? Math.round(D.good / D.C90.length * 100) + " %" : "—", "dentro del plan", D.C90.length ? D.good / D.C90.length : null],
      emociones: [healthOk() ? (topF ? esc(topF[0]) : "—") : "Desactivado", healthOk() ? "la más frecuente" : "actívalo en Ajustes", null],
      historial: [String(S.allTrades.length), "operaciones", null],
      calendario: [w.n ? fmtV(w.tot, w.mt) : "—", "últimos 7 días", null],
      informe: [D.st.n ? fmtV(D.st.tot, D.st.mt) : "—", "hoy", null],
      diario: [String(D.pages.length), D.pages.length === 1 ? "página" : "páginas", null],
      cuentas: [String((S.accts || []).filter(a => a.status !== "archivada").length), "cuentas activas", null],
      finanzas: [inSession(D.p) ? "Bloqueado" : "Disponible", inSession(D.p) ? "hasta las " + esc(D.p.end) : "cobros y gastos", null],
      asistente: ["R", "responde con tus datos", null],
      noticias: [D.nextHigh ? hhmm(D.nextHigh.ts) : "—", D.nextHigh ? "próxima fuerte · " + esc(D.nextHigh.country) : "sin noticias fuertes", null],
      aprender: ["Pronto", "tras el bootcamp", null]
    };
    return M[k] || ["", "", null];
  }
  const greetLine = D => D.phase === "antes" ? `tu sesión empieza a las ${esc(D.p.start)}.` : D.phase === "en" ? "opera tu plan con calma." : D.today.length ? "buen trabajo hoy." : "que tengas un buen día.";
  const metaRow = D => `<div class="hb-meta"><span>${I(IC.cal, 15)} ${cap(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</span><span>${I(IC.clock, 15)} ${D.phase === "en" ? "En tu horario" : D.phase === "antes" ? "Antes de tu horario" : "Fuera de horario"}</span><span>${I('<path d="M3 14l4-5 4 3 6-8"/>', 15)} ${D.st.n ? fmtV(D.st.tot, D.st.mt) + " hoy" : "Sin operaciones hoy"}</span></div>`;
  const loadAll = () => {
    const again = () => { if (/^#?(inicio|app\/.*)?$/.test(location.hash.replace(/^#/, ""))) re(); };
    if (!S.news && window.tkLoadNews) tkLoadNews().then(again);
    if (!S.btLoaded && BT()) BT().loadSessions().then(again);
    if (!S.pagesLoaded && DI()) DI().loadPages().then(again);
    if (!S.goalsLoaded) loadGoals().then(again);
  };
  /* botones propios de cada cuadro (temporalidad, sesiones, pregunta) */
  function bindWidgets(root) {
    const q = sel => Array.from(root.querySelectorAll(sel));
    q("[data-tfs]").forEach(b => b.onclick = () => { const cur = lsGet("tk-tf", "5m"), i = Math.max(0, TFQ.indexOf(cur)), n = TFQ[Math.max(0, Math.min(TFQ.length - 1, i + +b.dataset.tfs))]; lsSet("tk-tf", n); re(); });
    q("[data-btcyc]").forEach(b => b.onclick = () => { const n = (S.bts || []).length; S.hbBt = ((S.hbBt || 0) + +b.dataset.btcyc + n) % n; re(); });
    q("[data-btplay]").forEach(b => b.onclick = () => { const x = (S.bts || []).find(y => y.id === b.dataset.btplay); if (x && BT()) BT().run(x); });
    q("[data-btnew]").forEach(b => b.onclick = () => { location.hash = "#backtest"; setTimeout(() => BT() && BT().drawer(), 60); });
    q("[data-act]").forEach(b => b.onclick = async () => {
      const k = b.dataset.act;
      if (k === "addop") { location.hash = "#historial"; setTimeout(() => window.tkAddTrade && tkAddTrade(), 80); }
      else if (k === "emo") { window.tkEmoModal && tkEmoModal(); }
      else if (k === "newacct") { S.acctEdit = "new"; S.lastView = null; location.hash = "#cuentas"; }
      else if (k === "finmov") { location.hash = "#finanzas"; setTimeout(finModal, 80); }
      else if (k === "write") { const Dd = DI(); if (!Dd) return; await Dd.loadPages(); const p = Dd.newPage(null); p.title = b.dataset.title || ""; await Dd.savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); }
    });
    q("[data-askf]").forEach(f => f.onsubmit = e => { e.preventDefault(); const v = (f.q.value || "").trim(); if (!v) { f.q.focus(); return; } S.asPrefill = v; location.hash = "#asistente"; });
    q("[data-btnewf]").forEach(b => b.onclick = () => { location.hash = "#backtest"; setTimeout(() => BT() && BT().drawer("fondeo"), 60); });
    q("[data-ask]").forEach(a => a.onclick = () => { S.asPrefill = a.dataset.ask; });
    q("[data-repday]").forEach(b => b.onclick = () => { S.repDay = b.dataset.repday; location.hash = "#informe"; });
    q("[data-pcommit]").forEach(b => b.onclick = async () => {
      const day = todayKey(); S.planOk = { day, ts: Date.now() };
      const t = b.closest(".hb-t"); if (t) { t.innerHTML = appTile("plan", hData()); bindWidgets(t); }
      const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "plandia", id: "d" + day, data: { ts: S.planOk.ts }, updated_at: new Date().toISOString() });
      S.plandias = S.plandias || {}; S.plandias[day] = 1; if (error) toast("No se pudo guardar tu compromiso"); else if (gHas()) gToast(1, "te has comprometido"); else toast("Comprometido. Tus normas, a la vista toda la sesión"); if (document.getElementById("hday")) { window.__tkDay && window.__tkDay(); const pt = document.querySelector('.hb-t[data-hc="plan"]'); if (pt) { pt.innerHTML = appTile("plan", hData()); bindWidgets(pt); } }
    });
    q("[data-mt]").forEach(b => b.onclick = async () => {
      const [k, v] = b.dataset.mt.split(":"), day = todayKey(); S.mente = S.mente || {};
      const m = Object.assign({}, S.mente[day] || {}, { [k]: +v, ts: Date.now() }); S.mente[day] = m;
      const t = b.closest(".hb-t");
      if (t) { t.innerHTML = appTile("resultados", hData()); bindWidgets(t); const nb = t.querySelector('[data-mt="' + k + ':' + v + '"]'); nb && nb.focus({ preventScroll: true }); }
      const { error } = await sb.from("docs").upsert({ user_id: S.user.id, col: "mente", id: "d" + day, data: m, updated_at: new Date().toISOString() });
      if (error) toast("No se pudo guardar tu estado");
    });
  }
  /* ===== Hoy, Cuentas y dinero, Diario y Asistente: lo importante y lo que puedes hacer ===== */
  const xChip = (attrs, label, icon) => `<button type="button" class="x-ch" ${attrs} data-stop>${icon ? I(icon, 13, 2.1) : ""}${label}</button>`;
  const xLink = (href, label) => `<a class="x-ch" href="${href}" data-stop>${label}</a>`;
  function hoyTile(D, name, href) {
    const p = D.p, used = D.today.length, mx = p.maxTrades || 3, ph = D.phase;
    const chip = ph === "antes" ? `Empieza en ${durTxt(D.a - D.now)}` : ph === "en" ? `Quedan ${durTxt(D.b - D.now)}` : "Sesión terminada";
    const cl = closed(D.today).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)));
    let cum = 0; const pts = [0].concat(cl.map(t => cum += +t.r || 0)), lo = Math.min(0, ...pts), hi = Math.max(0, ...pts), rg = (hi - lo) || 1;
    const sp = pts.length > 1 ? `<svg class="x-sp" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="100" y1="${(34 - (0 - lo) / rg * 32).toFixed(1)}" y2="${(34 - (0 - lo) / rg * 32).toFixed(1)}" class="z" vector-effect="non-scaling-stroke"/><polyline points="${pts.map((v, i) => `${(i / (pts.length - 1) * 100).toFixed(1)},${(34 - (v - lo) / rg * 32).toFixed(1)}`).join(" ")}" vector-effect="non-scaling-stroke"/></svg>` : "";
    const segs = Array.from({ length: Math.max(mx, used) }, (_, i) => `<i class="${i < used ? (i >= mx ? "over" : "on") : ""}"></i>`).join("");
    const tf = ph === "antes" ? 0 : ph === "despues" ? 1 : (D.now - D.a) / Math.max(1, D.b - D.a);
    const nh = D.nextHigh && dayKey(D.nextHigh.ts) === todayKey() ? D.nextHigh : null;
    return `<div class="x-h"><b class="hb-ch-n">${esc(name)}</b><span class="x-pill">${chip}</span><span style="flex:1"></span>${rbtn(href, name)}</div>
      <div class="x-big"><div><b class="mono">${D.st.n ? fmtV(D.st.tot, D.st.mt) : fmtV(0, 0)}</b><small>${D.st.n ? D.st.n + (D.st.n === 1 ? " cerrada hoy" : " cerradas hoy") : "Aún sin operaciones hoy"}</small></div>${sp}</div>
      <div class="x-segs" role="img" aria-label="${used} de ${mx} operaciones"><div>${segs}</div><span>${used} de ${mx} operaciones</span></div>
      <div class="hb-sbar" role="img" aria-label="Horario ${esc(p.start)} a ${esc(p.end)}"><span>${esc(p.start)}</span><div><em style="width:${(tf * 100).toFixed(1)}%"></em></div><span>${esc(p.end)}</span></div>
      <div class="x-line x-more">${I('<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/>', 14, 1.8)}${nh ? `Noticia fuerte a las <b>${hhmm(nh.ts)}</b> · ${esc(nh.country || nh.cur || "")} ${esc(nh.title || "")}` : "Sin noticias fuertes hoy"}</div>
      <div class="x-acts x-more">${xChip('data-act="addop"', "Añadir operación", IC.plus)}${xChip('data-act="emo"', "Registrar emoción")}${xLink("#noticias", "Noticias")}</div>`;
  }
  function accR(a) {
    const L = (S.allTrades || S.trades).filter(t => a.number && String(t.account || "") === String(a.number) && t.status === "closed" && t.r != null && (!a.start || dayKey(t.open_time) >= a.start));
    const sum = L.reduce((s, t) => s + (+t.r || 0), 0), rp = +a.risk || (S.basePlan || S.plan).riskPct || 1, tg = +a.target || 0, need = tg ? (a.targetU === "R" ? tg : tg / rp) : 0;
    return { sum, msum: sumM(L), n: L.length, need };
  }
  function cuentasTile(D, name, href) {
    const A = (S.accts || []).filter(a => a.status !== "archivada"), ord = { fondeo: 0, propia: 1, demo: 2 };
    const L = A.slice().sort((a, b) => (ord[a.type] ?? 3) - (ord[b.type] ?? 3)).slice(0, 3);
    const TIPO = { fondeo: "Fondeo", propia: "Capital propio", demo: "Demo", otra: "Otra" }, FASE = { f1: "Fase 1", f2: "Fase 2", fin: "Financiada" };
    const rows = L.map(a => { const x = accR(a), pr = x.need ? Math.max(0, Math.min(1, x.sum / x.need)) : null;
      return `<div class="x-acc"><div class="x-acc-t"><b>${esc(acctName(a))}</b><span class="x-tag">${TIPO[a.type] || "Cuenta"}${a.type === "fondeo" && a.phase ? " · " + FASE[a.phase] : ""}</span><span style="flex:1"></span><span class="mono">${x.n ? fmtV(x.sum, x.msum) : "—"}</span></div>${pr != null ? `<div class="x-prog"><i style="width:${(pr * 100).toFixed(1)}%"></i></div><small>${Math.round(pr * 100)} % del objetivo de ${fmtV(x.need)}</small>` : ""}</div>`; }).join("");
    const lock = inSession(D.p);
    return `<div class="x-h"><b class="hb-ch-n">${esc(name)}</b><span class="x-pill">${A.length} ${A.length === 1 ? "cuenta" : "cuentas"}</span><span style="flex:1"></span>${rbtn(href, name)}</div>
      <div class="x-accs">${rows || `<p class="x-empty">Añade tu cuenta de fondeo, real o demo para ver cómo va cada una.</p>`}</div>
      <div class="x-line x-more">${lock ? I('<rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/>', 14, 1.8) + `Finanzas se abre a las <b>${esc(D.p.end)}</b>, al terminar tu horario` : I('<path d="M4 14l4-4 3 3 5-6"/>', 14, 1.8) + "Finanzas: lo que gastas y cobras con el trading"}</div>
      <div class="x-acts x-more">${xChip('data-act="newacct"', "Añadir cuenta", IC.plus)}${lock ? "" : xChip('data-act="finmov"', "Añadir movimiento")}</div>`;
  }
  const DPROMPTS = ["¿Qué hiciste hoy mejor que ayer?", "¿Qué te costó más hoy y por qué?", "Una operación que repetirías mañana", "¿Qué te dirías antes de la próxima sesión?", "Lo que aprendí esta semana"];
  function diarioTile(D, name, href) {
    const pg = D.pages[0], n = D.pages.length, pr = DPROMPTS.at(new Date().getDate() % DPROMPTS.length), txt0 = h => { const d = document.createElement("div"); d.innerHTML = h || ""; return (d.textContent || "").trim(); };
    const last = pg ? `<a class="x-page" href="#diario/${encodeURIComponent(pg.id)}" data-stop><b>${esc(pg.title || "Sin título")}</b><span>${esc(txt0(pg.html).slice(0, 120)) || "Página vacía"}</span><small>Editada ${ago(pg.updated)}</small></a>` : `<p class="x-empty">${S.pagesLoaded ? "Tu cuaderno está vacío. Apunta cualquier cosa: ideas, errores, lo que ves en el mercado." : "Cargando tus páginas…"}</p>`;
    return `<div class="x-h"><b class="hb-ch-n">${esc(name)}</b>${n ? `<span class="x-pill">${n} ${n === 1 ? "página" : "páginas"}</span>` : ""}<span style="flex:1"></span>${rbtn(href, name)}</div>
      ${last}
      <button type="button" class="x-prompt x-more" data-act="write" data-title="${esc(pr)}" data-stop><small>Para escribir hoy</small><b>${esc(pr)}</b><span>Escribir ${I('<path d="M4 10h12M11 5l5 5-5 5"/>', 13, 2)}</span></button>`;
  }
  function asisTile(D, name, href) {
    const cnt = {}; closed(S.trades).filter(t => new Date(dateOf(t)) >= Date.now() - 30 * 864e5).forEach(t => evaluate(t).fail.forEach(f => { const k = NK(f.fix); if (k) cnt[k] = (cnt[k] || 0) + 1; }));
    const fo = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const qs = [fo ? `¿Por qué me cuesta «${NLAB[fo[0]].toLowerCase()}»?` : "¿Qué norma rompo más?", "¿Cómo voy esta semana?", "¿A qué hora opero mejor?", "¿Qué hago después de perder?"];
    return `<div class="x-h"><b class="hb-ch-n as-n">${ico("asistente", 16)}${esc(name)}</b><span style="flex:1"></span>${rbtn(href, name)}</div>
      <p class="x-desc x-more">Pregúntale por tu trading. Te contesta con tus propias operaciones, tu plan y cómo llegas cada día.</p>
      <form class="x-ask" data-askf data-stop><input type="text" name="q" placeholder="Escribe tu pregunta…" aria-label="Pregunta para el asistente" autocomplete="off" data-stop><button type="submit" aria-label="Preguntar" data-stop>${I(IC.send, 14)}</button></form>
      <div class="x-acts x-more">${qs.map(q => `<a class="x-ch" href="#asistente" data-ask="${esc(q)}" data-stop>${esc(q)}</a>`).join("")}</div>`;
  }
  /* ===== Backtesting: repetición vela a vela, tu sesión, tus números de práctica y lo que puedes hacer ===== */
  function btVis() {
    const c = (S.hbBars || {})[chartSym() + "|" + lsGet("tk-tf", "5m")];
    let b = c && c.b && c.b.length > 20 ? c.b.slice(-40) : null;
    if (!b) { let p = 100; b = Array.from({ length: 40 }, (_, i) => { const o = p, cl = o + Math.sin(i / 3.1) * 1.6 + Math.cos(i / 1.7) * 1.1; p = cl; return { open: o, close: cl, high: Math.max(o, cl) + .7 + (i % 3) * .3, low: Math.min(o, cl) - .7 - (i % 4) * .25 }; }); }
    const W = 400, H = 90, n = b.length, cut = Math.round(n * .62), lo = Math.min(...b.map(x => x.low)), hi = Math.max(...b.map(x => x.high)), rg = (hi - lo) || 1, st = W / n, bw = Math.max(2, st * .58), y = v => (H - 6 - (v - lo) / rg * (H - 12)).toFixed(1), px = (cut * st).toFixed(1);
    const cs = b.map((x, i) => { const cx = (i + .5) * st, up = x.close >= x.open, t = y(Math.max(x.open, x.close)), bo = y(Math.min(x.open, x.close));
      return `<g class="${i < cut ? (up ? "u" : "d") : "f"}"><line x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${y(x.high)}" y2="${y(x.low)}" vector-effect="non-scaling-stroke"/><rect x="${(cx - bw / 2).toFixed(1)}" y="${t}" width="${bw.toFixed(1)}" height="${Math.max(1, bo - t).toFixed(1)}"/></g>`; }).join("");
    return `<div class="bt-vis" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="btfut" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".25" stop-color="#000" stop-opacity=".55"/></linearGradient></defs>${cs}<rect x="${px}" y="0" width="${(W - px).toFixed(1)}" height="${H}" fill="url(#btfut)"/><line class="ph" x1="${px}" x2="${px}" y1="0" y2="${H}" vector-effect="non-scaling-stroke"/></svg><span class="bt-fut">Aún oculto</span></div>`;
  }
  function btTile(D, name, href) {
    const i = Math.min(S.hbBt || 0, Math.max(0, D.sess.length - 1)), x = D.sess[i];
    const L = typeof simAll === "function" ? simAll() : [], st = tradeStats(L);
    const stats = st.n ? `<span><b class="mono">${st.n}</b> ${st.n === 1 ? "operación" : "operaciones"}</span><span><b class="mono">${Math.round(st.win)} %</b> acierto</span><span><b class="mono">${fmtV(st.tot, st.mt)}</b> en práctica</span>` : `<span>Aún sin operaciones de práctica</span>`;
    let row;
    if (x) {
      const from = new Date(x.from + "T00:00").getTime(), to = new Date(x.to + "T23:59").getTime(), pr = Math.max(0, Math.min(1, ((x.lastTs || from) - from) / (to - from)));
      row = `<div class="bt-row"><button type="button" class="hb-play sm" data-btplay="${esc(x.id)}" aria-label="${x.lastTs ? "Continuar" : "Empezar"} ${esc(x.name)}" data-stop>${I('<path d="M7 4.5v11l9-5.5z"/>', 18, 2)}</button><div class="bt-tx"><b>${x.lastTs ? "Continuar" : "Empezar"} · ${esc(x.name)}</b><small>${esc((x.syms || []).join(", ") || "")}${x.mode === "fondeo" ? " · Reto de fondeo" : ""} · ${Math.round(pr * 100)} % recorrido</small><div class="hb-prog"><i style="width:${(pr * 100).toFixed(1)}%"></i></div></div>${D.sess.length > 1 ? `<button type="button" class="hb-mb sm" data-btcyc="1" aria-label="Sesión siguiente" data-stop>${I('<path d="M6 5l6 5-6 5zM14 5v10"/>', 14, 2)}</button>` : ""}</div>`;
    } else row = `<div class="bt-row"><button type="button" class="hb-play sm" data-btnew aria-label="Crear sesión de backtesting" data-stop>${I(IC.plus, 18, 2.2)}</button><div class="bt-tx"><b>Empieza tu primera sesión</b><small>Elige mercado y fechas y avanza vela a vela</small></div></div>`;
    return `<div class="bt-h"><div><b class="hb-ch-n">${esc(name)}</b><small class="bt-sub">Repite el mercado vela a vela, sin arriesgar dinero</small></div>${rbtn(href, name)}</div>
      ${btVis()}${row}<div class="bt-stats">${stats}</div>
      <div class="bt-acts"><button type="button" class="bt-ch" data-btnew data-stop>${I(IC.plus, 13, 2.2)} Nueva sesión</button><button type="button" class="bt-ch" data-btnewf data-stop>${I(IC.trophy, 13, 2)} Reto de fondeo</button><a class="bt-ch" href="#btanalisis" data-stop>Ver análisis</a></div>`;
  }
  /* ===== Psicología: cómo llegas hoy, un consejo con estudio detrás y tu propio patrón ===== */
  const MDIM = [["r", "Descanso"], ["c", "Calma"], ["f", "Enfoque"]];
  const mDone = m => !!m && MDIM.every(([k]) => m[k] >= 1);
  const mScore = m => Math.round(((m.r + m.c + m.f) / 3 - 1) / 4 * 100);
  const mLabel = s => s >= 70 ? "Buen estado" : s >= 45 ? "Con cuidado" : "Día delicado";
  /* lo que el usuario cuenta de sí mismo (una vez) y de su día (cada día) */
  const PTRIG = [["revancha", "Querer recuperar una pérdida"], ["fomo", "Miedo a perderme el movimiento"], ["euforia", "Venirme arriba tras ganar"], ["cansancio", "Cansancio o poco sueño"], ["impaciencia", "Aburrimiento o impaciencia"], ["dudas", "Dudar y no entrar"], ["distraccion", "Distracciones o el móvil"]];
  const PCALM = [["respirar", "Respirar despacio", "respiro un minuto, 5 segundos dentro y 5 fuera"], ["escribir", "Escribir lo que siento", "escribo una línea en el Diario antes de seguir"], ["mover", "Levantarme y caminar", "me levanto y camino 5 minutos"], ["plan", "Releer mi plan", "releo mis normas antes de tocar nada"], ["pausa", "Apartarme de la pantalla", "me aparto 10 minutos de la pantalla"], ["hablar", "Hablarlo con alguien", "se lo cuento a alguien antes de seguir"]];
  const PTONE = [["directo", "Directo y corto"], ["cercano", "Cercano"], ["datos", "Con datos y estudios"]];
  const PMOOD = [["ganas", "Con ganas"], ["neutral", "Tranquilo"], ["miedo", "Con miedo"], ["prisa", "Con prisa por ganar"]];
  const PHEAD = [["nada", "Nada especial"], ["perdida", "Una pérdida reciente"], ["dinero", "Dinero"], ["trabajo", "Trabajo o estudios"], ["personal", "Algo personal"], ["salud", "Salud"]];
  const PSIT = { revancha: "pierdo una operación", fomo: "veo que el precio se escapa sin mí", euforia: "gano dos seguidas", cansancio: "noto que me cuesta concentrarme", nervios: "noto el pulso acelerado antes de entrar", dudas: "dudo ante una entrada que cumple mis reglas", distraccion: "me llega algo al móvil o a la cabeza", impaciencia: "llevo un rato sin entradas", enfoque: "abro el gráfico", maximo: "quiero hacer una operación más", estable: "noto que algo me altera", recuperar: "pienso en lo que perdí ayer", presion: "noto que necesito ganar", observar: "veo una entrada que me tienta" };
  /* [título, versión corta, versión completa, estudio] */
  const TIPS2 = {
    revancha: ["Pausa antes de recuperar", "Tras una pérdida, 10 minutos fuera antes de la siguiente.", "Después de perder, la cabeza busca volver a cero y empuja a arriesgar más. Date 10 minutos lejos de la pantalla antes de la siguiente operación.", "Thaler y Johnson (1990)"],
    fomo: ["Ese movimiento no era tuyo", "Si no estaba en tu plan, déjalo ir.", "Entrar tarde por miedo a quedarte fuera suele darte peor precio y peor stop. Si el movimiento no cumplía tus reglas, no era tuyo: vendrán más.", ""],
    euforia: ["Mismo plan aunque vaya bien", "Gane o pierda, mismo riesgo y mismo máximo.", "Cuando todo va bien aparece el exceso de confianza, y con él las operaciones de más. Hoy, mismo riesgo y mismo máximo que cualquier otro día.", "Barber y Odean (2000)"],
    cansancio: ["Poco descanso: riesgo pequeño", "Hoy, menos riesgo o solo tu mejor setup.", "Con poco sueño el cerebro da más peso a lo que puedes ganar y menos a lo que puedes perder. Hoy, menos riesgo o solo tu mejor setup.", "Venkatraman y otros (2011)"],
    nervios: ["Convierte los nervios en energía", "Dite «estoy con ganas», no «cálmate».", "Reinterpretar los nervios como energía («estoy con ganas») funciona mejor que intentar calmarse a la fuerza. Dilo en voz alta antes de empezar.", "Brooks (2014)"],
    escribir: ["Saca la preocupación al papel", "Dos minutos escribiendo lo que te preocupa.", "Escribir dos minutos lo que te preocupa antes de la sesión deja la cabeza libre para decidir. Hazlo en el Diario.", "Ramírez y Beilock (2011)"],
    dudas: ["Decide antes, ejecuta después", "Si cumple tus reglas, entras. Sin pensarlo más.", "Las dudas bajan cuando la decisión ya está tomada antes: «si se cumple mi setup, entro con mi riesgo normal». Así no decides a mitad de la vela.", "Gollwitzer y Sheeran (2006)"],
    distraccion: ["Móvil fuera durante la sesión", "Modo avión mientras operas.", "Cada interrupción te obliga a volver a concentrarte y sube el estrés. Pon el móvil en modo avión y cierra todo lo que no sea el gráfico.", "Mark y otros (2008)"],
    impaciencia: ["No operar también es operar bien", "Un día sin entradas puede ser un día perfecto.", "Si no aparece tu setup, no hay nada que hacer. Los días sin operaciones que respetan tu plan también cuentan como días buenos.", ""],
    enfoque: ["Decide antes de abrir el gráfico", "Repasa tus reglas si → entonces.", "Repasar tus reglas «si pasa esto, hago esto» antes de empezar hace mucho más probable que las cumplas cuando llegue el momento.", "Gollwitzer y Sheeran (2006)"],
    maximo: ["Has llegado a tu máximo", "Lo que queda, solo para mirar.", "Quien más opera suele ganar menos. Lo que queda de sesión, solo para mirar y apuntar lo que ves.", "Barber y Odean (2000)"],
    estable: ["Ponle nombre a lo que sientes", "Antes de cada entrada, nombra tu emoción.", "Antes de cada entrada, di en una frase cómo te sientes. Nombrar la emoción le quita fuerza y te ayuda a decidir con calma.", "Lieberman y otros (2007)"],
    recuperar: ["Hoy no toca recuperar", "Mismo riesgo y una operación menos de lo normal.", "Querer recuperar lo de ayer es la forma más rápida de perder más. Hoy, mismo riesgo de siempre y una operación menos de lo normal.", "Thaler y Johnson (1990)"],
    presion: ["Opera como si no necesitaras ganar", "Solo entradas que harías sin presión.", "Las preocupaciones por dinero ocupan cabeza y empeoran las decisiones. Hoy, solo operaciones que harías aunque no necesitaras ganar nada.", "Mani y otros (2013)"],
    observar: ["Hoy toca mirar y aprender", "Apunta 3 situaciones que habrías operado.", "Mirar sin operar también entrena: apunta en el Diario tres situaciones que habrías operado y mañana revisa cómo acabaron.", ""],
    respirar: ["Un minuto de respiración lenta", "Un minuto: 5 segundos dentro, 5 fuera.", "Respirar despacio, 5 segundos dentro y 5 fuera durante un minuto, baja la activación y te ayuda a decidir con calma.", "Zaccaro y otros (2018)"]
  };
  function psyFactors(m, D) {
    const f = [], head = m.head || [], cl = closed(D.today).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b))), l2 = cl.slice(-2);
    if (l2.length === 2 && l2.every(t => +t.r < 0)) f.push("revancha");
    if (D.today.length >= (D.p.maxTrades || 3)) f.push("maximo");
    if (m.intent === "recuperar") f.push("recuperar");
    if (m.last === "recuperar" || m.emo === "frustrado" || head.includes("perdida")) f.push("revancha");
    if (m.last === "miedo") f.push("dudas");
    if (m.emo === "nervioso") f.push("nervios");
    if (m.emo === "euforico") f.push("euforia");
    if (m.emo === "cansado") f.push("cansancio");
    if (head.includes("dinero")) f.push("presion");
    if (m.mood === "prisa") f.push(head.includes("perdida") || head.includes("dinero") ? "revancha" : "fomo");
    if (m.mood === "miedo") f.push("dudas");
    if (m.r <= 2) f.push("cansancio");
    if (m.c <= 2) f.push("nervios");
    if (m.f <= 2) f.push(head.some(h => ["trabajo", "personal", "salud", "dinero"].includes(h)) ? "distraccion" : "enfoque");
    if (head.some(h => ["trabajo", "personal", "salud"].includes(h))) f.push("distraccion");
    if (m.mood === "ganas" && m.r >= 4 && m.c >= 4 && m.f >= 4) f.push("euforia");
    return [...new Set(f)];
  }
  /* el consejo de hoy: primero lo urgente de la sesión, luego lo que coincide con tu punto débil, luego lo demás */
  function psyAdvice(m, D) {
    const P = S.menteP || {}, trig = P.trig || [], calm = P.calm || [], fs = psyFactors(m, D);
    let main = fs.find(x => x === "maximo") || (fs.includes("revancha") && closed(D.today).length ? "revancha" : null) || fs.find(x => trig.includes(x)) || fs[0];
    let personal = !!main && trig.includes(main);
    if (fs.includes("recuperar") && main !== "maximo") { main = "recuperar"; personal = trig.includes("revancha"); }
    if (!main && m.intent === "mirar") main = "observar";
    if (!main) { main = trig.includes("impaciencia") ? "impaciencia" : "estable"; personal = main === "impaciencia"; }
    let key = main;
    if (main === "nervios" && calm.includes("escribir")) key = "escribir";
    if (main === "estable" && calm.includes("respirar")) key = "respirar";
    const tool = (PCALM.find(c => c[0] === calm[0]) || PCALM[4])[2];
    const then = main === "observar" ? "lo apunto en el Diario en vez de entrar" : main === "recuperar" ? "cierro el gráfico y me aparto 10 minutos" : main === "dudas" ? "entro con mi riesgo normal, sin pensarlo más" : main === "maximo" ? "cierro la plataforma por hoy" : main === "enfoque" ? "repaso mis reglas en voz alta" : tool;
    return { main, personal, tip: TIPS2[key], sit: PSIT[main], then };
  }
  function mPattern() {
    const M = S.mente || {}, days = Object.keys(M).filter(k => mDone(M[k])), byDay = {};
    closed(S.trades).forEach(t => { const k = dayKey(dateOf(t)); (byDay[k] = byDay[k] || []).push(t); });
    const g = { hi: [0, 0], lo: [0, 0] }; let n = 0;
    days.forEach(k => { const l = byDay[k]; if (!l) return; n++; const x = mScore(M[k]) >= 60 ? g.hi : g.lo; l.forEach(t => { x[1]++; if (evaluate(t).good) x[0]++; }); });
    if (n < 5 || !g.hi[1] || !g.lo[1]) return `Tu patrón aparece con 5 días operados y registrados · llevas ${n}`;
    return `Tu patrón: llegando bien cumples el plan el ${Math.round(g.hi[0] / g.hi[1] * 100)} %; llegando mal, el ${Math.round(g.lo[0] / g.lo[1] * 100)} %`;
  }
  function psyTile(D, name, href) {
    const m = (S.mente || {})[todayKey()] || {}, done = healthOk() && mDone(m), sc = done ? mScore(m) : 0;
    const bars = MDIM.map(([k, l]) => `<div class="pt-b"><span>${l}</span><i><u style="width:${done ? m[k] * 20 : 0}%"></u></i></div>`).join("");
    const txt = !healthOk() ? `<b>Cómo llegas cada día</b><small>Actívalo en Ajustes · solo lo ves tú</small>`
      : done ? `<b>${mLabel(sc)}</b><small>Para hoy: ${esc(psyAdvice(m, D).tip[0].toLowerCase())}</small>`
      : `<b>¿Cómo llegas hoy?</b><small>${S.menteP ? "20 segundos" : "La primera vez, 1 minuto"} · toca para empezar</small>`;
    return `<div class="ps-h"><b class="hb-ch-n">${esc(name)}</b><span style="flex:1"></span>${rbtn(href, name)}</div>
      <div class="pt-m"><div class="pz-ring${done ? "" : " off"}" style="--p:${sc}"><b class="mono">${done ? sc : "?"}</b></div><div class="pt-tx">${txt}</div><div class="pt-bars">${bars}</div></div>`;
  }
  /* panel lateral de Psicología: perfil (una vez), cómo llegas hoy y tu consejo personal */
  const hqOk = M => HQ2.every(Q => mVal(M, Q.k).length);
  function psyPanel(step0) {
    const old = document.querySelector(".xdrawer.psyd"); if (old) old.remove();
    const box = document.createElement("div"); box.className = "xdrawer psyd"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Psicología");
    const day = todayKey(); S.mente = S.mente || {};
    const P = Object.assign({ trig: [], calm: [], tone: "cercano" }, S.menteP || {}), M = Object.assign({}, S.mente[day] || {});
    let step = step0 || (!healthOk() ? "permiso" : mDone(M) ? "resultado" : !S.menteP ? "perfil" : "hoy");
    const chips = (g, opts, sel, multi) => `<div class="pz-chips" data-g="${g}" data-multi="${multi ? 1 : 0}">${opts.map(([k, l]) => `<button type="button" class="pz-chip" data-v="${k}" aria-pressed="${sel.includes(k)}">${esc(l)}</button>`).join("")}</div>`;
    const scale = (k, l) => `<div class="pz-sc"><span>${l}</span><div class="pz-sv" data-sc="${k}" role="group" aria-label="${l}, de 1 a 5">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-pressed="${M[k] === n}" aria-label="${l}: ${n} de 5">${n}</button>`).join("")}</div><small><i>Muy bajo</i><i>Muy alto</i></small></div>`;
    const save = (id, data) => sb.from("docs").upsert({ user_id: S.user.id, col: "mente", id, data, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) toast("No se pudo guardar"); });
    function body() {
      if (step === "permiso") return { t: "Psicología", s: "Antes de empezar", b: `<p class="pz-p">Para darte consejos según cómo llegas cada día, Tickora tiene que guardar cómo te sientes. Es información sobre tu salud: necesita tu permiso y solo la ves tú.</p>`, f: `<a class="btn" href="#ajustes" data-close>Activar en Ajustes</a>` };
      if (step === "perfil") return { t: "Conócete", s: "Tres preguntas, solo la primera vez. Así los consejos serán tuyos.", b: `<div class="pz-q"><b>¿Qué es lo que más te saca de tu plan?</b><small>Elige hasta tres</small>${chips("trig", PTRIG, P.trig, 1)}</div><div class="pz-q"><b>¿Qué te ayuda a volver a la calma?</b><small>Elige las que te funcionen; la primera será la que te proponga</small>${chips("calm", PCALM, P.calm, 1)}</div><div class="pz-q"><b>¿Cómo quieres que te hable?</b>${chips("tone", PTONE, [P.tone], 0)}</div>`, f: `<button type="button" class="btn" data-go="perfil-ok" ${P.trig.length && P.calm.length ? "" : "disabled"}>Guardar y seguir</button>` };
      if (step === "hoy") return { t: "¿Cómo llegas hoy?", s: "20 segundos. Contesta con lo primero que te salga.", b: HQ2.map(Q => `<div class="pz-q"><b>${Q.q}</b>${Q.multi ? "<small>Puedes marcar varias</small>" : ""}${chips("q-" + Q.k, Q.o, mVal(M, Q.k), Q.multi)}</div>`).join(""), f: `<button type="button" class="btn" data-go="hoy-ok" ${hqOk(M) ? "" : "disabled"}>Ver mi consejo</button>` };
      const D = hData(), a = psyAdvice(M, D), sc = mScore(M), tone = P.tone || "cercano", tip = a.tip, tl = (PTRIG.find(x => x[0] === a.main) || [])[1];
      const pers = a.personal && tl ? (tone === "directo" ? `Tu punto débil: ${tl.toLowerCase()}.` : `Nos dijiste que «${tl.toLowerCase()}» es lo que más te saca del plan. Hoy puede aparecer.`) : "";
      const added = M.sit === a.sit && M.then === a.then;
      return { t: "Tu día", s: cap(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })), b: `
        <div class="pz-score"><div class="pz-ring" style="--p:${sc}"><b class="mono">${sc}</b></div><div><b>${mLabel(sc)}</b><small>Descanso ${M.r} · Calma ${M.c} · Enfoque ${M.f}</small></div></div>
        <div class="pz-tip"><small>Para ti, hoy</small><b>${esc(tip[0])}</b>${pers ? `<p class="pz-pers">${esc(pers)}</p>` : ""}<p>${esc(tone === "directo" ? tip[1] : tip[2])}</p>${tip[3] && tone !== "directo" ? `<em>Estudio: ${esc(tip[3])}</em>` : ""}</div>
        <div class="pz-si"><small>Tu regla de hoy</small><p><b>Si</b> ${esc(a.sit)} <b>→</b> ${esc(a.then)}</p>${added ? `<span class="pz-ok">${ico("check", 14, 2.6)} Está en tu cuadro de Mi plan</span>` : `<button type="button" class="btn2" data-go="si-add">Llevarla a Mi plan hoy</button>`}</div>
        <div class="pz-data"><small>Lo que dicen tus datos</small><p>${esc(mPattern())}</p></div>
        <div class="pz-links"><button type="button" class="pz-l" data-go="hoy">Cambiar mis respuestas de hoy</button><button type="button" class="pz-l" data-go="perfil">Editar lo que me saca del plan</button></div>`,
        f: `<span class="pz-more">Ver más:</span><a class="pz-l" href="#rendimiento" data-close>Rendimiento</a><a class="pz-l" href="#progreso" data-close>Disciplina</a><a class="pz-l" href="#emociones" data-close>Emociones</a>` };
    }
    function paint() {
      const x = body();
      box.innerHTML = `<div class="xdrawer-p pzp"><div class="xdr-h pz-h"><div><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div><div class="xdr-b">${x.b}</div>${x.f ? `<div class="xdr-f">${x.f}</div>` : ""}</div>`;
      const sb0 = box.querySelector(".xdr-b"); if (sb0) sb0.scrollTop = 0;
    }
    function refresh() {
      ["resultados", "plan"].forEach(k => { const t = document.querySelector('.hb-t[data-hc="' + k + '"]:not(.sel)'); if (t) { t.innerHTML = appTile(k, hData()); bindWidgets(t); } });
    }
    function sync() {
      box.querySelectorAll(".pz-chips").forEach(g => { const k = g.dataset.g, cur = k === "trig" || k === "calm" ? P[k] : k === "tone" ? [P.tone] : k.startsWith("q-") ? mVal(M, k.slice(2)) : []; g.querySelectorAll(".pz-chip").forEach(c => c.setAttribute("aria-pressed", cur.includes(c.dataset.v))); });
      box.querySelectorAll(".pz-sv").forEach(g => g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", M[g.dataset.sc] === +b.dataset.n)));
      const po = box.querySelector('[data-go="perfil-ok"]'); if (po) po.disabled = !(P.trig.length && P.calm.length);
      const ho = box.querySelector('[data-go="hoy-ok"]'); if (ho) ho.disabled = !hqOk(M);
    }
    const close = () => { box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", ek); const t = document.querySelector('.hb-t[data-hc="resultados"]'); t && t.focus({ preventScroll: true }); };
    const ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      if (e.target.closest("[data-close]")) { box.remove(); document.removeEventListener("keydown", ek); return; }
      const ch = e.target.closest(".pz-chip");
      if (ch) {
        const g = ch.parentElement.dataset.g, v = ch.dataset.v;
        if (g === "trig" || g === "calm") { const arr = P[g]; P[g] = arr.includes(v) ? arr.filter(x => x !== v) : g === "trig" && arr.length >= 3 ? arr : arr.concat(v); if (g === "trig" && arr.length >= 3 && !arr.includes(v)) toast("Elige como mucho tres"); }
        else if (g === "tone") P.tone = v;
        else if (g === "mood") M.mood = M.mood === v ? undefined : v;
        else if (g.startsWith("q-")) mSet(M, g.slice(2), v);
        return sync();
      }
      const sv = e.target.closest(".pz-sv button"); if (sv) { M[sv.parentElement.dataset.sc] = +sv.dataset.n; return sync(); }
      const go = e.target.closest("[data-go]"); if (!go || go.disabled) return;
      const g = go.dataset.go;
      if (g === "perfil-ok") { S.menteP = { trig: P.trig, calm: P.calm, tone: P.tone }; save("perfil", S.menteP); step = mDone(M) ? "resultado" : "hoy"; paint(); refresh(); }
      else if (g === "hoy-ok") { M.ts = Date.now(); const was = mDone(S.mente[day]); S.mente[day] = Object.assign({}, M); save("d" + day, S.mente[day]); if (!was) gToast(1, "chequeo hecho"); step = "resultado"; paint(); refresh(); }
      else if (g === "si-add") { const a = psyAdvice(M, hData()); M.sit = a.sit; M.then = a.then; S.mente[day] = Object.assign({}, M); save("d" + day, S.mente[day]); paint(); refresh(); toast("Añadida a tu cuadro de Mi plan"); }
      else { step = g; paint(); }
    });
    paint(); document.addEventListener("keydown", ek); document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add("in")); setTimeout(() => { const x = box.querySelector(".xdr-b .pz-sv button, .xdr-b .pz-chip, .xdr-b [data-go]") || box.querySelector("[data-x]"); x && x.focus(); }, 80);
  }
  /* ===== Mi plan: tus normas de hoy en directo, la norma en foco, tus reglas y tu compromiso ===== */
  const NK = f => /stop al entrar|Deja el stop/i.test(f) ? "stop" : /tamaño con tu riesgo/i.test(f) ? "risk" : /horario/i.test(f) ? "hora" : /máximo/i.test(f) ? "max" : /límite/i.test(f) ? "lim" : null;
  const NLAB = { stop: "Stop al entrar y sin moverlo", risk: "Respetar tu riesgo", hora: "Operar solo en tu horario", max: "No pasar de tu máximo", lim: "Parar en tu límite del día" };
  function planTile(D, name, href) {
    const p = D.p, used = D.today.length, mx = p.maxTrades || 3, L = p.dayLimitR || 2, dr = D.st.n ? D.st.tot : 0;
    const fails = new Set(); D.today.forEach(t => evaluate(t).fail.forEach(f => { const k = NK(f.fix); if (k) fails.add(k); }));
    const cnt = {}; closed(S.trades).filter(t => new Date(dateOf(t)) >= Date.now() - 30 * 864e5).forEach(t => evaluate(t).fail.forEach(f => { const k = NK(f.fix); if (k) cnt[k] = (cnt[k] || 0) + 1; }));
    const focus = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const byDay = {}; closed(S.trades).forEach(t => { const k = dayKey(dateOf(t)); (byDay[k] = byDay[k] || []).push(t); });
    let racha = 0; for (const k of Object.keys(byDay).sort().reverse()) { if (byDay[k].every(t => evaluate(t).good)) racha++; else break; }
    const rp = num(p.riskPct, 2).replace(/,?0+$/, "");
    const st = (k, warn) => fails.has(k) ? "bad" : warn ? "warn" : used ? "ok" : "idle";
    const rows = [
      ["max", "Máximo " + mx + (mx === 1 ? " operación" : " operaciones"), used > mx ? "te pasaste" : used === mx ? "llegaste: cierra el día" : used ? "llevas " + used : "aún ninguna", st("max", used === mx)],
      ["lim", "Límite del día −" + fmtLim(L, 1), D.st.n ? "llevas " + fmtV(dr, D.st.mt).replace(/<tk-r>.*?<\/tk-r>/, "") : "sin pérdidas", dr <= -L ? "bad" : st("lim", D.st.n && dr <= -L * .6)],
      ["hora", "Horario " + esc(p.start) + "–" + esc(p.end), D.phase === "antes" ? "empieza a las " + esc(p.start) : D.phase === "en" ? "estás dentro" : "terminado", fails.has("hora") ? "bad" : D.phase === "en" ? "ok" : "idle"],
      ["risk", "Riesgo " + rp + " % por operación", fails.has("risk") ? "hoy te pasaste" : used ? "respetado" : "", st("risk")],
      ["stop", "Stop al entrar y sin moverlo", fails.has("stop") ? "hoy no" : used ? "bien" : "", st("stop")]
    ];
    const icon = s => s === "ok" ? ico("check", 13, 2.6) : s === "bad" ? ico("x", 12, 2.6) : s === "warn" ? "<b>!</b>" : "";
    const list = rows.map(([k, l, sub, s]) => `<div class="pl-r ${s}${focus && focus[0] === k ? " foc" : ""}"><span class="pl-i">${icon(s)}</span><span class="pl-l">${l}${focus && focus[0] === k ? ' <em>en foco</em>' : ""}</span><small>${sub}</small></div>`).join("");
    const ok = S.planOk && S.planOk.day === todayKey();
    const mt = healthOk() ? (S.mente || {})[todayKey()] : null, hoyR = mt && mt.sit ? `<div class="pl-hoy"><em>Hoy</em><b>Si</b> ${esc(mt.sit)} <b>→</b> ${esc(mt.then)}</div>` : "";
    const rules = (p.rules || []).filter(r => r.si || r.entonces).slice(0, hoyR ? 2 : 3);
    const right = `<div class="pl-foc">${focus ? `<small>Tu norma en foco</small><b>${NLAB[focus[0]]}</b><span>La rompiste ${focus[1]} ${focus[1] === 1 ? "vez" : "veces"} en los últimos 30 días. Hoy, ojo con esta.</span>` : closed(S.trades).length ? `<small>Tu norma en foco</small><b>Ninguna rota en 30 días</b><span>Sigue así: lo difícil es mantenerlo.</span>` : `<small>Tu norma en foco</small><b>Aparecerá con tus operaciones</b><span>Te marcaré la norma que más te cuesta.</span>`}</div>
      <div class="pl-si">${hoyR}${rules.length ? rules.map(r => `<div><b>Si</b> ${esc(String(r.si || "").replace(/,$/, ""))} <b>→</b> ${esc(r.entonces || "")}</div>`).join("") : `<div class="pl-empty">Añade tus reglas «si pasa esto → hago esto» en <a href="#plan" data-stop>Mi plan</a>.</div>`}</div>`;
    const commit = ok ? `<span class="pl-done" title="Lo decides en frío: los cambios del plan valen desde mañana">${ico("check", 14, 2.6)} Comprometido a las ${new Date(S.planOk.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>` : `<button type="button" class="pl-btn" data-pcommit data-stop title="Lo decides en frío: los cambios del plan valen desde mañana">Me comprometo hoy</button>`;
    return `<div class="ps-h"><b class="hb-ch-n">${esc(name)}</b>${racha ? `<span class="pl-racha">${racha} ${racha === 1 ? "día" : "días"} seguidos en plan</span>` : ""}<span style="flex:1"></span>${commit}${rbtn(href, name)}</div>
      <div class="pl-b"><div class="pl-list"><small class="pl-t">Tus normas de hoy</small>${list}</div><div class="pl-right">${right}</div></div>`;
  }
  async function loadPlanOk() {
    const day = todayKey(); if ((S.planOk && S.planOk.day === day) || S.planOkLoaded === day) return; S.planOkLoaded = day;
    const { data, error } = await sb.from("docs").select("id,data").eq("col", "plandia").eq("id", "d" + day);
    if (!error && data && data[0]) { S.planOk = { day, ts: data[0].data.ts }; if (document.getElementById("hday") && window.__tkDay) window.__tkDay(); const t = document.querySelector('.hb-t[data-hc="plan"]:not(.sel)'); if (t) { t.innerHTML = appTile("plan", hData()); bindWidgets(t); } }
  }
  async function loadMente() {
    if (S.menteLoaded || S.menteLoading || !healthOk()) return; S.menteLoading = true;
    try { const { data, error } = await sb.from("docs").select("id,data").eq("col", "mente"); if (!error) { S.mente = {}; (data || []).forEach(d => { if (d.id === "perfil") S.menteP = d.data; else S.mente[String(d.id).slice(1)] = d.data; }); S.menteLoaded = true; } }
    finally { S.menteLoading = false; }
    const t = document.querySelector('.hb-t[data-hc="resultados"]:not(.sel)');
    if (t) { t.innerHTML = appTile("resultados", hData()); bindWidgets(t); }
    if (document.getElementById("hxq") && window.__tkHero && !S.hqStep) window.__tkHero();
    if (document.getElementById("hday") && window.__tkDay) window.__tkDay();
  }
  /* gráfico del cuadro: velas reales de los últimos minutos, en azul y gris */
  const chartSym = () => (S.an && S.an.sym) || (S.trades[0] && S.trades[0].symbol) || "EURUSD";
  function miniCandles(b) {
    const W = 600, H = 200, n = b.length, lo = Math.min(...b.map(x => x.low)), hi = Math.max(...b.map(x => x.high)), rg = (hi - lo) || 1, step = W / n, bw = Math.max(1.5, step * .62);
    const y = v => (H - 6 - (v - lo) / rg * (H - 12)).toFixed(1), last = b[n - 1].close;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><line class="lp" x1="0" x2="${W}" y1="${y(last)}" y2="${y(last)}" vector-effect="non-scaling-stroke"/>${b.map((x, i) => { const cx = (i + .5) * step, up = x.close >= x.open, t = y(Math.max(x.open, x.close)), bt = y(Math.min(x.open, x.close));
      return `<g class="${up ? "u" : "d"}"><line x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${y(x.high)}" y2="${y(x.low)}" vector-effect="non-scaling-stroke"/><rect x="${(cx - bw / 2).toFixed(1)}" y="${t}" width="${bw.toFixed(1)}" height="${Math.max(1, bt - t).toFixed(1)}"/></g>`; }).join("")}</svg>`;
  }
  async function loadMini(force) {
    const el = document.querySelector(".hb-chart"); if (!el || !window.TkChart || !TkChart.bars) return;
    const sym = el.dataset.sym, tf = el.dataset.tf, key = sym + "|" + tf; S.hbBars = S.hbBars || {};
    const c = S.hbBars[key]; if (c && !force && Date.now() - c.t < 60000) return;
    if (S.hbLoading === key) return; S.hbLoading = key;
    try { const r = await TkChart.bars(sym, tf, { invoke: (n, body) => sb.functions.invoke(n, { body }) }); S.hbBars[key] = { t: Date.now(), b: (r.bars || []).slice(-48), d: TkChart.digits ? TkChart.digits(sym) : 2 }; }
    catch (e) { S.hbBars[key] = { t: Date.now() - 45000, b: c ? c.b : [], d: c ? c.d : 2, err: !c }; }
    finally { S.hbLoading = null; }
    const t = document.querySelector('.hb-t[data-hc="analizar"]:not(.sel)');
    if (t && t.querySelector(".hb-chart")) { t.innerHTML = appTile("analizar", hData()); bindWidgets(t); }
  }
  function bindTiles() {
    $$("[data-href]").forEach(el => {
      const k = el.dataset.hc;
      const act = kb => { if (k === "resultados") { if (S.hcSel) selTile(null); psyPanel(); return; } if (!k || S.hcSel === k) location.hash = el.dataset.href; else selTile(k, kb); };
      el.addEventListener("click", e => { if (e.target.closest("[data-stop]")) return; act(false); });
      el.addEventListener("keydown", e => { if (e.target === el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); act(true); } });
    });
    bindWidgets(document);
    loadMini();
    loadMente();
    loadPlanOk();
    if (!window.__tkMini) { window.__tkMini = setInterval(() => { if (document.visibilityState === "visible") loadMini(); }, 60000); }
    if (!window.__tkSel) {
      window.__tkSel = true;
      document.addEventListener("click", e => { if (S.hcSel && !e.composedPath().some(n => n.dataset && n.dataset.hc)) selTile(null); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && S.hcSel) { const k = S.hcSel; selTile(null); const t = document.querySelector('[data-hc="' + k + '"]'); t && t.focus(); } });
      window.addEventListener("hashchange", () => { S.hcSel = null; });
    }
  }
  /* al tocar un cuadro: se marca, el resto se apaga y dentro aparecen sus apartados; el segundo toque entra */
  const RARW = '<path d="M4 10h12M11 5l5 5-5 5"/>';
  function calmOpen(k, D) {
    const a = appDef(k), cats = a[2];
    const body = cats.length > 1
      ? `<div class="hc-cl">${cats.map(([ck, cl]) => `<a class="hc-c" href="#${ck}" data-stop><span>${esc(cl)}</span><em>${catInfo(ck, D)[0]}</em></a>`).join("")}</div>`
      : `<p class="hc-p">${esc(APPDESC[k] || CATDESC[cats[0][0]] || "")}</p>`;
    return `<div class="hc-in"><span class="hc-h">${ico(k, 18, 1.8)}<b class="hc-n">${esc(a[1])}</b></span>${body}<a class="hc-go" href="${appHref(k)}" data-stop>Abrir ${I(RARW, 15, 1.8)}</a></div>`;
  }
  function selTile(k, kb) {
    const g = document.querySelector(".hb-grid"); if (!g) { S.hcSel = null; return; }
    const D = hData(); S.hcSel = k || null;
    g.classList.toggle("has", !!S.hcSel);
    g.querySelectorAll("[data-hc]").forEach(t => {
      const on = t.dataset.hc === S.hcSel, was = t.classList.contains("sel");
      if (on === was) return;
      t.classList.toggle("sel", on); t.setAttribute("aria-expanded", on);
      t.innerHTML = on ? calmOpen(t.dataset.hc, D) : appTile(t.dataset.hc, D);
      if (!on) bindWidgets(t);
      if (on && kb) { const f = t.querySelector(".hc-c,.hc-go"); f && f.focus({ preventScroll: true }); }
    });
  }
  /* ===== barra lateral con todas las categorías (botón pequeño arriba a la izquierda) ===== */
  function navDrawer() {
    const old = document.querySelector(".xdrawer.navd"); if (old) { old.remove(); return; }
    const cur = (location.hash || "#inicio").slice(1).split("/")[0] || "inicio", curApp = appOf(cur);
    const box = document.createElement("div"); box.className = "xdrawer navd"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Todas las categorías");
    const apps = NAV_APPS.filter(a => a[0] !== "inicio");
    box.innerHTML = `<div class="xdrawer-p navd-p"><div class="navd-h"><a class="navd-home${cur === "inicio" ? " on" : ""}" href="#inicio">${ico("inicio", 18)}Inicio</a><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <nav class="navd-l" aria-label="Categorías">${apps.map(([k, l, items]) => { const on = curApp && curApp[0] === k;
        return `<div class="navd-g${on ? " on" : ""}"><a class="navd-a" href="#${MAINV[k] || items[0][0]}" ${items.length === 1 && on ? 'aria-current="page"' : ""}>${ico(k, 18)}<span>${esc(l)}</span></a>${items.length > 1 ? `<div class="navd-s">${items.map(([ck, cl]) => `<a href="#${ck}" ${cur === ck ? 'aria-current="page"' : ""}>${esc(cl)}</a>`).join("")}</div>` : ""}</div>`; }).join("")}</nav>
      <div class="navd-f"><span>Ctrl/⌘ K para buscar cualquier cosa</span></div></div>`;
    const close = () => { box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", ek); const b = document.querySelector("[data-navd]"); b && b.focus(); };
    const ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => { if (e.target === box || e.target.closest("[data-x]")) return close(); if (e.target.closest("a")) { box.remove(); document.removeEventListener("keydown", ek); } });
    document.addEventListener("keydown", ek); document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add("in")); setTimeout(() => { const a = box.querySelector('[aria-current="page"]') || box.querySelector(".navd-a"); a && a.focus(); }, 60);
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-navd]")) navDrawer(); });

  // ---------- Objetivos: corto, medio y largo plazo. Las barras crecen con lo que haces bien ----------
  const GH = [
    { k: "c", n: "Corto plazo", d: [7, 14], c: "#f1b55e", sug: ["Cumplir mi plan 5 días seguidos", "Hacer el chequeo cada día", "No pasar mi límite ni una vez"] },
    { k: "m", n: "Medio plazo", d: [30, 60], c: "#86a9ff", sug: ["Pasar la fase 1 del reto", "Un mes sin operaciones fuera de plan", "20 sesiones de práctica"] },
    { k: "l", n: "Largo plazo", d: [90, 180, 365], c: "#c49dff", sug: ["Conseguir mi cuenta fondeada", "Vivir del trading", "Ser un trader constante"] }];
  const WSUG = ["Tener libertad para organizar mi tiempo", "Dejar mi trabajo actual", "Dar tranquilidad a mi familia", "Demostrarme que soy constante"];
  const GPTS = [["chk", "Chequeo", 1], ["com", "Compromiso", 1], ["plan", "Día en plan", 2], ["dia", "Diario", 1], ["bt", "Práctica", 1]];
  const GPD = 3, IFL = '<path d="M10 2.5c.8 2.6 4.2 4.3 4.2 8.3a4.2 4.2 0 0 1-8.4 0c0-1.7.8-2.9 1.7-3.8.1 1.4.8 2.3 1.8 2.7-.3-2.4-.1-4.9.7-7.2z"/>';
  const ICK = '<path d="M4.5 10.5l3.5 3.5 7.5-8"/>', ITG = '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><circle cx="10" cy="10" r=".6"/>';
  async function loadGoals() {
    if (S.goalsLoaded || S.goalsLoading) return; S.goalsLoading = true;
    try {
      const { data, error } = await sb.from("docs").select("col,id,data").in("col", ["metas", "plandia"]);
      if (!error) { S.plandias = {}; S.goals = null; (data || []).forEach(d => { if (d.col === "metas" && d.id === "obj") S.goals = d.data; else if (d.col === "plandia") S.plandias[String(d.id).slice(1)] = 1; }); S.goalsLoaded = true; }
    } catch (e) { } finally { S.goalsLoading = false; }
  }
  const saveGoals = () => sb.from("docs").upsert({ user_id: S.user.id, col: "metas", id: "obj", data: S.goals, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) toast("No se pudo guardar"); });
  const addD = (k, n) => { const d = new Date(k + "T12:00:00"); d.setDate(d.getDate() + n); return dayKey(d); };
  function gIx() {
    const td = {}, pd = {}, bd = {};
    (S.allTrades || S.trades || []).forEach(t => { if (t.open_time && t.status === "closed") { const k = dayKey(t.open_time); (td[k] = td[k] || []).push(t); } });
    (S.pages || []).forEach(p => [p.created, p.updated].forEach(x => { if (x) pd[dayKey(x)] = 1; }));
    (S.btTrades || []).forEach(t => { if (t.created_at) bd[dayKey(t.created_at)] = 1; });
    return { td, pd, bd };
  }
  function gDay(k, ix) {
    const r = {}; if (mDone((S.mente || {})[k])) r.chk = 1;
    const com = (S.plandias || {})[k] || (S.planOk && S.planOk.day === k); if (com) r.com = 1;
    if (com && (ix.td[k] || []).every(t => evaluate(t).good)) r.plan = 2;
    if (ix.pd[k]) r.dia = 1; if (ix.bd[k]) r.bt = 1;
    return r;
  }
  const gSum = r => Object.values(r).reduce((a, b) => a + b, 0);
  function gProg(g, ix) {
    const end = addD(g.start, g.days - 1), today = todayKey(), last = today < end ? today : end;
    let pts = 0, k = g.start, n = 0; while (k <= last && n < 400) { pts += gSum(gDay(k, ix)); k = addD(k, 1); n++; }
    const target = g.target || g.days * GPD, left = today > end ? 0 : Math.round((new Date(end + "T12:00:00") - new Date(today + "T12:00:00")) / 864e5) + 1;
    return { pts, target, pct: Math.min(1, pts / target), end, left, done: pts >= target, over: today > end, n };
  }
  function gStreak(ix) {
    let s = 0, k = todayKey(); if (gSum(gDay(k, ix)) < 2) k = addD(k, -1);
    for (let i = 0; i < 400; i++) { const wd = new Date(k + "T12:00:00").getDay(); if (gSum(gDay(k, ix)) >= 2) s++; else if (wd !== 0 && wd !== 6) break; k = addD(k, -1); }
    return s;
  }
  const gHas = () => !!(S.goals && GH.some(h => S.goals[h.k]));
  const gPct = p => Math.round(p.pct * 100);
  function goalStrip() {
    if (!S.goalsLoaded) return "";
    if (!gHas()) return `<button type="button" class="gs-cta" data-goals>${I(ITG, 16, 1.8)}<span><b>Elige tus 3 objetivos</b><small>Uno para esta semana, otro para el mes y uno a lo grande</small></span>${I(IC.right, 15, 2)}</button>`;
    const ix = gIx();
    return `<button type="button" class="gs" data-goals aria-label="Tus objetivos. Toca para verlos">${GH.filter(h => S.goals[h.k]).map(h => { const g = S.goals[h.k], p = gProg(g, ix); return `<span class="gs-i${p.done ? " ok" : ""}" style="--gc:${h.c}"><span class="gs-t"><em>${h.n}</em><b class="mono">${gPct(p)} %</b></span><span class="gs-bar"><i style="width:${(p.pct * 100).toFixed(1)}%"></i></span><small>${esc(g.t)}</small></span>`; }).join("")}</button>`;
  }
  function goalBlock() {
    if (!S.goalsLoaded) return "";
    if (!gHas()) return `<div class="hd-c gb gb-empty"><div class="gb-ei">${I(ITG, 26, 1.6)}</div><div><h3>Tus objetivos</h3><p>Elige una meta para esta semana, otra para este mes y una a lo grande, con tu porqué. Cada cosa que hagas bien llenará las barras.</p></div><button type="button" class="x-ch pri" data-goals>Elegir mis objetivos</button></div>`;
    const ix = gIx(), td = gDay(todayKey(), ix), tp = gSum(td), st = gStreak(ix);
    const today = `<div class="gb-today"><span class="gb-tl">Hoy llevas <b class="mono">+${tp}</b> de 6</span>${GPTS.map(([k, l, v]) => `<span class="gb-pt${td[k] ? " on" : ""}">${td[k] ? I(ICK, 11, 2.8) : ""}${l} <em>+${v}</em></span>`).join("")}</div>`;
    const rows = GH.filter(h => S.goals[h.k]).map(h => {
      const g = S.goals[h.k], p = gProg(g, ix), pc = gPct(p), need = p.left ? Math.max(0, (p.target - p.pts) / p.left) : 0;
      const stt = p.done ? `<b class="gb-ok">¡Conseguido! Ponte el siguiente</b>` : p.over ? `Terminó con el ${pc} %. Ponte uno nuevo` : `Faltan <b class="mono">${p.target - p.pts}</b> puntos en ${p.left} ${p.left === 1 ? "día" : "días"} · unos ${num(need, 1).replace(/,0$/, "")} al día`;
      return `<div class="gb-r${p.done ? " ok" : ""}" style="--gc:${h.c}">
        <div class="gb-h"><span class="gb-k">${h.n}</span><b class="gb-t">${esc(g.t)}</b><span class="gb-p mono">${pc}<small>%</small></span></div>
        <div class="gb-bar" role="progressbar" aria-label="${esc(g.t)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}"><i style="width:${(p.pct * 100).toFixed(1)}%"></i>${[25, 50, 75].map(x => `<s style="left:${x}%"></s>`).join("")}</div>
        <div class="gb-f"><span class="mono">${p.pts} / ${p.target} puntos</span><span>${stt}</span></div>
        ${g.why ? `<p class="gb-why"><span>Por qué lo haces</span>${esc(g.why)}</p>` : ""}</div>`;
    }).join("");
    return `<div class="hd-c gb"><div class="gb-top"><h3>Tus objetivos</h3><span class="gb-st${st ? " on" : ""}">${I(IFL, 14, 1.8)}Racha de <b class="mono">${st}</b> ${st === 1 ? "día" : "días"}</span><button type="button" class="x-ch" data-goals>Editar</button></div>${today}<div class="gb-rows">${rows}</div></div>`;
  }
  function goalsPanel() {
    const old = document.querySelector(".xdrawer.gld"); if (old) old.remove();
    const box = document.createElement("div"); box.className = "xdrawer gld"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Tus objetivos");
    const G0 = S.goals || {}, F = {}; GH.forEach(h => { const g = G0[h.k]; F[h.k] = { t: g ? g.t : "", why: g ? g.why || "" : "", days: g ? g.days : h.d[0] }; });
    const ix = gIx();
    const sec = h => { const f = F[h.k], g = G0[h.k], p = g ? gProg(g, ix) : null; return `<section class="gl-s" style="--gc:${h.c}" data-k="${h.k}">
      <div class="gl-h"><span class="gl-dot"></span><b>${h.n}</b>${p ? `<small class="mono">${gPct(p)} % · ${p.over || p.done ? "terminado" : p.left + " días restantes"}</small>` : ""}</div>
      <label class="gl-l">Tu objetivo<input class="input" data-f="t" maxlength="70" value="${esc(f.t)}" placeholder="${esc(h.sug[0])}"></label>
      <div class="pz-chips gl-sug">${h.sug.map(s => `<button type="button" class="pz-chip" data-fill="t" data-v="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <label class="gl-l">Por qué lo haces<textarea class="input" data-f="why" rows="2" maxlength="160" placeholder="Lo que de verdad te mueve. Lo verás cada día.">${esc(f.why)}</textarea></label>
      <div class="pz-chips gl-sug">${WSUG.map(s => `<button type="button" class="pz-chip" data-fill="why" data-v="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <div class="gl-l">Plazo<div class="pz-chips">${h.d.map(d => `<button type="button" class="pz-chip" data-days="${d}" aria-pressed="${f.days === d}">${d} días</button>`).join("")}</div><small class="gl-m">Meta: <b class="mono" data-meta>${f.days * GPD}</b> puntos</small></div>
    </section>`; };
    box.innerHTML = `<div class="xdrawer-p pzp"><div class="xdr-h pz-h"><div><b>Tus objetivos</b><small>Corto, medio y largo plazo. Cada día que haces las cosas bien, las barras crecen.</small></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xdr-b">${GH.map(sec).join("")}
        <div class="gl-how"><b>Cómo se suman puntos</b><ul>${GPTS.map(([k, l, v]) => `<li><span>${{ chk: "Haces el chequeo de cómo llegas", com: "Te comprometes con tu plan", plan: "Ese día no rompes ninguna norma (o decides no operar)", dia: "Escribes en tu diario", bt: "Haces una sesión de práctica" }[k]}</span><b class="mono">+${v}</b></li>`).join("")}</ul><small>Un buen día suma de 4 a 6. La meta pide unos ${GPD} al día de media, así que hay margen para los días malos. No se pierden puntos: lo que sumas, se queda.</small></div>
      </div><div class="xdr-f"><button type="button" class="btn" data-gsave>Guardar mis objetivos</button></div></div>`;
    const close = () => { box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", ek); };
    const ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("input", e => { const s = e.target.closest(".gl-s"); if (s && e.target.dataset.f) F[s.dataset.k][e.target.dataset.f] = e.target.value; });
    box.addEventListener("click", async e => {
      if (e.target === box || e.target.closest("[data-x]")) return close();
      const s = e.target.closest(".gl-s"), fl = e.target.closest("[data-fill]");
      if (s && fl) { const inp = s.querySelector(`[data-f="${fl.dataset.fill}"]`); inp.value = fl.dataset.v; F[s.dataset.k][fl.dataset.fill] = fl.dataset.v; inp.focus(); return; }
      const dy = e.target.closest("[data-days]");
      if (s && dy) { F[s.dataset.k].days = +dy.dataset.days; s.querySelectorAll("[data-days]").forEach(b => b.setAttribute("aria-pressed", b === dy)); s.querySelector("[data-meta]").textContent = F[s.dataset.k].days * GPD; return; }
      if (e.target.closest("[data-gsave]")) {
        const G = Object.assign({}, S.goals || {}), today = todayKey(); let n = 0;
        GH.forEach(h => { const f = F[h.k], t = (f.t || "").trim(), old = G[h.k]; if (!t) { delete G[h.k]; return; } n++;
          const fresh = !old || old.t !== t || gProg(old, ix).over || gProg(old, ix).done;
          G[h.k] = { t, why: (f.why || "").trim(), days: f.days, target: f.days * GPD, start: fresh ? today : old.start }; });
        if (!n) { toast("Escribe al menos un objetivo"); return; }
        S.goals = G; await saveGoals(); close(); toast("Objetivos guardados. A por ellos"); gRefresh();
      }
    });
    document.addEventListener("keydown", ek); document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add("in")); setTimeout(() => { const x = box.querySelector("[data-f]"); x && x.focus({ preventScroll: true }); }, 220);
  }
  function gRefresh() { document.querySelectorAll("[data-gslot]").forEach(el => { el.innerHTML = goalStrip(); }); if (document.getElementById("hday") && window.__tkDay) window.__tkDay(); }
  function gToast(n, why) { if (!gHas()) return; toast(`+${n} ${n === 1 ? "punto" : "puntos"} · ${why}. Tus objetivos avanzan`); setTimeout(gRefresh, 50); }
  document.addEventListener("click", e => { if (e.target.closest("[data-goals]")) goalsPanel(); });
  /* ===== portada «conversación»: saludo, preguntas de cómo llegas y carrusel de cuadros ===== */
  const CARS = ["hoy", "plan", "calendario", "analizar", "resultados", "diario", "cartera", "backtest", "asistente"];
  /* las 5 preguntas del día: cada una aporta un dato que cambia el consejo */
  const HQ2 = [
    { k: "r", q: "¿Cómo has dormido?", o: [["1", "Fatal"], ["2", "Poco"], ["3", "Normal"], ["4", "Bien"], ["5", "Genial"]] },
    { k: "emo", q: "¿Cómo te sientes ahora mismo?", o: [["tranquilo", "Tranquilo"], ["ganas", "Con ganas"], ["nervioso", "Nervioso"], ["cansado", "Cansado"], ["frustrado", "Frustrado"], ["euforico", "Eufórico"]] },
    { k: "last", q: "¿Cómo te dejó tu última sesión?", o: [["bien", "Bien"], ["normal", "Normal"], ["mal", "Mal, pero lo acepto"], ["recuperar", "Con ganas de recuperar"], ["miedo", "Con miedo a volver a perder"], ["nueva", "Es mi primera sesión"]] },
    { k: "head", q: "¿Algo te quita la cabeza hoy?", multi: 1, o: [["nada", "Nada"], ["dinero", "Dinero"], ["trabajo", "Trabajo o estudios"], ["personal", "Algo personal"], ["salud", "Salud"]] },
    { k: "intent", q: "¿Qué quieres hacer hoy?", o: [["plan", "Seguir mi plan"], ["menos", "Operar menos, solo lo mejor"], ["mirar", "Solo mirar y aprender"], ["recuperar", "Recuperar lo de ayer"]] }
  ];
  function mDerive(M) {
    const CE = { tranquilo: 5, ganas: 4, cansado: 3, euforico: 3, nervioso: 2, frustrado: 2 };
    if (M.emo) { M.c = CE[M.emo]; M.mood = { ganas: "ganas", euforico: "ganas", nervioso: "miedo", frustrado: "prisa" }[M.emo] || "neutral"; }
    if (M.head) { const n = M.head.filter(x => x !== "nada").length; M.f = n === 0 ? 4 : n === 1 ? 3 : 2; if (M.emo === "cansado") M.f = Math.min(M.f, 3); }
    return M;
  }
  function mSet(M, k, v) {
    if (k === "head") { let arr = M.head || []; if (v === "nada") arr = arr.includes("nada") ? [] : ["nada"]; else { arr = arr.filter(x => x !== "nada"); arr = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v); } M.head = arr; }
    else if (k === "r") M.r = +v; else M[k] = v;
    return mDerive(M);
  }
  const mVal = (M, k) => k === "head" ? (M.head || []) : M[k] == null ? [] : [String(M[k])];
  const saveMente = (id, data) => sb.from("docs").upsert({ user_id: S.user.id, col: "mente", id, data, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) toast("No se pudo guardar"); });
  const homeSw = mode => `<div class="hx-sw" role="group" aria-label="Vista de la portada"><button type="button" data-home="car" aria-pressed="${mode === "car"}" title="Vista conversación">${I('<rect x="6" y="5" width="8" height="10" rx="2"/><path d="M3 7v6M17 7v6"/>', 15, 1.8)}</button><button type="button" data-home="grid" aria-pressed="${mode === "grid"}" title="Vista de cuadros">${I('<rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.5"/><rect x="11" y="3.5" width="5.5" height="5.5" rx="1.5"/><rect x="3.5" y="11" width="5.5" height="5.5" rx="1.5"/><rect x="11" y="11" width="5.5" height="5.5" rx="1.5"/>', 15, 1.8)}</button></div>`;
  function heroQ(D) {
    if (!healthOk()) return `<p class="hx-sub">Cada día te preguntaré cómo llegas, para ayudarte a operar con la cabeza en su sitio. Necesita tu permiso y solo lo ves tú.</p><div class="hx-ans"><a class="hx-a pri" href="#ajustes">Activar en Ajustes</a></div>`;
    const day = todayKey(), m = (S.mente || {})[day];
    if (mDone(m) && !S.hqEdit) {
      const a = psyAdvice(m, D), sc = mScore(m);
      return `<p class="hx-sub">${sc >= 70 ? "Llegas <b>en buen estado</b>" : sc >= 45 ? "Llegas <b>con cuidado</b>" : "Hoy es <b>un día delicado</b>"} <span class="hx-sc mono">${sc}</span> · Para hoy: <b>${esc(a.tip[0].toLowerCase())}</b></p><div class="hx-ans"><button type="button" class="hx-a pri" data-hq="panel">Ver mi consejo</button><button type="button" class="hx-a" data-hq="redo">Cambiar respuestas</button>${S.menteP ? "" : `<button type="button" class="hx-a" data-hq="perfil">Conócete · 1 minuto</button>`}</div>`;
    }
    const st = Math.min(S.hqStep || 0, HQ2.length - 1), M = S.hqM || (S.hqM = Object.assign({}, m || {})), Q = HQ2.at(st), sel = mVal(M, Q.k);
    const prog = `<div class="hx-prog" aria-label="Pregunta ${st + 1} de ${HQ2.length}">${HQ2.map((x, i) => `<i class="${i < st ? "d" : i === st ? "c" : ""}"></i>`).join("")}${st ? `<button type="button" data-hq="back">Atrás</button>` : ""}</div>`;
    return `${prog}<p class="hx-qt">${Q.q}</p><div class="hx-ans">${Q.o.map(([v, l]) => `<button type="button" class="hx-a" data-hv="${Q.k}:${v}" aria-pressed="${sel.includes(v)}">${esc(l)}</button>`).join("")}${Q.multi ? `<button type="button" class="hx-a pri" data-hq="next" ${sel.length ? "" : "disabled"}>Siguiente</button>` : ""}</div>`;
  }
  function carCats() {
    const k = CARS.filter(x => appDef(x)).at(S.hcar), a = appDef(k), cats = a[2];
    return `<div class="hx-dots">${CARS.filter(x => appDef(x)).map((x, i) => `<button type="button" data-cgo="${i}" aria-label="${esc(appDef(x)[1])}" aria-current="${i === S.hcar}"></button>`).join("")}</div>
      <div class="hx-cl"><b>${esc(a[1])}</b>${cats.length > 1 ? cats.map(([ck, cl]) => `<a href="#${ck}">${esc(cl)}</a>`).join("") : `<span>${esc(APPDESC[k] || "")}</span>`}</div>`;
  }
  function placeCar() {
    const cards = $$(".hx-c"), n = cards.length; if (!n) return;
    const vw = (document.querySelector(".hx-car") || {}).clientWidth || innerWidth, W = Math.min(380, Math.max(260, vw - 72)), gap = vw < 640 ? 14 : 26, a = S.hcar;
    cards.forEach((c, i) => {
      let d = ((i - a) % n + n) % n; if (d > n / 2) d -= n; const ad = Math.abs(d);
      c.style.width = W + "px"; c.style.transform = `translateX(calc(-50% + ${d * (W + gap)}px)) scale(${ad ? .9 : 1})`;
      c.style.opacity = ad === 0 ? 1 : ad === 1 ? .5 : ad === 2 ? .14 : 0; c.style.zIndex = 10 - ad; c.style.pointerEvents = ad > 1 ? "none" : "";
      c.classList.toggle("on", ad === 0); c.setAttribute("tabindex", ad ? "-1" : "0"); c.setAttribute("aria-hidden", ad > 1 ? "true" : "false");
    });
    const cl = document.getElementById("hxcats"); if (cl) cl.innerHTML = carCats();
    lsSet("tk-car", String(a));
  }
  /* ===== «Tu día»: ideas en prueba (Marcos dirá cuáles se quedan) ===== */
  const tagP = () => "";
  const mins = m => m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "") : Math.max(0, Math.round(m)) + " min";
  function dayX(D) {
    const p = D.p, mx = p.maxTrades || 3, L = p.dayLimitR || 2, dr = D.st.n ? D.st.tot : 0, ph = D.phase, now = Date.now();
    const m = healthOk() ? (S.mente || {})[todayKey()] : null, md = mDone(m), sc = md ? mScore(m) : null;
    const C = closed(S.trades).slice().sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)));
    const cl = closed(D.today).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)));
    const nh = (D.todayEv || []).filter(e => e.impact === "High" && e.ts > now - 15 * 6e4).sort((a, b) => a.ts - b.ts)[0];
    const toNews = nh ? (nh.ts - now) / 6e4 : null;
    const l2 = cl.slice(-2), twoLoss = l2.length === 2 && l2.every(t => +t.r < 0);
    let fastBack = false;
    const T = D.today.slice().sort((a, b) => new Date(a.open_time) - new Date(b.open_time));
    for (let i = 1; i < T.length; i++) { const pv = T.at(i - 1); if (pv.status === "closed" && +pv.r < 0 && pv.close_time && (new Date(T.at(i).open_time) - new Date(pv.close_time)) < 5 * 6e4) fastBack = true; }
    const X = {};
    /* 1 · semáforo */
    let lv = "g"; const why = [];
    if (ph === "despues") { lv = "x"; why.push("Tu horario ha terminado: toca revisar, no operar"); }
    else {
      if (dr <= -L) { lv = "r"; why.push("Has llegado a tu límite del día"); }
      if (D.today.length >= mx) { lv = "r"; why.push("Has llegado a tu máximo de operaciones"); }
      if (md && sc < 45) { lv = "r"; why.push("Llegas en un día delicado (" + sc + ")"); }
      if (m && m.intent === "recuperar") { lv = "r"; why.push("Has dicho que quieres recuperar lo de ayer"); }
      if (lv !== "r") {
        if (!md && healthOk()) { lv = "a"; why.push("Aún no me has contado cómo llegas"); }
        if (md && sc < 70) { lv = "a"; why.push("Llegas con cuidado (" + sc + ")"); }
        if (D.st.n && dr <= -L * .6) { lv = "a"; why.push("Ya has usado más del 60 % de tu límite"); }
        if (twoLoss) { lv = "a"; why.push("Llevas dos pérdidas seguidas"); }
        if (toNews != null && toNews < 30 && toNews > -15) { lv = "a"; why.push("Noticia fuerte a las " + hhmm(nh.ts)); }
      }
      if (!why.length) why.push(md ? "Llegas bien, con margen en tu límite y sin noticias cerca" : "Con margen en tu límite y sin noticias cerca");
    }
    const LT = { g: ["Listo para operar tu plan", "Mismo riesgo y mismo máximo de siempre."], a: ["Opera con cuidado", "Hoy, medio riesgo y una operación menos de lo normal."], r: ["Hoy mejor solo mirar", "Apunta lo que veas en el Diario en vez de entrar."], x: ["Sesión terminada", "Revisa tus operaciones y escribe tu cierre."] };
    X.sem = `<div class="hd-sem s-${lv}">${tagP(1)}<span class="hd-dot" aria-hidden="true"></span><div><b>${LT[lv][0]}</b><p>${LT[lv][1]}</p><small>${why.map(esc).join(" · ")}</small></div></div>`;
    /* 2 · lo que te dijiste ayer */
    const tk = todayKey(), cier = (S.pages || []).filter(x => /^Cierre del/.test(x.title || "") && dayKey(new Date(x.created || x.updated || 0)) < tk).sort((a, b) => (b.created || 0) - (a.created || 0))[0];
    let msg = "";
    if (cier) { const d = document.createElement("div"); d.innerHTML = cier.html || ""; const hs = [...d.querySelectorAll("h1,h2,h3,b,strong")]; const h = hs.find(x => /mañana/i.test(x.textContent)); let n = h ? h.nextElementSibling : null; while (n && !n.textContent.trim() && n.nextElementSibling) n = n.nextElementSibling; msg = n ? n.textContent.trim() : ""; }
    X.ayer = `<div class="hd-c hd-ayer">${tagP(2)}<h3>Lo que te dijiste ayer</h3>${msg ? `<blockquote>«${esc(msg.slice(0, 220))}»</blockquote><small>De tu cierre del ${new Date(cier.created || cier.updated).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</small>` : cier ? `<p class="hd-e">Tu último cierre no tiene nada en «Una cosa para mañana». La próxima vez, deja ahí una frase para hoy.</p>` : `<p class="hd-e">Cuando escribas tu cierre del día, mañana verás aquí la frase que te dejaste para hoy.</p>`}</div>`;
    /* 3 · el precio de lo evitable (este mes) */
    const m0 = dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), CM = C.filter(t => dayKey(dateOf(t)) >= m0), EV = CM.filter(t => !evaluate(t).good);
    const tot = CM.reduce((a, t) => a + (+t.r || 0), 0), evs = EV.reduce((a, t) => a + (+t.r || 0), 0);
    X.cost = `<div class="hd-c">${tagP(3)}<h3>El precio de lo evitable</h3>${!CM.length ? `<p class="hd-e">Este mes aún no hay operaciones cerradas.</p>` : !EV.length ? `<p class="hd-big"><b class="mono">0</b> operaciones fuera de plan este mes</p><p class="hd-e">Todo lo que has operado este mes ha seguido tu plan.</p>` : evs < 0 ? `<p class="hd-big"><b class="mono">${fmtV(evs)}</b> te han costado ${EV.length} ${EV.length === 1 ? "operación" : "operaciones"} fuera de plan</p><p class="hd-e">Sin ellas irías <b>${fmtV(tot - evs)}</b> este mes en vez de <b>${fmtV(tot)}</b>.</p>` : `<p class="hd-big"><b class="mono">${fmtV(evs)}</b> te han dado ${EV.length} ${EV.length === 1 ? "operación" : "operaciones"} fuera de plan</p><p class="hd-e">Han salido bien, pero son hábitos que tarde o temprano salen caros.</p>`}</div>`;
    /* 4 · zona de no operar por noticias */
    /* 5 · aviso de calentón y pausa */
    const pu = S.pauseUntil && S.pauseUntil > now ? S.pauseUntil : 0, tool = ((PCALM.find(c => c[0] === ((S.menteP || {}).calm || [])[0]) || PCALM[4])[2]);
    X.heat = `<div class="hd-c hd-heat ${pu || ((twoLoss || fastBack) && ph === "en") ? "hot" : ""}">${tagP(5)}<h3>Calentón</h3>${pu ? `<p class="hd-big">Pausa hasta las <b class="mono">${hhmm(pu)}</b></p><p class="hd-e">Quedan ${mins((pu - now) / 6e4)}. Mientras: ${esc(tool)}.</p><button type="button" class="x-ch" data-hx="pause0">Terminar la pausa</button>` : (twoLoss || fastBack) ? `<p class="hd-big">${twoLoss ? "Dos pérdidas seguidas" : "Has vuelto a entrar muy rápido tras perder"}</p><p class="hd-e">Antes de la siguiente, 10 minutos fuera. Es cuando más se arriesga para recuperar.</p><button type="button" class="x-ch pri" data-hx="pause">Empezar pausa de 10 min</button>` : `<p class="hd-e">Sin señales. Te avisaré si encadenas dos pérdidas o vuelves a entrar menos de 5 minutos después de perder.</p>`}</div>`;
    /* 6 · tu franja buena y tu franja mala */
    const C90 = C.filter(t => new Date(dateOf(t)) >= now - 90 * 864e5), byH = {};
    C90.forEach(t => { const h = new Date(t.open_time).getHours(); (byH[h] = byH[h] || [0, 0]); byH[h][1]++; if (evaluate(t).good) byH[h][0]++; });
    const hs = Object.entries(byH).filter(([, v]) => v[1] >= 3).map(([h, v]) => [+h, v[0] / v[1], v[1]]).sort((a, b) => b[1] - a[1]), curH = new Date().getHours();
    X.hours = `<div class="hd-c">${tagP(6)}<h3>Tus horas</h3>${hs.length >= 2 ? `<ul class="hd-hrs"><li><span>Mejor hora</span><b class="mono">${hs[0][0]}:00–${hs[0][0] + 1}:00</b><small>${Math.round(hs[0][1] * 100)} % en plan · ${hs[0][2]} op.</small></li><li><span>Peor hora</span><b class="mono">${hs.at(-1)[0]}:00–${hs.at(-1)[0] + 1}:00</b><small>${Math.round(hs.at(-1)[1] * 100)} % en plan · ${hs.at(-1)[2]} op.</small></li></ul>${curH === hs[0][0] ? `<p class="hd-e"><b>Ahora estás en tu mejor hora.</b></p>` : curH === hs.at(-1)[0] ? `<p class="hd-e"><b>Ahora estás en tu peor hora:</b> cuidado extra.</p>` : ""}` : `<p class="hd-e">Con unas 3 operaciones en cada franja horaria te diré cuál es tu mejor y tu peor hora (llevas ${C90.length} en 90 días).</p>`}</div>`;
    /* 7 · norma en foco de la semana */
    const cnt = {}; C.filter(t => new Date(dateOf(t)) >= now - 30 * 864e5).forEach(t => evaluate(t).fail.forEach(f => { const k = NK(f.fix); if (k) cnt[k] = (cnt[k] || 0) + 1; }));
    const fo = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
    const wk = {}; C.filter(t => new Date(dateOf(t)) >= mon).forEach(t => { const k = dayKey(dateOf(t)); (wk[k] = wk[k] || []).push(t); });
    const wdays = Object.keys(wk).sort(), okd = fo ? wdays.filter(k => wk[k].every(t => !evaluate(t).fail.some(f => NK(f.fix) === fo[0]))).length : 0;
    X.focus = `<div class="hd-c">${tagP(7)}<h3>Norma en foco de la semana</h3>${fo ? `<p class="hd-big"><b>${NLAB[fo[0]]}</b></p><div class="hd-fd">${wdays.map(k => `<i class="${wk[k].every(t => !evaluate(t).fail.some(f => NK(f.fix) === fo[0])) ? "ok" : "no"}" title="${k}"></i>`).join("") || "<small>Aún no has operado esta semana</small>"}</div><p class="hd-e">${wdays.length ? `${okd} de ${wdays.length} días cumplida esta semana. Meta: todos.` : "Es la que más rompiste en 30 días. Esta semana, solo esta."}</p>` : `<p class="hd-e">No has roto ninguna norma en 30 días. Cuando rompas alguna, aquí tendrás tu foco de la semana.</p>`}</div>`;
    /* 8 · la operación para aprender */
    const C7 = C.filter(t => new Date(dateOf(t)) >= now - 7 * 864e5);
    const evT = C7.filter(t => !evaluate(t).good).sort((a, b) => (+a.r || 0) - (+b.r || 0))[0], glT = C7.filter(t => evaluate(t).good && +t.r < 0).at(-1), lt = evT || glT;
    X.learn = `<div class="hd-c">${tagP(8)}<h3>La operación para aprender</h3>${lt ? `<a class="hd-lt" href="#op/${encodeURIComponent(lt.id)}"><span class="mono">${new Date(lt.open_time).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}</span><b>${esc(lt.symbol || "")}</b><span>${lt.side === "buy" ? "Compra" : "Venta"}</span><span class="mono">${fmtV(+lt.r, mOf(lt))}</span></a><p class="hd-e">${evT ? `Te saltaste «${esc((NLAB[NK((evaluate(lt).fail[0] || {}).fix || "")] || "tu plan").toLowerCase())}». ¿Qué te empujó a hacerlo y qué harás la próxima vez?` : "Perdiste haciendo todo bien. ¿Qué te dice esta operación de tu plan? Una buena pérdida también enseña."}</p><a class="x-ch" href="#op/${encodeURIComponent(lt.id)}">Revisarla</a>` : `<p class="hd-e">Esta semana no hay operaciones fuera de plan ni pérdidas que revisar.</p>`}</div>`;
    /* 9 · descubrimiento */
    let disc = "";
    if (C.length >= 15) {
      let a2 = 0, a2b = 0; for (let i = 2; i < C.length; i++) { if (+C.at(i - 1).r > 0 && +C.at(i - 2).r > 0) { a2++; if (!evaluate(C.at(i)).good) a2b++; } }
      const base = C.filter(t => !evaluate(t).good).length / C.length;
      const evF = {}; C.filter(t => !evaluate(t).good && t.review && t.review.feel).forEach(t => { evF[t.review.feel] = (evF[t.review.feel] || 0) + 1; }); const tf = Object.entries(evF).sort((a, b) => b[1] - a[1])[0];
      const dow = {}; C.forEach(t => { const d = (new Date(dateOf(t)).getDay() + 6) % 7; (dow[d] = dow[d] || [0, 0]); dow[d][1]++; if (evaluate(t).good) dow[d][0]++; });
      const wd = Object.entries(dow).filter(([, v]) => v[1] >= 4).map(([d, v]) => [+d, v[0] / v[1]]).sort((a, b) => a[1] - b[1])[0];
      if (a2 >= 3 && a2b / a2 > base + .15) disc = `Después de dos ganancias seguidas, el ${Math.round(a2b / a2 * 100)} % de tus operaciones se salen del plan (normalmente, el ${Math.round(base * 100)} %).`;
      else if (tf && tf[1] >= 3) disc = `«${tf[0]}» es lo que más sentías antes de tus operaciones fuera de plan (${tf[1]} veces).`;
      else if (wd && wd[1] < .7) disc = `Los ${["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"].at(wd[0])} son tu peor día: solo el ${Math.round(wd[1] * 100)} % dentro del plan.`;
    }
    X.disc = `<div class="hd-c hd-disc">${tagP(9)}<h3>Descubrimiento</h3>${disc ? `<p class="hd-big">${esc(disc)}</p>` : `<p class="hd-e">${C.length < 15 ? `Con unas 15 operaciones empezaré a encontrar patrones tuyos (llevas ${C.length}).` : "De momento no veo ningún patrón claro. Buena señal."}</p>`}</div>`;
    /* 10 · esta semana frente a la anterior (proceso) */
    const pmon = new Date(mon); pmon.setDate(pmon.getDate() - 7);
    const wA = C.filter(t => new Date(dateOf(t)) >= mon), wB = C.filter(t => new Date(dateOf(t)) >= pmon && new Date(dateOf(t)) < mon);
    const pct = L0 => L0.length ? Math.round(L0.filter(t => evaluate(t).good).length / L0.length * 100) : null, evn = L0 => L0.filter(t => !evaluate(t).good).length;
    const cmp = (lbl, a, b, unit, betterUp) => { const d = a != null && b != null ? a - b : null, good = d == null || d === 0 ? "" : (d > 0) === betterUp ? "up" : "down";
      return `<li><span>${lbl}</span><b class="mono">${a == null ? "—" : a + unit}</b><small class="${good}">${d == null ? "sin datos de la anterior" : d === 0 ? "igual que la anterior" : (d > 0 ? "▲ " : "▼ ") + Math.abs(d) + unit + " frente a la anterior"}</small></li>`; };
    X.vs = `<div class="hd-c">${tagP(10)}<h3>Esta semana frente a la anterior</h3><ul class="hd-hrs">${cmp("Dentro del plan", pct(wA), pct(wB), " %", true)}${cmp("Fuera de plan", evn(wA), wB.length ? evn(wB) : null, "", false)}</ul></div>`;
    /* 11 · ritmo del reto */
    const F = (S.accts || []).filter(a => a.status !== "archivada" && a.type === "fondeo" && (+a.target || +a.minDays || a.deadline));
    X.reto = F.length ? `<div class="hd-c">${tagP(11)}<h3>Ritmo del reto</h3><ul class="hd-acc">${F.slice(0, 2).map(a => { const x = accR(a), left = Math.max(0, x.need - x.sum), dl = a.deadline ? Math.max(0, Math.ceil((new Date(a.deadline + "T23:59") - now) / 864e5)) : null;
      const daysOp = new Set((S.allTrades || S.trades).filter(t => a.number && String(t.account || "") === String(a.number) && t.status === "closed").map(t => dayKey(dateOf(t)))).size, minL = +a.minDays ? Math.max(0, +a.minDays - daysOp) : null;
      const tdays = dl != null ? Math.max(1, Math.round(dl * 5 / 7)) : null, per = tdays && left ? left / tdays : null;
      return `<li><div><b>${esc(acctName(a))}</b><small>${x.need ? (left ? `Faltan ${num(left, 1)} R` : "Objetivo conseguido") : ""}${minL != null ? ` · ${minL ? minL + " días mínimos por operar" : "días mínimos cumplidos"}` : ""}${dl != null ? ` · ${dl} días de plazo` : ""}</small></div><span>${per != null ? (per <= .6 ? `Sin prisa: <b class="mono">+${num(per, 1)} R</b>/día` : `<b class="mono">+${num(per, 1)} R</b>/día`) : left ? "Sin fecha límite" : ""}</span></li>`; }).join("")}</ul><p class="hd-e">Ir con calma es la forma más rápida de pasar un reto: no hace falta forzar.</p></div>` : "";
    return X;
  }
  /* ===== panel «Tu día»: debajo de la portada, lo más importante de la jornada ===== */
  const NEWS_IMP = { High: 3, Medium: 2, Low: 1 };
  function homeDay(D) {
    const p = D.p, used = D.today.length, mx = p.maxTrades || 3, L = p.dayLimitR || 2, dr = D.st.n ? D.st.tot : 0, ph = D.phase;
    const m = healthOk() ? (S.mente || {})[todayKey()] : null, md = mDone(m), sc = md ? mScore(m) : null, ok = S.planOk && S.planOk.day === todayKey();
    const cl = closed(D.today), good = cl.filter(t => evaluate(t).good).length;
    const byDay = {}; closed(S.trades).forEach(t => { const k = dayKey(dateOf(t)); (byDay[k] = byDay[k] || []).push(t); });
    let racha = 0; for (const k of Object.keys(byDay).sort().reverse()) { if (byDay[k].every(t => evaluate(t).good)) racha++; else break; }
    const margin = Math.max(0, L + Math.min(0, dr));
    const kpi = (lbl, val, sub) => `<div class="hd-k"><span>${lbl}</span><b class="mono">${val}</b><small>${sub}</small></div>`;
    const kpis = `<div class="hd-kpis">${kpi("Resultado de hoy", D.st.n ? fmtV(D.st.tot, D.st.mt) : fmtV(0, 0), D.st.n ? D.st.n + (D.st.n === 1 ? " cerrada" : " cerradas") : "sin operaciones")}${kpi("Operaciones", used + " de " + mx, used >= mx ? "has llegado al máximo" : (mx - used) + " por delante")}${kpi("Aún puedes perder", fmtVabs(margin), "límite del día −" + fmtLim(L))}${kpi("Cómo llegas", md ? String(sc) : "—", md ? mLabel(sc) : "sin chequeo hoy")}${kpi("Dentro del plan", cl.length ? Math.round(good / cl.length * 100) + " %" : "—", racha ? racha + (racha === 1 ? " día seguido" : " días seguidos") : "hoy")}</div>`;
    // preparación
    const nh = (D.todayEv || []).filter(e => e.impact === "High").sort((a, b) => a.ts - b.ts);
    const step = (done, title, sub, act) => `<li class="${done ? "ok" : ""}"><span class="hd-ck">${done ? I('<path d="M4.5 10.5l3.5 3.5 7.5-8"/>', 12, 2.6) : ""}</span><div><b>${title}</b><small>${sub}</small></div>${act || ""}</li>`;
    let nvSeen = false; try { nvSeen = localStorage.getItem("tk-nv") === todayKey(); } catch (e) { }
    const hOk = healthOk(), newsOk = !!S.news && (!!S.news.err || !nh.length || nvSeen);
    const prepOk = (md || !hOk) && ok && newsOk && (!!(m && m.sit) || !hOk);
    const prep = `<div class="hd-c hd-prep ${prepOk ? "done" : "req"}"><h3>Antes de operar</h3><ul class="hd-steps">
      ${step(md, "Cuéntame cómo llegas", md ? `${mLabel(sc)} · para hoy: ${esc(psyAdvice(m, D).tip[0].toLowerCase())}` : healthOk() ? "5 preguntas, 15 segundos" : "Actívalo en Ajustes", md ? "" : healthOk() ? `<button type="button" class="x-ch" data-hd="checkin">Hacer ahora</button>` : `<a class="x-ch" href="#ajustes">Ajustes</a>`)}
      ${step(ok, "Comprométete con tu plan", ok ? "Hecho a las " + new Date(S.planOk.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "Riesgo " + num(p.riskPct, 2).replace(/,?0+$/, "") + " % · máximo " + mx + " · límite −" + fmtLim(L), ok ? "" : `<button type="button" class="x-ch" data-pcommit>Me comprometo</button>`)}
      ${step(newsOk, nh.length ? "Mira las noticias fuertes" : "Noticias fuertes", !S.news ? "Cargando…" : S.news.err ? "No se pudo cargar el calendario" : nh.length ? nh.map(e => hhmm(e.ts)).join(" · ") + (nvSeen ? " · vistas, ten cuidado cerca de esas horas" : " · ábrelas antes de operar") : "Hoy no hay noticias de alto impacto", nh.length && !nvSeen ? `<a class="x-ch" href="#noticias" data-hd="newsv">Ver</a>` : "")}
      ${hOk ? step(!!(m && m.sit), "Ten tu regla de hoy a mano", m && m.sit ? `Si ${esc(m.sit)} → ${esc(m.then)}` : "Sale de tu consejo, después del chequeo", "") : ""}
      <li class="hd-prep-st" aria-live="polite">${prepOk ? "Todo listo. Puedes operar." : "Completa todos los pasos antes de operar."}</li>
    </ul></div>`;
    // noticias de hoy
    const evs = (D.todayEv || []).filter(e => NEWS_IMP[e.impact] >= 2).sort((a, b) => a.ts - b.ts).slice(0, 7);
    const inH = ts => { const d = new Date(ts), mm = d.getHours() * 60 + d.getMinutes(); return mm >= D.a && mm < D.b; };
    const news = `<div class="hd-c"><h3>Noticias de hoy</h3>${!S.news ? `<p class="hd-e">Cargando el calendario…</p>` : evs.length ? `<ul class="hd-news">${evs.map(e => `<li class="${e.ts < Date.now() ? "past" : ""}"><span class="mono">${hhmm(e.ts)}</span><i class="imp i${NEWS_IMP[e.impact]}" title="${e.impact === "High" ? "Impacto alto" : "Impacto medio"}"></i><b>${esc(e.country || "")}</b><span class="t">${esc(e.title || "")}</span>${inH(e.ts) ? `<em>en tu horario</em>` : ""}</li>`).join("")}</ul>` : `<p class="hd-e">Hoy no hay noticias de impacto alto ni medio.</p>`}<a class="hd-more" href="#noticias">Calendario completo</a></div>`;
    // consejo
    const tip = md ? psyAdvice(m, D) : null;
    const advice = `<div class="hd-c hd-tip"><h3>Tu consejo de hoy</h3>${tip ? `<b>${esc(tip.tip[0])}</b><p>${esc(tip.tip[2])}</p>${tip.tip[3] ? `<small>Estudio: ${esc(tip.tip[3])}</small>` : ""}<button type="button" class="x-ch" data-hd="psy">Ver mi día completo</button>` : `<p class="hd-e">Contesta las 5 preguntas de arriba y aquí tendrás un consejo hecho para ti.</p><button type="button" class="x-ch" data-hd="checkin">Empezar</button>`}</div>`;
    // operaciones
    const ops = `<div class="hd-c hd-wide"><h3>Operaciones de hoy</h3>${D.today.length ? `<ul class="hd-ops">${D.today.slice().sort((a, b) => new Date(b.open_time) - new Date(a.open_time)).map(t => { const ev = t.status === "closed" ? evaluate(t) : null, side = t.side === "buy" ? "Compra" : "Venta";
      return `<li><a href="#op/${encodeURIComponent(t.id)}"><span class="mono">${hhmm(t.open_time)}</span><b>${esc(t.symbol || "")}</b><span>${side}</span><span class="mono r">${t.status === "closed" && t.r != null ? fmtV(+t.r, mOf(t)) : "abierta"}</span>${ev ? `<em class="${ev.good ? "ok" : "bad"}">${ev.good ? "Dentro del plan" : "Fuera: " + esc((ev.fail[0] && NLAB[NK(ev.fail[0].fix)]) || "revisar")}</em>` : `<em>en curso</em>`}</a></li>`; }).join("")}</ul>` : `<p class="hd-e">${ph === "antes" ? "Tu sesión aún no ha empezado." : ph === "en" ? "Aún no has operado. No operar también es una buena sesión si no aparece tu setup." : "Hoy no has operado."}</p>`}<button type="button" class="hd-more" data-hd="informe">Ver el informe del día</button></div>`;
    // semana
    const mon = new Date(); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
    let wt = 0, wm = 0, wd = 0, wok = 0;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = dayKey(d), Ld = byDay[k] || [], st = tradeStats(Ld); if (Ld.length) { wt += st.tot; wm += st.mt || 0; wd++; if (Ld.every(t => evaluate(t).good)) wok++; }
      return `<div class="hd-wd ${Ld.length ? (st.tot > 0 ? "p" : st.tot < 0 ? "n" : "z") : ""}${k === todayKey() ? " hoy" : ""}"><span>${["L", "M", "X", "J", "V", "S", "D"].at(i)}</span><b class="mono">${Ld.length ? fmtMs(st.tot, st.mt) : "·"}</b></div>`; }).join("");
    const week = `<div class="hd-c"><h3>Esta semana</h3><div class="hd-week">${days}</div><p class="hd-ws"><b class="mono">${wd ? fmtV(wt, wm) : fmtV(0, 0)}</b> en ${wd} ${wd === 1 ? "día" : "días"} · <b>${wok} de ${wd}</b> en plan</p><a class="hd-more" href="#calendario">Abrir el calendario</a></div>`;
    // cuentas de fondeo: lo que te queda hoy
    const F = (S.accts || []).filter(a => a.status !== "archivada" && a.type === "fondeo").slice(0, 3);
    const acc = F.length ? `<div class="hd-c"><h3>Tus cuentas de fondeo</h3><ul class="hd-acc">${F.map(a => { const rp = +a.risk || (S.basePlan || p).riskPct || 1, dd = +a.dailyDD || 0, lim = dd ? (a.dailyU === "R" ? dd : dd / rp) : 0;
      const T = (S.allTrades || S.trades).filter(t => a.number && String(t.account || "") === String(a.number) && t.status === "closed" && t.r != null && dayKey(t.open_time) === todayKey()), td = T.reduce((s, t) => s + (+t.r || 0), 0), x = accR(a), pr = x.need ? Math.max(0, Math.min(1, x.sum / x.need)) : null;
      return `<li><div><b>${esc(acctName(a))}</b><small>${a.phase === "f2" ? "Fase 2" : a.phase === "fin" ? "Financiada" : "Fase 1"}${pr != null ? " · " + Math.round(pr * 100) + " % del objetivo" : ""}</small></div><span>${lim ? `Te queda hoy <b class="mono">${num(Math.max(0, lim + Math.min(0, td)), 1)} R</b>` : `Hoy <b class="mono">${fmtV(td)}</b>`}</span></li>`; }).join("")}</ul><a class="hd-more" href="#cuentas">Ver cuentas</a></div>` : "";
    // cierre
    const close = `<div class="hd-c hd-close"><h3>Cierre del día</h3>${ph === "despues" ? `<p>Dos minutos para cerrar bien: qué hiciste bien, qué mejorarías y una cosa para mañana.</p><button type="button" class="x-ch pri" data-hd="cierre">Escribir mi cierre</button>` : `<p class="hd-e">Al terminar tu horario (${esc(p.end)}) aquí escribirás tu cierre del día: qué hiciste bien, qué mejorarías y una cosa para mañana.</p>`}<button type="button" class="hd-more" data-hd="informe">Informe del día</button></div>`;
    const order = ph === "despues" ? [kpis, `<div class="hd-g">${ops}${close}</div>`, `<div class="hd-g">${week}${advice}${acc || news}</div>`] : ph === "en" ? [kpis, `<div class="hd-g">${ops}${advice}</div>`, `<div class="hd-g">${news}${week}${acc || prep}</div>`] : [kpis, `<div class="hd-g">${prep}${news}${advice}</div>`, `<div class="hd-g">${ops}${week}</div>`, acc ? `<div class="hd-g two">${acc}${close}</div>` : `<div class="hd-g two">${close}</div>`];
    const X = dayX(D);
    const top = `<div class="hd-top">${X.sem}${X.ayer}</div>`;
    const prot = `<div class="hd-g two">${X.heat}${X.hours}</div>`;
    const learn = `<div class="hd-sub"><h2>Para aprender más rápido</h2></div><div class="hd-g">${X.focus}${X.learn}${X.disc}</div><div class="hd-g ${X.reto ? "" : "two"}">${X.cost}${X.vs}${X.reto}</div>`;
    order.splice(0, 1, goalBlock(), top, kpis, ph === "despues" ? "" : prot);
    order.push(learn);
    return `<div class="hd-head"><h2>Tu día</h2><span>${cap(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))} · ${ph === "antes" ? "antes de tu horario" : ph === "en" ? "en tu horario" : "sesión terminada"}</span></div>${order.join("")}`;
  }
  function paintDay() { const el = document.getElementById("hday"); if (el) { el.innerHTML = homeDay(hData()); bindWidgets(el); } }
  window.__tkDay = paintDay;
  function homeCar(D, first) {
    const n = CARS.filter(k => appDef(k)).length;
    S.hcar = ((S.hcar != null ? S.hcar : +lsGet("tk-car", "0") || 0) % n + n) % n;
    let hl = greetLine(D).replace(/(a las \d{1,2}:\d{2})/, "<em>$1</em>"); if (!/<em>/.test(hl)) hl = hl.replace(/(\S+ \S+)$/, "<em>$1</em>");
    return `<div class="hx">
      <div class="hx-top"><span class="hx-pill">${cap(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))} · ${D.phase === "en" ? "En tu horario" : D.phase === "antes" ? "Antes de tu horario" : "Fuera de horario"}</span>${homeSw("car")}</div>
      <h1 class="hx-hi">Hola, ${first},<br>${hl}</h1>
      <div class="hx-goals" data-gslot>${goalStrip()}</div>
      <div class="hx-q" id="hxq" aria-live="polite">${heroQ(D)}</div>
      <div class="hx-car" role="region" aria-roledescription="carrusel" aria-label="Tus apartados">
        <div class="hx-glow" aria-hidden="true"></div>
        <div class="hx-track">${CARS.filter(k => appDef(k)).map((k, i) => `<div class="hb-t hx-c t-${k}" data-ci="${i}" data-hc="${k}" data-href="${appHref(k)}" role="button" tabindex="-1" aria-label="${esc(appDef(k)[1])}: ${esc(APPDESC[k] || "")}">${appTile(k, D)}</div>`).join("")}</div>
        <button type="button" class="hx-arr l" data-car="-1" aria-label="Anterior">${I(IC.left, 18, 2)}</button>
        <button type="button" class="hx-arr r" data-car="1" aria-label="Siguiente">${I(IC.right, 18, 2)}</button>
      </div>
      <div class="hx-cats" id="hxcats"></div>
      <button type="button" class="hx-down" data-hd="down" aria-label="Bajar a Tu día"><span>Tu día</span>${I('<path d="M5 8l5 5 5-5"/>', 16, 2)}</button>
    </div>
    <section class="hd" id="hday" aria-label="Tu día">${homeDay(D)}</section>`;
  }
  function bindHero() {
    const q = document.getElementById("hxq"); if (!q || q.__b) return; q.__b = true;
    const repaint = () => { q.innerHTML = heroQ(hData()); const f = q.querySelector(".hx-a"); if (f && q.contains(document.activeElement) === false && S.hqKb) f.focus({ preventScroll: true }); };
    window.__tkHero = repaint;
    q.addEventListener("click", e => {
      const b = e.target.closest("[data-hv],[data-hq]"); if (!b) return; S.hqKb = e.detail === 0;
      const M = S.hqM || (S.hqM = {});
      const fin = () => {
        const day = todayKey(); M.ts = Date.now(); S.mente = S.mente || {}; const wasDone = mDone(S.mente[day]); S.mente[day] = mDerive(Object.assign({}, (S.mente[day] || {}), M));
        saveMente("d" + day, S.mente[day]); S.hqStep = 0; S.hqM = null; S.hqEdit = false; repaint(); if (!wasDone && mDone(S.mente[day])) gToast(1, "chequeo hecho");
        ["resultados", "plan"].forEach(k => { const t = document.querySelector('.hb-t[data-hc="' + k + '"]'); if (t) { t.innerHTML = appTile(k, hData()); bindWidgets(t); } });
        toast("Gracias. Tu consejo de hoy ya está listo"); window.__tkDay && window.__tkDay();
      };
      if (b.dataset.hv) {
        const i = b.dataset.hv.indexOf(":"), k = b.dataset.hv.slice(0, i), v = b.dataset.hv.slice(i + 1); mSet(M, k, v);
        if (k === "head") return repaint();
        if (k === "intent") return setTimeout(fin, 160);
        S.hqStep = (S.hqStep || 0) + 1; return setTimeout(repaint, 160);
      }
      if (b.disabled) return;
      const g = b.dataset.hq;
      if (g === "next") { S.hqStep = (S.hqStep || 0) + 1; repaint(); }
      else if (g === "back") { S.hqStep = Math.max(0, (S.hqStep || 0) - 1); repaint(); }
      else if (g === "redo") { S.hqEdit = true; S.hqStep = 0; S.hqM = Object.assign({}, (S.mente || {})[todayKey()] || {}); repaint(); }
      else if (g === "panel") psyPanel();
      else if (g === "perfil") psyPanel("perfil");
    });
  }
  function bindDay() {
    if (window.__tkHdB) return; window.__tkHdB = true;
    document.addEventListener("click", e => { const b = e.target.closest("[data-hx]"); if (!b) return; if (b.dataset.hx === "pause") { S.pauseUntil = Date.now() + 10 * 6e4; toast("Pausa de 10 minutos. Aléjate de la pantalla"); } else S.pauseUntil = 0; paintDay(); });
    setInterval(() => { if (document.visibilityState === "visible" && document.getElementById("hday")) paintDay(); }, 60000);
    document.addEventListener("click", async e => {
      const b = e.target.closest("[data-hd]"); if (!b) return; const k = b.dataset.hd;
      if (k === "down") { const el = document.getElementById("hday"); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); }
      else if (k === "checkin") { window.scrollTo({ top: 0, behavior: "smooth" }); S.hqEdit = !mDone((S.mente || {})[todayKey()]) ? false : S.hqEdit; setTimeout(() => { const f = document.querySelector("#hxq .hx-a"); f && f.focus({ preventScroll: true }); }, 450); }
      else if (k === "newsv") { try { localStorage.setItem("tk-nv", todayKey()); } catch (e) { } }
      else if (k === "psy") psyPanel();
      else if (k === "informe") { S.repDay = todayKey(); location.hash = "#informe"; }
      else if (k === "cierre") { const Dd = DI(); if (!Dd) return; await Dd.loadPages(); const p = Dd.newPage(null); p.title = "Cierre del " + new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long" }); p.html = "<h3>Lo que hice bien</h3><p></p><h3>Lo que mejoraría</h3><p></p><h3>Una cosa para mañana</h3><p></p>"; await Dd.savePage(p); location.hash = "#diario/" + encodeURIComponent(p.id); }
    });
  }
  function bindCar() {
    bindDay(); bindHero(); if (!S.pagesLoaded && DI()) DI().loadPages().then(() => window.__tkDay && window.__tkDay()).catch(() => {}); if (!S.news && window.tkLoadNews) tkLoadNews().then(() => window.__tkDay && window.__tkDay()); bindWidgets(document); loadMini(); loadMente(); loadPlanOk();
    if (!window.__tkMini) { window.__tkMini = setInterval(() => { if (document.visibilityState === "visible") loadMini(); }, 60000); }
    const n = CARS.filter(k => appDef(k)).length, go = i => { S.hcar = ((i % n) + n) % n; placeCar(); };
    placeCar();
    $$("[data-car]").forEach(b => b.onclick = () => go(S.hcar + +b.dataset.car));
    const cats = document.getElementById("hxcats"); if (cats) cats.onclick = e => { const b = e.target.closest("[data-cgo]"); if (b) go(+b.dataset.cgo); };
    $$(".hx-c").forEach(c => {
      const open = () => { const k = c.dataset.hc; if (k === "resultados") psyPanel(); else location.hash = c.dataset.href; };
      c.addEventListener("click", e => { if (e.target.closest("[data-stop]")) return; if (S.hxSwiped && Date.now() - S.hxSwiped < 400) return; const i = +c.dataset.ci; if (i !== S.hcar) go(i); else open(); });
      c.addEventListener("keydown", e => { if (e.target === c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); } });
    });
    const car = $(".hx-car");
    if (car) {
      car.addEventListener("keydown", e => { if (e.key === "ArrowLeft") { e.preventDefault(); go(S.hcar - 1); const c = $(".hx-c.on"); c && c.focus({ preventScroll: true }); } if (e.key === "ArrowRight") { e.preventDefault(); go(S.hcar + 1); const c = $(".hx-c.on"); c && c.focus({ preventScroll: true }); } });
      let x0 = null; car.addEventListener("pointerdown", e => { x0 = e.clientX; }); car.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 45) { S.hxSwiped = Date.now(); go(S.hcar + (dx < 0 ? 1 : -1)); } });
    }
    if (!window.__tkCarR) { window.__tkCarR = true; addEventListener("resize", () => { if ($(".hx-c")) placeCar(); }); }
  }
  function bindHomeSw() { $$("[data-home]").forEach(b => b.onclick = () => { lsSet("tk-home", b.dataset.home); re(); }); }
  V.inicio = {
    view() {
      loadAll();
      const D = hData(), first = esc((S.name || "").split(" ")[0] || "trader");
      if (lsGet("tk-home", "car") !== "grid") return homeCar(D, first);
      setTimeout(() => { S.hbAnim = true; }, 600);
      return `<div class="hb hb-full${HAPPS.filter(k => appDef(k)).length === 9 ? " bento" : ""}">
        <section class="hb-l"><div class="hb-mrow">${metaRow(D)}${homeSw("grid")}</div>
          <div class="hb-hirow"><h1 class="hb-hi">Hola, ${first},<br>${greetLine(D)}</h1><div class="hb-goals" data-gslot>${goalStrip()}</div></div>
          <div class="hb-grid${HAPPS.filter(k => appDef(k)).length === 9 ? " g9" : ""}${S.hcSel ? " has" : ""}">${HAPPS.filter(k => appDef(k)).map(k => { const on = S.hcSel === k; return `<div class="hb-t t-${k} ${S.hbAnim ? "noanim" : ""}${on ? " sel" : ""}" role="button" tabindex="0" data-hc="${k}" data-href="${appHref(k)}" aria-expanded="${on}" aria-label="${esc(appDef(k)[1])}: ${esc(APPDESC[k])}">${on ? calmOpen(k, D) : appTile(k, D)}</div>`; }).join("")}</div>
        </section></div>`;
    },
    bind() { bindHomeSw(); if (lsGet("tk-home", "car") !== "grid") bindCar(); else bindTiles(); }
  };
  V.app = {
    view(r) {
      loadAll();
      const k = r.id, a = appDef(k);
      if (!a) return `<div class="hb hb-full"><p>Esta aplicación no existe.</p><a class="btn" href="#inicio">Volver al inicio</a></div>`;
      const D = hData(), cats = a[2];
      return `<div class="hb hb-full hb-appv">
        <section class="hb-l">
          <a class="hb-back" href="#inicio">${I('<path d="M12 5l-5 5 5 5"/>', 16, 2.2)} Inicio</a>
          <div class="hb-apph"><span class="hb-apic">${ico(k, 26)}</span><div><h1>${esc(a[1])}</h1><p>${esc(APPDESC[k] || "")}</p></div></div>
          <div class="hb-catg n${cats.length}">${cats.map(([ck, cl], i) => { const [v, s, f] = catInfo(ck, D); return `<a class="hb-pc hb-cat" href="#${ck}" style="animation-delay:${(i * .04).toFixed(2)}s"><span class="hb-pci">${ico(ck, 22)}</span><b>${esc(cl)}</b><small>${esc(CATDESC[ck] || "")}</small>
            <span class="hb-pcv mono">${v}</span><span class="hb-pcs">${s}</span>${f != null ? `<span class="hb-pcb"><i style="width:${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)}%"></i></span>` : ""}<span class="hb-pco">Entrar ${I(ARW, 14, 2)}</span></a>`; }).join("")}</div>
        </section></div>`;
    },
    bind() { bindTiles(); }
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
    tr.forEach(t => out.push({ t: `${t.symbol} · ${t.side === "buy" ? "Compra" : "Venta"} · ${fmtDT(t.open_time)}`, s: t.status === "closed" ? fmtVt(t.r, mOf(t)) : "Abierta", go: () => location.hash = "#op/" + encodeURIComponent(t.id), i: "historial" }));
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
    const app = appOf(view === "op" ? "historial" : view), many = app && app[2].length > 1;
    const back = view === "informe" ? ["#calendario", "Calendario"] : !app ? ["#inicio", "Inicio"] : view === "op" ? ["#historial", "Operaciones"] : ["#inicio", "Inicio"];
    return `<div class="pgbar"><a class="hb-back" href="${back[0]}">${I('<path d="M12 5l-5 5 5 5"/>', 16, 2.2)} ${esc(back[1])}</a>
      ${many && view !== "op" ? `<nav class="pgtabs" aria-label="${esc(app[1])}">${app[2].map(([k, l]) => `<a href="#${k}" ${k === view ? 'aria-current="page"' : ""}>${ico(k, 16)}<span>${esc(l)}</span></a>`).join("")}</nav>` : `<span class="pgtabs-sp"></span>`}
      <div class="xpop pgadd"><button type="button" class="hbtb" data-plus aria-haspopup="true" aria-expanded="false" title="Crear" aria-label="Crear">${I(IC.plus, 18, 2.2)}</button><div class="xpopm right" id="plusM" hidden>${actions().slice(0, 5).map((a, i) => `<button type="button" class="xpopb" data-pa="${i}">${esc(a[0])}</button>`).join("")}</div></div></div>`;
  };
  window.tkShellBind = function (r) {
    const app = appOf(r.view); if (app && app[0] !== "inicio") lsSet("tk-lastapp", app[0]);
    $$("[data-pal]").forEach(b => b.onclick = palette);
    const pb = $("[data-plus]"), pm = $("#plusM");
    if (pb) { pb.onclick = e => { e.stopPropagation(); pm.hidden = !pm.hidden; pb.setAttribute("aria-expanded", String(!pm.hidden)); }; pm.onclick = e => { const a = e.target.closest("[data-pa]"); if (a) { pm.hidden = true; actions()[+a.dataset.pa][2](); } }; document.addEventListener("click", function off() { if (!document.body.contains(pm)) return document.removeEventListener("click", off); pm.hidden = true; pb.setAttribute("aria-expanded", "false"); }); }
    $$("[data-style-open]").forEach(b => b.onclick = stylePanel);
    const g = $("[data-guide]"); if (g) g.onclick = guidePop;
    const sc = $(".pgtabs [aria-current]"); if (sc) sc.parentNode.scrollLeft = sc.offsetLeft - 40;
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
      ["mt5", "Conecta MetaTrader 5", "#ajustes", (S.bridges || []).length > 0],
      ["plan", "Completa tu plan", "#plan", !!(S.planDoc && S.planDoc.current)],
      ["emo", "Activa el registro de emociones", "#ajustes", healthOk()],
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
    ["base", "Fundamental", [["tinta", "Negro", "#141416", "#ededf0"], ["cobalto", "Cobalto", "#2443c7", "#4f7dff"], ["clasico", "Clásico", "#1f2937", "#cbd5e1"]]],
    ["mas", "Adicional", [["indigo", "Índigo", "#4338ca", "#818cf8"], ["oceano", "Océano", "#0e7490", "#22b8cf"], ["violeta", "Violeta", "#6d28d9", "#a78bfa"], ["ambar", "Ámbar", "#b45309", "#f5a524"], ["fucsia", "Fucsia", "#be185d", "#f472b6"], ["pino", "Pino", "#166534", "#34d399"], ["cielo", "Cielo", "#0369a1", "#38bdf8"], ["grafito", "Grafito", "#334155", "#94a3b8"]]]
  ];
  const hex2rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
  function styleCss(lc, dc) {
    const lum = h => { const [r, g, b] = hex2rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }, on = h => lum(h) > .6 ? "#0b0b0c" : "#ffffff";
    const L = `--onAccent:${on(lc)};--cobalto:${lc};--cobalto2:${mix(lc, "#000000", .35)};--btn:${lc};--cobaltoC:${mix(lc, "#ffffff", .9)};--cobaltoA:${rgba(lc, .14)};`;
    const D = `--onAccent:${on(dc)};--cobalto:${dc};--cobalto2:${mix(dc, "#ffffff", .3)};--btn:${mix(dc, "#000000", .12)};--cobaltoC:${mix(dc, "#141416", .8)};--cobaltoA:${rgba(dc, .2)};--glow:${rgba(dc, .2)};`;
    return `:root{${L}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${D}}}:root[data-theme="dark"]{${D}}`;
  }
  function applyStyle() {
    const st = lsGet("tk-style", null); let el = document.getElementById("tkStyle");
    if (!st || st.id === "tinta") { if (el) el.remove(); return; }
    const p = st.id === "custom" ? ["custom", "", st.l, st.d] : PRESETS.flatMap(g => g[2]).find(x => x[0] === st.id); if (!p) return;
    if (!el) { el = document.createElement("style"); el.id = "tkStyle"; document.head.appendChild(el); }
    el.textContent = styleCss(p[2], p[3]);
  }
  /* paso único a la paleta negra: quien tenía guardado el azul por defecto pasa al negro (lo pidió Marcos, nov 2026) */
  try { const st0 = lsGet("tk-style", null); if (st0 && st0.id === "cobalto" && !lsGet("tk-pal2", null)) lsSet("tk-style", { id: "tinta" }); lsSet("tk-pal2", 1); } catch (e) {}
  applyStyle();
  function stylePanel() {
    const cur = lsGet("tk-style", { id: "tinta" }); let tab = cur.id === "custom" ? "custom" : "pre", pick = cur.id, cl = cur.l || "#2443c7", cd = cur.d || "#4f7dff";
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Estilo y colores");
    const sw = (l, d) => `<span class="stsw"><i style="background:${l}"></i><i style="background:${d}"></i></span>`;
    const paint = () => {
      box.innerHTML = `<div class="xdrawer-p">
        <div class="xdr-h"><div class="xdr-tabs" role="tablist"><button type="button" role="tab" data-st="pre" aria-selected="${tab === "pre"}">Estilos predefinidos</button><button type="button" role="tab" data-st="custom" aria-selected="${tab === "custom"}">Estilo personalizado</button></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
        <div class="xdr-b">${tab === "pre" ? PRESETS.map(([g, gl, L]) => `<div class="xsec">${gl}</div><div class="stgrid">${L.map(([id, n, l, d]) => `<button type="button" class="stc" data-pick="${id}" aria-pressed="${pick === id}"><b>${n}</b><span class="stline" style="--a:${isDark() ? d : l}"></span>${sw(l, d)}</button>`).join("")}</div>`).join("")
          : `<div class="xsec">Color principal en modo claro</div><div class="stcp"><input type="color" data-cl value="${cl}" aria-label="Color en modo claro"><input class="input mono" data-clt value="${cl}" maxlength="7" aria-label="Código del color en modo claro"><span class="stprev" style="background:${cl}"></span></div>
             <div class="xsec">Color principal en modo oscuro</div><div class="stcp"><input type="color" data-cd value="${cd}" aria-label="Color en modo oscuro"><input class="input mono" data-cdt value="${cd}" maxlength="7" aria-label="Código del color en modo oscuro"><span class="stprev" style="background:${cd}"></span></div>
             <div class="small muted">Se usa en botones, enlaces, el menú y los gráficos.</div>`}
          <div class="callout" style="margin-top:6px">${I('<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5M10 6.5v.01"/>', 18)}<div class="small">${moneyOn() ? "Los resultados se muestran en tu moneda con la R al lado y sin rojo ni verde: así juzgas el proceso y no solo el dinero." : "Los resultados se siguen mostrando en R y sin rojo ni verde, como pusiste en tu plan: así juzgas el proceso y no el dinero."}</div></div>
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
      else if (b.hasAttribute("data-reset")) { lsSet("tk-style", { id: "tinta" }); applyStyle(); close(true); toast("Estilo restablecido"); }
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
      const per = S.rendPer || "90", L = perFilter(S.trades, per), C = closed(L).sort((a, b) => new Date(a.open_time) - new Date(b.open_time)), st = tradeStats(L);
      const best = C.length ? C.reduce((a, b) => b.r > a.r ? b : a) : null, worst = C.length ? C.reduce((a, b) => b.r < a.r ? b : a) : null;
      const rr = st.avgW != null && st.avgL ? Math.abs(st.avgW / st.avgL) : null, wins = C.filter(t => t.r > 0).length, losses = C.filter(t => t.r < 0).length;
      let cum = 0, peak = 0; const curve = [0], ddc = [0]; C.forEach(t => { cum += t.r; peak = Math.max(peak, cum); curve.push(cum); ddc.push(cum - peak); });
      const f0 = C.length ? fmtD(C[0].open_time) : "", f1 = C.length ? fmtD(C[C.length - 1].open_time) : "";
      const byMonth = []; for (let i = 11; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const l = closed(S.trades).filter(t => { const x = new Date(t.open_time); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }); byMonth.push({ l: d.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""), v: l.reduce((a, t) => a + t.r, 0), n: l.length }); }
      const byDow = DOW.map((l, i) => { const x = C.filter(t => (new Date(t.open_time).getDay() + 6) % 7 === i); return { l, v: x.reduce((a, t) => a + t.r, 0), n: x.length }; });
      const hrs = {}; C.forEach(t => { const h = new Date(t.open_time).getHours(); (hrs[h] = hrs[h] || []).push(t); });
      const byHr = Object.keys(hrs).map(Number).sort((a, b) => a - b).map(h => ({ l: h + "h", v: hrs[h].reduce((a, t) => a + t.r, 0), n: hrs[h].length }));
      const bySym = {}; C.forEach(t => (bySym[t.symbol] = bySym[t.symbol] || []).push(t));
      const accts = (S.accts || []).filter(a => a.number).map(a => { const T = closed(perFilter(S.allTrades.filter(t => String(t.account || "") === String(a.number)), per)); return { a, st: tradeStats(T) }; }).filter(x => x.st.n);
      return `<div class="stack" style="gap:18px">
        <div class="xhead"><div><h1>Rendimiento</h1><div class="small muted">${st.n} operaciones cerradas${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""} · ${moneyOn() ? "en " + dispCur() + " y en R" : "todo en R"}</div></div>
          <div class="pseg" role="group" aria-label="Periodo">${PERS.map(([k, l]) => `<button type="button" data-rper="${k}" aria-pressed="${per === k}">${l}</button>`).join("")}</div></div>
        <div class="xkgrid">
          ${kpi("Resultado neto", st.n ? fmtV(st.tot, st.mt) : "—", st.n + " operaciones", spark(curve, 96, 40), "Suma de todas las operaciones cerradas del periodo")}
          ${kpi("Factor de beneficio", fpf(st.pf), "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)), "Por encima de 1 ganas más de lo que pierdes")}
          ${kpi("Mejor frente a peor", best ? `<span style="font-size:.78em;white-space:nowrap">${fmtV(best.r, mOf(best))} / ${fmtV(worst.r, mOf(worst))}</span>` : "—", best ? `${esc(best.symbol)} · ${esc(worst.symbol)}` : "", best ? meter(Math.max(0, best.r), Math.abs(Math.min(0, worst.r)), "mejor", "peor") : "", "Tu mejor y tu peor operación del periodo")}
          ${kpi("Ganancia media", st.avgW != null ? fmtV(st.avgW, st.mW) : "—", wins + " ganadoras", "", "Lo que ganas de media en cada operación ganadora")}
          ${kpi("Relación ganancia / pérdida", rr != null ? num(rr, 2) : "—", st.avgL != null ? "pérdida media " + fmtV(st.avgL, st.mL) : "", ring(rr == null ? 0 : Math.min(100, rr / 3 * 100)), "Ganancia media dividida entre la pérdida media")}
          ${kpi("Esperanza", st.exp != null ? fmtV(st.exp, st.mexp) : "—", "por operación", "", "Lo que ganas o pierdes de media por operación")}
          ${kpi("Peor caída", st.n ? fmtV(st.dd, st.mdd) : "—", "desde el máximo", "", "Lo máximo que has bajado desde tu mejor momento en el periodo")}
          ${kpi("Ganadoras frente a perdedoras", st.win == null ? "—" : num(st.win, 0) + " %", "", C.length ? meter(wins, losses, wins + " ganadoras", losses + " perdedoras") : "", "Porcentaje de operaciones ganadoras")}
        </div>
        <div class="xg3">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Curva de resultado</h2>${lineChart(curve, { from: f0, to: f1, label: "Resultado acumulado en R", emptyText: "Aún no hay datos. Conecta MT5 o añade operaciones." })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Caída desde el máximo</h2>${lineChart(ddc, { from: f0, to: f1, dd: true, label: "Caída desde el máximo en R", emptyText: "Aún no hay datos." })}<div class="small muted">Peor caída: <b class="mono">${fmtV(st.dd, st.mdd)}</b></div></div>
          <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Crecimiento de las cuentas</h2><a class="btn2" href="#cuentas" style="height:32px">${I(IC.plus, 14, 2)} Añadir cuenta</a></div>
            ${accts.length ? `<div class="stack" style="gap:10px">${accts.map(x => `<a class="racc" href="#cuentas"><div class="between"><b>${esc(acctName(x.a))}</b><span class="mono">${fmtV(x.st.tot, x.st.mt)}</span></div>${spark(x.st.curve, 260, 34)}<span class="small muted">${x.st.n} op. · ${num(x.st.win, 0)} % acierto</span></a>`).join("")}</div>` : `<div class="xchart-empty">${(S.accts || []).length ? "Tus cuentas aún no tienen operaciones en este periodo." : "Aún no hay cuentas. Añade una para ver cómo crece cada una."}</div>`}</div>
        </div>
        <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Resultado por mes</h2><span class="small muted">últimos 12 meses</span></div>${barsV(byMonth, { label: "Resultado por mes" })}</div>
        <div class="xg2">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por día de la semana</h2>${barsV(byDow, { label: "Resultado por día" })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por hora de entrada</h2>${barsV(byHr, { label: "Resultado por hora" })}</div>
        </div>
        <div class="card stack" style="gap:10px"><h2 class="h2b">Resultado por mercado</h2>
          <div class="xtablewrap"><table class="xtable"><thead><tr><th>Mercado</th><th>Operaciones</th><th>Acierto</th><th>Factor de beneficio</th><th>Esperanza</th><th>Resultado</th></tr></thead><tbody>
          ${Object.entries(bySym).map(([k, l]) => [k, tradeStats(l)]).sort((a, b) => b[1].tot - a[1].tot).map(([k, s]) => `<tr><td><b>${esc(k)}</b></td><td class="mono">${s.n}</td><td class="mono">${num(s.win, 0)} %</td><td class="mono">${fpf(s.pf)}</td><td class="mono">${fmtV(s.exp, s.mexp)}</td><td class="mono"><b>${fmtV(s.tot, s.mt)}</b></td></tr>`).join("") || `<tr><td colspan="6" class="muted" style="padding:16px">Sin operaciones en este periodo.</td></tr>`}</tbody></table></div></div>
      </div>`;
    },
    bind() { $$("[data-rper]").forEach(b => b.onclick = () => { S.rendPer = b.dataset.rper; re(); }); }
  };

  /* ======================= CALENDARIO: real o práctica, en grande; al tocar un día se abre su informe ======================= */
  const cR = (v, m) => `<b class="mono ${v > 0 ? "cpos" : v < 0 ? "cneg" : ""}">${fmtV(v, m)}</b>`;
  const calSrcL = () => S.calSrc === "bt" ? simAll() : closed(S.trades);
  function calendar(key, L, opts) {
    const st = S[key] || (S[key] = { y: new Date().getFullYear(), m: new Date().getMonth(), mode: "mes" });
    const byDay = {}; L.forEach(t => { const d = dayKey(dateOf(t)); (byDay[d] = byDay[d] || []).push(t); });
    const src = `<div class="pseg calsrc" role="group" aria-label="Qué operaciones"><button type="button" data-csrc="real" aria-pressed="${S.calSrc !== "bt"}">Real</button><button type="button" data-csrc="bt" aria-pressed="${S.calSrc === "bt"}">Práctica</button></div>`;
    const modeB = `<div class="pseg" role="group" aria-label="Vista"><button type="button" data-cmode="mes" aria-pressed="${st.mode !== "anio"}">Mes</button><button type="button" data-cmode="anio" aria-pressed="${st.mode === "anio"}">Año</button></div>`;
    const leg = `<div class="cleg"><span><i class="pos"></i>Día positivo</span><span><i class="neg"></i>Día negativo</span><span><i></i>Sin operar</span><span class="muted">Más intenso = más R</span></div>`;
    if (st.mode === "anio") {
      const months = MESES_L.map((ml, m) => { const l = L.filter(t => { const d = new Date(dateOf(t)); return d.getFullYear() === st.y && d.getMonth() === m; }); return { m, ml, st: tradeStats(l) }; });
      const tot = months.reduce((a, x) => a + x.st.tot, 0), n = months.reduce((a, x) => a + x.st.n, 0), mx = Math.max(.5, ...months.map(x => Math.abs(x.st.tot)));
      return `<div class="card stack calcard" style="gap:16px"><div class="calh"><div><div class="calbig">${n ? cR(tot, months.reduce((a, x) => a + (x.st.mt || 0), 0)) : `<b class="mono">${fmtV(0, 0)}</b>`}</div><div class="small muted">${n} operaciones en ${st.y}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${src}${modeB}<div class="calnav"><button type="button" class="xpb" data-cnav="-1" aria-label="Año anterior">${I(IC.left, 16, 2)}</button><b>${st.y}</b><button type="button" class="xpb" data-cnav="1" aria-label="Año siguiente">${I(IC.right, 16, 2)}</button></div></div></div>
        <div class="calyear">${months.map(x => `<button type="button" class="calm ${x.st.n ? (x.st.tot < 0 ? "neg" : "pos") : ""}" style="--a:${x.st.n ? (.15 + Math.abs(x.st.tot) / mx * .55).toFixed(2) : 0}" data-cmonth="${x.m}"><b>${cap(x.ml)}</b><span class="mono">${x.st.n ? fmtV(x.st.tot, x.st.mt) : "—"}</span><small>${x.st.n ? x.st.n + " op. · " + num(x.st.win, 0) + " % acierto" : "sin operaciones"}</small></button>`).join("")}</div>${leg}</div>`;
    }
    const first = new Date(st.y, st.m, 1), off = (first.getDay() + 6) % 7, days = new Date(st.y, st.m + 1, 0).getDate(), weeks = Math.ceil((off + days) / 7);
    const monthL = L.filter(t => { const d = new Date(dateOf(t)); return d.getFullYear() === st.y && d.getMonth() === st.m; }), mst = tradeStats(monthL);
    const inMonth = Object.entries(byDay).filter(([k]) => k.startsWith(st.y + "-" + String(st.m + 1).padStart(2, "0"))), mxAbs = Math.max(.5, ...inMonth.map(([, l]) => Math.abs(tradeStats(l).tot)));
    const pos = inMonth.filter(([, l]) => tradeStats(l).tot > 0).length, neg = inMonth.filter(([, l]) => tradeStats(l).tot < 0).length;
    let grid = DOW.map(d => `<div class="calwd">${d}</div>`).join("") + `<div class="calwd">Semana</div>`;
    const W = [];
    for (let w = 0; w < weeks; w++) {
      const wl = [];
      for (let c = 0; c < 7; c++) {
        const dn = w * 7 + c - off + 1, dt = new Date(st.y, st.m, dn), k = dayKey(dt), inM = dn >= 1 && dn <= days, l = inM ? byDay[k] || [] : [], s = tradeStats(l);
        wl.push(...l);
        const a = s.n ? (.18 + Math.min(1, Math.abs(s.tot) / mxAbs) * .62).toFixed(2) : 0, cls = s.n ? (s.tot > 0 ? "pos" : s.tot < 0 ? "neg" : "zero") : "";
        grid += `<${s.n ? `button type="button" data-cday="${k}" aria-label="${dt.getDate()}: ${fmtVt(s.tot, s.mt)}, ${s.n} operaciones. Ver informe"` : "div"} class="calc ${inM ? "" : "out"} ${cls} ${k === todayKey() ? "today" : ""} ${S.calSel === k ? "sel" : ""}" style="--a:${a}"><span class="cald">${dt.getDate()}</span>${s.n ? `<b class="mono">${fmtV(s.tot, s.mt)}</b><small>${s.n} op.${s.win != null ? " · " + num(s.win, 0) + " %" : ""}</small>` : ""}</${s.n ? "button" : "div"}>`;
      }
      const ws = tradeStats(wl); W.push({ w: w + 1, l: wl, st: ws });
      grid += `<div class="calc calw"><span class="cald">Semana ${w + 1}</span>${ws.n ? `${cR(ws.tot, ws.mt)}<small>${(n => n + (n === 1 ? " día" : " días"))(new Set(wl.map(t => dayKey(dateOf(t)))).size)} · ${ws.n} op.</small>` : `<small>—</small>`}</div>`;
    }
    const wkRows = W.map(x => `<tr><td><b>Semana ${x.w}</b></td><td class="mono">${x.st.n || "—"}</td><td class="mono">${x.st.win == null ? "—" : num(x.st.win, 0) + " %"}</td><td class="mono">${x.st.avgW != null ? fmtV(x.st.avgW, x.st.mW) : "—"}</td><td class="mono">${x.st.avgL != null ? fmtV(x.st.avgL, x.st.mL) : "—"}</td><td>${x.st.n ? cR(x.st.tot, x.st.mt) : "—"}</td></tr>`).join("");
    return `<div class="card stack calcard" style="gap:16px"><div class="calh"><div><div class="calbig">${mst.n ? cR(mst.tot, mst.mt) : `<b class="mono">${fmtV(0, 0)}</b>`}</div><div class="small muted">${cap(MESES_L[st.m])} de ${st.y} · ${inMonth.length} días operados · <span class="cpos">${pos} positivos</span>, <span class="cneg">${neg} negativos</span></div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${src}${modeB}<div class="calnav"><button type="button" class="xpb" data-cnav="-1" aria-label="Mes anterior">${I(IC.left, 16, 2)}</button><b>${cap(MESES_L[st.m])} ${st.y}</b><button type="button" class="xpb" data-cnav="1" aria-label="Mes siguiente">${I(IC.right, 16, 2)}</button></div><button type="button" class="btn2" data-ctoday style="height:34px">Hoy</button></div></div>
      <div class="calwrap"><div class="calgrid big" style="--wk:${weeks}">${grid}</div></div>${leg}</div>
      <div class="card stack" style="gap:10px"><h2 class="h2b">Resumen por semanas</h2><div class="xtablewrap"><table class="xtable"><thead><tr><th>Semana</th><th>Operaciones</th><th>Acierto</th><th>Ganancia media</th><th>Pérdida media</th><th>Resultado</th></tr></thead><tbody>${wkRows}</tbody></table></div></div>`;
  }
  function bindCal(key, onDay) {
    const st = S[key];
    $$("[data-csrc]").forEach(b => b.onclick = () => { S.calSrc = b.dataset.csrc === "bt" ? "bt" : ""; if (S.calSrc === "bt" && !S.btLoaded && BT()) BT().loadSessions().then(re); re(); });
    $$("[data-cmode]").forEach(b => b.onclick = () => { st.mode = b.dataset.cmode; re(); });
    $$("[data-cnav]").forEach(b => b.onclick = () => { const d = +b.dataset.cnav; if (st.mode === "anio") st.y += d; else { st.m += d; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } } re(); });
    const t = $("[data-ctoday]"); if (t) t.onclick = () => { const n = new Date(); st.y = n.getFullYear(); st.m = n.getMonth(); re(); };
    $$("[data-cmonth]").forEach(b => b.onclick = () => { st.m = +b.dataset.cmonth; st.mode = "mes"; re(); });
    $$("[data-cday]").forEach(b => b.onclick = () => onDay && onDay(b.dataset.cday));
  }
  /* informe del día en un panel lateral */
  function dayPanel(k) {
    S.calSel = k; $$(".calc.sel").forEach(x => x.classList.remove("sel")); const cell = $(`[data-cday="${k}"]`); if (cell) cell.classList.add("sel");
    const bt = S.calSrc === "bt", dt = new Date(k + "T12:00");
    const L = (bt ? simAll() : S.trades.filter(t => t.open_time)).filter(t => dayKey(dateOf(t)) === k).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)));
    const C = bt ? L : closed(L), st = tradeStats(C), good = bt ? 0 : C.filter(t => evaluate(t).good).length;
    const emo = !bt && healthOk() ? C.filter(t => (t.review || {}).feel) : [], notes = bt ? [] : (S.pages || []).filter(p => !p.isTpl && p.day === k);
    const news = !bt && S.news ? (S.news.events || []).filter(e => dayKey(e.ts) === k && e.impact === "High") : [];
    const rows = L.map(t => bt
      ? `<div class="dp-op"><span><i class="dp-t"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"}</i><small>${esc(sessName(t.session_id))}${t.exit_time ? " · " + new Date(t.exit_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</small></span>${t.r != null ? cR(+t.r, mOf(t)) : "<b>abierta</b>"}</div>`
      : `<a class="dp-op" href="#op/${encodeURIComponent(t.id)}"><span><i class="dp-t"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"}</i><small>${new Date(t.open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · ${t.status === "closed" ? (evaluate(t).good ? "dentro del plan" : evaluate(t).fail.length + " norma(s) sin cumplir") : "abierta"}</small></span>${t.status === "closed" ? cR(t.r, mOf(t)) : "<b>abierta</b>"}</a>`).join("");
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Informe del día");
    box.innerHTML = `<div class="xdrawer-p dpanel"><div class="xdr-h"><div><div class="small muted">${bt ? "Práctica" : "Informe del día"}</div><b style="font-size:18px">${cap(dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</b></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xdr-b">
        <div class="dp-hero ${st.tot > 0 ? "pos" : st.tot < 0 ? "neg" : ""}"><span>Resultado del día</span><b class="mono">${st.n ? fmtV(st.tot, st.mt) : "—"}</b><small>${st.n} operación${st.n === 1 ? "" : "es"} cerrada${st.n === 1 ? "" : "s"}${st.win != null ? " · " + num(st.win, 0) + " % acierto" : ""}</small></div>
        <div class="dp-k">${bt ? `<div><span>Sesiones</span><b>${new Set(L.map(t => t.session_id || "")).size}</b></div><div><span>Mejor operación</span><b class="mono">${C.length ? fmtV(Math.max(...C.map(t => +t.r))) : "—"}</b></div>` : `<div><span>Dentro del plan</span><b>${C.length ? good + " de " + C.length : "—"}</b></div><div><span>Caída máxima</span><b class="mono">${st.n ? fmtV(st.dd, st.mdd) : "—"}</b></div>`}</div>
        <div class="xsec">Operaciones</div><div class="stack" style="gap:6px">${rows || `<div class="small muted">Sin operaciones este día.</div>`}</div>
        ${emo.length ? `<div class="xsec">Emociones</div><div class="stack" style="gap:6px">${emo.map(t => `<div class="dp-op"><span>${esc(t.review.feel)}<small>al entrar en ${esc(t.symbol)}</small></span></div>`).join("")}</div>` : ""}
        ${news.length ? `<div class="xsec">Noticias fuertes</div><div class="stack" style="gap:6px">${news.map(e => `<div class="dp-op"><span>${esc(e.country)} · ${esc(e.title)}</span><b class="mono">${new Date(e.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</b></div>`).join("")}</div>` : ""}
        ${!bt ? `<div class="xsec">Notas</div>${notes.length ? notes.map(p => `<a class="dp-op" href="#diario/${encodeURIComponent(p.id)}"><span><b>${esc(p.title || "Sin título")}</b><small>${esc(DI().txt(p.html).slice(0, 90))}</small></span></a>`).join("") : `<div class="small muted">No hay notas unidas a este día.</div>`}` : ""}
      </div>
      <div class="xdr-f">${bt ? `<a class="btn" href="#btops" style="flex:1;height:42px;justify-content:center">Ver operaciones simuladas</a>` : `<a class="btn" href="#informe" data-full style="flex:1;height:42px;justify-content:center">Ver informe completo</a>`}</div></div>`;
    const close = () => { box.classList.remove("in"); setTimeout(() => box.remove(), 200); document.removeEventListener("keydown", ek); S.calSel = null; $$(".calc.sel").forEach(x => x.classList.remove("sel")); };
    const ek = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", e => { if (e.target === box || e.target.closest("[data-x]")) return close(); if (e.target.closest("[data-full]")) S.repDay = k; if (e.target.closest("a")) { box.remove(); document.removeEventListener("keydown", ek); } });
    document.addEventListener("keydown", ek); document.body.appendChild(box); requestAnimationFrame(() => box.classList.add("in")); setTimeout(() => { const x = box.querySelector("[data-x]"); x && x.focus(); }, 60);
  }
  V.calendario = {
    view() {
      if (S.calSrc === "bt" && !S.btLoaded && BT()) BT().loadSessions().then(() => { if (location.hash.startsWith("#calendario")) re(); });
      if (!S.pagesLoaded && DI()) DI().loadPages();
      return `<div class="stack" style="gap:18px"><div class="xhead"><div><h1>Calendario</h1><div class="small muted">${S.calSrc === "bt" ? "Tus operaciones de práctica (backtesting)" : "Tus operaciones reales"} · toca un día para ver su informe</div></div></div>${calendar("calS", calSrcL(), {})}</div>`;
    },
    bind() { bindCal("calS", dayPanel); }
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
            ${kpi("Resultado del día", st.n ? fmtV(st.tot, st.mt) : "—", st.n + " de " + S.plan.maxTrades + " operaciones", "")}
            ${kpi("Caída máxima", st.n ? fmtV(st.dd, st.mdd) : "—", "desde el máximo del día", "")}
            ${kpi("Esperanza", st.exp != null ? fmtV(st.exp, st.mexp) : "—", st.win == null ? "" : num(st.win, 0) + " % de acierto", "")}
            ${kpi("Dentro del plan", C.length ? good + " de " + C.length : "—", C.length ? (good === C.length ? "Día limpio" : (C.length - good) + " evitable" + (C.length - good > 1 ? "s" : "")) : "", "")}
          </div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Métricas del día</h2>${lineChart(curve, { label: "Resultado acumulado del día", from: C.length ? new Date(C[0].open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "", to: C.length ? new Date(C[C.length - 1].close_time || C[C.length - 1].open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "", h: 220, emptyText: "Aún no hay datos este día." })}</div>
        </div>
        <div class="xg2 wide">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Resumen de operaciones</h2>
            ${D.length ? `<div class="xtablewrap"><table class="xtable"><thead><tr><th>Hora</th><th>Símbolo</th><th>Dirección</th><th>Resultado</th><th>Duración</th><th>Plan</th>${healthOk() ? "<th>Emoción</th>" : ""}</tr></thead><tbody>${D.map(t => { const ev = t.status === "closed" ? evaluate(t) : null; return `<tr data-op="${esc(t.id)}" tabindex="0"><td class="mono">${new Date(t.open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</td><td><b>${esc(t.symbol)}</b></td><td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td><td class="mono"><b>${t.status === "closed" ? fmtV(t.r, mOf(t)) : "Abierta"}</b></td><td class="mono">${dur(t.open_time, t.close_time)}</td><td>${ev ? (ev.good ? `<span class="xok">${I(IC.check, 14, 2.4)} Dentro</span>` : `<span class="xbad">${esc(ev.fail[0].bad)}</span>`) : "—"}</td>${healthOk() ? `<td>${esc((t.review || {}).feel || "—")}</td>` : ""}</tr>`; }).join("")}</tbody></table></div>` : `<div class="xchart-empty">No operaste este día.</div>`}</div>
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
          ${kpi("Resultado neto", st.n ? fmtV(st.tot, st.mt) : "—", st.n + " operaciones simuladas", spark(curve, 96, 40))}
          ${kpi("Factor de beneficio", fpf(st.pf), "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)))}
          ${kpi("Ganancia media frente a pérdida", rr != null ? num(rr, 2) : "—", st.avgW != null ? fmtV(st.avgW, st.mW) + " / " + (st.avgL != null ? fmtV(st.avgL, st.mL) : "—") : "", rr != null ? meter(st.avgW, Math.abs(st.avgL || 0), "ganancia", "pérdida") : "")}
          ${kpi("Tiempo invertido", BT().hms(secs), "practicando en sesiones", "")}
          ${kpi("Velas repasadas", bars.toLocaleString("es-ES"), "avanzando en backtesting", "")}
          ${kpi("Operaciones", st.n, "simuladas", "")}
          ${kpi("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", st.n ? L.filter(t => t.r > 0).length + " de " + st.n : "", ring(st.win))}
          ${kpi("Caída máxima", st.n ? fmtV(st.dd, st.mdd) : "—", "desde el máximo", "")}
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
        <div class="xkgrid">${kpi("Resultado neto", st.n ? fmtV(st.tot, st.mt) : "—", st.n + " operaciones", spark(st.curve, 96, 40))}${kpi("Factor de beneficio", fpf(st.pf), "", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)))}${kpi("Acierto", st.win == null ? "—" : num(st.win, 0) + " %", "", ring(st.win))}${kpi("Relación ganancia / pérdida", st.avgW != null && st.avgL ? num(Math.abs(st.avgW / st.avgL), 2) : "—", "", "")}</div>
        <div class="card xcard"><div class="xtools"><label class="xsearch">${I(IC.search, 16)}<input id="btoQ" placeholder="Buscar operaciones…" value="${esc(o.q)}" aria-label="Buscar"></label>
          <div class="xfil">${sessSel(o.f, "btoF")}<select class="xsel" id="btoS" aria-label="Dirección"><option value="">Compras y ventas</option><option value="buy" ${o.side === "buy" ? "selected" : ""}>Solo compras</option><option value="sell" ${o.side === "sell" ? "selected" : ""}>Solo ventas</option></select></div></div>
          <div class="xtablewrap"><table class="xtable"><thead><tr class="xgrp"><th colspan="4"><span>Información</span></th><th colspan="2"><span>Rendimiento</span></th><th colspan="4"><span>Precios</span></th><th colspan="2"><span>Fechas</span></th></tr>
            <tr><th>Símbolo</th><th>Sesión</th><th>Dirección</th><th>Marco</th><th>Resultado</th><th>Duración</th><th>Entrada</th><th>Stop</th><th>Objetivo</th><th>Salida</th><th>Fecha de entrada</th><th>Fecha de salida</th></tr></thead>
            <tbody>${P.length ? P.map(t => `<tr><td><b>${esc(t.symbol)}</b></td><td class="muted">${esc(sessName(t.session_id))}</td><td><span class="xside ${t.side}">${t.side === "buy" ? "Compra" : "Venta"}</span></td><td class="mono">${esc(t.tf || "—")}</td><td class="mono"><b>${t.r != null ? fmtV(+t.r, mOf(t)) : "Abierta"}</b></td><td class="mono">${dur(t.entry_time, t.exit_time)}</td><td class="mono">${px(t.entry)}</td><td class="mono">${px(t.stop)}</td><td class="mono">${px(t.tp)}</td><td class="mono">${px(t.exit)}</td><td class="mono">${t.entry_time ? fmtDT(t.entry_time) : "—"}</td><td class="mono">${t.exit_time ? fmtDT(t.exit_time) : "—"}</td></tr>`).join("") : `<tr><td colspan="12">${empty("Aún no hay operaciones simuladas", "Crea una sesión en Backtesting, avanza velas y opera desde el gráfico.", `<a class="btn" href="#backtest" style="height:38px">Ir a sesiones</a>`)}</td></tr>`}</tbody></table></div>
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
  V.btcal = { view() { S.calSrc = "bt"; setTimeout(() => { location.replace("#calendario"); }, 0); return `<div class="muted">Abriendo el calendario…</div>`; }, bind() {} };
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
