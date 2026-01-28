import { Globe } from "@/components/ui/globe"
import { NewsArticle } from "@/lib/api/types"
import { useRouter } from "next/navigation";

interface GlobeDemoProps {
    articles?: NewsArticle[];
}

// Simple coordinate mapping for demo
const LOCATIONS: Record<string, [number, number]> = {
    'colombia': [4.5709, -74.2973],
    'co': [4.5709, -74.2973],
    'us': [37.0902, -95.7129],
    'es': [40.4637, -3.7492],
    'mx': [23.6345, -102.5528],
    'ar': [-38.4161, -63.6167],
    'fr': [46.2276, 2.2137],
    'default': [4.5709, -74.2973]
};

export function GlobeDemo({ articles = [] }: GlobeDemoProps) {
  const router = useRouter();

  // Generate markers based on article country or default to Colombia but spread out
  const markers: { location: [number, number]; size: number }[] = articles.length > 0 ? articles.map(a => {
      // Simulate slight variation so they don't stack perfectly
      const countryCode = a.country?.toLowerCase() || 'co';
      const baseLoc = LOCATIONS[countryCode] || LOCATIONS['default'];
      return {
          location: [baseLoc[0] + (Math.random() * 5 - 2.5), baseLoc[1] + (Math.random() * 5 - 2.5)] as [number, number],
          size: 0.05
      };
  }) : [
      { location: [4.5709, -74.2973], size: 0.1 } // Default Colombia
  ];

  return (
    <div 
        onClick={() => router.push('/news')}
        className="relative flex size-full h-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface px-4 py-8 md:shadow-xl cursor-pointer group"
    >
      <span className="pointer-events-none absolute top-10 whitespace-pre-wrap bg-gradient-to-b from-white to-white/40 bg-clip-text text-center text-7xl font-bold leading-none text-transparent z-10">
        GLOBAL
      </span>
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30 backdrop-blur-md">Interceptar Señales Globales</span>
      </div>
      <Globe className="top-16 opacity-80" markers={markers} />
      
      {/* Radial overlay for aesthetic blending */}
      <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(34,197,94,0.15),rgba(0,0,0,0))]" />
    </div>
  )
}
