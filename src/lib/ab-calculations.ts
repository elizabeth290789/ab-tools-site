export const MDE_RANGE_PP = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
export type HypothesisType = 'two-sided' | 'one-sided';

const SQRT2 = Math.sqrt(2);

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number, mean = 0, std = 1): number {
  return 0.5 * (1 + erf((x - mean) / (std * SQRT2)));
}

function normalInv(p: number, mean = 0, std = 1): number {
  if (p <= 0 || p >= 1) throw new Error('p must be in (0,1)');
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let x;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= phigh) {
    const q = p - 0.5;
    const r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return mean + std * x;
}

function gammaln(x: number): number {
  const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j += 1) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(x: number, a: number, b: number): number {
  const maxIter = 200;
  const eps = 3e-7;
  const fpmin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function gammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= 100; n += 1) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
  }
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 100; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - h * Math.exp(-x + a * Math.log(x) - gammaln(a));
}

const jStat = {
  normal: { cdf: normalCdf, inv: normalInv },
  studentt: {
    cdf(t: number, df: number): number {
      const x = df / (df + t * t);
      const ib = ibeta(x, df / 2, 0.5);
      return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
    },
    inv(p: number, df: number): number {
      let lo = -50;
      let hi = 50;
      for (let i = 0; i < 200; i += 1) {
        const mid = (lo + hi) / 2;
        const cmid = jStat.studentt.cdf(mid, df);
        if (cmid < p) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
  },
  chisquare: {
    cdf(x: number, df: number): number {
      return gammaP(df / 2, x / 2);
    }
  }
};

export function calculateSampleSizePerGroup(p1: number, mdePp: number, alpha = 0.05, power = 0.8, hypothesisType: HypothesisType = 'two-sided'): { n: number; p2: number } {
  const p2 = p1 + mdePp / 100;
  const pBar = (p1 + p2) / 2;
  const zAlpha = hypothesisType === 'two-sided' ? jStat.normal.inv(1 - alpha / 2, 0, 1) : jStat.normal.inv(1 - alpha, 0, 1);
  const zPower = jStat.normal.inv(power, 0, 1);
  const numerator = (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zPower * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denominator = (p2 - p1) ** 2;
  const n = numerator / denominator;
  return { n: Math.ceil(n), p2 };
}

export function calculateMdeForProportion(baselineRate: number, nPerGroup: number, alpha = 0.05, power = 0.8, hypothesisType: HypothesisType = 'two-sided'): { mde: number; detectableRate: number; upliftPct: number } {
  const zAlpha = hypothesisType === 'two-sided' ? jStat.normal.inv(1 - alpha / 2, 0, 1) : jStat.normal.inv(1 - alpha, 0, 1);
  const zPower = jStat.normal.inv(power, 0, 1);
  const mde = (zAlpha + zPower) * Math.sqrt((2 * baselineRate * (1 - baselineRate)) / nPerGroup);
  const detectableRate = baselineRate + mde;
  const upliftPct = (mde / baselineRate) * 100;
  return { mde, detectableRate, upliftPct };
}

export function calculateTwoProportionZTest(nA: number, successA: number, nB: number, successB: number, alpha: number, hypothesisType: HypothesisType = 'two-sided') {
  const pA = successA / nA;
  const pB = successB / nB;
  const diff = pB - pA;
  const pPool = (successA + successB) / (nA + nB);
  const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  if (sePool === 0) throw new Error('Стандартная ошибка по pooled-оценке равна 0. Z-статистику невозможно вычислить.');
  const zStat = diff / sePool;
  const pValue = hypothesisType === 'two-sided' ? 2 * (1 - jStat.normal.cdf(Math.abs(zStat), 0, 1)) : 1 - jStat.normal.cdf(zStat, 0, 1);
  const zCrit = jStat.normal.inv(1 - alpha / 2, 0, 1);
  const seUnpooled = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  const ciLow = diff - zCrit * seUnpooled;
  const ciHigh = diff + zCrit * seUnpooled;
  const upliftPct = pA !== 0 ? (diff / pA) * 100 : Number.NaN;
  return { pA, pB, diff, zStat, pValue, ciLow, ciHigh, upliftPct };
}

export function welchTtestFromStats(meanA: number, stdA: number, nA: number, meanB: number, stdB: number, nB: number, alpha = 0.05, hypothesisType: HypothesisType = 'two-sided') {
  if (nA <= 1 || nB <= 1) throw new Error('Размер групп должен быть больше 1.');
  if (meanA < 0 || meanB < 0) throw new Error('ARPU не может быть отрицательным.');
  if (stdA < 0 || stdB < 0) throw new Error('Стандартное отклонение не может быть отрицательным.');
  if (!(alpha > 0 && alpha < 1)) throw new Error('alpha должен быть между 0 и 1.');

  const se = Math.sqrt(stdA ** 2 / nA + stdB ** 2 / nB);
  if (se === 0) throw new Error('Стандартная ошибка равна 0. t-статистику невозможно вычислить.');
  const tStat = (meanB - meanA) / se;
  const dfNum = (stdA ** 2 / nA + stdB ** 2 / nB) ** 2;
  const dfDen = ((stdA ** 2 / nA) ** 2) / (nA - 1) + ((stdB ** 2 / nB) ** 2) / (nB - 1);
  if (dfDen === 0) throw new Error('Не удалось вычислить степени свободы для Welch t-test (деление на 0).');
  const df = dfNum / dfDen;
  const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
  const pValue = hypothesisType === 'two-sided' ? 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df)) : 1 - jStat.studentt.cdf(tStat, df);
  const diff = meanB - meanA;
  const ciLow = diff - tCrit * se;
  const ciHigh = diff + tCrit * se;
  let upliftPct = Number.NaN;
  if (meanA !== 0) upliftPct = (diff / meanA) * 100;
  return { meanA, meanB, diff, upliftPct, tStat, pValue, ciLow, ciHigh, df };
}

export function calculateSrmChiSquare(observed: number[], expectedShares: number[]) {
  if (observed.length !== expectedShares.length) throw new Error('Количество наблюдаемых значений и ожидаемых долей должно совпадать.');
  if (observed.length < 2) throw new Error('Для SRM-проверки нужно как минимум 2 группы.');
  if (observed.some((value) => value < 0)) throw new Error('Наблюдаемые размеры групп не могут быть отрицательными.');
  if (expectedShares.some((share) => share <= 0)) throw new Error('Ожидаемые доли должны быть больше 0.');
  const totalShare = expectedShares.reduce((acc, curr) => acc + curr, 0);
  if (Math.abs(totalShare - 1) > 1e-6) throw new Error('Сумма ожидаемых долей должна быть равна 1.');
  const sampleSize = observed.reduce((acc, curr) => acc + curr, 0);
  if (sampleSize === 0) throw new Error('Общий размер выборки равен 0. Невозможно выполнить SRM-проверку.');
  const expectedSizes = expectedShares.map((share) => sampleSize * share);
  if (expectedSizes.some((expected) => expected === 0)) throw new Error('Ожидаемый размер выборки для каждой группы должен быть больше 0.');
  const chi2Stat = observed.reduce((sum, obs, idx) => sum + ((obs - expectedSizes[idx]) ** 2) / expectedSizes[idx], 0);
  const degreesOfFreedom = observed.length - 1;
  const pValue = 1 - jStat.chisquare.cdf(chi2Stat, degreesOfFreedom);
  const diffs = observed.map((obs, idx) => obs - expectedSizes[idx]);
  return { sampleSize, expectedSizes, diffs, chi2Stat, degreesOfFreedom, pValue };
}

export function calculateBonferroni(alpha: number, numTests: number): number {
  return alpha / numTests;
}
