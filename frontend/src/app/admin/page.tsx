"use client";
import Link from 'next/link';

export default function AdminHomePage() {
  const tiles = [
    { href: "/admin/users", title: "Users", desc: "Manage facility users and roles" },
    { href: "/admin/roles", title: "Roles", desc: "View role privileges (read-only MVP)" },
    { href: "/admin/facility", title: "Facility", desc: "Facility code, region, identifiers" },
    { href: "/admin/nhie-queue", title: "NHIE Monitor", desc: "Queue, DLQ, and sync status" },
    { href: "/admin/reports", title: "Reports", desc: "OPD register and KPIs" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
      <p className="text-sm text-gray-600 mb-6">White-labeled admin area. OpenMRS UI is not exposed.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="border rounded-md p-4 hover:bg-gray-50">
            <div className="font-medium">{t.title}</div>
            <div className="text-sm text-gray-600">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

