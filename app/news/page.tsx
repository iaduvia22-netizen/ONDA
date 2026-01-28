'use client';

import { useState, useEffect } from 'react';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { NewsFilters } from '@/components/news/NewsFilters';
import { useNewsStore } from '@/lib/store/newsStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { fetchNewsAction } from '@/app/actions/fetchNews';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Filter, Loader2, RefreshCw } from 'lucide-react';

export default function NewsPage() {
    const { 
        searchQuery, 
        selectedCategory,
        setSearchQuery, 
        setSelectedCategory,
        _hasHydrated
    } = useNewsStore(); 
    
    const [pageArticles, setPageArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const debouncedQuery = useDebounce(searchQuery, 800);

    const handleSearch = async () => {
        if (!_hasHydrated) return;
        setLoading(true);
        try {
            const results = await fetchNewsAction(selectedCategory, debouncedQuery);
            setPageArticles(results as any);
            
            // Notificar carga
            if (results.length > 0) {
              useNotificationStore.getState().addNotification({
                title: 'Nodos Sincronizados',
                message: `Se han detectado ${results.length} nuevas señales informativas en la red global.`,
                type: 'info'
              });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, selectedCategory, _hasHydrated]);

    if (!_hasHydrated) {
      return (
        <div className="h-screen flex items-center justify-center bg-black">
          <Loader2 size={40} className="text-primary animate-spin" />
        </div>
      );
    }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Filter className="text-primary" /> Explorador de Noticias
          </h1>
          <p className="text-text-muted">
            Filtra y busca historias específicas en nuestra base de datos global.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw size={14} /> Recargar Sesión
        </button>
      </div>

      <NewsFilters 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSearch={setSearchQuery}
      />

      <div className="min-h-[400px]">
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-80 bg-surface rounded-xl animate-pulse border border-border" />
             ))}
           </div>
        ) : pageArticles.length > 0 ? (
            <NewsFeed articles={pageArticles} />
        ) : (
            <div className="text-center py-20 text-text-muted bg-surface/30 rounded-xl border border-dashed border-border">
                <p className="text-lg">No se encontraron noticias con estos criterios.</p>
                <p className="text-sm">Intenta con otros términos o categorías.</p>
            </div>
        )}
      </div>
    </div>
  );
}
