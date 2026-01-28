'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Newspaper, TrendingUp, Search, Settings, Menu, MapPin, X, Bookmark, Send, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const mainNav = [
  { name: 'Núcleo de Control', href: '/', icon: LayoutDashboard },
  { name: 'Flujo de Onda', href: '/news', icon: Newspaper },
  { name: 'Sonda Regional', href: '/local', icon: MapPin },
  { name: 'Inmersión Profunda', href: '/research', icon: Search },
];

const labNav = [
  { name: 'Centro de Redacción', href: '/redaction', icon: Send },
  { name: 'Picos de Impacto', href: '/trending', icon: TrendingUp },
  { name: 'Biblioteca', href: '/saved', icon: Bookmark },
];

export function Sidebar() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderLink = (item: any) => {
    const isActive = pathname === item.href;
    const isRedaction = item.href === '/redaction';
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-300 relative overflow-hidden whitespace-nowrap mb-1 border border-transparent',
          isActive
            ? 'bg-primary text-black shadow-[0_0_25px_rgba(202,251,72,0.4)] border-primary/50'
            : isRedaction
              ? 'bg-gradient-to-r from-[#CAFB48]/10 via-[#CAFB48]/5 to-transparent text-white/80 border-[#CAFB48]/10 hover:border-[#CAFB48]/30 hover:bg-[#CAFB48]/20'
              : 'text-white/60 hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0 mx-2'
        )}
      >
        {/* Shimmer Effect for VIP Item */}
        {isRedaction && !isActive && (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer transition-transform" />
        )}

        <Icon
          size={isRedaction ? 22 : 20}
          className={cn(
            'transition-all duration-300 group-hover:scale-110 shrink-0 relative z-10',
            isActive ? 'fill-black/20 text-black' : isRedaction ? 'text-primary' : '',
          )}
        />

        <span 
          className={cn(
            "font-black text-[11px] uppercase tracking-widest transition-all duration-300 origin-left delay-75 relative z-10",
             collapsed ? "opacity-0 w-0 translate-x-10 absolute" : "opacity-100 w-auto translate-x-0 static",
             isRedaction && !isActive && "text-white group-hover:text-primary transition-colors"
          )}
        >
          {item.name}
        </span>

        {isActive && !collapsed && !isRedaction && (
           <div className="bg-black/20 ml-auto h-1.5 w-1.5 rounded-full shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <>
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-primary text-background p-4 rounded-full shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all outline-none"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'bg-[#050505] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out z-40',
          'fixed inset-y-0 left-0 h-full shadow-[20px_0_50px_rgba(0,0,0,0.5)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0 lg:shadow-none lg:h-screen',
          collapsed ? 'lg:w-[85px]' : 'lg:w-[280px]'
        )}
      >
        <div className={cn(
          "flex h-20 items-center px-6 shrink-0 transition-all duration-300 overflow-hidden whitespace-nowrap",
          collapsed ? "lg:justify-center" : "justify-between"
        )}>
          <div className={cn(
            "transition-all duration-500 overflow-hidden whitespace-nowrap flex items-center gap-2",
            collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}>
             <Image 
               src="/logo.png" 
               alt="RR-ONDA Logo" 
               width={140} 
               height={40} 
               className="object-contain h-10 w-auto"
               priority
             />
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex hover:bg-white/5 text-white/40 rounded-xl p-2.5 transition-all hover:text-white border border-transparent hover:border-white/10"
          >
            <Menu size={20} />
          </button>
          
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden hover:bg-white/5 text-white/40 rounded-xl p-2 transition-all hover:text-white ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden scrollbar-custom space-y-8">
          {/* GRUPO 1: EXPLORACIÓN */}
          <div>
            <div className={cn(
              "mb-4 px-4 flex items-center gap-2",
              collapsed ? "justify-center" : ""
            )}>
              <div className="h-px bg-white/5 flex-1" />
              {!collapsed && <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Navegación</span>}
              <div className="h-px bg-white/5 flex-1" />
            </div>
            {mainNav.map(renderLink)}
          </div>

          {/* GRUPO 2: PRODUCCIÓN (DESTACADO) */}
          <div className="space-y-2">
            <div className={cn(
              "mb-4 px-4 flex items-center gap-2",
              collapsed ? "justify-center" : ""
            )}>
              <div className="h-px bg-primary/20 flex-1" />
              {!collapsed && (
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                  Estudio & Lab
                </span>
              )}
              <div className="h-px bg-primary/20 flex-1" />
            </div>
            {labNav.map(renderLink)}
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 mt-auto shrink-0 space-y-1">
          {isAdmin && (
            <Link
              href="/director"
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-300 relative overflow-hidden whitespace-nowrap mb-1 border border-transparent',
                pathname === '/director'
                  ? 'bg-primary text-black shadow-[0_0_25px_rgba(202,251,72,0.4)] border-primary/50'
                  : 'bg-gradient-to-r from-yellow-500/10 to-transparent text-white/50 hover:text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/10 hover:border-yellow-500/30',
                collapsed && 'justify-center px-0 mx-2'
              )}
            >
              <Shield size={22} className={cn("shrink-0 relative z-10 transition-colors", pathname === '/director' ? "text-black" : "text-yellow-500/60 group-hover:text-yellow-500")} />
              {!collapsed && (
                <span className="font-black text-[11px] uppercase tracking-widest relative z-10 transition-all">
                  Consola Director
                </span>
              )}
            </Link>
          )}

          <button
            className={cn(
              'text-white/40 hover:bg-white/5 flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:text-white relative overflow-hidden whitespace-nowrap',
              collapsed ? 'justify-center' : '',
            )}
          >
            <Settings size={22} className="shrink-0" />
            <span className={cn(
               "text-[11px] font-black uppercase tracking-widest transition-all duration-300",
               collapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
            )}>
              Calibración
            </span>
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'text-white/20 hover:bg-red-500/10 flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all hover:text-red-500 relative overflow-hidden whitespace-nowrap group',
              collapsed ? 'justify-center' : '',
            )}
          >
            <LogOut size={22} className="shrink-0 transition-transform group-hover:scale-110" />
            <span className={cn(
               "text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300",
               collapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
            )}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
