"use client";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import * as React from "react";

export default function PatientSuccessPage() {
  const params = useParams<{ uuid: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const folder = search.get("folder") || undefined;
  const nhieSync = search.get("nhieSync") || undefined;
  const [nhis, setNhis] = React.useState("");
  const [cov, setCov] = React.useState<null | { status: string }>(null);

  const checkCoverage = async (refresh = false) => {
    if (!/^\d{10}$/.test(nhis)) {
      setCov({ status: 'invalid' });
      return;
    }
    setCov(null);
    try {
      const res = await fetch(`/api/coverage?nhis=${encodeURIComponent(nhis)}&refresh=${refresh}`);
      const data = await res.json();
      setCov({ status: data?.status || 'error' });
    } catch {
      setCov({ status: 'error' });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Patient Registered</h1>
      <div className="space-y-3 text-gray-800">
        <div>
          <div className="text-sm text-gray-500">OpenMRS UUID</div>
          <div className="font-mono text-sm break-all">{params.uuid}</div>
        </div>
        {folder && (
          <div>
            <div className="text-sm text-gray-500">Folder Number</div>
            <div className="font-medium">{folder}</div>
          </div>
        )}
        <div>
          <div className="text-sm text-gray-500">NHIE Sync</div>
          <div className="inline-flex items-center gap-2">
            <span className={`inline-flex h-2 w-2 rounded-full ${nhieSync === 'SUCCESS' ? 'bg-green-500' : nhieSync === 'FAILED' ? 'bg-amber-500' : 'bg-gray-300'}`} />
            <span className="uppercase text-xs tracking-wide text-gray-700">{nhieSync || 'PENDING'}</span>
          </div>
        </div>

        <div className="pt-4">
          <div className="text-sm text-gray-500 mb-1">NHIS Coverage</div>
          <div className="flex gap-2 items-center">
            <input
              value={nhis}
              onChange={(e) => setNhis(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="0123456789"
              className="border rounded px-3 py-2 text-sm"
            />
            <Button variant="outline" onClick={() => checkCoverage(false)}>Check</Button>
            <Button variant="ghost" onClick={() => checkCoverage(true)}>Refresh</Button>
            {cov && (
              <span className={`ml-2 text-sm ${cov.status === 'active' ? 'text-green-600' : cov.status === 'not-found' ? 'text-amber-600' : 'text-gray-600'}`}>
                {cov.status === 'invalid' ? 'Enter 10-digit NHIS' : cov.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
        <Button onClick={() => router.back()}>Register Another</Button>
      </div>
    </div>
  );
}
