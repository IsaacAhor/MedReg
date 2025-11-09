﻿﻿﻿"use client";
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useLogout } from '@/hooks/useAuth';
import { KpiCard } from '@/components/dashboard/KpiCard';

interface NHIEMetrics {
  dlqCount?: number;
  failedRetryable?: number;
  success24h?: number;
  lastUpdatedAt?: string;
}

interface OPDMetrics {
  opdEncountersToday?: number;
  newPatientsToday?: number;
}

interface QueueCounts {
  triage?: number;
  consult?: number;
  pharmacy?: number;
}

export default function DashboardPage() {
  const logout = useLogout();
  const [loading, setLoading] = React.useState(true);
  const [nhieConnected, setNhieConnected] = React.useState<boolean | null>(null);
  const [metrics, setMetrics] = React.useState<NHIEMetrics | null>(null);
  const [opd, setOpd] = React.useState<OPDMetrics | null>(null);
  const [queueCounts, setQueueCounts] = React.useState<QueueCounts>({});
  const [error, setError] = React.useState<string | null>(null);

  const REFRESH_INTERVAL = 30000; // 30 seconds

  const loadMetrics = React.useCallback(async () => {
    try {
      setError(null);
      const [nhieStatusRes, nhieMetricsRes, opdMetricsRes] = await Promise.all([
        fetch('/api/nhie/status', { cache: 'no-store' }),
        fetch('/api/nhie/metrics', { cache: 'no-store' }),
        fetch('/api/opd/metrics', { cache: 'no-store' }),
      ]);

      const [nhieStatus, nhieMetrics, opdMetrics] = await Promise.all([
        nhieStatusRes.json().catch(() => ({})),
        nhieMetricsRes.json().catch(() => ({})),
        opdMetricsRes.json().catch(() => ({})),
      ]);

      setNhieConnected(!!nhieStatus?.connected);
      setMetrics(nhieMetrics || {});
      setOpd(opdMetrics || {});
    } catch (err) {
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueues = React.useCallback(async () => {
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

    const [t, c, p] = await Promise.all([
      loadQueue(triageLoc),
      loadQueue(consultLoc),
      loadQueue(pharmLoc)
    ]);

    setQueueCounts({ triage: t, consult: c, pharmacy: p });
  }, []);

  React.useEffect(() => {
    loadMetrics();
    loadQueues();

    // Auto-refresh metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      loadMetrics();
      loadQueues();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(metricsInterval);
    };
  }, [loadMetrics, loadQueues]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <Button variant="outline" onClick={() => logout.mutate()}>Sign Out</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <KpiCard
            label="Today"
            title="OPD Encounters"
            value={opd?.opdEncountersToday ?? '—'}
            loading={loading}
          />

          <KpiCard
            label="Today"
            title="New Patients"
            value={opd?.newPatientsToday ?? '—'}
            loading={loading}
          />

          <KpiCard
            label="Status"
            title="NHIE Sync"
            loading={loading}
            value={
              <div className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  nhieConnected == null ? 'bg-gray-300' :
                  nhieConnected ? 'bg-green-500' : 'bg-amber-500'
                }`} />
                <span className="text-gray-700">
                  {nhieConnected == null ? 'Checking' :
                   nhieConnected ? 'Connected' : 'Degraded'}
                </span>
              </div>
            }
            footer={
              metrics?.lastUpdatedAt && (
                <div className="text-xs text-gray-500">
                  Last sync: {new Date(metrics.lastUpdatedAt).toLocaleString()}
                </div>
              )
            }
          />

          <KpiCard
            label="NHIE Queue"
            title="DLQ Backlog"
            value={`${metrics?.dlqCount ?? 0} pending`}
            loading={loading}
            footer={
              metrics?.failedRetryable !== undefined && metrics.failedRetryable > 0 && (
                <div className="text-xs text-amber-600">
                  {metrics.failedRetryable} retryable
                </div>
              )
            }
          />

          <KpiCard
            label="NHIE Success"
            title="Last 24 Hours"
            value={`${metrics?.success24h ?? 0} synced`}
            loading={loading}
          />

          {/* Role queue widgets */}
          <KpiCard
            label="Nurse"
            title="Triage Queue"
            value={`${queueCounts.triage ?? 0} waiting`}
            loading={loading}
            footer={
              <a className="text-indigo-600 hover:underline text-sm" href="/opd/triage-queue">
                View All
              </a>
            }
          />

          <KpiCard
            label="Doctor"
            title="Consult Queue"
            value={`${queueCounts.consult ?? 0} waiting`}
            loading={loading}
            footer={
              <a className="text-indigo-600 hover:underline text-sm" href="/opd/consultation-queue">
                View All
              </a>
            }
          />

          <KpiCard
            label="Pharmacist"
            title="Pharmacy Queue"
            value={`${queueCounts.pharmacy ?? 0} waiting`}
            loading={loading}
            footer={
              <a className="text-indigo-600 hover:underline text-sm" href="/opd/pharmacy-queue">
                View All
              </a>
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <a
            className="border rounded px-3 py-2 hover:bg-gray-50"
            href={`/api/reports/opd-register?date=${new Date().toISOString().slice(0,10)}&format=csv`}
          >
            Download Today&apos;s OPD CSV
          </a>
          <a
            className="border rounded px-3 py-2 hover:bg-gray-50"
            href={`/api/reports/nhis-vs-cash?date=${new Date().toISOString().slice(0,10)}&format=csv`}
          >
            Download Today&apos;s NHIS/Cash CSV
          </a>
          <a
            className="border rounded px-3 py-2 hover:bg-gray-50"
            href={`/api/reports/top-diagnoses?from=${new Date().toISOString().slice(0,10)}&to=${new Date().toISOString().slice(0,10)}&format=csv`}
          >
            Download Today&apos;s Top Diagnoses CSV
          </a>
        </div>
      </main>
    </div>
  );
}
