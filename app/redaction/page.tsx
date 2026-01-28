'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNewsStore } from '@/lib/store/newsStore';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { startInvestigationAction, generateTransmediaAction } from '@/app/actions/generateContent';
import { saveInvestigationAction, saveTransmediaPackAction } from '@/app/actions/storage';
import { TransmediaGallery } from '@/components/news/TransmediaGallery';
import { Send, Trash2, Zap, Loader2, ShieldCheck, Quote, ChevronRight, Sparkles, CheckCircle, X, MessageSquare, Twitter, Video, LayoutGrid, FileText, Globe, ExternalLink } from 'lucide-react';
import { NewsArticle } from '@/lib/api/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OndaNetwork } from '@/components/news/OndaNetwork';

export default function RedactionPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const { redactionArticles, removeFromRedaction, clearRedaction, publishArticle, _hasHydrated } = useNewsStore();
  const [investigatingArticle, setInvestigatingArticle] = useState<NewsArticle | null>(null);
  // ... rest of state ...

  const [investigationReport, setInvestigationReport] = useState<string | null>(null);
  const [investigationImages, setInvestigationImages] = useState<string[]>([]);
  const [rawImageLinks, setRawImageLinks] = useState<string[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [transmediaPack, setTransmediaPack] = useState<string | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'transmedia'>('report');
  const [savedInvestigationId, setSavedInvestigationId] = useState<string | null>(null);

  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  const handleInvestigate = async (article: NewsArticle) => {
    setInvestigatingArticle(article);
    setInvestigationImages([]);
    setRawImageLinks([]);
    setSavedInvestigationId(null);

    // MODO ACELERADO: Si ya viene investigada de la Inmersión Profunda
    if (article.investigationReport) {
      setInvestigationReport(article.investigationReport);
      setIsInvestigating(false);
      toast.success("Protocolo Acelerado Activo", {
        description: "Expediente de Inmersión Profunda cargado. Listo para Kit Transmedia."
      });
      
      // Intentamos guardar en la BD silenciosamente
      try {
        const saved = await saveInvestigationAction(article.title, article.investigationReport, []);
        if (saved.success && saved.id) setSavedInvestigationId(saved.id);
      } catch (e) {
        console.warn("Fallo guardado silencioso:", e);
      }
      return;
    }
    
    setIsInvestigating(true);
    setInvestigationReport(null);
    
    toast.info("Iniciando Escaneo OSINT...", {
      description: "Consultando medios, redes y el espectro visual."
    });

    try {
      const result = await startInvestigationAction(article.title, article.description || '');
      setInvestigationReport(result.report);
      
      // Separamos imágenes proxied de los links crudos
      const splitIdx = result.entitiesMatched.indexOf("---SPLIT---");
      if (splitIdx !== -1) {
        setInvestigationImages(result.entitiesMatched.slice(0, splitIdx));
        setRawImageLinks(result.entitiesMatched.slice(splitIdx + 1));
      } else {
        setInvestigationImages(result.entitiesMatched);
      }

      toast.success("Investigación Completada", {
        description: "El expediente visual y narrativo está listo."
      });

      // AUTO-SAVE SYSTEM (Memory V1)
      const saved = await saveInvestigationAction(article.title, result.report, result.entitiesMatched);
      if (saved.success && saved.id) {
         setSavedInvestigationId(saved.id);
         toast.success("Expediente Archivado", { description: "Guardado en la memoria permanente del sistema." });
      }

    } catch (error: any) {
      toast.error("Error en la Investigación");
      console.error(error);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleGenerateTransmedia = async () => {
    if (!investigationReport || !investigatingArticle) return;
    
    setIsGeneratingPack(true);
    try {
      const data = await generateTransmediaAction(investigationReport, investigatingArticle.title);
      
      // Si la respuesta indica un error (aunque no haya lanzado excepción el action)
      if (data.includes("Error") || data.includes("Fallo técnico")) {
        toast.error("Error en la generación del pack", {
          description: data
        });
        return;
      }

      setTransmediaPack(data);
      setActiveTab('transmedia');
      toast.success('Kit Transmedia Generado con Éxito');

      // AUTO-SAVE TRANSMEDIA (Memory V1)
      if (savedInvestigationId) {
         await saveTransmediaPackAction(savedInvestigationId, data);
         toast.success("Estrategia Transmedia Archivada", { description: "Lista para producción." });
      }

    } catch (error: any) {
      console.error(error);
      toast.error('Error al forjar la estrategia viral', {
        description: error.message || 'Error técnico desconocido.'
      });
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const closeReport = () => {
    setInvestigatingArticle(null);
    setInvestigationReport(null);
    setInvestigationImages([]);
    setRawImageLinks([]);
    setTransmediaPack(null);
    setActiveTab('report');
    setSavedInvestigationId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative min-h-screen pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(202,251,72,0.1)]">
            <Send size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Centro de Redacción</h1>
            <p className="text-text-dim text-sm font-mono uppercase tracking-widest">Cola de trabajo para análisis profundo</p>
          </div>
        </div>

        {redactionArticles.length > 0 && !investigatingArticle && (
          <button 
            onClick={() => clearRedaction()}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Trash2 size={12} />
            Vaciar Mesa
          </button>
        )}
      </header>

      {!investigatingArticle ? (
        <>
          {redactionArticles.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                 <LayoutGrid size={20} className="text-primary" />
                 <p className="text-sm font-medium text-white/80">
                   Tienes <span className="text-primary font-black underline">{redactionArticles.length} artículos</span> en la mesa. Selecciona uno para iniciar la investigación automática.
                 </p>
              </div>
              <NewsFeed 
                articles={redactionArticles} 
                onInvestigate={handleInvestigate}
              />
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center bg-[#0a0a0a] rounded-3xl border border-white/5 border-dashed">
              <Send size={60} className="text-white/5 mb-6" />
              <h2 className="text-2xl font-black text-white/20 uppercase tracking-[0.4em]">Mesa Limpia</h2>
              <p className="text-[10px] text-white/10 mt-4 uppercase tracking-[0.2em]">Envía noticias desde el Flujo de Onda.</p>
            </div>
          )}
        </>
      ) : (
        /* VISTA DE INVESTIGACIÓN Y REPORTE */
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          {/* Cabecera del Reporte */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 mb-8">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ShieldCheck size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Expediente de Radio Onda</h2>
                    <p className="text-xl font-bold text-white max-w-2xl mt-1 tracking-tight">{investigatingArticle.title}</p>
                  </div>
                </div>
                 <button 
                  onClick={closeReport}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
             </div>

             {/* TABS SELECTOR */}
             <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mb-6">
                <button 
                  onClick={() => setActiveTab('report')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'report' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                  )}
                >
                  <FileText size={14} />
                  Expediente Investigativo
                </button>
                <button 
                  onClick={() => {
                    if (transmediaPack) setActiveTab('transmedia');
                    else toast.info("Genera el Kit Transmedia primero");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'transmedia' ? "bg-primary/20 text-primary border border-primary/20" : "text-white/20 hover:text-white/40",
                    !transmediaPack && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Zap size={14} />
                  Estrategia Transmedia
                </button>
             </div>

             {/* Barra de Progreso / Status */}
             <div className="flex flex-col gap-6 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isInvestigating ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(202,251,72,1)]" : "bg-green-500")} />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      {isInvestigating ? "Escaneando fuentes probatorias..." : "Crónica Narrativa Generada"}
                    </span>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-primary text-xl font-black">{isInvestigating ? '--' : investigationImages.length}</div>
                      <div className="text-[8px] text-white/20 uppercase font-bold">Imágenes Halladas</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full bg-primary transition-all duration-1000", isInvestigating ? "w-2/3 animate-shimmer" : "w-full")} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] text-white/20 font-mono text-xs">
                      <Globe size={12} /> OSINT: {isInvestigating ? 'WORKING' : 'VERIFIED'}
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Galería de Imágenes Encontradas */}
          {investigationImages.length > 0 && !isInvestigating && (
            <div className="space-y-6 animate-in fade-in duration-1000 delay-500">
               <div className="flex items-center justify-between px-4">
                 <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Evidencias Visuales (Acceso Directo)</h3>
                 <span className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">{investigationImages.length} archivos detectados</span>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {investigationImages.map((img, idx) => (
                    <a 
                      key={idx} 
                      href={rawImageLinks[idx] || img} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-surface hover:border-primary/50 transition-all shadow-xl block"
                      title="Ver imagen original en nueva pestaña"
                    >
                       <img 
                          src={img} 
                          alt={`Evidencia ${idx + 1}`} 
                          className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110" 
                          onError={(e) => {
                             (e.target as HTMLImageElement).src = rawImageLinks[idx] || img;
                          }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                       <div className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <ExternalLink size={12} className="text-primary" />
                       </div>
                    </a>
                  ))}
               </div>

               {/* Lista de Links Directos para el usuario */}
               <details className="bg-white/5 rounded-2xl p-4 border border-white/5 transition-all group">
                  <summary className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] cursor-pointer hover:text-primary transition-colors list-none flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-primary" />
                     Ver Directorio de Links de Imágenes Originales
                  </summary>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                     {(rawImageLinks.length > 0 ? rawImageLinks : investigationImages).map((img, idx) => (
                       <div key={idx} className="flex items-center gap-3 text-[10px] font-mono text-white/40 p-2 border-b border-white/5 hover:bg-white/5 rounded-lg transition-all group/link">
                          <span className="text-primary/40 font-black">[{String(idx+1).padStart(2, '0')}]</span>
                          <a href={img} target="_blank" className="truncate hover:text-primary transition-all flex-1">{img}</a>
                          <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                       </div>
                     ))}
                  </div>
               </details>
            </div>
          )}

           {/* VISTA SEGÚN PESTAÑA */}
           {activeTab === 'report' ? (
              <div className="bg-[radial-gradient(circle_at_50%_0%,rgba(202,251,72,0.03),transparent)] min-h-[500px] border border-white/5 rounded-3xl p-12 shadow-inner">
                 {isInvestigating ? (
                   <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                      <Loader2 size={48} className="text-primary animate-spin" />
                      <p className="text-xs font-mono text-primary animate-pulse uppercase tracking-[0.5em]">Redactando Crónica de Onda Radio...</p>
                   </div>
                 ) : (
                   <div className="prose prose-invert prose-lg max-w-none animate-in fade-in duration-1000">
                      {investigationReport?.split('\n').map((line, i) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <br key={i} />;
    
                        // Introducción del Director (Detección por contenido clave)
                        if (trimmedLine.includes("Como director de este medio") || trimmedLine.includes("El periodismo de fragmentos está muerto")) {
                          return <div key={i} className="bg-primary/5 border-2 border-primary/20 p-8 rounded-3xl mb-12 shadow-[0_0_40px_rgba(202,251,72,0.05)] relative overflow-hidden group">
                            <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} /></div>
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.6em] block mb-4">MANIFIESTO DE LA DIRECCIÓN</span>
                            <p className="text-xl font-bold text-white leading-relaxed italic relative z-10">"{trimmedLine.replace(/"/g, '')}"</p>
                          </div>;
                        }
    
                        // Capítulos (I. La Filosofía, II. Anatomía, III. La Capa Invisible)
                        if (/^(I|II|III)\. /.test(trimmedLine)) {
                          return <div key={i} className="mt-24 mb-10 relative">
                            <div className="absolute -left-12 -top-12 text-[120px] font-black text-white/5 select-none">{trimmedLine.split('.')[0]}</div>
                            <h2 className="text-4xl font-black text-white border-b-4 border-primary pb-4 tracking-tighter uppercase relative z-10">
                              {trimmedLine}
                            </h2>
                          </div>;
                        }
    
                        // Anatomía / Disección (1. 2. 3. 4. 5. 6. 7. o bloques de poder)
                        if (/^\d+\. /.test(trimmedLine) || trimmedLine.startsWith('- EL ')) {
                          return <div key={i} className="mt-16 mb-8 bg-white/5 p-6 rounded-2xl border-l-4 border-primary">
                            <h3 className="text-primary text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                              <span className="text-white/20 text-4xl italic h-0 -mt-2">#</span>
                              {trimmedLine.replace(/^- /, '').split('.').slice(trimmedLine.includes('.') ? 1 : 0).join('.').trim()}
                            </h3>
                          </div>;
                        }
    
                        // Bullets / Hallazgos
                        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                          return <li key={i} className="text-white/80 mb-4 ml-8 list-none flex items-start gap-4 text-xl font-light">
                            <span className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0 shadow-[0_0_10px_rgba(202,251,72,0.5)]" /> 
                            <span>{trimmedLine.replace(/^[*|-]\s+/, '')}</span>
                          </li>;
                        }
    
                        // Párrafos Estándar
                        return <p key={i} className="mb-8 text-white/60 leading-relaxed font-light text-xl first-letter:text-4xl first-letter:font-black first-letter:text-primary">
                          {trimmedLine}
                        </p>;
                      })}
                   </div>
                 )}
              </div>
           ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-transparent mt-8"> 
                   <TransmediaGallery 
                      content={transmediaPack || ''} 
                      title={investigatingArticle?.title || 'Contenido Generado'}
                      images={investigationImages}
                   />
                </div>
              </div>
           )}

          {/* Acciones Finales */}
          {!isInvestigating && (
            <div className="flex flex-col md:flex-row justify-center gap-4 pt-10">
               {activeTab === 'report' && !transmediaPack && (
                <button 
                  onClick={handleGenerateTransmedia}
                  disabled={isGeneratingPack}
                  className="bg-primary text-black px-10 py-4 rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white transition-all shadow-[0_20px_40px_rgba(202,251,72,0.2)] active:scale-95 flex items-center gap-3"
                >
                  <Zap size={16} className={isGeneratingPack ? "animate-spin" : ""} />
                  {isGeneratingPack ? "FORJANDO ONDA..." : "EJECUTAR PROTOCOLO \"CREAR ONDA\""}
                </button>
               )}

               {transmediaPack && (
                <button 
                  onClick={() => {
                    if (investigatingArticle && investigationReport && transmediaPack) {
                      publishArticle(
                        investigatingArticle, 
                        investigationReport, 
                        transmediaPack,
                        { 
                          name: session?.user?.name || "Analista Onda", 
                          image: session?.user?.image || "" 
                        }
                      );
                      setInvestigatingArticle(null);
                      setInvestigationReport(null);
                      setTransmediaPack(null);
                      toast.success("Publicado con Éxito", { description: "La noticia y su estrategia se han movido a la Biblioteca." });
                      closeReport();
                    }
                  }}
                  className="px-8 py-3 bg-primary text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Aprobar y Publicar
                </button>
               )}

               <button 
                 onClick={() => window.print()}
                 className="bg-white/5 text-white/60 border border-white/10 px-10 py-4 rounded-full font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white hover:text-black transition-all active:scale-95"
               >
                 Exportar Dossier
               </button>
            </div>
          )}
        </div>
      )}
      
      {/* Red Inteligente (Solo para el Director) */}
      {isAdmin && <OndaNetwork />}
    </div>
  );
}
