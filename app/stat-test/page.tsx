'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculateTwoProportionZTest, HypothesisType } from '../../src/lib/ab-calculations';

export default function StatTestPage() {
  const [successA, setSuccessA] = useState('540');
  const [nA, setNA] = useState('5000');
  const [successB, setSuccessB] = useState('590');
  const [nB, setNB] = useState('5100');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<ReturnType<typeof calculateTwoProportionZTest> | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(calculateTwoProportionZTest(Number(nA), Number(successA), Number(nB), Number(successB), Number(alpha), hypothesisType));
  };

  const verdict = result ? (result.pValue < Number(alpha) ? 'Статистически значимо' : 'Статистически незначимо') : null;

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="mt-6 text-3xl font-semibold">Statistical Significance Test</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6">
        <input value={successA} onChange={(e)=>setSuccessA(e.target.value)} className="rounded border p-3" placeholder="Control conversions" />
        <input value={nA} onChange={(e)=>setNA(e.target.value)} className="rounded border p-3" placeholder="Control users" />
        <input value={successB} onChange={(e)=>setSuccessB(e.target.value)} className="rounded border p-3" placeholder="Test conversions" />
        <input value={nB} onChange={(e)=>setNB(e.target.value)} className="rounded border p-3" placeholder="Test users" />
        <input value={alpha} onChange={(e)=>setAlpha(e.target.value)} className="rounded border p-3" placeholder="Alpha" />
        <select value={hypothesisType} onChange={(e)=>setHypothesisType(e.target.value as HypothesisType)} className="rounded border p-3"><option value="two-sided">two-sided</option><option value="one-sided">one-sided</option></select>
        <button className="rounded bg-ink px-4 py-3 text-white">Calculate</button>
      </form>
      {result && <section className="mt-6 rounded-2xl border border-border bg-white p-6 space-y-2">
        <p>Control conversion: <strong>{(result.pA * 100).toFixed(4)}%</strong></p>
        <p>Test conversion: <strong>{(result.pB * 100).toFixed(4)}%</strong></p>
        <p>Diff: <strong>{(result.diff * 100).toFixed(4)} pp</strong></p>
        <p>Uplift: <strong>{result.upliftPct.toFixed(4)}%</strong></p>
        <p>Stat (z): <strong>{result.zStat.toFixed(6)}</strong></p>
        <p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p>
        <p>Confidence interval: <strong>[{(result.ciLow * 100).toFixed(4)} pp; {(result.ciHigh * 100).toFixed(4)} pp]</strong></p>
        <p>Вывод: <strong>{verdict}</strong></p>
      </section>}
    </div></main>
  );
}
