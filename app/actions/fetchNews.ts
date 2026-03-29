import { getActiveKey, rotateKey } from '@/lib/vault';

export interface NewsArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source_id: string;
  image_url?: string;
  category: string[];
  snippet?: string;
  investigationReport?: string; // Cacheado opcional
}

const BASE_URL = 'https://newsdata.io/api/1/latest';

export async function fetchNewsAction(category?: string, query?: string, countryCode?: string): Promise<NewsArticle[]> {
  let attempts = 0;
  const maxAttempts = 5; // Más intentos para cubrir la super-bóveda

  while (attempts < maxAttempts) {
    const key = getActiveKey('NEWSDATA');
    const params = new URLSearchParams();
    params.append('apikey', key);
    params.append('language', 'es');
    params.append('size', '15');

    if (countryCode) params.append('country', countryCode);
    if (category) params.append('category', category);
    if (query) params.append('q', query);

    try {
      console.log(`[ONDA-NEWS] 📡 Escaneando Canal ${key.substring(0, 8)}... (Intento ${attempts + 1})`);
      
      const res = await fetch(`${BASE_URL}?${params.toString()}`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(6000)
      });

      const data = await res.json();

      if (data.status === 'success' && data.results && data.results.length > 0) {
        console.log(`[ONDA-NEWS] ✅ Éxito: ${data.results.length} noticias. Canal verificado.`);
        return data.results;
      }

      // 🚨 Diagnóstico Profundo
      const errorMsg = data.results?.message || data.message || "Error Desconocido";
      console.warn(`[ONDA-NEWS] ⚠️ Canal Saturado o Bloqueado (${res.status}): ${errorMsg}`);
      rotateKey('NEWSDATA');
      attempts++;

    } catch (error: any) {
       // Si es un timeout o error de red local
      console.error(`[ONDA-NEWS] ❌ Error de Red Local (${error.name}): Rotando canal...`);
      rotateKey('NEWSDATA');
      attempts++;
    }
  }

  // 🛰️ PROTOCOLO BYPASS OSINT (Respaldo Extremo)
  console.error('[ONDA-NEWS] 🚨 Todos los canales NewsData saturados. Iniciando BYPASS OSINT...');
  try {
     const tavilyKey = getActiveKey('TAVILY');
     const osintRes = await fetch('https://api.tavily.com/search', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         api_key: tavilyKey,
         query: query || "noticias hoy colombia impacto ciudadano",
         search_depth: 'advanced',
         max_results: 5
       })
     });
     const osintData = await osintRes.json();
     if (osintData.results) {
        console.log(`[ONDA-NEWS] 🛡️ Éxito en BYPASS OSINT: ${osintData.results.length} noticias recuperadas.`);
        return osintData.results.map((r: any) => ({
           title: r.title,
           link: r.url,
           description: r.content,
           pubDate: new Date().toISOString(),
           source_id: 'OSINT_RADAR',
           category: ['OSINT'],
           snippet: r.content.substring(0, 160)
        }));
     }
  } catch (e) {
     console.error('[ONDA-NEWS] 💀 El sistema informativo colapsó totalmente.');
  }

  return [];
}
