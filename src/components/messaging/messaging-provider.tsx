'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useMessagingStore } from '@/lib/store/messaging.store';
import { useMessagingSocket, disconnectMessagingSocket } from '@/hooks/use-messaging-socket';
import { getUnreadCounts } from '@/lib/api/messaging';

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setUnreadCounts = useMessagingStore((s) => s.setUnreadCounts);

  // Owns the single global socket — all other callers of useMessagingSocket reuse it
  useMessagingSocket(user?.id);

  // Disconnect when provider unmounts (logout / full page unload)
  useEffect(() => {
    return () => {
      disconnectMessagingSocket();
    };
  }, []);

  // Load initial unread counts on mount
  useEffect(() => {
    if (!user) return;
    getUnreadCounts()
      .then(setUnreadCounts)
      .catch(() => {});
  }, [user, setUnreadCounts]);

  return <>{children}</>;
}
