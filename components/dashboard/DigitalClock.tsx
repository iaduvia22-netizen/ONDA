'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null; // Avoid hydration mismatch

  const timeString = time.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota'
  });

  const dateString = time.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-surface border border-border p-6 flex flex-col justify-center items-center h-full min-h-[160px]">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="text-4xl md:text-5xl font-bold text-white tracking-widest font-mono tabular-nums mb-2">
                {timeString}
            </div>
            <div className="h-0.5 w-12 bg-primary/50 text-transparent mb-3">.</div>
            <div className="text-text-muted text-sm md:text-base font-medium uppercase tracking-wide flex items-center gap-2">
                <Clock size={16} className="text-primary animate-pulse" />
                {dateString}
            </div>
            <div className="text-xs text-primary/60 mt-2 font-mono">
                BOGOTÁ, COLOMBIA
            </div>
        </div>
    </div>
  );
}
