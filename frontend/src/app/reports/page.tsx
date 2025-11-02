"use client";
import * as React from 'react';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0,10));
  const [opd, setOpd] = React.useState<any[]>([]);
  const [mix, setMix] = React.useState<{ nhis?: number, cash?: number }>({});
  const [tops, setTops] = React.useState<any[]>([]);

  const load = async () => {
    const reg = await fetch(`/api/reports/opd-register?date=${date}`).then(r => r.json());
    setOpd(reg?.items || []);
    const mixRes = await fetch(`/api/reports/nhis-vs-cash?date=${date}`).then(r => r.json());
    setMix({ nhis: mixRes?.nhis ?? 0, cash: mixRes?.cash ?? 0 });
    const topsRes = await fetch(`/api/reports/top-diagnoses?from=${date}&to=${date}&limit=10`).then(r => r.json());
    setTops(topsRes?.items || []);
  };

  React.useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="border rounded px-3 py-2 text-sm" onClick={load}>Reload</button>
        <a className="border rounded px-3 py-2 text-sm" href={`/api/reports/opd-register?date=${date}&format=csv`}>Download OPD CSV</a>
        <a className="border rounded px-3 py-2 text-sm" href={`/api/reports/nhis-vs-cash?date=${date}&format=csv`}>Download NHIS/Cash CSV</a>
        <a className="border rounded px-3 py-2 text-sm" href={`/api/reports/top-diagnoses?from=${date}&to=${date}&format=csv`}>Download Top Diagnoses CSV</a>
        <a className="border rounded px-3 py-2 text-sm" href={`/api/reports/revenue?from=${date}&to=${date}&format=csv`}>Download Revenue CSV</a>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">NHIS vs Cash</div>
          <div className="mt-2 text-sm">NHIS: <span className="font-semibold">{mix.nhis ?? '—'}</span></div>
          <div className="text-sm">Cash: <span className="font-semibold">{mix.cash ?? '—'}</span></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-2">
          <div className="text-sm text-gray-500 mb-2">Top Diagnoses</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Count</th></tr></thead>
            <tbody>
            {tops.map((t, i) => (
              <tr className="border-b" key={i}><td className="p-2">{t.name || '—'}</td><td className="p-2">{t.count}</td></tr>
            ))}
            {!tops.length && <tr><td colSpan={2} className="p-4 text-center text-gray-500">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm text-gray-500 mb-2">OPD Register</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-2">Time</th>
            <th className="text-left p-2">Patient</th>
            <th className="text-left p-2">UUID</th>
            <th className="text-left p-2">Encounter</th>
          </tr>
          </thead>
          <tbody>
          {opd.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{r.datetime}</td>
              <td className="p-2">{[r.givenName, r.familyName].filter(Boolean).join(' ')}</td>
              <td className="p-2 font-mono text-xs break-all">{r.patientUuid}</td>
              <td className="p-2 font-mono text-xs break-all">{r.encounterUuid}</td>
            </tr>
          ))}
          {!opd.length && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No encounters</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
