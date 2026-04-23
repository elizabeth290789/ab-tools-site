'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { calculateSrmChiSquare } from '../../src/lib/ab-calculations';

type GroupRow = { expectedShare: string; observed: string };

export default function SrmPage() {
  const [groups, setGroups] = useState<GroupRow[]>([
    { expectedShare: '0.5', observed: '10120' },
    { expectedShare: '0.5', observed: '9880' }
  ]);
  const [result, setResult] = useState<ReturnType<typeof calculateSrmChiSquare> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const observed = groups.map((g) => Number(g.observed));
      const expectedShares = groups.map((g) => Number(g.expectedShare));
      setResult(calculateSrmChiSquare(observed, expectedShares));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink"><div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Back</Link>
      <h1 className="mt-6 text-3xl font-semibold">SRM Check</h1>
      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-border bg-white p-6 space-y-4">
        {groups.map((g, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-3">
            <input value={g.expectedShare} onChange={(e)=>setGroups(prev=>prev.map((x,i)=> i===idx ? {...x, expectedShare:e.target.value}:x))} className="rounded border p-3" placeholder={`Group ${idx+1} expected share`} />
            <input value={g.observed} onChange={(e)=>setGroups(prev=>prev.map((x,i)=> i===idx ? {...x, observed:e.target.value}:x))} className="rounded border p-3" placeholder={`Group ${idx+1} observed users`} />
          </div>
        ))}
        <div className="flex gap-3">
          <button type="button" onClick={()=>setGroups(prev=>[...prev,{expectedShare:'0.0',observed:'0'}])} className="rounded border px-4 py-2">+ Add group</button>
          <button className="rounded bg-ink px-4 py-2 text-white">Calculate</button>
        </div>
      </form>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        {error && <p className="text-red-600">{error}</p>}
        {result && (
          <div className="space-y-2">
            <p>Sample size: <strong>{result.sampleSize}</strong></p>
            <p>Chi-square stat: <strong>{result.chi2Stat.toFixed(6)}</strong></p>
            <p>Degrees of freedom: <strong>{result.degreesOfFreedom}</strong></p>
            <p>p-value: <strong>{result.pValue.toPrecision(6)}</strong></p>
            {result.expectedSizes.map((value, idx) => (
              <p key={idx}>Group {idx + 1}: expected {value.toFixed(3)}, diff {result.diffs[idx].toFixed(3)}</p>
            ))}
          </div>
        )}
      </section>
    </div></main>
  );
}
