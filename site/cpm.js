// Critical path method on working days. Shared by the browser and the Node tests.
(function (root) {
  'use strict';
  function cpm(tasks) {
    const byId = new Map(tasks.map(t => [t.id, { ...t, preds: t.preds || [] }]));
    // topological order (Kahn); throws on cycles or unknown predecessors
    const indeg = new Map([...byId.keys()].map(k => [k, 0])), succ = new Map([...byId.keys()].map(k => [k, []]));
    for (const t of byId.values()) for (const p of t.preds) {
      if (!byId.has(p)) throw new Error(`unknown predecessor ${p} of ${t.id}`);
      indeg.set(t.id, indeg.get(t.id) + 1); succ.get(p).push(t.id);
    }
    const order = [], q = [...[...indeg].filter(([, d]) => d === 0).map(([k]) => k)];
    while (q.length) { const k = q.shift(); order.push(k); for (const s of succ.get(k)) { indeg.set(s, indeg.get(s) - 1); if (indeg.get(s) === 0) q.push(s); } }
    if (order.length !== byId.size) throw new Error('dependency cycle');
    for (const k of order) { const t = byId.get(k); t.es = Math.max(0, ...t.preds.map(p => byId.get(p).ef)); t.ef = t.es + t.dur; }
    const end = Math.max(...order.map(k => byId.get(k).ef));
    for (const k of [...order].reverse()) { const t = byId.get(k); const ss = succ.get(k); t.lf = ss.length ? Math.min(...ss.map(s => byId.get(s).ls)) : end; t.ls = t.lf - t.dur; t.float = t.ls - t.es; t.critical = t.float === 0; }
    return { tasks: order.map(k => byId.get(k)), end };
  }
  // working-day calendar: day 0 = start date; skips weekends and listed holidays
  function calendar(startISO, holidays) {
    const hol = new Set(holidays || []);
    const days = []; const d = new Date(startISO + 'T12:00:00Z');
    return function dateOf(n) {
      while (days.length <= n) {
        const iso = d.toISOString().slice(0, 10), wd = d.getUTCDay();
        if (wd !== 0 && wd !== 6 && !hol.has(iso)) days.push(iso);
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return days[n];
    };
  }
  const api = { cpm, calendar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CPM = api;
})(typeof window !== 'undefined' ? window : globalThis);
