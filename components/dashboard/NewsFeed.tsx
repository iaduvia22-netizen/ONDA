'use client';

import { NewsArticle } from '@/lib/api/types';
import { Bookmark, ExternalLink, Activity, Send, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNewsStore } from '@/lib/store/newsStore';

interface NewsFeedProps {
  articles: NewsArticle[];
  onInvestigate?: (article: NewsArticle) => void;
}

export function NewsFeed({ articles, onInvestigate }: NewsFeedProps) {
  const { addToSaved, sendToRedaction, removeArticle, removeFromSaved, removeFromRedaction } = useNewsStore();

  const handleSave = (article: NewsArticle) => {
    addToSaved(article);
    toast.success('NOTICIA GUARDADA', {
      description: 'El artículo ha sido añadido a tu biblioteca personal.',
    });
  };

  const handleSendToRedaction = (article: NewsArticle) => {
    sendToRedaction(article);
    toast.success('ENVIADO A REDACCIÓN', {
      description: 'La noticia ya está en la mesa de trabajo de Onda.',
    });
  };

  const handleDelete = (article: NewsArticle) => {
    const id = article.id || article.url;
    removeArticle(id);
    removeFromSaved(id);
    removeFromRedaction(id);
    toast.error('NOTICIA ELIMINADA', {
      description: 'El artículo ha sido removido de todos los flujos.',
    });
  };

  if (articles.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border-white/5 rounded-2xl border py-20 text-center shadow-2xl">
        <Activity size={32} className="text-primary/20 mx-auto mb-4 animate-pulse" />
        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">Silencio en la Red</h3>
        <p className="text-text-dim text-[10px] font-mono">ESCANEANDO ANOMALÍAS INFORMATIVAS...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, index) => (
        <article
          key={article.id || article.url}
          className="group bg-[#0f0f0f] border-white/10 hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative"
        >
          {/* Index Counter */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
             <div className="bg-black/80 backdrop-blur-xl border border-white/10 text-[9px] font-black px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-lg">
                <span className="text-primary italic">#</span>
                <span className="text-white/80">{String(index + 1).padStart(2, '0')}</span>
             </div>
          </div>

          {/* Image */}
          <div className="relative h-32 w-full overflow-hidden">
            {article.image ? (
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="bg-[#1a1a1a] flex h-full w-full items-center justify-center">
                <span className="text-white/5 text-3xl font-black tracking-tighter">ONDA</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-60" />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-4 pt-2">
            <div className="flex items-center gap-2 mb-2">
               <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
               <time className="text-[9px] font-mono text-text-dim uppercase">
                 {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { locale: es }) : 'Real Time'}
               </time>
            </div>

            <h3 className="group-hover:text-white mb-2 line-clamp-2 text-[13px] font-bold text-white/80 leading-snug transition-colors tracking-tight">
              {article.title}
            </h3>

            <p className="text-text-dim mb-4 line-clamp-2 text-[10px] leading-relaxed font-light font-sans italic opacity-60 group-hover:opacity-100 transition-opacity">
               {article.description || 'Procesando vector de información...'}
            </p>

            {/* Interaction Bar */}
            <div className="mt-auto space-y-2 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSave(article)}
                    className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                    title="Añadir a biblioteca"
                  >
                    <Bookmark size={10} />
                    Guardar
                  </button>
                  <button 
                    onClick={() => handleDelete(article)}
                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 group/del"
                    title="Eliminar noticia"
                  >
                    <Trash2 size={10} className="group-hover/del:scale-110" />
                    Descartar
                  </button>
                </div>
                <a 
                  href={article.url} 
                  target="_blank" 
                  className="text-white/20 hover:text-primary transition-colors p-1"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              
              {onInvestigate ? (
                <button 
                  onClick={() => onInvestigate(article)}
                  className="w-full bg-white text-black hover:bg-primary py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-95"
                >
                  <Search size={14} />
                  Iniciar Investigación
                </button>
              ) : (
                <button 
                  onClick={() => handleSendToRedaction(article)}
                  className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-black py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/send"
                >
                  <Send size={10} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                  Enviar a Centro de Redacción
                </button>
              )}
            </div>
          </div>
          
          <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors duration-500 rounded-xl" />
        </article>
      ))}
    </div>
  );
}
