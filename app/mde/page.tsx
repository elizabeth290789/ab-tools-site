'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculateMdeForProportion, HypothesisType } from '../../src/lib/ab-calculations';

export default function MdePage() {
  const [baselineRate, setBaselineRate] = useState('12');
  const [nPerGroup, setNPerGroup] = useState('35000');
  const [power, setPower] = useState('80');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<{ mde: number; detectableRate: number; upliftPct: number } | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(
      calculateMdeForProportion(
        Number(baselineRate) / 100,
        Number(nPerGroup),
        Number(alpha),
        Number(power) / 100,
        hypothesisType
      )
    );
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="mt-6 text-3xl font-semibold">MDE Calculator</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6">
        <input value={baselineRate} onChange={(e)=>setBaselineRate(e.target.value)} className="rounded border p-3" placeholder="Baseline conversion rate (%)" />
        <input value={nPerGroup} onChange={(e)=>setNPerGroup(e.target.value)} className="rounded border p-3" placeholder="Users per group" />
        <input value={power} onChange={(e)=>setPower(e.target.value)} className="rounded border p-3" placeholder="Power (%)" />
        <input value={alpha} onChange={(e)=>setAlpha(e.target.value)} className="rounded border p-3" placeholder="Alpha" />
        <select value={hypothesisType} onChange={(e)=>setHypothesisType(e.target.value as HypothesisType)} className="rounded border p-3">
          <option value="two-sided">two-sided</option><option value="one-sided">one-sided</option>
        </select>
        <button className="rounded bg-ink px-4 py-3 text-white">Calculate</button>
      </form>
      {result && <section className="mt-6 rounded-2xl border border-border bg-white p-6 space-y-2">
        <p>MDE: <strong>{(result.mde * 100).toFixed(4)} pp</strong></p>
        <p>Detectable conversion: <strong>{(result.detectableRate * 100).toFixed(4)}%</strong></p>
        <p>Uplift: <strong>{result.upliftPct.toFixed(4)}%</strong></p>
      </section>}
    </div></main>
  );
}
