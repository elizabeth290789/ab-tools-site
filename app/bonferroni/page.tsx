'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

type MdeType = 'pp' | 'relative';

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

function formatInt(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function BonferroniPage() {
  const [baselineConversion, setBaselineConversion] = useState('7');
  const [mdeType, setMdeType] = useState<MdeType>('pp');
  const [mdeValue, setMdeValue] = useState('0.5');
  const [alphaGlobal, setAlphaGlobal] = useState('0.05');
  const [power, setPower] = useState('0.8');
  const [comparisons, setComparisons] = useState('2');
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo(() => {
    const baselineValue = Number.parseFloat(baselineConversion);
    const mdeRaw = Number.parseFloat(mdeValue);
    const alphaValue = Number.parseFloat(alphaGlobal);
    const powerValue = Number.parseFloat(power);
    const comparisonsValue = Number.parseFloat(comparisons);

    if (
      [baselineValue, mdeRaw, alphaValue, powerValue, comparisonsValue].some((item) => Number.isNaN(item)) ||
      baselineValue <= 0 ||
      baselineValue >= 100 ||
      mdeRaw <= 0 ||
      alphaValue <= 0 ||
      alphaValue >= 1 ||
      powerValue <= 0 ||
      powerValue >= 1 ||
      comparisonsValue <= 0
    ) {
      return null;
    }

    const correctedAlpha = alphaValue / comparisonsValue;

    if (correctedAlpha <= 0 || correctedAlpha >= 1) {
      return null;
    }

    const p1 = baselineValue / 100;
    const mdePp = mdeType === 'pp' ? mdeRaw : baselineValue * (mdeRaw / 100);
    const p2 = (baselineValue + mdePp) / 100;

    if (p2 <= 0 || p2 >= 1 || p2 <= p1) {
      return null;
    }

    const delta = p2 - p1;
    const zAlpha = normInv(1 - correctedAlpha / 2);
    const zBeta = normInv(powerValue);
    const pooled = (p1 + p2) / 2;

    const numerator =
      zAlpha * Math.sqrt(2 * pooled * (1 - pooled)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));

    const sampleSizePerGroup = Math.ceil((numerator * numerator) / (delta * delta));

    return {
      baselineConversion: p1 * 100,
      targetConversion: p2 * 100,
      correctedAlpha,
      sampleSizePerGroup,
      sampleSizePerComparison: sampleSizePerGroup * 2,
      totalSampleSizeForThreeGroups: sampleSizePerGroup * 3
    };
  }, [alphaGlobal, baselineConversion, comparisons, mdeType, mdeValue, power]);

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
          ← Назад к выбору инструментов
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Калькулятор размера выборки для A/B/C теста</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">
            Расчёт размера выборки для бинарной метрики при трёх вариантах (A/B/C) с поправкой Бонферрони
            для двух сравнений: A-B и A-C.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            Глобальный уровень значимости делится на число сравнений (Bonferroni correction).
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Базовая конверсия (%)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={baselineConversion}
                  onChange={(event) => setBaselineConversion(event.target.value)}
                  placeholder="7"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Тип MDE</span>
                <select
                  value={mdeType}
                  onChange={(event) => setMdeType(event.target.value as MdeType)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                >
                  <option value="pp">В процентных пунктах</option>
                  <option value="relative">Относительный uplift</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>{mdeType === 'pp' ? 'MDE (п.п.)' : 'MDE (%)'}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mdeValue}
                  onChange={(event) => setMdeValue(event.target.value)}
                  placeholder={mdeType === 'pp' ? '0.5' : '10'}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Глобальный уровень значимости (alpha)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={alphaGlobal}
                  onChange={(event) => setAlphaGlobal(event.target.value)}
                  placeholder="0.05"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Мощность (power)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={power}
                  onChange={(event) => setPower(event.target.value)}
                  placeholder="0.8"
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                <span>Количество сравнений</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={comparisons}
                  onChange={(event) => setComparisons(event.target.value)}
                  placeholder="2"
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

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Результаты</h2>
          {hasCalculated ? (
            result === null ? (
              <p className="mt-3 text-sm text-muted">Пожалуйста, введите корректные числовые значения.</p>
            ) : (
              <div className="mt-4 space-y-3 rounded-xl border border-border bg-canvas px-4 py-4 text-sm md:text-base">
                <p><strong>Базовая конверсия:</strong> {formatPercent(result.baselineConversion)}</p>
                <p><strong>Целевая конверсия:</strong> {formatPercent(result.targetConversion)}</p>
                <p><strong>Скорректированный alpha:</strong> {result.correctedAlpha.toPrecision(6)}</p>
                <p><strong>Размер выборки на группу:</strong> {formatInt(result.sampleSizePerGroup)}</p>
                <p><strong>Размер выборки на сравнение:</strong> {formatInt(result.sampleSizePerComparison)}</p>
                <p><strong>Общий размер выборки для 3 групп:</strong> {formatInt(result.totalSampleSizeForThreeGroups)}</p>
              </div>
            )
          ) : (
            <p className="mt-3 text-sm text-muted">
              Заполните поля и нажмите <strong>«Рассчитать»</strong>, чтобы получить расчёт.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 text-sm text-muted shadow-card md:p-8 md:text-base">
          <p>Расчёт предполагает равные размеры групп и бинарную метрику (конверсию).</p>
          <p className="mt-2">Используется поправка Бонферрони для двух сравнений: A-B и A-C.</p>
        </section>
      </div>
    </main>
  );
}
