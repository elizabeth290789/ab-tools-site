'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type HypothesisType = 'two-sided' | 'one-sided';

type SampleSizeResult = {
  conversionControl: number;
  conversionTreatment: number;
  relativeUplift: number;
  sampleSizePerGroup: number;
  totalSampleSize: number;
};

function inverseNormalCdf(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('p must be between 0 and 1');
  }

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function calculateSampleSizePerGroup(
  p1: number,
  mdePp: number,
  alpha = 0.05,
  power = 0.8,
  hypothesisType: HypothesisType = 'two-sided'
): { n: number; p2: number } {
  const p2 = p1 + mdePp / 100;
  const pBar = (p1 + p2) / 2;

  const zAlpha = hypothesisType === 'two-sided' ? inverseNormalCdf(1 - alpha / 2) : inverseNormalCdf(1 - alpha);
  const zPower = inverseNormalCdf(power);

  const numerator = (
    zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
    zPower * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
  ) ** 2;
  const denominator = (p2 - p1) ** 2;

  const n = numerator / denominator;
  return { n: Math.ceil(n), p2 };
}

export default function SampleSizePage() {
  const [values, setValues] = useState({
    baselineRate: '7',
    mde: '0.5',
    alpha: '0.05',
    power: '0.8',
    hypothesisType: 'two-sided' as HypothesisType
  });
  const [hasCalculated, setHasCalculated] = useState(false);

  const parsed = useMemo(() => {
    const baselinePercent = Number(values.baselineRate);
    const mdePp = Number(values.mde);
    const alpha = Number(values.alpha);
    const power = Number(values.power);

    const isValid =
      Number.isFinite(baselinePercent) &&
      baselinePercent > 0 &&
      baselinePercent < 100 &&
      Number.isFinite(mdePp) &&
      mdePp > 0 &&
      Number.isFinite(alpha) &&
      alpha > 0 &&
      alpha < 1 &&
      Number.isFinite(power) &&
      power > 0 &&
      power < 1;

    if (!isValid) {
      return { valid: false as const, result: null as SampleSizeResult | null };
    }

    const p1 = baselinePercent / 100;
    const { n, p2 } = calculateSampleSizePerGroup(p1, mdePp, alpha, power, values.hypothesisType);

    return {
      valid: true as const,
      result: {
        conversionControl: p1 * 100,
        conversionTreatment: p2 * 100,
        relativeUplift: ((p2 - p1) / p1) * 100,
        sampleSizePerGroup: n,
        totalSampleSize: n * 2
      }
    };
  }, [values]);

  const onCalculate = (event: React.FormEvent<HTMLFormElement>) => {
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
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Sample Size Calculator</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Estimate the number of users needed per variant before running your A/B test.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Current status</p>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            This page keeps the current layout for quick preview and now runs the sample size calculation directly in
            the toolkit.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Baseline conversion rate (%)</span>
                <input
                  value={values.baselineRate}
                  onChange={(event) => setValues((prev) => ({ ...prev, baselineRate: event.target.value }))}
                  placeholder="7"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Minimum detectable effect (pp)</span>
                <input
                  value={values.mde}
                  onChange={(event) => setValues((prev) => ({ ...prev, mde: event.target.value }))}
                  placeholder="0.5"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Alpha</span>
                <input
                  value={values.alpha}
                  onChange={(event) => setValues((prev) => ({ ...prev, alpha: event.target.value }))}
                  placeholder="0.05"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Power</span>
                <input
                  value={values.power}
                  onChange={(event) => setValues((prev) => ({ ...prev, power: event.target.value }))}
                  placeholder="0.8"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                <span>Hypothesis type</span>
                <select
                  value={values.hypothesisType}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, hypothesisType: event.target.value as HypothesisType }))
                  }
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                >
                  <option value="two-sided">two-sided</option>
                  <option value="one-sided">one-sided</option>
                </select>
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
          <h2 className="text-lg font-semibold">Results</h2>
          {hasCalculated ? (
            parsed.valid && parsed.result ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Conversion control</p>
                  <p className="mt-2 text-lg font-medium">{parsed.result.conversionControl.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Conversion treatment</p>
                  <p className="mt-2 text-lg font-medium">{parsed.result.conversionTreatment.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Relative uplift (%)</p>
                  <p className="mt-2 text-lg font-medium">{parsed.result.relativeUplift.toFixed(2)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Sample size per group</p>
                  <p className="mt-2 text-lg font-medium">{parsed.result.sampleSizePerGroup.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-canvas px-4 py-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Total sample size</p>
                  <p className="mt-2 text-lg font-medium">{parsed.result.totalSampleSize.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Check inputs: baseline rate must be in (0, 100), MDE must be positive, and alpha/power must be in (0,
                1).
              </p>
            )
          ) : (
            <p className="mt-3 text-sm text-muted">
              Fill the inputs and click <strong>Calculate</strong> to view a quick output summary.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
