import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RR-ONDA | News Intelligence',
  description: 'Plataforma avanzada de análisis de noticias.',
  icons: { icon: '/logo.png' },
};

/**
 * ROOT LAYOUT v7 (ANTI-PANTALLA BLANCA)
 * Optimizada para no bloquearse por errores de hidratación o sesión.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} bg-[#050505] text-white antialiased`}>
        <AuthProvider>
          <Toaster position="top-center" richColors theme="dark" />
          <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar con protección de carga */}
            <aside className="hidden lg:block shrink-0">
               <Sidebar />
            </aside>
            
            <div className="flex flex-1 flex-col overflow-hidden relative">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-custom">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
