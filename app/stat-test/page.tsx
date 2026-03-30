import ToolCalculatorPage from '../components/tool-calculator-page';

export default function StatTestPage() {
  return (
    <ToolCalculatorPage
      title="Statistical Significance Test"
      workingCalculatorUrl="https://ab-test-toolkit.streamlit.app/Statistical_Significance_Test"
      description="Compare control vs variant performance and review a simple significance output block."
      fields={[
        { id: 'control-conv', label: 'Control conversions', placeholder: '540', defaultValue: '540' },
        { id: 'control-users', label: 'Control users', placeholder: '5000', defaultValue: '5000' },
        { id: 'variant-conv', label: 'Variant conversions', placeholder: '590', defaultValue: '590' },
        { id: 'variant-users', label: 'Variant users', placeholder: '5100', defaultValue: '5100' }
      ]}
    />
  );
}
