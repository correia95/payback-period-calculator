import { useMemo, useState } from 'react';
import { State, simplePayback, discountedPayback, encodeState, decodeState } from './payback';
import { CURRENCIES, guessCurrency, money } from './intl';

function defaultState(): State {
  return {
    initialInvestment: 1000,
    cashFlows: [400, 400, 400, 400],
    discountRatePercent: 10,
    currency: guessCurrency(),
  };
}

function readInitialState(): State {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) return defaultState();
  return decodeState(params, defaultState());
}

function fmtYears(y: number | null): string {
  if (y === null) return 'Not recovered';
  const years = Math.floor(y);
  const months = Math.round((y - years) * 12);
  if (months === 0) return `${years} yr${years === 1 ? '' : 's'}`;
  return `${years} yr${years === 1 ? '' : 's'} ${months} mo`;
}

export default function App() {
  const [state, setState] = useState<State>(readInitialState);
  const [copied, setCopied] = useState(false);

  const simple = useMemo(() => simplePayback(state.initialInvestment, state.cashFlows), [state.initialInvestment, state.cashFlows]);
  const discounted = useMemo(
    () => discountedPayback(state.initialInvestment, state.cashFlows, state.discountRatePercent),
    [state.initialInvestment, state.cashFlows, state.discountRatePercent],
  );

  function update<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function updateFlow(index: number, value: number) {
    setState((s) => ({ ...s, cashFlows: s.cashFlows.map((f, i) => (i === index ? value : f)) }));
  }

  function addYear() {
    setState((s) => ({ ...s, cashFlows: [...s.cashFlows, s.cashFlows[s.cashFlows.length - 1] ?? 0] }));
  }

  function removeYear(index: number) {
    setState((s) => (s.cashFlows.length <= 1 ? s : { ...s, cashFlows: s.cashFlows.filter((_, i) => i !== index) }));
  }

  async function shareLink() {
    const params = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', `?${params.toString()}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="page">
      <h1>Payback Period Calculator</h1>
      <p className="lede">
        How long it takes for a capital investment's cash flows to recover the initial cost —
        simple and discounted, for uneven annual cash flows.
      </p>

      <section className="panel">
        <h2>Currency</h2>
        <select value={state.currency} onChange={(e) => update('currency', e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      <section className="panel">
        <h2>Investment</h2>
        <div className="field-grid">
          <label className="field">
            <span>Initial investment</span>
            <input type="number" step={100} value={state.initialInvestment} onChange={(e) => update('initialInvestment', e.target.valueAsNumber || 0)} />
          </label>
          <label className="field">
            <span>Discount rate (%, for discounted payback)</span>
            <input type="number" step={0.5} value={state.discountRatePercent} onChange={(e) => update('discountRatePercent', e.target.valueAsNumber || 0)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Annual cash flows</h2>
        {state.cashFlows.map((flow, i) => (
          <div className="tier-row" key={i}>
            <label className="field">
              <span>Year {i + 1}</span>
              <input type="number" step={50} value={flow} onChange={(e) => updateFlow(i, e.target.valueAsNumber || 0)} />
            </label>
            <button type="button" className="remove-btn" onClick={() => removeYear(i)} disabled={state.cashFlows.length <= 1} aria-label="Remove year">×</button>
          </div>
        ))}
        <button type="button" className="add-btn" onClick={addYear}>+ Add year</button>
      </section>

      <section className="result positive">
        <div className="result-row">
          <div><div className="small-label">Simple payback</div><div className="big-num">{fmtYears(simple.paybackYears)}</div></div>
          <div><div className="small-label">Discounted payback</div><div className="big-num">{fmtYears(discounted.paybackYears)}</div></div>
        </div>
        <p className="verdict">
          Investing {money(state.initialInvestment, state.currency)} today, the simple payback ignores
          the time value of money; the discounted payback applies a {state.discountRatePercent}%
          discount rate to each year's cash flow first, which is always the same or later.
        </p>
      </section>

      <div className="actions">
        <button className="share-btn" onClick={shareLink}>{copied ? 'Copied!' : 'Copy share link'}</button>
      </div>

      <section className="explainer">
        <h2>How this works</h2>
        <p>
          Payback period is the point where cumulative cash flows first equal the initial
          investment, found by summing each year's cash flow until the running total crosses the
          investment amount, then interpolating the fraction of that year needed. Discounted payback
          does the same thing, but each year's cash flow is first divided by (1 + discount rate)
          raised to that year's power — reflecting that a dollar received later is worth less today.
          Discounted payback is always the same as or later than simple payback for any positive
          discount rate.
        </p>
        <h2>Frequently asked questions</h2>
        <h3>What if the investment is never paid back?</h3>
        <p>The calculator shows "Not recovered" if the cumulative cash flows across all the years you've entered never reach the initial investment — add more years if you expect it to pay back eventually.</p>
        <h3>Is a shorter payback period always better?</h3>
        <p>Not necessarily — payback period ignores cash flows after the payback point and doesn't measure overall profitability. It's one input among several (like NPV or IRR), not a complete investment decision on its own.</p>
        <h3>What discount rate should I use?</h3>
        <p>Typically your cost of capital or required rate of return — this varies by business and situation, so there's no universal figure.</p>
      </section>
    </main>
  );
}
