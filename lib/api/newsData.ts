import { NewsArticle, NewsFilter, NewsProvider } from './types';

const API_KEY = process.env.NEWSDATA_API_KEY;
const BASE_URL = 'https://newsdata.io/api/1/news';

export class NewsDataProvider implements NewsProvider {
  name = 'NewsData.io';

  private async fetchFromApi(params: URLSearchParams): Promise<NewsArticle[]> {
    if (!API_KEY) {
      console.warn('NewsData API Key missing');
      return [];
    }

    try {
      params.append('apikey', API_KEY);
      const res = await fetch(`${BASE_URL}?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`NewsData API error: ${res.status}`);
      }

      const data = await res.json();

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
      console.error('Error fetching from NewsData:', error);
      return [];
    }
  }

  async getTopHeadlines(filter: NewsFilter): Promise<NewsArticle[]> {
    const params = new URLSearchParams();
    if (filter.country) params.append('country', filter.country);
    if (filter.category) params.append('category', filter.category);
    // NewsData usa 'language' en lugar de detectar por pais a veces, forzamos español
    params.append('language', 'es');

    return this.fetchFromApi(params);
  }

  async searchNews(filter: NewsFilter): Promise<NewsArticle[]> {
    const params = new URLSearchParams();
    if (filter.query) params.append('q', filter.query);
    params.append('language', 'es');

    return this.fetchFromApi(params);
  }
}
