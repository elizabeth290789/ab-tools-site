'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ResultCard, ResultCardsGrid, ResultsPanel } from '../components/results-panel';

type HypothesisType = 'two-sided' | 'one-sided';

type WelchResult = {
  meanA: number;
  meanB: number;
  diff: number;
  upliftPct: number | null;
  tStat: number;
  pValue: number;
  ciLow: number;
  ciHigh: number;
};

function logGamma(value: number): number {
  const coefficients = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953
  ];

  let y = value;
  let tmp = value + 5.5;
  tmp -= (value + 0.5) * Math.log(tmp);

  let series = 1.000000000190015;
  for (let index = 0; index < coefficients.length; index += 1) {
    y += 1;
    series += coefficients[index] / y;
  }

  return -tmp + Math.log(2.5066282746310005 * series / value);
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 3e-7;
  const fpMin = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < fpMin) {
    d = fpMin;
  }
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;

    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }

  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }

  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  }

  return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
}

function studentTCdf(x: number, degreesOfFreedom: number): number {
  if (degreesOfFreedom <= 0) {
    throw new Error('Степени свободы должны быть больше 0.');
  }

  const transformed = degreesOfFreedom / (degreesOfFreedom + x * x);
  const ibeta = regularizedIncompleteBeta(transformed, degreesOfFreedom / 2, 0.5);

  if (x >= 0) {
    return 1 - 0.5 * ibeta;
  }

  return 0.5 * ibeta;
}

function studentTPpf(probability: number, degreesOfFreedom: number): number {
  if (probability <= 0 || probability >= 1) {
    throw new Error('Вероятность должна быть между 0 и 1.');
  }

  let low = -100;
  let high = 100;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const middle = (low + high) / 2;
    const cdf = studentTCdf(middle, degreesOfFreedom);

    if (cdf < probability) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return (low + high) / 2;
}

function welchTtestFromStats(
  meanA: number,
  stdA: number,
  nA: number,
  meanB: number,
  stdB: number,
  nB: number,
  alpha: number,
  hypothesisType: HypothesisType
): WelchResult {
  if (nA <= 1 || nB <= 1) {
    throw new Error('Размер групп должен быть больше 1.');
  }
  if (meanA < 0 || meanB < 0) {
    throw new Error('ARPU не может быть отрицательным.');
  }
  if (stdA < 0 || stdB < 0) {
    throw new Error('Стандартное отклонение не может быть отрицательным.');
  }
  if (alpha <= 0 || alpha >= 1) {
    throw new Error('alpha должен быть между 0 и 1.');
  }

  const se = Math.sqrt((stdA ** 2 / nA) + (stdB ** 2 / nB));
  if (se === 0) {
    throw new Error('Не удалось вычислить t-statistic (стандартная ошибка равна 0).');
  }

  const diff = meanB - meanA;
  const tStat = diff / se;

  const dfNumerator = (stdA ** 2 / nA + stdB ** 2 / nB) ** 2;
  const dfDenominator = ((stdA ** 2 / nA) ** 2) / (nA - 1) + ((stdB ** 2 / nB) ** 2) / (nB - 1);

  if (dfDenominator === 0) {
    throw new Error('Не удалось вычислить степени свободы для Welch t-test (деление на 0).');
  }

  const degreesOfFreedom = dfNumerator / dfDenominator;
  const tCritical = studentTPpf(1 - alpha / 2, degreesOfFreedom);

  const pValue = hypothesisType === 'two-sided'
    ? 2 * (1 - studentTCdf(Math.abs(tStat), degreesOfFreedom))
    : 1 - studentTCdf(tStat, degreesOfFreedom);

  const ciLow = diff - tCritical * se;
  const ciHigh = diff + tCritical * se;

  return {
    meanA,
    meanB,
    diff,
    upliftPct: meanA === 0 ? null : (diff / meanA) * 100,
    tStat,
    pValue,
    ciLow,
    ciHigh
  };
}

function formatNumber(value: number, digits = 4): string {
  return value.toFixed(digits);
}

