// Supporting content for the fictional launch system. Dates, vendors and costs are illustrative.
window.CONTENT = {
  statusDate: '2027-01-11',
  resources: { copacker: 'Co-packer line A', creative: 'Creative studio', regulatory: 'Regulatory consultant', printer: 'Printer proofing' },
  p1Bookings: { T04: 'copacker', T06: 'copacker', T07: 'copacker', T17: 'copacker', T11: 'creative', T13: 'creative', T20: 'creative', T10: 'regulatory', T14: 'printer' },
  projects: [
    { id: 'P1', name: 'New SKU: Air-Dried Salmon & Pumpkin', priority: 1, fromPlan: true },
    { id: 'P2', name: 'Reformulation: Turkey recipe, new coconut oil supplier', priority: 2, bookings: [
      { res: 'copacker', what: 'Bench samples', start: '2027-01-11', end: '2027-01-15' },
      { res: 'regulatory', what: 'Ingredient panel re-review', start: '2027-01-14', end: '2027-01-20' },
      { res: 'copacker', what: 'Production run', start: '2027-02-22', end: '2027-02-24' }] },
    { id: 'P3', name: 'Packaging refresh to the new AAFCO label format (6 SKUs)', priority: 3, bookings: [
      { res: 'regulatory', what: 'Pet Nutrition Facts conversion review', start: '2027-01-25', end: '2027-02-05' },
      { res: 'creative', what: 'Artwork, 6 SKUs', start: '2027-01-25', end: '2027-02-12' },
      { res: 'printer', what: 'Proofs, 6 SKUs', start: '2027-02-15', end: '2027-02-26' }] },
    { id: 'P4', name: 'Line extension: 4 oz topper pouch', priority: 2, bookings: [
      { res: 'creative', what: 'Pouch artwork', start: '2027-02-15', end: '2027-02-26' },
      { res: 'printer', what: 'Pouch proof', start: '2027-03-01', end: '2027-03-05' },
      { res: 'copacker', what: 'Pouch line trial', start: '2027-03-15', end: '2027-03-16' }] },
  ],
  gates: [
    { id: 'G0', name: 'Concept approved', owner: 'Head of PD', items: ['Target dog, format, price point and margin target written down', 'Claims the product will make, drafted for early regulatory read', 'Launch window and must-hit retail or marketing dates'] },
    { id: 'G1', name: 'Feasible', owner: 'Head of PD', items: ['Co-packer confirms capability, minimum run and slot lead time', 'Key ingredients quoted with lead times and supplier documents requested', 'Regulatory path agreed: nutritional adequacy route (nutrient profile or feeding trial), states to register in', 'Budget approved for samples, testing, artwork and plates'] },
    { id: 'G2', name: 'Formula locked', owner: 'Head of PD', items: ['Formula version frozen and stored with change log', 'Bench samples signed off on palatability and texture', 'Nutrient profile check against the AAFCO dog profile for the target life stage', 'Supplier specs, allergen and food-safety documents on file for every ingredient'] },
    { id: 'G3', name: 'Packaging released', owner: 'Head of PD', items: ['Label copy matches the locked formula version (ingredients, nutrition values, calories)', 'Claims reviewed and signed by regulatory', 'Net quantity, UPC and manufacturer or distributor statement checked', 'Printer proof approved against the dieline; barcode scanned', 'All approvals in the approval matrix recorded with date and file version'] },
    { id: 'G4', name: 'Launch ready', owner: 'Head of PD', items: ['Production lot released: COA and pathogen results on file', 'Inventory received at 3PL and sellable', 'Product page, imagery and ads use only approved claims', 'Customer service briefed: ingredients, feeding, transition guidance', 'State registrations filed where required'] },
  ],
  routing: [
    { step: 'Copy deck', who: 'PD project manager', out: 'Copy built from the locked formula version: name, nutrition facts, ingredients, feeding, intended use, net quantity' },
    { step: 'Claims + regulatory review', who: 'Regulatory consultant', out: 'Marked-up copy deck; every claim approved, edited or removed' },
    { step: 'Artwork round 1', who: 'Creative', out: 'Layout on the printer\'s dieline' },
    { step: 'Cross-functional review', who: 'PD, Marketing, Operations', out: 'One consolidated comment list, not five email threads' },
    { step: 'Artwork round 2 + lab check', who: 'Creative + PM', out: 'Nutrition values confirmed against lab results' },
    { step: 'Printer proof', who: 'Printer', out: 'Dieline, colour and barcode checked on the real substrate' },
    { step: 'Final sign-off', who: 'Approval matrix', out: 'Dated approvals against one file version' },
    { step: 'Release + archive', who: 'PD project manager', out: 'Released file and approvals stored with the formula version they belong to' },
  ],
  retriggers: ['Formula version changes: ingredients, nutrition values and calories re-route from step 1', 'Any claim is added or edited: re-route from step 2', 'Net weight or bag size changes: dieline, net quantity and barcode re-route from step 3', 'Co-packer or distributor changes: manufacturer or distributor statement re-routes from step 1', 'Intended use or life stage changes: nutritional adequacy statement re-routes from step 1'],
  matrixRoles: ['PM', 'Head of PD', 'Regulatory', 'Marketing', 'Operations', 'Creative'],
  matrix: [
    ['Claims and benefit copy', 'R', 'A', 'A', 'C', '', 'I'],
    ['Nutrition facts / guaranteed analysis, calories', 'R', 'A', 'C', '', '', 'I'],
    ['Ingredient statement', 'R', 'A', 'C', '', '', 'I'],
    ['Nutritional adequacy + intended use', 'R', 'A', 'A', '', '', 'I'],
    ['Net quantity, UPC, dieline', 'R', 'I', '', '', 'A', 'C'],
    ['Manufacturer or distributor statement', 'R', 'I', 'C', '', 'A', 'I'],
    ['Feeding directions', 'R', 'A', 'C', 'C', '', 'I'],
    ['Imagery, brand, layout', 'C', 'C', '', 'A', '', 'R'],
  ],
  vendors: [
    { name: 'Co-packer (air-dried, Midwest)', type: 'Co-packer', docs: [['Food safety certificate (GFSI scheme)', '2027-02-28'], ['Animal food safety plan summary', '2027-09-30'], ['Liability insurance certificate', '2027-06-30']] },
    { name: 'Wild salmon supplier', type: 'Ingredient', docs: [['Specification sheet', null], ['Food safety certificate', '2027-01-31'], ['Country of origin statement', null]] },
    { name: 'Pumpkin powder supplier', type: 'Ingredient', docs: [['Specification sheet', null], ['Organic certificate', '2027-04-15']] },
    { name: 'Testing lab', type: 'Lab', docs: [['ISO/IEC 17025 accreditation', '2028-03-31']] },
    { name: 'Flexible packaging printer', type: 'Packaging', docs: [['Food-contact compliance letter for film', '2027-12-31']] },
  ],
  formula: [
    ['v1.0', '2026-11-25', 'First draft for bench round 1'],
    ['v1.1', '2026-12-18', 'Salmon up 4 points, pumpkin down; palatability feedback'],
    ['v2.0', '2027-01-06', 'Locked at Gate 2. Label copy is built from this version only'],
  ],
  samples: [
    ['S-01', 'Bench round 1', '2026-11-30', '2026-12-11', 'Texture too dry; salmon aroma weak'],
    ['S-02', 'Bench round 2', '2026-12-21', '2027-01-05', 'Approved at Gate 2'],
    ['S-03', 'Pilot batch', '2027-01-06', null, 'In progress'],
  ],
  budget: { total: 18000, lines: [['Bench samples, 2 rounds', 2200, 2200], ['Pilot batch', 3500, 0], ['Lab: nutrient analysis + pathogen panel', 1800, 0], ['Regulatory review', 900, 0], ['Artwork', 4000, 0], ['Printing plates', 1600, 0], ['Photography', 1500, 0], ['Contingency', 2500, 0]] },
};
