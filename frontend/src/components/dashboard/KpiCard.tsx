import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps {
  label: string;
  title: string;
  value?: string | number | React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function KpiCard({ label, title, value, loading, error, className, footer }: KpiCardProps) {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mt-1">{title}</div>

      {loading ? (
        <div className="mt-3">
          <Skeleton className="h-8 w-24" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 mt-2">{error}</div>
      ) : (
        <div className="mt-2">
          {typeof value === 'string' || typeof value === 'number' ? (
            <div className="text-2xl text-teal-600">{value}</div>
          ) : (
            value
          )}
        </div>
      )}

      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
