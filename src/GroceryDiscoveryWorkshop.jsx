import { useState, useMemo, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ═══ Safe number helper ═══
const n = (v) => (v === '' || v === undefined || v === null || isNaN(v)) ? 0 : Number(v);
const fmt = (v) => { const a = Math.abs(n(v)); const s = a >= 1e6 ? `$${(a/1e6).toFixed(1)}M` : a >= 1e3 ? `$${(a/1e3).toFixed(0)}K` : `$${a.toFixed(0)}`; return n(v) < 0 ? `(${s})` : s; };
const fmtFull = (v) => { const a = Math.abs(n(v)); return `${n(v)<0?'(':''}$${a.toLocaleString('en-US',{maximumFractionDigits:0})}${n(v)<0?')':''}`; };
const fmtSlider = (v) => { const a = Math.abs(n(v)); return a >= 1e6 ? `$${(a/1e6).toFixed(1)}M` : a >= 1e3 ? `$${(a/1e3).toFixed(0)}K` : `$${a.toFixed(0)}`; };

// ═══ Phase / Question definitions ═══
const PHASES = [
  { id: 'welcome',   label: 'Welcome',       icon: '👋' },
  { id: 'operation', label: 'Your Operation', icon: '🏪' },
  { id: 'data',      label: 'Your Data',      icon: '📊' },
  { id: 'systems',   label: 'Your Systems',   icon: '⚙️'  },
  { id: 'team',      label: 'Your Team',      icon: '👥' },
  { id: 'costs',     label: 'Your Costs',     icon: '💰' },
  { id: 'impact',    label: 'Your Impact',    icon: '🎯' },
];

// ═══ Framing text (prospect-facing) ═══
const FRAMING = {
  invoiceVol: "Think about every piece of paper or PDF that hits your AP desk in a month — broadline orders from UNFI or KeHE, every DSD delivery slip from Pepsi, Coke, your local bakery, specialty and one-off vendors. Some vendors split a single delivery into multiple invoices by department, which can inflate the count 20-30% beyond what you'd expect. Getting this number right is important because it drives every labor calculation.",
  digitalPct: "Digital PDFs that arrive by email or vendor portal extract at 92-95% accuracy. Scanned paper, thermal receipts, and faxes drop to 80-88%. This ratio directly affects how quickly automation reaches steady-state performance and how much manual review your team will face during ramp-up.",
  lineItems: "A 5-line restaurant invoice and a 200-line UNFI order are fundamentally different problems. Higher line counts mean more complexity for extraction, more opportunity for pricing errors, and more value from item-level validation. Most independent grocers see 20-80 items per invoice depending on the vendor.",
  invoiceTimeline: "This question reveals something important about where the opportunity is. If invoices are sitting at the store for 5-10 days before they reach accounting, there's a real opportunity to compress that timeline — getting invoices into the system digitally as they arrive rather than waiting for paper to travel. If your team is already entering invoices same-day, that's impressive, but it also means the timeline compression benefit is smaller and we'd focus the conversation on accuracy, coding automation, and spend visibility instead.",
  vendorCount: "Each vendor requires setup — mapping their invoice format, matching their items to your catalog, configuring their payment terms. A stable base of 40-60 vendors is manageable. High vendor turnover means ongoing maintenance. Knowing your vendor landscape helps us scope implementation accurately.",
  vendorTurnover: "Vendor stability matters as much as vendor count. A grocery operation with 60 vendors that rarely change is straightforward to maintain. An operation that adds 5-10 new vendors every quarter means ongoing setup work — new invoice formats to learn, new items to map, new payment terms to configure. In produce and specialty, constant rotation is normal, but it changes the maintenance picture.",
  vendorClean: "Your vendor master is the foundation everything else builds on. If Sysco appears as 'Sysco,' 'SYSCO,' 'Sysco SD,' and 'Sysco - John' in your system, matching failures and duplicate payments follow. The cleanliness of this data is the single strongest predictor of smooth onboarding — more than any other factor.",
  itemCatalog: "Item matching — comparing what's on the invoice to what's in your catalog — is the core of grocery invoice automation. Clean UPCs and consistent item descriptions make matching accurate. Without them, the system relies on fuzzy description matching, which works but requires more manual review initially.",
  chartOfAccounts: "If every store runs the same chart of accounts, setup is straightforward — configure once, deploy everywhere. If each store has its own books and its own GL structure, every new location requires complete re-mapping. This directly impacts how the system scales as you grow.",
  pricingData: "Cost-file validation — flagging when a vendor charges you more than the contracted price — only works if your pricing data is reasonably current. If your POS pricing hasn't been updated in months, the system will flag everything as a variance, creating noise instead of signal.",
  erp: "This question has two parts, and the second is critical. Some ERPs integrate directly with a simple API connection. Others require third-party consultants, custom file transmissions, or middleware that adds months to the timeline. Knowing who manages your system tells us whether we're coordinating with your team or with a three-party dependency.",
  scanning: "Scanned invoice quality directly impacts what the system can read. A commercial scanner producing clear, high-resolution PDFs is the ideal input. Phone photos, low-res scans, and faxed documents all reduce extraction accuracy. If most of your invoices are already digital, this isn't a concern.",
  techSkills: "The system is browser-based and designed to be straightforward, but onboarding involves connecting accounts, uploading vendor data, and troubleshooting the occasional exception. Having someone on your team who's comfortable with basic software administration makes the first 30 days significantly smoother.",
  implOwner: "Every grocery operator where we deliver value quickly has one thing in common: a named person who owns the implementation and can dedicate real time to it. They don't need to be technical — they need to be available and empowered to make decisions about vendor setup, GL coding, and approval workflows.",
  timeline: "The honest truth: your team's capacity determines the timeline more than our technology does. If you're in the middle of a seasonal rush, a system migration, or a staffing transition, building that into the plan upfront prevents the perception that the system is slow when the reality is competing priorities.",
  successMetrics: "The operators who get the most value from automation are the ones who define 'success' in specific, measurable terms before they start. Not 'make it easier' but 'reduce processing time by 50%' or 'catch pricing discrepancies automatically.' If we can agree on the target now, we'll both know when the system is delivering.",
  deptHeads: "This is one that surprises a lot of operators. Your meat manager, produce manager, deli lead — they're often spending hours every week checking vendor invoices against what was actually delivered and what the price should have been. On top of that, they're organizing paperwork, matching credits, and sometimes reconciling statements for their department. Finance may not see this labor because it happens at the store level, but it's real time from your highest-paid floor staff."
};

// ═══ Impact tooltip definitions ═══
const IMPACT_TOOLTIPS = {
  'Pricing Variance Recovery': "Vendors overcharge more than you'd expect — industry data across 481M invoices (Xelix 2026) puts the benchmark at 1.2% of vendor spend. We apply a conservative 0.5% rate and adjust for your invoice mix. This is the value of pricing errors caught before payment rather than chased down after.",
  'Invoice Processing Labor': "Your current cost per invoice (minutes × hourly rate) minus the automated cost (roughly 2 min for exceptions only) minus the labor for handling the exceptions that automation flags. Year 1 includes a one-time investment to map your SKU base to GL codes.",
  'Store Operations Recovery': "The hours your GMs, receivers, and department heads spend physically handling paper invoices, verifying costs, organizing delivery slips, and reconciling receipts — multiplied across every location, every week. Department heads like your meat, produce, and deli managers often spend significant time checking that what was invoiced matches what was delivered and priced correctly. This time is conservatively reduced by 50% when invoices are captured and validated digitally.",
  'Vendor Credit Recovery': "Credits, debit memos, and short-pays that go untracked because AP doesn't have time to follow up systematically. With automated tracking, these get surfaced and claimed. Estimate: 0.7% of vendor spend at a 50% recovery rate.",
  'Month-End Close Efficiency': "The overtime and reconciliation hours that pile up every close cycle because AP is catching up rather than staying current. Automation keeps the books cleaner in real time, so close is a verification step instead of a catch-up sprint. Estimated at 70% reduction in overtime hours and 65% reduction in reconciliation time.",
  'Growth Scalability': "Adding a store without AP automation usually means adding AP headcount. With a mature system, your team absorbs new volume with minimal incremental labor. This estimates 25% of a $52K fully-loaded AP position in cost avoidance per new store planned."
};

// ═══ Signal badges ═══
function Signal({ level }) {
  const colors = { green: 'bg-emerald-100 text-emerald-700 border-emerald-200', yellow: 'bg-amber-100 text-amber-700 border-amber-200', red: 'bg-red-100 text-red-700 border-red-200' };
  const labels = { green: 'Strong Fit', yellow: 'Needs Attention', red: 'Significant Complexity' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[level]}`}>{labels[level]}</span>;
}

// ═══ Expandable framing text ═══
function FramingText({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
        <span className="text-[10px]">{open ? '▲' : '▼'}</span> How to think about this
      </button>
      {open && <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-lg p-3">{text}</p>}
    </div>
  );
}

// ═══ Tooltip ═══
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  return (
    <span className="relative inline-flex items-center" ref={ref}
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute bottom-full right-0 mb-2 z-50 w-64 text-[11px] leading-relaxed bg-slate-800 text-slate-200 rounded-lg px-3 py-2.5 shadow-xl border border-slate-700 pointer-events-none">
          {text}
          <span className="absolute top-full right-4 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

// ═══ Input Components ═══
function NumField({ label, value, onChange, min, max, step=1, prefix='', suffix='', note='' }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} min={min} max={max} step={step}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-shadow" />
        {suffix && <span className="text-sm text-slate-400 whitespace-nowrap">{suffix}</span>}
      </div>
      {note && <p className="text-[11px] text-slate-400 mt-1">{note}</p>}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, prefix='$', note='', markers=[] }) {
  const pct = max > min ? ((n(value) - min) / (max - min)) * 100 : 0;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-slate-800 tabular-nums">{fmtSlider(n(value))}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step} value={n(value) || min}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`
          }}
        />
        {markers.length > 0 && (
          <div className="flex justify-between mt-1">
            {markers.map((m, i) => (
              <span key={i} className="text-[10px] text-slate-400">{m}</span>
            ))}
          </div>
        )}
      </div>
      {note && <p className="text-[11px] text-slate-400 mt-1.5">{note}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, note='' }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400">
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {note && <p className="text-[11px] text-slate-400 mt-1">{note}</p>}
    </div>
  );
}

