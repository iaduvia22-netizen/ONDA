'use client';

import { Bell, Search, User, X, Trash2, Check, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useNewsStore } from '@/lib/store/newsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification, triggerDailyReport } = useNotificationStore();
  const { saved, _hasHydrated } = useNewsStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reportTriggered = useRef(false);

  // Reporte Diario automático al hidratar
  useEffect(() => {
    if (_hasHydrated && !reportTriggered.current) {
      triggerDailyReport(saved.length);
      reportTriggered.current = true;
    }
  }, [_hasHydrated, saved.length, triggerDailyReport]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-background/80 border-border sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md transition-all duration-300 w-full">
      <div className="max-w-xl flex-1">
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-text-muted group-focus-within:text-primary h-5 w-5 transition-colors" />
          </div>
          <input
            type="text"
            className="border-border bg-surface placeholder-text-muted focus:border-primary focus:ring-primary block w-full rounded-xl border py-2 pr-3 pl-10 leading-5 text-white shadow-sm transition-all focus:ring-1 focus:outline-none sm:text-sm"
            placeholder="Buscar noticias, fuentes o temas..."
          />
        </div>
      </div>

      <div className="ml-4 flex items-center gap-4 relative">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones de Onda" 
            className={cn(
              "hover:bg-surface-hover text-text-muted relative rounded-full p-2 transition-colors hover:text-white",
              showNotifications && "bg-white/10 text-white"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="bg-primary ring-background absolute top-1.5 right-1.5 h-4 w-4 rounded-full ring-2 text-[10px] font-black text-black flex items-center justify-center animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-[380px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Notificaciones</h3>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-0.5">Centro de Alertas Onda</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => markAllAsRead()}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-primary transition-all" 
                      title="Marcar todo como leído"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => clearAll()}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-500 transition-all" 
                      title="Limpiar todo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-[450px] overflow-y-auto scrollbar-custom p-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "p-4 rounded-2xl transition-all cursor-pointer group relative mb-1",
                          n.read ? "opacity-60 grayscale-[0.5]" : "bg-white/[0.03] border border-white/5"
                        )}
                      >
                        {!n.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                        )}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className={cn(
                              "text-[11px] font-black uppercase tracking-tight",
                              n.type === 'success' ? "text-primary" : 
                              n.type === 'warning' ? "text-yellow-500" :
                              n.type === 'error' ? "text-red-500" : "text-blue-400"
                            )}>
                              {n.title}
                            </h4>
                            <p className="text-xs text-white/70 mt-1 leading-snug">{n.message}</p>
                            <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-white/20 uppercase">
                              <Clock size={10} />
                              {formatDistanceToNow(parseISO(n.timestamp), { locale: es, addSuffix: true })}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(n.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                        <Bell size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Sin avisos pendientes</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-4 bg-white/[0.01] border-t border-white/5 text-center">
                    <button className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-primary transition-colors">
                      Ver Historial Completo
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-border mx-1 h-8 w-[1px]"></div>

        <button aria-label="Perfil del Analista" className="hover:bg-surface-hover flex items-center gap-3 rounded-xl p-2 transition-colors">
          <div className="from-primary to-primary-dark shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr text-sm font-bold text-white shadow-lg overflow-hidden relative">
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span>{session?.user?.name?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-white">{session?.user?.name || "Usuario Onda"}</p>
            <p className="text-text-muted text-xs uppercase tracking-wider">
              {(session?.user as any)?.role === 'admin' ? 'Director' : 'Analista'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
