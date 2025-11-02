"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TOP_DIAGNOSES } from '@/lib/gh/top-diagnoses';

export default function ConsultationPage() {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialUuid = search?.get('patientUuid') || '';
  const [patientUuid, setPatientUuid] = React.useState(initialUuid);
  const [allowed, setAllowed] = React.useState(true);
  React.useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|;\s*)omrsRole=([^;]+)/);
      const rolesCsv = m ? decodeURIComponent(m[1]) : '';
      const roles = rolesCsv.split(',').map(r => r.trim().toLowerCase());
      const isAdmin = roles.includes('admin') || roles.includes('platform admin') || roles.includes('facility admin');
      const ok = isAdmin || roles.includes('doctor');
      setAllowed(ok);
    } catch { setAllowed(true); }
  }, []);
  const [notes, setNotes] = React.useState('');
  const [selected, setSelected] = React.useState<{ code: string, display: string }[]>([]);
  const [status, setStatus] = React.useState<string | null>(null);

  const toggle = (d: { code: string, display: string }) => {
    setSelected((s) => s.find(x => x.code === d.code) ? s.filter(x => x.code !== d.code) : [...s, d]);
  };

  const submit = async () => {
    setStatus(null);
    const res = await fetch('/api/opd/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientUuid, diagnoses: selected, notes }),
    });
    const data = await res.json();
    setStatus(res.ok ? 'Saved' : (data?.error || 'Failed'));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">OPD Consultation</h1>
      <div className="mb-4">
        <label className="text-sm text-gray-600">Patient UUID</label>
        <Input value={patientUuid} onChange={(e) => setPatientUuid(e.target.value)} placeholder="patient-uuid" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {TOP_DIAGNOSES.map(d => (
          <button key={d.code} onClick={() => toggle(d)}
                  className={`text-left border rounded px-3 py-2 text-sm ${selected.find(x => x.code === d.code) ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}>
            <div className="font-medium">{d.display}</div>
            <div className="text-xs text-gray-600">{d.code}</div>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-600">Notes</label>
        <textarea className="w-full border rounded p-2 text-sm" rows={4}
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={!patientUuid || selected.length === 0 || !allowed}>Save Consultation</Button>
        {!allowed && <span className="text-xs text-amber-600">Insufficient role to save consultation</span>}
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
}
