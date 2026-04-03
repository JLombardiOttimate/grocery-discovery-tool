# CLAUDE.md — grocery-discovery-tool

## What This Is

A single-page React app built for Ottimate's sales team. It's a guided discovery and ROI calculator that AEs run with grocery prospects during or after a discovery call. The tool has two modes: a phase-by-phase discovery conversation, and a shareable Impact Summary the champion takes to the economic buyer.

Deployed at: `https://jlombardiottimate.github.io/grocery-discovery-tool/`

---

## Stack

- **React 19** with JSX (Vite scaffold)
- **Tailwind CSS v3** (not v4 — the init command and config structure are v3)
- **Vite 8** as build tool
- **GitHub Actions** → `gh-pages` branch for deployment
- **Node 20** required (Vite incompatible with Node 18)

All application code lives in a single file: `src/GroceryDiscoveryWorkshop.jsx`

`src/App.jsx` is a thin wrapper:
```jsx
import GroceryDiscoveryWorkshop from './GroceryDiscoveryWorkshop'
export default function App() {
  return <GroceryDiscoveryWorkshop />
}
```

---

## Architecture of GroceryDiscoveryWorkshop.jsx

### Helpers (top of file)
```js
const n = (v) => ...   // safe number coercion — always use this, never Number() directly
const fmt = (v) => ... // abbreviated format: $1.2M, $340K
const fmtFull = (v) => // full format: $1,234,567
const fmtSlider = (v) => // same as fmt, used for slider labels
```
Always use `n()` when reading numeric state values into calculations. State can be empty string, undefined, or null — `n()` safely handles all of these and returns 0 for any non-numeric input.

### State
All form state lives flat in the top-level component — no context, no reducers. Grouped by phase with comments:
- Phase 1 (operation): `invoiceVol`, `invoiceSplitting`, `digitalPct`, `lineItems`, `invoiceTimeline`, `vendorCount`, `vendorTurnover`, `storeCount`
- Phase 2 (data): `vendorClean`, `itemCatalog`, `coaStructure`, `pricingMaint`
- Phase 3 (systems): `erp`, `erpManaged`, `scanning`, `techSkills`
- Phase 4 (team): `implOwner`, `timeline`, `successMetrics`
- Phase 5 (costs): `apHeadcount`, `apRate`, `manualMin`, `codingPractice`, `storeOpsHrs`, `gmRate`, `closeOT`, `reconHrs`, `growthStores`, `vendorSpend`, `dsdSpend`, `netMargin`, `ottimateAnnual`
- UI state: `phase`, `showImpact`, `showSignals`, `showSummary`, `expandedCalcs`, `prospectName`

`vendorSpend` defaults to `5000000` and `dsdSpend` to `1000000` — these are sliders, not empty fields.

### Qualification Score (`qualScore`)
A `useMemo` that scores 9 signals across invoice volume, digital %, line items, vendor count, vendor cleanliness, item catalog, ERP type, tech skills, and implementation owner. Max ~27 points. Drives `qualLevel` (green/yellow/red) and `qualLabel`.

**Important:** The qualification card on the Impact phase is gated behind `showSignals`. When signals are off (default), the prospect never sees a fit assessment.

### Solution Path (`autoPath`)
Auto-selected (1–4) based on `lineItems`, `dsdSpend`, and `pricingMaint`. Drives which ROI formulas are active:
- 1: Core AP only
- 2: Core AP + Item Validation
- 3: Core AP + DSD Receiver Match
- 4: Core AP + DSD Receiver + Item Validation

### ROI Formulas
All calculated in the component body (not in useMemo — they're derived from state that's already memoized where needed):

| Variable | Label | Active On |
|---|---|---|
| `f1` | Pricing Variance Recovery | Paths 2, 3, 4 |
| `f2` / `f2y1` / `f2y2` | Invoice Processing Labor (Y1 and Y2+) | All paths |
| `f3` | Store Operations Recovery | All paths |
| `f4` | Vendor Credit Recovery | Paths 2, 4 |
| `f5` | Month-End Close Efficiency | All paths |
| `f6` | Growth Scalability | All paths (when `growthStores > 0`) |
| `tmdv` | Total Margin Defense Value | Sum of all active formulas |
| `netAnnual` | Net Annual Value | `tmdv - ottimateAnnual` |
| `multiplier` | Revenue Equivalent | `netAnnual / netMargin` |
| `payback` | Payback period in months | `ottimateAnnual / (tmdv / 12)` |

`f2y1` (Year 1) includes a one-time SKU mapping cost when `codingPractice !== 'line-item'`. `f2y2` is steady-state. The Year 1 vs. Year 2 card only renders when `f2y1 !== f2y2`.

### Phases (renderPhase)
A switch on `PHASES[phase].id`. Phase IDs: `welcome`, `operation`, `data`, `systems`, `team`, `costs`, `impact`.

