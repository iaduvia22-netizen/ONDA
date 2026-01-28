'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { Newspaper, TrendingUp, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useNewsStore } from '@/lib/store/newsStore';
import { fetchNewsAction } from '@/app/actions/fetchNews';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
import { GlobeDemo } from '@/components/dashboard/GlobeDemo';

export default function Home() {
  const { articles, setArticles, _hasHydrated } = useNewsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de noticias usando Server Action
  useEffect(() => {
    if (!_hasHydrated) return;

    const loadNews = async () => {
      // Si ya hay artículos cargados (ej. por navegación), no recargamos para ahorrar API calls
      if (articles.length > 0) return;

      setIsLoading(true);
      setError(null);
      
      try {
        const news = await fetchNewsAction();

        if (news.length === 0) {
           setError('No se encontraron noticias recientes. Verifica la configuración de la API.');
        } else {
           setArticles(news);
        }
      } catch (err) {
        console.error(err);
        setError('Error de conexión con el servicio de noticias.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [setArticles, articles.length, _hasHydrated]);

  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header Section */}
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Análisis de Onda Global</h1>
          <p className="text-text-muted mt-1">
            Sincronización en tiempo real con el flujo informativo mundial.
          </p>
        </div>
        <div className="bg-surface border-primary/20 text-primary flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
            <span className="bg-primary relative inline-flex h-2.5 w-2.5 rounded-full"></span>
          </span>
          Sistemas Operativos Estables
        </div>
      </header>

      {/* DASHBOARD TOP ROW: CLOCK & MAP & STATS */}
      <section aria-label="Métricas Principales" className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Clock (4 cols) */}
        <div className="md:col-span-12 lg:col-span-4 h-full">
            <DigitalClock />
        </div>
        
        {/* Stats Grid */}
        <div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
             <StatsCard
                label="Frecuencia de Noticias"
                value={articles.length.toString()}
                icon={Newspaper}
                trend={articles.length > 0 ? "+12%" : "Analizando..."}
                trendUp={true}
            />
             <StatsCard
                label="Epicentro de Tendencia"
                value="Colombia"
                icon={TrendingUp}
                trend="+5.4%"
                trendUp={true}
            />
             <StatsCard
                label="Alertas Críticas"
                value="0"
                icon={AlertCircle}
                trend="Vigilancia Activa"
                trendUp={true}
            />
             <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center h-full group hover:border-primary/30 transition-all duration-300">
                  <h4 className="text-text-muted text-sm font-medium mb-1">Estado de Red</h4>
                  <div className="text-xl font-bold text-green-500 flex items-center gap-2">
                     <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"/>
                     CONECTADO
                  </div>
             </div>
        </div>
      </section>

      {/* ROW 2: VISUALIZATION (Globe Only) */}
      <section aria-label="Visualización Geográfica" className="grid grid-cols-1 gap-6 h-auto min-h-[500px] mb-8">
            <div className="relative h-[600px] bg-surface/30 rounded-2xl border border-border overflow-hidden group">
                 <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary border border-primary/20">GLOBAL RADAR</div>
                 <GlobeDemo articles={articles} />
            </div>
      </section>

      {/* Main Content Area */}
      <section aria-label="Flujo de Noticias" className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-primary w-5 h-5" />
            <h2 className="text-xl font-bold text-white tracking-tight">Últimas Detecciones de Onda</h2>
          </div>
          {error && (
            <span className="text-red-400 bg-red-400/10 border-red-400/20 rounded-full border px-4 py-1 text-xs font-medium animate-bounce">
              {error}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border-border overflow-hidden rounded-2xl border flex flex-col h-[400px]"
              >
                <div className="h-48 w-full bg-surface-hover animate-pulse" />
                <div className="p-5 space-y-4 flex-1">
                   <div className="h-4 w-1/4 bg-surface-hover animate-pulse rounded" />
                   <div className="h-6 w-full bg-surface-hover animate-pulse rounded" />
                   <div className="h-4 w-5/6 bg-surface-hover animate-pulse rounded" />
                   <div className="mt-auto pt-4 border-t border-border flex justify-between">
                     <div className="h-8 w-20 bg-surface-hover animate-pulse rounded" />
                     <div className="h-8 w-24 bg-surface-hover animate-pulse rounded" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NewsFeed articles={articles} />
        )}
      </section>
    </div>
  );
}
