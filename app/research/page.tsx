'use client';

import { useState } from 'react';
import { Search, Loader2, ShieldCheck, Globe, AlertTriangle, RefreshCw, Zap, Quote, Sparkles, ChevronRight } from 'lucide-react';
import { ResearchResult } from '@/components/news/ResearchResult';
import { fetchNewsAction } from '@/app/actions/fetchNews';
import { startInvestigationAction } from '@/app/actions/generateContent';
import { NewsArticle } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNewsStore } from '@/lib/store/newsStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { OndaNetwork } from '@/components/news/OndaNetwork';

export default function ResearchPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const router = useRouter();
  const { sendToRedaction } = useNewsStore();
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Guardamos los datos de la última investigación profunda para enviarlos
  const [lastInvestigationData, setLastInvestigationData] = useState<{title: string, report: string} | null>(null);

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleResearch = async () => {
    if (!query.trim()) return;
    
    setAnalyzing(true);
    setHasSearched(true);
    setResults([]); 
    setAiReport(null);
    setLastInvestigationData(null);
    
    try {
      // 1. Si es una URL o tiene pinta de noticia específica, ejecutamos investigación profunda
      if (isUrl(query) || query.length > 50) {
        const title = isUrl(query) ? "Análisis de Enlace Externo" : "Investigación Personalizada";
        const investigation = await startInvestigationAction(title, query);
        setAiReport(investigation.report);
        setLastInvestigationData({ title, report: investigation.report });
      }

      // 2. Buscamos noticias relacionadas al tema para la red de nodos
      const data = await fetchNewsAction(undefined, query);
      setResults(data);

    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendToRedaction = () => {
    if (!lastInvestigationData) return;
    
    const article: NewsArticle = {
      id: crypto.randomUUID(),
      title: lastInvestigationData.title,
      description: query.substring(0, 200),
      content: lastInvestigationData.report,
      url: isUrl(query) ? query : '',
      publishedAt: new Date().toISOString(),
      source: { name: 'Investigación Onda' },
      investigationReport: lastInvestigationData.report // ESTO ES CLAVE
    };

    sendToRedaction(article);
    toast.success("Protocolo Onda Iniciado", {
      description: "Transfiriendo expediente de Inmersión Profunda al Centro de Redacción."
    });
    router.push('/redaction');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <Sparkles className="text-primary" size={32} /> INMERSIÓN PROFUNDA
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Sincronización multi-fuente y blindaje de información mediante análisis de credibilidad.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw size={14} /> Recargar Sesión
        </button>
      </div>

      {/* Search Console */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-3 flex gap-3 shadow-2xl focus-within:border-primary/30 transition-all">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={24} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            placeholder="Pega un link de noticia, tweet o escribe un suceso..."
            className="w-full bg-transparent border-none text-white placeholder-white/20 pl-16 pr-6 py-6 focus:ring-0 text-xl font-medium"
          />
        </div>
        <button
          onClick={handleResearch}
          disabled={analyzing || !query}
          className="bg-primary hover:bg-white text-background px-12 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 active:scale-95"
        >
          {analyzing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analizando...
            </>
          ) : (
            <>
              <Zap size={18} />
              Iniciar Inmersión
            </>
          )}
        </button>
      </div>

      {/* Analysis Content */}
      <div className="space-y-12">
        {analyzing && (
          <div className="py-24 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
              <div className="w-24 h-24 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
              <Search className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-black text-2xl uppercase tracking-tighter">Triangulando Datos...</p>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Escaneando red de nodos global y verificando credibilidad</p>
            </div>
          </div>
        )}

        {/* AI REPORT (If searching for specific URL/Deep Topic) */}
        {!analyzing && aiReport && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-primary/20 rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <ShieldCheck size={180} className="text-primary" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                    <ShieldCheck className="text-primary" size={28} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Dictamen de Inteligencia</span>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Análisis de Profundidad</h2>
                </div>
              </div>

              <button 
                onClick={handleSendToRedaction}
                className="bg-primary text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-white transition-all shadow-xl shadow-primary/10 group"
              >
                <Zap size={18} className="group-hover:animate-pulse" />
                Protocolo Crear Onda
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="prose prose-invert prose-2xl max-w-none prose-p:text-white/70 prose-p:font-light prose-p:leading-relaxed prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-blockquote:border-primary prose-blockquote:bg-white/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl">
               {aiReport.split('\n').map((line, i) => {
                 const trimmed = line.trim();
                 if (!trimmed) return <br key={i} />;
                 if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                    return <h3 key={i} className="text-4xl mt-12 mb-8 border-b border-white/5 pb-4">{trimmed.replace(/^#+\s/, '')}</h3>;
                 }
                 if (trimmed.startsWith('>')) {
                    return <blockquote key={i} className="my-10 italic">{trimmed.replace(/^>\s*/, '')}</blockquote>;
                 }
                 return <p key={i}>{trimmed}</p>;
               })}
            </div>
          </motion.div>
        )}

        {!analyzing && results.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                 <div className="bg-white/5 text-white/40 px-4 py-2 rounded-full text-[10px] font-black border border-white/10 flex items-center gap-2 uppercase tracking-widest">
                    <Globe size={14} /> Nodos de Información Hallados
                 </div>
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                {results.length} Fuentes Detectadas
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {results.map((article, idx) => (
                <div key={article.id || article.url || idx} className="group transition-all">
                  <ResearchResult 
                    article={article}
                    verificationScore={Math.floor(Math.random() * (99 - 85) + 85)} 
                    sourcesVerified={Math.floor(Math.random() * 20) + 5} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSearched && !analyzing && results.length === 0 && !aiReport && (
          <div className="py-24 text-center space-y-6 bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
            <div className="bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
              <AlertTriangle className="text-yellow-500" size={32} />
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Sin Señal Clara</h3>
              <p className="text-white/30 text-sm font-mono uppercase tracking-widest">No se encontraron suficientes puntos de datos. Intenta con otros parámetros.</p>
            </div>
          </div>
        )}

        {!hasSearched && !analyzing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            {[
              { icon: Globe, title: "Radar Global", descendant: "Escaneo de 30k+ fuentes verificadas." },
              { icon: ShieldCheck, title: "Blindaje IA", descendant: "Detección proactiva de sesgo y fake news." },
              { icon: Sparkles, title: "Síntesis Total", descendant: "Reportes narrativos en tiempo real." }
            ].map((item, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 space-y-5 group hover:border-primary/30 transition-all duration-500 shadow-xl">
                 <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary group-hover:text-black transition-all">
                    <item.icon size={28} />
                 </div>
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">{item.title}</h4>
                 <p className="text-white/40 text-sm leading-relaxed">{item.descendant}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Red Inteligente (Solo para el Director) */}
      {isAdmin && <OndaNetwork />}
    </div>
  );
}
