'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ResultCard, ResultCardsGrid, ResultsPanel } from '../components/results-panel';

type GroupInput = {
  id: number;
  observed: string;
  expectedShare: string;
};

type SrmResult = {
  sampleSize: number;
  expectedSizes: number[];
  diffs: number[];
  chi2Stat: number;
  degreesOfFreedom: number;
  pValue: number;
};

const SHARE_SUM_TOLERANCE = 1e-6;
const GAMMA_EPSILON = 3e-7;
const GSL_MAX_ITERATIONS = 100;
const EXPECTED_SHARE_DECIMALS = 6;

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

function regularizedGammaP(a: number, x: number): number {
  if (x <= 0) {
    return 0;
  }

  if (x < a + 1) {
    let sum = 1 / a;
    let delta = sum;
    let ap = a;

    for (let index = 1; index <= GSL_MAX_ITERATIONS; index += 1) {
      ap += 1;
      delta *= x / ap;
      sum += delta;

      if (Math.abs(delta) < Math.abs(sum) * GAMMA_EPSILON) {
        break;
      }
    }

    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }

  let b = x + 1 - a;
  let c = 1 / Number.MIN_VALUE;
  let d = 1 / b;
  let h = d;

  for (let index = 1; index <= GSL_MAX_ITERATIONS; index += 1) {
    const an = -index * (index - a);
    b += 2;

    d = an * d + b;
    if (Math.abs(d) < Number.MIN_VALUE) {
      d = Number.MIN_VALUE;
    }

    c = b + an / c;
    if (Math.abs(c) < Number.MIN_VALUE) {
      c = Number.MIN_VALUE;
    }

    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < GAMMA_EPSILON) {
      break;
    }
  }

  const gammaQ = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  return 1 - gammaQ;
}

function chiSquareCdf(statistic: number, degreesOfFreedom: number): number {
  if (statistic < 0) {
    return 0;
  }

  return regularizedGammaP(degreesOfFreedom / 2, statistic / 2);
}

function calculateSrmChiSquare(observed: number[], expectedShares: number[]): SrmResult {
  if (observed.length !== expectedShares.length) {
    throw new Error('Количество наблюдаемых значений и ожидаемых долей должно совпадать.');
  }
  if (observed.length < 2) {
    throw new Error('Для SRM-проверки нужно как минимум 2 группы.');
  }

  if (observed.some((value) => value < 0)) {
    throw new Error('Наблюдаемые размеры групп не могут быть отрицательными.');
  }
  if (expectedShares.some((share) => share <= 0)) {
    throw new Error('Ожидаемые доли должны быть больше 0.');
  }

  const totalShare = expectedShares.reduce((sum, value) => sum + value, 0);
  if (Math.abs(totalShare - 1) > SHARE_SUM_TOLERANCE) {
    throw new Error('Сумма ожидаемых долей должна быть равна 1.');
  }

  const sampleSize = observed.reduce((sum, value) => sum + value, 0);
  if (sampleSize === 0) {
    throw new Error('Общий размер выборки равен 0. Невозможно выполнить SRM-проверку.');
  }

  const expectedSizes = expectedShares.map((share) => sampleSize * share);
  if (expectedSizes.some((expected) => expected === 0)) {
    throw new Error('Ожидаемый размер выборки для каждой группы должен быть больше 0.');
  }

  const chi2Stat = observed.reduce((sum, obs, index) => {
    const expected = expectedSizes[index];
    return sum + ((obs - expected) ** 2) / expected;
  }, 0);

  const degreesOfFreedom = observed.length - 1;
  const pValue = 1 - chiSquareCdf(chi2Stat, degreesOfFreedom);
  const diffs = observed.map((obs, index) => obs - expectedSizes[index]);

  return {
    sampleSize,
    expectedSizes,
    diffs,
    chi2Stat,
    degreesOfFreedom,
    pValue: Math.max(0, Math.min(1, pValue))
  };
}

function formatNumber(value: number, digits = 4) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits
  }).format(value);
}

function getEvenExpectedShares(groupCount: number): string[] {
  if (groupCount <= 0) {
    return [];
  }

  const baseShare = Number((1 / groupCount).toFixed(EXPECTED_SHARE_DECIMALS));
  let accumulated = 0;

  return Array.from({ length: groupCount }, (_, index) => {
    if (index === groupCount - 1) {
      return (1 - accumulated).toFixed(EXPECTED_SHARE_DECIMALS);
    }

    accumulated += baseShare;
    return baseShare.toFixed(EXPECTED_SHARE_DECIMALS);
  });
}

