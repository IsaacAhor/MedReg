"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

type Item = { drug: string; strength?: string; form?: string; dosage?: string; frequency?: string; duration?: string; quantity?: number; instructions?: string };

export default function DispensePage() {
  const router = useRouter();
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
      const ok = isAdmin || roles.includes('pharmacist');
      setAllowed(ok);
    } catch { setAllowed(true); }
  }, []);
  const [billingType, setBillingType] = React.useState<'NHIS'|'Cash'|''>('');
  const [items, setItems] = React.useState<Item[]>([{ drug: '' }]);
  const [status, setStatus] = React.useState<string | null>(null);

  const addItem = () => setItems((s) => [...s, { drug: '' }]);
  const set = (i: number, k: keyof Item, v: any) => setItems((s) => s.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const remove = (i: number) => setItems((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    setStatus(null);
    const res = await fetch('/api/opd/dispense', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientUuid, billingType: billingType || undefined, items })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data?.error || 'Failed');
      toast.error('Failed to dispense', { description: data?.error || 'Please try again' });
      return;
    }
    setStatus('Saved');
    toast.success('Dispense saved', { description: 'Visit marked complete' });
    setTimeout(() => router.push('/opd/pharmacy-queue'), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pharmacy Queue', href: '/opd/pharmacy-queue' },
        { label: 'Dispense' },
      ]} />
      <h1 className="text-2xl font-semibold mb-4">OPD Dispense</h1>
      <div className="mb-4">
        <label className="text-sm text-gray-600">Patient UUID</label>
        <Input value={patientUuid} onChange={(e) => setPatientUuid(e.target.value)} placeholder="patient-uuid" />
      </div>
      <div className="mb-4">
        <label className="text-sm text-gray-600 mr-3">Billing</label>
        <select className="border rounded px-3 py-2 text-sm" value={billingType} onChange={(e) => setBillingType(e.target.value as any)}>
          <option value="">Select</option>
          <option value="NHIS">NHIS</option>
          <option value="Cash">Cash</option>
        </select>
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border rounded p-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="Drug" value={it.drug} onChange={(e) => set(i, 'drug', e.target.value)} />
              <Input placeholder="Strength" value={it.strength || ''} onChange={(e) => set(i, 'strength', e.target.value)} />
              <Input placeholder="Form" value={it.form || ''} onChange={(e) => set(i, 'form', e.target.value)} />
              <Input placeholder="Dosage" value={it.dosage || ''} onChange={(e) => set(i, 'dosage', e.target.value)} />
              <Input placeholder="Frequency" value={it.frequency || ''} onChange={(e) => set(i, 'frequency', e.target.value)} />
              <Input placeholder="Duration" value={it.duration || ''} onChange={(e) => set(i, 'duration', e.target.value)} />
              <Input placeholder="Quantity" value={it.quantity ?? ''} onChange={(e) => set(i, 'quantity', Number(e.target.value || 0))} />
              <Input placeholder="Instructions" value={it.instructions || ''} onChange={(e) => set(i, 'instructions', e.target.value)} />
            </div>
            <div className="mt-2 text-right">
              <Button variant="ghost" onClick={() => remove(i)} disabled={items.length === 1}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="outline" onClick={addItem}>Add Item</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/opd/pharmacy-queue')}
        >
          Cancel
        </Button>
        <Button onClick={submit} disabled={!patientUuid || !items[0]?.drug || !allowed}>Save Dispense</Button>
        {!allowed && <span className="text-xs text-amber-600">Insufficient role to save dispense</span>}
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
}
