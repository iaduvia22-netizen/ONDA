import { getActiveKey, rotateKey } from '@/lib/vault';
import { NewsArticle } from '@/lib/api/types';

const BASE_URL = 'https://newsdata.io/api/1/latest';

/**
 * MOTOR DE NOTICIAS ONDA v6.1 (TIPADO UNIFICADO)
 */
export async function fetchNewsAction(category?: string, query?: string, countryCode?: string): Promise<NewsArticle[]> {
  let attempts = 0;
  const maxAttempts = 5;

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
        console.log(`[ONDA-NEWS] ✅ Éxito: ${data.results.length} noticias.`);
        
        // Mapeo al tipo oficial NewsArticle
        return data.results.map((r: any) => ({
          id: r.article_id || r.link,
          title: r.title,
          description: r.description || r.snippet || "Sin descripción disponible.",
          content: r.content || r.description || "Contenido no disponible.",
          url: r.link,
          image: r.image_url || r.video_url || undefined,
          publishedAt: r.pubDate || new Date().toISOString(),
          source: {
            name: r.source_id || "Fuente Desconocida",
            url: r.link
          },
          category: r.category?.[0] || "general",
          country: r.country?.[0] || "colombia"
        }));
      }

      console.warn(`[ONDA-NEWS] ⚠️ Canal Saturado (${res.status})`);
      rotateKey('NEWSDATA');
      attempts++;

    } catch (error: any) {
      console.error(`[ONDA-NEWS] ❌ Error de Red: Rotando canal...`);
      rotateKey('NEWSDATA');
      attempts++;
    }
  }

  // 🛰️ PROTOCOLO BYPASS OSINT
  console.error('[ONDA-NEWS] 🚨 BYPASS OSINT activado...');
  try {
     const tavilyKey = getActiveKey('TAVILY');
     const osintRes = await fetch('https://api.tavily.com/search', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         api_key: tavilyKey,
         query: query || "noticias hoy colombia impacto ciudadano",
         search_depth: 'advanced',
         max_results: 8
       })
     });
     const osintData = await osintRes.json();
     if (osintData.results) {
        return osintData.results.map((r: any) => ({
           id: r.url,
           title: r.title,
           description: r.content.substring(0, 200),
           content: r.content,
           url: r.url,
           image: undefined,
           publishedAt: new Date().toISOString(),
           source: { name: 'OSINT RADAR', url: r.url },
           category: 'osint'
        }));
     }
  } catch (e) {
     console.error('[ONDA-NEWS] 💀 Fallo total.');
  }

  return [];
}
