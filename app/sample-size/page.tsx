import ToolCalculatorPage from '../components/tool-calculator-page';

export default function SampleSizePage() {
  return (
    <ToolCalculatorPage
      title="Sample Size Calculator"
      description="Estimate the number of users needed per variant before running your A/B test."
      fields={[
        { id: 'baseline-rate', label: 'Baseline conversion rate (%)', placeholder: '10', defaultValue: '10' },
        { id: 'mde', label: 'Minimum detectable effect (%)', placeholder: '5', defaultValue: '5' },
        { id: 'power', label: 'Power (%)', placeholder: '80', defaultValue: '80' },
        { id: 'alpha', label: 'Significance level α', placeholder: '0.05', defaultValue: '0.05' }
      ]}
    />
  );
}
