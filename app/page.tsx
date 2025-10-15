"use client";
import React, { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BOOKING_URL = "https://www.advisorrescue.net/appointment";
const BEFORE_COLOR = "#6d9f9b";
const AFTER_COLOR = "#f4a259";

type ScenarioKey = "-25" | "-50" | "-100" | "custom";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function Page() {
  const [scenario, setScenario] = useState<ScenarioKey>("-50");
  const [customBps, setCustomBps] = useState(-50);
  const [showReal, setShowReal] = useState(false);
  const [cpi, setCpi] = useState(0.025);

  const [mmBalance, setMmBalance] = useState(250000);
  const [mmApy, setMmApy] = useState(0.045);
  const [mmBeta, setMmBeta] = useState(0.9);

  const [cdBalance, setCdBalance] = useState(100000);
  const [cdApy, setCdApy] = useState(0.052);
  const [cdMonthsToRenew, setCdMonthsToRenew] = useState(6);
  const [cdPass, setCdPass] = useState(0.7);

  const [bfValue, setBfValue] = useState(300000);
  const [bfSecYield, setBfSecYield] = useState(0.045);
  const [bfDuration, setBfDuration] = useState(5);
  const [bfPass, setBfPass] = useState(0.9);

  const [mygaAmt, setMygaAmt] = useState(150000);
  const [mygaRate, setMygaRate] = useState(0.053);

  const [fiaAmt, setFiaAmt] = useState(200000);
  const [fiaCap, setFiaCap] = useState(0.06);
  const [fiaPar, setFiaPar] = useState(1.7);
  const [fiaRider, setFiaRider] = useState(0.01);
  const [fiaPayout, setFiaPayout] = useState(0.055);

  const [spiaPrem, setSpiaPrem] = useState(150000);
  const [spiaFactor, setSpiaFactor] = useState(0.072);

  const [helocBal, setHelocBal] = useState(0);
  const [helocMargin, setHelocMargin] = useState(0.01);

  const deltaBps = scenario === "custom" ? customBps : parseInt(scenario, 10);
  const dY = deltaBps / 10000;
  const realify = (n: number) => (showReal ? n / (1 + cpi) : n);

  const mmNow = mmBalance * mmApy;
  const mmAfter = mmBalance * Math.max(mmApy + mmBeta * dY, 0);

  const cdNow = cdBalance * cdApy;
  const cdAfter = (() => {
    const apyAfter = Math.max(cdApy + cdPass * dY, 0);
    const wNow = Math.min(Math.max(cdMonthsToRenew / 12, 0), 1);
    return cdBalance * (cdApy * wNow + apyAfter * (1 - wNow));
  })();

  const bfNow = bfValue * bfSecYield;
  const bfAfter = bfValue * Math.max(bfSecYield + bfPass * dY, 0);

  const mygaNow = mygaAmt * mygaRate;
  const mygaAfter = mygaAmt * Math.max(mygaRate + 0.6 * dY, 0);

  const fiaCredNow = Math.min(fiaCap, fiaPar * 0.04);
  const fiaCredAfter = Math.min(Math.max(fiaCap + 0.3 * dY, 0), Math.max((fiaPar + (dY === 0 ? 0 : 0.2 * (dY / Math.abs(dY)))) * 0.04, 0));
  const fiaNow = fiaAmt * fiaCredNow;
  const fiaAfter = fiaAmt * Math.max(fiaCredAfter, 0);
  const fiaIncomeProxy = fiaAmt * fiaPayout - fiaAmt * fiaRider;

  const spiaNow = spiaPrem * spiaFactor;
  const spiaAfter = spiaPrem * (spiaFactor - 0.8 * dY);

  const primeSpread = 0.03;
  const helocNow = -helocBal * (primeSpread + helocMargin);
  const helocAfter = -helocBal * (primeSpread + helocMargin + dY);

  const totalNowNom = mmNow + cdNow + bfNow + mygaNow + fiaNow + spiaNow + helocNow;
  const totalAfterNom = mmAfter + cdAfter + bfAfter + mygaAfter + fiaAfter + spiaAfter + helocAfter;
  const totalNow = realify(totalNowNom);
  const totalAfter = realify(totalAfterNom);
  const delta = totalAfter - totalNow;

  const chartData = useMemo(
    () => [
      { name: "Money Mkt", Before: realify(mmNow), After: realify(mmAfter) },
      { name: "CDs", Before: realify(cdNow), After: realify(cdAfter) },
      { name: "Bond Fund", Before: realify(bfNow), After: realify(bfAfter) },
      { name: "MYGA", Before: realify(mygaNow), After: realify(mygaAfter) },
      { name: "FIA", Before: realify(fiaNow), After: realify(fiaAfter) },
      { name: "SPIA", Before: realify(spiaNow), After: realify(spiaAfter) },
      { name: "HELOC", Before: realify(helocNow), After: realify(helocAfter) }
    ],
    [mmNow, mmAfter, cdNow, cdAfter, bfNow, bfAfter, mygaNow, mygaAfter, fiaNow, fiaAfter, spiaNow, spiaAfter, helocNow, helocAfter, showReal, cpi]
  );

  function openBooking(product: string) {
    const params = new URLSearchParams({
      utm_source: "fedcalc",
      utm_medium: "app",
      utm_campaign: "guaranteed-rates",
      delta_bps: String(deltaBps),
      est_delta_income: String(Math.round(delta)),
      product
    });
    window.open(`${BOOKING_URL}?${params.toString()}`, "_blank");
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", fontFamily: "Inter, system-ui, Arial" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Federal Reserve Rate Impact Calculator</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        See how a rate cut scenario changes your annual income by instrument. Toggle “real” to view inflation-adjusted figures.
      </p>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: 24 }}>
        <div style={card}>
          <h3 style={cardTitle}>Scenario</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <select value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioKey)} style={input}>
                <option value="-25">Conservative: -25 bps</option>
                <option value="-50">Moderate: -50 bps</option>
                <option value="-100">Aggressive: -100 bps</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {scenario === "custom" && (
              <label style={labelRow}>
                <span>Custom Δ (bps)</span>
                <input type="number" value={customBps} onChange={(e) => setCustomBps(parseFloat(e.target.value || "0"))} style={input} />
              </label>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={showReal} onChange={(e) => setShowReal(e.target.checked)} />
              <span>Show real (inflation-adjusted)</span>
            </label>
            {showReal && (
              <label style={labelRow}>
                <span>CPI assumption</span>
                <input type="number" step="0.001" value={cpi} onChange={(e) => setCpi(parseFloat(e.target.value || "0"))} style={input} />
              </label>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Money Market</h3>
          <label style={labelRow}><span>Balance</span><input type="number" value={mmBalance} onChange={(e) => setMmBalance(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>APY</span><input type="number" step="0.001" value={mmApy} onChange={(e) => setMmApy(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Beta to Fed</span><input type="number" step="0.05" value={mmBeta} onChange={(e) => setMmBeta(parseFloat(e.target.value))} style={input} /></label>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>CD Ladder</h3>
          <label style={labelRow}><span>Balance</span><input type="number" value={cdBalance} onChange={(e) => setCdBalance(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>APY</span><input type="number" step="0.001" value={cdApy} onChange={(e) => setCdApy(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Months to Renew</span><input type="number" step="1" value={cdMonthsToRenew} onChange={(e) => setCdMonthsToRenew(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>Pass-through</span><input type="number" step="0.05" value={cdPass} onChange={(e) => setCdPass(parseFloat(e.target.value))} style={input} /></label>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Bond Fund/ETF</h3>
          <label style={labelRow}><span>Value</span><input type="number" value={bfValue} onChange={(e) => setBfValue(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>SEC Yield</span><input type="number" step="0.001" value={bfSecYield} onChange={(e) => setBfSecYield(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Duration</span><input type="number" step="0.5" value={bfDuration} onChange={(e) => setBfDuration(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Yield Pass-through</span><input type="number" step="0.05" value={bfPass} onChange={(e) => setBfPass(parseFloat(e.target.value))} style={input} /></label>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>MYGA</h3>
          <label style={labelRow}><span>Amount</span><input type="number" value={mygaAmt} onChange={(e) => setMygaAmt(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>Rate</span><input type="number" step="0.001" value={mygaRate} onChange={(e) => setMygaRate(parseFloat(e.target.value))} style={input} /></label>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>FIA (simplified)</h3>
          <label style={labelRow}><span>Amount</span><input type="number" value={fiaAmt} onChange={(e) => setFiaAmt(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>Cap</span><input type="number" step="0.001" value={fiaCap} onChange={(e) => setFiaCap(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Participation</span><input type="number" step="0.05" value={fiaPar} onChange={(e) => setFiaPar(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Rider Fee</span><input type="number" step="0.001" value={fiaRider} onChange={(e) => setFiaRider(parseFloat(e.target.value))} style={input} /></label>
          <label style={labelRow}><span>Payout Factor</span><input type="number" step="0.001" value={fiaPayout} onChange={(e) => setFiaPayout(parseFloat(e.target.value))} style={input} /></label>
          <div style={{ fontSize: 12, color: "#666" }}>Income proxy: {currency(fiaIncomeProxy)}</div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>SPIA</h3>
          <label style={labelRow}><span>Premium</span><input type="number" value={spiaPrem} onChange={(e) => setSpiaPrem(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>Payout Factor</span><input type="number" step="0.001" value={spiaFactor} onChange={(e) => setSpiaFactor(parseFloat(e.target.value))} style={input} /></label>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>HELOC</h3>
          <label style={labelRow}><span>Balance</span><input type="number" value={helocBal} onChange={(e) => setHelocBal(+e.target.value)} style={input} /></label>
          <label style={labelRow}><span>Margin over Prime</span><input type="number" step="0.001" value={helocMargin} onChange={(e) => setHelocMargin(parseFloat(e.target.value))} style={input} /></label>
        </div>
      </section>

      <section style={card}>
        <h3 style={cardTitle}>Results Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <KPI label="Annual Income – Before" value={currency(totalNow)} sub={showReal ? "real (inflation-adj.)" : "nominal"} />
          <KPI label="Annual Income – After" value={currency(totalAfter)} sub={`Δ ${deltaBps} bps`} />
          <KPI label="Change ($ / %)" value={`${currency(delta)} / ${((totalAfter - totalNow) / Math.max(totalNow, 1) * 100).toFixed(1)}%`} />
        </div>
        <div style={{ marginTop: 12, color: "#555" }}>
          {delta < 0 ? (
            <div>Rate cuts of {deltaBps} bps are projected to <b>reduce</b> your annual income by {currency(Math.abs(delta))}. Consider locking guaranteed rates.</div>
          ) : (
            <div>Your annual income increases by {currency(delta)} under this scenario. Explore guaranteed options to stabilize outcomes.</div>
          )}
        </div>
        <button onClick={() => openBooking("Guaranteed Rates")} style={primaryBtn}>
          See Guaranteed Rate Options <ArrowRight size={16} />
        </button>
      </section>

      <section style={card}>
        <h3 style={cardTitle}>Visual Comparison</h3>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => currency(v)} />
              <Legend />
              <Bar dataKey="Before" fill={BEFORE_COLOR} />
              <Bar dataKey="After" fill={AFTER_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
        <b>Disclosures:</b> Educational illustration only; not investment, tax, or legal advice. Rates and terms subject to change; not
        guaranteed until a contract is issued. Annuities may include surrender charges, fees, and rider costs. State availability varies.
        Dividends, caps, and participation rates can change. Consult a licensed professional.
      </p>
    </main>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#666" }}>{sub}</div>}
    </div>
  );
}

const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff", marginBottom: 16 };
const cardTitle: React.CSSProperties = { fontSize: 18, fontWeight: 700, marginBottom: 12 };
const labelRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 8, marginBottom: 8 };
const input: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 };
const primaryBtn: React.CSSProperties = { marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, background: "#111", color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", cursor: "pointer" };
