export type Alternative = 'two-sided' | 'greater' | 'less';

export function parsePercent(value: number): number {
  return value / 100;
}

export function validateProbability(value: number, field: string): string | null {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    return `${field} must be between 0 and 1.`;
  }
  return null;
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function normalInv(p: number): number {
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

function logGamma(z: number): number {
  const g = 7;
  const p = [0.9999999999998099, 676.5203681218851, -1259.139216722403, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  let x = p[0];
  const zz = z - 1;
  for (let i = 1; i < g + 2; i += 1) {
    x += p[i] / (zz + i);
  }
  const t = zz + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(s: number, x: number): number {
  if (x < 0 || s <= 0) return NaN;
  if (x === 0) return 0;

  if (x < s + 1) {
    let sum = 1 / s;
    let term = sum;
    for (let n = 1; n <= 200; n += 1) {
      term *= x / (s + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
  }

  let b = x + 1 - s;
  let c = 1e30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i += 1) {
    const an = -i * (i - s);
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

  return 1 - Math.exp(-x + s * Math.log(x) - logGamma(s)) * h;
}

function betacf(a: number, b: number, x: number): number {
  const maxIter = 200;
  const eps = 3e-14;
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

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
  if (t >= 0) return 1 - 0.5 * ib;
  return 0.5 * ib;
}

export function calculate_sample_size_per_group({ baselineRate, mde, alpha, power, alternative = 'two-sided' }: { baselineRate: number; mde: number; alpha: number; power: number; alternative?: Alternative; }) {
  const p1 = baselineRate;
  const p2 = p1 * (1 + mde);
  const alphaTail = alternative === 'two-sided' ? alpha / 2 : alpha;
  const zAlpha = normalInv(1 - alphaTail);
  const zBeta = normalInv(power);
  const pBar = (p1 + p2) / 2;
  const numerator = zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  const n = (numerator * numerator) / ((p2 - p1) * (p2 - p1));
  return { p1, p2, nPerGroup: Math.ceil(n) };
}

export function calculate_mde_for_proportion({ baselineRate, alpha, power, nPerGroup, alternative = 'two-sided' }: { baselineRate: number; alpha: number; power: number; nPerGroup: number; alternative?: Alternative; }) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const sample = calculate_sample_size_per_group({ baselineRate, mde: mid, alpha, power, alternative }).nPerGroup;
    if (sample > nPerGroup) low = mid;
    else high = mid;
  }
  return high;
}

export function calculate_two_proportion_z_test({ controlConversions, controlUsers, variantConversions, variantUsers, alpha, alternative = 'two-sided' }: { controlConversions: number; controlUsers: number; variantConversions: number; variantUsers: number; alpha: number; alternative?: Alternative; }) {
  const p1 = controlConversions / controlUsers;
  const p2 = variantConversions / variantUsers;
  const pooled = (controlConversions + variantConversions) / (controlUsers + variantUsers);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlUsers + 1 / variantUsers));
  const z = (p2 - p1) / se;
  let pValue: number;
  if (alternative === 'two-sided') pValue = 2 * (1 - normalCdf(Math.abs(z)));
  else if (alternative === 'greater') pValue = 1 - normalCdf(z);
  else pValue = normalCdf(z);
  return { controlRate: p1, variantRate: p2, uplift: p1 === 0 ? null : (p2 - p1) / p1, zScore: z, pValue, isSignificant: pValue < alpha };
}

export function welch_ttest_from_stats({ meanControl, stdControl, nControl, meanVariant, stdVariant, nVariant, alpha, alternative = 'two-sided' }: { meanControl: number; stdControl: number; nControl: number; meanVariant: number; stdVariant: number; nVariant: number; alpha: number; alternative?: Alternative; }) {
  const var1 = (stdControl * stdControl) / nControl;
  const var2 = (stdVariant * stdVariant) / nVariant;
  const t = (meanVariant - meanControl) / Math.sqrt(var1 + var2);
  const df = ((var1 + var2) ** 2) / ((var1 ** 2) / (nControl - 1) + (var2 ** 2) / (nVariant - 1));
  let pValue: number;
  if (alternative === 'two-sided') pValue = 2 * (1 - tCdf(Math.abs(t), df));
  else if (alternative === 'greater') pValue = 1 - tCdf(t, df);
  else pValue = tCdf(t, df);
  return { tScore: t, degreesOfFreedom: df, pValue, uplift: meanControl === 0 ? null : (meanVariant - meanControl) / meanControl, isSignificant: pValue < alpha };
}

export function calculate_srm_chi_square({ observed, expectedShares, alpha }: { observed: number[]; expectedShares: number[]; alpha: number; }) {
  const total = observed.reduce((sum, value) => sum + value, 0);
  const expectedCounts = expectedShares.map((share) => share * total);
  const chiSquare = observed.reduce((sum, obs, idx) => sum + ((obs - expectedCounts[idx]) ** 2) / expectedCounts[idx], 0);
  const df = observed.length - 1;
  const pValue = 1 - regularizedGammaP(df / 2, chiSquare / 2);
  return { chiSquare, degreesOfFreedom: df, pValue, hasSampleRatioMismatch: pValue < alpha };
}

export function bonferroniCorrection(alpha: number, tests: number) {
  return alpha / tests;
}
