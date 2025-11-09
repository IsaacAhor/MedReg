﻿﻿﻿"use client";
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useLogout } from '@/hooks/useAuth';
import { KpiCard } from '@/components/dashboard/KpiCard';

interface MetricsState {
  data: any;
  loading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const logout = useLogout();
  const [nhieStatus, setNhieStatus] = React.useState<MetricsState>({ data: null, loading: true, error: null });
  const [nhieMetrics, setNhieMetrics] = React.useState<MetricsState>({ data: null, loading: true, error: null });
  const [opdMetrics, setOpdMetrics] = React.useState<MetricsState>({ data: null, loading: true, error: null });
  const [queueCounts, setQueueCounts] = React.useState<MetricsState>({ data: {}, loading: true, error: null });

  const fetchMetrics = React.useCallback(() => {
    // Fetch NHIE Status
    setNhieStatus(prev => ({ ...prev, loading: true, error: null }));
    fetch('/api/nhie/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setNhieStatus({ data: d, loading: false, error: null }))
      .catch(() => setNhieStatus({ data: null, loading: false, error: 'Failed to fetch NHIE status' }));

    // Fetch NHIE Metrics
    setNhieMetrics(prev => ({ ...prev, loading: true, error: null }));
    fetch('/api/nhie/metrics', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setNhieMetrics({ data: d, loading: false, error: null }))
      .catch(() => setNhieMetrics({ data: null, loading: false, error: 'Failed to fetch NHIE metrics' }));

    // Fetch OPD Metrics
    setOpdMetrics(prev => ({ ...prev, loading: true, error: null }));
    fetch('/api/opd/metrics', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setOpdMetrics({ data: d, loading: false, error: null }))
      .catch(() => setOpdMetrics({ data: null, loading: false, error: 'Failed to fetch OPD metrics' }));

    // Fetch Queue Counts
    setQueueCounts(prev => ({ ...prev, loading: true, error: null }));
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

    Promise.all([loadQueue(triageLoc), loadQueue(consultLoc), loadQueue(pharmLoc)])
      .then(([triage, consult, pharmacy]) => {
        setQueueCounts({ data: { triage, consult, pharmacy }, loading: false, error: null });
      })
      .catch(() => setQueueCounts({ data: {}, loading: false, error: 'Failed to fetch queue counts' }));
  }, []);

  React.useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 45 seconds
    const interval = setInterval(fetchMetrics, 45000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const nhieConnected = nhieStatus.data?.connected;
  const lastSyncTime = nhieMetrics.data?.lastUpdatedAt;

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
          {/* OPD Encounters Today */}
          <KpiCard
            label="Today"
            title="OPD Encounters"
            value={opdMetrics.data?.opdEncountersToday ?? '—'}
            valueColor="text-teal-600"
            loading={opdMetrics.loading}
            error={opdMetrics.error}
          />

          {/* New Patients Today */}
          <KpiCard
            label="Registration"
            title="New Patients"
            value={opdMetrics.data?.newPatientsToday ?? '—'}
            valueColor="text-blue-600"
            loading={opdMetrics.loading}
            error={opdMetrics.error}
            subtitle="Start with Ghana Card"
          />

          {/* NHIE Sync Status */}
          <KpiCard
            label="Status"
            title="NHIE Sync"
            value={
              <div className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${nhieConnected == null ? 'bg-gray-300' : nhieConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-gray-700">{nhieConnected == null ? 'Checking…' : nhieConnected ? 'Connected' : 'Degraded'}</span>
              </div>
            }
            loading={nhieStatus.loading}
            error={nhieStatus.error}
            subtitle={lastSyncTime ? `Last sync: ${lastSyncTime}` : undefined}
          />

          {/* NHIE DLQ Count */}
          <KpiCard
            label="NHIE Queue"
            title="DLQ"
            value={nhieMetrics.data?.dlqCount ?? '—'}
            valueColor="text-orange-600"
            loading={nhieMetrics.loading}
            error={nhieMetrics.error}
            subtitle={nhieMetrics.data?.dlqCount ? `${nhieMetrics.data.dlqCount} pending` : 'No items in queue'}
          />

          {/* Triage Queue */}
          <KpiCard
            label="Nurse"
            title="Triage Queue"
            value={queueCounts.data?.triage ?? 0}
            valueColor="text-purple-600"
            loading={queueCounts.loading}
            error={queueCounts.error}
            subtitle={`${queueCounts.data?.triage ?? 0} waiting`}
            link={{ href: '/opd/triage-queue', label: 'View All' }}
          />

          {/* Consultation Queue */}
          <KpiCard
            label="Doctor"
            title="Consult Queue"
            value={queueCounts.data?.consult ?? 0}
            valueColor="text-indigo-600"
            loading={queueCounts.loading}
            error={queueCounts.error}
            subtitle={`${queueCounts.data?.consult ?? 0} waiting`}
            link={{ href: '/opd/consultation-queue', label: 'View All' }}
          />

          {/* Pharmacy Queue */}
          <KpiCard
            label="Pharmacist"
            title="Pharmacy Queue"
            value={queueCounts.data?.pharmacy ?? 0}
            valueColor="text-emerald-600"
            loading={queueCounts.loading}
            error={queueCounts.error}
            subtitle={`${queueCounts.data?.pharmacy ?? 0} waiting`}
            link={{ href: '/opd/pharmacy-queue', label: 'View All' }}
          />
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
