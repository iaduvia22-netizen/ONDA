'use server';

import { NewsArticle } from '@/lib/api/types';
import { getActiveKey } from '@/lib/vault';

const BASE_URL = 'https://newsdata.io/api/1/latest';

export async function fetchNewsAction(category?: string, query?: string, countryCode?: string): Promise<NewsArticle[]> {
  const API_KEY = await getActiveKey('NEWSDATA');

  if (!API_KEY) {
    console.warn('⚠️ NewsData API Key no configurada.');
    return [];
  }

  console.log(`📡 [ONDA] Fetching news… Category: ${category || 'ALL'}, Query: ${query || 'NONE'}`);

  const params = new URLSearchParams();
  params.append('apikey', API_KEY);
  params.append('language', 'es');

  if (countryCode) {
    params.append('country', countryCode);
  } else if (query) {
    params.append('q', query);
  }

  if (category && category !== 'general') {
    params.append('category', category);
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, { cache: 'no-store' });

    if (!res.ok) {
      const body = await res.text();
      console.error(`❌ API Error ${res.status}:`, body);
      throw new Error(`Error API: ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'success' || !data.results) {
      console.warn('⚠️ API sin resultados:', data.status);
      return [];
    }

    let results: NewsApiItem[] = data.results;

    // Filtro local si se pidió país + query simultáneamente
    if (countryCode && query) {
      const terms = query.split(' OR ').map((t: string) => t.trim().toLowerCase());
      const isBroad = terms.includes('colombia') || terms.includes('colombia nacional');
      if (!isBroad) {
        results = results.filter((item) => {
          const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
          return terms.some((term: string) => text.includes(term));
        });
      }
    }

    console.log(`✅ [ONDA] ${results.length} noticias recibidas`);

    return results.map((item) => ({
      id: item.article_id,
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      url: item.link,
      image: item.image_url,
      publishedAt: item.pubDate,
      source: { name: item.source_id, url: item.source_url },
      category: item.category?.[0],
      country: item.country?.[0],
    }));

  } catch (error) {
    console.error('❌ [ONDA] Error fetching news:', error);
    return [];
  }
}

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
