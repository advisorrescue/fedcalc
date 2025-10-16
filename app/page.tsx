"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RefreshCw, Printer, Settings, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const BEFORE_COLOR = "#6d9f9b";
const AFTER_COLOR = "#f4a259";
const BOOKING_URL = "https://www.advisorrescue.net/appointment";

const STATE_PRESETS: Record<string, { mm_apy: number; cd_1y: number; myga_3y: number; myga_5y: number; fia_cap: number; fia_par: number; spia_factor_65: number; }> = {
  FL: { mm_apy: 0.045, cd_1y: 0.052, myga_3y: 0.051, myga_5y: 0.053, fia_cap: 0.06, fia_par: 1.75, spia_factor_65: 0.072 },
  CA: { mm_apy: 0.043, cd_1y: 0.050, myga_3y: 0.049, myga_5y: 0.051, fia_cap: 0.055, fia_par: 1.6, spia_factor_65: 0.071 },
  TX: { mm_apy: 0.045, cd_1y: 0.052, myga_3y: 0.051, myga_5y: 0.053, fia_cap: 0.06, fia_par: 1.7, spia_factor_65: 0.073 },
  NY: { mm_apy: 0.041, cd_1y: 0.047, myga_3y: 0.046, myga_5y: 0.049, fia_cap: 0.052, fia_par: 1.6, spia_factor_65: 0.069 },
  WA: { mm_apy: 0.044, cd_1y: 0.051, myga_3y: 0.050, myga_5y: 0.052, fia_cap: 0.057, fia_par: 1.68, spia_factor_65: 0.071 },
  GA: { mm_apy: 0.045, cd_1y: 0.052, myga_3y: 0.051, myga_5y: 0.053, fia_cap: 0.059, fia_par: 1.72, spia_factor_65: 0.072 },
  IL: { mm_apy: 0.043, cd_1y: 0.050, myga_3y: 0.049, myga_5y: 0.051, fia_cap: 0.056, fia_par: 1.65, spia_factor_65: 0.070 },
};

