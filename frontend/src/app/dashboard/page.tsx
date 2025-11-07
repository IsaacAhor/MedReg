﻿﻿﻿"use client";
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useLogout } from '@/hooks/useAuth';

export default function DashboardPage() {
  const logout = useLogout();
  const [nhieConnected, setNhieConnected] = React.useState<boolean | null>(null);
  const [metrics, setMetrics] = React.useState<{ dlqCount?: number } | null>(null);
  const [opd, setOpd] = React.useState<{ opdEncountersToday?: number, newPatientsToday?: number } | null>(null);
  const [queueCounts, setQueueCounts] = React.useState<{ triage?: number; consult?: number; pharmacy?: number }>({});

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/nhie/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (mounted) setNhieConnected(!!d?.connected); })
      .catch(() => { if (mounted) setNhieConnected(false); });
    fetch('/api/nhie/metrics', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (mounted) setMetrics(d || {}); })
      .catch(() => { if (mounted) setMetrics({}); });
    fetch('/api/opd/metrics', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (mounted) setOpd(d || {}); })
      .catch(() => { if (mounted) setOpd({}); });
    // Queue widgets (best-effort)
    const triageLoc = process.env.NEXT_PUBLIC_TRIAGE_LOCATION_UUID || '';
    const consultLoc = process.env.NEXT_PUBLIC_CONSULTATION_LOCATION_UUID || '';
    const pharmLoc = process.env.NEXT_PUBLIC_PHARMACY_LOCATION_UUID || '';
    const loadQueue = async (loc?: string) => {
      if (!loc) return 0;
      try {
        const r = await fetch(`/api/opd/queue/${encodeURIComponent(loc)}?status=PENDING`, { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        return Array.isArray(j?.results) ? j.results.length : 0;
      } catch { return 0; }
    };
    Promise.all([loadQueue(triageLoc), loadQueue(consultLoc), loadQueue(pharmLoc)]).then(([t, c, p]) => {
      if (mounted) setQueueCounts({ triage: t, consult: c, pharmacy: p });
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <Button variant="outline" onClick={() => logout.mutate()}>Sign Out</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Today</div>
            <div className="text-3xl font-bold text-gray-900">OPD Encounters</div>
            <div className="text-2xl text-teal-600 mt-2">${opd?.opdEncountersToday ?? "—"}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-3xl font-bold text-gray-900">NHIE Sync</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${nhieConnected == null ? 'bg-gray-300' : nhieConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-gray-700">{nhieConnected == null ? 'Checking�' : nhieConnected ? 'Connected' : 'Degraded'}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Registration</div>
            <div className="text-3xl font-bold text-gray-900">Patients</div>
            <div className="text-gray-600 mt-2">Start with Ghana Card</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">NHIE Queue</div>
            <div className="text-3xl font-bold text-gray-900">DLQ</div>
            <div className="text-gray-600 mt-2">{metrics?.dlqCount ?? '-'} pending</div>
          </div>
          {/* Role queue widgets */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Nurse</div>
            <div className="text-3xl font-bold text-gray-900">Triage Queue</div>
            <div className="text-gray-600 mt-2">{queueCounts.triage ?? 0} waiting</div>
            <div className="mt-3"><a className="text-indigo-600 hover:underline text-sm" href="/opd/triage-queue">View All</a></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Doctor</div>
            <div className="text-3xl font-bold text-gray-900">Consult Queue</div>
            <div className="text-gray-600 mt-2">{queueCounts.consult ?? 0} waiting</div>
            <div className="mt-3"><a className="text-indigo-600 hover:underline text-sm" href="/opd/consultation-queue">View All</a></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Pharmacist</div>
            <div className="text-3xl font-bold text-gray-900">Pharmacy Queue</div>
            <div className="text-gray-600 mt-2">{queueCounts.pharmacy ?? 0} waiting</div>
            <div className="mt-3"><a className="text-indigo-600 hover:underline text-sm" href="/opd/pharmacy-queue">View All</a></div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <a className="border rounded px-3 py-2" href={`/api/reports/opd-register?date=${new Date().toISOString().slice(0,10)}&format=csv`}>Download Today’s OPD CSV</a>
          <a className="border rounded px-3 py-2" href={`/api/reports/nhis-vs-cash?date=${new Date().toISOString().slice(0,10)}&format=csv`}>Download Today’s NHIS/Cash CSV</a>
          <a className="border rounded px-3 py-2" href={`/api/reports/top-diagnoses?from=${new Date().toISOString().slice(0,10)}&to=${new Date().toISOString().slice(0,10)}&format=csv`}>Download Today’s Top Diagnoses CSV</a>
        </div>
      </main>
    </div>
  );
}
