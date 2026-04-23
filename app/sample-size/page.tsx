'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculateSampleSizePerGroup, HypothesisType } from '../../src/lib/ab-calculations';

export default function SampleSizePage() {
  const [baselineRate, setBaselineRate] = useState('10');
  const [mde, setMde] = useState('5');
  const [power, setPower] = useState('80');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<{ n: number; p2: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = calculateSampleSizePerGroup(
        Number(baselineRate) / 100,
        Number(mde),
        Number(alpha),
        Number(power) / 100,
        hypothesisType
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
        <h1 className="mt-6 text-3xl font-semibold">Sample Size Calculator</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6">
          <input value={baselineRate} onChange={(e)=>setBaselineRate(e.target.value)} className="rounded border p-3" placeholder="Baseline conversion rate (%)" />
          <input value={mde} onChange={(e)=>setMde(e.target.value)} className="rounded border p-3" placeholder="MDE (pp)" />
          <input value={power} onChange={(e)=>setPower(e.target.value)} className="rounded border p-3" placeholder="Power (%)" />
          <input value={alpha} onChange={(e)=>setAlpha(e.target.value)} className="rounded border p-3" placeholder="Alpha" />
          <select value={hypothesisType} onChange={(e)=>setHypothesisType(e.target.value as HypothesisType)} className="rounded border p-3">
            <option value="two-sided">two-sided</option>
            <option value="one-sided">one-sided</option>
          </select>
          <button className="rounded bg-ink px-4 py-3 text-white">Calculate</button>
        </form>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6">
          {error && <p className="text-red-600">{error}</p>}
          {result && (
            <div className="space-y-2">
              <p>Required sample size per group: <strong>{result.n.toLocaleString()}</strong></p>
              <p>Expected test conversion: <strong>{(result.p2 * 100).toFixed(4)}%</strong></p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
