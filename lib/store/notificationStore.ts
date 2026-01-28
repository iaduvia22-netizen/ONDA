import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  triggerDailyReport: (libraryCount: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (n) => set((state) => ({
        notifications: [
          {
            ...n,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            read: false
          },
          ...state.notifications
        ].slice(0, 50) // Limitar a las últimas 50
      })),

      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      clearAll: () => set({ notifications: [] }),

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      triggerDailyReport: (libraryCount: number) => {
        const { addNotification } = (useNotificationStore.getState() as any);
        addNotification({
          title: 'Reporte de Ciclo Onda',
          message: `El sistema está operativo. Tienes ${libraryCount} dossiers archivados en la Biblioteca. La red de nodos global está lista para exploración.`,
          type: 'info'
        });
      }
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
