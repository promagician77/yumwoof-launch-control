import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { cpm, calendar } = require('../site/cpm.js');
const PLAN = require('../site/plan.js');

test('textbook network: end, critical path and float match a hand calculation', () => {
  // A(3) -> B(4) -> D(2); A -> C(2) -> D. Hand: end 9, critical A,B,D, float C = 2
  const r = cpm([{ id: 'A', dur: 3 }, { id: 'B', dur: 4, preds: ['A'] }, { id: 'C', dur: 2, preds: ['A'] }, { id: 'D', dur: 2, preds: ['B', 'C'] }]);
  const m = Object.fromEntries(r.tasks.map(t => [t.id, t]));
  assert.equal(r.end, 9);
  assert.deepEqual(r.tasks.filter(t => t.critical).map(t => t.id).sort(), ['A', 'B', 'D']);
  assert.equal(m.C.float, 2); assert.equal(m.D.es, 7);
});
test('cycles and unknown predecessors are rejected', () => {
  assert.throws(() => cpm([{ id: 'A', dur: 1, preds: ['B'] }, { id: 'B', dur: 1, preds: ['A'] }]), /cycle/);
  assert.throws(() => cpm([{ id: 'A', dur: 1, preds: ['Z'] }]), /unknown/);
});
test('calendar skips weekends and holidays', () => {
  const d = calendar('2026-11-20', ['2026-11-26', '2026-11-27']); // Fri
  assert.equal(d(0), '2026-11-20'); assert.equal(d(1), '2026-11-23'); assert.equal(d(4), '2026-11-30');
});
test('plan: every scenario keeps a valid network; delays never shorten the plan; the fix never lengthens it', () => {
  const base = cpm(PLAN.tasks).end;
  for (const s of PLAN.scenarios) {
    const e = cpm(s.apply(PLAN.tasks)).end;
    if (s.fix) assert.ok(e <= base, s.id); else assert.ok(e >= base, s.id);
  }
});
test('plan: a delay on a task with float shifts the end by max(0, delay - float)', () => {
  const r = cpm(PLAN.tasks), m = Object.fromEntries(r.tasks.map(t => [t.id, t]));
  for (const s of PLAN.scenarios.filter(x => !x.fix)) {
    const changed = s.apply(PLAN.tasks).find((x, i) => x.dur !== PLAN.tasks[i].dur);
    const delay = changed.dur - PLAN.tasks.find(t => t.id === changed.id).dur;
    assert.equal(cpm(s.apply(PLAN.tasks)).end - r.end, Math.max(0, delay - m[changed.id].float), s.id);
  }
});
