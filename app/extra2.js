/* Tickora · navegación por aplicaciones y páginas nuevas:
   Inicio (tus aplicaciones), ruta y pestañas, buscador (Ctrl/⌘ K), botón +, guía de configuración, estilos,
   Rendimiento, Calendario, Informe diario, Análisis / Operaciones / Calendario / Cuaderno de backtesting y Finanzas. */
(function () {
  "use strict";
  const A = window.TKAPP;
  const { S, sb, esc, SVG, fmtR, num, dayKey, todayKey, evaluate, tradeStats, toast, render, spark, lsGet, lsSet, acctName, selAcct, FEELS, greet, money, inSession, MESES_L, NAV_APPS, appOf, ico, isDark } = A;
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
    rendimiento: "Todos tus números en R", progreso: "Cuánto cumples tu plan y qué normas rompes", emociones: "Qué emociones te ayudan y cuáles te cuestan", historial: "Todas tus operaciones en una tabla", calendario: "Tu resultado de cada día; toca uno para ver su informe",
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
      case "hoy": {
        const used = D.today.length, mx = p.maxTrades || 3, f = Math.min(1, used / mx), tf = D.phase === "antes" ? 0 : D.phase === "despues" ? 1 : (D.now - D.a) / Math.max(1, D.b - D.a);
        return `<div class="hb-w">${cats}<div class="hb-bar" role="img" aria-label="${used} de ${mx} operaciones"><i style="left:${(f * 100).toFixed(1)}%"></i></div>
          <div class="hb-sbar" role="img" aria-label="Horario ${esc(p.start)} a ${esc(p.end)}"><span>${esc(p.start)}</span><div><em style="width:${(tf * 100).toFixed(1)}%"></em></div><span>${esc(p.end)}</span></div></div>
          ${tFoot(name, (D.st.n ? fmtR(D.st.tot) + " · " : "") + used + " de " + mx + " operaciones" + (D.nextHigh && dayKey(D.nextHigh.ts) === todayKey() ? " · noticia " + hhmm(D.nextHigh.ts) : ""), href)}`;
      }
      case "analizar": {
        const sym = chartSym(), tf = lsGet("tk-tf", "5m"), c = (S.hbBars || {})[sym + "|" + tf], b = c && c.b || [];
        const last = b.length ? b[b.length - 1].close : null, f = b.length ? b[0].open : null, chg = last != null && f ? (last - f) / f * 100 : null, dg = c && c.d != null ? c.d : 2;
        const body = b.length ? miniCandles(b) : `<div class="hb-chart-ph">${c && c.err ? "El gráfico no responde ahora" : "Cargando gráfico…"}</div>`;
        return `<div class="hb-ch-top"><b class="hb-ch-n">${esc(name)}</b><span class="hb-sym">${esc(sym)}</span>${last != null ? `<b class="mono">${last.toFixed(dg).replace(".", ",")}</b><em class="mono ${chg >= 0 ? "up" : "dn"}">${chg >= 0 ? "+" : "−"}${num(Math.abs(chg), 2)} %</em>` : ""}<span style="flex:1"></span><div class="hb-step sm"><button type="button" data-tfs="-1" aria-label="Temporalidad más corta" data-stop>−</button><b class="mono">${esc(TFL[tf] || tf)}</b><button type="button" data-tfs="1" aria-label="Temporalidad más larga" data-stop>+</button></div>${rbtn(href, name)}</div>
          <div class="hb-chart" data-sym="${esc(sym)}" data-tf="${esc(tf)}" role="img" aria-label="${esc(sym)}, últimas ${b.length || 60} velas de ${esc(TFL[tf] || tf)}">${body}</div>`;
      }
      case "backtest": {
        const i = Math.min(S.hbBt || 0, Math.max(0, D.sess.length - 1)), x = D.sess[i];
        if (!x) return `<div class="hb-media-c"><button type="button" class="hb-play" data-btnew aria-label="Crear sesión" data-stop>${I(IC.plus, 22, 2.2)}</button></div><div class="hb-media-t"><b>${esc(name)}</b><small>Crea tu primera sesión · ${n} apartados</small></div>`;
        const from = new Date(x.from + "T00:00").getTime(), to = new Date(x.to + "T23:59").getTime(), pr = Math.max(0, Math.min(1, ((x.lastTs || from) - from) / (to - from)));
        return `<span class="hb-cats-n lt">${esc(name)} · ${n} apartados</span><div class="hb-media-c"><button type="button" class="hb-mb" data-btcyc="-1" aria-label="Sesión anterior" ${D.sess.length > 1 ? "" : "disabled"} data-stop>${I('<path d="M14 5l-6 5 6 5zM6 5v10"/>', 16, 2)}</button><button type="button" class="hb-play" data-btplay="${esc(x.id)}" aria-label="${x.lastTs ? "Continuar" : "Empezar"} ${esc(x.name)}" data-stop>${I('<path d="M7 4.5v11l9-5.5z"/>', 22, 2)}</button><button type="button" class="hb-mb" data-btcyc="1" aria-label="Sesión siguiente" ${D.sess.length > 1 ? "" : "disabled"} data-stop>${I('<path d="M6 5l6 5-6 5zM14 5v10"/>', 16, 2)}</button></div>
          <div class="hb-media-t"><div class="hb-prog"><i style="width:${(pr * 100).toFixed(1)}%"></i></div><b>${esc(x.name)}</b><small>${esc((x.syms || []).join(" · "))} · ${x.mode === "fondeo" ? "reto de fondeo" : "clásico"} · ${Math.round(pr * 100)} %</small></div>`;
      }
      case "resultados": {
        const pc = D.C90.length ? Math.round(D.good / D.C90.length * 100) : null;
        return `<div class="hb-w">${cats}<div class="hb-ban">${pc == null ? "Aún sin operaciones" : pc >= 80 ? "Proceso sólido" : pc >= 60 ? "Vas por buen camino" : "Revisa tus normas"}</div><div class="hb-big"><span class="hb-bl">Dentro del plan</span><b class="mono">${pc == null ? "—" : pc}</b><small>${pc == null ? "" : "%"}</small></div></div>
          ${tFoot(name, D.s90.n ? fmtR(D.s90.tot) + " en 90 días" : "Rendimiento, disciplina y emociones", href)}`;
      }
      case "diario": {
        const pg = D.pages[0];
        return `<span class="hb-ic">${ico("diario", 20)}</span><div style="flex:1"></div>${tFoot(name, pg ? "Última: " + esc(pg.title || "Sin título") + " · " + ago(pg.updated) : S.pagesLoaded ? "Escribe tu primera página" : "Tus páginas", href)}`;
      }
      case "cartera": {
        const A = (S.accts || []).filter(a => a.status !== "archivada"), c = t => A.filter(a => a.type === t).length;
        return `<div class="hb-w">${cats}<div class="hb-ac"><span>${I('<path d="M4 14l4-4 3 3 5-6"/>', 13, 2.2)} Fondeo ${c("fondeo")}</span><span>${I('<circle cx="10" cy="10" r="5"/>', 13, 2.2)} Demo ${c("demo")} · Propia ${c("propia")}</span></div><div class="hb-pill">${A.length} ${A.length === 1 ? "cuenta" : "cuentas"}</div></div>
          ${tFoot(name, inSession(p) ? "Finanzas al terminar tu horario" : "Cuentas y finanzas", href)}`;
      }
      case "asistente": {
        const q = ["¿A qué hora opero mejor?", "¿Qué norma rompo más?", "¿Cómo voy esta semana?", "¿Cuál es mi mejor mercado?"][new Date().getDate() % 4];
        return `<div class="hb-w"><a class="hb-q" href="#asistente" data-ask="${esc(q)}" data-stop>${esc(q)}<span>${I(IC.send, 14)}</span></a></div>${tFoot(name, "Pregunta por tus números", href)}`;
      }
      case "calendario": {
        const nw = new Date(), y = nw.getFullYear(), m = nw.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate(), by = {};
        closed(S.trades).forEach(t => { const d = new Date(dateOf(t)); if (d.getFullYear() === y && d.getMonth() === m) (by[d.getDate()] = by[d.getDate()] || []).push(t); });
        const st = {}; Object.keys(by).forEach(d => { st[d] = tradeStats(by[d]); });
        const vals = Object.values(st), tot = vals.reduce((a, s) => a + s.tot, 0), pd = vals.filter(s => s.tot > 0).length, nd = vals.filter(s => s.tot < 0).length, mx = Math.max(.5, ...vals.map(s => Math.abs(s.tot)));
        let cells = ["L", "M", "X", "J", "V", "S", "D"].map(d => `<span class="mc-wd">${d}</span>`).join("");
        for (let i = 0; i < off; i++) cells += '<span class="mc-d bl"></span>';
        for (let d = 1; d <= dim; d++) {
          const s = st[d], k = dayKey(new Date(y, m, d)), td = d === nw.getDate() ? " hoy" : "", we = (off + d - 1) % 7 >= 5 ? " we" : "";
          cells += s ? `<button type="button" class="mc-d ${s.tot > 0 ? "p" : s.tot < 0 ? "n" : "z"}${td}" style="--a:${(.3 + Math.min(1, Math.abs(s.tot) / mx) * .6).toFixed(2)}" data-repday="${k}" data-stop aria-label="${d}: ${fmtR(s.tot)}. Ver informe del día" title="${fmtR(s.tot)} · ${s.n} op.">${d}</button>`
            : `<span class="mc-d${d > nw.getDate() ? " f" : ""}${we}${td}">${d}</span>`;
        }
        return `<div class="hb-mc-h"><b>${cap(nw.toLocaleDateString("es-ES", { month: "long", year: "numeric" }))}</b>${vals.length ? `<span class="mono ${tot > 0 ? "cpos" : tot < 0 ? "cneg" : ""}">${fmtR(tot)}</span>` : ""}</div>
          <div class="hb-mc">${cells}</div>
          ${tFoot(name, vals.length ? pd + (pd === 1 ? " día" : " días") + " en verde · " + nd + " en rojo" : "Aún sin días operados este mes", href)}`;
      }
      case "plan": {
        return `<div class="hb-w"><div class="hb-chips"><span>Máx. ${p.maxTrades} op.</span><span>${esc(p.start)}–${esc(p.end)}</span><span>Límite ${num(p.dayLimitR, 1)} R</span>${p.riskPct != null ? `<span>Riesgo ${num(p.riskPct, 2).replace(/,?0+$/, "")} %</span>` : ""}</div></div>
          ${tFoot(name, (p.rules || []).length ? (p.rules || []).length + ((p.rules || []).length === 1 ? " norma" : " normas") + " · cambios desde mañana" : "Añade tus normas", href)}`;
      }
    }
    return "";
  }
  /* dato de cada categoría para la página de la aplicación */
  function catInfo(k, D) {
    const sim = (S.btTrades || []).filter(t => t.r != null), sst = tradeStats(sim.map(t => ({ r: +t.r, status: "closed" })));
    const fe = {}; S.trades.forEach(t => { const f = (t.review || {}).feel; if (f) fe[f] = (fe[f] || 0) + 1; }); const topF = Object.entries(fe).sort((a, b) => b[1] - a[1])[0];
    const w = tradeStats(closed(S.trades.filter(t => new Date(t.open_time) >= Date.now() - 7 * 864e5))), mx = D.p.maxTrades || 3;
    const M = {
      hoy: [D.st.n ? fmtR(D.st.tot) : "—", D.today.length + " de " + mx + " operaciones", D.today.length / mx],
      plan: [esc(D.p.start) + "–" + esc(D.p.end), "máximo " + mx + " operaciones", null],
      grupo: ["Pronto", "llega en el último paso", null],
      analizar: [esc((S.an && S.an.sym) || "EURUSD"), "se abre en " + (TFL[lsGet("tk-tf", "5m")] || ""), null],
      backtest: [String(D.sess.length), D.sess.length === 1 ? "sesión" : "sesiones", null],
      btanalisis: [BT() ? BT().hms(D.sess.reduce((a, x) => a + (x.secs || 0), 0)) : "—", "de estudio", null],
      btops: [String(sim.length), sst.n ? fmtR(sst.tot) + " simulado" : "simuladas", null],
      btcal: [sst.n ? fmtR(sst.tot) : "—", "resultado simulado", null],
      btnotas: [String((S.pages || []).filter(x => !x.isTpl && (x.bt || x.tpl === "bt")).length), "notas", null],
      rendimiento: [D.s90.n ? fmtR(D.s90.tot) : "—", "en 90 días", D.s90.win != null ? D.s90.win / 100 : null],
      progreso: [D.C90.length ? Math.round(D.good / D.C90.length * 100) + " %" : "—", "dentro del plan", D.C90.length ? D.good / D.C90.length : null],
      emociones: [healthOk() ? (topF ? esc(topF[0]) : "—") : "Desactivado", healthOk() ? "la más frecuente" : "actívalo en Ajustes", null],
      historial: [String(S.allTrades.length), "operaciones", null],
      calendario: [w.n ? fmtR(w.tot) : "—", "últimos 7 días", null],
      informe: [D.st.n ? fmtR(D.st.tot) : "—", "hoy", null],
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
  const metaRow = D => `<div class="hb-meta"><span>${I(IC.cal, 15)} ${cap(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</span><span>${I(IC.clock, 15)} ${D.phase === "en" ? "En tu horario" : D.phase === "antes" ? "Antes de tu horario" : "Fuera de horario"}</span><span>${I('<path d="M3 14l4-5 4 3 6-8"/>', 15)} ${D.st.n ? fmtR(D.st.tot) + " hoy" : "Sin operaciones hoy"}</span></div>`;
  const loadAll = () => {
    const again = () => { if (/^#?(inicio|app\/.*)?$/.test(location.hash.replace(/^#/, ""))) re(); };
    if (!S.news && window.tkLoadNews) tkLoadNews().then(again);
    if (!S.btLoaded && BT()) BT().loadSessions().then(again);
    if (!S.pagesLoaded && DI()) DI().loadPages().then(again);
  };
  /* botones propios de cada cuadro (temporalidad, sesiones, pregunta) */
  function bindWidgets(root) {
    const q = sel => Array.from(root.querySelectorAll(sel));
    q("[data-tfs]").forEach(b => b.onclick = () => { const cur = lsGet("tk-tf", "5m"), i = Math.max(0, TFQ.indexOf(cur)), n = TFQ[Math.max(0, Math.min(TFQ.length - 1, i + +b.dataset.tfs))]; lsSet("tk-tf", n); re(); });
    q("[data-btcyc]").forEach(b => b.onclick = () => { const n = (S.bts || []).length; S.hbBt = ((S.hbBt || 0) + +b.dataset.btcyc + n) % n; re(); });
    q("[data-btplay]").forEach(b => b.onclick = () => { const x = (S.bts || []).find(y => y.id === b.dataset.btplay); if (x && BT()) BT().run(x); });
    q("[data-btnew]").forEach(b => b.onclick = () => { location.hash = "#backtest"; setTimeout(() => BT() && BT().drawer(), 60); });
    q("[data-ask]").forEach(a => a.onclick = () => { S.asPrefill = a.dataset.ask; });
    q("[data-repday]").forEach(b => b.onclick = () => { S.repDay = b.dataset.repday; location.hash = "#informe"; });
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
    try { const r = await TkChart.bars(sym, tf, { invoke: (n, body) => sb.functions.invoke(n, { body }) }); S.hbBars[key] = { t: Date.now(), b: (r.bars || []).slice(-60), d: TkChart.digits ? TkChart.digits(sym) : 2 }; }
    catch (e) { S.hbBars[key] = { t: Date.now() - 45000, b: c ? c.b : [], d: c ? c.d : 2, err: !c }; }
    finally { S.hbLoading = null; }
    const t = document.querySelector('.hb-t[data-hc="analizar"]:not(.sel)');
    if (t && t.querySelector(".hb-chart")) { t.innerHTML = appTile("analizar", hData()); bindWidgets(t); }
  }
  function bindTiles() {
    $$("[data-href]").forEach(el => {
      const k = el.dataset.hc;
      const act = kb => { if (!k || S.hcSel === k) location.hash = el.dataset.href; else selTile(k, kb); };
      el.addEventListener("click", e => { if (e.target.closest("[data-stop]")) return; act(false); });
      el.addEventListener("keydown", e => { if (e.target === el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); act(true); } });
    });
    bindWidgets(document);
    loadMini();
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
  V.inicio = {
    view() {
      loadAll();
      const D = hData(), first = esc((S.name || "").split(" ")[0] || "trader");
      setTimeout(() => { S.hbAnim = true; }, 600);
      return `<div class="hb hb-full${HAPPS.filter(k => appDef(k)).length === 9 ? " bento" : ""}">
        <section class="hb-l">${metaRow(D)}
          <h1 class="hb-hi">Hola, ${first},<br>${greetLine(D)}</h1>
          <div class="hb-grid${HAPPS.filter(k => appDef(k)).length === 9 ? " g9" : ""}${S.hcSel ? " has" : ""}">${HAPPS.filter(k => appDef(k)).map(k => { const on = S.hcSel === k; return `<div class="hb-t t-${k} ${S.hbAnim ? "noanim" : ""}${on ? " sel" : ""}" role="button" tabindex="0" data-hc="${k}" data-href="${appHref(k)}" aria-expanded="${on}" aria-label="${esc(appDef(k)[1])}: ${esc(APPDESC[k])}">${on ? calmOpen(k, D) : appTile(k, D)}</div>`; }).join("")}</div>
        </section></div>`;
    },
    bind() { bindTiles(); }
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
        <div class="xhead"><div><h1>Rendimiento</h1><div class="small muted">${st.n} operaciones cerradas${selAcct() ? " de " + esc(acctName(selAcct().a)) : ""} · todo en R</div></div>
          <div class="pseg" role="group" aria-label="Periodo">${PERS.map(([k, l]) => `<button type="button" data-rper="${k}" aria-pressed="${per === k}">${l}</button>`).join("")}</div></div>
        <div class="xkgrid">
          ${kpi("Resultado neto", st.n ? fmtR(st.tot) : "—", st.n + " operaciones", spark(curve, 96, 40), "Suma de todas las operaciones cerradas del periodo")}
          ${kpi("Factor de beneficio", fpf(st.pf), "lo ganado ÷ lo perdido", ring(st.pf == null ? 0 : Math.min(100, (st.pf === Infinity ? 3 : st.pf) / 3 * 100)), "Por encima de 1 ganas más de lo que pierdes")}
          ${kpi("Mejor frente a peor", best ? `<span style="font-size:.78em;white-space:nowrap">${fmtR(best.r)} / ${fmtR(worst.r)}</span>` : "—", best ? `${esc(best.symbol)} · ${esc(worst.symbol)}` : "", best ? meter(Math.max(0, best.r), Math.abs(Math.min(0, worst.r)), "mejor", "peor") : "", "Tu mejor y tu peor operación del periodo")}
          ${kpi("Ganancia media", st.avgW != null ? fmtR(st.avgW) : "—", wins + " ganadoras", "", "Lo que ganas de media en cada operación ganadora")}
          ${kpi("Relación ganancia / pérdida", rr != null ? num(rr, 2) : "—", st.avgL != null ? "pérdida media " + fmtR(st.avgL) : "", ring(rr == null ? 0 : Math.min(100, rr / 3 * 100)), "Ganancia media dividida entre la pérdida media")}
          ${kpi("Esperanza", st.exp != null ? fmtR(st.exp) : "—", "por operación", "", "Lo que ganas o pierdes de media por operación")}
          ${kpi("Peor caída", st.n ? fmtR(st.dd) : "—", "desde el máximo", "", "Lo máximo que has bajado desde tu mejor momento en el periodo")}
          ${kpi("Ganadoras frente a perdedoras", st.win == null ? "—" : num(st.win, 0) + " %", "", C.length ? meter(wins, losses, wins + " ganadoras", losses + " perdedoras") : "", "Porcentaje de operaciones ganadoras")}
        </div>
        <div class="xg3">
          <div class="card stack" style="gap:10px"><h2 class="h2b">Curva de resultado</h2>${lineChart(curve, { from: f0, to: f1, label: "Resultado acumulado en R", emptyText: "Aún no hay datos. Conecta MT5 o añade operaciones." })}</div>
          <div class="card stack" style="gap:10px"><h2 class="h2b">Caída desde el máximo</h2>${lineChart(ddc, { from: f0, to: f1, dd: true, label: "Caída desde el máximo en R", emptyText: "Aún no hay datos." })}<div class="small muted">Peor caída: <b class="mono">${fmtR(st.dd)}</b></div></div>
          <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Crecimiento de las cuentas</h2><a class="btn2" href="#cuentas" style="height:32px">${I(IC.plus, 14, 2)} Añadir cuenta</a></div>
            ${accts.length ? `<div class="stack" style="gap:10px">${accts.map(x => `<a class="racc" href="#cuentas"><div class="between"><b>${esc(acctName(x.a))}</b><span class="mono">${fmtR(x.st.tot)}</span></div>${spark(x.st.curve, 260, 34)}<span class="small muted">${x.st.n} op. · ${num(x.st.win, 0)} % acierto</span></a>`).join("")}</div>` : `<div class="xchart-empty">${(S.accts || []).length ? "Tus cuentas aún no tienen operaciones en este periodo." : "Aún no hay cuentas. Añade una para ver cómo crece cada una."}</div>`}</div>
        </div>
        <div class="card stack" style="gap:10px"><div class="between"><h2 class="h2b">Resultado por mes</h2><span class="small muted">últimos 12 meses</span></div>${barsV(byMonth, { label: "Resultado por mes" })}</div>
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

  /* ======================= CALENDARIO: real o práctica, en grande; al tocar un día se abre su informe ======================= */
  const cR = v => `<b class="mono ${v > 0 ? "cpos" : v < 0 ? "cneg" : ""}">${fmtR(v)}</b>`;
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
      return `<div class="card stack calcard" style="gap:16px"><div class="calh"><div><div class="calbig">${n ? cR(tot) : `<b class="mono">0,0 R</b>`}</div><div class="small muted">${n} operaciones en ${st.y}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${src}${modeB}<div class="calnav"><button type="button" class="xpb" data-cnav="-1" aria-label="Año anterior">${I(IC.left, 16, 2)}</button><b>${st.y}</b><button type="button" class="xpb" data-cnav="1" aria-label="Año siguiente">${I(IC.right, 16, 2)}</button></div></div></div>
        <div class="calyear">${months.map(x => `<button type="button" class="calm ${x.st.n ? (x.st.tot < 0 ? "neg" : "pos") : ""}" style="--a:${x.st.n ? (.15 + Math.abs(x.st.tot) / mx * .55).toFixed(2) : 0}" data-cmonth="${x.m}"><b>${cap(x.ml)}</b><span class="mono">${x.st.n ? fmtR(x.st.tot) : "—"}</span><small>${x.st.n ? x.st.n + " op. · " + num(x.st.win, 0) + " % acierto" : "sin operaciones"}</small></button>`).join("")}</div>${leg}</div>`;
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
        grid += `<${s.n ? `button type="button" data-cday="${k}" aria-label="${dt.getDate()}: ${fmtR(s.tot)}, ${s.n} operaciones. Ver informe"` : "div"} class="calc ${inM ? "" : "out"} ${cls} ${k === todayKey() ? "today" : ""} ${S.calSel === k ? "sel" : ""}" style="--a:${a}"><span class="cald">${dt.getDate()}</span>${s.n ? `<b class="mono">${fmtR(s.tot)}</b><small>${s.n} op.${s.win != null ? " · " + num(s.win, 0) + " %" : ""}</small>` : ""}</${s.n ? "button" : "div"}>`;
      }
      const ws = tradeStats(wl); W.push({ w: w + 1, l: wl, st: ws });
      grid += `<div class="calc calw"><span class="cald">Semana ${w + 1}</span>${ws.n ? `${cR(ws.tot)}<small>${(n => n + (n === 1 ? " día" : " días"))(new Set(wl.map(t => dayKey(dateOf(t)))).size)} · ${ws.n} op.</small>` : `<small>—</small>`}</div>`;
    }
    const wkRows = W.map(x => `<tr><td><b>Semana ${x.w}</b></td><td class="mono">${x.st.n || "—"}</td><td class="mono">${x.st.win == null ? "—" : num(x.st.win, 0) + " %"}</td><td class="mono">${x.st.avgW != null ? fmtR(x.st.avgW) : "—"}</td><td class="mono">${x.st.avgL != null ? fmtR(x.st.avgL) : "—"}</td><td>${x.st.n ? cR(x.st.tot) : "—"}</td></tr>`).join("");
    return `<div class="card stack calcard" style="gap:16px"><div class="calh"><div><div class="calbig">${mst.n ? cR(mst.tot) : `<b class="mono">0,0 R</b>`}</div><div class="small muted">${cap(MESES_L[st.m])} de ${st.y} · ${inMonth.length} días operados · <span class="cpos">${pos} positivos</span>, <span class="cneg">${neg} negativos</span></div></div>
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
      ? `<div class="dp-op"><span><i class="dp-t"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"}</i><small>${esc(sessName(t.session_id))}${t.exit_time ? " · " + new Date(t.exit_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</small></span>${t.r != null ? cR(+t.r) : "<b>abierta</b>"}</div>`
      : `<a class="dp-op" href="#op/${encodeURIComponent(t.id)}"><span><i class="dp-t"><b>${esc(t.symbol)}</b> · ${t.side === "buy" ? "Compra" : "Venta"}</i><small>${new Date(t.open_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · ${t.status === "closed" ? (evaluate(t).good ? "dentro del plan" : evaluate(t).fail.length + " norma(s) sin cumplir") : "abierta"}</small></span>${t.status === "closed" ? cR(t.r) : "<b>abierta</b>"}</a>`).join("");
    const box = document.createElement("div"); box.className = "xdrawer"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Informe del día");
    box.innerHTML = `<div class="xdrawer-p dpanel"><div class="xdr-h"><div><div class="small muted">${bt ? "Práctica" : "Informe del día"}</div><b style="font-size:18px">${cap(dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}</b></div><button type="button" class="xib" data-x aria-label="Cerrar">${I(IC.x, 18, 2)}</button></div>
      <div class="xdr-b">
        <div class="dp-hero ${st.tot > 0 ? "pos" : st.tot < 0 ? "neg" : ""}"><span>Resultado del día</span><b class="mono">${st.n ? fmtR(st.tot) : "—"}</b><small>${st.n} operación${st.n === 1 ? "" : "es"} cerrada${st.n === 1 ? "" : "s"}${st.win != null ? " · " + num(st.win, 0) + " % acierto" : ""}</small></div>
        <div class="dp-k">${bt ? `<div><span>Sesiones</span><b>${new Set(L.map(t => t.session_id || "")).size}</b></div><div><span>Mejor operación</span><b class="mono">${C.length ? fmtR(Math.max(...C.map(t => +t.r))) : "—"}</b></div>` : `<div><span>Dentro del plan</span><b>${C.length ? good + " de " + C.length : "—"}</b></div><div><span>Caída máxima</span><b class="mono">${st.n ? fmtR(st.dd) : "—"}</b></div>`}</div>
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
