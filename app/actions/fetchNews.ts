'use server';

import { NewsArticle } from '@/lib/api/types';

const API_KEY = process.env.NEWSDATA_API_KEY;
const BASE_URL = 'https://newsdata.io/api/1/news';

export async function fetchNewsAction(category?: string, query?: string): Promise<NewsArticle[]> {
  if (!API_KEY) {
    console.warn('⚠️ API Key no encontrada en el servidor (process.env.NEWSDATA_API_KEY is undefined)');
    return [];
  }

  console.log(`📡 Fetching news... Category: ${category || 'ALL'}, Query: ${query || 'NONE'}`);

  const params = new URLSearchParams();
  params.append('apikey', API_KEY);
  params.append('language', 'es'); // Forzamos español
  
  // Prioridad: 1. Busqueda, 2. Categoria, 3. Defecto (Colombia)
  if (query) {
    params.append('q', query);
  } else if (category && category !== 'general') {
    params.append('category', category);
  } else {
    params.append('country', 'co');
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        next: { revalidate: 3600 } // Cache por 1 hora para ahorrar créditos
    });

    if (!res.ok) {
        throw new Error(`Error API: ${res.status}`);
    }

      const data = await res.json();

      if (!data.results) return [];

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

      return data.results.map((item: NewsApiItem) => ({
        id: item.article_id,
        title: item.title,
        description: item.description,
        content: item.content,
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
    console.error('Error fetching news:', error);
    return [];
  }
}
