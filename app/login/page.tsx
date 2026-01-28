'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Newspaper, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales no válidas. Acceso denegado a la Onda.");
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError("Error en los sistemas de autenticación.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
      {/* Globo sutil de fondo para coherencia visual */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/20 rounded-full animate-[pulse_10s_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-6 relative">
              <Image 
                src="/logo.png" 
                alt="RR-ONDA Logo" 
                fill 
                className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                priority
              />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">RR-ONDA</h1>
            <p className="text-text-muted text-sm mt-1 uppercase tracking-widest font-semibold">Terminal de Acceso</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">ID de Analista</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="analista@onda.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Clave de Encriptación</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full bg-primary hover:bg-primary-light text-background font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all group",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? "Validando Señal..." : "Sincronizar Acceso"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-text-dim text-xs font-medium">Uso restringido a personal autorizado de RR-ONDA Intelligence.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
