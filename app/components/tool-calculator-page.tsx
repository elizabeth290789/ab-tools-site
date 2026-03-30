'use client';

import { useState } from 'react';
import Link from 'next/link';

type CalculatorField = {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
};

type ToolCalculatorPageProps = {
  title: string;
  description: string;
  fields: CalculatorField[];
};

export default function ToolCalculatorPage({
  title,
  description,
  fields
}: ToolCalculatorPageProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.id, field.defaultValue]))
  );
  const [hasCalculated, setHasCalculated] = useState(false);

  const onCalculate = (event: React.FormEvent<HTMLFormElement>) => {
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
          ← Back to toolkit
        </Link>

        <header className="mt-6 border-y border-border py-8">
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">{description}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.id} className="flex flex-col gap-2 text-sm font-medium">
                  <span>{field.label}</span>
                  <input
                    value={values[field.id]}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.id]: event.target.value
                      }))
                    }
                    placeholder={field.placeholder}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                  />
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 md:w-auto"
            >
              Calculate
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-card md:p-8">
          <h2 className="text-lg font-semibold">Results</h2>
          {hasCalculated ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.id} className="rounded-xl border border-border bg-canvas px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{field.label}</p>
                  <p className="mt-2 text-lg font-medium">{values[field.id] || '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Fill the inputs and click <strong>Calculate</strong> to view a quick output summary.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
