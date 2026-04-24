'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type ExperimentType = 'landing' | 'presets' | 'purchase';
type HypothesisType = 'two-sided' | 'one-sided';

type ResultState = {
  baselineRate: number;
  totalBase: number;
  nPerGroup: number;
  mde: number;
  relativeUplift: number;
  detectableMetricGrowth: number;
};

const experimentTypeOptions: Array<{
  value: ExperimentType;
  label: string;
  usersLabel: string;
  conversionsLabel: string;
  currentMetricLabel: string;
}> = [
  {
    value: 'landing',
    label: 'Лендинг / регистрация',
    usersLabel: 'Пользователи в месяц',
    conversionsLabel: 'Регистрации в месяц',
    currentMetricLabel: 'Текущая конверсия'
  },
  {
    value: 'presets',
    label: 'Пресеты / посадка в продукт',
    usersLabel: 'Пользователи в месяц',
    conversionsLabel: 'Ret3+ в месяц',
    currentMetricLabel: 'Текущая конверсия'
  },
  {
    value: 'purchase',
    label: 'Покупки',
    usersLabel: 'Пользователи в месяц',
    conversionsLabel: 'Покупки в месяц',
    currentMetricLabel: 'Текущая конверсия'
  }
];

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

function formatPercent(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

export default function MdePage() {
  const [experimentType, setExperimentType] = useState<ExperimentType>('landing');
  const [usersPerMonth, setUsersPerMonth] = useState('30000');
  const [conversionsPerMonth, setConversionsPerMonth] = useState('3000');
  const [durationMonths, setDurationMonths] = useState('1');
  const [alpha, setAlpha] = useState('0.05');
  const [power, setPower] = useState('0.8');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedType = useMemo(
    () => experimentTypeOptions.find((option) => option.value === experimentType) ?? experimentTypeOptions[0],
    [experimentType]
  );

  const onCalculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const users = Number(usersPerMonth);
    const conversions = Number(conversionsPerMonth);
    const duration = Number(durationMonths);
    const alphaValue = Number(alpha);
    const powerValue = Number(power);

    if (
      users <= 0 ||
      conversions < 0 ||
      conversions > users ||
      duration <= 0 ||
      alphaValue <= 0 ||
      alphaValue >= 1 ||
      powerValue <= 0 ||
      powerValue >= 1
    ) {
      setError('Проверьте значения: они должны быть положительными, а конверсии не могут быть больше числа пользователей.');
      setResult(null);
      return;
    }

    const baselineRate = conversions / users;
    const totalBase = users * duration;
    const nPerGroup = totalBase / 2;

    if (baselineRate <= 0 || baselineRate >= 1 || nPerGroup <= 0) {
      setError('Для расчёта MDE нужна конверсия между 0% и 100% и ненулевая база на группу.');
      setResult(null);
      return;
    }

    const zAlpha = inverseNormalCdf(1 - (hypothesisType === 'two-sided' ? alphaValue / 2 : alphaValue));
    const zBeta = inverseNormalCdf(powerValue);
    const mde = (zAlpha + zBeta) * Math.sqrt((2 * baselineRate * (1 - baselineRate)) / nPerGroup);
    const relativeUplift = mde / baselineRate;
    const detectableMetricGrowth = baselineRate + mde;

    setError(null);
    setResult({
      baselineRate,
      totalBase,
      nPerGroup,
      mde,
      relativeUplift,
      detectableMetricGrowth
    });
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
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">MDE Calculator</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Оцените минимальный эффект (MDE), который можно детектировать при текущем объёме трафика и длительности теста.
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

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>{selectedType.usersLabel}</span>
                <input
                  value={usersPerMonth}
                  onChange={(event) => setUsersPerMonth(event.target.value)}
                  placeholder="30000"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>{selectedType.conversionsLabel}</span>
                <input
                  value={conversionsPerMonth}
                  onChange={(event) => setConversionsPerMonth(event.target.value)}
                  placeholder="3000"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Длительность теста (в месяцах)</span>
                <input
                  value={durationMonths}
                  onChange={(event) => setDurationMonths(event.target.value)}
                  placeholder="1"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>alpha</span>
                <input
                  value={alpha}
                  onChange={(event) => setAlpha(event.target.value)}
                  placeholder="0.05"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>power</span>
                <input
                  value={power}
                  onChange={(event) => setPower(event.target.value)}
                  placeholder="0.8"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Тип проверки гипотезы</span>
                <select
                  value={hypothesisType}
                  onChange={(event) => setHypothesisType(event.target.value as HypothesisType)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                >
                  <option value="two-sided">two-sided</option>
                  <option value="one-sided">one-sided</option>
                </select>
              </label>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
            >
              Рассчитать
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Результаты</h2>
          {result ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedType.currentMetricLabel}</p>
                <p className="mt-2 text-lg font-medium">{formatPercent(result.baselineRate)}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">База для теста</p>
                <p className="mt-2 text-lg font-medium">{result.totalBase.toLocaleString('ru-RU')}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Наблюдений на группу</p>
                <p className="mt-2 text-lg font-medium">{result.nPerGroup.toLocaleString('ru-RU')}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">MDE (п.п.)</p>
                <p className="mt-2 text-lg font-medium">{(result.mde * 100).toFixed(2)} п.п.</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Относительный рост (%)</p>
                <p className="mt-2 text-lg font-medium">{(result.relativeUplift * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Детектируемый рост метрики</p>
                <p className="mt-2 text-lg font-medium">
                  {formatPercent(result.baselineRate)} → {formatPercent(result.detectableMetricGrowth)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Заполните поля и нажмите <strong>Рассчитать</strong> для расчёта.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
