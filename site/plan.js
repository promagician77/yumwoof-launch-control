// FICTIONAL launch: "Brindle & Co. Air-Dried Salmon & Pumpkin" (a made-up brand). Durations are working days and are
// illustrative assumptions for planning, to be replaced with real vendor quotes.
(function (root) {
  const PLAN = {
    project: 'Air-Dried Salmon & Pumpkin (new SKU)', brand: 'Brindle & Co. (fictional)', start: '2026-11-16',
    holidays: ['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01', '2027-01-18', '2027-02-15'],
    tasks: [
      { id: 'T01', name: 'Brief and target spec', owner: 'Head of PD', lane: 'Formula', dur: 3, preds: [] },
      { id: 'T02', name: 'Formula v1 + AAFCO nutrient profile check', owner: 'Formulator', lane: 'Formula', dur: 5, preds: ['T01'] },
      { id: 'T03', name: 'Ingredient specs, quotes, supplier docs', owner: 'Supply chain', lane: 'Supply', dur: 8, preds: ['T01'] },
      { id: 'T04', name: 'Bench samples, round 1', owner: 'Co-packer', lane: 'Formula', dur: 10, preds: ['T02'] },
      { id: 'T05', name: 'Palatability + internal review', owner: 'Head of PD', lane: 'Formula', dur: 5, preds: ['T04'] },
      { id: 'T06', name: 'Adjust formula, bench samples round 2', owner: 'Co-packer', lane: 'Formula', dur: 8, preds: ['T05'] },
      { id: 'G2', name: 'Gate 2: formula lock', owner: 'Head of PD', lane: 'Gate', dur: 0, preds: ['T06', 'T03'], gate: true },
      { id: 'T07', name: 'Pilot batch', owner: 'Co-packer', lane: 'Formula', dur: 5, preds: ['G2'] },
      { id: 'T08', name: 'Lab: nutrient analysis + pathogen panel', owner: 'Testing lab', lane: 'Formula', dur: 10, preds: ['T07'] },
      { id: 'T09', name: 'Label copy draft (name, nutrition facts, ingredients, feeding, intended use)', owner: 'PD project manager', lane: 'Packaging', dur: 4, preds: ['G2'] },
      { id: 'T10', name: 'Claims + regulatory review', owner: 'Regulatory consultant', lane: 'Packaging', dur: 5, preds: ['T09'] },
      { id: 'T11', name: 'Artwork round 1', owner: 'Creative', lane: 'Packaging', dur: 5, preds: ['T10'] },
      { id: 'T12', name: 'Artwork review round 1 (PD, Marketing, Regulatory)', owner: 'PD project manager', lane: 'Packaging', dur: 3, preds: ['T11'] },
      { id: 'T13', name: 'Artwork round 2 + final copy check against lab results', owner: 'Creative', lane: 'Packaging', dur: 4, preds: ['T12', 'T08'] },
      { id: 'T14', name: 'Printer dieline + proof approval', owner: 'Printer', lane: 'Packaging', dur: 5, preds: ['T13'] },
      { id: 'G3', name: 'Gate 3: packaging release', owner: 'Head of PD', lane: 'Gate', dur: 0, preds: ['T14'], gate: true },
      { id: 'T15', name: 'Film print + ship to co-packer', owner: 'Printer', lane: 'Packaging', dur: 20, preds: ['G3'] },
      { id: 'T16', name: 'Ingredient POs + receipt at co-packer', owner: 'Supply chain', lane: 'Supply', dur: 25, preds: ['G2'] },
      { id: 'T17', name: 'Production run', owner: 'Co-packer', lane: 'Supply', dur: 3, preds: ['T15', 'T16'] },
      { id: 'T18', name: 'QA hold: COA + pathogen release', owner: 'Testing lab', lane: 'Supply', dur: 7, preds: ['T17'] },
      { id: 'T19', name: 'Freight to 3PL + receiving', owner: 'Operations', lane: 'Supply', dur: 6, preds: ['T18'] },
      { id: 'T20', name: 'Photography with production film', owner: 'Creative', lane: 'Launch', dur: 3, preds: ['T15'] },
      { id: 'T21', name: 'Product page copy from approved claims', owner: 'Marketing', lane: 'Launch', dur: 4, preds: ['T10'] },
      { id: 'T22', name: 'Launch email, ads, retailer sheets', owner: 'Marketing', lane: 'Launch', dur: 5, preds: ['T21', 'T20'] },
      { id: 'G4', name: 'Gate 4: launch readiness', owner: 'Head of PD', lane: 'Gate', dur: 0, preds: ['T19', 'T22'], gate: true },
      { id: 'L', name: 'Go live', owner: 'Head of PD', lane: 'Gate', dur: 0, preds: ['G4'], gate: true },
    ],
    // What-if scenarios: each is a pure transformation of the task list
    scenarios: [
      { id: 'art3', label: 'Artwork needs a third round', note: '+4 days on artwork round 2', cost: 1000, apply: t => bump(t, 'T13', 4) },
      { id: 'retest', label: 'Pathogen panel needs a retest', note: '+7 days on the lab', cost: 900, apply: t => bump(t, 'T08', 7) },
      { id: 'film', label: 'Printer quotes 10 more days for film', note: '+10 days on film', cost: 0, apply: t => bump(t, 'T15', 10) },
      { id: 'bench3', label: 'Bench samples need a third round', note: '+8 days before formula lock', cost: 1100, apply: t => bump(t, 'T06', 8) },
      { id: 'decouple', label: 'Fix: route copy on formulation values, confirm with lab before the printer proof', note: 'lab result gates the proof, not the copy', fix: true,
        apply: t => t.map(x => x.id === 'T13' ? { ...x, preds: ['T12'], name: 'Artwork round 2 (formulation values)' } : x.id === 'T14' ? { ...x, preds: ['T13', 'T08'], name: 'Printer dieline + proof approval (lab values confirmed)' } : x) },
    ],
  };
  function bump(tasks, id, d) { return tasks.map(x => x.id === id ? { ...x, dur: x.dur + d } : x); }
  if (typeof module !== 'undefined' && module.exports) module.exports = PLAN; else root.PLAN = PLAN;
})(typeof window !== 'undefined' ? window : globalThis);
