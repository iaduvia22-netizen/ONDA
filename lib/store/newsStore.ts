import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NewsArticle } from '@/lib/api/types';
import { useNotificationStore } from './notificationStore';

interface NewsState {
  articles: NewsArticle[];
  trending: NewsArticle[];
  saved: NewsArticle[];
  redactionArticles: NewsArticle[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;
  _hasHydrated: boolean; // Flag para manejar hidratación en Next.js

  setArticles: (articles: NewsArticle[]) => void;
  setTrending: (trending: NewsArticle[]) => void;
  setHasHydrated: (state: boolean) => void;
  
  // Gestión de Noticias
  removeArticle: (articleId: string) => void;
  
  // Guardados
  addToSaved: (article: NewsArticle) => void;
  removeFromSaved: (articleId: string) => void;
  
  // Centro de Redacción
  sendToRedaction: (article: NewsArticle) => void;
  removeFromRedaction: (articleId: string) => void;
  clearRedaction: () => void;

  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  
  // Publicación
  publishArticle: (article: NewsArticle, report: string, transmedia: string, analyst?: { name: string; image: string }) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      articles: [],
      trending: [],
      saved: [],
      redactionArticles: [],
      isLoading: false,
      searchQuery: '',
      selectedCategory: 'general',
      _hasHydrated: false,

      setArticles: (articles) => set({ articles }),
      setTrending: (trending) => set({ trending }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      removeArticle: (id) => set((state) => ({
        articles: state.articles.filter(a => (a.id !== id && a.url !== id))
      })),
      
      addToSaved: (article) => set((state) => {
        const articleUrl = article.url || article.id;
        const exists = state.saved.find(a => (a.url === articleUrl || a.id === articleUrl));
        if (exists) return state;
        return { saved: [...state.saved, article] };
      }),
      removeFromSaved: (id) => set((state) => ({
        saved: state.saved.filter(a => (a.id !== id && a.url !== id))
      })),

      sendToRedaction: (article) => set((state) => {
        const articleUrl = article.url || article.id;
        if (!articleUrl) return state;
        const exists = state.redactionArticles.find(a => (a.url === articleUrl || a.id === articleUrl));
        if (exists) return state;
        return { redactionArticles: [...state.redactionArticles, article] };
      }),
      removeFromRedaction: (id) => set((state) => ({
        redactionArticles: state.redactionArticles.filter(a => (a.id !== id && a.url !== id))
      })),
      clearRedaction: () => set({ redactionArticles: [] }),

      setLoading: (loading) => set({ isLoading: loading }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      publishArticle: (article, report, transmedia, analyst) => set((state) => {
        const publishedDate = new Date().toISOString();
        const fullArticle = { 
          ...article, 
          investigationReport: report, 
          transmediaPack: transmedia,
          publishedDate,
          analystName: analyst?.name,
          analystImage: analyst?.image
        };
        
        // Agregar a guardados (Biblioteca)
        const saved = [...state.saved, fullArticle];
        
        // Quitar de Redacción
        const redactionArticles = state.redactionArticles.filter(a => a.id !== article.id && a.url !== article.url);
        
        // Disparar Notificación de Sistema
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          title: 'Publicación Exitosa',
          message: `"${article.title}" se ha archivado formalmente en la Biblioteca.`,
          type: 'success'
        });

        return { saved, redactionArticles };
      })
    }),
    {
      name: 'news-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ 
        saved: state.saved,
        redactionArticles: state.redactionArticles
      }),
    }
  )
);
