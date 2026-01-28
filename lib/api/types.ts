export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
  category?: string;
  country?: string;
  score?: number; 
  investigationReport?: string;
  transmediaPack?: string;
  publishedDate?: string; 
  analystName?: string;
  analystImage?: string;
}

export interface NewsFilter {
  query?: string;
  category?: string;
  country?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface NewsProvider {
  name: string;
  getTopHeadlines(filter: NewsFilter): Promise<NewsArticle[]>;
  searchNews(filter: NewsFilter): Promise<NewsArticle[]>;
}

export const NEWS_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'business', label: 'Negocios' },
  { id: 'technology', label: 'Tecnología' },
  { id: 'science', label: 'Ciencia' },
  { id: 'health', label: 'Salud' },
  { id: 'sports', label: 'Deportes' },
  { id: 'entertainment', label: 'Entretenimiento' },
];
