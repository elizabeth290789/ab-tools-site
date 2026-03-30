import ToolCalculatorPage from '../components/tool-calculator-page';

export default function SrmPage() {
  return (
    <ToolCalculatorPage
      title="SRM Check"
      description="Quickly detect sample ratio mismatch by comparing expected split with observed variant counts."
      fields={[
        { id: 'expected-control', label: 'Expected control share (%)', placeholder: '50', defaultValue: '50' },
        { id: 'control-users', label: 'Observed control users', placeholder: '10120', defaultValue: '10120' },
        { id: 'variant-users', label: 'Observed variant users', placeholder: '9880', defaultValue: '9880' },
        { id: 'alpha', label: 'Significance threshold α', placeholder: '0.05', defaultValue: '0.05' }
      ]}
    />
  );
}
