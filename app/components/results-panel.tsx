import { ReactNode } from 'react';

type ResultsPanelProps = {
  children: ReactNode;
  className?: string;
};

type ResultCardProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function ResultsPanel({ children, className }: ResultsPanelProps) {
  return (
    <section className={joinClasses('mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8', className)}>
      <h2 className="text-lg font-semibold">Результаты</h2>
      {children}
    </section>
  );
}

export function ResultCardsGrid({ children, className }: ResultsPanelProps) {
  return <div className={joinClasses('mt-4 grid gap-3 sm:grid-cols-2', className)}>{children}</div>;
}

export function ResultCard({ label, value, className }: ResultCardProps) {
  return (
    <div className={joinClasses('rounded-xl border border-border bg-canvas px-4 py-3', className)}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
