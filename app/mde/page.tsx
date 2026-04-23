'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculate_mde_for_proportion, parsePercent, validateProbability, type Alternative } from '../../src/lib/ab-calculations';

export default function MdePage() {
  const [baselineRate, setBaselineRate] = useState('12');
  const [traffic, setTraffic] = useState('5000');
  const [duration, setDuration] = useState('14');
  const [power, setPower] = useState('80');
  const [alpha, setAlpha] = useState('0.05');
  const [alternative, setAlternative] = useState<Alternative>('two-sided');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const baseline = parsePercent(Number(baselineRate));
    const trafficValue = Number(traffic);
    const durationValue = Number(duration);
    const powerValue = parsePercent(Number(power));
    const alphaValue = Number(alpha);

    const baselineError = validateProbability(baseline, 'Baseline conversion rate');
    const powerError = validateProbability(powerValue, 'Power');
    const alphaError = validateProbability(alphaValue, 'Alpha');

    if (baselineError ?? powerError ?? alphaError) {
      setError(baselineError ?? powerError ?? alphaError);
      setResult(null);
      return;
    }

    if (!Number.isFinite(trafficValue) || !Number.isFinite(durationValue) || trafficValue <= 0 || durationValue <= 0) {
      setError('Traffic and duration must be greater than 0.');
      setResult(null);
      return;
    }

    const nPerGroup = (trafficValue * durationValue) / 2;
    const mde = calculate_mde_for_proportion({
      baselineRate: baseline,
      alpha: alphaValue,
      power: powerValue,
      nPerGroup,
      alternative
    });

    setResult(mde * 100);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
      <header className="mt-6 border-y border-border py-8"><h1 className="text-3xl font-semibold leading-tight md:text-4xl">MDE Calculator</h1><p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Estimate the minimum effect size your test can reliably detect with current traffic and duration.</p></header>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><form onSubmit={onCalculate} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Baseline conversion rate (%)</span><input value={baselineRate} onChange={(e) => setBaselineRate(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Daily traffic (users)</span><input value={traffic} onChange={(e) => setTraffic(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Test duration (days)</span><input value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Power (%)</span><input value={power} onChange={(e) => setPower(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Significance level α</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium"><span>Alternative hypothesis</span><select value={alternative} onChange={(e) => setAlternative(e.target.value as Alternative)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm"><option value="two-sided">Two-sided</option><option value="greater">One-sided (variant &gt; control)</option><option value="less">One-sided (variant &lt; control)</option></select></label>
      <button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button></form></section>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><h2 className="text-lg font-semibold">Results</h2>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result !== null ? <p className="mt-3 text-sm text-muted">Estimated minimum detectable effect: <strong>{result.toFixed(2)}%</strong></p> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong>.</p>}</section>
    </div></main>
  );
}
