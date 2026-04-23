'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculate_sample_size_per_group, parsePercent, validateProbability, type Alternative } from '../../src/lib/ab-calculations';

export default function SampleSizePage() {
  const [baselineRate, setBaselineRate] = useState('10');
  const [mde, setMde] = useState('5');
  const [power, setPower] = useState('80');
  const [alpha, setAlpha] = useState('0.05');
  const [alternative, setAlternative] = useState<Alternative>('two-sided');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const baseline = parsePercent(Number(baselineRate));
    const mdeValue = parsePercent(Number(mde));
    const powerValue = parsePercent(Number(power));
    const alphaValue = Number(alpha);

    const baselineError = validateProbability(baseline, 'Baseline conversion rate');
    const alphaError = validateProbability(alphaValue, 'Alpha');
    const powerError = validateProbability(powerValue, 'Power');

    if (baselineError ?? alphaError ?? powerError) {
      setError(baselineError ?? alphaError ?? powerError);
      setResult(null);
      return;
    }

    if (!Number.isFinite(mdeValue) || mdeValue <= 0) {
      setError('MDE must be greater than 0.');
      setResult(null);
      return;
    }

    const calculation = calculate_sample_size_per_group({
      baselineRate: baseline,
      mde: mdeValue,
      alpha: alphaValue,
      power: powerValue,
      alternative
    });

    setError(null);
    setResult(calculation.nPerGroup);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Sample Size Calculator</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Estimate the number of users needed per variant before running your A/B test.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium"><span>Baseline conversion rate (%)</span><input value={baselineRate} onChange={(e) => setBaselineRate(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
              <label className="flex flex-col gap-2 text-sm font-medium"><span>Minimum detectable effect (%)</span><input value={mde} onChange={(e) => setMde(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
              <label className="flex flex-col gap-2 text-sm font-medium"><span>Power (%)</span><input value={power} onChange={(e) => setPower(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
              <label className="flex flex-col gap-2 text-sm font-medium"><span>Significance level α</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Alternative hypothesis</span>
              <select value={alternative} onChange={(e) => setAlternative(e.target.value as Alternative)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm">
                <option value="two-sided">Two-sided</option>
                <option value="greater">One-sided (variant &gt; control)</option>
                <option value="less">One-sided (variant &lt; control)</option>
              </select>
            </label>
            <button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Results</h2>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result !== null ? <p className="mt-3 text-sm text-muted">Required sample size per group: <strong>{result.toLocaleString()}</strong></p> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong>.</p>}
        </section>
      </div>
    </main>
  );
}
