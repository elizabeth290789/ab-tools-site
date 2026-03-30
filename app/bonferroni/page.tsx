'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

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

    return alphaValue / testsValue;
  }, [alpha, numTests]);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasCalculated(true);
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to toolkit
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Bonferroni Correction</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Use the Bonferroni method to control false positives when you run multiple hypothesis tests.
            It divides your alpha threshold by the number of tests.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Alpha (α)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={alpha}
                  onChange={(event) => setAlpha(event.target.value)}
                  placeholder="0.05"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Number of tests</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={numTests}
                  onChange={(event) => setNumTests(event.target.value)}
                  placeholder="5"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
            >
              Calculate
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Result</h2>
          {hasCalculated ? (
            correctedAlpha === null ? (
              <p className="mt-3 text-sm text-muted">Please enter valid numeric values.</p>
            ) : (
              <div className="mt-4 rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Corrected alpha (α / tests)</p>
                <p className="mt-2 text-2xl font-semibold">{correctedAlpha.toPrecision(6)}</p>
              </div>
            )
          ) : (
            <p className="mt-3 text-sm text-muted">
              Fill the inputs and click <strong>Calculate</strong> to get the adjusted alpha threshold.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
