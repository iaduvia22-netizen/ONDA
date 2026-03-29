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
}

const BASE_URL = 'https://newsdata.io/api/1/latest';

/**
 * MOTOR DE NOTICIAS ONDA v3 (ROBUSTEZ LOCAL)
 * Incluye auto-rotación de llaves y re-intentos automáticos.
 */
export async function fetchNewsAction(category?: string, query?: string, countryCode?: string): Promise<NewsArticle[]> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const key = getActiveKey('NEWSDATA');
    const params = new URLSearchParams();
    params.append('apikey', key);
    params.append('language', 'es');
    params.append('size', '10');

    if (countryCode) params.append('country', countryCode);
    if (category) params.append('category', category);
    if (query) params.append('q', query);

    try {
      console.log(`[ONDA-NEWS] Intento ${attempts + 1} usando canal: ${key.substring(0, 8)}...`);
      
      const res = await fetch(`${BASE_URL}?${params.toString()}`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(6000) // 6s de timeout por intento
      });

      const data = await res.json();

      if (data.status === 'success' && data.results) {
        console.log(`[ONDA-NEWS] ✅ Éxito: ${data.results.length} noticias capturadas.`);
        return data.results;
      }

      // Si llegamos aquí, la API respondió pero con error (ej. límite de cuota 429)
      console.warn(`[ONDA-NEWS] ⚠️ API reportó anomalía: ${data.message || 'Error desconocido'}`);
      rotateKey('NEWSDATA');
      attempts++;

    } catch (error) {
      console.error(`[ONDA-NEWS] ❌ Fallo de conexión en intento ${attempts + 1}`);
      rotateKey('NEWSDATA');
      attempts++;
    }
  }

  console.error('[ONDA-NEWS] 🚨 Todos los canales de noticias están saturados o inactivos.');
  return [];
}
