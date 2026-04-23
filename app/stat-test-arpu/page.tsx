'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { welch_ttest_from_stats, type Alternative, validateProbability } from '../../src/lib/ab-calculations';

export default function StatTestArpuPage() {
  const [meanControl, setMeanControl] = useState('12.4');
  const [stdControl, setStdControl] = useState('4.8');
  const [nControl, setNControl] = useState('5000');
  const [meanVariant, setMeanVariant] = useState('12.9');
  const [stdVariant, setStdVariant] = useState('4.7');
  const [nVariant, setNVariant] = useState('5100');
  const [alpha, setAlpha] = useState('0.05');
  const [alternative, setAlternative] = useState<Alternative>('two-sided');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof welch_ttest_from_stats> | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const alphaValue = Number(alpha);
    const alphaError = validateProbability(alphaValue, 'Alpha');
    if (alphaError) {
      setError(alphaError);
      setResult(null);
      return;
    }

    const values = [meanControl, stdControl, nControl, meanVariant, stdVariant, nVariant].map(Number);
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      setError('All metrics must be valid positive numbers.');
      setResult(null);
      return;
    }

    setResult(welch_ttest_from_stats({
      meanControl: Number(meanControl),
      stdControl: Number(stdControl),
      nControl: Number(nControl),
      meanVariant: Number(meanVariant),
      stdVariant: Number(stdVariant),
      nVariant: Number(nVariant),
      alpha: alphaValue,
      alternative
    }));
    setError(null);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
      <header className="mt-6 border-y border-border py-8"><h1 className="text-3xl font-semibold leading-tight md:text-4xl">ARPU Statistical Test</h1><p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Compare ARPU for control and variant using Welch's t-test based on summary statistics.</p></header>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><form onSubmit={onCalculate} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Control ARPU mean</span><input value={meanControl} onChange={(e) => setMeanControl(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Control ARPU std</span><input value={stdControl} onChange={(e) => setStdControl(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Control users</span><input value={nControl} onChange={(e) => setNControl(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Variant ARPU mean</span><input value={meanVariant} onChange={(e) => setMeanVariant(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Variant ARPU std</span><input value={stdVariant} onChange={(e) => setStdVariant(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Variant users</span><input value={nVariant} onChange={(e) => setNVariant(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Significance level α</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium"><span>Alternative hypothesis</span><select value={alternative} onChange={(e) => setAlternative(e.target.value as Alternative)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm"><option value="two-sided">Two-sided</option><option value="greater">One-sided (variant &gt; control)</option><option value="less">One-sided (variant &lt; control)</option></select></label>
      <button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button></form></section>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><h2 className="text-lg font-semibold">Results</h2>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result ? <div className="mt-3 space-y-1 text-sm text-muted"><p>Uplift: <strong>{result.uplift === null ? 'n/a' : `${(result.uplift * 100).toFixed(2)}%`}</strong></p><p>t-score: <strong>{result.tScore.toFixed(4)}</strong></p><p>Degrees of freedom: <strong>{result.degreesOfFreedom.toFixed(2)}</strong></p><p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p><p>Conclusion: <strong>{result.isSignificant ? 'Statistically significant' : 'Not statistically significant'}</strong></p></div> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong>.</p>}</section>
    </div></main>
  );
}
