# Launch Control (sample)

A working product-development launch system for one fictional US pet food SKU
(Brindle & Co. Air-Dried Salmon & Pumpkin): calculated critical path, what-if slips,
a four-project resource calendar with conflicts, stage gates, artwork routing with an
approval matrix, US label and claims checks, a vendor document register and a weekly
status update generated from the plan.

## What is calculated and what is illustrative

| Calculated (from code, tested) | Illustrative (made up for the sample) |
| --- | --- |
| Critical path, float, go-live date (CPM on a working-day calendar, weekends and US holidays skipped) | Brand, SKU, vendors, people |
| Effect of each slip and of the decoupling fix | Task durations and dependencies |
| Resource conflicts across 4 projects and proposed resolutions (float, then priority) | Other projects' bookings |
| Document expiry alerts vs the status date | Certificates, dates, budget, costs |
| Weekly update text and the ClickUp / Asana CSV | |

The US label notes summarise FDA and AAFCO sources (listed on the label tab). They are not legal advice.

## Run

```
npx serve site          # or open site/index.html
npm test                # 5 tests on the CPM engine
npm run pdf             # rebuilds the 2-page PDF (needs Playwright + Chromium)
```

## Deploy

Vercel: import the folder; `vercel.json` serves `site/` and sends `X-Robots-Tag: noindex`.
Or drag the `site/` folder into Vercel / Netlify as a static site.

## Files

- `site/cpm.js` – critical path engine (forward/back pass, float, cycle detection, working-day calendar)
- `site/plan.js` – the launch plan (26 steps and gates) and what-if scenarios
- `site/content.js` – resources, other projects, gates, routing, RACI, vendors, formula versions, budget
- `site/app.js` – the interface (7 tabs, all recalculated when a slip is ticked)
- `site/launch-plan-import.csv` – the baseline plan for ClickUp or Asana CSV import
- `site/launch-control-sample.pdf` – 2-page summary, rendered from the same calculations
- `print/print.html` – source of the PDF
- `test/cpm.test.mjs` – engine tests
