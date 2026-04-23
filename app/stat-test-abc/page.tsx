'use client';

import Link from 'next/link';
import { useState } from 'react';

type HypothesisType = 'two-sided' | 'one-sided';

type PairResult = {
  p1: number;
  p2: number;
  diff: number;
  uplift: number | null;
  z: number;
  pValue: number;
  ciLow: number;
  ciHigh: number;
  isSignificant: boolean;
};

type CalculationResult = {
  alpha: number;
  comparisons: number;
  correctedAlpha: number;
  avsB: PairResult;
  avsC: PairResult;
};

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function inverseNormalCdf(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('p must be between 0 and 1');
  }

  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];

  const plow = 0.02425;
  const phigh = 1 - plow;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatPp(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)} п.п.`;
}

function calculatePair(
  n1: number,
  x1: number,
  n2: number,
  x2: number,
  hypothesisType: HypothesisType,
  correctedAlpha: number
): PairResult | null {
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const diff = p2 - p1;
  const uplift = p1 === 0 ? null : diff / p1;

  const pPool = (x1 + x2) / (n1 + n2);
  const sePooled = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  if (sePooled === 0) {
    return null;
  }

  const z = diff / sePooled;
  const pValue = hypothesisType === 'two-sided' ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z);

  const critical = hypothesisType === 'two-sided'
    ? inverseNormalCdf(1 - correctedAlpha / 2)
    : inverseNormalCdf(1 - correctedAlpha);

  const ciLow = diff - critical * sePooled;
  const ciHigh = diff + critical * sePooled;

  return {
    p1,
    p2,
    diff,
    uplift,
    z,
    pValue,
    ciLow,
    ciHigh,
    isSignificant: pValue < correctedAlpha
  };
}

export default function StatTestAbcPage() {
  const [usersA, setUsersA] = useState('15000');
  const [convA, setConvA] = useState('1500');
  const [usersB, setUsersB] = useState('15000');
  const [convB, setConvB] = useState('1650');
  const [usersC, setUsersC] = useState('15000');
  const [convC, setConvC] = useState('1580');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    const nA = Number(usersA);
    const xA = Number(convA);
    const nB = Number(usersB);
    const xB = Number(convB);
    const nC = Number(usersC);
    const xC = Number(convC);
    const alphaValue = Number(alpha);

    if (
      [nA, xA, nB, xB, nC, xC, alphaValue].some((item) => Number.isNaN(item)) ||
      nA <= 0 ||
      nB <= 0 ||
      nC <= 0 ||
      xA < 0 ||
      xB < 0 ||
      xC < 0 ||
      xA > nA ||
      xB > nB ||
      xC > nC ||
      alphaValue <= 0 ||
      alphaValue >= 1
    ) {
      setResult(null);
      setError('Введите корректные значения: пользователи > 0, конверсии в диапазоне [0, users], alpha в диапазоне (0, 1).');
      return;
    }

    const comparisons = 2;
    const correctedAlpha = alphaValue / comparisons;

    const avsB = calculatePair(nA, xA, nB, xB, hypothesisType, correctedAlpha);
    const avsC = calculatePair(nA, xA, nC, xC, hypothesisType, correctedAlpha);

    if (!avsB || !avsC) {
      setResult(null);
      setError('Не удалось выполнить расчёт: стандартная ошибка равна нулю.');
      return;
    }

    setError(null);
    setResult({
      alpha: alphaValue,
      comparisons,
      correctedAlpha,
      avsB,
      avsC
    });
  };

  const renderPairResult = (title: string, pairResult: PairResult, leftLabel: string, rightLabel: string) => (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-muted">
        <p>Конверсия {leftLabel}: <span className="font-semibold text-ink">{formatPercent(pairResult.p1)}</span></p>
        <p>Конверсия {rightLabel}: <span className="font-semibold text-ink">{formatPercent(pairResult.p2)}</span></p>
        <p>Разница (в п.п.): <span className="font-semibold text-ink">{formatPp(pairResult.diff)}</span></p>
        <p>
          Relative uplift (%):{' '}
          <span className="font-semibold text-ink">
            {pairResult.uplift === null ? 'N/A' : `${(pairResult.uplift * 100).toFixed(2)}%`}
          </span>
        </p>
        <p>z-statistic: <span className="font-semibold text-ink">{pairResult.z.toFixed(3)}</span></p>
        <p>p-value: <span className="font-semibold text-ink">{pairResult.pValue.toFixed(6)}</span></p>
        <p>
          CI для разницы (п.п.):{' '}
          <span className="font-semibold text-ink">
            [{(pairResult.ciLow * 100).toFixed(2)}; {(pairResult.ciHigh * 100).toFixed(2)}]
          </span>
        </p>
        <p className="pt-2 text-ink">
          {pairResult.isSignificant ? 'Разница статистически значима' : 'Статистически значимой разницы нет'}
        </p>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          ← Back to toolkit
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Статкритерий для A/B/C-теста</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Сравнение конверсий между вариантами A, B и C с использованием Z-теста для пропорций и поправки Бонферрони.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold">A (control)</h2>
              <div className="mt-3 grid gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Пользователи в A</span>
                  <input value={usersA} onChange={(event) => setUsersA(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Конверсии в A</span>
                  <input value={convA} onChange={(event) => setConvA(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold">B</h2>
              <div className="mt-3 grid gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Пользователи в B</span>
                  <input value={usersB} onChange={(event) => setUsersB(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Конверсии в B</span>
                  <input value={convB} onChange={(event) => setConvB(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 md:col-span-2">
              <h2 className="text-sm font-semibold">C</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Пользователи в C</span>
                  <input value={usersC} onChange={(event) => setUsersC(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Конверсии в C</span>
                  <input value={convC} onChange={(event) => setConvC(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
                </label>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>alpha</span>
              <input value={alpha} onChange={(event) => setAlpha(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40" />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Тип проверки гипотезы</span>
              <select value={hypothesisType} onChange={(event) => setHypothesisType(event.target.value as HypothesisType)} className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40">
                <option value="two-sided">two-sided</option>
                <option value="one-sided">one-sided (test &gt; control)</option>
              </select>
            </label>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleCalculate}
              className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink hover:text-white"
            >
              Calculate
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Results</h2>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {result ? (
            <div className="mt-4 space-y-4">
              {renderPairResult('🔹 A vs B', result.avsB, 'A', 'B')}
              {renderPairResult('🔹 A vs C', result.avsC, 'A', 'C')}

              <section className="rounded-xl border border-border p-4">
                <h3 className="text-base font-semibold">🔹 Общий блок</h3>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <p>alpha: <span className="font-semibold text-ink">{result.alpha}</span></p>
                  <p>количество сравнений (k): <span className="font-semibold text-ink">{result.comparisons}</span></p>
                  <p>corrected alpha: <span className="font-semibold text-ink">{result.correctedAlpha.toFixed(6)}</span></p>
                </div>
              </section>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Нажмите Calculate, чтобы выполнить расчёт.</p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 text-sm text-muted shadow-card md:p-8">
          Для A/B/C теста используются два сравнения: A-B и A-C. Уровень значимости корректируется по Бонферрони: alpha / k.
        </section>
      </div>
    </main>
  );
}