const fmt = (v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

type ScenarioKey = "-25" | "-50" | "-100" | "custom";
interface MoneyMarketInput { balance: number; apy: number; beta: number; include: boolean; }
interface CDRow { balance: number; apy: number; monthsToRenew: number; passthrough: number; }
interface BondFundInput { value: number; secYield: number; duration: number; passthrough: number; include: boolean; }
interface MYGAInput { amount: number; rate: number; term: number; include: boolean; }
interface FIAInput { amount: number; cap: number; par: number; riderFee: number; payoutFactor: number; startAge: number; include: boolean; }
interface SPIAInput { premium: number; age: number; payoutFactor: number; include: boolean; }
interface HELOCInput { balance: number; margin: number; include: boolean; }

const ROF_MYGA_RATES = {
  0: { 3: 0.0565, 5: 0.0600, 7: 0.0600, 10: 0.0600 },
  1: { 3: 0.0555, 5: 0.0590, 7: 0.0590, 10: 0.0590 },
  2: { 3: 0.0545, 5: 0.0580, 7: 0.0580, 10: 0.0580 },
} as const;

type MygaTerm = 3 | 5 | 7 | 10;

export default function Page() {
  const [stateCode, setStateCode] = useState<string>("FL");
  const [myga, setMYGA] = useState<{ amount: number; rate: number; term: MygaTerm; include: boolean }>({
  amount: 150000,
  rate: ROF_MYGA_RATES[0][5],
  term: 5,
  include: true,
});
const [mygaRiders, setMygaRiders] = useState<0 | 1 | 2>(0);

React.useEffect(() => {
  setMYGA((s) => ({ ...s, rate: ROF_MYGA_RATES[mygaRiders][s.term] }));
}, [mygaRiders, myga.term]);

  const [scenario, setScenario] = useState<ScenarioKey>("-50");
  const [customDeltaBps, setCustomDeltaBps] = useState<number>(-50);
  const [showReal, setShowReal] = useState<boolean>(false);
  const [cpi, setCpi] = useState<number>(0.025);

  const [mm, setMM] = useState<MoneyMarketInput>({ balance: 250000, apy: STATE_PRESETS.FL.mm_apy, beta: 0.9, include: true });
  const [cds, setCDs] = useState<CDRow[]>([{ balance: 100000, apy: STATE_PRESETS.FL.cd_1y, monthsToRenew: 6, passthrough: 0.7 }]);
  const [bondFund, setBondFund] = useState<BondFundInput>({ value: 300000, secYield: 0.045, duration: 5, passthrough: 0.9, include: true });
  const [fia, setFIA] = useState<FIAInput>({ amount: 200000, cap: STATE_PRESETS.FL.fia_cap, par: STATE_PRESETS.FL.fia_par, riderFee: 0.01, payoutFactor: 0.055, startAge: 65, include: true });
  const [spia, setSPIA] = useState<SPIAInput>({ premium: 150000, age: 65, payoutFactor: STATE_PRESETS.FL.spia_factor_65, include: false });
  const [heloc, setHELOC] = useState<HELOCInput>({ balance: 0, margin: 0.01, include: false });

  const [leadOpen, setLeadOpen] = useState<boolean>(false);
  const [leadProduct, setLeadProduct] = useState<string>("Guaranteed Rates");
  const [leadName, setLeadName] = useState<string>("");
  const [leadEmail, setLeadEmail] = useState<string>("");
  const [leadPhone, setLeadPhone] = useState<string>("");
  const [leadConsent, setLeadConsent] = useState<boolean>(true);

  const deltaBps = useMemo(() => (scenario === "custom" ? customDeltaBps : parseInt(scenario, 10)), [scenario, customDeltaBps]);
  const deltaY = useMemo(() => deltaBps / 10000, [deltaBps]);
  const realify = useMemo(() => (n: number) => (showReal ? n / (1 + cpi) : n), [showReal, cpi]);

  const loadPresets = () => {
    const p = STATE_PRESETS[stateCode];
    setMM((s) => ({ ...s, apy: p.mm_apy }));
    setCDs((rows) => rows.map((r) => ({ ...r, apy: p.cd_1y })));
    setMYGA((s) => ({ ...s, rate: ROF_MYGA_RATES[mygaRiders][s.term] }));
    setFIA((s) => ({ ...s, cap: p.fia_cap, par: p.fia_par }));
    setSPIA((s) => ({ ...s, payoutFactor: p.spia_factor_65 }));
  };

  const mmNow = useMemo(() => (mm.include ? mm.balance * mm.apy : 0), [mm]);
  const mmAfter = useMemo(() => (mm.include ? mm.balance * Math.max(mm.apy + mm.beta * deltaY, 0) : 0), [mm, deltaY]);

  const cdNow = useMemo(() => cds.reduce((acc, r) => acc + r.balance * r.apy, 0), [cds]);
  const cdAfter = useMemo(() => cds.reduce((acc, r) => {
    const apyAfter = Math.max(r.apy + r.passthrough * deltaY, 0);
    const wNow = Math.min(Math.max(r.monthsToRenew / 12, 0), 1);
    const wAfter = 1 - wNow;
    return acc + r.balance * (r.apy * wNow + apyAfter * wAfter);
  }, 0), [cds, deltaY]);

  const bfNow = useMemo(() => (bondFund.include ? bondFund.value * bondFund.secYield : 0), [bondFund]);
  const bfAfter = useMemo(() => (bondFund.include ? bondFund.value * Math.max(bondFund.secYield + bondFund.passthrough * deltaY, 0) : 0), [bondFund, deltaY]);
  const bfPricePL = useMemo(() => (bondFund.include ? bondFund.value * (-bondFund.duration * deltaY) : 0), [bondFund, deltaY]);

  const mygaNow = useMemo(() => (myga.include ? myga.amount * myga.rate : 0), [myga]);
  const mygaAfter = useMemo(() => (myga.include ? myga.amount * Math.max(myga.rate + 0.6 * deltaY, 0) : 0), [myga, deltaY]);

  const fiaExpCreditNow = useMemo(() => Math.min(fia.cap, fia.par * 0.04), [fia]);
  const fiaExpCreditAfter = useMemo(() => {
    const sign = deltaY === 0 ? 0 : deltaY / Math.abs(deltaY);
    const capAdj = Math.max(fia.cap + 0.3 * deltaY, 0);
    const parAdj = Math.max((fia.par + 0.2 * sign) * 0.04, 0);
    return Math.min(capAdj, parAdj);
  }, [fia, deltaY]);
  const fiaNow = useMemo(() => (fia.include ? fia.amount * fiaExpCreditNow : 0), [fia, fiaExpCreditNow]);
  const fiaAfter = useMemo(() => (fia.include ? fia.amount * Math.max(fiaExpCreditAfter, 0) : 0), [fia, fiaExpCreditAfter]);
  const fiaIncomeProxy = useMemo(() => (fia.include ? fia.amount * fia.payoutFactor - fia.amount * fia.riderFee : 0), [fia]);

  const spiaNow = useMemo(() => (spia.include ? spia.premium * spia.payoutFactor : 0), [spia]);
  const spiaAfter = useMemo(() => (spia.include ? spia.premium * (spia.payoutFactor - 0.8 * deltaY) : 0), [spia, deltaY]);

  const primeSpread = 0.03;
  const helocNow = useMemo(() => (heloc.include ? -heloc.balance * (primeSpread + heloc.margin) : 0), [heloc]);
  const helocAfter = useMemo(() => (heloc.include ? -heloc.balance * (primeSpread + heloc.margin + deltaY) : 0), [heloc, deltaY]);

  const totalNowNominal = useMemo(() => mmNow + cdNow + bfNow + mygaNow + fiaNow + spiaNow + helocNow, [mmNow, cdNow, bfNow, mygaNow, fiaNow, spiaNow, helocNow]);
  const totalAfterNominal = useMemo(() => mmAfter + cdAfter + bfAfter + mygaAfter + fiaAfter + spiaAfter + helocAfter, [mmAfter, cdAfter, bfAfter, mygaAfter, fiaAfter, spiaAfter, helocAfter]);
  const totalNow = useMemo(() => realify(totalNowNominal), [realify, totalNowNominal]);
  const totalAfter = useMemo(() => realify(totalAfterNominal), [realify, totalAfterNominal]);
  const delta = useMemo(() => totalAfter - totalNow, [totalAfter, totalNow]);

  const chartData = useMemo(() => ([
    { name: "Money Mkt", Before: realify(mmNow), After: realify(mmAfter) },
    { name: "CDs", Before: realify(cdNow), After: realify(cdAfter) },
    { name: "Bond Fund", Before: realify(bfNow), After: realify(bfAfter) },
    { name: "MYGA", Before: realify(mygaNow), After: realify(mygaAfter) },
    { name: "FIA (cred)", Before: realify(fiaNow), After: realify(fiaAfter) },
    { name: "SPIA", Before: realify(spiaNow), After: realify(spiaAfter) },
    { name: "HELOC", Before: realify(helocNow), After: realify(helocAfter) },
  ]), [mmNow, mmAfter, cdNow, cdAfter, bfNow, bfAfter, mygaNow, mygaAfter, fiaNow, fiaAfter, spiaNow, spiaAfter, helocNow, helocAfter, realify]);

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-900">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <span className="font-semibold">Tools</span>
            <div className="w-px h-5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <Label className="text-sm">State</Label>
              <Select value={stateCode} onValueChange={(v) => setStateCode(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_PRESETS).map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="secondary" className="gap-2" onClick={loadPresets}><RefreshCw className="h-4 w-4"/> Load Representative Rates</Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4"/> Print / Export PDF</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 py-6">
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Scenario Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="-25">Conservative<br/>-25 bps</TabsTrigger>
                  <TabsTrigger value="-50">Moderate<br/>-50 bps</TabsTrigger>
                  <TabsTrigger value="-100">Aggressive<br/>-100 bps</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
              {scenario === "custom" && (
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <Label>Custom Δ (bps)</Label>
                    <Input type="number" value={customDeltaBps} onChange={(e) => setCustomDeltaBps(parseFloat(e.target.value || "0"))} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={showReal} onCheckedChange={setShowReal} />
                    <Label>Show real (inflation-adjusted)</Label>
                  </div>
                </div>
              )}
              {scenario !== "custom" && (
                <div className="flex items-center gap-3">
                  <Switch checked={showReal} onCheckedChange={setShowReal} />
                  <Label>Show real (inflation-adjusted)</Label>
                  {showReal && (
                    <div className="flex items-center gap-2 ml-4">
                      <Label>CPI assumption</Label>
                      <Input className="w-24" type="number" step="0.001" value={cpi} onChange={(e) => setCpi(parseFloat(e.target.value || "0"))} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <InstrumentCard title="Money Market / Savings" include={mm.include} onToggle={(v) => setMM({ ...mm, include: v })}>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Balance" value={mm.balance} onChange={(v) => setMM({ ...mm, balance: v })} prefix="$" />
              <Num label="APY" value={mm.apy} onChange={(v) => setMM({ ...mm, apy: v })} percent />
              <Num label="Beta to Fed" value={mm.beta} onChange={(v) => setMM({ ...mm, beta: v })} step={0.05} />
            </div>
          </InstrumentCard>

          <InstrumentCard title="CD Ladder" subtitle="Renewal pass-through controls how much cuts flow into renewal rates.">
            <div className="space-y-3">
              {cds.map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                  <Num label="Balance" value={row.balance} onChange={(v) => patchCD(idx, { balance: v })} prefix="$" />
                  <Num label="APY" value={row.apy} onChange={(v) => patchCD(idx, { apy: v })} percent />
                  <Num label="Months to Renew" value={row.monthsToRenew} onChange={(v) => patchCD(idx, { monthsToRenew: v })} step={1} />
                  <Num label="Pass-through" value={row.passthrough} onChange={(v) => patchCD(idx, { passthrough: v })} step={0.05} />
                  <Button variant="outline" onClick={() => removeCD(idx)}>Remove</Button>
                </div>
              ))}
              <div>
                <Button variant="secondary" onClick={addCD}>+ Add CD</Button>
              </div>
            </div>
          </InstrumentCard>

          <InstrumentCard title="Bond Fund / ETF" include={bondFund.include} onToggle={(v) => setBondFund({ ...bondFund, include: v })}>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Value" value={bondFund.value} onChange={(v) => setBondFund({ ...bondFund, value: v })} prefix="$" />
              <Num label="SEC Yield" value={bondFund.secYield} onChange={(v) => setBondFund({ ...bondFund, secYield: v })} percent />
              <Num label="Duration" value={bondFund.duration} onChange={(v) => setBondFund({ ...bondFund, duration: v })} step={0.5} />
              <Num label="Yield Pass-through" value={bondFund.passthrough} onChange={(v) => setBondFund({ ...bondFund, passthrough: v })} step={0.05} />
            </div>
          </InstrumentCard>

          <InstrumentCard title="MYGA (Multi-Year Guaranteed Annuity)" include={myga.include} onToggle={(v) => setMYGA({ ...myga, include: v })}>
  <div className="grid grid-cols-3 gap-3">
    <Num label="Amount" value={myga.amount} onChange={(v) => setMYGA({ ...myga, amount: v })} prefix="$" />
    <div className="space-y-1">
      <Label className="text-xs">Term (yrs)</Label>
      <Select value={String(myga.term)} onValueChange={(v) => setMYGA({ ...myga, term: Number(v) as MygaTerm })}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3</SelectItem>
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="7">7</SelectItem>
          <SelectItem value="10">10</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Optional Riders</Label>
      <Select value={String(mygaRiders)} onValueChange={(v) => setMygaRiders(Number(v) as 0 | 1 | 2)}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">None</SelectItem>
          <SelectItem value="1">One</SelectItem>
          <SelectItem value="2">Two</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
  <div className="mt-2 text-xs text-gray-600">
    Carrier table (ROF DirectGrowth): {myga.term}y • {mygaRiders === 0 ? "no riders" : mygaRiders === 1 ? "one rider" : "two riders"} • {(ROF_MYGA_RATES[mygaRiders][myga.term] * 100).toFixed(2)}%
  </div>
  <div className="grid grid-cols-3 gap-3 mt-2">
    <Num label="Rate (auto from table)" value={myga.rate} onChange={(v) => setMYGA({ ...myga, rate: v })} percent />
  </div>
</InstrumentCard>

          <InstrumentCard title="FIA (Fixed Indexed Annuity) – Simplified" include={fia.include} onToggle={(v) => setFIA({ ...fia, include: v })} subtitle="Illustrative expected credit and income proxy; caps/pars can change.">
            <div className="grid grid-cols-3 gap-3">
              <Num label="Amount" value={fia.amount} onChange={(v) => setFIA({ ...fia, amount: v })} prefix="$" />
              <Num label="Cap" value={fia.cap} onChange={(v) => setFIA({ ...fia, cap: v })} percent />
              <Num label="Participation" value={fia.par} onChange={(v) => setFIA({ ...fia, par: v })} step={0.05} />
              <Num label="Rider Fee" value={fia.riderFee} onChange={(v) => setFIA({ ...fia, riderFee: v })} percent />
              <Num label="Payout Factor" value={fia.payoutFactor} onChange={(v) => setFIA({ ...fia, payoutFactor: v })} percent />
              <Num label="Start Age" value={fia.startAge} onChange={(v) => setFIA({ ...fia, startAge: v })} step={1} />
            </div>
          </InstrumentCard>

          <InstrumentCard title="SPIA (Single Premium Immediate Annuity) – Proxy" include={spia.include} onToggle={(v) => setSPIA({ ...spia, include: v })}>
            <div className="grid grid-cols-3 gap-3">
              <Num label="Premium" value={spia.premium} onChange={(v) => setSPIA({ ...spia, premium: v })} prefix="$" />
              <Num label="Age" value={spia.age} onChange={(v) => setSPIA({ ...spia, age: v })} step={1} />
              <Num label="Payout Factor" value={spia.payoutFactor} onChange={(v) => setSPIA({ ...spia, payoutFactor: v })} percent />
            </div>
          </InstrumentCard>

          <InstrumentCard title="HELOC (optional)" include={heloc.include} onToggle={(v) => setHELOC({ ...heloc, include: v })}>
            <div className="grid grid-cols-3 gap-3">
              <Num label="Balance" value={heloc.balance} onChange={(v) => setHELOC({ ...heloc, balance: v })} prefix="$" />
              <Num label="Margin over Prime" value={heloc.margin} onChange={(v) => setHELOC({ ...heloc, margin: v })} step={0.005} />
            </div>
          </InstrumentCard>
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI label="Annual Income – Before" value={fmt(totalNow)} sub={showReal ? "real (inflation-adj.)" : "nominal"} />
                <KPI label="Annual Income – After" value={fmt(totalAfter)} sub={`Δ ${deltaBps} bps`} />
                <KPI label="Change ($ / %)" value={`${fmt(delta)} / ${((totalAfter - totalNow) / Math.max(totalNow, 1) * 100).toFixed(1)}%`} highlight={delta < 0} />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {delta < 0 ? (
                  <p>Rate cuts at {deltaBps} bps are projected to <b>reduce</b> your annual income by {fmt(Math.abs(delta))}. Consider locking today’s guaranteed rates.</p>
                ) : (
                  <p>Your projected annual income <b>increases</b> by {fmt(Math.abs(delta))} under this scenario. Review guaranteed options to stabilize outcomes.</p>
                )}
              </div>
              <div className="mt-4">
                <Button className="gap-2" onClick={() => { setLeadProduct("Guaranteed Rates"); setLeadOpen(true); }}>
                  See Guaranteed Rate Options <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>

          <ReadoutCard title="Money Market" before={mmNow} after={mmAfter} note={`β=${mm.beta}.`} />
          <ReadoutCard title="CD Ladder" before={cdNow} after={cdAfter} note={`Weighted by months-to-renew.`} />
          <ReadoutCard title="Bond Fund" before={bfNow} after={bfAfter} note={`Duration ~${bondFund.duration}. Price P&L (est): ${fmt(bfPricePL)}.`} />
          <ReadoutCard title="MYGA" before={mygaNow} after={mygaAfter} note={`Term ${myga.term} yrs.`} onCta={() => { setLeadProduct('MYGA'); setLeadOpen(true); }} />
          <ReadoutCard title="FIA (expected credit)" before={fiaNow} after={fiaAfter} note={`Income proxy: ${fmt(fiaIncomeProxy)} (if activated).`} onCta={() => { setLeadProduct('FIA'); setLeadOpen(true); }} />
          {spia.include && <ReadoutCard title="SPIA" before={spiaNow} after={spiaAfter} note={`Payout factor may shift with carrier discount rates.`} onCta={() => { setLeadProduct('SPIA'); setLeadOpen(true); }} />}
          {heloc.include && <ReadoutCard title="HELOC (cost)" before={helocNow} after={helocAfter} note={`Prime ~ Fed Funds + 3%.`} onCta={() => { setLeadProduct('HELOC'); setLeadOpen(true); }} />}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Visual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Before" fill={BEFORE_COLOR} />
                    <Bar dataKey="After" fill={AFTER_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-0">
            <CardContent className="text-xs text-gray-500 space-y-2">
              <p><b>Disclosures:</b> Educational illustration only; not investment, tax, or legal advice. Rates and terms subject to change; not guaranteed until a contract is issued. Annuities may include surrender charges, fees, and rider costs. State availability varies. Dividends, caps, and participation rates can change. Consult a licensed professional. Calculations use user inputs and representative assumptions as of the calculation date.</p>
              <p>© {new Date().getFullYear()} Advisor Rescue Marketing • Plan Life Right</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Get Guaranteed Rate Options</DialogTitle>
            <DialogDescription>
              Tell us where to send your custom quotes. We’ll also give you fast access to book a call.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Name</Label>
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="First Last" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <Label>Phone (optional)</Label>
              <Input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <Label>State</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATE_PRESETS).map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interest</Label>
              <Input readOnly value={leadProduct} />
            </div>
            <div className="sm:col-span-2 text-xs text-gray-600 flex items-center gap-2 mt-2">
              <Switch checked={leadConsent} onCheckedChange={setLeadConsent} />
              <span>I agree to be contacted about quotes and scheduling. Privacy-safe, no spam.</span>
            </div>
            <div className="sm:col-span-2 text-xs text-gray-500">
              <span>Summary: Δ income {fmt(delta)} at {deltaBps} bps; State {stateCode}.</span>
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setLeadOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const params = new URLSearchParams({
                utm_source: 'fedcalc',
                utm_medium: 'app',
                utm_campaign: 'guaranteed-rates',
                state: stateCode,
                delta_bps: String(deltaBps),
                est_delta_income: String(Math.round(delta)),
                product: leadProduct,
                name: leadName,
                email: leadEmail,
                phone: leadPhone,
              });
              const url = `${BOOKING_URL}?${params.toString()}`;
              window.open(url, '_blank');
              setLeadOpen(false);
            }} className="gap-2">
              Continue to Booking <ArrowRight className="h-4 w-4"/>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function addCD() {
    setCDs((rows) => [...rows, { balance: 50000, apy: STATE_PRESETS[stateCode].cd_1y, monthsToRenew: 12, passthrough: 0.7 }]);
  }
  function removeCD(idx: number) {
    setCDs((rows) => rows.filter((_, i) => i !== idx));
  }
  function patchCD(idx: number, patch: Partial<CDRow>) {
    setCDs((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
}

function KPI({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function ReadoutCard({ title, before, after, note, onCta }: { title: string; before: number; after: number; note?: string; onCta?: () => void }) {
  const delta = after - before;
  const pct = (after - before) / Math.max(before, 1);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: title, Before: before, After: after }]}>
                  <XAxis dataKey="name" hide/>
                  <YAxis hide/>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Before" fill={BEFORE_COLOR} />
                  <Bar dataKey="After" fill={AFTER_COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Before</span><span className="font-medium">{fmt(before)}</span></div>
            <div className="flex justify-between"><span>After</span><span className="font-medium">{fmt(after)}</span></div>
            <div className={`flex justify-between ${delta < 0 ? 'text-orange-600' : 'text-emerald-700'}`}>
              <span>Δ ($ / %)</span><span className="font-medium">{fmt(delta)} / {(pct*100).toFixed(1)}%</span>
            </div>
            {note && <div className="text-xs text-gray-500 mt-1">{note}</div>}
            <div className="pt-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={onCta}>See options</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InstrumentCard({ title, subtitle, children, include = true, onToggle }: { title: string; subtitle?: string; children: React.ReactNode; include?: boolean; onToggle?: (v: boolean) => void; }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {typeof include === 'boolean' && typeof onToggle === 'function' && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Include</Label>
            <Switch checked={include} onCheckedChange={onToggle} />
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Num({ label, value, onChange, step = 0.01, prefix, percent }: { label: string; value: number; onChange: (v: number) => void; step?: number; prefix?: string; percent?: boolean }) {
  // ✅ initialize with two decimals if percent
  const [text, setText] = React.useState<string>(() => percent ? (value * 100).toFixed(2) : value.toString());

  // ✅ keep in sync, rounded
  React.useEffect(() => {
    setText(percent ? (value * 100).toFixed(2) : value.toString());
  }, [value, percent]);

  const parse = (s: string) => {
    let v = parseFloat(s || "0");
    if (Number.isNaN(v)) v = 0;
    return percent ? v / 100 : v;
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const v = parse(text);
            onChange(v);
            // ✅ reformat rounded after losing focus
            setText(percent ? (v * 100).toFixed(2) : v.toString());
          }}
          type="number"
          step={step}
        />
        {percent && <span className="text-sm text-gray-500">%</span>}
      </div>
    </div>
  );
}
