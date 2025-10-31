"use client";
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useAuth';

export default function DashboardPage() {
  const logout = useLogout();
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
            <div className="text-3xl font-bold text-gray-900">OPD Visits</div>
            <div className="text-2xl text-teal-600 mt-2">—</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-3xl font-bold text-gray-900">NHIE Sync</div>
            <div className="text-gray-600 mt-2">Connected (sandbox)</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500">Registration</div>
            <div className="text-3xl font-bold text-gray-900">Patients</div>
            <div className="text-gray-600 mt-2">Start with Ghana Card</div>
          </div>
        </div>
      </main>
    </div>
  );
}

