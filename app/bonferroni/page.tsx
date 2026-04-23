'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { calculateBonferroni } from '../../src/lib/ab-calculations';

export default function BonferroniPage() {
  const [alpha, setAlpha] = useState('0.05');
  const [numTests, setNumTests] = useState('5');
  const [hasCalculated, setHasCalculated] = useState(false);

  const correctedAlpha = useMemo(() => {
    const alphaValue = Number(alpha);
    const testsValue = Number(numTests);

    if (!Number.isFinite(alphaValue) || !Number.isFinite(testsValue) || testsValue <= 0) {
      return null;
    }

    return calculateBonferroni(alphaValue, testsValue);
  }, [alpha, numTests]);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasCalculated(true);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">← Back to toolkit</Link>
        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Bonferroni Correction</h1>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <input type="number" min="0" step="any" value={alpha} onChange={(event) => setAlpha(event.target.value)} placeholder="0.05" className="rounded-xl border border-border bg-white px-4 py-3 text-sm"/>
              <input type="number" min="1" step="1" value={numTests} onChange={(event) => setNumTests(event.target.value)} placeholder="5" className="rounded-xl border border-border bg-white px-4 py-3 text-sm"/>
            </div>
            <button type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white md:w-auto">Calculate</button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Result</h2>
          {hasCalculated ? correctedAlpha === null ? <p className="mt-3 text-sm text-muted">Please enter valid numeric values.</p> : <p className="mt-2 text-2xl font-semibold">{correctedAlpha.toPrecision(6)}</p> : <p className="mt-3 text-sm text-muted">Fill inputs and click Calculate.</p>}
        </section>
      </div>
    </main>
  );
}
