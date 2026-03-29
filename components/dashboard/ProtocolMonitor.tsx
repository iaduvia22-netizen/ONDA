'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { runPlatformCheckAction, HealthStatus } from '@/app/actions/healthCheck';
import { Activity, ShieldCheck, Zap, Radio, Globe, AlertCircle, RefreshCcw, Wifi, Server, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn } from '@/lib/utils';

export function ProtocolMonitor() {
  const [status, setStatus] = useState<HealthStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { addNotification } = useNotificationStore();

  const performCheck = useCallback(async (isAuto = false) => {
    if (isChecking) return;
    setIsChecking(true);
    
    try {
      const results = await runPlatformCheckAction();
      setStatus(results);
      setLastCheck(new Date());

      // Notificación si algo falla
      const failures = results.filter(r => r.status !== 'online');
      if (failures.length > 0 && !isAuto) {
          addNotification({
            title: "ALERTA DE SISTEMA",
            message: `Fallo detectado en ${failures[0].name}. ${failures[0].message}`,
            type: 'error'
          });
      } else if (!isAuto) {
          addNotification({
            title: "SISTEMA SEGURO",
            message: "Protocolo de funcionamiento verificado: Todas las fases operativas.",
            type: 'success'
          });
      }
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, addNotification]);

  // Polling cada 2 horas (como pidió el usuario)
  useEffect(() => {
    performCheck(true);
    const interval = setInterval(() => performCheck(true), 120 * 60 * 1000); // 120 min
    return () => clearInterval(interval);
  }, [performCheck]);

  const getIcon = (phase: string) => {
    if (phase === "FASE 1") return <Server size={14} />;
    if (phase === "FASE 2") return <Wifi size={14} />;
    if (phase === "FASE 3") return <Cpu size={14} />;
    return <Globe size={14} />;
  }

  return (
    <div className="w-full bg-[#080808] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl bg-primary/10 border border-primary/20",
            isChecking && "animate-pulse"
          )}>
            <ShieldCheck className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none">Protocolo de Operación</h3>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
              <Radio size={10} /> {isChecking ? "AUDITANDO SISTEMA..." : `ÚLTIMO ESCANEO: ${lastCheck?.toLocaleTimeString() || "PENDIENTE"}`}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => performCheck(false)}
          disabled={isChecking}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCcw className={cn("transition-transform duration-1000", isChecking && "animate-spin")} size={14} />
          {isChecking ? "ESCANEANDO" : "FORCE CHECK"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {status.length > 0 ? status.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
               "p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 relative overflow-hidden",
               item.status === 'online' ? "bg-primary/5 border-primary/10" : 
               item.status === 'warning' ? "bg-yellow-500/5 border-yellow-500/20" : 
               "bg-red-500/5 border-red-500/20"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              item.status === 'online' ? "bg-primary/10 text-primary" : 
              item.status === 'warning' ? "bg-yellow-500/10 text-yellow-500" :
              "bg-red-500/10 text-red-500"
            )}>
              {getIcon(item.phase)}
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <span className="text-[9px] font-mono text-white/20">{item.phase}</span>
                 {item.status === 'online' && <span className="text-primary font-mono text-[8px] tracking-tighter">{item.latency}ms</span>}
               </div>
               <h4 className="text-xs font-black text-white uppercase truncate">{item.name}</h4>
               <p className={cn(
                 "text-[10px] truncate mt-0.5",
                 item.status === 'online' ? "text-white/40" : "text-white/60"
               )}>{item.message}</p>
            </div>

            <div className={cn(
               "w-1.5 h-1.5 rounded-full absolute top-4 right-4 animate-pulse",
               item.status === 'online' ? "bg-primary shadow-[0_0_8px_rgba(202,251,72,0.6)]" : 
               item.status === 'warning' ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" : 
               "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            )} />
          </motion.div>
        )) : (
          [1,2,3,4].map(i => (
             <div key={i} className="p-10 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Onda Secure Protocol Sentinel</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </div>
  );
}
