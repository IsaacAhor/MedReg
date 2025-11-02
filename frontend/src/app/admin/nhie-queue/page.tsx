"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';

type DlqItem = {
  id: number;
  patientId?: number;
  resourceType?: string;
  method?: string;
  endpoint?: string;
  responseStatus?: number;
  error?: string;
  retryCount?: number;
  updatedAt?: string;
};

export default function NHIEQueueAdminPage() {
  const [items, setItems] = React.useState<DlqItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nhie/dlq?page=${p}&size=20`, { cache: 'no-store' });
      const data = await res.json();
      setItems(data?.items || []);
      setTotal(Number(data?.total || 0));
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => { load(1); }, [load]);

  const requeue = async (id: number) => {
    await fetch('/api/nhie/dlq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load(page);
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">NHIE DLQ</h1>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Resource</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Error</th>
              <th className="text-left p-3">Updated</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b">
                <td className="p-3 font-mono">{it.id}</td>
                <td className="p-3">{it.resourceType}</td>
                <td className="p-3">{it.responseStatus ?? '—'}</td>
                <td className="p-3 max-w-md truncate" title={it.error}>{it.error || '—'}</td>
                <td className="p-3">{it.updatedAt}</td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={() => requeue(it.id)}>Requeue</Button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">{loading ? 'Loading…' : 'No DLQ items'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="outline" disabled={page<=1} onClick={() => load(page-1)}>Prev</Button>
        <span className="text-sm text-gray-600">Page {page} / {pages}</span>
        <Button variant="outline" disabled={page>=pages} onClick={() => load(page+1)}>Next</Button>
      </div>
    </div>
  );
}

