'use client';

import ToolCalculatorPage from '../components/tool-calculator-page';

const normalQuantile = (probability: number) => {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (probability <= 0) return Number.NEGATIVE_INFINITY;
  if (probability >= 1) return Number.POSITIVE_INFINITY;

  if (probability < pLow) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (probability > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

const formatInteger = (value: number) => Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

export default function SampleSizePage() {
  return (
    <ToolCalculatorPage
      title="Sample Size Calculator"
      workingCalculatorUrl="https://ab-test-toolkit.streamlit.app/Sample_Size_Calculator"
      description="Estimate the number of users needed per variant before running your A/B test."
      fields={[
        { id: 'baseline-rate', label: 'Baseline conversion rate (%)', placeholder: '10', defaultValue: '10', type: 'number' },
        { id: 'mde', label: 'Minimum detectable effect (%)', placeholder: '5', defaultValue: '5', type: 'number' },
        { id: 'power', label: 'Power (%)', placeholder: '80', defaultValue: '80', type: 'number' },
        { id: 'alpha', label: 'Significance level α', placeholder: '0.05', defaultValue: '0.05', type: 'number' },
        {
          id: 'hypothesis-type',
          label: 'Hypothesis type',
          placeholder: '',
          defaultValue: 'two-sided',
          type: 'select',
          options: [
            { label: 'Two-sided', value: 'two-sided' },
            { label: 'One-sided', value: 'one-sided' }
          ]
        },
        { id: 'users-per-day', label: 'Average users per day', placeholder: '5000', defaultValue: '5000', type: 'number' },
        { id: 'traffic-share', label: 'Traffic share in experiment (%)', placeholder: '100', defaultValue: '100', type: 'number' },
        {
          id: 'experiment-type',
          label: 'Experiment type',
          placeholder: '',
          defaultValue: 'ab',
          type: 'select',
          options: [
            { label: 'A/B (2 variants)', value: 'ab' },
            { label: 'A/B/n (3 variants)', value: 'abn' }
          ]
        }
      ]}
      calculateResults={(values) => {
        const baselineRate = Number(values['baseline-rate']) / 100;
        const mde = Number(values.mde) / 100;
        const power = Number(values.power) / 100;
        const alpha = Number(values.alpha);
        const hypothesisType = values['hypothesis-type'];
        const usersPerDay = Number(values['users-per-day']);
        const trafficShare = Number(values['traffic-share']) / 100;
        const variantCount = values['experiment-type'] === 'abn' ? 3 : 2;

        const isValid =
          Number.isFinite(baselineRate) &&
          Number.isFinite(mde) &&
          Number.isFinite(power) &&
          Number.isFinite(alpha) &&
          Number.isFinite(usersPerDay) &&
          Number.isFinite(trafficShare) &&
          baselineRate > 0 &&
          baselineRate < 1 &&
          mde > 0 &&
          power > 0 &&
          power < 1 &&
          alpha > 0 &&
          alpha < 1 &&
          usersPerDay > 0 &&
          trafficShare > 0 &&
          trafficShare <= 1;

        if (!isValid) {
          return [
            { id: 'required-per-variant', label: 'Required sample size per variant', value: '—' },
            { id: 'total-sample-size', label: 'Total sample size', value: '—' },
            { id: 'estimated-duration-days', label: 'Estimated test duration (days)', value: '—' }
          ];
        }

        const treatmentRate = Math.min(0.999999, baselineRate * (1 + mde));
        const pooledRate = (baselineRate + treatmentRate) / 2;
        const zAlpha = normalQuantile(hypothesisType === 'one-sided' ? 1 - alpha : 1 - alpha / 2);
        const zBeta = normalQuantile(power);
        const numerator =
          zAlpha * Math.sqrt(2 * pooledRate * (1 - pooledRate)) +
          zBeta * Math.sqrt(baselineRate * (1 - baselineRate) + treatmentRate * (1 - treatmentRate));
        const denominator = Math.abs(treatmentRate - baselineRate);
        const samplePerVariant = Math.ceil((numerator * numerator) / (denominator * denominator));
        const totalSampleSize = samplePerVariant * variantCount;
        const estimatedDurationDays = Math.ceil(totalSampleSize / (usersPerDay * trafficShare));

        return [
          {
            id: 'required-per-variant',
            label: 'Required sample size per variant',
            value: formatInteger(samplePerVariant)
          },
          { id: 'total-sample-size', label: 'Total sample size', value: formatInteger(totalSampleSize) },
          {
            id: 'estimated-duration-days',
            label: 'Estimated test duration (days)',
            value: formatInteger(estimatedDurationDays)
          }
        ];
      }}
    />
  );
}