// ═══ Main Component ═══
export default function GroceryDiscoveryWorkshop() {
  // ─── Mode: 'customer' (default), 'sdr', or 'internal' (full AE view) ───
  const [mode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'customer';
  });
  const isInternal = mode === 'internal';
  const isSDR = mode === 'sdr';
  const activePhases = isSDR
    ? PHASES.filter(p => ['welcome', 'operation', 'impact'].includes(p.id))
    : PHASES;

  const [phase, setPhase] = useState(0);
  const [showImpact, setShowImpact] = useState(false);
  const [showSignals, setShowSignals] = useState(false); // only toggleable in internal mode
  const [showSummary, setShowSummary] = useState(false);
  const [expandedCalcs, setExpandedCalcs] = useState({});
  const [prospectName, setProspectName] = useState('');

  // ─── Phase 1: Operation ───
  const [invoiceVol, setInvoiceVol] = useState(2000);
  const [invoiceSplitting, setInvoiceSplitting] = useState('');
  const [digitalPct, setDigitalPct] = useState('');
  const [lineItems, setLineItems] = useState('');
  const [invoiceTimeline, setInvoiceTimeline] = useState('');
  const [vendorCount, setVendorCount] = useState('');
  const [vendorTurnover, setVendorTurnover] = useState('');
  const [storeCount, setStoreCount] = useState('');

  // ─── Phase 2: Data ───
  const [vendorClean, setVendorClean] = useState('');
  const [itemCatalog, setItemCatalog] = useState('');
  const [coaStructure, setCoaStructure] = useState('');
  const [pricingMaint, setPricingMaint] = useState('');

  // ─── Phase 3: Systems ───
  const [erp, setErp] = useState('');
  const [erpManaged, setErpManaged] = useState('');
  const [scanning, setScanning] = useState('');
  const [techSkills, setTechSkills] = useState('');

  // ─── Phase 4: Team (demographics / headcounts) ───
  const [apHeadcount, setApHeadcount] = useState('');
  const [deptHeadCount, setDeptHeadCount] = useState('');
  const [implOwner, setImplOwner] = useState('');
  const [timeline, setTimeline] = useState('');
  const [successMetrics, setSuccessMetrics] = useState('');

  // ─── Phase 5: Costs (rates, hours, ROI inputs) ───
  const [apRate, setApRate] = useState('');
  const [manualMin, setManualMin] = useState('');
  const [codingPractice, setCodingPractice] = useState('summary');
  const [storeOpsHrs, setStoreOpsHrs] = useState('');
  const [gmRate, setGmRate] = useState('');
  const [deptHeadCostHrs, setDeptHeadCostHrs] = useState('');
  const [deptHeadAdminHrs, setDeptHeadAdminHrs] = useState('');
  const [deptHeadRate, setDeptHeadRate] = useState('');
  const [closeOT, setCloseOT] = useState('');
  const [reconHrs, setReconHrs] = useState('');
  const [growthStores, setGrowthStores] = useState('');
  const [vendorSpend, setVendorSpend] = useState(5000000);
  const [dsdSpend, setDsdSpend] = useState(1000000);
  const [netMargin, setNetMargin] = useState(0.02);
  const [ottimateAnnual, setOttimateAnnual] = useState('');

  // ─── Session persistence ───
  const [sessionToken, setSessionToken] = useState(null);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'loading' | 'error'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('session');
    if (!token) return;
    if (!supabase) return;
    setSaveState('loading');
    supabase
      .from('grocery_discovery_sessions')
      .select('full_state, share_token')
      .eq('share_token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setSaveState('error'); setTimeout(() => setSaveState('idle'), 3000); return; }
        const s = data.full_state;
        setProspectName(s.prospectName ?? '');
        if (s.phase !== undefined) setPhase(s.phase);
        if (s.showImpact !== undefined) setShowImpact(s.showImpact);
        if (s.showSummary !== undefined) setShowSummary(s.showSummary);
        if (s.expandedCalcs !== undefined) setExpandedCalcs(s.expandedCalcs);
        setInvoiceVol(s.invoiceVol ?? '');
        setInvoiceSplitting(s.invoiceSplitting ?? '');
        setDigitalPct(s.digitalPct ?? '');
        setLineItems(s.lineItems ?? '');
        setInvoiceTimeline(s.invoiceTimeline ?? '');
        setVendorCount(s.vendorCount ?? '');
        setVendorTurnover(s.vendorTurnover ?? '');
        setStoreCount(s.storeCount ?? '');
        setVendorClean(s.vendorClean ?? '');
        setItemCatalog(s.itemCatalog ?? '');
        setCoaStructure(s.coaStructure ?? '');
        setPricingMaint(s.pricingMaint ?? '');
        setErp(s.erp ?? '');
        setErpManaged(s.erpManaged ?? '');
        setScanning(s.scanning ?? '');
        setTechSkills(s.techSkills ?? '');
        setApHeadcount(s.apHeadcount ?? '');
        setDeptHeadCount(s.deptHeadCount ?? '');
        setImplOwner(s.implOwner ?? '');
        setTimeline(s.timeline ?? '');
        setSuccessMetrics(s.successMetrics ?? '');
        setApRate(s.apRate ?? '');
        setManualMin(s.manualMin ?? '');
        setCodingPractice(s.codingPractice ?? 'summary');
        setStoreOpsHrs(s.storeOpsHrs ?? '');
        setGmRate(s.gmRate ?? '');
        setDeptHeadCostHrs(s.deptHeadCostHrs ?? '');
        setDeptHeadAdminHrs(s.deptHeadAdminHrs ?? '');
        setDeptHeadRate(s.deptHeadRate ?? '');
        setCloseOT(s.closeOT ?? '');
        setReconHrs(s.reconHrs ?? '');
        setGrowthStores(s.growthStores ?? '');
        if (s.vendorSpend !== undefined) setVendorSpend(s.vendorSpend);
        if (s.dsdSpend !== undefined) setDsdSpend(s.dsdSpend);
        if (s.netMargin !== undefined) setNetMargin(s.netMargin);
        setOttimateAnnual(s.ottimateAnnual ?? '');
        setSessionToken(data.share_token);
        setSaveState('idle');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ SDR defaults — when SDR mode skips the Costs phase, use industry averages ═══
  const effApRate = isSDR && !apRate ? 25 : n(apRate);
  const effManualMin = isSDR && !manualMin ? 12 : n(manualMin);
  const effGmRate = isSDR && !gmRate ? 30 : n(gmRate);
  const effStoreOpsHrs = isSDR && !storeOpsHrs ? 3 : n(storeOpsHrs);
  const effDeptHeadRate = isSDR && !deptHeadRate ? 28 : n(deptHeadRate);
  const effCloseOT = isSDR && !closeOT ? 8 : n(closeOT);
  const effReconHrs = isSDR && !reconHrs ? 12 : n(reconHrs);

  // ═══ Qualification Score ═══
  const qualScore = useMemo(() => {
    let score = 0;
    if (invoiceVol) { const v = n(invoiceVol); score += v < 500 ? 3 : v < 1000 ? 2 : v < 2500 ? 0 : -3; }
    if (digitalPct === 'high') score += 3; else if (digitalPct === 'med') score += 1; else if (digitalPct === 'low') score -= 2;
    if (lineItems === 'low') score += 2; else if (lineItems === 'med') score += 1; else if (lineItems === 'high') score += 0; else if (lineItems === 'vhigh') score -= 2;
    if (vendorCount) { const v = n(vendorCount); score += v < 50 ? 2 : v < 100 ? 1 : v < 150 ? 0 : -2; }
    if (vendorClean === 'clean') score += 3; else if (vendorClean === 'some') score += 1; else if (vendorClean === 'messy') score -= 2;
    if (itemCatalog === 'clean') score += 3; else if (itemCatalog === 'partial') score += 1; else if (itemCatalog === 'messy') score -= 3;
    if (erp === 'qbo') score += 3; else if (erp === 'qbd' || erp === 'sage' || erp === 'fms') score += 1; else if (erp === 'complex') score -= 3;
    if (techSkills === 'strong') score += 2; else if (techSkills === 'willing') score += 1; else if (techSkills === 'limited') score -= 2;
    if (implOwner === 'named') score += 3; else if (implOwner === 'busy') score += 1; else if (implOwner === 'none') score -= 3;
    return score;
  }, [invoiceVol, digitalPct, lineItems, vendorCount, vendorClean, itemCatalog, erp, techSkills, implOwner]);

  const qualLevel = qualScore >= 20 ? 'green' : qualScore >= 12 ? 'yellow' : 'red';
  const qualLabel = qualScore >= 20 ? 'Standard Onboarding' : qualScore >= 12 ? 'Enhanced Onboarding' : 'Complex Engagement';
  const qualDesc = qualScore >= 20
    ? 'Profile matches our most successful implementations. Expect 30-45 days to steady-state with 90-95% extraction accuracy.'
    : qualScore >= 12
    ? 'Good fit with some scoping work needed. Plan for 60-90 days with additional data cleanup and configuration time built in.'
    : 'Several factors will extend the timeline. We should scope services, extended onboarding, and a realistic 4-6 month ramp before we talk go-live.';

  // ═══ Auto Solution Path ═══
  const hasDSD = lineItems === 'high' || lineItems === 'vhigh' || (n(dsdSpend) > 0);
  const hasIV  = lineItems !== 'low' || pricingMaint === 'active' || pricingMaint === 'moderate';
  const autoPath = hasDSD && hasIV ? 4 : hasDSD ? 3 : hasIV ? 2 : 1;
  const pathNames = { 1: 'Core AP', 2: 'Core AP + Item Validation', 3: 'Core AP + DSD Receiver Match', 4: 'Core AP + DSD Receiver + Item Validation' };

  // ═══ ROI Calculations ═══
  const actualAnnualVol = n(invoiceVol) * 12;

  const accAdj = digitalPct === 'high' ? 0.92 : digitalPct === 'med' ? 0.85 : 0.75;
  const f1IV  = (autoPath === 2 || autoPath === 4) ? n(vendorSpend) * 0.005 * accAdj : 0;
  const f1DSD = (autoPath === 3 || autoPath === 4) ? n(dsdSpend) * 0.04 * 0.85 : 0;
  const f1IVAdj = autoPath === 4 ? Math.max(0, n(vendorSpend) - n(dsdSpend)) * 0.005 * accAdj : f1IV;
  const f1 = autoPath >= 2 ? (autoPath === 4 ? f1DSD + f1IVAdj : autoPath === 3 ? f1DSD : f1IV) : 0;

  const autoRate = 0.65;
  const curCost       = actualAnnualVol * effManualMin * (effApRate / 60);
  const autoCost      = actualAnnualVol * autoRate * 2 * (effApRate / 60);
  const excCost       = actualAnnualVol * (1 - autoRate) * 8 * (effApRate / 60);
  const transitionY1  = codingPractice !== 'line-item' && autoPath >= 2 ? (40 * effApRate) + (1.5 * effApRate * 52) : 0;
  const transitionY2  = codingPractice !== 'line-item' && autoPath >= 2 ? (1.5 * effApRate * 52) : 0;
  const f2y1 = (curCost - autoCost) - excCost - transitionY1;
  const f2y2 = (curCost - autoCost) - excCost - transitionY2;
  const f2 = f2y1;

  const f3gmReceiver = n(storeCount) * effStoreOpsHrs * 52 * effGmRate;
  const f3deptHead = n(deptHeadCount) * (n(deptHeadCostHrs) + n(deptHeadAdminHrs)) * 52 * effDeptHeadRate;
  const f3 = (f3gmReceiver + f3deptHead) * 0.5;
  const f4 = (autoPath === 2 || autoPath === 4) ? n(vendorSpend) * 0.007 * 0.5 : 0;
  const f5 = (effCloseOT * 0.7 * 12 * (effApRate * 1.5)) + (effReconHrs * 0.65 * 12 * effApRate);
  const f6 = n(growthStores) * 0.25 * 52000;

  const tmdv       = f1 + f2 + f3 + f4 + f5 + f6;
  const netAnnual  = tmdv - n(ottimateAnnual);
  const payback    = tmdv > 0 ? (n(ottimateAnnual) / (tmdv / 12)).toFixed(1) : 'N/A';
  const multiplier = n(netMargin) > 0 ? netAnnual / n(netMargin) : 0;
  const dailyCost  = tmdv > 0 ? tmdv / 365 : 0;

  const ttvProfile = qualScore >= 20
    ? { label: 'Standard',  range: '30-60 days',   color: 'emerald' }
    : qualScore >= 12
    ? { label: 'Enhanced',  range: '60-90 days',   color: 'amber' }
    : { label: 'Complex',   range: '90-180 days',  color: 'red' };

  const impactCategories = [
    { label: 'Pricing Variance Recovery',  value: f1, active: autoPath >= 2 },
    { label: 'Invoice Processing Labor',   value: f2, active: true },
    { label: 'Store Operations Recovery',  value: f3, active: true },
    { label: 'Vendor Credit Recovery',     value: f4, active: autoPath === 2 || autoPath === 4 },
    { label: 'Month-End Close Efficiency', value: f5, active: true },
    { label: 'Growth Scalability',         value: f6, active: n(growthStores) > 0 },
  ];

  const canNext = phase < activePhases.length - 1;
  const canBack = phase > 0;

  // ═══ Invoice timeline signal: long = opportunity (green), same-day = already solved (yellow/red) ═══
  const timelineSignal = invoiceTimeline === 'long' ? 'green' : invoiceTimeline === 'short' ? 'yellow' : invoiceTimeline === 'same' ? 'red' : null;

  // ═══ Impact Summary (shareable / EB-ready view) ═══
  const renderImpactSummary = () => {
    const toggleCalc = (key) => setExpandedCalcs(prev => ({ ...prev, [key]: !prev[key] }));

    // ─ Section 1 prose helpers ─
    const storeStr = n(storeCount) > 1 ? `${n(storeCount)} store locations` : 'a single location';
    const annualInvoices = n(invoiceVol) * 12;
    const digitalLabel = digitalPct === 'high' ? '70% or more' : digitalPct === 'med' ? '40–70%' : 'fewer than 40%';
    const lineItemLabel = lineItems === 'low' ? 'under 20' : lineItems === 'med' ? '20–50' : lineItems === 'high' ? '50–100' : '100+';
    const erpLabel = erp === 'qbo' ? 'QuickBooks Online' : erp === 'qbd' ? 'QuickBooks Desktop' : erp === 'sage' ? 'Sage' : erp === 'fms' ? 'FMS' : erp === 'complex' ? 'a complex ERP environment' : 'your accounting system';
    const timelineLabel = invoiceTimeline === 'same' ? 'same day or next day' : invoiceTimeline === 'short' ? '2–3 days' : invoiceTimeline === 'long' ? '7–10+ days' : null;
    const codingLabel = codingPractice === 'line-item' ? 'line-item coding' : codingPractice === 'summary' ? 'summary department splits' : 'a mix of line-item and summary coding';
    const apStr = n(apHeadcount) > 0 ? `${n(apHeadcount)}-person AP team` : 'your AP team';

    // ─ Section 3 margin math ─
    // Estimate revenue from vendor spend (COGS ≈ 68% of revenue for independent grocery)
    const estRevenue = n(vendorSpend) > 0 ? n(vendorSpend) / 0.68 : 0;
    const currentNetProfit = estRevenue * n(netMargin);
    const improvedNetProfit = currentNetProfit + netAnnual;
    const pctOfNetProfit = currentNetProfit > 0 ? Math.round((netAnnual / currentNetProfit) * 100) : 0;
    const maxBar = Math.max(currentNetProfit, improvedNetProfit, 1);
    const currentBarPct = (currentNetProfit / maxBar) * 100;
    const improvedBarPct = Math.min((improvedNetProfit / maxBar) * 100, 100);

    // ─ Section 2 category details ─
    const calcDetails = {
      'Pricing Variance Recovery': {
        explain: `When vendors invoice at prices above your negotiated rates, those overcharges go undetected until someone manually cross-references — which rarely happens at scale. Industry data across 481 million invoices puts the average pricing variance at 1.2% of vendor spend. We apply a conservative 0.5% rate and adjust for your invoice format mix.`,
        calc: `${fmtFull(n(vendorSpend))} vendor spend × 0.5% variance rate${digitalPct ? ` × ${accAdj * 100}% accuracy factor` : ''} = ${fmtFull(f1)}`
      },
      'Invoice Processing Labor': {
        explain: `Your team is spending time on work the system handles automatically — data entry, coding, routing, approval follow-up. The savings here is the difference between what processing costs today versus what it costs with automation handling 65% of invoices, minus the labor to review exceptions.`,
        calc: `Current: ${n(invoiceVol) * 12} invoices/yr × ${effManualMin} min × $${effApRate}/hr = ${fmtFull(curCost)}\nAutomated: 65% auto-processed at 2 min each + 35% exceptions at 8 min each = ${fmtFull(autoCost + excCost)}\nYear 1 net (after SKU mapping investment): ${fmtFull(f2y1)}`
      },
      'Store Operations Recovery': {
        explain: `Every store location has people — GMs, receivers, and department heads — who spend time collecting delivery slips, verifying costs, reconciling paper invoices, and organizing paperwork. Your meat manager, produce manager, and deli lead may each be spending hours checking that what was invoiced matches what was delivered and priced correctly. When invoices are captured and validated digitally, that time is conservatively reduced by roughly half.`,
        calc: `GM/Receivers: ${n(storeCount)} stores × ${effStoreOpsHrs} hrs/week × 52 weeks × $${effGmRate}/hr = ${fmtFull(f3gmReceiver)}${n(deptHeadCount) > 0 ? `\nDept Heads: ${n(deptHeadCount)} managers × ${n(deptHeadCostHrs) + n(deptHeadAdminHrs)} hrs/week × 52 weeks × $${effDeptHeadRate}/hr = ${fmtFull(f3deptHead)}` : ''}\nTotal (at 50% labor reduction): ${fmtFull(f3)}`
      },
      'Vendor Credit Recovery': {
        explain: `Credits, debit memos, and short-pays accumulate when AP doesn't have time to track them systematically. Automated tracking surfaces outstanding credits and flags short-pays so your team can follow up. Industry estimate: 0.7% of vendor spend, 50% recovery rate.`,
        calc: `${fmtFull(n(vendorSpend))} × 0.7% × 50% recovery = ${fmtFull(f4)}`
      },
      'Month-End Close Efficiency': {
        explain: `Overtime hours and reconciliation time spike at month-end because invoices aren't fully coded and the books aren't current. Automation keeps the ledger cleaner throughout the month, so close becomes a verification exercise instead of a catch-up sprint.`,
        calc: `Overtime: ${effCloseOT} hrs × 70% reduction × 12 months × $${(effApRate*1.5).toFixed(0)}/hr (OT rate) = ${fmtFull(effCloseOT*0.7*12*(effApRate*1.5))}\nRecon: ${effReconHrs} hrs/month × 65% reduction × 12 months × $${effApRate}/hr = ${fmtFull(effReconHrs*0.65*12*effApRate)}`
      },
      'Growth Scalability': {
        explain: `Adding a new location without automation almost always means adding AP capacity — more invoices, more vendors, more manual work. With a mature automation stack, your team absorbs additional locations with minimal incremental labor. This estimates 25% of a fully-loaded AP position ($52K) per new store.`,
        calc: `${n(growthStores)} planned stores × 25% AP position × $52,000 = ${fmtFull(f6)}`
      }
    };

    const activeCategories = impactCategories.filter(c => c.active && c.value !== 0);

    return (
      <div className="space-y-8 pb-12">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Impact Summary</div>
          <h2 className="text-2xl font-bold mb-1">{prospectName || 'Your Operation'}</h2>
          <p className="text-slate-400 text-sm">Prepared by Ottimate · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Annual Recovery</div>
              <div className="text-2xl font-black text-emerald-400 tabular-nums mt-1">{fmtFull(tmdv)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Annual Value</div>
              <div className="text-2xl font-black text-white tabular-nums mt-1">{fmtFull(netAnnual)}</div>
            </div>
            {n(ottimateAnnual) > 0 && tmdv > 0 && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Payback Period</div>
                <div className="text-2xl font-black text-blue-300 tabular-nums mt-1">{payback} mo</div>
              </div>
            )}
          </div>
          {dailyCost > 0 && (
            <div className="mt-6 bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-center">
              <div className="text-[10px] text-red-300 uppercase tracking-wider mb-1">Daily Cost of Inaction</div>
              <div className="text-2xl font-black text-red-300 tabular-nums">{fmtFull(dailyCost)}</div>
              <p className="text-xs text-red-300/70 mt-1">Every day without these recoveries in place</p>
            </div>
          )}
        </div>

        {/* Section 1: What you told us */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="text-lg font-bold text-slate-800">What you told us</h3>
          </div>
          <div className="text-sm text-slate-600 leading-loose space-y-3">
            {(n(storeCount) > 0 || n(invoiceVol) > 0 || vendorCount) && (
              <p>
                {prospectName ? `${prospectName} operates` : 'You operate'} <span className="font-semibold text-slate-800">{storeStr}</span>
                {n(invoiceVol) > 0 && <>, processing approximately <span className="font-semibold text-slate-800">{annualInvoices.toLocaleString()} invoices per year</span></>}
                {vendorCount && <> across <span className="font-semibold text-slate-800">{vendorCount} active vendors</span></>}.
              </p>
            )}
            {(n(apHeadcount) > 0 || n(manualMin) > 0 || codingPractice) && (
              <p>
                Your <span className="font-semibold text-slate-800">{apStr}</span> currently processes invoices using <span className="font-semibold text-slate-800">{codingLabel}</span>
                {n(manualMin) > 0 && <> at roughly <span className="font-semibold text-slate-800">{n(manualMin)} minutes per invoice</span></>}.
                {timelineLabel && <> Invoices travel from delivery to your accounting system in <span className="font-semibold text-slate-800">{timelineLabel}</span>.</>}
              </p>
            )}
            {(digitalPct || lineItems) && (
              <p>
                {digitalPct && <><span className="font-semibold text-slate-800">{digitalLabel} of your invoices</span> arrive as digital PDFs — the rest are paper or scans.</>}
                {lineItems && <> Typical invoices carry <span className="font-semibold text-slate-800">{lineItemLabel} line items</span>.</>}
              </p>
            )}
            {erp && (
              <p>
                Your accounting system is <span className="font-semibold text-slate-800">{erpLabel}</span>
                {erpManaged === 'consultant' && <>, managed by an outside IT firm</>}
                {erpManaged === 'bookkeeper' && <>, managed by your bookkeeper</>}
                .
              </p>
            )}
            {n(vendorSpend) > 0 && (
              <p>
                Total annual vendor spend flowing through AP: <span className="font-semibold text-slate-800">{fmtFull(n(vendorSpend))}</span>
                {n(dsdSpend) > 0 && <>, of which <span className="font-semibold text-slate-800">{fmtFull(n(dsdSpend))}</span> is direct store delivery (DSD)</>}.
              </p>
            )}
          </div>
        </div>

        {/* Section 2: What your numbers reveal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="text-lg font-bold text-slate-800">What your numbers reveal</h3>
          </div>
          <div className="space-y-4">
            {activeCategories.map((cat, i) => {
              const detail = calcDetails[cat.label];
              const isOpen = expandedCalcs[cat.label];
              return (
                <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="flex items-start justify-between p-4 bg-slate-50">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-sm">{cat.label}</div>
                      {detail && <p className="text-xs text-slate-500 mt-1 leading-relaxed pr-4">{detail.explain}</p>}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className={`text-lg font-black tabular-nums ${cat.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(cat.value)}</div>
                      <div className="text-[10px] text-slate-400">per year</div>
                    </div>
                  </div>
                  {detail && (
                    <div>
                      <button onClick={() => toggleCalc(cat.label)}
                        className="w-full text-left px-4 py-2 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center gap-1 border-t border-slate-100">
                        <span>{isOpen ? '▲' : '▼'}</span> See the calculation
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-2 bg-blue-50/40 border-t border-blue-100">
                          {detail.calc.split('\n').map((line, li) => (
                            <p key={li} className="text-[11px] text-slate-600 font-mono leading-relaxed">{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total row */}
            <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Total Margin Defense Value</div>
                <div className="text-xs text-slate-400 mt-0.5">Annual value identified across all categories</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400 tabular-nums">{fmtFull(tmdv)}</div>
                {n(ottimateAnnual) > 0 && <div className="text-xs text-slate-400 mt-1">Net after {fmtFull(n(ottimateAnnual))} investment: <span className="text-white font-bold">{fmtFull(netAnnual)}</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: What this means for your margins */}
        {n(netMargin) > 0 && n(vendorSpend) > 0 && netAnnual > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="text-lg font-bold text-slate-800">What this means for your margins</h3>
            </div>

            {/* Three headline numbers */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Net Annual Value</div>
                <div className="text-xl font-black text-emerald-600 tabular-nums">{fmtFull(netAnnual)}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">% of Est. Net Profit</div>
                <div className="text-xl font-black text-blue-600 tabular-nums">{pctOfNetProfit}%</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Revenue Equivalent</div>
                <div className="text-xl font-black text-slate-800 tabular-nums">{fmtFull(multiplier)}</div>
              </div>
            </div>

            {/* Bar visual */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Estimated net profit today</span>
                  <span className="font-semibold text-slate-700">{fmtFull(currentNetProfit)}</span>
                </div>
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-lg transition-all duration-500" style={{ width: `${currentBarPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Estimated net profit with recovered value</span>
                  <span className="font-semibold text-emerald-700">{fmtFull(improvedNetProfit)}</span>
                </div>
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                  <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${currentBarPct}%` }} />
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${improvedBarPct - currentBarPct}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                Revenue estimate based on vendor spend ÷ 68% COGS ratio, a typical independent grocery benchmark. Net margin at {(n(netMargin)*100).toFixed(1)}% per your inputs. These are directional estimates — your actual numbers will differ.
              </p>
            </div>

            {/* Revenue equivalent framing */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                At a <span className="font-semibold">{(n(netMargin)*100).toFixed(1)}% net margin</span>, every dollar you stop losing is worth <span className="font-semibold text-blue-700">{Math.round(1/n(netMargin))} dollars you'd have to sell</span> to generate the same profit. The <span className="font-semibold">{fmtFull(netAnnual)}</span> identified here is equivalent to <span className="font-semibold text-blue-700">{fmtFull(multiplier)}</span> in new top-line revenue — without adding a single new customer.
              </p>
            </div>
          </div>
        )}

        {/* Section 4: How you compare */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</span>
            <h3 className="text-lg font-bold text-slate-800">How you compare</h3>
          </div>
          <div className="space-y-4">
            {n(manualMin) > 0 && (
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl">⏱</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Invoice Processing Time</div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Your team currently processes invoices at <span className="font-semibold">{n(manualMin)} minutes each</span>. The industry average for operators using AP automation is approximately <span className="font-semibold">2 minutes per invoice</span> for exceptions — an {Math.round(((n(manualMin) - 2) / n(manualMin)) * 100)}% reduction in processing time.
                  </p>
                </div>
              </div>
            )}
            {n(vendorSpend) > 0 && (
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl">📊</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Pricing Variance Exposure</div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Industry benchmark data across <span className="font-semibold">481 million invoices</span> puts average pricing variance at <span className="font-semibold">1.2% of vendor spend</span> (Xelix, 2026). We model a conservative <span className="font-semibold">0.5%</span> — at your scale, that's approximately <span className="font-semibold">{fmtFull(n(vendorSpend) * 0.005)}/year</span> in recoverable overcharges without automated line-item matching.
                  </p>
                </div>
              </div>
            )}
            {digitalPct && (
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl">📄</div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Invoice Format Mix</div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {digitalPct === 'high'
                      ? `With 70%+ of invoices arriving as digital PDFs, your operation is well-positioned for automation. Digital invoices extract at 92–95% accuracy — the strongest starting point for a fast ramp.`
                      : digitalPct === 'med'
                      ? `With 40–70% digital PDFs, you're in a mixed environment. Digital invoices extract at 92–95% accuracy; scanned paper drops to 80–88%. Improving the digital ratio over time will compound the accuracy gains.`
                      : `With fewer than 40% of invoices arriving digitally, your operation relies heavily on scanned paper and manual capture — the area where automation delivers the most immediate relief, and where the accuracy ramp takes slightly longer.`}
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl">🏪</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Grocery AP Automation Benchmark</div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Independent grocery operators on AP automation platforms typically recover <span className="font-semibold">1.5–3% of vendor spend annually</span> through a combination of pricing variance capture, labor recovery, and vendor credit collection. At your vendor spend level, that range represents <span className="font-semibold">{fmtFull(n(vendorSpend)*0.015)}–{fmtFull(n(vendorSpend)*0.03)}</span>.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-5 leading-relaxed border-t border-slate-100 pt-4">
            Pricing variance benchmark: Xelix 2026 AP Risk Report (481M invoices, 800+ organizations). Processing time benchmarks: Ottimate customer data, grocery segment. All figures are estimates based on your inputs and industry benchmarks — your actual results will vary based on vendor mix, data quality, and implementation depth.
          </p>
        </div>

      </div>
    );
  };

  // ═══ Render phases ═══
  const renderPhase = () => {
    switch(activePhases[phase].id) {

      case 'welcome': return (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-3">Grocery AP Discovery & Impact Workshop</h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              Before we look at any product, we want to understand how your operation actually works — your invoice flow, your systems, your team's capacity. We do this because grocery is complex, and the last thing either of us wants is to get excited about a solution that doesn't fit your specific situation.
            </p>
            <p className="text-slate-400 leading-relaxed text-sm mt-3">
              The customers where we deliver the most value are the ones where we took the time upfront to really understand their world. So we're going to walk through some detailed questions — some might feel granular — but they're how we make sure what we propose actually works for you.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Who are we building this for?</label>
            <input value={prospectName} onChange={e => setProspectName(e.target.value)} placeholder="Company name..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 mb-4" />
            <NumField label="Number of store locations" value={storeCount} onChange={setStoreCount} min={1} max={200} note="This shapes every calculation that follows." />
          </div>
        </div>
      );

      case 'operation': return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Invoice Volume & Complexity</h3>
            <p className="text-xs text-slate-400 mb-4">Understanding what hits your AP desk every month.</p>
            <FramingText text={FRAMING.invoiceVol} />
            <SliderField
              label="What's your average monthly invoice volume across all locations?"
              value={invoiceVol}
              onChange={setInvoiceVol}
              min={500}
              max={100000}
              step={500}
              markers={['500', '25K', '50K', '75K', '100K']}
              note="Include everything: broadline, DSD, specialty, one-offs."
            />
            <SelectField label="Do any vendors split deliveries into multiple invoices?"
              value={invoiceSplitting} onChange={setInvoiceSplitting}
              options={[
                {value:'no',    label:'No — one invoice per delivery'},
                {value:'some',  label:'Some vendors split by department or location'},
                {value:'heavy', label:'Yes — many vendors send 3-4+ invoices per delivery'}
              ]}
              note="Invoice splitting can inflate your actual volume 20-30% above what you'd expect." />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Invoice Format & Line Items</h3>
            <FramingText text={FRAMING.digitalPct} />
            <SelectField label="What percentage of your invoices arrive as digital PDFs vs. scanned paper?" value={digitalPct} onChange={setDigitalPct}
              options={[
                {value:'high', label:'70%+ are digital PDFs (email or portal)'},
                {value:'med',  label:'40-70% digital, rest are scanned or paper'},
                {value:'low',  label:'Under 40% digital — mostly paper, scans, or faxes'}
              ]} />
            {showSignals && digitalPct && <div className="mt-1 mb-3"><Signal level={digitalPct === 'high' ? 'green' : digitalPct === 'med' ? 'yellow' : 'red'} /></div>}

            <FramingText text={FRAMING.lineItems} />
            <SelectField label="How many line items does your typical invoice have?" value={lineItems} onChange={setLineItems}
              options={[
                {value:'low',   label:'Under 20 items — mostly simple invoices'},
                {value:'med',   label:'20-50 items'},
                {value:'high',  label:'50-100 items'},
                {value:'vhigh', label:'100+ items — multi-page detailed invoices'}
              ]} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Invoice Flow & Vendor Landscape</h3>
            <FramingText text={FRAMING.invoiceTimeline} />
            <SelectField label="How many days from delivery to invoice entry in your accounting system?" value={invoiceTimeline} onChange={setInvoiceTimeline}
              options={[
                {value:'same',  label:'Same day or next day'},
                {value:'short', label:'2-3 days'},
                {value:'long',  label:'7-10+ business days'}
              ]} />
            {showSignals && timelineSignal && <div className="mt-1 mb-3"><Signal level={timelineSignal} /></div>}

            <FramingText text={FRAMING.vendorCount} />
            <NumField label="How many regular vendors do you work with?" value={vendorCount} onChange={setVendorCount} min={0} max={500}
              note="Include broadline, DSD, specialty, and local vendors." />

            <FramingText text={FRAMING.vendorTurnover} />
            <SelectField label="How often do you add new vendors?" value={vendorTurnover} onChange={setVendorTurnover}
              options={[
                {value:'stable',   label:'Rarely — maybe 2-3 new vendors per quarter'},
                {value:'moderate', label:'Regularly — 5-10 new vendors per quarter (produce, specialty rotation)'},
                {value:'high',     label:'Constantly — new vendors every week, especially produce and specialty'}
              ]}
              note="High vendor turnover means ongoing system maintenance as new formats and items need to be mapped." />
          </div>
        </div>
      );

      case 'data': return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Vendor & Item Data Quality</h3>
            <p className="text-xs text-slate-400 mb-4">Your data quality is the strongest predictor of onboarding success.</p>
            <FramingText text={FRAMING.vendorClean} />
            <SelectField label="How clean is your vendor master?" value={vendorClean} onChange={setVendorClean}
              options={[
                {value:'clean', label:'Clean — minimal duplicates, current info, actively maintained'},
                {value:'some',  label:"Some duplicates — we know about them but haven't cleaned up"},
                {value:'messy', label:'Messy or unknown — different people have added vendors over the years'}
              ]} />
            {showSignals && vendorClean && <div className="mt-1 mb-3"><Signal level={vendorClean === 'clean' ? 'green' : vendorClean === 'some' ? 'yellow' : 'red'} /></div>}

            <FramingText text={FRAMING.itemCatalog} />
            <SelectField label="Do your items have UPCs in your POS, with consistent descriptions?" value={itemCatalog} onChange={setItemCatalog}
              options={[
                {value:'clean',   label:'Yes — UPCs present, descriptions consistent, catalog maintained'},
                {value:'partial', label:'Partial — branded items have UPCs, deli/bakery are by description'},
                {value:'messy',   label:'No — no UPCs, inconsistent descriptions, catalog needs work'}
              ]} />
            {showSignals && itemCatalog && <div className="mt-1 mb-3"><Signal level={itemCatalog === 'clean' ? 'green' : itemCatalog === 'partial' ? 'yellow' : 'red'} /></div>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Accounting Structure & Pricing</h3>
            <FramingText text={FRAMING.chartOfAccounts} />
            <SelectField label="How is your chart of accounts structured across locations?" value={coaStructure} onChange={setCoaStructure}
              options={[
                {value:'consolidated', label:'Same chart of accounts across all locations'},
                {value:'minor',        label:'Mostly the same with a few location-specific variations'},
                {value:'siloed',       label:'Each store has its own set of books and GL codes'}
              ]} />
            {showSignals && coaStructure && <div className="mt-1 mb-3"><Signal level={coaStructure === 'consolidated' ? 'green' : coaStructure === 'minor' ? 'yellow' : 'red'} /></div>}

            <FramingText text={FRAMING.pricingData} />
            <SelectField label="How often does your POS pricing data get updated?" value={pricingMaint} onChange={setPricingMaint}
              options={[
                {value:'active',   label:'Weekly — distributor sends cost files and we upload them'},
                {value:'moderate', label:'When we get vendor notices, but usually a few weeks behind'},
                {value:'rarely',   label:'Only when someone notices a big discrepancy'}
              ]} />
            {showSignals && pricingMaint && <div className="mt-1 mb-3"><Signal level={pricingMaint === 'active' ? 'green' : pricingMaint === 'moderate' ? 'yellow' : 'red'} /></div>}
          </div>
        </div>
      );

      case 'systems': return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Your Accounting & Technology</h3>
            <FramingText text={FRAMING.erp} />
            <SelectField label="What ERP or accounting system are you using?" value={erp} onChange={setErp}
              options={[
                {value:'qbo',     label:'QuickBooks Online'},
                {value:'qbd',     label:'QuickBooks Desktop'},
                {value:'sage',    label:'Sage (100/300 or Intacct)'},
                {value:'fms',     label:'FMS (Financial Management Solutions)'},
                {value:'complex', label:'Acumatica, NetSuite, Oracle, or custom system'}
              ]} />
            {showSignals && erp && <div className="mt-1 mb-3"><Signal level={erp === 'qbo' ? 'green' : erp === 'qbd' || erp === 'sage' || erp === 'fms' ? 'yellow' : 'red'} /></div>}

            <SelectField label="Who manages your accounting system?" value={erpManaged} onChange={setErpManaged}
              options={[
                {value:'internal',   label:'We manage it ourselves internally'},
                {value:'bookkeeper', label:'Our bookkeeper handles everything'},
                {value:'consultant', label:'An outside IT firm or consultant manages it'}
              ]} />
            {erpManaged === 'consultant' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4">
                Third-party ERP management adds coordination complexity. We'll want to include them in integration planning early.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Scanning & Technical Readiness</h3>
            <FramingText text={FRAMING.scanning} />
            <SelectField label="How do you currently capture invoices that arrive as paper?" value={scanning} onChange={setScanning}
              options={[
                {value:'commercial', label:'Commercial scanner at each location — clear, high-res scans'},
                {value:'basic',      label:'Basic scanner — most scans are okay, some are fuzzy'},
                {value:'phone',      label:'Phone photos or no scanning — everything is paper'},
                {value:'na',         label:'N/A — most invoices are already digital'}
              ]} />

            <FramingText text={FRAMING.techSkills} />
            <SelectField label="Does your team have someone comfortable with basic software administration?" value={techSkills} onChange={setTechSkills}
              options={[
                {value:'strong',  label:'Yes — tech-savvy office manager or IT person on staff'},
                {value:'willing', label:'We can figure things out but need thorough training'},
                {value:'limited', label:'Our team struggles with technology — most AP work is on paper'}
              ]} />
            {showSignals && techSkills && <div className="mt-1 mb-3"><Signal level={techSkills === 'strong' ? 'green' : techSkills === 'willing' ? 'yellow' : 'red'} /></div>}
          </div>
        </div>
      );

      case 'team': return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Your Team Structure</h3>
            <p className="text-xs text-slate-400 mb-4">Who's involved in your invoice and purchasing workflow.</p>
            <NumField label="How many people are on your AP team?" value={apHeadcount} onChange={setApHeadcount} min={1} max={20}
              note="Everyone who touches invoice processing — data entry, coding, approvals." />
            <FramingText text={FRAMING.deptHeads} />
            <NumField label="How many department or category managers do you have?" value={deptHeadCount} onChange={setDeptHeadCount} min={0} max={30}
              note="Meat, produce, deli, bakery, grocery — anyone who reviews costs for their area." />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Implementation Ownership</h3>
            <p className="text-xs text-slate-400 mb-4">The people and bandwidth behind the project.</p>
            <FramingText text={FRAMING.implOwner} />
            <SelectField label="Who on your team will own the implementation, and how much time can they give it?" value={implOwner} onChange={setImplOwner}
              options={[
                {value:'named', label:'Named person with 5-10 hours/week dedicated'},
                {value:'busy',  label:"Someone assigned but they're stretched thin"},
                {value:'none',  label:"We'll figure that out later / nobody identified yet"}
              ]} />
            {showSignals && implOwner && <div className="mt-1 mb-3"><Signal level={implOwner === 'named' ? 'green' : implOwner === 'busy' ? 'yellow' : 'red'} /></div>}
            {implOwner === 'none' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mt-2">
                Every customer where we deliver value quickly has a named owner with real time committed. Let's make sure we identify that person before we finalize the plan.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Timeline & Success Definition</h3>
            <FramingText text={FRAMING.timeline} />
            <SelectField label="What does your timeline look like?" value={timeline} onChange={setTimeline}
              options={[
                {value:'ready',     label:'Want to be live next quarter — team has capacity now'},
                {value:'competing', label:'Year-end goal, but we have competing priorities'},
                {value:'urgent',    label:'Need it immediately (but resources are limited)'},
                {value:'noRush',    label:'No rush — whenever it makes sense'}
              ]} />

            <FramingText text={FRAMING.successMetrics} />
            <SelectField label="How will you measure whether this is successful?" value={successMetrics} onChange={setSuccessMetrics}
              options={[
                {value:'specific',  label:'Specific targets — reduce processing time by X%, catch discrepancies automatically'},
                {value:'directional', label:'Just make it easier than what we\'re doing now'},
                {value:'vague',     label:'I just want it to work / the AI should handle everything'}
              ]} />
            {successMetrics === 'vague' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mt-2">
                Let's put some numbers on that together. If we can agree on what "working" looks like now, we'll both know when the system is delivering.
              </div>
            )}
          </div>
        </div>
      );

      case 'costs': return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">AP Processing Costs</h3>
            <p className="text-xs text-slate-400 mb-4">What it costs your AP team to process invoices today.</p>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="Fully-loaded AP hourly rate" value={apRate} onChange={setApRate} min={15} max={55} prefix="$" suffix="/hr"
                note="Base + benefits + taxes + overhead" />
              <NumField label="Minutes per invoice (manual)" value={manualMin} onChange={setManualMin} min={2} max={30} suffix="min"
                note="Average, not best case" />
            </div>
            <SelectField label="Current coding practice" value={codingPractice} onChange={setCodingPractice}
              options={[
                {value:'line-item', label:'Already coding at line-item level'},
                {value:'summary',   label:'Summary splits (% by department)'},
                {value:'mixed',     label:'Mixed — depends on the vendor'}
              ]} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Store & Department Costs</h3>
            <p className="text-xs text-slate-400 mb-4">Time and cost for GMs, receivers, and department heads on invoice-related work.</p>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="GM/receiver hours/week on invoice paperwork" value={storeOpsHrs} onChange={setStoreOpsHrs} min={0} max={15} suffix="hrs/store"
                note="Collecting slips, organizing receipts, reconciling deliveries" />
              <NumField label="GM/store manager hourly rate" value={gmRate} onChange={setGmRate} min={20} max={60} prefix="$" suffix="/hr" />
              <NumField label="Dept head hours/week verifying costs" value={deptHeadCostHrs} onChange={setDeptHeadCostHrs} min={0} max={20} suffix="hrs/week"
                note="Checking invoices match what was delivered and priced correctly" />
              <NumField label="Dept head hours/week on invoice admin" value={deptHeadAdminHrs} onChange={setDeptHeadAdminHrs} min={0} max={20} suffix="hrs/week"
                note="Organizing paperwork, matching credits, reconciling statements" />
              <NumField label="Department head hourly rate" value={deptHeadRate} onChange={setDeptHeadRate} min={15} max={60} prefix="$" suffix="/hr"
                note="Base + benefits + taxes + overhead" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <NumField label="Month-end close overtime hours" value={closeOT} onChange={setCloseOT} min={0} max={50} suffix="hrs/close"
                note="Extra hours per month-end" />
              <NumField label="Monthly reconciliation hours" value={reconHrs} onChange={setReconHrs} min={0} max={80} suffix="hrs/month"
                note="Vendor statements, clearing accounts" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Spend, Growth & Investment</h3>
            <p className="text-xs text-slate-400 mb-5">Slide to adjust — these numbers drive the biggest line items in the impact model.</p>

            <SliderField
              label="Total annual vendor spend"
              value={vendorSpend}
              onChange={setVendorSpend}
              min={500000}
              max={500000000}
              step={1000000}
              markers={['$500K', '$125M', '$250M', '$375M', '$500M']}
              note="All vendors flowing through AP — broadline, DSD, specialty, local"
            />
            <SliderField
              label="Annual DSD vendor spend"
              value={dsdSpend}
              onChange={setDsdSpend}
              min={0}
              max={250000000}
              step={500000}
              markers={['$0', '$62.5M', '$125M', '$187.5M', '$250M']}
              note="Pepsi, Coke, local bakeries, produce — direct store delivery vendors only"
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <NumField label="New stores planned (next 12-24 months)" value={growthStores} onChange={setGrowthStores} min={0} max={20}
                note="0 if no expansion plans" />
              <NumField label="Ottimate annual investment" value={ottimateAnnual} onChange={setOttimateAnnual} min={0} max={500000} prefix="$"
                note="Your proposed annual cost" />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Net profit margin — <span className="text-blue-600">{(n(netMargin)*100).toFixed(1)}%</span>
              </label>
              <input type="range" min={0.005} max={0.05} step={0.005} value={netMargin}
                onChange={e => setNetMargin(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((netMargin - 0.005)/(0.05 - 0.005))*100}%, #e2e8f0 ${((netMargin - 0.005)/(0.05 - 0.005))*100}%, #e2e8f0 100%)` }}
              />
              <div className="flex justify-between mt-1">
                {['0.5%','1%','1.5%','2%','2.5%','3%','3.5%','4%','4.5%','5%'].map((m,i) => i % 2 === 0 && (
                  <span key={i} className="text-[10px] text-slate-400">{m}</span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Industry: 1-3%. Typical independent grocer: 2%.</p>
            </div>
          </div>
        </div>
      );

      case 'impact': return (
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setShowSummary(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${!showSummary ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              ⚙️ Discovery View
            </button>
            <button onClick={() => setShowSummary(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${showSummary ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              📋 Impact Summary
            </button>
          </div>

          {showSummary ? renderImpactSummary() : (
            <>
          {/* Qualification — only visible when signals are on */}
          {showSignals && (
            <div className={`rounded-2xl p-6 border-2 ${qualLevel === 'green' ? 'bg-emerald-50 border-emerald-200' : qualLevel === 'yellow' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800">Onboarding Assessment</h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${qualLevel === 'green' ? 'bg-emerald-200 text-emerald-800' : qualLevel === 'yellow' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {qualLabel}
                </span>
              </div>
              <p className="text-sm text-slate-600">{qualDesc}</p>
              <div className="mt-3 text-xs text-slate-500">Recommended configuration: <span className="font-semibold text-slate-700">{pathNames[autoPath]}</span></div>
              <div className="mt-1 text-xs text-slate-500">Time-to-value: <span className={`font-semibold ${ttvProfile.color === 'emerald' ? 'text-emerald-700' : ttvProfile.color === 'amber' ? 'text-amber-700' : 'text-slate-600'}`}>{ttvProfile.label} ({ttvProfile.range})</span></div>
            </div>
          )}

          {/* Financial Impact */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Annual Financial Impact</h3>
            <div className="space-y-2.5 mb-4">
              {impactCategories.filter(c => c.active && c.value !== 0).map((c, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    {c.label}
                    <Tooltip text={IMPACT_TOOLTIPS[c.label]}>
                      <span className="text-slate-600 hover:text-slate-300 cursor-help text-[11px] transition-colors">ⓘ</span>
                    </Tooltip>
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${c.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtFull(c.value)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  Total Margin Defense Value
                  <Tooltip text="The sum of all recoverable value identified above — pricing variance, labor savings, store ops recovery, vendor credits, close efficiency, and growth scalability. This represents the full economic case for automation.">
                    <span className="text-slate-600 hover:text-slate-300 cursor-help text-[11px] transition-colors">ⓘ</span>
                  </Tooltip>
                </span>
                <span className="text-white font-bold">{fmtFull(tmdv)}</span>
              </div>
              {n(ottimateAnnual) > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Less: Annual Investment</span>
                  <span className="text-red-400 font-semibold">({fmtFull(ottimateAnnual)})</span>
                </div>
              )}
            </div>
            <div className="bg-slate-800 rounded-xl p-4 mt-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Annual Value</div>
              <div className={`text-3xl font-black tabular-nums ${netAnnual >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtFull(netAnnual)}</div>
              {n(ottimateAnnual) > 0 && tmdv > 0 && (
                <div className="text-xs text-slate-400 mt-1">Payback period: <span className="text-white font-semibold">{payback} months</span></div>
              )}
            </div>

            {dailyCost > 0 && (
              <div className="bg-gradient-to-r from-red-900/60 to-orange-900/60 rounded-xl p-4 mt-4 border border-red-700/30">
                <div className="text-[10px] text-red-300 uppercase tracking-wider mb-1">Daily Cost of Inaction</div>
                <div className="text-2xl font-black text-red-300 tabular-nums">{fmtFull(dailyCost)}</div>
                <p className="text-xs text-red-400/80 mt-2 leading-relaxed">
                  Every day without these recoveries in place costs your operation <span className="font-bold text-white">{fmtFull(dailyCost)}</span>. That's money leaving your margins today.
                </p>
              </div>
            )}

            {n(netMargin) > 0 && netAnnual > 0 && (
              <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-xl p-4 mt-4 border border-blue-700/30">
                <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">What This Means For Your Margins</div>
                <div className="text-xl font-black text-blue-300 tabular-nums">{fmtFull(multiplier)}</div>
                <p className="text-xs text-blue-400 mt-2 leading-relaxed">
                  This {fmtFull(netAnnual)} in annual recovery is equivalent to generating <span className="font-bold text-white">{fmtFull(multiplier)}</span> in new revenue at your {(n(netMargin)*100).toFixed(1)}% margins. Every dollar you stop losing is worth {Math.round(1/n(netMargin))} dollars you'd have to sell.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">How You Compare</div>
              <div className="space-y-1 text-xs text-slate-400">
                {n(manualMin) > 0 && <p>Your processing time of {n(manualMin)} min/invoice vs. 2 min/invoice with automation.</p>}
                {digitalPct && <p>Your digital invoice ratio: {digitalPct === 'high' ? '70%+ (strong)' : digitalPct === 'med' ? '40-70% (moderate)' : 'under 40% (challenging)'} — extraction accuracy scales directly with this.</p>}
                <p>Pricing variance benchmark: 1.2% of vendor spend (Xelix 2026, 481M invoices) — modeled conservatively at 0.5%.</p>
                {n(netMargin) > 0 && <p>At {(n(netMargin)*100).toFixed(1)}% net margin, every $1 recovered = ${Math.round(1/n(netMargin))} in equivalent new revenue.</p>}
              </div>
            </div>
          </div>

          {/* Year 1 vs Year 2 — only shown when there's a meaningful difference */}
          {f2y1 !== f2y2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Year 1 vs. Year 2 Labor Impact</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                When a customer isn't already coding at the line-item level, we invest time upfront mapping their SKU base to the right GL codes — this is how the system learns to code automatically. Year 1 absorbs that mapping cost. By Year 2, the recurring categories are mapped, the system has learned your regular vendors and items, and there's no ongoing mapping overhead. The delta between these two numbers is the one-time investment — and it drops off completely in the second year.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-[10px] text-amber-600 uppercase font-bold mb-1">Year 1 (with SKU mapping)</div>
                  <div className="text-xl font-bold text-amber-800">{fmtFull(f2y1)}</div>
                  <p className="text-[11px] text-amber-600 mt-2 leading-relaxed">
                    Includes one-time mapping of your item catalog to GL codes. This is a real cost, and we include it so the model is honest.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="text-[10px] text-emerald-600 uppercase font-bold mb-1">Year 2+ (steady state)</div>
                  <div className="text-xl font-bold text-emerald-800">{fmtFull(f2y2)}</div>
                  <p className="text-[11px] text-emerald-600 mt-2 leading-relaxed">
                    Once mapped, recurring items auto-code without manual review. This is what the system looks like at full performance.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic">
                The difference ({fmtFull(f2y2 - f2y1)}) is the mapping investment — a one-time cost that pays for itself as soon as the catalog stabilizes.
              </p>
            </div>
          )}
            </>
          )}
        </div>
      );

      default: return null;
    }
  };

  // ═══ Save session to Supabase ═══
  const handleSave = async () => {
    setSaveState('saving');
    const fullState = {
      prospectName, phase, showImpact, showSummary, expandedCalcs,
      invoiceVol, invoiceSplitting, digitalPct, lineItems, invoiceTimeline,
      vendorCount, vendorTurnover, storeCount,
      vendorClean, itemCatalog, coaStructure, pricingMaint,
      erp, erpManaged, scanning, techSkills,
      apHeadcount, deptHeadCount, implOwner, timeline, successMetrics,
      apRate, manualMin, codingPractice, storeOpsHrs, gmRate,
      deptHeadCostHrs, deptHeadAdminHrs, deptHeadRate, closeOT, reconHrs,
      growthStores, vendorSpend, dsdSpend, netMargin, ottimateAnnual,
    };
    const payload = {
      prospect_name: prospectName || null,
      mode,
      invoice_vol: n(invoiceVol) || null,
      invoice_splitting: invoiceSplitting || null,
      digital_pct: digitalPct || null,
      line_items: lineItems || null,
      invoice_timeline: invoiceTimeline || null,
      vendor_count: n(vendorCount) || null,
      vendor_turnover: vendorTurnover || null,
      store_count: n(storeCount) || null,
      vendor_clean: vendorClean || null,
      item_catalog: itemCatalog || null,
      coa_structure: coaStructure || null,
      pricing_maint: pricingMaint || null,
      erp: erp || null,
      erp_managed: erpManaged || null,
      scanning: scanning || null,
      tech_skills: techSkills || null,
      impl_owner: implOwner || null,
      timeline: timeline || null,
      success_metrics: successMetrics || null,
      vendor_spend: n(vendorSpend) || null,
      dsd_spend: n(dsdSpend) || null,
      net_margin: n(netMargin) || null,
      ottimate_annual: n(ottimateAnnual) || null,
      qual_score: qualScore,
      qual_level: qualLevel,
      auto_path: autoPath,
      tmdv: tmdv || null,
      net_annual: netAnnual || null,
      payback: payback !== 'N/A' ? parseFloat(payback) : null,
      full_state: fullState,
      updated_at: new Date().toISOString(),
    };
    if (!supabase) { setSaveState('error'); setTimeout(() => setSaveState('idle'), 3000); return; }
    try {
      let token = sessionToken;
      if (token) {
        await supabase.from('grocery_discovery_sessions').update(payload).eq('share_token', token);
        navigator.clipboard.writeText(window.location.href);
      } else {
        const { data, error } = await supabase
          .from('grocery_discovery_sessions')
          .insert(payload)
          .select('share_token')
          .single();
        if (error) { setSaveState('error'); setTimeout(() => setSaveState('idle'), 3000); return; }
        token = data.share_token;
        setSessionToken(token);
        const pageUrl = new URL(window.location.href);
        pageUrl.searchParams.set('session', token);
        window.history.pushState({}, '', pageUrl.toString());
        // Share URL strips mode so prospects see the customer view
        const shareUrl = `${window.location.origin}${window.location.pathname}?session=${token}`;
        navigator.clipboard.writeText(shareUrl);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  // ═══ Main render ═══
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">Ottimate</h1>
            <p className="text-slate-400 text-xs">Grocery Discovery & Impact Workshop</p>
          </div>
          <div className="flex items-center gap-2">
            {prospectName && <span className="text-xs text-slate-400">{prospectName}</span>}
            {isInternal && (
              <button onClick={() => setShowSignals(!showSignals)}
                className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${showSignals ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
                {showSignals ? '● Signals On' : '○ Signals Off'}
              </button>
            )}
            <button onClick={() => setShowImpact(!showImpact)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${showImpact ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              {showImpact ? '● Impact On' : '○ Impact Off'}
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving' || saveState === 'loading'}
              className={`no-print text-[10px] px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 ${
                saveState === 'saved'  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                saveState === 'error'  ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                saveState === 'loading' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
              }`}>
              {saveState === 'saving'  ? '⏳ Saving...' :
               saveState === 'saved'   ? '✓ Link copied!' :
               saveState === 'loading' ? '⏳ Loading...' :
               saveState === 'error'   ? '✗ Error — retry' :
               sessionToken            ? '↑ Save & Copy Link' : '↑ Save Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Impact bar */}
      {showImpact && tmdv > 0 && (
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div><span className="text-[10px] text-slate-400 uppercase">Annual Impact</span><div className="text-sm font-bold text-emerald-400">{fmt(tmdv)}</div></div>
              {n(netMargin) > 0 && <div><span className="text-[10px] text-slate-400 uppercase">Revenue Equivalent</span><div className="text-sm font-bold text-blue-400">{fmt(multiplier)}</div></div>}
              {n(ottimateAnnual) > 0 && tmdv > 0 && <div><span className="text-[10px] text-slate-400 uppercase">Payback</span><div className="text-sm font-bold text-white">{payback} mo</div></div>}
            </div>
            <div className="text-[10px] text-slate-500">Based on what you've shared so far</div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Phase nav */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {activePhases.map((p, i) => (
            <button key={p.id} onClick={() => setPhase(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                i === phase ? 'bg-blue-600 text-white shadow-md' : i < phase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>

        {/* Qual score bar (AE view, signals on, middle phases) */}
        {isInternal && showSignals && phase >= 2 && phase < activePhases.length - 1 && (
          <div className={`mb-4 px-4 py-2 rounded-lg flex items-center justify-between text-xs border ${qualLevel === 'green' ? 'bg-emerald-50 border-emerald-200' : qualLevel === 'yellow' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-slate-600">Onboarding Profile: <span className="font-bold">{qualLabel}</span></span>
            <span className="text-slate-500">{pathNames[autoPath]}</span>
          </div>
        )}

        {/* Phase content */}
        {renderPhase()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pb-8">
          <button onClick={() => canBack && setPhase(phase - 1)} disabled={!canBack}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${canBack ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
            ← Back
          </button>
          <span className="text-xs text-slate-400">{phase + 1} of {activePhases.length}</span>
          <button onClick={() => canNext && setPhase(phase + 1)} disabled={!canNext}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${canNext ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
            {phase === activePhases.length - 2 ? 'See Your Impact →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}