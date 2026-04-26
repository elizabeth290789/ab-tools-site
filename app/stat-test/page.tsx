'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ResultCard, ResultCardsGrid, ResultsPanel } from '../components/results-panel';

type ExperimentType = 'landing' | 'presets' | 'purchase';
type HypothesisType = 'two-sided' | 'one-sided';

type ExperimentLabels = {
  usersLabel: string;
  eventsLabel: string;
};

type StatTestResult = {
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

const experimentTypeOptions: Array<{ value: ExperimentType; label: string; labels: ExperimentLabels }> = [
  {
    value: 'landing',
    label: 'Лендинг / регистрация',
    labels: {
      usersLabel: 'Пользователи',
      eventsLabel: 'Регистрации'
    }
  },
  {
    value: 'presets',
    label: 'Пресеты / посадка в продукт',
    labels: {
      usersLabel: 'Пользователи',
      eventsLabel: 'ret3+'
    }
  },
  {
    value: 'purchase',
    label: 'Покупки',
    labels: {
      usersLabel: 'Пользователи',
      eventsLabel: 'Покупки'
    }
  }
];

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

export default function StatTestPage() {
  const [experimentType, setExperimentType] = useState<ExperimentType>('landing');
  const [controlUsers, setControlUsers] = useState('15000');
  const [controlConversions, setControlConversions] = useState('1500');
  const [testUsers, setTestUsers] = useState('15000');
  const [testConversions, setTestConversions] = useState('1650');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<StatTestResult | null>(null);

  const selectedType = useMemo(
    () => experimentTypeOptions.find((option) => option.value === experimentType) ?? experimentTypeOptions[0],
    [experimentType]
  );

  const calculateResult = (): StatTestResult | null => {
    const n1 = Number(controlUsers);
    const x1 = Number(controlConversions);
    const n2 = Number(testUsers);
    const x2 = Number(testConversions);
    const alphaValue = Number(alpha);

    if (
      [n1, x1, n2, x2, alphaValue].some((item) => Number.isNaN(item)) ||
      n1 <= 0 ||
      n2 <= 0 ||
      x1 < 0 ||
      x2 < 0 ||
      x1 > n1 ||
      x2 > n2 ||
      alphaValue <= 0 ||
      alphaValue >= 1
    ) {
      return null;
    }

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
    const pValue =
      hypothesisType === 'two-sided'
        ? 2 * (1 - normalCdf(Math.abs(z)))
        : 1 - normalCdf(z);

    const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const zAlpha = inverseNormalCdf(1 - alphaValue / 2);
    const ciLow = diff - zAlpha * seDiff;
    const ciHigh = diff + zAlpha * seDiff;

    return {
      p1,
      p2,
      diff,
      uplift,
      z,
      pValue,
      ciLow,
      ciHigh,
      isSignificant: pValue < alphaValue
    };
  };

  const onCalculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(calculateResult());
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          ← Назад к выбору инструментов
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Проверка статистической значимости</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Двухвыборочный Z-тест для сравнения конверсий между группами control и test с расчётом p-value и доверительного интервала.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
                <span>Тип эксперимента</span>
                <select
                  value={experimentType}
                  onChange={(event) => setExperimentType(event.target.value as ExperimentType)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                >
                  {experimentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col">
                <span className="mb-2 inline-flex w-fit rounded-[10px] bg-[#f3f3f3] px-[10px] py-1 text-xs font-medium text-muted">
                  Control
                </span>
                <div className="rounded-xl border border-border p-4">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    <span>{selectedType.labels.usersLabel} в control</span>
                    <input
                      value={controlUsers}
                      onChange={(event) => setControlUsers(event.target.value)}
                      className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium">
                    <span>{selectedType.labels.eventsLabel} в control</span>
                    <input
                      value={controlConversions}
                      onChange={(event) => setControlConversions(event.target.value)}
                      className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="mb-2 inline-flex w-fit rounded-[10px] bg-[#f3f3f3] px-[10px] py-1 text-xs font-medium text-muted">
                  Test
                </span>
                <div className="rounded-xl border border-border p-4">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    <span>{selectedType.labels.usersLabel} в test</span>
                    <input
                      value={testUsers}
                      onChange={(event) => setTestUsers(event.target.value)}
                      className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium">
                    <span>{selectedType.labels.eventsLabel} в test</span>
                    <input
                      value={testConversions}
                      onChange={(event) => setTestConversions(event.target.value)}
                      className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                    />
                  </label>
                </div>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>alpha</span>
                <input
                  value={alpha}
                  onChange={(event) => setAlpha(event.target.value)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Тип гипотезы</span>
                <select
                  value={hypothesisType}
                  onChange={(event) => setHypothesisType(event.target.value as HypothesisType)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                >
                  <option value="two-sided">two-sided</option>
                  <option value="one-sided">one-sided (test &gt; control)</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
            >
              Рассчитать
            </button>
          </form>
        </section>

        <ResultsPanel>
          {result ? (
            <>
              <ResultCardsGrid>
                <ResultCard label="Конверсия control" value={formatPercent(result.p1)} />
                <ResultCard label="Конверсия test" value={formatPercent(result.p2)} />
                <ResultCard label="Разница (п.п.)" value={formatPp(result.diff)} />
                <ResultCard
                  label="Относительный рост (%)"
                  value={result.uplift === null ? 'N/A' : `${(result.uplift * 100).toFixed(2)}%`}
                />
                <ResultCard label="Z-статистика" value={result.z.toFixed(3)} />
                <ResultCard label="p-value" value={result.pValue.toFixed(6)} />
                <ResultCard
                  className="sm:col-span-2"
                  label="ДИ для разницы (п.п.)"
                  value={`[${(result.ciLow * 100).toFixed(2)}; ${(result.ciHigh * 100).toFixed(2)}]`}
                />
              </ResultCardsGrid>
              <p className="mt-4 rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-ink">
                {result.isSignificant
                  ? 'Разница статистически значима: test показывает более высокую конверсию, чем control.'
                  : 'Статистически значимых различий не обнаружено.'}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Введите корректные значения, чтобы увидеть результат расчёта.</p>
          )}
        </ResultsPanel>
      </div>
    </main>
  );
}
