import ToolCalculatorPage from '../components/tool-calculator-page';

export default function MdePage() {
  return (
    <ToolCalculatorPage
      title="MDE Calculator"
      workingCalculatorUrl="https://ab-test-toolkit.streamlit.app/MDE_Calculator"
      description="Estimate the minimum effect size your test can reliably detect with current traffic and duration."
      fields={[
        { id: 'baseline-rate', label: 'Baseline conversion rate (%)', placeholder: '12', defaultValue: '12' },
        { id: 'traffic', label: 'Daily traffic (users)', placeholder: '5000', defaultValue: '5000' },
        { id: 'duration', label: 'Test duration (days)', placeholder: '14', defaultValue: '14' },
        { id: 'power', label: 'Power (%)', placeholder: '80', defaultValue: '80' }
      ]}
    />
  );
}
