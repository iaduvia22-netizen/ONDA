'use client';

import { useNewsStore } from '@/lib/store/newsStore';
import { Bookmark, Calendar, ArrowRight, ShieldCheck, Zap, FileText, Share2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NewsArticle } from '@/lib/api/types';
import { TransmediaGallery } from '@/components/news/TransmediaGallery';

export default function SavedPage() {
  const { saved, _hasHydrated } = useNewsStore();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  if (!_hasHydrated) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(202,251,72,0.1)]">
            <Bookmark size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Biblioteca Onda</h1>
            <p className="text-text-dim text-sm font-mono uppercase tracking-widest">Archivo maestro de historias publicadas y estrategias transmedia</p>
          </div>
        </div>
      </header>

      {saved.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {saved.map((article, idx) => (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={article.id || idx} 
                className="group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] hover:border-primary/30 transition-all duration-700 shadow-2xl cursor-pointer"
                onClick={() => setSelectedArticle(article)}
             >
                {/* Dynamic Cover Layer */}
                <div className="absolute inset-0 z-0">
                   <img 
                      src={article.image || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070`} 
                      alt="Cover" 
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-all duration-1000 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
                   <div className="flex justify-between items-start">
                      <div className="px-4 py-1.5 bg-primary/10 backdrop-blur-md rounded-full border border-primary/20 flex items-center gap-2">
                         <Zap size={10} className="text-primary" />
                         <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Publicado</span>
                      </div>
                      <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                         <ShieldCheck size={18} />
                      </div>
                   </div>

                   <div>
                      <div className="flex items-center gap-2 mb-4">
                         <Calendar size={12} className="text-white/40" />
                         <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">
                           {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha desconocida'}
                         </span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-[1.1] uppercase tracking-tighter mb-6 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-4">
                         <div className="h-px bg-white/10 flex-1" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors">Ver Dossier</span>
                         <ArrowRight size={14} className="text-white/20 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                      </div>
                   </div>
                </div>
             </motion.div>
          ))}
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center bg-[#050505] rounded-[3rem] border border-white/5 border-dashed relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#CAFB48,transparent)]" />
          </div>
          <Bookmark size={64} className="text-white/5 mb-6" />
          <h2 className="text-2xl font-black text-white/20 uppercase tracking-[0.4em]">Bóveda Desocupada</h2>
          <p className="text-sm text-white/10 mt-3 uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">Solo los expedientes aprobados con estrategia transmedia se archivan aquí.</p>
          <Link href="/redaction" className="mt-10 px-10 py-4 bg-white/5 hover:bg-primary hover:text-black text-white border border-white/10 rounded-full font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:scale-105">
             Abrir Redacción
          </Link>
        </div>
      )}

      {/* MODAL DE DOSSIER COMPLETO */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-6xl h-full max-h-[90vh] bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              {/* Header Modal */}
                <div className="p-6 md:px-12 flex justify-between items-center bg-black/50 border-b border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="text-primary" size={24} />
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Expediente Clasificado</span>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1">{selectedArticle.title}</h2>
                      </div>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10 hidden md:block" />

                    <div className="hidden md:flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                          <img 
                            src={selectedArticle.analystImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedArticle.analystName}`} 
                            alt="Analista" 
                            className="w-full h-full object-cover"
                          />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Analista Responsable</p>
                          <p className="text-xs font-bold text-white uppercase tracking-tighter">{selectedArticle.analystName || "Sistema Onda"}</p>
                       </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all ml-4"
                  >
                    <X size={20} />
                  </button>
                </div>

              {/* Contenido (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-12 scrollbar-custom">
                 <div className="space-y-24">
                    {/* Sección 1: El Dossier Escrito */}
                    <div className="prose prose-invert prose-2xl max-w-none">
                      <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-white/20 font-black uppercase tracking-[0.5em] text-xs">Investigación & Análisis</span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      
                      {selectedArticle.investigationReport?.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <br key={i} />;
                        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                           return <h2 key={i} className="text-5xl font-black text-white tracking-tighter uppercase mb-10 border-b-4 border-primary/20 pb-4">{trimmed.replace(/^#+\s/, '')}</h2>;
                        }
                        return <p key={i} className="text-white/60 font-light leading-relaxed mb-6">{trimmed}</p>;
                      })}
                    </div>

                    {/* Sección 2: El Kit Transmedia */}
                    <div>
                      <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-primary/20" />
                        <span className="text-primary font-black uppercase tracking-[0.5em] text-xs">Estrategia Transmedia Ejecutada</span>
                        <div className="h-px flex-1 bg-primary/20" />
                      </div>
                      
                      <TransmediaGallery 
                        content={selectedArticle.transmediaPack || ''} 
                        title={selectedArticle.title}
                        images={[]} 
                      />
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
