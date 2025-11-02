"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TriagePage() {
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
      const ok = isAdmin || roles.includes('nurse') || roles.includes('records officer');
      setAllowed(ok);
    } catch { setAllowed(true); }
  }, []);
  const [temperature, setTemperature] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [pulse, setPulse] = React.useState('');
  const [sbp, setSbp] = React.useState('');
  const [dbp, setDbp] = React.useState('');
  const [status, setStatus] = React.useState<string | null>(null);

  const submit = async () => {
    setStatus(null);
    const res = await fetch('/api/opd/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientUuid,
        temperature: temperature ? Number(temperature) : undefined,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        pulse: pulse ? Number(pulse) : undefined,
        systolic: sbp ? Number(sbp) : undefined,
        diastolic: dbp ? Number(dbp) : undefined,
      }),
    });
    const data = await res.json();
    setStatus(res.ok ? 'Saved' : (data?.error || 'Failed'));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">OPD Triage</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-gray-600">Patient UUID</label>
          <Input value={patientUuid} onChange={(e) => setPatientUuid(e.target.value)} placeholder="patient-uuid" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Temperature (°C)</label>
          <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Pulse (bpm)</label>
          <Input value={pulse} onChange={(e) => setPulse(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Weight (kg)</label>
          <Input value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Height (cm)</label>
          <Input value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Systolic BP (mmHg)</label>
          <Input value={sbp} onChange={(e) => setSbp(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Diastolic BP (mmHg)</label>
          <Input value={dbp} onChange={(e) => setDbp(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={!allowed}>Save Triage</Button>
        {!allowed && <span className="text-xs text-amber-600">Insufficient role to save triage</span>}
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
}
