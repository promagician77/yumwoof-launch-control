(() => {
  'use strict';
  const { cpm, calendar } = window.CPM, P = window.PLAN, C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }
  function sv(tag, attrs = {}, ...kids) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v); for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c)); return n; }
  const tip = $('#tip');
  const place = e => { let x = e.clientX + 14, y = e.clientY + 14; const r = tip.getBoundingClientRect(); if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14; if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14; tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px'; };
  const hover = (n, html) => { n.addEventListener('mouseenter', e => { tip.innerHTML = html(); tip.hidden = false; place(e); }); n.addEventListener('mousemove', place); n.addEventListener('mouseleave', () => { tip.hidden = true; }); };
  const D = calendar(P.start, P.holidays);
  const fmt = iso => { const d = new Date(iso + 'T12:00:00Z'); return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
  const short = iso => { const d = new Date(iso + 'T12:00:00Z'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); };
  const money = n => '$' + n.toLocaleString('en-US');
  const dayIndex = iso => { for (let i = 0; i < 400; i++) if (D(i) >= iso) return i; return 400; };
  const endDate = t => D(Math.max(t.es, t.ef - 1));

  /* ---------------- plan state ---------------- */
  const BASE = cpm(P.tasks);
  const on = new Set();
  const applied = () => P.scenarios.filter(s => on.has(s.id)).sort((a, b) => (b.fix ? 1 : 0) - (a.fix ? 1 : 0)).reduce((t, s) => s.apply(t), P.tasks);
  const current = () => cpm(applied());
  const deltaOf = s => cpm(s.apply(P.tasks)).end - BASE.end;
  const retest = P.scenarios.find(s => s.id === 'retest'), fix = P.scenarios.find(s => s.id === 'decouple');
  const retestAfterFix = cpm(retest.apply(fix.apply(P.tasks))).end - cpm(fix.apply(P.tasks)).end;

  /* ---------------- portfolio ---------------- */
  function bookings(res) {
    const m = Object.fromEntries(res.tasks.map(t => [t.id, t]));
    const out = [];
    for (const [id, r] of Object.entries(C.p1Bookings)) { const t = m[id]; out.push({ project: 'P1', res: r, what: t.name.replace(/\(.*\)/, '').trim(), start: D(t.es), end: endDate(t), float: t.float, task: id }); }
    for (const p of C.projects.filter(p => !p.fromPlan)) for (const b of p.bookings) out.push({ project: p.id, ...b });
    return out;
  }
  function conflicts(bs) {
    const out = [];
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j];
      if (a.res !== b.res || a.project === b.project) continue;
      const s = a.start > b.start ? a.start : b.start, e = a.end < b.end ? a.end : b.end;
      if (s <= e) out.push({ res: a.res, a, b, start: s, end: e });
    }
    return out;
  }
  function suggest(c) {
    const P1 = c.a.project === 'P1' ? c.a : c.b.project === 'P1' ? c.b : null;
    const other = P1 === c.a ? c.b : c.a;
    const overlap = dayIndex(c.end) - dayIndex(c.start) + 1;
    if (P1 && P1.float >= overlap) return `Slide the launch's "${P1.what}" by ${overlap} working day${overlap > 1 ? 's' : ''}: it has ${P1.float} days of float, so the go-live date holds.`;
    if (P1) return `The launch's "${P1.what}" is on the critical path. Move ${other.project} "${other.what}" to start ${short(D(dayIndex(P1.end) + 1))}, or agree extra capacity with the ${C.resources[c.res].replace(/^./, ch => ch.toLowerCase())}.`;
    const lo = C.projects.find(p => p.id === c.a.project).priority > C.projects.find(p => p.id === c.b.project).priority ? c.a : c.b;
    return `Lower priority goes second: move ${lo.project} "${lo.what}" after ${short(lo === c.a ? c.b.end : c.a.end)}.`;
  }

  /* ---------------- header ---------------- */
  const conf0 = conflicts(bookings(BASE));
  const critN = BASE.tasks.filter(t => t.critical && !t.gate).length, workN = BASE.tasks.filter(t => !t.gate).length;
  const stat = (v, l, s) => el('div', { class: 'stat' }, el('dt', {}, l), el('dd', {}, v), el('small', {}, s));
  $('#stats').append(
    stat(short(D(BASE.end)) + ', ' + D(BASE.end).slice(0, 4), 'calculated go-live', `${BASE.end} working days from the brief, holidays excluded`),
    stat(`${critN} of ${workN}`, 'steps on the critical path', 'after formula lock, packaging sets the date, not formula'),
    stat(`+${deltaOf(retest)} → +${retestAfterFix} days`, 'impact of a lab retest', 'before and after decoupling copy from lab results'),
    stat(String(conf0.length), 'resource conflicts across 4 projects', 'found before anyone double-books the co-packer'));

  /* ---------------- tabs ---------------- */
  const TABS = [['plan', 'Launch plan'], ['portfolio', 'Portfolio calendar'], ['gates', 'Stage gates'], ['artwork', 'Artwork routing'], ['label', 'US label + claims'], ['docs', 'Vendors + documents'], ['status', 'Weekly update']];
  const tl = $('#tablist'), PN = {};
  TABS.forEach(([id, label]) => { tl.append(el('button', { role: 'tab', id: 't-' + id, 'aria-controls': 'p-' + id, 'aria-selected': 'false', tabindex: '-1', onclick: () => { location.hash = id; } }, label)); PN[id] = el('section', { class: 'panel', id: 'p-' + id, role: 'tabpanel', 'aria-labelledby': 't-' + id, hidden: true }); $('#panels').append(PN[id]); });
  tl.addEventListener('keydown', e => { const b = [...tl.children], i = b.indexOf(document.activeElement); if (i < 0) return; const j = e.key === 'ArrowRight' ? (i + 1) % b.length : e.key === 'ArrowLeft' ? (i - 1 + b.length) % b.length : -1; if (j >= 0) { b[j].focus(); b[j].click(); e.preventDefault(); } });
  const select = id => { if (!PN[id]) id = 'plan'; Object.entries(PN).forEach(([k, p]) => { p.hidden = k !== id; }); [...tl.children].forEach(b => { const s = b.id === 't-' + id; b.setAttribute('aria-selected', s); b.tabIndex = s ? 0 : -1; }); };
  addEventListener('hashchange', () => select(location.hash.slice(1)));

  /* ---------------- launch plan ---------------- */
  const ganttBox = el('div', { class: 'card scroll' }), sideBox = el('div', { class: 'stack' });
  PN.plan.append(el('h2', {}, 'The launch plan, calculated'),
    el('p', { class: 'sub' }, 'Each step has an owner, a duration and the steps it waits for; the critical path and every float are calculated from that. Switch on a slip to see where it lands, and which slips the plan absorbs.'),
    el('div', { class: 'side' }, ganttBox, sideBox));
  function drawPlan() {
    const R = current(), m = Object.fromEntries(R.tasks.map(t => [t.id, t]));
    const rows = P.tasks.map(t => m[t.id] || R.tasks.find(x => x.id === t.id));
    const W = 980, L = 330, rh = 24, top = 34, H = top + rows.length * rh + 14, span = Math.max(R.end, BASE.end) + 6;
    const x = d => L + (d / span) * (W - L - 12);
    const svg = sv('svg', { class: 'gantt', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Launch plan Gantt chart with the critical path highlighted' });
    const g = sv('g', { class: 'grid' });
    let lastM = '';
    for (let i = 0; i <= span; i++) { const iso = D(i), mo = iso.slice(0, 7); if (mo !== lastM) { lastM = mo; g.append(sv('line', { x1: x(i), x2: x(i), y1: 20, y2: H - 6 })); svg.append(sv('text', { x: x(i) + 4, y: 14 }, new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }))); } }
    svg.prepend(g);
    const si = dayIndex(C.statusDate);
    svg.append(sv('line', { class: 'today', x1: x(si), x2: x(si), y1: 20, y2: H - 6 }), sv('text', { x: x(si) + 4, y: 28, style: 'fill:var(--ok);font-weight:650' }, `status ${short(C.statusDate)}`));
    rows.forEach((t, i) => {
      const y = top + i * rh;
      svg.append(sv('text', { class: 'tl', x: 8, y: y + 15, style: t.gate ? 'font-weight:700' : '' }, (t.name.length > 46 ? t.name.slice(0, 45) + '…' : t.name)));
      if (t.gate) {
        const cx = x(t.es), cy = y + 11;
        svg.append(sv('path', { d: `M${cx} ${cy - 7} L${cx + 7} ${cy} L${cx} ${cy + 7} L${cx - 7} ${cy} Z`, style: `fill:${t.critical ? 'var(--crit)' : 'var(--bar)'}` }));
      } else {
        svg.append(sv('rect', { x: x(t.es), y: y + 5, width: Math.max(2, x(t.ef) - x(t.es) - 1), height: 13, rx: 3, style: `fill:${t.critical ? 'var(--crit)' : 'var(--bar)'}` }));
        if (t.float > 0) svg.append(sv('line', { x1: x(t.ef), x2: x(t.ef + t.float), y1: y + 11.5, y2: y + 11.5, style: 'stroke:var(--float);stroke-width:1.5;stroke-dasharray:3 3' }));
      }
      const hit = sv('rect', { x: 0, y, width: W, height: rh, fill: 'transparent' });
      hover(hit, () => `<b>${t.name}</b><br>${t.owner}<br>${t.gate ? fmt(D(t.es)) : `${short(D(t.es))} → ${short(endDate(t))} · ${t.dur} working days`}<br>${t.critical ? 'On the critical path' : `${t.float} days of float`}`);
      svg.append(hit);
    });
    ganttBox.replaceChildren(el('div', { class: 'legend' }, el('span', {}, el('i', { class: 'sw', style: 'background:var(--crit)' }), 'critical path (no float)'), el('span', {}, el('i', { class: 'sw', style: 'background:var(--bar)' }), 'has float'), el('span', {}, el('i', { class: 'sw', style: 'height:0;border-top:2px dashed var(--float)' }), 'float: how far it can slip'), el('span', {}, '◆ gate')), svg);
    const delta = R.end - BASE.end;
    sideBox.replaceChildren(
      el('div', { class: 'card' }, el('div', { class: 'note' }, 'Go-live'), el('div', { class: 'golive' }, fmt(D(R.end))),
        el('div', { class: 'delta ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') }, delta === 0 ? 'On the baseline date' : `${delta > 0 ? '+' : ''}${delta} working days vs the baseline (${short(D(BASE.end))})`)),
      el('div', { class: 'card' }, el('h3', {}, 'What if…'), el('div', { class: 'scen' }, P.scenarios.map(s => {
        const d = deltaOf(s);
        return el('label', { class: s.fix ? 'fix' : '' }, el('input', { type: 'checkbox', checked: on.has(s.id), onchange: e => { e.target.checked ? on.add(s.id) : on.delete(s.id); drawAll(); } }),
          el('span', {}, s.label, el('small', {}, s.note)), el('span', { class: 'd' }, s.fix ? `retest +${deltaOf(retest)} → +${retestAfterFix}` : `+${d} d`));
      })), el('p', { class: 'note' }, 'Numbers on the right are each slip on its own. Tick several to see them combine; slips on different branches overlap rather than add.')),
      el('div', { class: 'card' }, el('h3', {}, 'What the plan says'), el('ul', { class: 'clean' },
        el('li', {}, `Packaging, not formula, sets the date after Gate 2: copy, review, two artwork rounds, proof and ${P.tasks.find(t => t.id === 'T15').dur} working days of film.`),
        el('li', {}, `Ingredient orders have ${BASE.tasks.find(t => t.id === 'T16').float} days of float; chasing them early buys nothing.`),
        el('li', {}, `A lab retest costs ${deltaOf(retest)} days only because final copy waits for lab values. Route copy on formulation values and let the lab confirm before the printer proof: the same retest costs ${retestAfterFix}.`),
        el('li', {}, 'The film order is the single biggest block: lock bag size and dieline at Gate 2, not after artwork.'))));
  }

  /* ---------------- portfolio ---------------- */
  const pfBox = el('div', { class: 'card scroll' }), confBox = el('div', { class: 'card' });
  PN.portfolio.append(el('h2', {}, 'Four projects, one calendar'),
    el('p', { class: 'sub' }, 'The launch above runs next to a reformulation, a packaging refresh to the new AAFCO label format and a line extension. Shared resources are where launches really slip, so conflicts are found from the bookings, not from memory. The launch\'s bookings move with the scenarios you tick.'),
    pfBox, el('div', { style: 'margin-top:18px' }, confBox));
  const PC = { P1: '#2a78d6', P2: '#eb6834', P3: '#1baf7a', P4: '#eda100' };
  function drawPortfolio() {
    const bs = bookings(current()), cs = conflicts(bs);
    const resIds = Object.keys(C.resources), from = '2026-11-23', to = '2027-04-02';
    const days = (a, b) => (new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5;
    const W = 980, L = 170, laneH = 64, top = 30, H = top + resIds.length * laneH + 10, span = days(from, to);
    const x = iso => L + days(from, iso) / span * (W - L - 10);
    const svg = sv('svg', { class: 'pf', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Resource calendar across four projects with conflicts marked' });
    const g = sv('g', { class: 'grid' });
    for (let d = new Date(from + 'T12:00:00Z'); d <= new Date(to + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 7)) { const iso = d.toISOString().slice(0, 10); g.append(sv('line', { x1: x(iso), x2: x(iso), y1: 18, y2: H - 6 })); if (d.getUTCDate() <= 7) svg.append(sv('text', { x: x(iso) + 3, y: 13 }, d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }))); }
    svg.prepend(g);
    resIds.forEach((r, i) => {
      const y = top + i * laneH;
      svg.append(sv('text', { class: 'res', x: 8, y: y + 22 }, C.resources[r]));
      svg.append(sv('line', { x1: 0, x2: W, y1: y + laneH - 4, y2: y + laneH - 4, style: 'stroke:var(--line)' }));
      const lane = bs.filter(b => b.res === r);
      lane.forEach(b => {
        const sub = ['P1', 'P2', 'P3', 'P4'].indexOf(b.project) % 2;
        const bx = x(b.start), bw = Math.max(4, x(b.end) - x(b.start) + (W - L) / span), by = y + 8 + sub * 24;
        const rect = sv('rect', { x: bx, y: by, width: bw, height: 18, rx: 4, fill: PC[b.project], style: 'stroke:var(--surface);stroke-width:2' });
        svg.append(rect);
        if (bw > 26) svg.append(sv('text', { x: bx + 4, y: by + 13, style: 'fill:#fff;font-weight:700;font-size:11px' }, b.project));
        hover(rect, () => `<b>${b.project} · ${b.what}</b><br>${short(b.start)} → ${short(b.end)}${b.float != null ? `<br>${b.float ? b.float + ' days of float' : 'critical path'}` : ''}`);
      });
    });
    cs.forEach(c => {
      const i = resIds.indexOf(c.res), y = top + i * laneH;
      svg.append(sv('rect', { x: x(c.start) - 2, y: y + 4, width: x(c.end) - x(c.start) + (W - L) / span + 4, height: 52, rx: 5, style: 'fill:none;stroke:var(--crit);stroke-width:2;stroke-dasharray:4 2' }));
      svg.append(sv('text', { x: x(c.start), y: y + 4 - 2, style: 'fill:var(--crit);font-weight:800;font-size:12px' }, '!'));
    });
    pfBox.replaceChildren(el('div', { class: 'legend' }, C.projects.map(p => el('span', {}, el('i', { class: 'sw', style: `background:${PC[p.id]}` }), `${p.id} · ${p.name}`)), el('span', {}, el('i', { class: 'sw', style: 'background:none;border:2px dashed var(--crit)' }), '! conflict')), svg);
    confBox.replaceChildren(el('h3', {}, `${cs.length} conflict${cs.length === 1 ? '' : 's'}, with a proposed resolution`),
      el('table', { class: 't' }, el('thead', {}, el('tr', {}, ['Resource', 'Overlap', 'Between', 'Proposed resolution'].map(h => el('th', {}, h)))),
        el('tbody', {}, cs.map(c => el('tr', {}, el('td', {}, C.resources[c.res]), el('td', {}, `${short(c.start)} → ${short(c.end)}`), el('td', {}, `${c.a.project} ${c.a.what}`, el('br'), `${c.b.project} ${c.b.what}`), el('td', {}, suggest(c)))))),
      el('p', { class: 'note' }, 'Resolutions use float from the calculated plan where the launch is involved, and project priority otherwise. They are proposals for the weekly meeting, not decisions.'));
  }

  /* ---------------- gates ---------------- */
  function drawGates() {
    const R = current(), m = Object.fromEntries(R.tasks.map(t => [t.id, t]));
    const when = { G0: 'before the brief', G1: 'before the brief', G2: fmt(D(m.G2.es)), G3: fmt(D(m.G3.es)), G4: fmt(D(m.G4.es)) };
    PN.gates.replaceChildren(el('h2', {}, 'Stage gates: what "done" means before the next spend'),
      el('p', { class: 'sub' }, 'A gate is a short list of facts that must be true, with one owner who signs. Dates come from the calculated plan.'),
      el('div', { class: 'gates' }, C.gates.map(g => el('div', { class: 'card gate' }, el('h3', {}, el('i', {}, g.id), g.name), el('div', { class: 'note' }, `${when[g.id]} · signs: ${g.owner}`), el('ul', {}, g.items.map(i => el('li', {}, i)))))));
  }

  /* ---------------- artwork ---------------- */
  PN.artwork.append(el('h2', {}, 'Artwork routing that cannot skip a step'),
    el('p', { class: 'sub' }, 'Every label element has one person responsible and one who approves, every file has a version tied to a formula version, and every change says how far back it must re-route.'),
    el('div', { class: 'flow' }, C.routing.map(r => el('div', {}, el('b', {}, r.step), el('span', { class: 'who' }, r.who), r.out))),
    el('div', { class: 'grid2', style: 'margin-top:20px' },
      el('div', { class: 'card' }, el('h3', {}, 'Approval matrix'), el('div', { class: 'scroll' }, el('table', { class: 't mx' }, el('thead', {}, el('tr', {}, el('th', {}, 'Label element'), C.matrixRoles.map(r => el('th', { class: 'num' }, r)))),
        el('tbody', {}, C.matrix.map(row => el('tr', {}, el('td', {}, row[0]), row.slice(1).map(v => el('td', { class: 'c ' + v }, v || '·'))))))),
        el('p', { class: 'note' }, 'R responsible · A approves (signs) · C consulted · I informed. A file is released only when every A on it is dated against that file version.')),
      el('div', { class: 'stack' }, el('div', { class: 'card' }, el('h3', {}, 'What forces a re-route'), el('ul', { class: 'clean' }, C.retriggers.map(r => el('li', {}, r)))),
        el('div', { class: 'card' }, el('h3', {}, 'File names that answer "which version?"'), el('p', { style: 'margin:0 0 6px' }, el('code', {}, 'SALPMP-2LB_BAG_f2.0_c3_a2_2027-02-04_PROOF.pdf')),
          el('p', { class: 'note', style: 'margin:0' }, 'SKU · component · formula version · copy round · artwork round · date · status. A proof built on formula 1.1 cannot be mistaken for one built on the locked 2.0.')))));

  /* ---------------- label + claims ---------------- */
  const out = el('div', { class: 'names' });
  const ex = el('input', { type: 'number', min: 0, max: 100, step: 0.5, value: 26, 'aria-label': 'Named ingredient, percent of product excluding water' });
  const inc = el('input', { type: 'number', min: 0, max: 100, step: 0.5, value: 24, 'aria-label': 'Named ingredient, percent of product including water' });
  function names() {
    const a = +ex.value, b = +inc.value;
    const rows = [
      ['"Salmon Dog Food"', a >= 95 && b >= 70, '95% rule: at least 95% excluding water, and at least 70% counting water'],
      ['"Salmon Dinner / Entrée / Formula"', a >= 25 && b >= 10, '25% rule: at least 25% excluding water, and at least 10% counting water'],
      ['"Dog Food with Salmon"', a >= 3, '"with" rule: at least 3%'],
      ['"Salmon Flavor Dog Food"', true, '"flavor" rule: no minimum, but the flavour must be detectable'],
    ];
    out.replaceChildren(...rows.map(([n, okk, why]) => el('div', {}, el('span', {}, el('b', {}, n), el('br'), el('span', { class: 'note' }, why)), el('span', { class: okk ? 'ok' : 'no' }, okk ? '✓ allowed' : '✗ not allowed'))));
  }
  ex.addEventListener('input', names); inc.addEventListener('input', names); names();
  const req = [
    ['Product name, following the naming rules', 'FDA (identity) + AAFCO model', 'Front panel'],
    ['Net quantity statement', 'FDA', 'Front panel'],
    ['Manufacturer or distributor name and place', 'FDA', 'Back or side'],
    ['Ingredients by common or usual name, in descending order by weight', 'FDA', 'Back or side'],
    ['Intended species ("dog")', 'AAFCO model, state law', 'Front panel'],
    ['Guaranteed analysis (becomes the Pet Nutrition Facts box)', 'AAFCO model, state law', 'Back or side'],
    ['Nutritional adequacy statement, substantiated by an AAFCO nutrient profile or a feeding trial', 'AAFCO model, state law', 'Back or side'],
    ['Feeding directions', 'AAFCO model, state law', 'Back or side'],
  ];
  PN.label.append(el('h2', {}, 'US label and claims checks built into the routing'),
    el('p', { class: 'sub' }, 'What the copy deck is checked against before creative touches it. Final sign-off stays with your regulatory adviser; this is how the project gets there without surprises.'),
    el('div', { class: 'grid2' },
      el('div', { class: 'card' }, el('h3', {}, 'Required on a US dog food label'), el('table', { class: 't' }, el('thead', {}, el('tr', {}, ['Element', 'Source', 'Where'].map(h => el('th', {}, h)))), el('tbody', {}, req.map(r => el('tr', {}, r.map(c => el('td', {}, c)))))),
        el('p', { class: 'note' }, 'States adopt AAFCO\'s model regulations into their own law, so registration and label review happen state by state.')),
      el('div', { class: 'stack' },
        el('div', { class: 'card' }, el('h3', {}, 'Product name check'), el('p', { class: 'note', style: 'margin:0' }, 'Enter the share of the named ingredient (salmon) in the formula.'),
          el('div', { class: 'checker' }, el('label', {}, 'Excluding water (%)', ex), el('label', {}, 'Counting water (%)', inc)), out),
        el('div', { class: 'card' }, el('h3', {}, 'Claims gate'), el('ul', { class: 'clean' },
          el('li', {}, 'FDA: claims that establish an intended use to cure, treat, prevent or mitigate disease can make a product an unapproved new animal drug.'),
          el('li', {}, 'That includes what is said off the bag: in a November 2024 warning letter FDA cited claims from a company\'s Facebook page and third-party product pages.'),
          el('li', {}, 'So every claim, on pack, product page, landing page or ad, goes through the same review step, and a claim approved for the bag is not automatically approved for an ad.'))))),
    el('div', { class: 'card', style: 'margin-top:18px' }, el('h3', {}, 'New AAFCO label format (Pet Food Label Modernization)'),
      el('div', { class: 'grid3' },
        el('ul', { class: 'clean' }, el('li', {}, 'Approved by AAFCO on 31 July 2023; each state adopts it through its own rulemaking.'), el('li', {}, 'AAFCO recommends six years of enforcement discretion from the printed 2024 Official Publication, so every refresh in that window should be built in the new format.')),
        el('ul', { class: 'clean' }, el('li', {}, 'A Pet Nutrition Facts box replaces the guaranteed analysis: crude protein, crude fat, total carbohydrates (including dietary fiber) and moisture; crude fiber drops out.'), el('li', {}, 'Calories sit under the unit of measure, with a household measure and serving weight in grams.')),
        el('ul', { class: 'clean' }, el('li', {}, 'An intended use statement ("complete adult dog food") goes on the front, in the bottom 30% of the principal display panel.'), el('li', {}, 'Handling and storage instructions are optional; if used, they get a bold header, separate from feeding directions.')))),
    el('p', { class: 'note', style: 'margin-top:12px' }, 'Sources: FDA, Animal Food Labeling and Pet Food Claims; FDA warning letter to Intermarket Industries (Doc Ackerman Pet Products), 12 Nov 2024; AAFCO, Pet Food Label Modernization; NASC on AAFCO approval (31 Jul 2023); Pet Food Processing on PFLM label changes; Virginia Tech Extension FST-434 on naming rules and required items.'));

  /* ---------------- vendors + docs ---------------- */
  function drawDocs() {
    const sd = new Date(C.statusDate + 'T12:00:00Z');
    const st = exp => { if (!exp) return ['ok', 'no expiry']; const d = (new Date(exp + 'T12:00:00Z') - sd) / 864e5; return d < 0 ? ['crit', 'expired'] : d <= 60 ? ['warn', `expires in ${Math.round(d)} days`] : ['ok', `valid to ${short(exp)}`]; };
    const docRows = C.vendors.flatMap(v => v.docs.map(([n, e]) => [v.name, v.type, n, e]));
    const alerts = docRows.filter(r => r[3] && st(r[3])[0] !== 'ok');
    const spent = C.budget.lines.reduce((a, l) => a + l[2], 0), planned = C.budget.lines.reduce((a, l) => a + l[1], 0);
    const risks = P.scenarios.filter(s => on.has(s.id) && s.cost), exposure = risks.reduce((a, s) => a + s.cost, 0);
    const contingency = C.budget.lines.find(l => /contingency/i.test(l[0]))[1];
    PN.docs.replaceChildren(el('h2', {}, 'One source of truth for vendors, documents and versions'),
      el('p', { class: 'sub' }, `Specs, formula versions, samples, certificates and spend in one place, checked against the status date (${fmt(C.statusDate)}). Expiring documents surface in the weekly update before a co-packer audit does.`),
      el('div', { class: 'grid2' },
        el('div', { class: 'card' }, el('h3', {}, `Supplier documents · ${alerts.length} need action`), el('table', { class: 't' }, el('thead', {}, el('tr', {}, ['Vendor', 'Document', 'Status'].map(h => el('th', {}, h)))),
          el('tbody', {}, docRows.map(r => { const [c, t] = st(r[3]); return el('tr', {}, el('td', {}, r[0], el('br'), el('span', { class: 'note' }, r[1])), el('td', {}, r[2]), el('td', {}, el('span', { class: 'pill ' + c }, (c === 'ok' ? '✓ ' : '! ') + t))); })))),
        el('div', { class: 'stack' },
          el('div', { class: 'card' }, el('h3', {}, 'Formula versions'), el('table', { class: 't' }, el('tbody', {}, C.formula.map(f => el('tr', {}, el('td', {}, el('b', {}, f[0])), el('td', {}, short(f[1])), el('td', {}, f[2])))))),
          el('div', { class: 'card' }, el('h3', {}, 'Sample and trial log'), el('table', { class: 't' }, el('thead', {}, el('tr', {}, ['ID', 'What', 'Sent', 'Back', 'Outcome'].map(h => el('th', {}, h)))), el('tbody', {}, C.samples.map(s => el('tr', {}, el('td', {}, s[0]), el('td', {}, s[1]), el('td', {}, short(s[2])), el('td', {}, s[3] ? short(s[3]) : '–'), el('td', {}, s[4])))))),
          el('div', { class: 'card' }, el('h3', {}, `Development spend · ${money(spent)} of ${money(C.budget.total)}`), el('table', { class: 't' }, el('thead', {}, el('tr', {}, ['Line', 'Budget', 'Spent'].map((h, i) => el('th', { class: i ? 'num' : '' }, h)))),
            el('tbody', {}, C.budget.lines.map(l => el('tr', {}, el('td', {}, l[0]), el('td', { class: 'num' }, money(l[1])), el('td', { class: 'num' }, l[2] ? money(l[2]) : '–'))), el('tr', {}, el('td', {}, el('b', {}, 'Total')), el('td', { class: 'num' }, el('b', {}, money(planned))), el('td', { class: 'num' }, el('b', {}, money(spent)))),
              risks.map(s => el('tr', {}, el('td', { style: 'color:var(--crit)' }, 'Risk ticked: ' + s.label.toLowerCase()), el('td', { class: 'num', style: 'color:var(--crit)' }, '+' + money(s.cost)), el('td', { class: 'num' }, '–'))),
              exposure ? el('tr', {}, el('td', {}, el('b', {}, 'Contingency left if these happen')), el('td', { class: 'num' }, el('b', { class: exposure > contingency ? 'no' : '' }, money(contingency - exposure))), el('td', {})) : null)),
            el('p', { class: 'note' }, exposure ? `Illustrative figures. ${risks.length} ticked risk${risks.length > 1 ? 's' : ''} on the Launch plan tab add ${money(exposure)}, priced before the invoice arrives.` : 'Illustrative figures. Tick a slip on the Launch plan tab (a third bench round, a lab retest) and its cost lands here before the invoice does.')))));
    drawDocs.exposure = { exposure, contingency, spent, total: C.budget.total };
    return alerts;
  }

  /* ---------------- status update + CSV ---------------- */
  function csv(R) {
    const m = Object.fromEntries(R.tasks.map(t => [t.id, t]));
    const q = s => `"${String(s).replace(/"/g, '""')}"`;
    const head = ['Task Name', 'Assignee', 'Start Date', 'Due Date', 'Duration (working days)', 'Depends On', 'Stage', 'Milestone', 'Critical Path', 'Float (days)'];
    const lines = P.tasks.map(t0 => { const t = m[t0.id]; return [t.name, t.owner, D(t.es), endDate(t), t.dur, t.preds.map(p => m[p].name).join('; '), t.lane, t.gate ? 'Yes' : 'No', t.critical ? 'Yes' : 'No', t.float].map(q).join(','); });
    return [head.map(q).join(','), ...lines].join('\n');
  }
  const statusPre = el('pre', { class: 'status', tabindex: '0' });
  PN.status.append(el('h2', {}, 'The Monday update, written from the plan'),
    el('p', { class: 'sub' }, 'Done, next, at risk and decisions needed, generated from the calculated plan and the document register for the status date. It changes when you tick slips on the Launch plan tab.'),
    el('div', { class: 'side' }, el('div', {}, statusPre),
      el('div', { class: 'stack' }, el('div', { class: 'card' }, el('h3', {}, 'Take it into your tools'),
        el('p', { class: 'note' }, 'The same plan as a CSV with owner, dates, dependencies, stage, milestone and float. Map the columns in ClickUp\'s or Asana\'s CSV import.'),
        el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
          el('button', { class: 'btn', onclick: () => { const b = new Blob([csv(current())], { type: 'text/csv' }); const a = el('a', { href: URL.createObjectURL(b), download: 'launch-plan-import.csv' }); document.body.append(a); a.click(); a.remove(); } }, 'Download CSV'),
          el('button', { class: 'btn ghost', onclick: async e => { try { await navigator.clipboard.writeText(statusPre.textContent); e.target.textContent = 'Copied'; } catch (_) { e.target.textContent = 'Select and copy'; } } }, 'Copy update'))))));
  function drawStatus(alerts) {
    const R = current(), m = Object.fromEntries(R.tasks.map(t => [t.id, t])), si = dayIndex(C.statusDate);
    const done = P.tasks.map(t => m[t.id]).filter(t => !t.gate && t.ef <= si);
    const now = P.tasks.map(t => m[t.id]).filter(t => !t.gate && t.es <= si && t.ef > si);
    const next = P.tasks.map(t => m[t.id]).filter(t => t.es > si && t.es <= si + 10).sort((a, b) => a.es - b.es);
    const risk = [...now, ...next].filter(t => t.float <= 2 && !t.gate);
    const delta = R.end - BASE.end, cs = conflicts(bookings(R)).filter(c => dayIndex(c.end) >= si && dayIndex(c.start) <= si + 30);
    const ticked = P.scenarios.filter(s => on.has(s.id));
    const L = [];
    L.push(`PRODUCT DEVELOPMENT UPDATE · week of ${fmt(C.statusDate)}`);
    L.push(`${P.project} · ${P.brand}`, '');
    L.push(`GO-LIVE: ${fmt(D(R.end))} (${delta === 0 ? 'on baseline' : (delta > 0 ? '+' : '') + delta + ' working days vs baseline ' + short(D(BASE.end))})`);
    if (ticked.length) L.push(`Changes this week: ${ticked.map(s => s.label.toLowerCase()).join('; ')}.`);
    L.push('', `DONE (${done.length})`, ...done.slice(-4).map(t => `  ✓ ${t.name} (${t.owner})`));
    if (done.length > 4) L.push(`  … and ${done.length - 4} earlier step${done.length - 4 > 1 ? 's' : ''}`);
    L.push('', 'IN PROGRESS', ...now.map(t => `  → ${t.name}, ${t.owner}, due ${short(endDate(t))}${t.critical ? ' [critical]' : ` [${t.float}d float]`}`));
    L.push('', 'NEXT 2 WEEKS', ...next.map(t => `  · ${short(D(t.es))} ${t.name} (${t.owner})${t.critical ? ' [critical]' : ''}`));
    L.push('', 'AT RISK');
    if (!risk.length) L.push('  none');
    risk.forEach(t => L.push(`  ! ${t.name}: ${t.critical ? 'no float, any slip moves go-live' : `only ${t.float} days of float`}`));
    alerts.forEach(a => L.push(`  ! ${a[0]}: ${a[2]} ${new Date(a[3]) < new Date(C.statusDate) ? 'expired' : 'expires ' + short(a[3])}; renewal requested?`));
    const B = drawDocs.exposure;
    L.push('', `BUDGET: ${money(B.spent)} spent of ${money(B.total)}` + (B.exposure ? `; ticked risks add ${money(B.exposure)}, leaving ${money(B.contingency - B.exposure)} of ${money(B.contingency)} contingency` : `; ${money(B.contingency)} contingency untouched`));
    L.push('', 'DECISIONS NEEDED');
    cs.slice(0, 3).forEach(c => L.push(`  ? ${C.resources[c.res]}, ${short(c.start)}-${short(c.end)}: ${c.a.project} vs ${c.b.project}. ${suggest(c)}`));
    if (!on.has('decouple')) L.push(`  ? Route label copy on formulation values and confirm with lab before the proof? Cuts a retest's impact from ${deltaOf(retest)} to ${retestAfterFix} days.`);
    statusPre.textContent = L.join('\n');
  }

  function drawAll() { drawPlan(); drawPortfolio(); drawGates(); const a = drawDocs(); drawStatus(a); }
  drawAll();
  select(location.hash.slice(1) || 'plan');
  window.__exportCSV = () => csv(BASE);
  window.__LC = { BASE, bookings, conflicts, suggest, deltaOf, retest, retestAfterFix, D, short, fmt, endDate, statusText: () => statusPre.textContent };
})();
