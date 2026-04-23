'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { bonferroniCorrection, validateProbability } from '../../src/lib/ab-calculations';

export default function BonferroniPage() {
  const [alpha, setAlpha] = useState('0.05');
  const [numTests, setNumTests] = useState('5');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const alphaValue = Number(alpha);
    const testsValue = Number(numTests);

    const alphaError = validateProbability(alphaValue, 'Alpha');
    if (alphaError) {
      setError(alphaError);
      setResult(null);
      return;
    }

    if (!Number.isFinite(testsValue) || testsValue <= 0) {
      setError('Number of tests must be greater than 0.');
      setResult(null);
      return;
    }

    setResult(bonferroniCorrection(alphaValue, testsValue));
    setError(null);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
        <header className="mt-6 border-y border-border py-8"><h1 className="text-3xl font-semibold leading-tight md:text-4xl">Bonferroni Correction</h1><p className="mt-3 max-w-2xl text-base text-muted md:text-lg">Use the Bonferroni method to control false positives when you run multiple hypothesis tests. It divides your alpha threshold by the number of tests.</p></header>
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><form onSubmit={onCalculate} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium"><span>Alpha (α)</span><input value={alpha} onChange={(e) => setAlpha(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium"><span>Number of tests</span><input value={numTests} onChange={(e) => setNumTests(e.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm" /></label>
        </div><button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button></form></section>
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8"><h2 className="text-lg font-semibold">Result</h2>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : result !== null ? <p className="mt-3 text-sm text-muted">Corrected alpha (α / tests): <strong>{result.toPrecision(6)}</strong></p> : <p className="mt-3 text-sm text-muted">Fill the inputs and click <strong>Calculate</strong> to get the adjusted alpha threshold.</p>}</section>
      </div>
    </main>
  );
}