export default function StatTestArpuPage() {
  const [controlRegistrations, setControlRegistrations] = useState('15000');
  const [controlArpu, setControlArpu] = useState('100');
  const [controlSd, setControlSd] = useState('300');

  const [testRegistrations, setTestRegistrations] = useState('15000');
  const [testArpu, setTestArpu] = useState('110');
  const [testSd, setTestSd] = useState('310');

  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');

  const [result, setResult] = useState<WelchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    const nA = Number(controlRegistrations);
    const meanA = Number(controlArpu);
    const stdA = Number(controlSd);

    const nB = Number(testRegistrations);
    const meanB = Number(testArpu);
    const stdB = Number(testSd);

    const alphaValue = Number(alpha);

    if ([nA, meanA, stdA, nB, meanB, stdB, alphaValue].some((value) => Number.isNaN(value))) {
      setResult(null);
      setError('Введите корректные числовые значения во всех полях.');
      return;
    }

    try {
      const calculation = welchTtestFromStats(meanA, stdA, nA, meanB, stdB, nB, alphaValue, hypothesisType);
      setResult(calculation);
      setError(null);
    } catch (calculationError) {
      setResult(null);
      setError(calculationError instanceof Error ? calculationError.message : 'Не удалось выполнить расчёт.');
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          ← Назад к выбору инструментов
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Сравнение ARPU (t-тест)</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Сравнение ARPU между группами control и test с помощью t-теста Уэлча.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <p className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-muted">
            Используйте ARPU, рассчитанный как revenue / registrations. Стандартное отклонение также должно быть
            рассчитано на уровне регистраций, включая нулевую выручку для тех регистраций, которые не совершили покупку.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold">Control</h2>
              <div className="mt-3 grid gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Регистрации в control</span>
                  <input
                    value={controlRegistrations}
                    onChange={(event) => setControlRegistrations(event.target.value)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>ARPU в control</span>
                  <input
                    value={controlArpu}
                    onChange={(event) => setControlArpu(event.target.value)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>SD ARPU в control</span>
                  <input
                    value={controlSd}
                    onChange={(event) => setControlSd(event.target.value)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold">Test</h2>
              <div className="mt-3 grid gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>Регистрации в test</span>
                  <input
                    value={testRegistrations}
                    onChange={(event) => setTestRegistrations(event.target.value)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>ARPU в test</span>
                  <input
                    value={testArpu}
                    onChange={(event) => setTestArpu(event.target.value)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>SD ARPU в test</span>
                  <input
                    value={testSd}
                    onChange={(event) => setTestSd(event.target.value)}
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
              <span>Тип проверки гипотезы</span>
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
            type="button"
            onClick={handleCalculate}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
          >
            Рассчитать
          </button>
        </section>

        <ResultsPanel>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {!error && result && (
            <>
              <ResultCardsGrid>
                <ResultCard label="ARPU control" value={formatNumber(result.meanA, 2)} />
                <ResultCard label="ARPU test" value={formatNumber(result.meanB, 2)} />
                <ResultCard label="Разница (test - control)" value={formatNumber(result.diff, 2)} />
                <ResultCard label="Relative uplift (%)" value={result.upliftPct === null ? 'N/A' : `${formatNumber(result.upliftPct, 2)}%`} />
                <ResultCard label="t-statistic" value={formatNumber(result.tStat, 4)} />
                <ResultCard label="p-value" value={formatNumber(result.pValue, 6)} />
                <ResultCard
                  className="sm:col-span-2"
                  label="Доверительный интервал для разницы ARPU"
                  value={`[${formatNumber(result.ciLow, 2)}; ${formatNumber(result.ciHigh, 2)}]`}
                />
              </ResultCardsGrid>

              <p
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  result.pValue < Number(alpha)
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
              >
                {result.pValue < Number(alpha)
                  ? 'Разница статистически значима: ARPU в test выше, чем в control.'
                  : 'Статистически значимых различий по ARPU между группами не обнаружено.'}
              </p>
            </>
          )}

          {!error && !result && (
            <p className="mt-3 text-sm text-muted">
              Заполните поля и нажмите <strong>«Рассчитать»</strong>, чтобы получить результат.
            </p>
          )}
        </ResultsPanel>
      </div>
    </main>
  );
}
