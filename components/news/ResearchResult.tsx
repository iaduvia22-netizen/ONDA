'use client';

import { CheckCircle, AlertTriangle, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { NewsArticle } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ResearchResultProps {
  article: NewsArticle;
  verificationScore: number;
  sourcesVerified: number;
}

export function ResearchResult({ article, verificationScore, sourcesVerified }: ResearchResultProps) {
  const isReliable = verificationScore > 85;

  return (
    <div className="bg-surface/40 border border-border hover:border-primary/40 rounded-3xl p-6 transition-all duration-300 group">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
              {article.source.name}
            </span>
            <div className="h-1 w-1 bg-border rounded-full" />
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-tighter">
              Detección de Nodo
            </span>
          </div>
          <h3 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-4">
             <div className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
               isReliable 
                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
             )}>
               <ShieldCheck size={14} />
               Sincronización: {verificationScore}%
             </div>
             <div className="flex items-center gap-2 text-text-muted text-xs font-medium">
               <Zap size={14} className="text-primary" />
               {sourcesVerified} fuentes validadas
             </div>
          </div>
        </div>
        
        {/* Radar Map Visual (Miniature simulation) */}
        <div className="hidden md:flex w-24 h-24 rounded-full border border-border relative items-center justify-center overflow-hidden shrink-0">
           <div className="absolute inset-0 bg-primary/5 animate-pulse" />
           <div className="absolute w-16 h-16 border border-primary/20 rounded-full animate-ping" />
           <ShieldCheck className="text-primary relative z-10" size={32} />
        </div>
      </div>

      <div className="bg-black/40 border border-border rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
           <ShieldCheck size={40} />
        </div>
        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
           Reporte de Inteligencia
        </h4>
        <p className="text-text-muted text-sm leading-relaxed">
          {article.description || "Iniciando escaneo de metadatos..."} 
          <span className="block mt-2 text-text-dim italic">
            {isReliable 
              ? "Triangulación completada. La señal es coherente con el flujo principal." 
              : "Advertencia: Se detectaron fluctuaciones menores en la narrativa de origen."}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="flex-1 bg-primary text-background hover:bg-primary-light px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95">
          <CheckCircle size={16} /> Validar Señal
        </button>
        <button className="flex-1 bg-surface-hover text-text-muted hover:text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 border border-border">
          <AlertTriangle size={16} /> Reportar Ruido
        </button>
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-surface-hover text-text-muted hover:text-primary rounded-xl flex items-center justify-center transition-all border border-border hover:border-primary/50 group/link"
        >
          <ExternalLink size={20} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
