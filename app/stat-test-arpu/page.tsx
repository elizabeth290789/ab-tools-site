'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { HypothesisType, welchTtestFromStats } from '../../src/lib/ab-calculations';

export default function StatTestArpuPage() {
  const [meanA, setMeanA] = useState('15.2');
  const [stdA, setStdA] = useState('42');
  const [nA, setNA] = useState('5000');
  const [meanB, setMeanB] = useState('16.0');
  const [stdB, setStdB] = useState('43');
  const [nB, setNB] = useState('5100');
  const [alpha, setAlpha] = useState('0.05');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>('two-sided');
  const [result, setResult] = useState<ReturnType<typeof welchTtestFromStats> | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(welchTtestFromStats(Number(meanA), Number(stdA), Number(nA), Number(meanB), Number(stdB), Number(nB), Number(alpha), hypothesisType));
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="mt-6 text-3xl font-semibold">Stat Test ARPU (Welch)</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6">
        <input value={meanA} onChange={(e)=>setMeanA(e.target.value)} className="rounded border p-3" placeholder="Control mean" />
        <input value={stdA} onChange={(e)=>setStdA(e.target.value)} className="rounded border p-3" placeholder="Control std" />
        <input value={nA} onChange={(e)=>setNA(e.target.value)} className="rounded border p-3" placeholder="Control n" />
        <input value={meanB} onChange={(e)=>setMeanB(e.target.value)} className="rounded border p-3" placeholder="Test mean" />
        <input value={stdB} onChange={(e)=>setStdB(e.target.value)} className="rounded border p-3" placeholder="Test std" />
        <input value={nB} onChange={(e)=>setNB(e.target.value)} className="rounded border p-3" placeholder="Test n" />
        <input value={alpha} onChange={(e)=>setAlpha(e.target.value)} className="rounded border p-3" placeholder="Alpha" />
        <select value={hypothesisType} onChange={(e)=>setHypothesisType(e.target.value as HypothesisType)} className="rounded border p-3"><option value="two-sided">two-sided</option><option value="one-sided">one-sided</option></select>
        <button className="rounded bg-ink px-4 py-3 text-white">Calculate</button>
      </form>
      {result && <section className="mt-6 rounded-2xl border border-border bg-white p-6 space-y-2">
        <p>Control ARPU: <strong>{result.meanA.toFixed(4)}</strong></p>
        <p>Test ARPU: <strong>{result.meanB.toFixed(4)}</strong></p>
        <p>Diff: <strong>{result.diff.toFixed(6)}</strong></p>
        <p>Uplift: <strong>{Number.isNaN(result.upliftPct) ? 'nan' : `${result.upliftPct.toFixed(4)}%`}</strong></p>
        <p>Stat (t): <strong>{result.tStat.toFixed(6)}</strong></p>
        <p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p>
        <p>Confidence interval: <strong>[{result.ciLow.toFixed(6)}; {result.ciHigh.toFixed(6)}]</strong></p>
      </section>}
    </div></main>
  );
}
