// Tickora · calendario económico de la semana (y la siguiente si está publicada).
// Lee el calendario semanal público en JSON y lo devuelve limpio, con caché de 20 minutos.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];
type Ev = { title: string; country: string; date: string; impact: string; forecast: string; previous: string; actual?: string };
let cache: { t: number; events: Ev[] } | null = null;

async function load(): Promise<Ev[]> {
  if (cache && Date.now() - cache.t < 20 * 60 * 1000) return cache.events;
  const out: Ev[] = [];
  for (const url of FEEDS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Tickora/1.0 (calendario)" } });
      if (!r.ok) continue;
      const j = await r.json();
      if (Array.isArray(j)) for (const e of j) {
        if (!e || !e.title || !e.date) continue;
        out.push({ title: String(e.title), country: String(e.country || ""), date: String(e.date), impact: String(e.impact || ""), forecast: String(e.forecast || ""), previous: String(e.previous || ""), actual: e.actual ? String(e.actual) : "" });
      }
    } catch (_) { /* seguimos con la otra semana */ }
  }
  const seen = new Set<string>();
  const events = out.filter((e) => { const k = e.date + "|" + e.country + "|" + e.title; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (events.length) cache = { t: Date.now(), events };
  return events.length ? events : (cache ? cache.events : []);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const events = await load();
    return new Response(JSON.stringify({ events, at: cache ? cache.t : Date.now() }), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "max-age=300" } });
  } catch (e) {
    return new Response(JSON.stringify({ events: [], error: String(e) }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
