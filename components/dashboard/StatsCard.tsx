'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
}

export function StatsCard({ label, value, trend, trendUp, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-surface border-border hover:border-border-light group rounded-2xl border p-6 transition-all duration-300">
      <div className="mb-4 flex items-start justify-between">
        <div className="bg-background/50 text-primary rounded-xl p-3 transition-transform duration-300 group-hover:scale-110">
          <Icon size={24} />
        </div>
        {trend && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-text-muted mb-1 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
      </div>
    </div>
  );
}
