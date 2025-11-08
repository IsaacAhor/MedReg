import * as React from 'react';

export interface KpiCardProps {
  title: string;
  value: string | number | React.ReactNode;
  label?: string;
  subtitle?: string | React.ReactNode;
  loading?: boolean;
  error?: string | null;
  icon?: React.ReactNode;
  valueColor?: string;
  link?: {
    href: string;
    label: string;
  };
}

export function KpiCard({
  title,
  value,
  label,
  subtitle,
  loading = false,
  error = null,
  icon,
  valueColor = 'text-gray-900',
  link,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {label && <div className="text-sm text-gray-500">{label}</div>}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-3xl font-bold text-gray-900">{title}</div>
          <div className={`text-2xl ${valueColor} mt-2`}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-red-500">Error: {error}</div>
            ) : (
              value
            )}
          </div>
          {subtitle && !loading && !error && (
            <div className="text-gray-600 mt-2">{subtitle}</div>
          )}
          {link && !loading && !error && (
            <div className="mt-3">
              <a
                className="text-indigo-600 hover:underline text-sm"
                href={link.href}
              >
                {link.label}
              </a>
            </div>
          )}
        </div>
        {icon && <div className="ml-4">{icon}</div>}
      </div>
    </div>
  );
}
