import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
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
  title: {
    default: 'RR-ONDA | Dashboard de Inteligencia de Noticias',
    template: '%s | RR-ONDA'
  },
  description: 'Plataforma avanzada de automatización y análisis de noticias globales en tiempo real impulsada por IA local.',
  keywords: ['News Automation', 'AI Dashboard Colombia', 'Viral News Tracking', 'Real-time Analysis', 'Ollama Integration', 'Inteligencia de Noticias'],
  authors: [{ name: 'Antigravity' }],
  openGraph: {
    title: 'RR-ONDA | News Automation Intelligence',
    description: 'Sincronización total con el flujo informativo mundial.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased selection:bg-primary/30`}>
        <AuthProvider>
          <Toaster position="top-center" expand={false} richColors theme="dark" />
          <div className="flex h-screen w-full bg-background transition-all duration-300 ease-in-out">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out relative w-full">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-custom w-full max-w-full">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
