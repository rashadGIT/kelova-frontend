'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useMessagingStore } from '@/lib/store/messaging.store';
import type { MessageRecord } from '@/lib/api/messaging';

function getCognitoAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const sub = localStorage.getItem(
    `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`,
  );
  if (!sub) return null;
  return localStorage.getItem(
    `CognitoIdentityServiceProvider.${clientId}.${sub}.accessToken`,
  );
}

// Singleton socket ref shared across all hook instances in the same React tree.
// This prevents a second socket being created when the page also calls this hook.
let globalSocket: Socket | null = null;

export function useMessagingSocket(userId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();
  const { incrementUnread } = useMessagingStore();

  useEffect(() => {
    if (!userId) return;
    // Reuse the existing connection if already established
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      return;
    }

    const token = getCognitoAccessToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    const socket = io(`${apiBase}/messaging`, {
      auth: { token: token ?? '' },
      withCredentials: true,
      transports: ['websocket'],
    });

    globalSocket = socket;
    socketRef.current = socket;

    socket.on('message:new', (message: MessageRecord) => {
      qc.setQueryData<MessageRecord[]>(
        ['messages', message.conversationId],
        (old) => {
          if (!old) return [message];
          if (old.some((m) => m.id === message.id)) return old; // deduplicate
          return [message, ...old];
        },
      );
      void qc.invalidateQueries({ queryKey: ['conversations'] });

      const { activeConversationId } = useMessagingStore.getState();
      if (message.conversationId !== activeConversationId) {
        incrementUnread(message.conversationId);
      }
    });

    socket.on('conversation:new', () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('message:read', () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[messaging socket] connect error', err.message);
    });

    socket.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[messaging socket] connected', socket.id);
    });

    return () => {
      // Only disconnect if this is the owner (MessagingProvider, not the page)
      // The page component unmounts more frequently; we keep the socket alive
      // as long as the provider is mounted.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function sendMessage(conversationId: string, body: string) {
    const sock = socketRef.current ?? globalSocket;
    if (!sock?.connected) {
      // eslint-disable-next-line no-console
      console.warn('[messaging socket] not connected — cannot send');
      return;
    }
    sock.emit('message:send', { conversationId, body });
  }

  function sendReadReceipt(conversationId: string) {
    const sock = socketRef.current ?? globalSocket;
    sock?.emit('message:read', { conversationId });
  }

  return { sendMessage, sendReadReceipt };
}

export function disconnectMessagingSocket() {
  globalSocket?.disconnect();
  globalSocket = null;
}
