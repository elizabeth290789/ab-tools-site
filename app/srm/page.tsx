'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculate_srm_chi_square, parsePercent, validateProbability } from '../../src/lib/ab-calculations';

export default function SrmPage() {
  const [expectedControl, setExpectedControl] = useState('50');
  const [controlUsers, setControlUsers] = useState('10120');
  const [variantUsers, setVariantUsers] = useState('9880');
  const [alpha, setAlpha] = useState('0.05');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculate_srm_chi_square> | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const share = parsePercent(Number(expectedControl));
    const c = Number(controlUsers);
    const v = Number(variantUsers);
    const alphaValue = Number(alpha);

    const alphaError = validateProbability(alphaValue, 'Alpha');
    if (alphaError) {
      setError(alphaError);
      setResult(null);
      return;
    }

    if (!Number.isFinite(share) || share <= 0 || share >= 1) {
      setError('Expected control share (%) must be between 0 and 100.');
      setResult(null);
      return;
    }

    if ([c, v].some((n) => !Number.isFinite(n) || n <= 0)) {
      setError('Observed group sizes must be greater than 0.');
      setResult(null);
      return;
    }

    const expectedShares = [share, 1 - share];
    const expectedSum = expectedShares.reduce((sum, value) => sum + value, 0);
    if (Math.abs(expectedSum - 1) > 1e-9) {
      setError('Expected SRM shares must sum to 1.');
      setResult(null);
      return;
    }

    setResult(calculate_srm_chi_square({ observed: [c, v], expectedShares, alpha: alphaValue }));
    setError(null);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
      <header className="mt-6 border-y border-border py-8"><h1 className="text-3xl font-semibold leading-tight md:text-4xl">SRM Check</h1><p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Quickly detect sample ratio mismatch by comparing expected split with observed variant counts.</p></header>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><form onSubmit={onCalculate} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Expected control share (%)</span><input value={expectedControl} onChange={(e) => setExpectedControl(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Observed control users</span><input value={controlUsers} onChange={(e) => setControlUsers(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Observed variant users</span><input value={variantUsers} onChange={(e) => setVariantUsers(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium"><span>Significance threshold α</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
      </div><button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button></form></section>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><h2 className="text-lg font-semibold">Results</h2>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result ? <div className="mt-3 space-y-1 text-sm text-muted"><p>Chi-square: <strong>{result.chiSquare.toFixed(4)}</strong></p><p>Degrees of freedom: <strong>{result.degreesOfFreedom}</strong></p><p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p><p>Conclusion: <strong>{result.hasSampleRatioMismatch ? 'SRM detected' : 'No SRM detected'}</strong></p></div> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong>.</p>}</section>
    </div></main>
  );
}