The `impact` phase has a two-button toggle (`showSummary`) between:
- **Discovery View** — the AE's working view with live financial impact and optional qualification card
- **Impact Summary** — the EB-ready shareable output (`renderImpactSummary()`)

### renderImpactSummary()
Four-section leave-behind built from live state:
1. **What you told us** — prose built from answered fields; unanswered fields are omitted
2. **What your numbers reveal** — one card per active formula with expandable calculation detail (`expandedCalcs` state, keyed by category label)
3. **What this means for your margins** — three headline stats + two-bar visual; requires `netMargin > 0` and `vendorSpend > 0`
4. **How you compare** — benchmark comparisons with Xelix 2026 citation

The summary wrapper must have `id="impact-summary-printable"` — the print CSS targets this ID.

### Print / PDF Export
`handlePrint()` injects a `<style id="print-override">` tag that hides everything except `#impact-summary-printable`, triggers `window.print()`, then removes the tag after 1 second. No libraries.

Elements that should not print: add `className="no-print"`. The print button itself carries this class.

---

## Key Components

### `SliderField`
For large dollar inputs. Renders a styled range input with a live formatted value label and optional min/max markers.
```jsx
<SliderField
  label="Total annual vendor spend"
  value={vendorSpend}
  onChange={setVendorSpend}
  min={500000}
  max={200000000}
  step={1000000}
  markers={['$500K', '$50M', '$100M', '$150M', '$200M']}
  note="All vendors flowing through AP"
/>
```

### `NumField`
For numeric inputs with optional prefix/suffix. Accepts empty string (shows blank, calculates as 0).

### `SelectField`
Standard dropdown. Always includes a blank `— Select —` option. Unselected values are empty string `''`.

### `FramingText`
Expandable "How to think about this" block. Text lives in the `FRAMING` constant at the top of the file. Always placed before the related input, not after.

### `Tooltip`
Hover tooltip on the `ⓘ` icon in the financial impact rows. Text lives in `IMPACT_TOOLTIPS`. Positioned above-right. Uses `useState` for visibility, not CSS-only, to avoid clipping issues.

### `Signal`
Inline badge (Strong Fit / Needs Attention / Significant Complexity). Only renders when `showSignals` is true. Never appears in the Impact Summary.

---

## Content Rules

**FRAMING text** — written in the voice of an experienced AE explaining why a question matters. Prospect-facing. No formula references. No internal scoring language.

**IMPACT_TOOLTIPS** — written for a controller or CFO skimming the Impact Summary. One paragraph per category. Explains what's in the number and how it was calculated.

**calcDetails in renderImpactSummary** — the expandable "See the calculation" content. Plain-text formulas using actual variable values interpolated via template literals.

**Benchmark citations** — always cite source and dataset size. Current benchmark: Xelix 2026 AP Risk Report (481M invoices, 800+ organizations) for the 1.2% pricing variance rate.

---

## Audience Modes

Three modes controlled by `?mode=` query param:
- **No param / `?mode=customer`** — Customer-facing. No signals, no qualification/complexity ratings, no onboarding assessment. All phases and ROI visible.
- **`?mode=internal`** — Full AE view. Signals toggle, qualification scoring, onboarding assessment card, all internal tools.
- **`?mode=sdr`** — SDR outreach version. Only Welcome → Operation → Impact phases. Costs phase is skipped; industry-average defaults are used for ROI calculations.

The default is customer mode so that prospects cannot discover the internal AE view by guessing URLs.

## Signals Logic

Signals only appear in `?mode=internal`. The toggle is in the header. When on:
- Inline `<Signal>` badges appear below select fields in the discovery phases
- A qualification score bar appears between the phase nav and phase content (phases 2–5 only)
- The qualification assessment card appears at the top of the Discovery View on the Impact phase
- Nothing changes in the Impact Summary — signals never appear there

Invoice timeline signal is intentionally inverted: `long (7-10 days) = green` because that's the opportunity. `same-day = red` because the problem is already solved.

---

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds with Node 20 and deploys to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

`vite.config.js` base must match the repo name exactly:
```js
base: '/grocery-discovery-tool/',
```

After the action runs, GitHub Pages must be pointed at the `gh-pages` branch (Settings → Pages → Source). This is a one-time manual step.

---

## What Not to Touch

- Do not upgrade Tailwind to v4. The `tailwind.config.js` and `@tailwind` directives in `index.css` are v3 syntax.
- Do not split the component into multiple files. The single-file constraint is intentional — it simplifies deployment and makes the tool portable.
- Do not add a router. Phase navigation is internal state (`phase` index), not URL-based.
- Do not add a state management library. Flat useState is intentional for simplicity.
- Do not remove the `n()` helper or inline `Number()` calls. Empty string state breaks calculations without it.