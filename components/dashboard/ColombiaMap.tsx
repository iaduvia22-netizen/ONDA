'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { NewsArticle } from '@/lib/api/types';

// Coordenadas aproximadas para un mapa estilizado de Colombia (SVG Paths simplificados para regiones principales)
const REGIONS = [
  { id: 'andina', name: 'Región Andina', path: 'M140 180 L180 150 L200 220 L160 260 Z', color: 'text-primary', keywords: ['bogotá', 'medellín', 'cundinamarca', 'antioquia', 'soacha', 'tolima', 'boyaca'] },
  { id: 'caribe', name: 'Región Caribe', path: 'M130 80 L190 70 L200 120 L140 130 Z', color: 'text-blue-400', keywords: ['barranquilla', 'cartagena', 'santa marta', 'atlantico', 'bolivar'] },
  { id: 'pacifica', name: 'Región Pacífica', path: 'M110 160 L140 180 L130 250 L100 240 Z', color: 'text-purple-400', keywords: ['cali', 'valle', 'choco', 'cauca', 'nariño', 'buenaventura'] },
  { id: 'orinoquia', name: 'Orinoquía', path: 'M200 180 L280 190 L270 240 L200 220 Z', color: 'text-yellow-400', keywords: ['villavicencio', 'meta', 'casanare', 'arauca'] },
  { id: 'amazonia', name: 'Amazonía', path: 'M160 260 L270 240 L260 350 L170 340 Z', color: 'text-green-600', keywords: ['amazonas', 'caqueta', 'putumayo', 'leticia'] },
];

const DEFAULT_ACTIVITY_POINTS = [
    { x: 160, y: 200, label: 'Bogotá DC', pulse: 'fast' },
    { x: 150, y: 170, label: 'Medellín', pulse: 'normal' },
    { x: 130, y: 190, label: 'Cali', pulse: 'slow' },
    { x: 160, y: 90, label: 'Barranquilla', pulse: 'normal' },
];

export function ColombiaMap({ articles = [] }: { articles?: NewsArticle[] }) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // Analyze articles to find active regions
  const activeRegionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!articles.length) return counts;

    articles.forEach(article => {
        const text = (article.title + ' ' + (article.description || '')).toLowerCase();
        REGIONS.forEach(region => {
            if (region.keywords.some(k => text.includes(k))) {
                counts[region.id] = (counts[region.id] || 0) + 1;
            }
        });
    });
    return counts;
  }, [articles]);

  const gridLines = Array.from({ length: 10 }).map((_, i) => (
    <line key={i} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="currentColor" strokeOpacity="0.05" />
  ));

  return (
    <div className="relative w-full h-full min-h-[300px] bg-surface rounded-2xl border border-border p-4 overflow-hidden group">
      {/* Background Grid */}
      <svg className="absolute inset-0 w-full h-full text-white pointer-events-none">
         {gridLines}
         {activeRegion && (
             <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" opacity="0.1" />
         )}
      </svg>
      
      {/* Title Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
         <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            Impacto Regional
         </h3>
         <p className="text-xs text-text-muted">
            {Object.values(activeRegionsData).reduce((a, b) => a + b, 0)} noticias localizadas
         </p>
      </div>

      <div className="flex items-center justify-center p-4 h-full">
        <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full max-w-[350px] drop-shadow-[0_0_15px_rgba(34,197,94,0.15)]"
        >
            <path 
                d="M130 80 L190 70 L210 120 L280 190 L270 240 L260 350 L140 340 L100 240 L110 160 Z"
                className="fill-surface-hover stroke-border-light stroke-[2]"
            />

            {REGIONS.map((region) => {
                const count = activeRegionsData[region.id] || 0;
                const isActive = count > 0;
                
                return (
                    <g key={region.id} onMouseEnter={() => setActiveRegion(region.id)} onMouseLeave={() => setActiveRegion(null)}>
                        <path
                            d={region.path}
                            className={cn(
                                "transition-all duration-300 cursor-pointer stroke-transparent",
                                activeRegion === region.id ? "fill-primary/20 stroke-primary" : isActive ? "fill-primary/10" : "fill-transparent hover:fill-white/5"
                            )}
                        />
                        {/* Show count badge if active */}
                        {isActive && (
                            <text 
                                x={20} y={20} // Position is relative, simpler to just float for now or use centroid if calculated
                                className="fill-white text-[10px] font-bold"
                            >
                                {/* Positioning labels on svg paths is tricky without centroids, omitting for simplicity */}
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Static Activity Blips for Decoration */}
            {DEFAULT_ACTIVITY_POINTS.map((point, idx) => (
                <g key={idx}>
                    <circle cx={point.x} cy={point.y} r="2" className="fill-white" />
                </g>
            ))}
        </svg>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 text-right min-w-[120px]">
         <div className="text-xs text-text-muted mb-1">Región Activa</div>
         <div className="text-sm font-bold text-white">
            {activeRegion ? REGIONS.find(r => r.id === activeRegion)?.name : "General"}
         </div>
         {activeRegion && activeRegionsData[activeRegion] > 0 && (
             <div className="text-xs text-primary mt-1">
                 {activeRegionsData[activeRegion]} noticias
             </div>
         )}
      </div>
    </div>
  );
}
