'use client';

import { useEffect, useState } from 'react';
import { useNewsStore } from '@/lib/store/newsStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { fetchNewsAction } from '@/app/actions/fetchNews';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { MapPin, LocateFixed, Award, Loader2, RefreshCw } from 'lucide-react';

export default function LocalPage() {
  const { setArticles, articles, _hasHydrated } = useNewsStore();
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todo Soacha/Cundinamarca');

  useEffect(() => {
    if (!_hasHydrated) return;

    const loadLocalNews = async () => {
      setLoading(true);
      try {
        // Consultamos específicamente por regiones locales
        const query = 'Soacha OR Cundinamarca OR Bogotá OR Colombia';
        const news = await fetchNewsAction(undefined, query);
        setArticles(news);

        if (news.length > 0) {
          useNotificationStore.getState().addNotification({
            title: 'Sonda Regional Activa',
            message: `Sincronizados ${news.length} nodos locales de Soacha, Cundinamarca y Bogotá.`,
            type: 'info'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLocalNews();
  }, [setArticles, _hasHydrated]);

  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="bg-gradient-to-r from-green-900/40 to-black border border-green-800/30 p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
                <MapPin className="text-primary" size={32} /> 
                Noticias Locales
            </h1>
            <p className="text-text-muted text-lg max-w-2xl">
                Cobertura prioritaria para <span className="text-white font-bold">Soacha, Cundinamarca y Bogotá</span>. 
                Mantente informado de lo que sucede en tu territorio.
            </p>
            
             <div className="mt-6 flex flex-wrap gap-2 items-center justify-between w-full">
                <div className="flex flex-wrap gap-2">
                  {['Soacha', 'Cundinamarca', 'Bogotá DC', 'Colombia Nacional'].map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-black/40 border border-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide">
                          <LocateFixed size={12} /> {tag}
                      </span>
                  ))}
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-95 ml-auto"
                >
                  <RefreshCw size={14} /> Recargar Sesión
                </button>
             </div>
        </div>
        
        {/* Background Decorative Map Pattern */}
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
             <LocateFixed size={300} className="text-primary absolute -top-10 -right-10" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Regional Ranking Section */}
        {articles.length > 0 && (
            <div className="bg-surface border-border rounded-xl border p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="text-yellow-500" /> Top Impacto Regional
                </h2>
                <div className="space-y-4">
                    {articles
                        .filter(a => (a.title + (a.description || '')).toLowerCase().match(/soacha|cundinamarca/))
                        .slice(0, 3)
                        .map((article, idx) => (
                        <div key={article.id || article.url} className="flex gap-4 items-start border-b border-border/50 last:border-0 pb-3 last:pb-0">
                            <span className="text-2xl font-bold text-border-light">#{idx+1}</span>
                            <div>
                                <h3 className="font-bold text-white leading-tight hover:text-primary cursor-pointer transition-colors">
                                    <a href={article.url} target="_blank">{article.title}</a>
                                </h3>
                                <p className="text-xs text-text-muted mt-1 flex gap-2">
                                    <span className="text-primary bg-primary/10 px-1 rounded">Alta Relevancia</span>
                                    • {article.source?.name}
                                </p>
                            </div>
                        </div>
                    ))}
                    {/* Fallback si no hay específicos */}
                    {articles.filter(a => !(a.title + (a.description || '')).toLowerCase().match(/soacha|cundinamarca/)).slice(0, Math.max(0, 3 - articles.filter(a => (a.title + (a.description || '')).toLowerCase().match(/soacha|cundinamarca/)).length)).map((article, idx) => (
                         <div key={article.id || article.url} className="flex gap-4 items-start border-b border-border/50 last:border-0 pb-3 last:pb-0">
                            <span className="text-2xl font-bold text-border-light">#{idx + 1 + articles.filter(a => (a.title + (a.description || '')).toLowerCase().match(/soacha|cundinamarca/)).length}</span>
                            <div>
                                <h3 className="font-bold text-white leading-tight hover:text-primary cursor-pointer transition-colors">
                                    <a href={article.url} target="_blank">{article.title}</a>
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    {article.source?.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
            Últimas Actualizaciones Regionales
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border-border h-64 animate-pulse rounded-2xl border"
              />
            ))}
          </div>
        ) : (
          <div className="min-h-[300px]">
             {articles.length > 0 ? (
                <NewsFeed articles={articles} />
             ) : (
                <div className="text-center py-20 text-text-muted">
                    <p>No hay noticias locales urgentes en este momento.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
