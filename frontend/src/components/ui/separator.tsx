"use client";
import * as React from 'react';

type SeparatorProps = {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
};

export function Separator({ className = '', orientation = 'horizontal' }: SeparatorProps = {}) {
  const base = 'bg-gray-200';
  const cls = orientation === 'vertical' ? `w-px h-full ${base}` : `h-px w-full ${base}`;
  return <div role="separator" className={`${cls} ${className}`} />;
}
