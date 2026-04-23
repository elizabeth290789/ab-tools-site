'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

type Scenario = 'custom' | 'abc';

export default function BonferroniPage() {
  const [alpha, setAlpha] = useState('0.05');
  const [scenario, setScenario] = useState<Scenario>('abc');
  const [customComparisons, setCustomComparisons] = useState('3');
  const [hasCalculated, setHasCalculated] = useState(false);

  const comparisons = useMemo(() => {
    if (scenario === 'abc') {
      return 2;
    }

    const parsedComparisons = Number(customComparisons);
    if (!Number.isFinite(parsedComparisons) || parsedComparisons <= 0) {
      return null;
    }

    return parsedComparisons;
  }, [customComparisons, scenario]);

  const correctedAlpha = useMemo(() => {
    const parsedAlpha = Number(alpha);

    if (!Number.isFinite(parsedAlpha) || parsedAlpha <= 0 || parsedAlpha >= 1 || comparisons === null) {
      return null;
    }

    return parsedAlpha / comparisons;
  }, [alpha, comparisons]);

  const onCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasCalculated(true);
  };

  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) {
      return '—';
    }

    return Number(value.toFixed(6)).toString();
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
            При множественных сравнениях вероятность ложноположительного результата растёт. Коррекция
            Бонферрони снижает уровень значимости, деля его на количество сравнений.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Alpha (α)</span>
              <input
                type="number"
                min="0.000001"
                max="0.999999"
                step="any"
                value={alpha}
                onChange={(event) => setAlpha(event.target.value)}
                placeholder="0.05"
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Сценарий</span>
              <select
                value={scenario}
                onChange={(event) => setScenario(event.target.value as Scenario)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              >
                <option value="abc">A/B/C тест (3 варианта)</option>
                <option value="custom">Свое количество сравнений</option>
              </select>
            </label>

            {scenario === 'custom' ? (
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Количество сравнений (k)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customComparisons}
                  onChange={(event) => setCustomComparisons(event.target.value)}
                  placeholder="3"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-muted">
                Для A/B/C теста используется k = 2 (A vs B, A vs C).
              </div>
            )}

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
            correctedAlpha === null || comparisons === null ? (
              <p className="mt-3 text-sm text-muted">Введите корректные значения alpha и k.</p>
            ) : (
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-sm">alpha = {formatValue(Number(alpha))}</p>
                <p className="text-sm">k = {comparisons}</p>
                <p className="text-sm font-semibold">corrected alpha = {formatValue(correctedAlpha)}</p>
              </div>
            )
          ) : (
            <p className="mt-3 text-sm text-muted">
              Fill the inputs and click <strong>Calculate</strong>.
            </p>
          )}

          <p className="mt-4 text-sm text-muted">
            Коррекция Бонферрони консервативна и может снижать мощность теста.
          </p>
        </section>
      </div>
    </main>
  );
}
