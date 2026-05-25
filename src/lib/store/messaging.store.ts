import { create } from 'zustand';

interface MessagingState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  onlineUserIds: Set<string>;

  setActiveConversation: (id: string | null) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  totalUnread: () => number;
}

export const useMessagingStore = create<MessagingState>()((set, get) => ({
  activeConversationId: null,
  unreadCounts: {},
  onlineUserIds: new Set(),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setUnreadCounts: (counts) => set({ unreadCounts: counts }),

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  setUserOnline: (userId) =>
    set((state) => ({
      onlineUserIds: new Set([...state.onlineUserIds, userId]),
    })),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    }),

  totalUnread: () =>
    Object.values(get().unreadCounts).reduce((sum, n) => sum + n, 0),
}));