export default function SrmPage() {
  const [groups, setGroups] = useState<GroupInput[]>([
    { id: 1, observed: '1000', expectedShare: '0.5' },
    { id: 2, observed: '1000', expectedShare: '0.5' }
  ]);
  const [alpha, setAlpha] = useState('0.05');
  const [hasCalculated, setHasCalculated] = useState(false);

  const parsedData = useMemo(() => {
    const observed = groups.map((group) => Number(group.observed));
    const expectedShares = groups.map((group) => Number(group.expectedShare));
    const parsedAlpha = Number(alpha);

    return {
      observed,
      expectedShares,
      parsedAlpha,
      hasInvalidNumber:
        observed.some((value) => Number.isNaN(value)) ||
        expectedShares.some((value) => Number.isNaN(value)) ||
        Number.isNaN(parsedAlpha)
    };
  }, [alpha, groups]);

  const calculation = useMemo(() => {
    if (!hasCalculated) {
      return { result: null as SrmResult | null, error: null as string | null };
    }

    if (parsedData.hasInvalidNumber) {
      return { result: null, error: 'Введите числовые значения для observed, expected share и alpha.' };
    }

    if (parsedData.parsedAlpha <= 0 || parsedData.parsedAlpha >= 1) {
      return { result: null, error: 'Параметр alpha должен быть больше 0 и меньше 1.' };
    }

    try {
      return {
        result: calculateSrmChiSquare(parsedData.observed, parsedData.expectedShares),
        error: null
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Не удалось выполнить SRM-проверку.'
      };
    }
  }, [hasCalculated, parsedData]);

  const addGroup = () => {
    setGroups((previous) => {
      const nextId = previous.length > 0 ? Math.max(...previous.map((group) => group.id)) + 1 : 1;
      const nextGroups = [...previous, { id: nextId, observed: '0', expectedShare: '0' }];
      const evenShares = getEvenExpectedShares(nextGroups.length);

      return nextGroups.map((group, index) => ({
        ...group,
        expectedShare: evenShares[index]
      }));
    });
  };

  const removeGroup = (id: number) => {
    setGroups((previous) => {
      if (previous.length <= 2) {
        return previous;
      }

      const nextGroups = previous.filter((group) => group.id !== id);
      const evenShares = getEvenExpectedShares(nextGroups.length);

      return nextGroups.map((group, index) => ({
        ...group,
        expectedShare: evenShares[index]
      }));
    });
  };

  const updateGroup = (id: number, field: 'observed' | 'expectedShare', value: string) => {
    setGroups((previous) =>
      previous.map((group) =>
        group.id === id
          ? {
              ...group,
              [field]: value
            }
          : group
      )
    );
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasCalculated(true);
  };

  const result = calculation.result;
  const hasSrm = result ? result.pValue < parsedData.parsedAlpha : false;

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
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Проверка SRM</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Проверьте соответствие фактического распределения трафика ожидаемому сплиту с помощью χ²-теста (SRM).
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-4">
              {groups.map((group, index) => (
                <div key={group.id} className="rounded-xl border border-border bg-canvas p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Группа {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      disabled={groups.length <= 2}
                      className="text-xs font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      <span>Наблюдаемая выборка</span>
                      <input
                        value={group.observed}
                        onChange={(event) => updateGroup(group.id, 'observed', event.target.value)}
                        className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium">
                      <span>Ожидаемая доля</span>
                      <input
                        value={group.expectedShare}
                        onChange={(event) => updateGroup(group.id, 'expectedShare', event.target.value)}
                        className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <button
                type="button"
                onClick={addGroup}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-canvas"
              >
                + Добавить группу
              </button>

              <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-sm font-medium">
                <span>alpha</span>
                <input
                  value={alpha}
                  onChange={(event) => setAlpha(event.target.value)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
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

          {!hasCalculated ? (
            <p className="mt-3 text-sm text-muted">Заполните поля и нажмите «Рассчитать», чтобы увидеть результат SRM-проверки.</p>
          ) : null}

          {hasCalculated && calculation.error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{calculation.error}</p>
          ) : null}

          {result ? (
            <>
              <ResultCardsGrid>
                <ResultCard label="Общий размер выборки" value={formatNumber(result.sampleSize, 0)} />
                <ResultCard label="Chi-square statistic" value={formatNumber(result.chi2Stat, 6)} />
                <ResultCard label="p-value" value={formatNumber(result.pValue, 6)} />
                <ResultCard label="Число степеней свободы" value={formatNumber(result.degreesOfFreedom, 0)} />
              </ResultCardsGrid>

              <div
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                  hasSrm
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {hasSrm
                  ? 'Есть признаки SRM: фактическое распределение по группам статистически значимо отличается от ожидаемого. Возможны проблемы с рандомизацией, трекингом или качеством данных.'
                  : 'Статистически значимого несоответствия выборочных соотношений не обнаружено. Распределение по группам согласуется с ожидаемым сплитом.'}
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-[0.12em] text-muted">
                      <th className="px-3 py-2">Группа</th>
                      <th className="px-3 py-2">Наблюдаемая выборка</th>
                      <th className="px-3 py-2">Ожидаемая доля</th>
                      <th className="px-3 py-2">Ожидаемый размер выборки</th>
                      <th className="px-3 py-2">Разница (obs - exp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group, index) => (
                      <tr key={group.id} className="border-b border-border/70">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{formatNumber(Number(group.observed), 4)}</td>
                        <td className="px-3 py-2">{formatNumber(Number(group.expectedShare), 6)}</td>
                        <td className="px-3 py-2">{formatNumber(result.expectedSizes[index], 4)}</td>
                        <td className="px-3 py-2">{formatNumber(result.diffs[index], 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </ResultsPanel>
      </div>
    </main>
  );
}
