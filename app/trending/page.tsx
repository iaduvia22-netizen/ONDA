'use client';

import { useState, useMemo } from 'react';
import { useNewsStore } from '@/lib/store/newsStore';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Zap, 
  Filter, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'general', label: 'General' },
  { id: 'business', label: 'Negocios' },
  { id: 'technology', label: 'Tecnología' },
  { id: 'science', label: 'Ciencia' },
  { id: 'health', label: 'Salud' },
  { id: 'sports', label: 'Deportes' },
  { id: 'entertainment', label: 'Entretenimiento' },
];

export default function TrendingPage() {
  const { saved, _hasHydrated } = useNewsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState('all');

  if (!_hasHydrated) return null;

  // Filtrar artículos por categoría
  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return saved;
    return saved.filter(a => a.category === activeCategory);
  }, [saved, activeCategory]);

  // Artículos del día seleccionado
  const selectedDayArticles = useMemo(() => {
    return filteredArticles.filter(a => 
      a.publishedDate && isSameDay(parseISO(a.publishedDate), selectedDate)
    );
  }, [filteredArticles, selectedDate]);

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const hasArticlesOnDay = (day: Date) => {
    return filteredArticles.some(a => 
      a.publishedDate && isSameDay(parseISO(a.publishedDate), day)
    );
  };

  return (
    <div className="animate-in fade-in space-y-10 duration-500 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <TrendingUp className="text-primary" /> Picos de Impacto
          </h1>
          <p className="text-text-dim text-sm font-mono uppercase tracking-widest mt-1">Historial cronológico de publicaciones y tendencias</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                activeCategory === cat.id 
                  ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(202,251,72,0.3)]"
                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* CALENDARIO */}
        <div className="xl:col-span-2 bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <CalendarIcon size={20} className="text-primary" />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
               </h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-white/20 uppercase py-4 tracking-widest">
                {day}
              </div>
            ))}

            {calendarDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const hasActivity = hasArticlesOnDay(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border",
                    !isCurrentMonth ? "opacity-20 pointer-events-none" : "hover:scale-105",
                    isSelected 
                      ? "bg-primary text-black border-primary shadow-[0_0_30px_rgba(202,251,72,0.2)]" 
                      : "bg-white/[0.02] text-white/60 border-white/5 hover:bg-white/5",
                    hasActivity && !isSelected && "border-primary/30"
                  )}
                >
                  <span className="text-lg font-black">{format(day, 'd')}</span>
                  {hasActivity && (
                    <div className={cn(
                      "absolute bottom-2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(202,251,72,0.5)]",
                      isSelected ? "bg-black" : "bg-primary"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEED DEL DÍA SELECCIONADO */}
        <div className="flex flex-col gap-6">
           <div className="bg-[#CAFB48]/10 border border-[#CAFB48]/20 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-4">
                 <Clock size={18} className="text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Detalle del Día</span>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                {format(selectedDate, 'd MMMM', { locale: es })}
              </h3>
              <p className="text-white/40 text-xs font-mono mt-2">
                {selectedDayArticles.length} historias documentadas
              </p>
           </div>

           <div className="flex-1 space-y-4">
              {selectedDayArticles.length > 0 ? (
                selectedDayArticles.map((article, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={article.id || i}
                  >
                    <Link 
                      href="/saved" 
                      className="block group bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] hover:border-primary/50 transition-all duration-500 hover:translate-x-2"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 block">
                            {article.category || 'General'}
                          </span>
                          <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary group-hover:text-black transition-all">
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                   <Zap size={32} className="text-white/5 mb-4" />
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Sin publicaciones registradas</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
