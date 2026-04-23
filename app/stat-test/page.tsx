'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculate_two_proportion_z_test, type Alternative, validateProbability } from '../../src/lib/ab-calculations';

export default function StatTestPage() {
  const [controlConv, setControlConv] = useState('540');
  const [controlUsers, setControlUsers] = useState('5000');
  const [variantConv, setVariantConv] = useState('590');
  const [variantUsers, setVariantUsers] = useState('5100');
  const [alpha, setAlpha] = useState('0.05');
  const [alternative, setAlternative] = useState<Alternative>('two-sided');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculate_two_proportion_z_test> | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cConv = Number(controlConv);
    const cUsers = Number(controlUsers);
    const vConv = Number(variantConv);
    const vUsers = Number(variantUsers);
    const alphaValue = Number(alpha);

    const alphaError = validateProbability(alphaValue, 'Alpha');
    if (alphaError) {
      setError(alphaError);
      setResult(null);
      return;
    }

    if ([cConv, cUsers, vConv, vUsers].some((v) => !Number.isFinite(v) || v <= 0) || cConv > cUsers || vConv > vUsers) {
      setError('Users and conversions must be valid positive numbers, with conversions not exceeding users.');
      setResult(null);
      return;
    }

    setResult(calculate_two_proportion_z_test({
      controlConversions: cConv,
      controlUsers: cUsers,
      variantConversions: vConv,
      variantUsers: vUsers,
      alpha: alphaValue,
      alternative
    }));
    setError(null);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
      <header className="mt-6 border-y border-border py-8"><h1 className="text-3xl font-semibold leading-tight md:text-4xl">Statistical Significance Test</h1><p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Compare control vs variant performance and review a simple significance output block.</p></header>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><form onSubmit={onCalculate} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Control conversions</span><input value={controlConv} onChange={(e) => setControlConv(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Control users</span><input value={controlUsers} onChange={(e) => setControlUsers(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Variant conversions</span><input value={variantConv} onChange={(e) => setVariantConv(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Variant users</span><input value={variantUsers} onChange={(e) => setVariantUsers(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Significance level α</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium"><span>Alternative hypothesis</span><select value={alternative} onChange={(e) => setAlternative(e.target.value as Alternative)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm"><option value="two-sided">Two-sided</option><option value="greater">One-sided (variant &gt; control)</option><option value="less">One-sided (variant &lt; control)</option></select></label>
      <button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button></form></section>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><h2 className="text-lg font-semibold">Results</h2>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result ? <div className="mt-3 space-y-1 text-sm text-muted"><p>Control conversion rate: <strong>{(result.controlRate * 100).toFixed(2)}%</strong></p><p>Variant conversion rate: <strong>{(result.variantRate * 100).toFixed(2)}%</strong></p><p>Uplift: <strong>{result.uplift === null ? 'n/a' : `${(result.uplift * 100).toFixed(2)}%`}</strong></p><p>z-score: <strong>{result.zScore.toFixed(4)}</strong></p><p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p><p>Conclusion: <strong>{result.isSignificant ? 'Statistically significant' : 'Not statistically significant'}</strong></p></div> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong>.</p>}</section>
    </div></main>
  );
}
