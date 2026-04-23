'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type HypothesisType = 'two-sided' | 'one-sided';
type ExperimentType = 'landing' | 'presets' | 'purchase';

const zTable: Record<string, number> = {
  '0.8': 0.8416212335729143,
  '0.85': 1.0364333894937898,
  '0.9': 1.2815515655446004,
  '0.95': 1.6448536269514722,
  '0.975': 1.959963984540054,
  '0.99': 2.3263478740408408,
  '0.995': 2.5758293035489004
};

function normInv(probability: number): number {
  if (probability <= 0 || probability >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  const key = probability.toString();
  if (zTable[key] !== undefined) {
    return zTable[key];
  }

  const a1 = -39.69683028665376;
  const a2 = 220.9460984245205;
  const a3 = -275.9285104469687;
  const a4 = 138.357751867269;
  const a5 = -30.66479806614716;
  const a6 = 2.506628277459239;

  const b1 = -54.47609879822406;
  const b2 = 161.5858368580409;
  const b3 = -155.6989798598866;
  const b4 = 66.80131188771972;
  const b5 = -13.28068155288572;

  const c1 = -0.007784894002430293;
  const c2 = -0.3223964580411365;
  const c3 = -2.400758277161838;
  const c4 = -2.549732539343734;
  const c5 = 4.374664141464968;
  const c6 = 2.938163982698783;

  const d1 = 0.007784695709041462;
  const d2 = 0.3224671290700398;
  const d3 = 2.445134137142996;
  const d4 = 3.754408661907416;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (probability < pLow) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  if (probability <= pHigh) {
    const q = probability - 0.5;
    const r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - probability));
  return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
}

function calculateMdeForProportion(
  baselineRate: number,
  nPerGroup: number,
  alpha: number,
  power: number,
  hypothesisType: HypothesisType
) {
  const zAlpha = hypothesisType === 'two-sided' ? normInv(1 - alpha / 2) : normInv(1 - alpha);
  const zPower = normInv(power);

  const mde = (zAlpha + zPower) * Math.sqrt((2 * baselineRate * (1 - baselineRate)) / nPerGroup);
  const detectableRate = baselineRate + mde;
  const upliftPct = (mde / baselineRate) * 100;

  return {
    mde,
    detectableRate,
    upliftPct
  };
}

function formatInt(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function MdePage() {
  const [experimentType, setExperimentType] = useState<ExperimentType>('landing');
  const [baselineRate, setBaselineRate] = useState('10');
  const [dailyUsers, setDailyUsers] = useState('1000');
  const [durationDays, setDurationDays] = useState('30');
  const [alpha, setAlpha] = useState('0.05');
  const [power, setPower] = useState('0.8');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [trafficShare, setTrafficShare] = useState('1');
  const [hasCalculated, setHasCalculated] = useState(false);

  const labels: Record<ExperimentType, { metric: string; users: string }> = {
    landing: {
      metric: 'Базовая конверсия в регистрацию (%)',
      users: 'Среднее число пользователей в день'
    },
    presets: {
      metric: 'Базовый retention ret3+ (%)',
      users: 'Среднее число регистраций в день'
    },
    purchase: {
      metric: 'Базовая конверсия в покупку (%)',
      users: 'Среднее число регистраций в день'
    }
  };

  const result = useMemo(() => {
    const baselineRatePercentValue = Number.parseFloat(baselineRate);
    const dailyUsersValue = Number.parseFloat(dailyUsers);
    const durationDaysValue = Number.parseFloat(durationDays);
    const alphaValue = Number.parseFloat(alpha);
    const powerValue = Number.parseFloat(power);
    const trafficShareValue = Number.parseFloat(trafficShare);

    if (
      [baselineRatePercentValue, dailyUsersValue, durationDaysValue, alphaValue, powerValue, trafficShareValue].some(
        (item) => Number.isNaN(item)
      ) ||
      baselineRatePercentValue <= 0 ||
      baselineRatePercentValue >= 100 ||
      dailyUsersValue <= 0 ||
      durationDaysValue <= 0 ||
      alphaValue <= 0 ||
      alphaValue >= 1 ||
      powerValue <= 0 ||
      powerValue >= 1 ||
      trafficShareValue <= 0 ||
      trafficShareValue > 1
    ) {
      return null;
    }

    const baselineRateProportion = baselineRatePercentValue / 100;
    const totalUsers = dailyUsersValue * durationDaysValue * trafficShareValue;
    const nPerGroup = totalUsers / 2;

    if (nPerGroup <= 0) {
      return null;
    }

    const calc = calculateMdeForProportion(
      baselineRateProportion,
      nPerGroup,
      alphaValue,
      powerValue,
      hypothesisType
    );

    return {
      controlRate: baselineRateProportion,
      treatmentRate: calc.detectableRate,
      mdePp: calc.mde * 100,
      upliftPct: calc.upliftPct,
      nPerGroup,
      totalUsers
    };
  }, [alpha, baselineRate, dailyUsers, durationDays, hypothesisType, power, trafficShare]);

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
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">MDE Calculator</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Estimate the minimum detectable effect for a two-group conversion A/B test with your baseline,
            traffic, test duration, alpha, and power.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Тип эксперимента</span>
              <select
                value={experimentType}
                onChange={(event) => setExperimentType(event.target.value as ExperimentType)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              >
                <option value="landing">Лендинг / регистрация</option>
                <option value="presets">Пресеты / посадка в продукт</option>
                <option value="purchase">Покупки</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>{labels[experimentType].metric}</span>
              <input
                value={baselineRate}
                onChange={(event) => setBaselineRate(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>{labels[experimentType].users}</span>
              <input
                value={dailyUsers}
                onChange={(event) => setDailyUsers(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Длительность теста (в днях)</span>
              <input
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Alpha</span>
              <input
                value={alpha}
                onChange={(event) => setAlpha(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Power</span>
              <input
                value={power}
                onChange={(event) => setPower(event.target.value)}
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
                <option value="two-sided">Two-sided</option>
                <option value="one-sided">One-sided</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              <span>Доля трафика, идущая в эксперимент</span>
              <input
                value={trafficShare}
                onChange={(event) => setTrafficShare(event.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setHasCalculated(true)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
          >
            Calculate
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Results</h2>
          {!hasCalculated ? (
            <p className="mt-3 text-sm text-muted">Fill the inputs and click Calculate.</p>
          ) : !result ? (
            <p className="mt-3 text-sm text-red-600">Please enter valid input values.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Базовая метрика control</p>
                <p className="mt-2 text-lg font-medium">{formatPercent(result.controlRate * 100)}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Детектируемая метрика treatment</p>
                <p className="mt-2 text-lg font-medium">{formatPercent(result.treatmentRate * 100)}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">MDE (п.п.)</p>
                <p className="mt-2 text-lg font-medium">{result.mdePp.toFixed(2)} п.п.</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Relative uplift (%)</p>
                <p className="mt-2 text-lg font-medium">{formatPercent(result.upliftPct)}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Наблюдений на группу</p>
                <p className="mt-2 text-lg font-medium">{formatInt(result.nPerGroup)}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Общая база теста</p>
                <p className="mt-2 text-lg font-medium">{formatInt(result.totalUsers)}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
