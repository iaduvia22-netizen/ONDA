'use server';

import { NewsArticle } from '@/lib/api/types';

const API_KEY = "pub_839fcc38918945318990904e0be82253";
const BASE_URL = 'https://newsdata.io/api/1/latest';

export async function fetchNewsAction(category?: string, query?: string, countryCode?: string): Promise<NewsArticle[]> {
  if (!API_KEY) {
    console.warn('⚠️ API Key no encontrada en el servidor (process.env.NEWSDATA_API_KEY is undefined)');
    return [];
  }

  console.log(`📡 [ONDA] Fetching LATEST news... Category: ${category || 'ALL'}, Query: ${query || 'NONE'}`);

  const params = new URLSearchParams();
  params.append('apikey', API_KEY);
  params.append('language', 'es');
  
  // 1. LIMITACIONES DE CAPA GRATUITA DE NEWSDATA.IO:
  // No permiten usar "country" y "q" a la vez. 
  // Por tanto, si nos piden país (Sonda Regional), extraemos todo CO y filtramos localmente.
  // Si no nos piden país (Flujo de Onda/Global), inyectamos "q" directamente al ruteo de red.

  if (countryCode) {
    // Modo: Sonda Regional Estricta
    params.append('country', countryCode);
  } else if (query) {
    // Modo: Búsqueda Global 
    params.append('q', query);
  }
  
  // 2. Aplicamos Categoría si existe
  if (category && category !== 'general') {
    params.append('category', category);
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      cache: 'no-store', // Siempre datos frescos, sin caché
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ API Error ${res.status}:`, errorBody);
      throw new Error(`Error API: ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'success' || !data.results) {
      console.warn('⚠️ API response sin resultados:', data.status);
      return [];
    }

    let results = data.results;

    // 3. FILTRO INTERNO (PROGRAMÁTICO): Si pedimos un país estricto, 
    // filtramos la búsqueda de forma local porque NewsData prohíbe usar 'q' a la vez.
    if (countryCode && query) {
      const terms = query.split(' OR ').map(t => t.trim().toLowerCase());
      
      const isBroadQuery = terms.includes('colombia') || terms.includes('colombia nacional');
      
      if (!isBroadQuery) {
        results = results.filter((item: any) => {
          const textToSearch = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
          return terms.some(term => textToSearch.includes(term));
        });
      }
    }

    console.log(`✅ [ONDA] ${results.length} noticias listas recibidas (De ${data.totalResults} disponibles)`);

    interface NewsApiItem {
      article_id: string;
      title: string;
      description: string;
      content: string;
      link: string;
      image_url: string;
      pubDate: string;
      source_id: string;
      source_url: string;
      category?: string[];
      country?: string[];
    }

    // RETORNAMOS la variable filtrada localmente 'results', no el 'data.results'
    return results.map((item: NewsApiItem) => ({
      id: item.article_id,
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      url: item.link,
      image: item.image_url,
      publishedAt: item.pubDate,
      source: {
        name: item.source_id,
        url: item.source_url,
      },
      category: item.category?.[0],
      country: item.country?.[0],
    }));

  } catch (error) {
    console.error('❌ [ONDA] Error fetching news:', error);
    return [];
  }
}
