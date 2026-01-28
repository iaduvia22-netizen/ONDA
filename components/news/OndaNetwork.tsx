'use client';

import { useState, useEffect } from 'react';
import { Users, Zap, Clock, Newspaper, Send, Shield, Activity, User, Radar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNetworkActivityAction } from '@/app/actions/admin';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function OndaNetwork() {
  const [analysts, setAnalysts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNetwork();
    }
  }, [isOpen]);

  async function loadNetwork() {
    setLoading(true);
    try {
      const data = await getNetworkActivityAction();
      setAnalysts(data);
    } catch (error) {
      console.error("Error loading network activity", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-10 right-10 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl text-black">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-tighter text-sm">Monitor de Red Onda</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Estado Global de Analistas</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Sincronizando Nodos...</span>
                </div>
              ) : analysts.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-xs text-white/20 font-bold uppercase">No hay analistas reclutados</p>
                </div>
              ) : (
                analysts.map((analyst) => (
                  <div key={analyst.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center border border-white/10">
                          {analyst.image ? (
                            <img src={analyst.image} alt={analyst.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-white/20" size={20} />
                          )}
                        </div>
                        {analyst.lastLoginAt && (Date.now() - new Date(analyst.lastLoginAt).getTime() < 300000) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-xs font-black uppercase tracking-tight truncate">{analyst.name}</h4>
                        <p className="text-[10px] text-white/30 truncate">{analyst.email}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono text-primary uppercase">Analista</span>
                        <div className="flex gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                           <div className="flex items-center gap-1">
                              <Newspaper size={10} className="text-white/40" />
                              <span className="text-[10px] font-black text-white">{analyst.stats.investigations}</span>
                           </div>
                           <div className="flex items-center gap-1">
                              <Zap size={10} className="text-primary" />
                              <span className="text-[10px] font-black text-white">{analyst.stats.packs}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">Último Acceso</span>
                          <div className="flex items-center gap-1.5">
                             <Clock size={10} className="text-white/30" />
                             <span className="text-[9px] font-bold text-white/60">
                                {analyst.lastLoginAt ? formatDistanceToNow(new Date(analyst.lastLoginAt), { addSuffix: true, locale: es }) : 'Nunca'}
                             </span>
                          </div>
                       </div>
                       <div className="space-y-1 text-right">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">Última Actividad</span>
                          <div className="flex items-center gap-1.5 justify-end">
                             <Send size={10} className="text-primary/40" />
                             <span className="text-[9px] font-bold text-white/60">
                                {analyst.lastActivityAt ? formatDistanceToNow(new Date(analyst.lastActivityAt), { addSuffix: true, locale: es }) : 'Inactivo'}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/40 border-t border-white/5 text-center">
               <button 
                 onClick={loadNetwork}
                 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-primary transition-colors flex items-center gap-2 mx-auto"
               >
                 <Zap size={10} /> Recargar Inteligencia
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative group flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 shadow-[0_0_40px_rgba(34,197,94,0.2)] backdrop-blur-md border border-primary/30",
          isOpen ? "bg-white text-black rotate-180 scale-110 border-white" : "bg-black/40 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95 hover:border-primary/60"
        )}
      >
        <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50" />
        <div className="absolute inset-2 rounded-full border border-primary/10 border-dashed animate-[spin_10s_linear_infinite]" />
        
        <div className="relative z-10 flex flex-col items-center gap-0.5">
          <Radar size={28} className={cn("transition-all duration-500", isOpen && "rotate-180 scale-75 text-black")} />
          <span className={cn("text-[8px] font-black uppercase tracking-widest transition-all", isOpen ? "text-black scale-0 w-0 h-0" : "text-primary/60")}>
            RED
          </span>
        </div>

        {!isOpen && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
}
